"use strict"

/**
 * Created by modun on 14/12/10.
 */

var ShortId = require("shortid")
var Promise = require("bluebird")
var _ = require("underscore")

var Utils = require("../utils/utils")
var DataUtils = require("../utils/dataUtils")
var LogicUtils = require("../utils/logicUtils")
var TaskUtils = require("../utils/taskUtils")
var ErrorUtils = require("../utils/errorUtils")
var ReportUtils = require('../utils/reportUtils')
var GameDatas = require("../datas/GameDatas");
var Events = require("../consts/events")
var Consts = require("../consts/consts")
var Define = require("../consts/define")


var AllianceApiService2 = function(app){
	this.app = app
	this.env = app.get("env")
	this.pushService = app.get("pushService")
	this.timeEventService = app.get("timeEventService")
	this.playerTimeEventService = app.get("playerTimeEventService")
	this.allianceTimeEventService = app.get("allianceTimeEventService")
	this.dataService = app.get("dataService")
	this.cacheService = app.get('cacheService');
	this.activityService = app.get('activityService');
	this.logService = app.get("logService")
	this.GemChange = app.get("GemChange")
	this.cacheServerId = app.getServerId();
}
module.exports = AllianceApiService2
var pro = AllianceApiService2.prototype


/**
 * 退出联盟
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.quitAlliance = function(playerId, allianceId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var updateFuncs = []
	var eventFuncs = []
	var pushFuncs = []
	var playerObject = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))
		playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(_.isEqual(playerObject.title, Consts.AllianceTitle.Archon) && allianceDoc.members.length > 1){
			return Promise.reject(ErrorUtils.allianceArchonCanNotQuitAlliance(playerId, allianceDoc._id))
		}
		if(!DataUtils.isMemberCanQuitAlliance(playerObject)){
			return Promise.reject(ErrorUtils.canNotQuitAllianceNow(playerId, allianceId));
		}

		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		_.each(playerDoc.helpToTroops, function(helpToTroop){
			lockPairs.push({key:Consts.Pairs.Player, value:helpToTroop.id});
		})
		if(!!playerDoc.helpedByTroop){
			var alreadyLocked = _.some(playerDoc.helpToTroops, function(helpToTroop){
				return helpToTroop.id === playerDoc.helpedByTroop.id;
			})
			if(!alreadyLocked) lockPairs.push({key:Consts.Pairs.Player, value:playerDoc.helpedByTroop.id});
		}
		var villageEvents = _.filter(allianceDoc.villageEvents, function(event){
			return event.playerData.id === playerDoc._id;
		})
		var otherAllianceIds = [];
		_.each(villageEvents, function(event){
			if(event.toAlliance.id !== allianceDoc._id && !_.contains(otherAllianceIds, event.toAlliance.id)){
				lockPairs.push({
					key:Consts.Pairs.Alliance,
					value:event.toAlliance.id
				});
				otherAllianceIds.push(event.toAlliance.id);
			}
		})
	}).then(function(){
		allianceData.push(["members." + allianceDoc.members.indexOf(playerObject), null])
		LogicUtils.removeItemInArray(allianceDoc.members, playerObject)
		var playerMapObject = LogicUtils.getAllianceMapObjectById(allianceDoc, playerObject.mapId)
		allianceData.push(["mapObjects." + allianceDoc.mapObjects.indexOf(playerMapObject), null])
		LogicUtils.removeItemInArray(allianceDoc.mapObjects, playerMapObject)
		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.Normal, Consts.AllianceEventType.Quit, playerObject.name, [])
		DataUtils.refreshAllianceBasicInfo(allianceDoc, allianceData)

		_.each(self.activityService.allianceActivities.on, function(serverActivity){
			var playerActivity = playerDoc.allianceActivities[serverActivity.type];
			if(playerActivity.finishTime !== serverActivity.finishTime){
				playerActivity.finishTime = serverActivity.finishTime;
				playerActivity.scoreRewardedIndex = 0;
			}
			playerActivity.rankRewardsGeted = true;
			playerData.push(['allianceActivities.' + serverActivity.type, playerActivity])
		})
		_.each(self.activityService.allianceActivities.expired, function(serverActivity){
			var playerActivity = playerDoc.allianceActivities[serverActivity.type];
			var finishTime = serverActivity.removeTime - (GameDatas.ScheduleActivities.allianceType[serverActivity.type].expireHours * 60 * 60 * 1000);
			if(playerActivity.finishTime !== finishTime){
				playerActivity.finishTime = finishTime;
				playerActivity.scoreRewardedIndex = 0;
			}
			playerActivity.rankRewardsGeted = true;
			playerData.push(['allianceActivities.' + serverActivity.type, playerActivity])
		})

		playerDoc.allianceId = null
		playerData.push(["allianceId", null])
		DataUtils.refreshPlayerResources(playerDoc)
		playerData.push(["resources", playerDoc.resources])
		LogicUtils.returnPlayerShrineTroops(playerDoc, playerData, allianceDoc, allianceData)
		LogicUtils.returnPlayerMarchTroops(playerDoc, playerData, allianceDoc, allianceData, eventFuncs, pushFuncs, self.timeEventService, self.cacheService);
		LogicUtils.returnPlayerMarchReturnTroops(playerDoc, playerData, allianceDoc, allianceData, updateFuncs, eventFuncs, pushFuncs, self.timeEventService, self.cacheService, self.dataService);
		LogicUtils.removePlayerHelpEvents(playerDoc, allianceDoc, allianceData);

		var returnHelpedByTroop = function(helpedByTroop){
			var helpedByPlayerDoc = null
			var helpedByPlayerData = []
			return self.cacheService.findPlayerAsync(helpedByTroop.id).then(function(doc){
				if(!playerDoc.helpedByTroop) return;
				helpedByPlayerDoc = doc
				LogicUtils.returnPlayerHelpedByTroop(playerDoc, playerData, helpedByPlayerDoc, helpedByPlayerData, updateFuncs, self.dataService)
				pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, helpedByPlayerDoc, helpedByPlayerData])
			})
		}
		var returnHelpToTroop = function(helpToTroop){
			var beHelpedPlayerDoc = null
			var beHelpedPlayerData = []
			return self.cacheService.findPlayerAsync(helpToTroop.id).then(function(doc){
				beHelpedPlayerDoc = doc
				if(playerDoc.helpToTroops.indexOf(helpToTroop) < 0) return;
				DataUtils.refreshPlayerResources(beHelpedPlayerDoc)
				beHelpedPlayerData.push(["resources", beHelpedPlayerData.resources])
				LogicUtils.returnPlayerHelpToTroop(playerDoc, playerData, beHelpedPlayerDoc, beHelpedPlayerData, updateFuncs, self.dataService)
				var memberObject = LogicUtils.getObjectById(allianceDoc.members, beHelpedPlayerDoc._id)
				memberObject.beHelped = false
				allianceData.push(['members.' + allianceDoc.members.indexOf(memberObject) + '.beHelped', memberObject.beHelped])
				pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, beHelpedPlayerDoc, beHelpedPlayerData])
			})
		}
		var returnVillageTroops = function(villageEvent){
			Promise.fromCallback(function(callback){
				if(villageEvent.toAlliance.id === allianceDoc._id){
					return callback(null, allianceDoc);
				}
				return self.cacheService.findAlliance(villageEvent.toAlliance.id, callback);
			}).then(function(doc){
				var targetAllianceDoc = doc;
				var targetAllianceData = [];
				if(allianceDoc.villageEvents.indexOf(villageEvent) < 0) return;
				pushFuncs.push([self.cacheService, self.cacheService.removeVillageEventAsync, villageEvent]);
				allianceData.push(["villageEvents." + allianceDoc.villageEvents.indexOf(villageEvent), null])
				LogicUtils.removeItemInArray(allianceDoc.villageEvents, villageEvent);
				eventFuncs.push([self.timeEventService, self.timeEventService.removeAllianceTimeEventAsync, allianceDoc, "villageEvents", villageEvent.id])

				LogicUtils.removePlayerTroopOut(playerDoc, playerData, villageEvent.playerData.dragon.type);
				DataUtils.refreshPlayerDragonsHp(playerDoc, playerDoc.dragons[villageEvent.playerData.dragon.type]);
				playerDoc.dragons[villageEvent.playerData.dragon.type].status = Consts.DragonStatus.Free
				playerData.push(["dragons." + villageEvent.playerData.dragon.type, playerDoc.dragons[villageEvent.playerData.dragon.type]])
				LogicUtils.addPlayerSoldiers(playerDoc, playerData, villageEvent.playerData.soldiers)
				DataUtils.addPlayerWoundedSoldiers(playerDoc, playerData, villageEvent.playerData.woundedSoldiers)
				var resourceCollected = Math.floor(villageEvent.villageData.collectTotal * ((Date.now() - villageEvent.startTime) / (villageEvent.finishTime - villageEvent.startTime)))
				var village = LogicUtils.getAllianceVillageById(targetAllianceDoc, villageEvent.villageData.id)
				village.villageEvent = null;
				targetAllianceData.push(["villages." + targetAllianceDoc.villages.indexOf(village) + ".villageEvent", village.villageEvent])
				var originalRewards = villageEvent.playerData.rewards
				var resourceName = village.name.slice(0, -7)
				var newRewards = [{
					type:"resources",
					name:resourceName,
					count:resourceCollected
				}]
				LogicUtils.mergeRewards(originalRewards, newRewards)
				_.each(originalRewards, function(reward){
					if(_.contains(Consts.BasicResource, reward.name) || reward.name === 'coin'){
						self.activityService.addPlayerActivityScore(playerDoc, playerData, 'collectResource', 'collectOne_' + reward.name, reward.count);
					}else if(reward.name === 'blood'){
						self.activityService.addPlayerActivityScore(playerDoc, playerData, 'collectHeroBlood', 'getOneBlood', reward.count);
					}
				})
				village.resource -= resourceCollected
				targetAllianceData.push(["villages." + targetAllianceDoc.villages.indexOf(village) + ".resource", village.resource])
				var collectReport = ReportUtils.createCollectVillageReport(targetAllianceDoc, village, newRewards)
				pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, playerDoc._id, collectReport])
				pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, targetAllianceDoc, targetAllianceData]);
				updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'quitAlliance', null, originalRewards, false])
			})
		}

		var funcs = [];
		var villageEvents = [].concat(allianceDoc.villageEvents);
		_.each(villageEvents, function(villageEvent){
			if(villageEvent.playerData.id === playerDoc._id){
				funcs.push(returnVillageTroops(villageEvent));
			}
		})
		if(!!playerDoc.helpedByTroop){
			funcs.push(returnHelpedByTroop(playerDoc.helpedByTroop))
		}
		var helpToTroops = [].concat(playerDoc.helpToTroops);
		_.each(helpToTroops, function(helpToTroop){
			funcs.push(returnHelpToTroop(helpToTroop))
		})
		return Promise.all(funcs)
	}).then(function(){
		eventFuncs.push([self.dataService, self.dataService.removePlayerFromAllianceChannelAsync, allianceDoc._id, playerDoc])
		eventFuncs.push([self.cacheService, self.cacheService.removeFromViewedMapIndexChannelAsync, playerDoc._id, playerDoc.logicServerId]);
		eventFuncs.push([self.dataService, self.dataService.updatePlayerSessionAsync, playerDoc, {
			allianceId:"",
			allianceTag:""
		}])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])

		if(allianceDoc.members.length == 0){
			var lockPair = _.find(lockPairs, function(pair){
				return pair.value === allianceDoc._id;
			});
			LogicUtils.removeItemInArray(lockPairs, lockPair);
			eventFuncs.push([self.dataService, self.dataService.destroyAllianceChannelAsync, allianceDoc._id])
			updateFuncs.push([self.cacheService, self.cacheService.deleteAllianceAsync, allianceDoc._id])
			eventFuncs.push([self.timeEventService, self.timeEventService.clearAllianceTimeEventsAsync, allianceDoc])
			pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, allianceDoc.mapIndex, null]);
		}else{
			updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, allianceDoc._id])
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
		}
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback(null, playerData)
	}).then(
		function(){
			if(allianceDoc.members.length > 0) return;
			var villages = _.filter(allianceDoc.villages, function(village){
				return !!village.villageEvent && village.villageEvent.allianceId !== allianceDoc._id;
			})
			var returnEnemyPlayerVillageTroop = function(village){
				var enemyAllianceDoc = null;
				var enemyAllianceData = [];
				var enemyPlayerDoc = null;
				var enemyPlayerData = [];
				var enemyVillageEvent = null;
				var enemyUpdateFuncs = [];
				var enemyEventFuncs = [];
				var enemyPushFuncs = [];
				var lockPairs = [];
				return self.cacheService.findAllianceAsync(village.villageEvent.allianceId).then(function(doc){
					enemyAllianceDoc = doc;
					enemyVillageEvent = LogicUtils.getObjectById(enemyAllianceDoc.villageEvents, village.villageEvent.eventId);
					if(!village.villageEvent) return;
					return self.cacheService.findPlayerAsync(enemyVillageEvent.playerData.id)
				}).then(function(doc){
					if(!village.villageEvent) return;
					enemyPlayerDoc = doc;
					lockPairs.push({key:Consts.Pairs.Alliance, value:enemyAllianceDoc._id});
					lockPairs.push({key:Consts.Pairs.Player, value:enemyPlayerDoc._id});
				}).then(function(){
					enemyPushFuncs.push([self.cacheService, self.cacheService.removeVillageEventAsync, enemyVillageEvent]);
					enemyAllianceData.push(["villageEvents." + enemyAllianceDoc.villageEvents.indexOf(enemyVillageEvent), null])
					LogicUtils.removeItemInArray(enemyAllianceDoc.villageEvents, enemyVillageEvent);
					enemyEventFuncs.push([self.timeEventService, self.timeEventService.removeAllianceTimeEventAsync, enemyAllianceDoc, "villageEvents", enemyVillageEvent.id])

					LogicUtils.removePlayerTroopOut(enemyPlayerDoc, enemyPlayerData, enemyVillageEvent.playerData.dragon.type);
					DataUtils.refreshPlayerDragonsHp(enemyPlayerDoc, enemyPlayerDoc.dragons[enemyVillageEvent.playerData.dragon.type]);
					enemyPlayerDoc.dragons[enemyVillageEvent.playerData.dragon.type].status = Consts.DragonStatus.Free
					enemyPlayerData.push(["dragons." + enemyVillageEvent.playerData.dragon.type, enemyPlayerDoc.dragons[enemyVillageEvent.playerData.dragon.type]])
					LogicUtils.addPlayerSoldiers(enemyPlayerDoc, enemyPlayerData, enemyVillageEvent.playerData.soldiers)
					DataUtils.addPlayerWoundedSoldiers(enemyPlayerDoc, enemyPlayerData, enemyVillageEvent.playerData.woundedSoldiers)

					var resourceCollected = Math.floor(enemyVillageEvent.villageData.collectTotal
						* ((Date.now() - enemyVillageEvent.startTime)
						/ (enemyVillageEvent.finishTime - enemyVillageEvent.startTime))
					)
					var originalRewards = enemyVillageEvent.playerData.rewards
					var resourceName = village.name.slice(0, -7)
					var newRewards = [{
						type:"resources",
						name:resourceName,
						count:resourceCollected
					}]
					LogicUtils.mergeRewards(originalRewards, newRewards)
					_.each(originalRewards, function(reward){
						if(_.contains(Consts.BasicResource, reward.name) || reward.name === 'coin'){
							self.activityService.addPlayerActivityScore(enemyPlayerDoc, enemyPlayerData, 'collectResource', 'collectOne_' + reward.name, reward.count);
							self.activityService.addAllianceActivityScoreByDoc(enemyAllianceDoc, enemyAllianceData, 'collectResource', 'collectOne_' + reward.name, reward.count);
						}else if(reward.name === 'blood'){
							self.activityService.addPlayerActivityScore(enemyPlayerDoc, enemyPlayerData, 'collectHeroBlood', 'getOneBlood', reward.count);
							self.activityService.addAllianceActivityScoreByDoc(enemyAllianceDoc, enemyAllianceData, 'collectHeroBlood', 'getOneBlood', reward.count);
						}
					})
					var collectReport = ReportUtils.createCollectVillageReport(allianceDoc, village, newRewards)
					enemyPushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, enemyPlayerDoc._id, collectReport]);
					enemyPushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, enemyPlayerDoc, enemyPlayerData]);
					enemyPushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, enemyAllianceDoc, enemyAllianceData]);
					enemyUpdateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, enemyPlayerDoc, enemyPlayerData, 'quitAlliance', null, originalRewards, false]);
				}).then(function(){
					return LogicUtils.excuteAll(enemyUpdateFuncs)
				}).then(function(){
					return self.cacheService.touchAllAsync(lockPairs);
				}).then(function(){
					return LogicUtils.excuteAll(enemyEventFuncs)
				}).then(function(){
					return LogicUtils.excuteAll(enemyPushFuncs)
				}).catch(function(e){
					self.logService.onError('cache.allianceApiService5.moveAlliance.returnEnemyPlayerVillageTroop', {
						village:village
					}, e.stack);
				}).finally(function(){
					return Promise.resolve();
				})
			};
			(function returnEnemyData(){
				if(villages.length === 0) return;
				var village = villages.pop();
				returnEnemyPlayerVillageTroop(village).then(returnEnemyData);
			})();
		},
		function(e){
			callback(e)
		}
	)
}

/**
 * 直接加入某联盟
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.joinAllianceDirectly = function(playerId, allianceId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var updateFuncs = []
	var eventFuncs = []
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.allianceNotExist(allianceId))
		allianceDoc = doc
		if(!!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerAlreadyJoinAlliance(playerId, playerId));
		if(!_.isEqual(allianceDoc.basicInfo.joinType, Consts.AllianceJoinType.All)) return Promise.reject(ErrorUtils.allianceDoNotAllowJoinDirectly(playerId, allianceDoc._id))
		if(allianceDoc.members.length >= DataUtils.getAllianceMemberMaxCount(allianceDoc)){
			var e = ErrorUtils.allianceMemberCountReachMax(playerId, allianceDoc._id);
			e.isLegal = true;
			return Promise.reject(e);
		}

		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var mapObjects = allianceDoc.mapObjects
		var memberSizeInMap = DataUtils.getSizeInAllianceMap("member")
		var memberRect = LogicUtils.getFreePointInAllianceMap(allianceDoc, memberSizeInMap.width, memberSizeInMap.height)
		var memberMapObject = LogicUtils.createAllianceMapObject("member", memberRect)
		mapObjects.push(memberMapObject)
		var memberTitle = allianceDoc.members.length > 0 ? Consts.AllianceTitle.Member : Consts.AllianceTitle.Archon;
		var memberObject = LogicUtils.addAllianceMember(allianceDoc, playerDoc, memberTitle, memberMapObject.id, true)
		allianceData.push(["members." + allianceDoc.members.indexOf(memberObject), memberObject])
		allianceData.push(["mapObjects." + allianceDoc.mapObjects.indexOf(memberMapObject), memberMapObject])
		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.Normal, Consts.AllianceEventType.DirectJoin, playerDoc.basicInfo.name, [])
		DataUtils.refreshAllianceBasicInfo(allianceDoc, allianceData)

		playerDoc.allianceId = allianceDoc._id
		playerData.push(["allianceId", playerDoc.allianceId])
		LogicUtils.clearArray(playerDoc.requestToAllianceEvents)
		playerData.push(["requestToAllianceEvents", playerDoc.requestToAllianceEvents])
		LogicUtils.clearArray(playerDoc.inviteToAllianceEvents)
		playerData.push(["inviteToAllianceEvents", playerDoc.inviteToAllianceEvents])

		eventFuncs.push([self.dataService, self.dataService.addPlayerToAllianceChannelAsync, allianceDoc._id, playerDoc])
		eventFuncs.push([self.dataService, self.dataService.updatePlayerSessionAsync, playerDoc, {
			allianceId:allianceDoc._id,
			allianceTag:allianceDoc.basicInfo.tag
		}])
		updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, allianceDoc._id])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedExceptMemberIdAsync, allianceDoc, allianceData, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		var mapData = self.cacheService.getMapDataAtIndex(allianceDoc.mapIndex).mapData;
		var mapIndexData = self.cacheService.getMapIndexs();
		callback(null, [playerData, allianceDoc, mapData, mapIndexData]);
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 申请加入联盟
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.requestToJoinAlliance = function(playerId, allianceId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.allianceNotExist(allianceId))
		allianceDoc = doc
		if(!!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerAlreadyJoinAlliance(playerId, playerId))
		if(playerDoc.requestToAllianceEvents.length >= Define.RequestJoinAllianceMessageMaxSize){
			return Promise.reject(ErrorUtils.joinAllianceRequestIsFull(playerId))
		}
		if(LogicUtils.hasPendingRequestEventToAlliance(playerDoc, allianceId)){
			return Promise.reject(ErrorUtils.joinTheAllianceRequestAlreadySend(playerId, allianceId))
		}
		if(!_.isEqual(allianceDoc.basicInfo.joinType, Consts.AllianceJoinType.Audit)) return Promise.reject(ErrorUtils.theAllianceDoNotNeedRequestToJoin(playerId, allianceId))

		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var requestTime = Date.now()
		var joinRequestEvent = _.find(allianceDoc.joinRequestEvents, function(event){
			return _.isEqual(event.id, playerId)
		})
		if(!joinRequestEvent){
			if(allianceDoc.joinRequestEvents.length >= Define.AllianceRequestMessageMaxSize){
				return Promise.reject(ErrorUtils.allianceJoinRequestMessagesIsFull(playerId, allianceId))
			}
			joinRequestEvent = LogicUtils.addAllianceRequestEvent(allianceDoc, playerDoc, requestTime)
			allianceData.push(["joinRequestEvents." + allianceDoc.joinRequestEvents.indexOf(joinRequestEvent), joinRequestEvent])
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
		}
		var requestToAllianceEvent = LogicUtils.addPlayerJoinAllianceEvent(playerDoc, allianceDoc, requestTime)
		playerData.push(["requestToAllianceEvents." + playerDoc.requestToAllianceEvents.indexOf(requestToAllianceEvent), requestToAllianceEvent])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 取消对某联盟的加入申请
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.cancelJoinAllianceRequest = function(playerId, allianceId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventInPlayer = null;
	var pushFuncs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerAlreadyJoinAlliance(playerId, playerId))
		eventInPlayer = _.find(playerDoc.requestToAllianceEvents, function(event){
			return event.id === allianceId;
		});
		if(!eventInPlayer) return Promise.reject(ErrorUtils.joinAllianceRequestNotExist(playerId, allianceId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		if(playerDoc.requestToAllianceEvents.indexOf(eventInPlayer) < 0) return;
		playerData.push(["requestToAllianceEvents." + playerDoc.requestToAllianceEvents.indexOf(eventInPlayer), null])
		LogicUtils.removeItemInArray(playerDoc.requestToAllianceEvents, eventInPlayer)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 删除加入联盟申请事件
 * @param playerId
 * @param allianceId
 * @param requestEventIds
 * @param callback
 */
