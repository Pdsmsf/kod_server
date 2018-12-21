"use strict"

/**
 * Created by modun on 14/12/10.
 */

var Promise = require("bluebird")
var _ = require("underscore")

var Utils = require("../utils/utils")
var DataUtils = require("../utils/dataUtils")
var LogicUtils = require("../utils/logicUtils")
var TaskUtils = require("../utils/taskUtils")
var ErrorUtils = require("../utils/errorUtils")
var MarchUtils = require("../utils/marchUtils")
var Events = require("../consts/events")
var Consts = require("../consts/consts")
var Define = require("../consts/define")


var AllianceApiService3 = function(app){
	this.app = app
	this.env = app.get("env")
	this.pushService = app.get("pushService")
	this.timeEventService = app.get("timeEventService")
	this.remotePushService = app.get("remotePushService")
	this.dataService = app.get("dataService")
	this.cacheService = app.get('cacheService');
	this.cacheServerId = app.getServerId();
}
module.exports = AllianceApiService3
var pro = AllianceApiService3.prototype

/**
 * 联盟捐赠
 * @param playerId
 * @param allianceId
 * @param donateType
 * @param callback
 */
pro.donateToAlliance = function(playerId, allianceId, donateType, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		if(_.isObject(allianceDoc.allianceFight)) return Promise.reject(ErrorUtils.allianceInFightStatus(playerId, allianceId));
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var donateLevel = playerDoc.allianceDonate[donateType]
		var donateConfig = DataUtils.getAllianceDonateConfigByTypeAndLevel(donateType, donateLevel)
		DataUtils.refreshPlayerResources(playerDoc)
		playerData.push(["resources", playerDoc.resources])
		if(playerDoc.resources[donateType] < donateConfig.count){
			return Promise.reject(ErrorUtils.resourceNotEnough(playerId, "resources", donateType, playerDoc.resources[donateType], donateConfig.count))
		}
		playerDoc.resources[donateType] -= donateConfig.count
		playerDoc.allianceData.loyalty += donateConfig.loyalty * (1 + donateConfig.extra)
		playerData.push(["allianceData.loyalty", playerDoc.allianceData.loyalty])
		DataUtils.updatePlayerDonateLevel(playerDoc, playerData, donateType)

		allianceDoc.basicInfo.honour += donateConfig.honour * (1 + donateConfig.extra)
		allianceData.push(["basicInfo.honour", allianceDoc.basicInfo.honour])
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		playerObject.loyalty = playerDoc.allianceData.loyalty
		allianceData.push(["members." + allianceDoc.members.indexOf(playerObject) + ".loyalty", playerObject.loyalty])
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'donate')

		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
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
 * 升级联盟建筑
 * @param playerId
 * @param allianceId
 * @param buildingName
 * @param callback
 */
pro.upgradeAllianceBuilding = function(playerId, allianceId, buildingName, callback){
	var self = this
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var updateFuncs = [];
	var pushFuncs = []
	var playerObject = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "upgradeAllianceBuilding")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "upgradeAllianceBuilding"))
		}
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var building = DataUtils.getAllianceBuildingByName(allianceDoc, buildingName)
		var upgradeRequired = DataUtils.getAllianceBuildingUpgradeRequired(buildingName, building.level + 1)
		if(upgradeRequired.honour > allianceDoc.basicInfo.honour) return Promise.reject(ErrorUtils.allianceHonourNotEnough(playerId, allianceDoc._id))
		if(DataUtils.isAllianceBuildingReachMaxLevel(buildingName, building.level)) return Promise.reject(ErrorUtils.allianceBuildingReachMaxLevel(playerId, allianceDoc._id, buildingName))
		allianceDoc.basicInfo.honour -= upgradeRequired.honour
		allianceData.push(["basicInfo.honour", allianceDoc.basicInfo.honour])
		if(_.isEqual("shrine", buildingName)){
			LogicUtils.refreshAlliancePerception(allianceDoc)
			allianceData.push(["basicInfo.perception", allianceDoc.basicInfo.perception])
			allianceData.push(["basicInfo.perceptionRefreshTime", allianceDoc.basicInfo.perceptionRefreshTime])
		}
		building.level += 1
		allianceData.push(["buildings." + allianceDoc.buildings.indexOf(building) + ".level", building.level])
		DataUtils.refreshAllianceBasicInfo(allianceDoc, allianceData)
		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.Normal, Consts.AllianceEventType.BuildingUpgrade, playerObject.name, [building.name]);

		updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, allianceDoc._id])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 升级联盟村落
 * @param playerId
 * @param allianceId
 * @param villageType
 * @param callback
 */