pro.removeJoinAllianceReqeusts = function(playerId, allianceId, requestEventIds, callback){
	var self = this
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = [];
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "removeJoinAllianceReqeusts")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "removeJoinAllianceReqeusts"))
		}
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var removeMemberRequest = function(eventInAlliance){
			var memberDoc = null
			var memberData = []
			return self.cacheService.findPlayerAsync(eventInAlliance.id).then(function(doc){
				if(!doc){
					return Promise.resolve();
				}
				memberDoc = doc
				lockPairs.push({key:Consts.Pairs.Player, value:memberDoc._id});
			}).then(function(){
				if(allianceDoc.joinRequestEvents.indexOf(eventInAlliance) < 0) return Promise.resolve();
				allianceData.push(['joinRequestEvents.' + allianceDoc.joinRequestEvents.indexOf(eventInAlliance), null])
				LogicUtils.removeItemInArray(allianceDoc.joinRequestEvents, eventInAlliance);
				if(!memberDoc){
					return Promise.resolve();
				}
				var eventInPlayer = _.find(memberDoc.requestToAllianceEvents, function(event){
					return _.isEqual(event.id, allianceDoc._id)
				})
				if(!eventInPlayer) return Promise.resolve();
				memberData.push(["requestToAllianceEvents." + memberDoc.requestToAllianceEvents.indexOf(eventInPlayer), null])
				LogicUtils.removeItemInArray(memberDoc.requestToAllianceEvents, eventInPlayer)
				return self.pushService.onPlayerDataChangedAsync(memberDoc, memberData).then(function(){
					var allianceName = allianceDoc.basicInfo.name
					var titleKey = DataUtils.getLocalizationConfig("alliance", "RequestRejectedTitle")
					var contentKey = DataUtils.getLocalizationConfig("alliance", "RequestRejectedContent")
					return self.dataService.sendSysMailAsync(memberDoc._id, titleKey, [], contentKey, [allianceName], []);
				})
			}).catch(function(e){
				self.logService.onError("logic.allianceApiService2.removeJoinAllianceReqeusts.removeMemberRequest", {memberId:memberDoc._id}, e.stack)
			});
		};
		return Promise.fromCallback(function(callback){
			(function excuteRemove(){
				if(requestEventIds.length === 0) return callback();
				var eventId = requestEventIds.pop();
				var eventInAlliance = _.find(allianceDoc.joinRequestEvents, function(event){
					return _.isEqual(event.id, eventId)
				})
				if(!eventInAlliance) return excuteRemove();
				return removeMemberRequest(eventInAlliance).then(function(){
					return excuteRemove();
				});
			})();
		})
	}).then(function(){
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs);
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 同意加入联盟申请
 * @param playerId
 * @param allianceId
 * @param requestEventId
 * @param callback
 */
pro.approveJoinAllianceRequest = function(playerId, allianceId, requestEventId, callback){
	var self = this
	var allianceDoc = null
	var allianceData = []
	var requestEvent = null
	var memberDoc = null
	var memberData = []
	var playerObject = null;
	var lockPairs = [];
	var updateFuncs = []
	var eventFuncs = []
	var pushFuncs = []
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		return self.cacheService.findPlayerAsync(requestEventId)
	}).then(function(doc){
		if(!_.isObject(doc)){
			var e = ErrorUtils.playerNotExist(playerId, requestEventId);
			e.isLegal = true;
			return Promise.reject(e)
		}
		memberDoc = doc
		playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "approveJoinAllianceRequest")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "approveJoinAllianceRequest"))
		}
		if(allianceDoc.members.length >= DataUtils.getAllianceMemberMaxCount(allianceDoc)) return Promise.reject(ErrorUtils.allianceMemberCountReachMax(playerId, allianceDoc._id))
		requestEvent = _.find(allianceDoc.joinRequestEvents, function(event){
			return _.isEqual(event.id, requestEventId)
		})
		if(!requestEvent) return Promise.reject(ErrorUtils.joinAllianceRequestNotExist(requestEventId, allianceDoc._id))
		if(!!memberDoc.allianceId){
			var e = ErrorUtils.playerAlreadyJoinAlliance(playerId, memberDoc._id);
			e.isLegal = true;
			return Promise.reject(e);
		}
		var hasPendingRequest = _.some(memberDoc.requestToAllianceEvents, function(event){
			return _.isEqual(event.id, allianceDoc._id)
		})
		if(!hasPendingRequest){
			var e = ErrorUtils.playerCancelTheJoinRequestToTheAlliance(memberDoc._id, allianceDoc._id);
			e.isLegal = true;
			return Promise.reject(e);
		}

		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:memberDoc._id});
	}).then(function(){
		allianceData.push(["joinRequestEvents." + allianceDoc.joinRequestEvents.indexOf(requestEvent), null])
		LogicUtils.removeItemInArray(allianceDoc.joinRequestEvents, requestEvent)

		var memberSizeInMap = DataUtils.getSizeInAllianceMap("member")
		var memberRect = LogicUtils.getFreePointInAllianceMap(allianceDoc, memberSizeInMap.width, memberSizeInMap.height)
		var memberMapObject = LogicUtils.createAllianceMapObject("member", memberRect)
		allianceDoc.mapObjects.push(memberMapObject)
		allianceData.push(["mapObjects." + allianceDoc.mapObjects.indexOf(memberMapObject), memberMapObject])
		var memberTitle = allianceDoc.members.length > 0 ? Consts.AllianceTitle.Member : Consts.AllianceTitle.Archon;
		var memberObject = LogicUtils.addAllianceMember(allianceDoc, memberDoc, memberTitle, memberMapObject.id, !_.isEmpty(memberDoc.logicServerId))
		allianceData.push(["members." + allianceDoc.members.indexOf(memberObject), memberObject])
		DataUtils.refreshAllianceBasicInfo(allianceDoc, allianceData)
		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.Normal, Consts.AllianceEventType.HandleJoin, memberDoc.basicInfo.name, [playerObject.name])

		memberDoc.allianceId = allianceDoc._id
		memberData.push(["allianceId", memberDoc.allianceId])
		LogicUtils.clearArray(memberDoc.requestToAllianceEvents)
		memberData.push(["requestToAllianceEvents", memberDoc.requestToAllianceEvents])
		LogicUtils.clearArray(memberDoc.inviteToAllianceEvents)
		memberData.push(["inviteToAllianceEvents", memberDoc.inviteToAllianceEvents])

		if(!_.isEmpty(memberDoc.logicServerId)){
			eventFuncs.push([self.dataService, self.dataService.addPlayerToAllianceChannelAsync, allianceDoc._id, memberDoc])
			eventFuncs.push([self.dataService, self.dataService.updatePlayerSessionAsync, memberDoc, {
				allianceId:allianceDoc._id,
				allianceTag:allianceDoc.basicInfo.tag
			}])
			var mapData = self.cacheService.getMapDataAtIndex(allianceDoc.mapIndex).mapData;
			var mapIndexData = self.cacheService.getMapIndexs();
			pushFuncs.push([self.pushService, self.pushService.onJoinAllianceSuccessAsync, memberDoc, memberData, allianceDoc, mapData, mapIndexData])
		}
		updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, allianceDoc._id])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, memberDoc._id])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedExceptMemberIdAsync, allianceDoc, allianceData, memberDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).then(
		function(){
			var allianceName = allianceDoc.basicInfo.name
			allianceDoc = null
			var memberId = memberDoc._id
			memberDoc = null
			var titleKey = DataUtils.getLocalizationConfig("alliance", "RequestApprovedTitle")
			var contentKey = DataUtils.getLocalizationConfig("alliance", "RequestApprovedContent")
			self.dataService.sendSysMailAsync(memberId, titleKey, [], contentKey, [allianceName], [])
		},
		function(e){
			callback(e)
		}
	)
}