pro.upgradeAllianceVillage = function(playerId, allianceId, villageType, callback){
	var self = this
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	var playerObject = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "upgradeAllianceVillage")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "upgradeAllianceVillage"))
		}
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var villageLevel = allianceDoc.villageLevels[villageType]
		var upgradeRequired = DataUtils.getAllianceVillageUpgradeRequired(villageType, villageLevel + 1)
		if(upgradeRequired.honour > allianceDoc.basicInfo.honour) return Promise.reject(ErrorUtils.allianceHonourNotEnough(playerId, allianceDoc._id))
		if(DataUtils.isAllianceVillageReachMaxLevel(villageType, villageLevel)) return Promise.reject(ErrorUtils.allianceBuildingReachMaxLevel(playerId, allianceDoc._id, villageType))
		allianceDoc.basicInfo.honour -= upgradeRequired.honour
		allianceData.push(["basicInfo.honour", allianceDoc.basicInfo.honour])
		allianceDoc.villageLevels[villageType] += 1
		allianceData.push(["villageLevels." + villageType, allianceDoc.villageLevels[villageType]])
		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.Normal, Consts.AllianceEventType.VillageUpgrade, playerObject.name, [villageType]);
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
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
 * 激活联盟圣地事件
 * @param playerId
 * @param allianceId
 * @param stageName
 * @param callback
 */
pro.activateAllianceShrineStage = function(playerId, allianceId, stageName, callback){
	var self = this
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	var eventFuncs = []
	var playerObject = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "activateAllianceShrineStage")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "activateAllianceShrineStage"))
		}
		if(DataUtils.isAllianceShrineStageLocked(allianceDoc, stageName)) return Promise.reject(ErrorUtils.theShrineStageIsLocked(playerId, allianceDoc._id, stageName))
		if(LogicUtils.isAllianceShrineStageActivated(allianceDoc, stageName)) return Promise.reject(ErrorUtils.theAllianceShrineEventAlreadyActived(playerId, allianceDoc._id, stageName))
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var activeStageRequired = DataUtils.getAllianceActiveShrineStageRequired(stageName)
		LogicUtils.refreshAlliancePerception(allianceDoc)
		if(allianceDoc.basicInfo.perception < activeStageRequired.perception) return Promise.reject(ErrorUtils.alliancePerceptionNotEnough(playerId, allianceDoc._id, stageName))
		allianceDoc.basicInfo.perception -= activeStageRequired.perception
		allianceData.push(["basicInfo.perception", allianceDoc.basicInfo.perception])
		allianceData.push(["basicInfo.perceptionRefreshTime", allianceDoc.basicInfo.perceptionRefreshTime])
		var event = DataUtils.createAllianceShrineStageEvent(stageName)
		allianceDoc.shrineEvents.push(event)
		allianceData.push(["shrineEvents." + allianceDoc.shrineEvents.indexOf(event), event])
		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.War, Consts.AllianceEventType.Shrine, playerObject.name, [stageName]);
		eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, allianceDoc, "shrineEvents", event.id, event.startTime - Date.now()])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).then(
		function(){
			self.remotePushService.onAllianceShrineEventStart(allianceDoc);
		},
		function(e){
			callback(e)
		}
	)
}

/**
 * 进攻联盟圣地
 * @param playerId
 * @param allianceId
 * @param shrineEventId
 * @param dragonType
 * @param soldiers
 * @param callback
 */