/**
 * 邀请玩家加入联盟
 * @param playerId
 * @param allianceId
 * @param memberId
 * @param callback
 */
pro.inviteToJoinAlliance = function(playerId, allianceId, memberId, callback){
	var self = this
	var memberDoc = null
	var memberData = []
	var allianceDoc = null
	var lockPairs = [];
	var pushFuncs = []
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		return self.cacheService.findPlayerAsync(memberId)
	}).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.playerNotExist(playerId, memberId))
		memberDoc = doc
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "inviteToJoinAlliance")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "inviteToJoinAlliance"))
		}
		if(_.isString(memberDoc.allianceId)) return Promise.reject(ErrorUtils.playerAlreadyJoinAlliance(playerId, memberId))
		lockPairs.push({key:Consts.Pairs.Player, value:memberDoc._id});
	}).then(function(){
		if(LogicUtils.hasInviteEventToAlliance(memberDoc, allianceDoc)) return Promise.resolve();
		if(memberDoc.inviteToAllianceEvents.length >= Define.InviteJoinAllianceMessageMaxSize){
			var e = ErrorUtils.inviteRequestMessageIsFullForThisPlayer(playerId, allianceDoc._id, memberId);
			e.isLegal = true;
			return Promise.reject(e)
		}
		var inviteTime = Date.now()
		var inviteToAllianceEvent = LogicUtils.addPlayerInviteAllianceEvent(playerId, memberDoc, allianceDoc, inviteTime)
		memberData.push(["inviteToAllianceEvents." + memberDoc.inviteToAllianceEvents.indexOf(inviteToAllianceEvent), inviteToAllianceEvent])
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, memberDoc, memberData])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 处理加入联盟邀请
 * @param playerId
 * @param allianceId
 * @param agree
 * @param callback
 */