pro.attackAllianceShrine = function(playerId, allianceId, shrineEventId, dragonType, soldiers, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var dragon = null
	var playerObject = null;
	var lockPairs = [];
	var pushFuncs = []
	var eventFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		dragon = playerDoc.dragons[dragonType]
		if(dragon.star <= 0) return Promise.reject(ErrorUtils.dragonNotHatched(playerId, dragonType))
		if(!_.isEqual(Consts.DragonStatus.Free, dragon.status)) return Promise.reject(ErrorUtils.dragonIsNotFree(playerId, dragon.type))
		DataUtils.refreshPlayerDragonsHp(playerDoc, dragon)
		if(dragon.hp <= 0) return Promise.reject(ErrorUtils.dragonSelectedIsDead(playerId, dragon.type))
		if(!LogicUtils.isPlayerMarchSoldiersLegal(playerDoc, soldiers)) return Promise.reject(ErrorUtils.soldierNotExistOrCountNotLegal(playerId, soldiers))
		if(!LogicUtils.isPlayerDragonLeadershipEnough(playerDoc, dragon, soldiers)) return Promise.reject(ErrorUtils.dragonLeaderShipNotEnough(playerId, dragon.type))
		if(!LogicUtils.isPlayerHasFreeMarchQueue(playerDoc)) return Promise.reject(ErrorUtils.noFreeMarchQueue(playerId))
		var shrineEvent = LogicUtils.getObjectById(allianceDoc.shrineEvents, shrineEventId)
		if(!_.isObject(shrineEvent)) return Promise.reject(ErrorUtils.shrineStageEventNotFound(playerId, allianceDoc._id, shrineEventId))
		if(LogicUtils.isPlayerHasTroopMarchToAllianceShrineStage(allianceDoc, shrineEvent, playerId)){
			return Promise.reject(ErrorUtils.youHadSendTroopToTheShrineStage(playerId, allianceDoc._id, shrineEvent.stageName))
		}
		playerObject = LogicUtils.getObjectById(allianceDoc.members, playerDoc._id)
		if(!DataUtils.canSendTroopsOut(playerObject)){
			return Promise.reject(ErrorUtils.wallWasBrokenCanNotSendTroopsOut(playerId, allianceDoc._id));
		}
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		dragon.status = Consts.DragonStatus.March
		playerData.push(["dragons." + dragonType, dragon])
		_.each(soldiers, function(soldier){
			playerDoc.soldiers[soldier.name] -= soldier.count
			playerData.push(["soldiers." + soldier.name, playerDoc.soldiers[soldier.name]])
		})
		LogicUtils.addPlayerTroopOut(playerDoc, playerData, dragonType, soldiers);

		if(playerObject.protectStartTime > 0){
			playerObject.protectStartTime = 0
			allianceData.push(["members." + allianceDoc.members.indexOf(playerObject) + ".protectStartTime", playerObject.protectStartTime])
		}

		var event = MarchUtils.createAttackAllianceShrineMarchEvent(allianceDoc, playerDoc, playerDoc.dragons[dragonType], soldiers, shrineEventId)
		pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchEvents', event]);
		allianceDoc.marchEvents.attackMarchEvents.push(event)
		allianceData.push(["marchEvents.attackMarchEvents." + allianceDoc.marchEvents.attackMarchEvents.indexOf(event), event])

		eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, allianceDoc, "attackMarchEvents", event.id, event.arriveTime - Date.now()])
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
 * 开启联盟战
 * @param playerId
 * @param allianceId
 * @param targetAllianceId
 * @param callback
 */
pro.attackAlliance = function(playerId, allianceId, targetAllianceId, callback){
	var self = this
	var attackAllianceDoc = null
	var attackAllianceData = []
	var defenceAllianceDoc = null
	var defenceAllianceData = []
	var playerObject = null
	var lockPairs = [];
	var updateFuncs = [];
	var pushFuncs = []
	var eventFuncs = []
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		attackAllianceDoc = doc
		return self.cacheService.findAllianceAsync(targetAllianceId)
	}).then(function(doc){
		if(!doc) return Promise.reject(ErrorUtils.allianceNotExist(targetAllianceId));
		defenceAllianceDoc = doc
		playerObject = LogicUtils.getObjectById(attackAllianceDoc.members, playerId)
		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "attackAlliance")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "attackAlliance"))
		}
		if(_.isObject(attackAllianceDoc.allianceFight)) return Promise.reject(ErrorUtils.allianceInFightStatus(playerId, attackAllianceDoc._id))
		if(!_.isEqual(defenceAllianceDoc.basicInfo.status, Consts.AllianceStatus.Peace))
			return Promise.reject(ErrorUtils.targetAllianceNotInPeaceStatus(playerId, defenceAllianceDoc._id))
		lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Alliance, value:defenceAllianceDoc._id});
	}).then(function(){
		if(_.isEqual(attackAllianceDoc.basicInfo.status, Consts.AllianceStatus.Protect)){
			eventFuncs.push([self.timeEventService, self.timeEventService.removeAllianceTimeEventAsync, attackAllianceDoc, Consts.AllianceStatusEvent, Consts.AllianceStatusEvent])
		}
		var now = Date.now()
		var finishTime = now + (DataUtils.getAllianceIntInit("allianceFightPrepareMinutes") * 60 * 1000);
		LogicUtils.prepareForAllianceFight(attackAllianceDoc, defenceAllianceDoc, finishTime)
		attackAllianceData.push(["basicInfo", attackAllianceDoc.basicInfo])
		attackAllianceData.push(["allianceFight", attackAllianceDoc.allianceFight])
		defenceAllianceData.push(["basicInfo", defenceAllianceDoc.basicInfo])
		defenceAllianceData.push(["allianceFight", defenceAllianceDoc.allianceFight])
		LogicUtils.AddAllianceEvent(attackAllianceDoc, attackAllianceData, Consts.AllianceEventCategory.War, Consts.AllianceEventType.Fight, playerObject.name, []);

		updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, attackAllianceDoc._id])
		updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, defenceAllianceDoc._id])
		eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceFightTimeEventAsync, attackAllianceDoc, defenceAllianceDoc, finishTime - Date.now()])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData])
		pushFuncs.push([self.dataService, self.dataService.createAllianceFightChannelAsync, attackAllianceDoc._id, defenceAllianceDoc._id]);
		pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, attackAllianceDoc.mapIndex, attackAllianceDoc]);
		pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, defenceAllianceDoc.mapIndex, defenceAllianceDoc]);
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
			self.remotePushService.onAllianceFightPrepare(attackAllianceDoc, defenceAllianceDoc);
		},
		function(e){
			callback(e)
		}
	)
}

/**
 * 获取联盟可视化数据
 * @param playerId
 * @param targetAllianceId
 * @param callback
 */
pro.getAllianceViewData = function(playerId, targetAllianceId, callback){
	this.cacheService.findAllianceAsync(targetAllianceId).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.allianceNotExist(targetAllianceId))
		callback(null, _.pick(doc, Consts.AllianceViewDataKeys))
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 根据Tag搜索联盟战斗数据
 * @param playerId
 * @param tag
 * @param callback
 */
pro.searchAllianceInfoByTag = function(playerId, tag, callback){
	var self = this;
	var allianceInfos = []
	Promise.fromCallback(function(callback){
		self.cacheService.getAllianceModel().collection.find({
			serverId:self.cacheServerId,
			'basicInfo.tag':{$regex:tag, $options:"i"}
		}, {
			_id:true,
			basicInfo:true,
			countInfo:true,
			buildings:true,
			members:true
		}).limit(10).toArray(callback)
	}).then(function(docs){
		_.each(docs, function(doc){
			var data = {
				_id:doc._id,
				basicInfo:doc.basicInfo,
				countInfo:doc.countInfo,
				archer:doc.members.length > 0 ? LogicUtils.getAllianceArchon(doc).name : null,
				members:doc.members.length,
				membersMax:DataUtils.getAllianceMemberMaxCount(doc)
			}
			allianceInfos.push(data)
		})
		return Promise.resolve()
	}).then(function(){
		callback(null, allianceInfos)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 联盟商店补充道具
 * @param playerId
 * @param playerName
 * @param allianceId
 * @param itemName
 * @param count
 * @param callback
 */
pro.addShopItem = function(playerId, playerName, allianceId, itemName, count, callback){
	var self = this
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	var eventFuncs = []
	var honourNeed = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "addItem")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "addItem"))
		}
		if(!DataUtils.isItemSellInAllianceShop(allianceDoc, itemName)) return Promise.reject(ErrorUtils.theItemNotSellInAllianceShop(playerId, allianceDoc._id, itemName))
		var itemConfig = DataUtils.getItemConfig(itemName)
		if(!itemConfig.isAdvancedItem) return Promise.reject(ErrorUtils.normalItemsNotNeedToAdd(playerId, allianceDoc._id, itemName))
		honourNeed = itemConfig.buyPriceInAlliance * count
		if(allianceDoc.basicInfo.honour < honourNeed) return Promise.reject(ErrorUtils.allianceHonourNotEnough(playerId, allianceDoc._id))
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		allianceDoc.basicInfo.honour -= honourNeed
		allianceData.push(["basicInfo.honour", allianceDoc.basicInfo.honour])
		var resp = LogicUtils.addAllianceItem(allianceDoc, itemName, count)
		allianceData.push(["items." + allianceDoc.items.indexOf(resp.item), resp.item])
		var itemLog = LogicUtils.createAllianceItemLog(Consts.AllianceItemLogType.AddItem, playerName, itemName, count)
		LogicUtils.addAllianceItemLog(allianceDoc, allianceData, itemLog)
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 购买联盟商店的道具
 * @param playerId
 * @param allianceId
 * @param itemName
 * @param count
 * @param callback
 */