pro.handleJoinAllianceInvite = function(playerId, allianceId, agree, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var inviterDoc = null;
	var lockPairs = [];
	var updateFuncs = []
	var eventFuncs = []
	var pushFuncs = []
	var inviteEvent = null
	var mapData = null
	var mapIndexData = null
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		inviteEvent = LogicUtils.getInviteToAllianceEvent(playerDoc, allianceId)
		if(!inviteEvent){
			return Promise.reject(ErrorUtils.allianceInviteEventNotExist(playerId, allianceId))
		}
		if(!!playerDoc.allianceId){
			return Promise.reject(ErrorUtils.playerAlreadyJoinAlliance(playerId, playerId))
		}
		if(agree){
			return self.cacheService.findAllianceAsync(allianceId).then(function(doc){
				if(!_.isObject(doc)) return Promise.reject(ErrorUtils.allianceNotExist(allianceId))
				allianceDoc = doc
				if(allianceDoc.members.length >= DataUtils.getAllianceMemberMaxCount(allianceDoc)){
					var e = ErrorUtils.allianceMemberCountReachMax(playerId, allianceDoc._id);
					e.isLegal = true;
					return Promise.reject(e);
				}else{
					return self.cacheService.findPlayerAsync(inviteEvent.inviterId).then(function(doc){
						inviterDoc = doc;
						if(!inviterDoc){
							return Promise.reject(ErrorUtils.playerNotExist(playerId, inviteEvent.inviterId));
						}
					})
				}
			})
		}
	}).then(function(){
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		if(!!allianceDoc && agree){
			lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		}
	}).then(function(){
		playerData.push(["inviteToAllianceEvents." + playerDoc.inviteToAllianceEvents.indexOf(inviteEvent), null])
		LogicUtils.removeItemInArray(playerDoc.inviteToAllianceEvents, inviteEvent)
		if(!agree) return Promise.resolve()

		mapData = self.cacheService.getMapDataAtIndex(allianceDoc.mapIndex).mapData;
		mapIndexData = self.cacheService.getMapIndexs();
		var memberSizeInMap = DataUtils.getSizeInAllianceMap("member")
		var memberRect = LogicUtils.getFreePointInAllianceMap(allianceDoc, memberSizeInMap.width, memberSizeInMap.height)
		var memberMapObject = LogicUtils.createAllianceMapObject("member", memberRect)
		allianceDoc.mapObjects.push(memberMapObject)
		allianceData.push(["mapObjects." + allianceDoc.mapObjects.indexOf(memberMapObject), memberMapObject])
		var memberTitle = allianceDoc.members.length > 0 ? Consts.AllianceTitle.Member : Consts.AllianceTitle.Archon;
		var memberObject = LogicUtils.addAllianceMember(allianceDoc, playerDoc, memberTitle, memberMapObject.id, true)
		allianceData.push(["members." + allianceDoc.members.indexOf(memberObject), memberObject])
		DataUtils.refreshAllianceBasicInfo(allianceDoc, allianceData)
		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.Normal, Consts.AllianceEventType.InviteJoin, playerDoc.basicInfo.name, [inviterDoc.basicInfo.name])

		playerDoc.allianceId = allianceDoc._id
		playerData.push(["allianceId", playerDoc.allianceId])
		LogicUtils.clearArray(playerDoc.requestToAllianceEvents)
		playerData.push(["requestToAllianceEvents", playerDoc.requestToAllianceEvents])
		LogicUtils.clearArray(playerDoc.inviteToAllianceEvents)
		playerData.push(["inviteToAllianceEvents", playerDoc.inviteToAllianceEvents])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id]);
		eventFuncs.push([self.dataService, self.dataService.addPlayerToAllianceChannelAsync, allianceDoc._id, playerDoc])
		eventFuncs.push([self.dataService, self.dataService.updatePlayerSessionAsync, playerDoc, {
			allianceId:allianceDoc._id,
			allianceTag:allianceDoc.basicInfo.tag
		}])
		updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, allianceDoc._id]);
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedExceptMemberIdAsync, allianceDoc, allianceData, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback(null, [playerData, allianceDoc, mapData, mapIndexData]);
	}).then(
		function(){
			var inviterId = inviteEvent.inviterId
			var titleKey = null
			var contentKey = null
			if(!agree){
				titleKey = DataUtils.getLocalizationConfig("alliance", "InviteRejectedTitle")
				contentKey = DataUtils.getLocalizationConfig("alliance", "InviteRejectedContent")
				self.dataService.sendSysMailAsync(inviterId, titleKey, [], contentKey, [playerDoc.basicInfo.name], [])
			}else{
				titleKey = DataUtils.getLocalizationConfig("alliance", "InviteApprovedTitle")
				contentKey = DataUtils.getLocalizationConfig("alliance", "InviteApprovedContent")
				self.dataService.sendSysMailAsync(inviterId, titleKey, [], contentKey, [playerDoc.basicInfo.name], [])
			}
		},
		function(e){
			callback(e)
		}
	)
}

/**
 * 盟主长时间不登录时,玩家可宝石购买盟主职位
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.buyAllianceArchon = function(playerId, allianceId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	var eventFuncs = [];
	var archonObject = null
	var playerObject = null
	var gemUsed = null
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))
		playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(_.isEqual(playerObject.title, Consts.AllianceTitle.Archon)) return Promise.reject(ErrorUtils.playerAlreadyTheAllianceArchon(playerId, allianceId))
		gemUsed = DataUtils.getAllianceIntInit("buyArchonGem")
		if(gemUsed > playerDoc.resources.gem) return Promise.reject(ErrorUtils.gemNotEnough(playerId, gemUsed, playerDoc.resources.gem))
		archonObject = LogicUtils.getAllianceArchon(allianceDoc)
		var canBuyInterval = DataUtils.getAllianceIntInit('canBuyAllianceArchonMinutes') * 60 * 1000;
		if(archonObject.lastLogoutTime + canBuyInterval > Date.now()){
			return Promise.reject(ErrorUtils.onlyAllianceArchonMoreThanSevenDaysNotOnLinePlayerCanBuyArchonTitle(playerId, allianceDoc._id))
		}
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.resources.gem -= gemUsed
		var gemUse = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:-gemUsed,
			left:playerDoc.resources.gem,
			api:"buyAllianceArchon"
		}
		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		playerData.push(["resources.gem", playerDoc.resources.gem])
		playerObject.title = Consts.AllianceTitle.Archon
		allianceData.push(["members." + allianceDoc.members.indexOf(playerObject) + ".title", playerObject.title])
		archonObject.title = Consts.AllianceTitle.Member
		allianceData.push(["members." + allianceDoc.members.indexOf(archonObject) + ".title", archonObject.title])
		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.Important, Consts.AllianceEventType.HandOver, archonObject.name, [playerObject.name]);
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 请求联盟成员协助加速
 * @param playerId
 * @param allianceId
 * @param eventType
 * @param eventId
 * @param callback
 */