pro.buyShopItem = function(playerId, allianceId, itemName, count, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	var eventFuncs = []
	var updateFuncs = []
	var loyaltyNeed = null;
	var isAdvancedItem = null;
	var item = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerDoc._id)
		var itemConfig = DataUtils.getItemConfig(itemName)
		isAdvancedItem = itemConfig.isAdvancedItem
		var eliteLevel = DataUtils.getAllianceTitleLevel("elite")
		var myLevel = DataUtils.getAllianceTitleLevel(playerObject.title)
		if(isAdvancedItem){
			if(myLevel > eliteLevel) return Promise.reject(ErrorUtils.playerLevelNotEoughCanNotBuyAdvancedItem(playerId, allianceDoc._id, itemName))
			item = _.find(allianceDoc.items, function(item){
				return _.isEqual(item.name, itemName)
			})
			if(!_.isObject(item) || item.count < count) return Promise.reject(ErrorUtils.itemCountNotEnough(playerId, allianceDoc._id, itemName))
		}
		loyaltyNeed = itemConfig.buyPriceInAlliance * count
		if(playerDoc.allianceData.loyalty < loyaltyNeed) return Promise.reject(ErrorUtils.playerLoyaltyNotEnough(playerId, allianceDoc._id))
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.allianceData.loyalty -= loyaltyNeed
		playerData.push(["allianceData.loyalty", playerDoc.allianceData.loyalty])
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'buyAllianceItem')
		var memberObject = LogicUtils.getObjectById(allianceDoc.members, playerDoc._id)
		memberObject.loyalty -= loyaltyNeed
		allianceData.push(["members." + allianceDoc.members.indexOf(memberObject) + ".loyalty", memberObject.loyalty])

		if(isAdvancedItem){
			item.count -= count
			if(item.count <= 0){
				allianceData.push(["items." + allianceDoc.items.indexOf(item), null])
				LogicUtils.removeItemInArray(allianceDoc.items, item)
			}else{
				allianceData.push(["items." + allianceDoc.items.indexOf(item) + ".count", item.count])
			}
			var itemLog = LogicUtils.createAllianceItemLog(Consts.AllianceItemLogType.BuyItem, playerDoc.basicInfo.name, itemName, count)
			LogicUtils.addAllianceItemLog(allianceDoc, allianceData, itemLog)
		}
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'buyShopItem', null, [{
			name:itemName,
			count:count
		}]]);
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
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
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 查看联盟信息
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.getAllianceInfo = function(playerId, allianceId, callback){
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.allianceNotExist(allianceId))
		var allianceData = {
			id:doc._id,
			name:doc.basicInfo.name,
			tag:doc.basicInfo.tag,
			flag:doc.basicInfo.flag,
			members:doc.members.length,
			membersMax:DataUtils.getAllianceMemberMaxCount(doc),
			power:doc.basicInfo.power,
			country:doc.basicInfo.country,
			kill:doc.basicInfo.kill,
			joinType:doc.basicInfo.joinType,
			terrain:doc.basicInfo.terrain,
			desc:doc.desc,
			memberList:(function(){
				var members = []
				_.each(doc.members, function(member){
					var theMember = {
						id:member.id,
						name:member.name,
						icon:member.icon,
						levelExp:member.levelExp,
						power:member.power,
						title:member.title,
						online:_.isBoolean(member.online) ? member.online : false,
						lastLogoutTime:member.lastLogoutTime
					}
					members.push(theMember)
				})
				return members
			})()
		}

		callback(null, allianceData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 查看联盟基础信息
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.getAllianceBasicInfo = function(playerId, allianceId, callback){
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.allianceNotExist(allianceId))
		var archonObject = LogicUtils.getAllianceArchon(doc);
		var allianceData = {
			id:doc._id,
			name:doc.basicInfo.name,
			tag:doc.basicInfo.tag,
			flag:doc.basicInfo.flag,
			members:doc.members.length,
			membersMax:DataUtils.getAllianceMemberMaxCount(doc),
			power:doc.basicInfo.power,
			country:doc.basicInfo.country,
			kill:doc.basicInfo.kill,
			terrain:doc.basicInfo.terrain,
			desc:doc.desc,
			status:doc.basicInfo.status,
			statusStartTime:doc.basicInfo.statusStartTime,
			mapIndex:doc.mapIndex,
			archon:doc.members.length > 0 ? {
				name:archonObject.name,
				location:LogicUtils.getAllianceMemberMapObjectById(doc, archonObject.id).location
			} : null
		}

		callback(null, allianceData)
	}).catch(function(e){
		callback(e)
	})
}