pro.requestAllianceToSpeedUp = function(playerId, allianceId, eventType, eventId, callback){
	var self = this
	var playerDoc = null
	var playerData = [];
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	var playerEvent = null;
	var helpEvent = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))
		playerEvent = LogicUtils.getPlayerEventByTypeAndId(playerDoc, eventType, eventId)
		if(!_.isObject(playerEvent)) return Promise.reject(ErrorUtils.playerEventNotExist(playerId, eventType, eventId))
		if(playerEvent.helped) return Promise.reject(ErrorUtils.speedupRequestAlreadySendForThisEvent(playerId, allianceDoc._id, eventType, eventId));
		helpEvent = LogicUtils.getObjectById(allianceDoc.helpEvents, eventId)
		if(_.isObject(helpEvent)) return Promise.reject(ErrorUtils.speedupRequestAlreadySendForThisEvent(playerId, allianceDoc._id, eventType, eventId))
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerEvent.helped = true;
		playerData.push([eventType + '.' + playerDoc[eventType].indexOf(playerEvent) + '.helped', true]);
		var object = LogicUtils.getPlayerObjectByEvent(playerDoc, eventType, eventId)
		helpEvent = DataUtils.addAllianceHelpEvent(allianceDoc, playerDoc, eventType, eventId, object.name, object.level + 1)
		allianceData.push(["helpEvents." + allianceDoc.helpEvents.indexOf(helpEvent), helpEvent])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedExceptMemberIdAsync, allianceDoc, allianceData, playerDoc._id]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback(null, [playerData, allianceData]);
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 协助联盟玩家加速
 * @param playerId
 * @param allianceId
 * @param eventId
 * @param callback
 */
pro.helpAllianceMemberSpeedUp = function(playerId, allianceId, eventId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var memberDoc = null
	var memberData = []
	var lockPairs = [];
	var eventFuncs = []
	var pushFuncs = []
	var helpEvent = null
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))
		helpEvent = LogicUtils.getObjectById(allianceDoc.helpEvents, eventId)
		if(!_.isObject(helpEvent)) return Promise.reject(ErrorUtils.allianceHelpEventNotExist(playerId, eventId))
		return self.cacheService.findPlayerAsync(helpEvent.playerData.id)
	}).then(function(doc){
		memberDoc = doc
		helpEvent = LogicUtils.getObjectById(allianceDoc.helpEvents, eventId)
		if(!_.isObject(helpEvent)) return Promise.reject(ErrorUtils.allianceHelpEventNotExist(playerId, eventId))
		if(_.isEqual(playerDoc._id, helpEvent.playerData.id)) return Promise.reject(ErrorUtils.canNotHelpSelfSpeedup(playerId, eventId))
		if(_.contains(helpEvent.eventData.helpedMembers, playerId)) return Promise.reject(ErrorUtils.youAlreadyHelpedTheEvent(playerId, eventId))
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:memberDoc._id});
	}).then(function(){
		DataUtils.addPlayerHelpLoyalty(playerDoc, playerData, 1)
		var memberEvent = LogicUtils.getPlayerEventByTypeAndId(memberDoc, helpEvent.eventData.type, helpEvent.eventData.id)
		if(!memberEvent){
			allianceData.push(["helpEvents." + allianceDoc.helpEvents.indexOf(helpEvent), null])
			LogicUtils.removeItemInArray(allianceDoc.helpEvents, helpEvent)
		}else{
			helpEvent.eventData.helpedMembers.push(playerDoc._id)
			var effect = DataUtils.getPlayerHelpAllianceMemberSpeedUpEffect(playerDoc, memberEvent.finishTime - memberEvent.startTime)
			memberEvent.finishTime = memberEvent.finishTime - effect
			if(helpEvent.eventData.helpedMembers.length >= helpEvent.eventData.maxHelpCount || LogicUtils.willFinished(memberEvent.finishTime)){
				allianceData.push(["helpEvents." + allianceDoc.helpEvents.indexOf(helpEvent), null])
				LogicUtils.removeItemInArray(allianceDoc.helpEvents, helpEvent)
			}else{
				allianceData.push(["helpEvents." + allianceDoc.helpEvents.indexOf(helpEvent) + ".eventData.helpedMembers." + helpEvent.eventData.helpedMembers.indexOf(playerDoc._id), playerDoc._id])
				memberData.push([helpEvent.eventData.type + "." + memberDoc[helpEvent.eventData.type].indexOf(memberEvent) + ".finishTime", memberEvent.finishTime])
			}
			eventFuncs.push([self.timeEventService, self.timeEventService.updatePlayerTimeEventAsync, memberDoc, helpEvent.eventData.type, memberEvent.id, memberEvent.finishTime - Date.now()])
		}

		if(!_.isEmpty(memberData)){
			pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, memberDoc, memberData])
		}
		if(!_.isEmpty(playerData)){
			pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
		}
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedExceptMemberIdAsync, allianceDoc, allianceData, playerDoc._id])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback(null, [playerData, allianceData])
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 协助联盟所有玩家加速
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.helpAllAllianceMemberSpeedUp = function(playerId, allianceId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var eventFuncs = [];
	var pushFuncs = [];
	var memberEvents = {}
	var helpCount = 0
	var memberDocs = {};
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		_.each(allianceDoc.helpEvents, function(event){
			var memberId = event.playerData.id
			if(memberId !== playerId && !_.contains(event.eventData.helpedMembers, playerId)){
				if(!_.isObject(memberEvents[memberId])) memberEvents[memberId] = []
				memberEvents[memberId].push(event)
				helpCount += 1
			}
		})
		if(helpCount == 0) return Promise.reject(ErrorUtils.noEventsNeedTobeSpeedup(playerId))

		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		var funcs = [];
		_.each(_.keys(memberEvents), function(memberId){
			lockPairs.push({key:Consts.Pairs.Player, value:memberId});
			funcs.push((function(memberId){
				return self.cacheService.findPlayerAsync(memberId).then(function(doc){
					memberDocs[memberId] = doc;
				})
			})(memberId))
		})
		return Promise.all(funcs);
	}).then(function(){
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		helpCount = 0;
		var speedUpAsync = function(memberId, helpEvents){
			var memberDoc = memberDocs[memberId];
			var memberData = []
			for(var i = 0; i < helpEvents.length; i++){
				var helpEvent = helpEvents[i]
				if(allianceDoc.helpEvents.indexOf(helpEvent) < 0) continue;
				helpCount++;
				var memberEvent = LogicUtils.getPlayerEventByTypeAndId(memberDoc, helpEvent.eventData.type, helpEvent.eventData.id)
				if(!memberEvent){
					allianceData.push(["helpEvents." + allianceDoc.helpEvents.indexOf(helpEvent), null])
					LogicUtils.removeItemInArray(allianceDoc.helpEvents, helpEvent)
				}else{
					helpEvent.eventData.helpedMembers.push(playerDoc._id)
					var effect = DataUtils.getPlayerHelpAllianceMemberSpeedUpEffect(playerDoc, memberEvent.finishTime - memberEvent.startTime)
					memberEvent.finishTime = memberEvent.finishTime - effect

					if(helpEvent.eventData.helpedMembers.length >= helpEvent.eventData.maxHelpCount || LogicUtils.willFinished(memberEvent.finishTime)){
						allianceData.push(["helpEvents." + allianceDoc.helpEvents.indexOf(helpEvent), null])
						LogicUtils.removeItemInArray(allianceDoc.helpEvents, helpEvent)
					}else{
						allianceData.push(["helpEvents." + allianceDoc.helpEvents.indexOf(helpEvent) + ".eventData.helpedMembers." + helpEvent.eventData.helpedMembers.indexOf(playerDoc._id), playerDoc._id])
						memberData.push([helpEvent.eventData.type + "." + memberDoc[helpEvent.eventData.type].indexOf(memberEvent) + ".finishTime", memberEvent.finishTime])
					}
					eventFuncs.push([self.timeEventService, self.timeEventService.updatePlayerTimeEventAsync, memberDoc, helpEvent.eventData.type, memberEvent.id, memberEvent.finishTime - Date.now()])
					pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, memberDoc, memberData]);
				}
			}
		}
		var funcs = []
		_.each(memberEvents, function(helpEvents, memberId){
			funcs.push(speedUpAsync(memberId, helpEvents))
		})
		return Promise.all(funcs);
	}).then(function(){
		DataUtils.addPlayerHelpLoyalty(playerDoc, playerData, helpCount)
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'helpSpeedup')
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedExceptMemberIdAsync, allianceDoc, allianceData, playerDoc._id]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs);
	}).then(function(){
		callback(null, [playerData, allianceData])
	}).catch(function(e){
		callback(e)
	})
}