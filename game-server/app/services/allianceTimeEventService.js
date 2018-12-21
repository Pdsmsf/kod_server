"use strict"

/**
 * Created by modun on 14-10-28.
 */

var ShortId = require("shortid")
var Promise = require("bluebird")
var _ = require("underscore")
var NodeUtils = require("util")

var Utils = require("../utils/utils")
var DataUtils = require("../utils/dataUtils")
var LogicUtils = require("../utils/logicUtils")
var TaskUtils = require("../utils/taskUtils")
var MarchUtils = require("../utils/marchUtils")
var FightUtils = require("../utils/fightUtils")
var ReportUtils = require("../utils/reportUtils")
var MapUtils = require("../utils/mapUtils");
var ErrorUtils = require("../utils/errorUtils")
var Consts = require("../consts/consts")
var Define = require("../consts/define")

var GameDatas = require('../datas/GameDatas')
var AllianceInitData = GameDatas.AllianceInitData
var AllianceMap = GameDatas.AllianceMap;
var AllianceEventTypes = Consts.AllianceMarchEventTypes.concat(['shrineEvents', 'villageEvents'])

var AllianceTimeEventService = function(app){
	this.app = app
	this.env = app.get("env")
	this.remotePushService = app.get('remotePushService');
	this.pushService = app.get("pushService")
	this.timeEventService = app.get("timeEventService")
	this.dataService = app.get("dataService")
	this.cacheService = app.get('cacheService');
	this.activityService = app.get('activityService');
	this.logService = app.get("logService");
	this.GemChange = app.get('GemChange');
}
module.exports = AllianceTimeEventService
var pro = AllianceTimeEventService.prototype

/**
 * 到达指定时间时,触发的消息
 * @param allianceId
 * @param eventType
 * @param eventId
 * @param callback
 */
pro.onTimeEvent = function(allianceId, eventType, eventId, callback){
	if(_.isEqual(eventType, Consts.AllianceStatusEvent)){
		this.onAllianceStatusChanged(allianceId, callback);
	}else if(eventType === Consts.MonsterRefreshEvent){
		this.onMonsterRefreshEvent(allianceId, callback);
	}else if(eventType === Consts.VillageRefreshEvent){
		this.onVillageRefreshEvent(allianceId, callback);
	}else if(_.contains(AllianceEventTypes, eventType)){
		var timeEventFuncName = "on" + eventType.charAt(0).toUpperCase() + eventType.slice(1);
		this[timeEventFuncName](allianceId, eventId, callback);
	}else{
		callback(ErrorUtils.allianceEventNotExist(allianceId, eventType, eventId));
	}
}

/**
 * 联盟状态改变事件回调
 * @param allianceId
 * @param callback
 */
pro.onAllianceStatusChanged = function(allianceId, callback){
	var self = this
	var allianceDoc = null
	var allianceData = [];
	var lockPairs = [];
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc;
		if(!_.isEqual(allianceDoc.basicInfo.status, Consts.AllianceStatus.Protect)){
			return Promise.reject(ErrorUtils.illegalAllianceStatus(allianceDoc._id, allianceDoc.basicInfo.status))
		}
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		allianceDoc.basicInfo.status = Consts.AllianceStatus.Peace
		allianceDoc.basicInfo.statusStartTime = Date.now()
		allianceDoc.basicInfo.statusFinishTime = 0
		allianceData.push(["basicInfo.status", allianceDoc.basicInfo.status])
		allianceData.push(["basicInfo.statusStartTime", allianceDoc.basicInfo.statusStartTime])
		allianceData.push(["basicInfo.statusFinishTime", allianceDoc.basicInfo.statusFinishTime])
		self.cacheService.updateMapAlliance(allianceDoc.mapIndex, allianceDoc);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onAllianceDataChangedAsync(allianceDoc, allianceData);
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 进攻行军事件回调
 * @param allianceId
 * @param eventId
 * @param callback
 */
pro.onAttackMarchEvents = function(allianceId, eventId, callback){
	var self = this
	var attackAllianceDoc = null;
	var attackAllianceData = []
	var attackPlayerDoc = null
	var attackPlayerData = []
	var attackSoldiers = null
	var attackWoundedSoldiers = []
	var defenceAllianceDoc = null
	var defenceAllianceData = []
	var defencePlayerDoc = null
	var defencePlayerData = []
	var helpDefencePlayerDoc = null
	var helpDefencePlayerData = []
	var attackDragon = null
	var attackDragonForFight = null
	var attackSoldiersForFight = null
	var attackTreatSoldierPercent = null
	var helpDefenceDragon = null
	var helpDefenceDragonForFight = null
	var helpDefenceDragonFightFixEffect = null
	var helpDefenceSoldiersForFight = null
	var helpDefenceTreatSoldierPercent = null
	var defenceDragon = null
	var defenceDragonForFight = null
	var defenceDragonFightFixEffect = null
	var defenceSoldiersForFight = null
	var defenceTreatSoldierPercent = null
	var report = null
	var countData = null
	var isInAllianceFight = null;
	var lockPairs = [];
	var updateFuncs = []
	var eventFuncs = []
	var pushFuncs = []
	var funcs = null
	var event = null;
	var deathEvent = null;

	var getSoldiersFromSoldiersForFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			if(soldierForFight.currentCount > 0){
				var soldier = {
					name:soldierForFight.name,
					count:soldierForFight.currentCount
				}
				soldiers.push(soldier)
			}
		})
		return soldiers
	}
	var getWoundedSoldiersFromSoldiersForFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			if(soldierForFight.woundedCount > 0){
				var soldier = {
					name:soldierForFight.name,
					count:soldierForFight.woundedCount
				}
				soldiers.push(soldier)
			}
		})
		return soldiers
	}
	var updatePlayerKillData = function(allianceFight, allianceFightData, role, playerDoc, newlyKill){
		var playerKillDatas = allianceFight[role].playerKills;
		var playerKillData = _.find(playerKillDatas, function(playerKillData){
			return _.isEqual(playerKillData.id, playerDoc._id)
		})
		if(!_.isObject(playerKillData)){
			playerKillData = {
				id:playerDoc._id,
				name:playerDoc.basicInfo.name,
				kill:newlyKill
			}
			playerKillDatas.push(playerKillData)
			allianceFightData.push(["allianceFight." + role + ".playerKills." + playerKillDatas.indexOf(playerKillData), playerKillData])
		}else{
			playerKillData.kill += newlyKill
			allianceFightData.push(["allianceFight." + role + ".playerKills." + playerKillDatas.indexOf(playerKillData) + ".kill", playerKillData.kill])
		}
	}

	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		attackAllianceDoc = doc;
		event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.attackMarchEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchEvents', eventId));
	}).then(function(){
		if(_.isEqual(event.marchType, Consts.MarchType.Shrine)){
			return Promise.fromCallback(function(callback){
				var shrineEvent = LogicUtils.getObjectById(attackAllianceDoc.shrineEvents, event.defenceShrineData.shrineEventId)
				self.cacheService.findPlayerAsync(event.attackPlayerData.id).then(function(doc){
					attackPlayerDoc = doc
					lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
					if(!!shrineEvent) lockPairs.push({key:Consts.Pairs.Player, value:attackPlayerDoc._id});
				}).then(function(){
					event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.attackMarchEvents, eventId);
					if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchEvents', eventId));
					if(!shrineEvent){
						var marchReturnEvent = MarchUtils.createAttackAllianceShrineMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackPlayerDoc.dragons[event.attackPlayerData.dragon.type], event.attackPlayerData.soldiers, [], [])
						pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
						attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
						attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
					}else{
						var playerTroop = {
							id:event.attackPlayerData.id,
							name:event.attackPlayerData.name,
							location:event.fromAlliance.location,
							dragon:event.attackPlayerData.dragon,
							soldiers:event.attackPlayerData.soldiers
						}
						shrineEvent.playerTroops.push(playerTroop)
						attackAllianceData.push(["shrineEvents." + attackAllianceDoc.shrineEvents.indexOf(shrineEvent) + ".playerTroops." + shrineEvent.playerTroops.indexOf(playerTroop), playerTroop])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
						TaskUtils.finishDailyTaskIfNeeded(attackPlayerDoc, attackPlayerData, 'attackShrine')
						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData])
					}
				}).then(function(){
					callback()
				}).catch(function(e){
					callback(e)
				})
			})
		}
		else if(_.isEqual(event.marchType, Consts.MarchType.HelpDefence)){
			return Promise.fromCallback(function(callback){
					var isHelpDefenceLegal = null;
					var defencePlayerMapObject = null
					funcs = []
					funcs.push(self.cacheService.findPlayerAsync(event.attackPlayerData.id))
					funcs.push(self.cacheService.findPlayerAsync(event.defencePlayerData.id))
					Promise.all(funcs).spread(function(doc_1, doc_2){
						attackPlayerDoc = doc_1
						defencePlayerDoc = doc_2
						event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.attackMarchEvents, eventId);
						if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchEvents', eventId));
						defencePlayerMapObject = LogicUtils.getAllianceMemberMapObjectById(attackAllianceDoc, defencePlayerDoc._id);
						isHelpDefenceLegal = !!defencePlayerMapObject && _.isEqual(defencePlayerMapObject.location, event.toAlliance.location) && !defencePlayerDoc.helpedByTroop;
						lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
						if(isHelpDefenceLegal){
							lockPairs.push({key:Consts.Pairs.Player, value:attackPlayerDoc._id});
							lockPairs.push({key:Consts.Pairs.Player, value:defencePlayerDoc._id});
						}
					}).then(function(){
						if(!isHelpDefenceLegal){
							var titleKey = null;
							var contentKey = null;
							var fullLocation = MarchUtils.getLocationFromAllianceData(event.toAlliance);
							var contentParams = [event.toAlliance.tag, event.defencePlayerData.name, fullLocation.x, fullLocation.y];
							if(!defencePlayerMapObject || !_.isEqual(defencePlayerMapObject.location, event.toAlliance.location)){
								titleKey = DataUtils.getLocalizationConfig("alliance", "AttackMissTitle");
								contentKey = DataUtils.getLocalizationConfig("alliance", "AttackMissContent");
							}else{
								titleKey = DataUtils.getLocalizationConfig("alliance", "HelpDefenceFailedTitle");
								contentKey = DataUtils.getLocalizationConfig("alliance", "HelpDefenceFailedContent");
							}
							pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, attackPlayerDoc._id, titleKey, [], contentKey, contentParams, []]);

							var marchReturnEvent = MarchUtils.createHelpDefenceMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackPlayerDoc.dragons[event.attackPlayerData.dragon.type], event.attackPlayerData.soldiers, [], [], event.defencePlayerData, event.fromAlliance, event.toAlliance);
							pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
							attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
							attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
							pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
						}else{
							var helpToTroop = {
								id:defencePlayerDoc._id,
								name:defencePlayerDoc.basicInfo.name,
								dragon:event.attackPlayerData.dragon.type,
								location:defencePlayerMapObject.location
							}
							attackPlayerDoc.helpToTroops.push(helpToTroop);
							attackPlayerData.push(["helpToTroops." + attackPlayerDoc.helpToTroops.indexOf(helpToTroop), helpToTroop]);
							var helpedByTroop = {
								id:attackPlayerDoc._id,
								name:attackPlayerDoc.basicInfo.name,
								dragon:{
									type:event.attackPlayerData.dragon.type
								},
								soldiers:event.attackPlayerData.soldiers,
								woundedSoldiers:[],
								rewards:[]
							}
							defencePlayerDoc.helpedByTroop = helpedByTroop;
							defencePlayerData.push(["helpedByTroop", helpedByTroop])

							var beHelpedMemberInAlliance = LogicUtils.getObjectById(attackAllianceDoc.members, defencePlayerDoc._id)
							beHelpedMemberInAlliance.beHelped = true;
							attackAllianceData.push(["members." + attackAllianceDoc.members.indexOf(beHelpedMemberInAlliance) + ".beHelped", beHelpedMemberInAlliance.beHelped])
							TaskUtils.finishDailyTaskIfNeeded(attackPlayerDoc, attackPlayerData, 'helpDefence')
							pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData])
							pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, defencePlayerDoc, defencePlayerData])
							pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
						}
					}).then(function(){
						callback();
					}).catch(function(e){
						callback(e);
					})
				}
			)
		}
		else if(_.isEqual(event.marchType, Consts.MarchType.City)){
			return Promise.fromCallback(function(callback){
				var updateDragonForFight = function(dragonForFight, dragonAfterFight){
					dragonForFight.currentHp = dragonAfterFight.currentHp
				}
				var isSoldiersAllDeaded = function(soldiersForFight){
					return !_.some(soldiersForFight, function(soldierForFight){
						return soldierForFight.currentCount > 0
					})
				}
				var updatePlayerDefenceTroop = function(playerDoc, playerData, soldiersForFight){
					var willRemovedSoldiers = [];
					_.each(soldiersForFight, function(soldierForFight, index){
						var soldier = playerDoc.defenceTroop.soldiers[index];
						if(soldierForFight.currentCount > 0){
							soldier.count = soldierForFight.currentCount
						}else{
							willRemovedSoldiers.push(soldier);
						}
					})
					LogicUtils.removeItemsInArray(playerDoc.defenceTroop.soldiers, willRemovedSoldiers);
					playerData.push(['defenceTroop.soldiers', playerDoc.defenceTroop.soldiers]);
				}
				var updatePlayerWoundedSoldiers = function(playerDoc, playerData, soldiersForFight){
					var woundedSoldiers = []
					_.each(soldiersForFight, function(soldierForFight){
						if(soldierForFight.woundedCount > 0){
							var woundedSoldier = {
								name:soldierForFight.name,
								count:soldierForFight.woundedCount
							}
							woundedSoldiers.push(woundedSoldier)
						}
					})
					DataUtils.addPlayerWoundedSoldiers(playerDoc, playerData, woundedSoldiers)
				}

				var defenceWallForFight = null
				var helpDefenceDragonFightData = null
				var helpDefenceSoldierFightData = null
				var defenceDragonFightData = null
				var defenceSoldierFightData = null
				var defenceWallFightData = null
				var attackCityReport = null
				var helpedByTroop = null
				var memberInAlliance = null
				var attackPlayer = null
				var helpDefencePlayer = null
				var defencePlayer = null
				var attackPlayerRewards = []
				var attackCityMarchReturnEvent = null
				var helpedByTroopCheckUsed = null;
				var isDefencePlayerProtected = null;
				funcs = []
				funcs.push(self.cacheService.findPlayerAsync(event.attackPlayerData.id))
				funcs.push(self.cacheService.findAllianceAsync(event.toAlliance.id))
				funcs.push(self.cacheService.findPlayerAsync(event.defencePlayerData.id))
				Promise.all(funcs).spread(function(doc_1, doc_2, doc_3){
					attackPlayerDoc = doc_1
					defenceAllianceDoc = doc_2
					defencePlayerDoc = doc_3
					if(!!defencePlayerDoc.helpedByTroop){
						helpedByTroopCheckUsed = Utils.clone(defencePlayerDoc.helpedByTroop);
						return self.cacheService.findPlayerAsync(defencePlayerDoc.helpedByTroop.id).then(function(doc){
							helpDefencePlayerDoc = doc
							helpDefencePlayer = LogicUtils.getObjectById(defenceAllianceDoc.members, helpDefencePlayerDoc._id);
							return Promise.resolve()
						})
					}else{
						return Promise.resolve()
					}
				}).then(function(){
					event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.attackMarchEvents, eventId);
					if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchEvents', eventId));
					if(!!helpDefencePlayerDoc && !_.isEqual(helpedByTroopCheckUsed, defencePlayerDoc.helpedByTroop)){
						helpDefencePlayerDoc = null;
						helpDefencePlayer = null;
					}
					if(!defenceAllianceDoc || event.toAlliance.mapIndex !== defenceAllianceDoc.mapIndex) return Promise.resolve();
					attackPlayer = LogicUtils.getObjectById(attackAllianceDoc.members, attackPlayerDoc._id);
					var defencePlayerMapObject = LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id);
					if(!defencePlayerMapObject || !_.isEqual(defencePlayerMapObject.location, event.toAlliance.location)) return Promise.resolve();
					defencePlayer = LogicUtils.getObjectById(defenceAllianceDoc.members, defencePlayerDoc._id)
					if(attackAllianceDoc.basicInfo.status === Consts.AllianceStatus.Fight){
						var enemyAllianceId = LogicUtils.getEnemyAllianceId(attackAllianceDoc.allianceFight, attackAllianceDoc._id);
						isInAllianceFight = enemyAllianceId === defenceAllianceDoc._id
					}
				}).then(function(){
					lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
					if(!!defencePlayer){
						lockPairs.push({key:Consts.Pairs.Alliance, value:defenceAllianceDoc._id});
						lockPairs.push({key:Consts.Pairs.Player, value:defencePlayerDoc._id});
						if(!!helpDefencePlayerDoc) lockPairs.push({key:Consts.Pairs.Player, value:helpDefencePlayerDoc._id});
					}
				}).then(function(){
					var titleKey = null;
					var contentKey = null;
					var fullLocation = null;
					var contentParams = null;
					if(!defencePlayer){
						titleKey = DataUtils.getLocalizationConfig("alliance", "AttackMissTitle");
						contentKey = DataUtils.getLocalizationConfig("alliance", "AttackMissContent");
						fullLocation = MarchUtils.getLocationFromAllianceData(event.toAlliance);
						contentParams = [event.toAlliance.tag, event.defencePlayerData.name, fullLocation.x, fullLocation.y];
						pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, attackPlayerDoc._id, titleKey, [], contentKey, contentParams, []]);

						attackCityMarchReturnEvent = MarchUtils.createAttackPlayerCityMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackPlayerDoc.dragons[event.attackPlayerData.dragon.type], event.attackPlayerData.soldiers, [], [], null, event.defencePlayerData, event.fromAlliance, event.toAlliance);
						pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', attackCityMarchReturnEvent]);
						attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(attackCityMarchReturnEvent)
						attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(attackCityMarchReturnEvent), attackCityMarchReturnEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", attackCityMarchReturnEvent.id, attackCityMarchReturnEvent.arriveTime - Date.now()])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData]);
						return Promise.resolve();
					}
					attackDragon = attackPlayerDoc.dragons[event.attackPlayerData.dragon.type]
					DataUtils.refreshPlayerDragonsHp(attackPlayerDoc, attackDragon)
					attackDragonForFight = DataUtils.createPlayerDragonForFight(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc.basicInfo.terrain)
					attackSoldiers = event.attackPlayerData.soldiers;
					if(!!helpDefencePlayerDoc){
						helpedByTroop = defencePlayerDoc.helpedByTroop;
						helpDefenceDragon = helpDefencePlayerDoc.dragons[helpedByTroop.dragon.type]
						DataUtils.refreshPlayerDragonsHp(helpDefencePlayerDoc, helpDefenceDragon)
						helpDefenceDragonFightFixEffect = DataUtils.getFightFixedEffect(attackPlayerDoc, attackSoldiers, helpDefencePlayerDoc, helpedByTroop.soldiers);
						helpDefenceDragonForFight = DataUtils.createPlayerDragonForFight(defenceAllianceDoc, helpDefencePlayerDoc, helpDefenceDragon, defenceAllianceDoc.basicInfo.terrain)
						helpDefenceDragonFightData = FightUtils.dragonToDragonFight(attackDragonForFight, helpDefenceDragonForFight, helpDefenceDragonFightFixEffect.dragon)
						attackSoldiersForFight = DataUtils.createPlayerSoldiersForFight(attackPlayerDoc, attackSoldiers, attackDragon, helpDefenceDragonFightData.attackDragonAfterFight);
						attackTreatSoldierPercent = DataUtils.getPlayerWoundedSoldierPercent(attackPlayerDoc, attackDragon)
						helpDefenceSoldiersForFight = DataUtils.createPlayerSoldiersForFight(helpDefencePlayerDoc, helpedByTroop.soldiers, helpDefenceDragon, helpDefenceDragonFightData.defenceDragonAfterFight)
						helpDefenceTreatSoldierPercent = DataUtils.getPlayerWoundedSoldierPercent(helpDefencePlayerDoc, helpDefenceDragon)
						helpDefenceSoldierFightData = FightUtils.soldierToSoldierFight(helpDefenceDragonFightData.attackDragonAfterFight, attackSoldiersForFight, attackTreatSoldierPercent + helpDefenceDragonFightFixEffect.soldier.attackSoldierEffect, helpDefenceDragonFightData.defenceDragonAfterFight, helpDefenceSoldiersForFight, helpDefenceTreatSoldierPercent + helpDefenceDragonFightFixEffect.soldier.defenceSoldierEffect)

						updateDragonForFight(attackDragonForFight, helpDefenceDragonFightData.attackDragonAfterFight);
						attackSoldiers = getSoldiersFromSoldiersForFight(helpDefenceSoldierFightData.attackSoldiersAfterFight);
						LogicUtils.mergeSoldiers(attackWoundedSoldiers, getWoundedSoldiersFromSoldiersForFight(helpDefenceSoldierFightData.attackSoldiersAfterFight));

						if(attackDragonForFight.currentHp <= 0 || helpDefenceSoldierFightData.fightResult === Consts.FightResult.DefenceWin){
							return Promise.resolve();
						}
					}
					isDefencePlayerProtected = defencePlayer.protectStartTime > 0 || defencePlayer.newbeeProtectFinishTime >= Date.now();
					if(isDefencePlayerProtected){
						titleKey = DataUtils.getLocalizationConfig("alliance", "AttackProtectedTitle");
						contentKey = DataUtils.getLocalizationConfig("alliance", "AttackProtectedContent");
						fullLocation = MarchUtils.getLocationFromAllianceData(event.toAlliance);
						contentParams = [event.toAlliance.tag, event.defencePlayerData.name, fullLocation.x, fullLocation.y];
						pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, attackPlayerDoc._id, titleKey, [], contentKey, contentParams, []]);
						return Promise.resolve()
					}
					DataUtils.refreshPlayerResources(defencePlayerDoc)
					defencePlayerData.push(["resources", defencePlayerDoc.resources])
					if(!!defencePlayerDoc.defenceTroop){
						defenceDragon = LogicUtils.getPlayerDefenceDragon(defencePlayerDoc)
						var defenceSoldiers = defencePlayerDoc.defenceTroop.soldiers;
						DataUtils.refreshPlayerDragonsHp(defencePlayerDoc, defenceDragon)
						defenceDragonFightFixEffect = DataUtils.getFightFixedEffect(attackPlayerDoc, attackSoldiers, defencePlayerDoc, defenceSoldiers);
						defenceDragonForFight = DataUtils.createPlayerDragonForFight(defenceAllianceDoc, defencePlayerDoc, defenceDragon, defenceAllianceDoc.basicInfo.terrain);
						defenceDragonFightData = FightUtils.dragonToDragonFight(attackDragonForFight, defenceDragonForFight, defenceDragonFightFixEffect.dragon);
						attackSoldiersForFight = DataUtils.createPlayerSoldiersForFight(attackPlayerDoc, attackSoldiers, attackDragon, defenceDragonFightData.attackDragonAfterFight);
						attackTreatSoldierPercent = DataUtils.getPlayerWoundedSoldierPercent(attackPlayerDoc, attackDragon)
						defenceSoldiersForFight = DataUtils.createPlayerSoldiersForFight(defencePlayerDoc, defenceSoldiers, defenceDragon, defenceDragonFightData.defenceDragonAfterFight);
						defenceTreatSoldierPercent = DataUtils.getPlayerWoundedSoldierPercent(defencePlayerDoc, defenceDragon)
						defenceSoldierFightData = FightUtils.soldierToSoldierFight(defenceDragonFightData.attackDragonAfterFight, attackSoldiersForFight, attackTreatSoldierPercent + defenceDragonFightFixEffect.soldier.attackSoldierEffect, defenceDragonFightData.defenceDragonAfterFight, defenceSoldiersForFight, defenceTreatSoldierPercent + defenceDragonFightFixEffect.soldier.defenceSoldierEffect)

						updateDragonForFight(attackDragonForFight, defenceDragonFightData.attackDragonAfterFight)
						attackSoldiers = getSoldiersFromSoldiersForFight(defenceSoldierFightData.attackSoldiersAfterFight)
						LogicUtils.mergeSoldiers(attackWoundedSoldiers, getWoundedSoldiersFromSoldiersForFight(defenceSoldierFightData.attackSoldiersAfterFight));

						if(attackDragonForFight.currentHp <= 0 || defenceSoldierFightData.fightResult === Consts.FightResult.DefenceWin){
							return Promise.resolve()
						}
					}

					attackSoldiersForFight = DataUtils.createPlayerSoldiersForFight(attackPlayerDoc, attackSoldiers, attackDragon, attackDragonForFight)
					defencePlayer.lastBeAttackedTime = Date.now()
					defenceAllianceData.push(["members." + defenceAllianceDoc.members.indexOf(defencePlayer) + ".lastBeAttackedTime", defencePlayer.lastBeAttackedTime]);
					defenceWallForFight = DataUtils.createPlayerWallForFight(defencePlayerDoc)
					defenceWallFightData = FightUtils.soldierToWallFight(attackSoldiersForFight, defenceWallForFight)
					attackSoldiers = getSoldiersFromSoldiersForFight(attackSoldiersForFight)
					LogicUtils.mergeSoldiers(attackWoundedSoldiers, getWoundedSoldiersFromSoldiersForFight(defenceWallFightData.attackSoldiersAfterFight));
					return Promise.resolve()
				}).then(function(){
					if(!defencePlayer) return Promise.resolve();

					if(isInAllianceFight){
						var allianceFight = attackAllianceDoc.allianceFight = defenceAllianceDoc.allianceFight;
						var allianceFightData = [];
						var attacker = null;
						var attackerString = null;
						var defencer = null;
						var defencerString = null;
						if(_.isEqual(attackAllianceDoc._id, attackAllianceDoc.allianceFight.attacker.alliance.id)){
							attacker = allianceFight.attacker;
							attackerString = 'attacker';
							defencer = allianceFight.defencer;
							defencerString = 'defencer';
						}else{
							attacker = allianceFight.defencer;
							attackerString = 'defencer';
							defencer = allianceFight.attacker;
							defencerString = 'attacker';
						}
					}

					if(!!helpDefenceDragonFightData){
						report = ReportUtils.createAttackCityFightWithHelpDefencePlayerReport(attackAllianceDoc, attackPlayerDoc, defenceAllianceDoc, defencePlayerDoc, helpDefencePlayerDoc, helpDefenceDragonFightData, helpDefenceSoldierFightData)

						attackCityReport = report.reportForAttackPlayer.attackCity
						countData = report.countData
						attackPlayerDoc.basicInfo.kill += countData.attackPlayerKill
						attackPlayerData.push(["basicInfo.kill", attackPlayerDoc.basicInfo.kill])
						attackPlayerDoc.basicInfo.attackTotal += 1
						attackPlayerData.push(["basicInfo.attackTotal", attackPlayerDoc.basicInfo.attackTotal])
						TaskUtils.finishPlayerKillTaskIfNeed(attackPlayerDoc, attackPlayerData)
						LogicUtils.addAlliancePlayerLastThreeDaysKillData(attackAllianceDoc, attackPlayer, countData.attackPlayerKill)
						attackAllianceData.push(["members." + attackAllianceDoc.members.indexOf(attackPlayer) + ".lastThreeDaysKillData", attackPlayer.lastThreeDaysKillData])
						LogicUtils.mergeRewards(attackPlayerRewards, attackCityReport.attackPlayerData.rewards);
						DataUtils.addPlayerDragonExp(attackPlayerDoc, attackPlayerData, attackDragon, countData.attackDragonExpAdd)
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, report.reportForAttackPlayer])

						helpDefencePlayerDoc.basicInfo.kill += countData.defencePlayerKill
						helpDefencePlayerData.push(["basicInfo.kill", helpDefencePlayerDoc.basicInfo.kill])
						TaskUtils.finishPlayerKillTaskIfNeed(helpDefencePlayerDoc, helpDefencePlayerData)
						LogicUtils.addAlliancePlayerLastThreeDaysKillData(defenceAllianceDoc, helpDefencePlayer, countData.defencePlayerKill)
						defenceAllianceData.push(["members." + defenceAllianceDoc.members.indexOf(helpDefencePlayer) + ".lastThreeDaysKillData", helpDefencePlayer.lastThreeDaysKillData])
						helpDefenceDragon.hp = helpDefenceDragonFightData.defenceDragonAfterFight.currentHp
						if(helpDefenceDragon.hp <= 0){
							var deathEvent = DataUtils.createPlayerDragonDeathEvent(helpDefencePlayerDoc, helpDefenceDragon)
							helpDefencePlayerDoc.dragonDeathEvents.push(deathEvent)
							helpDefencePlayerData.push(["dragonDeathEvents." + helpDefencePlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, helpDefencePlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
						}
						helpDefencePlayerData.push(["dragons." + helpDefenceDragon.type + ".hp", helpDefenceDragon.hp])
						helpDefencePlayerData.push(["dragons." + helpDefenceDragon.type + ".hpRefreshTime", helpDefenceDragon.hpRefreshTime])
						DataUtils.addPlayerDragonExp(helpDefencePlayerDoc, helpDefencePlayerData, helpDefenceDragon, countData.defenceDragonExpAdd)
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, helpDefencePlayerDoc._id, report.reportForDefencePlayer])

						var helpDefenceMailTitle = DataUtils.getLocalizationConfig("alliance", "HelpDefenceAttackTitle")
						var helpDefenceMailContent = DataUtils.getLocalizationConfig("alliance", "HelpDefenceAttackContent")
						var helpDefenceMailParams = [defenceAllianceDoc.basicInfo.tag, helpDefencePlayerDoc.basicInfo.name]
						pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, defencePlayerDoc._id, helpDefenceMailTitle, helpDefenceMailParams, helpDefenceMailContent, helpDefenceMailParams, []])

						var soldiers = getSoldiersFromSoldiersForFight(helpDefenceSoldierFightData.defenceSoldiersAfterFight)
						var woundedSoldiers = getWoundedSoldiersFromSoldiersForFight(helpDefenceSoldierFightData.defenceSoldiersAfterFight)
						var rewards = attackCityReport.helpDefencePlayerData.rewards

						if(helpDefenceSoldierFightData.fightResult === Consts.FightResult.DefenceWin){
							helpDefencePlayer.helpDefenceDisableFinishTime = Date.now() + (DataUtils.getAllianceIntInit('helpDefenceDisableMinutes') * 60 * 1000);
							defenceAllianceData.push(["members." + defenceAllianceDoc.members.indexOf(helpDefencePlayer) + ".helpDefenceDisableFinishTime", helpDefencePlayer.helpDefenceDisableFinishTime])
						}

						if(helpDefenceDragon.hp <= 0 || helpDefenceSoldierFightData.fightResult === Consts.FightResult.AttackWin){
							var helpToTroop = LogicUtils.getObjectById(helpDefencePlayerDoc.helpToTroops, defencePlayerDoc._id);
							helpDefencePlayerData.push(["helpToTroops." + helpDefencePlayerDoc.helpToTroops.indexOf(helpToTroop), null])
							LogicUtils.removeItemInArray(helpDefencePlayerDoc.helpToTroops, helpToTroop);
							var fromAlliance = {
								id:defenceAllianceDoc._id,
								name:defenceAllianceDoc.basicInfo.name,
								tag:defenceAllianceDoc.basicInfo.tag,
								location:LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, helpDefencePlayerDoc._id).location,
								mapIndex:defenceAllianceDoc.mapIndex
							}
							var toAlliance = {
								id:defenceAllianceDoc._id,
								name:defenceAllianceDoc.basicInfo.name,
								tag:defenceAllianceDoc.basicInfo.tag,
								location:LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id).location,
								mapIndex:defenceAllianceDoc.mapIndex
							}
							_.each(rewards, function(reward){
								if(reward.name === 'blood'){
									self.activityService.addPlayerActivityScore(helpDefencePlayerDoc, helpDefencePlayerData, 'collectHeroBlood', 'getOneBlood', reward.count);
									self.activityService.addAllianceActivityScoreByDoc(defenceAllianceDoc, defenceAllianceData, 'collectHeroBlood', 'getOneBlood', reward.count);
								}
							})
							var helpDefenceMarchReturnEvent = MarchUtils.createHelpDefenceMarchReturnEvent(defenceAllianceDoc, helpDefencePlayerDoc, helpDefenceDragon, soldiers, woundedSoldiers, rewards, event.defencePlayerData, fromAlliance, toAlliance);
							pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', helpDefenceMarchReturnEvent])
							defenceAllianceDoc.marchEvents.attackMarchReturnEvents.push(helpDefenceMarchReturnEvent)
							defenceAllianceData.push(["marchEvents.attackMarchReturnEvents." + defenceAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(helpDefenceMarchReturnEvent), helpDefenceMarchReturnEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, defenceAllianceDoc, "attackMarchReturnEvents", helpDefenceMarchReturnEvent.id, helpDefenceMarchReturnEvent.arriveTime - Date.now()])

							defencePlayerData.push(["helpedByTroop", null])
							defencePlayerDoc.helpedByTroop = null;
							var defencePlayerInAlliance = LogicUtils.getObjectById(defenceAllianceDoc.members, defencePlayerDoc._id)
							defencePlayerInAlliance.beHelped = false
							defenceAllianceData.push(["members." + defenceAllianceDoc.members.indexOf(defencePlayerInAlliance) + ".beHelped", defencePlayerInAlliance.beHelped])
						}else{
							helpedByTroop.soldiers = soldiers;
							LogicUtils.mergeSoldiers(helpedByTroop.woundedSoldiers, woundedSoldiers);
							LogicUtils.mergeRewards(helpedByTroop.rewards, rewards);
							defencePlayerData.push(["helpedByTroop", helpedByTroop]);
						}

						if(isInAllianceFight){
							attacker.allianceCountData.attackCount += 1;
							allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.attackCount', attacker.allianceCountData.attackCount]);
							attacker.allianceCountData.kill += countData.attackPlayerKill;
							allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.kill', attacker.allianceCountData.kill]);
							updatePlayerKillData(allianceFight, allianceFightData, attackerString, attackPlayerDoc, countData.attackPlayerKill)
							defencer.allianceCountData.kill += countData.defencePlayerKill;
							allianceFightData.push(['allianceFight.' + defencerString + '.allianceCountData.kill', defencer.allianceCountData.kill]);
							updatePlayerKillData(allianceFight, allianceFightData, defencerString, helpDefencePlayerDoc, countData.defencePlayerKill)
							if(_.isEqual(Consts.FightResult.AttackWin, helpDefenceSoldierFightData.fightResult)){
								attacker.allianceCountData.attackSuccessCount += 1;
								allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.attackSuccessCount', attacker.allianceCountData.attackSuccessCount]);
							}
							attackAllianceData = attackAllianceData.concat(allianceFightData);
							defenceAllianceData = defenceAllianceData.concat(allianceFightData);
						}
						if(_.isEqual(Consts.FightResult.AttackWin, helpDefenceSoldierFightData.fightResult)){
							attackPlayerDoc.basicInfo.attackWin += 1
							attackPlayerData.push(["basicInfo.attackWin", attackPlayerDoc.basicInfo.attackWin])
							TaskUtils.finishAttackWinTaskIfNeed(attackPlayerDoc, attackPlayerData)
						}else{
							helpDefencePlayerDoc.basicInfo.defenceWin += 1
							helpDefencePlayerData.push(["basicInfo.defenceWin", helpDefencePlayerDoc.basicInfo.defenceWin])
						}
					}

					if(!!defenceDragonFightData || !!defenceWallFightData){
						report = ReportUtils.createAttackCityFightWithDefencePlayerReport(attackAllianceDoc, attackPlayerDoc, attackDragonForFight, attackSoldiersForFight, defenceAllianceDoc, defencePlayerDoc, defenceDragonFightData, defenceSoldierFightData, defenceWallFightData)
						attackCityReport = report.reportForAttackPlayer.attackCity
						countData = report.countData
						attackPlayerDoc.basicInfo.kill += countData.attackPlayerKill
						attackPlayerData.push(["basicInfo.kill", attackPlayerDoc.basicInfo.kill])
						attackPlayerDoc.basicInfo.attackTotal += 1
						attackPlayerData.push(["basicInfo.attackTotal", attackPlayerDoc.basicInfo.attackTotal])
						TaskUtils.finishPlayerKillTaskIfNeed(attackPlayerDoc, attackPlayerData)
						LogicUtils.addAlliancePlayerLastThreeDaysKillData(attackAllianceDoc, attackPlayer, countData.attackPlayerKill)
						attackAllianceData.push(["members." + attackAllianceDoc.members.indexOf(attackPlayer) + ".lastThreeDaysKillData", attackPlayer.lastThreeDaysKillData])
						LogicUtils.mergeRewards(attackPlayerRewards, attackCityReport.attackPlayerData.rewards);
						DataUtils.addPlayerDragonExp(attackPlayerDoc, attackPlayerData, attackDragon, countData.attackDragonExpAdd)
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, report.reportForAttackPlayer])

						defencePlayerDoc.basicInfo.kill += countData.defencePlayerKill
						defencePlayerData.push(["basicInfo.kill", defencePlayerDoc.basicInfo.kill])
						TaskUtils.finishPlayerKillTaskIfNeed(defencePlayerDoc, defencePlayerData)
						LogicUtils.addAlliancePlayerLastThreeDaysKillData(defenceAllianceDoc, defencePlayer, countData.defencePlayerKill)
						defenceAllianceData.push(["members." + defenceAllianceDoc.members.indexOf(defencePlayer) + ".lastThreeDaysKillData", defencePlayer.lastThreeDaysKillData])
						if(_.isObject(defenceDragonFightData)){
							defenceDragon.hp = defenceDragonFightData.defenceDragonAfterFight.currentHp;
							defencePlayerData.push(["dragons." + defenceDragon.type + ".hp", defenceDragon.hp])
							defencePlayerData.push(["dragons." + defenceDragon.type + ".hpRefreshTime", defenceDragon.hpRefreshTime])
							DataUtils.addPlayerDragonExp(defencePlayerDoc, defencePlayerData, defenceDragon, countData.defenceDragonExpAdd)
							updatePlayerDefenceTroop(defencePlayerDoc, defencePlayerData, defenceSoldierFightData.defenceSoldiersAfterFight);
							updatePlayerWoundedSoldiers(defencePlayerDoc, defencePlayerData, defenceSoldierFightData.defenceSoldiersAfterFight)
							if(defenceDragon.hp <= 0 || defenceSoldierFightData.fightResult === Consts.FightResult.AttackWin || isSoldiersAllDeaded(defenceSoldierFightData.defenceSoldiersAfterFight)){
								LogicUtils.removePlayerTroopOut(defencePlayerDoc, defencePlayerData, defenceDragon.type);
								defenceDragon.status = Consts.DragonStatus.Free
								defencePlayerData.push(["dragons." + defenceDragon.type + ".status", defenceDragon.status])
								if(defenceDragon.hp <= 0){
									deathEvent = DataUtils.createPlayerDragonDeathEvent(defencePlayerDoc, defenceDragon)
									defencePlayerDoc.dragonDeathEvents.push(deathEvent)
									defencePlayerData.push(["dragonDeathEvents." + defencePlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
									eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, defencePlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
								}
								LogicUtils.addPlayerSoldiers(defencePlayerDoc, defencePlayerData, defencePlayerDoc.defenceTroop.soldiers);
								defencePlayerDoc.defenceTroop = null;
								defencePlayerData.push(['defenceTroop', null]);
							}
						}
						if(_.isObject(defenceWallFightData)){
							defencePlayerDoc.resources.wallHp = defenceWallFightData.defenceWallAfterFight.currentHp;
						}
						_.each(attackCityReport.defencePlayerData.rewards, function(reward){
							if(reward.name === 'blood'){
								self.activityService.addPlayerActivityScore(defencePlayerDoc, defencePlayerData, 'collectHeroBlood', 'getOneBlood', reward.count);
								self.activityService.addAllianceActivityScoreByDoc(defenceAllianceDoc, defenceAllianceData, 'collectHeroBlood', 'getOneBlood', reward.count);
							}
						})
						updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, defencePlayerDoc, defencePlayerData, 'onAttackMarchEvents', null, attackCityReport.defencePlayerData.rewards, false]);
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, defencePlayerDoc._id, report.reportForDefencePlayer])

						if(isInAllianceFight){
							attacker.allianceCountData.attackCount += 1;
							allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.attackCount', attacker.allianceCountData.attackCount]);
							attacker.allianceCountData.kill += countData.attackPlayerKill;
							allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.kill', attacker.allianceCountData.kill]);
							updatePlayerKillData(allianceFight, allianceFightData, attackerString, attackPlayerDoc, countData.attackPlayerKill)
							defencer.allianceCountData.kill += countData.defencePlayerKill;
							allianceFightData.push(['allianceFight.' + defencerString + '.allianceCountData.kill', defencer.allianceCountData.kill]);
							updatePlayerKillData(allianceFight, allianceFightData, defencerString, defencePlayerDoc, countData.defencePlayerKill)
							if(!_.isObject(defenceSoldierFightData) || _.isEqual(Consts.FightResult.AttackWin, defenceSoldierFightData.fightResult)){
								attacker.allianceCountData.attackSuccessCount += 1;
								allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.attackSuccessCount', attacker.allianceCountData.attackSuccessCount]);
								if(!!defenceWallFightData && Consts.FightResult.AttackWin === defenceWallFightData.fightResult){
									attacker.allianceCountData.routCount += 1;
									allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.routCount', attacker.allianceCountData.routCount]);

									memberInAlliance = LogicUtils.getObjectById(defenceAllianceDoc.members, defencePlayerDoc._id)
									memberInAlliance.protectStartTime = Date.now();
									defenceAllianceData.push(["members." + defenceAllianceDoc.members.indexOf(memberInAlliance) + ".protectStartTime", memberInAlliance.protectStartTime]);
								}
							}
							attackAllianceData = attackAllianceData.concat(allianceFightData);
							defenceAllianceData = defenceAllianceData.concat(allianceFightData);
						}
						if(!_.isObject(defenceSoldierFightData) || _.isEqual(Consts.FightResult.AttackWin, defenceSoldierFightData.fightResult)){
							attackPlayerDoc.basicInfo.attackWin += 1
							attackPlayerData.push(["basicInfo.attackWin", attackPlayerDoc.basicInfo.attackWin])
							TaskUtils.finishAttackWinTaskIfNeed(attackPlayerDoc, attackPlayerData)
						}
						if(_.isObject(defenceSoldierFightData) && _.isEqual(Consts.FightResult.DefenceWin, defenceSoldierFightData.fightResult)){
							defencePlayerDoc.basicInfo.defenceWin += 1
							defencePlayerData.push(["basicInfo.defenceWin", defencePlayerDoc.basicInfo.defenceWin])
						}
					}

					if(!!helpDefenceDragonFightData || !!defenceDragonFightData){
						attackDragon.hp = attackDragonForFight.currentHp
						if(attackDragon.hp <= 0){
							deathEvent = DataUtils.createPlayerDragonDeathEvent(attackPlayerDoc, attackDragon)
							attackPlayerDoc.dragonDeathEvents.push(deathEvent)
							attackPlayerData.push(["dragonDeathEvents." + attackPlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, attackPlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
						}
						attackPlayerData.push(["dragons." + attackDragon.type + ".hp", attackDragon.hp])
						attackPlayerData.push(["dragons." + attackDragon.type + ".hpRefreshTime", attackDragon.hpRefreshTime])
					}

					_.each(attackPlayerRewards, function(reward){
						if(_.contains(Consts.BasicResource, reward.name) || reward.name === 'coin'){
							self.activityService.addPlayerActivityScore(attackPlayerDoc, attackPlayerData, 'collectResource', 'robOne_' + reward.name, reward.count);
							self.activityService.addPlayerActivityScore(defencePlayerDoc, defencePlayerData, 'collectResource', 'robOne_' + reward.name, -reward.count);
							self.activityService.addAllianceActivityScoreByDoc(attackAllianceDoc, attackAllianceData, 'collectResource', 'robOne_' + reward.name, reward.count);
							self.activityService.addAllianceActivityScoreByDoc(defenceAllianceDoc, defenceAllianceData, 'collectResource', 'robOne_' + reward.name, -reward.count);
						}else if(reward.name === 'blood'){
							self.activityService.addPlayerActivityScore(attackPlayerDoc, attackPlayerData, 'collectHeroBlood', 'getOneBlood', reward.count);
							self.activityService.addAllianceActivityScoreByDoc(attackAllianceDoc, attackAllianceData, 'collectHeroBlood', 'getOneBlood', reward.count);
						}
					})
					attackCityMarchReturnEvent = MarchUtils.createAttackPlayerCityMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackDragon, attackSoldiers, attackWoundedSoldiers, attackPlayerRewards, defencePlayerDoc, event.defencePlayerData, event.fromAlliance, event.toAlliance);
					pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', attackCityMarchReturnEvent])
					attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(attackCityMarchReturnEvent)
					attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(attackCityMarchReturnEvent), attackCityMarchReturnEvent])
					eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", attackCityMarchReturnEvent.id, attackCityMarchReturnEvent.arriveTime - Date.now()])
					TaskUtils.finishDailyTaskIfNeeded(attackPlayerDoc, attackPlayerData, 'attackCity')

					if(!!attackPlayerData && attackPlayerData.length > 0){
						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData]);
					}
					if(!!helpDefencePlayerData && helpDefencePlayerData.length > 0){
						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, helpDefencePlayerDoc, helpDefencePlayerData]);
					}
					if(!!defencePlayerData && defencePlayerData.length > 0){
						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, defencePlayerDoc, defencePlayerData]);
					}
					pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData]);
					pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData]);
				}).then(function(){
					callback()
				}).catch(function(e){
					callback(e);
				})
			})
		}
		else if(_.isEqual(event.marchType, Consts.MarchType.Village)){
			return Promise.fromCallback(function(callback){
				var villageEvent = null
				var village = null
				var attackDragonExpAdd = null
				var attackPlayerKill = null
				var attackRewards = null
				var eventData = null
				var newVillageEvent = null
				var defenceDragonExpAdd = null
				var defencePlayerKill = null
				var defenceSoldiers = null
				var defenceWoundedSoldiers = null
				var defenceRewards = null
				var marchReturnEvent = null
				var resourceName = null
				var villageAllianceDoc = null;
				var villageAllianceData = [];
				var rewards = null;
				var collectReport = null;
				var attackVillageLegal = null;
				var villageCheckUsed = null;
				self.cacheService.findPlayerAsync(event.attackPlayerData.id).then(function(doc){
					attackPlayerDoc = doc
					if(event.fromAlliance.id !== event.toAlliance.id){
						return self.cacheService.findAllianceAsync(event.toAlliance.id).then(function(doc){
							defenceAllianceDoc = doc
							if(!defenceAllianceDoc || event.toAlliance.mapIndex !== defenceAllianceDoc.mapIndex) return Promise.resolve();
							village = LogicUtils.getAllianceVillageById(defenceAllianceDoc, event.defenceVillageData.id)
							if(!!village){
								villageCheckUsed = Utils.clone(village);
							}
							return Promise.resolve()
						})
					}else{
						defenceAllianceDoc = attackAllianceDoc;
						defenceAllianceData = attackAllianceData;
						village = LogicUtils.getAllianceVillageById(defenceAllianceDoc, event.defenceVillageData.id)
						if(!!village){
							villageCheckUsed = Utils.clone(village);
						}
						return Promise.resolve()
					}
				}).then(function(){
					event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.attackMarchEvents, eventId);
					if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchEvents', eventId));
					if(!village) return Promise.resolve();
					if(!!village.villageEvent){
						if(village.villageEvent.allianceId === event.fromAlliance.id) return Promise.resolve();
						else if(village.villageEvent.allianceId === event.toAlliance.id){
							villageAllianceDoc = defenceAllianceDoc;
							villageAllianceData = defenceAllianceData;
							villageEvent = _.find(villageAllianceDoc.villageEvents, function(villageEvent){
								return villageEvent.id === village.villageEvent.eventId;
							})
							return self.cacheService.findPlayerAsync(villageEvent.playerData.id).then(function(doc){
								defencePlayerDoc = doc;
								return Promise.resolve();
							})
						}else{
							return self.cacheService.findAllianceAsync(village.villageEvent.allianceId).then(function(doc){
								villageAllianceDoc = doc;
								villageEvent = _.find(villageAllianceDoc.villageEvents, function(villageEvent){
									return villageEvent.id === village.villageEvent.eventId;
								})
								return self.cacheService.findPlayerAsync(villageEvent.playerData.id).then(function(doc){
									defencePlayerDoc = doc;
									return Promise.resolve();
								})
							})
						}
					}
				}).then(function(){
					event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.attackMarchEvents, eventId);
					if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchEvents', eventId));
					village = !!village ? LogicUtils.getAllianceVillageById(defenceAllianceDoc, event.defenceVillageData.id) : null;
					if(!village || !_.isEqual(village, villageCheckUsed)){
						village = null;
					}
					attackVillageLegal = !!village && (!village.villageEvent || village.villageEvent.allianceId !== event.fromAlliance.id)
					lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
					if(attackVillageLegal){
						if(attackAllianceDoc.basicInfo.status === Consts.AllianceStatus.Fight){
							var enemyAllianceId = LogicUtils.getEnemyAllianceId(attackAllianceDoc.allianceFight, attackAllianceDoc._id);
							isInAllianceFight = !!village.villageEvent
								&& village.villageEvent.allianceId === enemyAllianceId
								&& (event.toAlliance.id === attackAllianceDoc._id || event.toAlliance.id === enemyAllianceId);
						}
						if(attackAllianceDoc !== defenceAllianceDoc) lockPairs.push({
							key:Consts.Pairs.Alliance,
							value:defenceAllianceDoc._id
						});
						if(!!villageAllianceDoc && villageAllianceDoc !== attackAllianceDoc && villageAllianceDoc !== defenceAllianceDoc) lockPairs.push({
							key:Consts.Pairs.Alliance,
							value:villageAllianceDoc._id
						});

						if(!!defencePlayerDoc) lockPairs.push({key:Consts.Pairs.Player, value:defencePlayerDoc._id});
						lockPairs.push({key:Consts.Pairs.Player, value:attackPlayerDoc._id});
					}
				}).then(function(){
					if(!attackVillageLegal){
						var titleKey = null;
						var contentKey = null;
						var fullLocation = MarchUtils.getLocationFromAllianceData(event.toAlliance);
						var contentParams = [event.toAlliance.tag, '__' + event.defenceVillageData.name, fullLocation.x, fullLocation.y];
						if(!village){
							titleKey = DataUtils.getLocalizationConfig("alliance", "AttackMissTitle");
							contentKey = DataUtils.getLocalizationConfig("alliance", "AttackMissContent");
						}else{
							titleKey = DataUtils.getLocalizationConfig("alliance", "CollectFailedTitle");
							contentKey = DataUtils.getLocalizationConfig("alliance", "CollectFailedContent");
						}
						pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, attackPlayerDoc._id, titleKey, [], contentKey, contentParams, []]);

						marchReturnEvent = MarchUtils.createAttackVillageMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackPlayerDoc.dragons[event.attackPlayerData.dragon.type], event.attackPlayerData.soldiers, [], [], event.defenceVillageData, event.fromAlliance, event.toAlliance)
						pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
						attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
						attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
						return Promise.resolve()
					}
					if(isInAllianceFight){
						var allianceFight = attackAllianceDoc.allianceFight = defenceAllianceDoc.allianceFight;
						var allianceFightData = [];
						var attacker = null;
						var attackerString = null;
						var defencer = null;
						var defencerString = null;
						if(_.isEqual(attackAllianceDoc._id, attackAllianceDoc.allianceFight.attacker.alliance.id)){
							attacker = allianceFight.attacker;
							attackerString = 'attacker';
							defencer = allianceFight.defencer;
							defencerString = 'defencer';
						}else{
							attacker = allianceFight.defencer;
							attackerString = 'defencer';
							defencer = allianceFight.attacker;
							defencerString = 'attacker';
						}
					}
					resourceName = village.name.slice(0, -7);
					if(!_.isObject(villageEvent)){
						eventData = MarchUtils.createAllianceVillageEvent(attackAllianceDoc, attackPlayerDoc, event.attackPlayerData.dragon, event.attackPlayerData.soldiers, [], [], defenceAllianceDoc, village)
						newVillageEvent = eventData.event
						pushFuncs.push([self.cacheService, self.cacheService.addVillageEventAsync, newVillageEvent]);
						village.villageEvent = {eventId:newVillageEvent.id, allianceId:newVillageEvent.fromAlliance.id};
						defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village) + '.villageEvent', village.villageEvent]);
						attackAllianceDoc.villageEvents.push(newVillageEvent)
						attackAllianceData.push(["villageEvents." + attackAllianceDoc.villageEvents.indexOf(newVillageEvent), newVillageEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "villageEvents", newVillageEvent.id, newVillageEvent.finishTime - Date.now()])
						TaskUtils.finishDailyTaskIfNeeded(attackPlayerDoc, attackPlayerData, 'attackVillage')
						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData])
						if(defenceAllianceDoc !== attackAllianceDoc){
							pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData]);
						}
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
						return Promise.resolve()
					}else{
						attackDragon = attackPlayerDoc.dragons[event.attackPlayerData.dragon.type]
						DataUtils.refreshPlayerDragonsHp(attackPlayerDoc, attackDragon)
						attackDragonForFight = DataUtils.createPlayerDragonForFight(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc.basicInfo.terrain)
						defenceDragon = defencePlayerDoc.dragons[villageEvent.playerData.dragon.type]
						DataUtils.refreshPlayerDragonsHp(defencePlayerDoc, defenceDragon)
						defenceDragonFightFixEffect = DataUtils.getFightFixedEffect(attackPlayerDoc, event.attackPlayerData.soldiers, defencePlayerDoc, villageEvent.playerData.soldiers)
						defenceDragonForFight = DataUtils.createPlayerDragonForFight(defenceAllianceDoc, defencePlayerDoc, defenceDragon, defenceAllianceDoc.basicInfo.terrain)
						var defenceDragonFightData = FightUtils.dragonToDragonFight(attackDragonForFight, defenceDragonForFight, defenceDragonFightFixEffect.dragon)
						attackSoldiersForFight = DataUtils.createPlayerSoldiersForFight(attackPlayerDoc, event.attackPlayerData.soldiers, attackDragon, defenceDragonFightData.attackDragonAfterFight)
						attackTreatSoldierPercent = DataUtils.getPlayerWoundedSoldierPercent(attackPlayerDoc, attackDragon)
						defenceSoldiersForFight = DataUtils.createPlayerSoldiersForFight(defencePlayerDoc, villageEvent.playerData.soldiers, defenceDragon, defenceDragonFightData.defenceDragonAfterFight)
						defenceTreatSoldierPercent = DataUtils.getPlayerWoundedSoldierPercent(defencePlayerDoc, defenceDragon)
						var defenceSoldierFightData = FightUtils.soldierToSoldierFight(defenceDragonFightData.attackDragonAfterFight, attackSoldiersForFight, attackTreatSoldierPercent + defenceDragonFightFixEffect.soldier.attackSoldierEffect, defenceDragonFightData.defenceDragonAfterFight, defenceSoldiersForFight, defenceTreatSoldierPercent + defenceDragonFightFixEffect.soldier.defenceSoldierEffect)

						report = ReportUtils.createAttackVillageFightWithDefenceTroopReport(attackAllianceDoc, attackPlayerDoc, defenceAllianceDoc, village, villageAllianceDoc, defencePlayerDoc, defenceDragonFightData, defenceSoldierFightData)
						countData = report.countData
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, report.reportForAttackPlayer])
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, defencePlayerDoc._id, report.reportForDefencePlayer])

						attackDragonExpAdd = countData.attackDragonExpAdd
						attackPlayerKill = countData.attackPlayerKill
						attackSoldiers = getSoldiersFromSoldiersForFight(defenceSoldierFightData.attackSoldiersAfterFight)
						attackWoundedSoldiers = getWoundedSoldiersFromSoldiersForFight(defenceSoldierFightData.attackSoldiersAfterFight)
						attackRewards = report.reportForAttackPlayer.attackVillage.attackPlayerData.rewards.slice(0);

						defenceDragonExpAdd = countData.defenceDragonExpAdd
						defencePlayerKill = countData.defencePlayerKill
						defenceSoldiers = getSoldiersFromSoldiersForFight(defenceSoldierFightData.defenceSoldiersAfterFight)
						defenceWoundedSoldiers = getWoundedSoldiersFromSoldiersForFight(defenceSoldierFightData.defenceSoldiersAfterFight)
						defenceRewards = report.reportForAttackPlayer.attackVillage.defencePlayerData.rewards.slice(0);

						villageEvent.playerData.soldiers = defenceSoldiers
						LogicUtils.mergeRewards(villageEvent.playerData.rewards, defenceRewards)
						LogicUtils.mergeSoldiers(villageEvent.playerData.woundedSoldiers, defenceWoundedSoldiers)

						attackPlayerDoc.basicInfo.kill += attackPlayerKill
						attackPlayerData.push(["basicInfo.kill", attackPlayerDoc.basicInfo.kill])
						TaskUtils.finishPlayerKillTaskIfNeed(attackPlayerDoc, attackPlayerData)
						attackDragon.hp = defenceDragonFightData.attackDragonAfterFight.currentHp;
						if(attackDragon.hp <= 0){
							deathEvent = DataUtils.createPlayerDragonDeathEvent(attackPlayerDoc, attackDragon)
							attackPlayerDoc.dragonDeathEvents.push(deathEvent)
							attackPlayerData.push(["dragonDeathEvents." + attackPlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, attackPlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
						}
						DataUtils.addPlayerDragonExp(attackPlayerDoc, attackPlayerData, attackDragon, attackDragonExpAdd)
						attackPlayerData.push(["dragons." + attackDragon.type + ".hp", attackDragon.hp])
						attackPlayerData.push(["dragons." + attackDragon.type + ".hpRefreshTime", attackDragon.hpRefreshTime])

						defencePlayerDoc.basicInfo.kill += defencePlayerKill
						defencePlayerData.push(["basicInfo.kill", defencePlayerDoc.basicInfo.kill])
						TaskUtils.finishPlayerKillTaskIfNeed(defencePlayerDoc, defencePlayerData)
						defenceDragon.hp = defenceDragonFightData.defenceDragonAfterFight.currentHp;
						if(defenceDragon.hp <= 0){
							deathEvent = DataUtils.createPlayerDragonDeathEvent(defencePlayerDoc, defenceDragon)
							defencePlayerDoc.dragonDeathEvents.push(deathEvent)
							defencePlayerData.push(["dragonDeathEvents." + defencePlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, defencePlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
						}
						DataUtils.addPlayerDragonExp(defencePlayerDoc, defencePlayerData, defenceDragon, defenceDragonExpAdd)
						defencePlayerData.push(["dragons." + defenceDragon.type + ".hp", defenceDragon.hp])
						defencePlayerData.push(["dragons." + defenceDragon.type + ".hpRefreshTime", defenceDragon.hpRefreshTime])

						var resourceCollected = Math.floor(villageEvent.villageData.collectTotal * ((Date.now() - villageEvent.startTime) / (villageEvent.finishTime - villageEvent.startTime)))
						if(defenceSoldierFightData.fightResult === Consts.FightResult.AttackWin){
							pushFuncs.push([self.cacheService, self.cacheService.removeVillageEventAsync, villageEvent]);
							villageAllianceData.push(["villageEvents." + villageAllianceDoc.villageEvents.indexOf(villageEvent), null])
							LogicUtils.removeItemInArray(villageAllianceDoc.villageEvents, villageEvent)
							eventFuncs.push([self.timeEventService, self.timeEventService.removeAllianceTimeEventAsync, villageAllianceDoc, "villageEvents", villageEvent.id])
							TaskUtils.finishDailyTaskIfNeeded(attackPlayerDoc, attackPlayerData, 'attackVillage')
							marchReturnEvent = MarchUtils.createAttackVillageMarchReturnEvent(villageAllianceDoc, defencePlayerDoc, defencePlayerDoc.dragons[villageEvent.playerData.dragon.type], villageEvent.playerData.soldiers, villageEvent.playerData.woundedSoldiers, villageEvent.playerData.rewards, event.defenceVillageData, villageEvent.fromAlliance, villageEvent.toAlliance);
							pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
							villageAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
							villageAllianceData.push(["marchEvents.attackMarchReturnEvents." + villageAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, villageAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])

							eventData = MarchUtils.createAllianceVillageEvent(attackAllianceDoc, attackPlayerDoc, attackDragon, attackSoldiers, attackWoundedSoldiers, attackRewards, defenceAllianceDoc, village)
							newVillageEvent = eventData.event
							if(attackDragon.hp <= 0 || eventData.collectTotal <= resourceCollected){
								rewards = [{
									type:"resources",
									name:resourceName,
									count:eventData.collectTotal <= resourceCollected ? eventData.collectTotal : resourceCollected
								}]
								LogicUtils.mergeRewards(newVillageEvent.playerData.rewards, rewards)
								_.each(newVillageEvent.playerData.rewards, function(reward){
									if(_.contains(Consts.BasicResource, reward.name) || reward.name === 'coin'){
										self.activityService.addPlayerActivityScore(attackPlayerDoc, attackPlayerData, 'collectResource', 'collectOne_' + reward.name, reward.count);
										self.activityService.addAllianceActivityScoreByDoc(attackAllianceDoc, attackAllianceData, 'collectResource', 'robOne_' + reward.name, reward.count);
									}else if(reward.name === 'blood'){
										self.activityService.addPlayerActivityScore(attackPlayerDoc, attackPlayerData, 'collectHeroBlood', 'getOneBlood', reward.count);
										self.activityService.addAllianceActivityScoreByDoc(attackAllianceDoc, attackAllianceData, 'collectHeroBlood', 'getOneBlood', reward.count);
									}
								})
								marchReturnEvent = MarchUtils.createAttackVillageMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackPlayerDoc.dragons[newVillageEvent.playerData.dragon.type], newVillageEvent.playerData.soldiers, newVillageEvent.playerData.woundedSoldiers, newVillageEvent.playerData.rewards, event.defenceVillageData, newVillageEvent.fromAlliance, newVillageEvent.toAlliance)
								pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
								attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
								attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
								eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
								collectReport = ReportUtils.createCollectVillageReport(defenceAllianceDoc, village, rewards)
								pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, collectReport])

								village.villageEvent = null;
								defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village) + ".villageEvent", village.villageEvent])
								village.resource -= rewards[0].count;
								defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village) + ".resource", village.resource])
							}else{
								var timeUsed = Math.floor(eventData.collectTime * (resourceCollected / eventData.collectTotal))
								newVillageEvent.startTime -= timeUsed
								newVillageEvent.finishTime -= timeUsed
								pushFuncs.push([self.cacheService, self.cacheService.addVillageEventAsync, newVillageEvent]);
								attackAllianceDoc.villageEvents.push(newVillageEvent)
								attackAllianceData.push(["villageEvents." + attackAllianceDoc.villageEvents.indexOf(newVillageEvent), newVillageEvent])
								eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "villageEvents", newVillageEvent.id, newVillageEvent.finishTime - Date.now()])

								village.villageEvent = {eventId:newVillageEvent.id, allianceId:newVillageEvent.fromAlliance.id};
								defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village) + ".villageEvent", village.villageEvent])
							}
						}else{
							marchReturnEvent = MarchUtils.createAttackVillageMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackDragon, attackSoldiers, attackWoundedSoldiers, attackRewards, event.defenceVillageData, event.fromAlliance, event.toAlliance);
							pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
							attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
							attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])

							var newSoldierLoadTotal = DataUtils.getPlayerSoldiersTotalLoad(defencePlayerDoc, villageEvent.playerData.soldiers)
							var newCollectInfo = DataUtils.getPlayerCollectResourceInfo(villageAllianceDoc, defencePlayerDoc, newSoldierLoadTotal, village)
							villageEvent.villageData.collectTotal = newCollectInfo.collectTotal
							villageEvent.finishTime = villageEvent.startTime + newCollectInfo.collectTime
							if(defenceDragon.hp <= 0 || newCollectInfo.collectTotal <= resourceCollected || LogicUtils.willFinished(villageEvent.finishTime)){
								rewards = [{
									type:"resources",
									name:resourceName,
									count:newCollectInfo.collectTotal <= resourceCollected ? newCollectInfo.collectTotal : resourceCollected
								}]
								LogicUtils.mergeRewards(villageEvent.playerData.rewards, rewards)
								_.each(villageEvent.playerData.rewards, function(reward){
									if(_.contains(Consts.BasicResource, reward.name) || reward.name === 'coin'){
										self.activityService.addPlayerActivityScore(defencePlayerDoc, defencePlayerData, 'collectResource', 'collectOne_' + reward.name, reward.count);
										self.activityService.addAllianceActivityScoreByDoc(defenceAllianceDoc, defenceAllianceData, 'collectResource', 'robOne_' + reward.name, reward.count);
									}else if(reward.name === 'blood'){
										self.activityService.addPlayerActivityScore(defencePlayerDoc, defencePlayerData, 'collectHeroBlood', 'getOneBlood', reward.count);
										self.activityService.addAllianceActivityScoreByDoc(defenceAllianceDoc, defenceAllianceData, 'collectHeroBlood', 'getOneBlood', reward.count);
									}
								})
								pushFuncs.push([self.cacheService, self.cacheService.removeVillageEventAsync, villageEvent]);
								villageAllianceData.push(["villageEvents." + villageAllianceDoc.villageEvents.indexOf(villageEvent), null])
								LogicUtils.removeItemInArray(villageAllianceDoc.villageEvents, villageEvent)
								eventFuncs.push([self.timeEventService, self.timeEventService.removeAllianceTimeEventAsync, villageAllianceDoc, "villageEvents", villageEvent.id])

								marchReturnEvent = MarchUtils.createAttackVillageMarchReturnEvent(villageAllianceDoc, defencePlayerDoc, defencePlayerDoc.dragons[villageEvent.playerData.dragon.type], villageEvent.playerData.soldiers, villageEvent.playerData.woundedSoldiers, villageEvent.playerData.rewards, event.defenceVillageData, villageEvent.fromAlliance, villageEvent.toAlliance);
								pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
								villageAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
								villageAllianceData.push(["marchEvents.attackMarchReturnEvents." + villageAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
								eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, villageAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
								collectReport = ReportUtils.createCollectVillageReport(defenceAllianceDoc, village, rewards)
								pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, defencePlayerDoc._id, collectReport])

								village.villageEvent = null;
								defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village) + ".villageEvent", village.villageEvent])
								village.resource -= rewards[0].count
								defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village) + ".resource", village.resource])
							}else{
								pushFuncs.push([self.cacheService, self.cacheService.updateVillageEventAsync, villageEvent]);
								villageAllianceData.push(["villageEvents." + villageAllianceDoc.villageEvents.indexOf(villageEvent), villageEvent])
								eventFuncs.push([self.timeEventService, self.timeEventService.updateAllianceTimeEventAsync, villageAllianceDoc, "villageEvents", villageEvent.id, villageEvent.finishTime - Date.now()])
							}
						}
						if(isInAllianceFight){
							attacker.allianceCountData.kill += attackPlayerKill;
							allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.kill', attacker.allianceCountData.kill]);
							updatePlayerKillData(allianceFight, allianceFightData, attackerString, attackPlayerDoc, attackPlayerKill)
							defencer.allianceCountData.kill += defencePlayerKill;
							allianceFightData.push(['allianceFight.' + defencerString + '.allianceCountData.kill', defencer.allianceCountData.kill]);
							updatePlayerKillData(allianceFight, allianceFightData, defencerString, defencePlayerDoc, defencePlayerKill)
							attackAllianceData = attackAllianceData.concat(allianceFightData);
							defenceAllianceData = defenceAllianceData.concat(allianceFightData);
						}

						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData])
						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, defencePlayerDoc, defencePlayerData])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
						if(defenceAllianceDoc !== attackAllianceDoc){
							pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData])
						}
						if(villageAllianceDoc !== defenceAllianceDoc){
							pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, villageAllianceDoc, villageAllianceData])
						}
						return Promise.resolve()
					}
				}).then(function(){
					callback()
				}).catch(function(e){
					callback(e)
				})
			})
		}
		else if(_.isEqual(event.marchType, Consts.MarchType.Monster)){
			return Promise.fromCallback(function(callback){
				var defenceMonster = null;
				self.cacheService.findPlayerAsync(event.attackPlayerData.id).then(function(doc){
					attackPlayerDoc = doc
					if(event.fromAlliance.id !== event.toAlliance.id){
						return self.cacheService.findAllianceAsync(event.toAlliance.id).then(function(doc){
							defenceAllianceDoc = doc
							if(!defenceAllianceDoc || event.toAlliance.mapIndex !== defenceAllianceDoc.mapIndex) return Promise.resolve();
							defenceMonster = _.find(defenceAllianceDoc.monsters, function(monster){
								return _.isEqual(monster.id, event.defenceMonsterData.id)
							})
							return Promise.resolve()
						})
					}else{
						defenceAllianceDoc = attackAllianceDoc;
						defenceAllianceData = attackAllianceData;
						defenceMonster = _.find(defenceAllianceDoc.monsters, function(monster){
							return _.isEqual(monster.id, event.defenceMonsterData.id)
						})
						return Promise.resolve()
					}
				}).then(function(){
					lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
					if(defenceMonster){
						lockPairs.push({key:Consts.Pairs.Player, value:attackPlayerDoc._id});
						if(defenceAllianceDoc !== attackAllianceDoc) lockPairs.push({
							key:Consts.Pairs.Alliance,
							value:defenceAllianceDoc._id
						});
					}
				}).then(function(){
					event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.attackMarchEvents, eventId);
					if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchEvents', eventId));
					if(!_.isObject(defenceMonster)){
						var titleKey = DataUtils.getLocalizationConfig("alliance", "AttackMissTitle");
						var contentKey = DataUtils.getLocalizationConfig("alliance", "AttackMissContent");
						var fullLocation = MarchUtils.getLocationFromAllianceData(event.toAlliance);
						var contentParams = [event.toAlliance.tag, '__' + DataUtils.getMonsterName(event.defenceMonsterData.level, event.defenceMonsterData.index), fullLocation.x, fullLocation.y];
						pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, attackPlayerDoc._id, titleKey, [], contentKey, contentParams, []]);

						var marchReturnEvent = MarchUtils.createAttackMonsterMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackPlayerDoc.dragons[event.attackPlayerData.dragon.type], event.attackPlayerData.soldiers, [], [], event.defenceMonsterData, event.fromAlliance, event.toAlliance);
						pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
						attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
						attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
						return Promise.resolve()
					}else{
						var defenceMonsterForFight = DataUtils.createAllianceMonsterForFight(defenceAllianceDoc, defenceMonster)
						attackDragon = attackPlayerDoc.dragons[event.attackPlayerData.dragon.type]
						attackDragonForFight = DataUtils.createPlayerDragonForFight(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc.basicInfo.terrain)
						attackSoldiersForFight = DataUtils.createPlayerSoldiersForFight(attackPlayerDoc, event.attackPlayerData.soldiers, attackDragon, attackDragonForFight)
						attackTreatSoldierPercent = DataUtils.getPlayerWoundedSoldierPercent(attackPlayerDoc, attackDragon)
						defenceDragonFightFixEffect = DataUtils.getFightFixedEffect(attackPlayerDoc, event.attackPlayerData.soldiers, null, defenceMonsterForFight.soldiers)
						var defenceDragonFightData = FightUtils.dragonToDragonFight(attackDragonForFight, defenceMonsterForFight.dragonForFight, defenceDragonFightFixEffect.dragon)
						var defenceSoldierFightData = FightUtils.soldierToSoldierFight(defenceDragonFightData.attackDragonAfterFight, attackSoldiersForFight, attackTreatSoldierPercent + defenceDragonFightFixEffect.soldier.attackSoldierEffect, null, defenceMonsterForFight.soldiersForFight, 0)
						report = ReportUtils.createAttackMonsterReport(attackAllianceDoc, attackPlayerDoc, attackDragonForFight, attackSoldiersForFight, defenceAllianceDoc, defenceMonster, defenceDragonFightData, defenceSoldierFightData)
						var attackMonsterReport = report.reportForAttackPlayer.attackMonster
						countData = report.countData
						attackPlayerDoc.basicInfo.kill += countData.attackPlayerKill
						attackPlayerData.push(["basicInfo.kill", attackPlayerDoc.basicInfo.kill])
						attackPlayerDoc.basicInfo.attackTotal += 1
						attackPlayerData.push(["basicInfo.attackTotal", attackPlayerDoc.basicInfo.attackTotal])
						TaskUtils.finishPlayerKillTaskIfNeed(attackPlayerDoc, attackPlayerData)
						attackSoldiers = getSoldiersFromSoldiersForFight(defenceSoldierFightData.attackSoldiersAfterFight)
						attackWoundedSoldiers = getWoundedSoldiersFromSoldiersForFight(defenceSoldierFightData.attackSoldiersAfterFight)
						var attackPlayerRewards = attackMonsterReport.attackPlayerData.rewards
						attackDragon.hp = defenceDragonFightData.attackDragonAfterFight.currentHp;
						if(attackDragon.hp <= 0){
							deathEvent = DataUtils.createPlayerDragonDeathEvent(attackPlayerDoc, attackDragon)
							attackPlayerDoc.dragonDeathEvents.push(deathEvent)
							attackPlayerData.push(["dragonDeathEvents." + attackPlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, attackPlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
						}
						DataUtils.addPlayerDragonExp(attackPlayerDoc, attackPlayerData, attackDragon, countData.attackDragonExpAdd)
						attackPlayerData.push(["dragons." + attackDragon.type + ".hp", attackDragon.hp])
						attackPlayerData.push(["dragons." + attackDragon.type + ".hpRefreshTime", attackDragon.hpRefreshTime])
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, report.reportForAttackPlayer])

						var attackMonsterMarchReturnEvent = MarchUtils.createAttackMonsterMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackDragon, attackSoldiers, attackWoundedSoldiers, attackPlayerRewards, event.defenceMonsterData, event.fromAlliance, event.toAlliance)
						pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', attackMonsterMarchReturnEvent]);
						attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(attackMonsterMarchReturnEvent)
						attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(attackMonsterMarchReturnEvent), attackMonsterMarchReturnEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", attackMonsterMarchReturnEvent.id, attackMonsterMarchReturnEvent.arriveTime - Date.now()])
						if(_.isEqual(Consts.FightResult.AttackWin, defenceSoldierFightData.fightResult)){
							defenceAllianceData.push(['monsters.' + defenceAllianceDoc.monsters.indexOf(defenceMonster), null])
							var defenceMonsterMapObject = _.find(defenceAllianceDoc.mapObjects, function(mapObject){
								return _.isEqual(mapObject.id, defenceMonster.id);
							})
							defenceAllianceData.push(['mapObjects.' + defenceAllianceDoc.mapObjects.indexOf(defenceMonsterMapObject), null])
							LogicUtils.removeItemInArray(defenceAllianceDoc.monsters, defenceMonster)
							LogicUtils.removeItemInArray(defenceAllianceDoc.mapObjects, defenceMonsterMapObject)
							var monsterKey = DataUtils.getMonsterScoreConditionKey(defenceMonster.level);
							self.activityService.addPlayerActivityScore(attackPlayerDoc, attackPlayerData, 'attackMonster', monsterKey, 1);
							self.activityService.addAllianceActivityScoreByDoc(attackAllianceDoc, attackAllianceData, 'attackMonster', monsterKey, 1);
						}

						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData]);
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
						if(defenceAllianceDoc !== attackAllianceDoc){
							pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData]);
						}
						return Promise.resolve();
					}
				}).then(function(){
					callback()
				}).catch(function(e){
					callback(e)
				})
			})
		}
		else{
			return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, event.marchType, eventId));
		}
	}).then(function(){
		pushFuncs.push([self.cacheService, self.cacheService.removeMarchEventAsync, 'attackMarchEvents', event])
		attackAllianceData.push(["marchEvents.attackMarchEvents." + attackAllianceDoc.marchEvents.attackMarchEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(attackAllianceDoc.marchEvents.attackMarchEvents, event)
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 进攻返回玩家城市事件回调
 * @param allianceId
 * @param eventId
 * @param callback
 */
pro.onAttackMarchReturnEvents = function(allianceId, eventId, callback){
	var self = this
	var allianceDoc = null;
	var allianceData = [];
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	var pushFuncs = []
	var event = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc;
		event = LogicUtils.getObjectById(allianceDoc.marchEvents.attackMarchReturnEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchReturnEvents', eventId));
		return self.cacheService.findPlayerAsync(event.attackPlayerData.id);
	}).then(function(doc){
		playerDoc = doc;
		event = LogicUtils.getObjectById(allianceDoc.marchEvents.attackMarchReturnEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'attackMarchReturnEvents', eventId));
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var dragonType = event.attackPlayerData.dragon.type
		var dragon = playerDoc.dragons[dragonType]
		DataUtils.refreshPlayerDragonsHp(playerDoc, dragon)
		dragon.status = Consts.DragonStatus.Free
		playerData.push(["dragons." + dragonType + ".hp", dragon.hp])
		playerData.push(["dragons." + dragonType + ".hpRefreshTime", dragon.hpRefreshTime])
		playerData.push(["dragons." + dragonType + ".status", dragon.status])
		LogicUtils.removePlayerTroopOut(playerDoc, playerData, dragonType);
		LogicUtils.addPlayerSoldiers(playerDoc, playerData, event.attackPlayerData.soldiers);
		DataUtils.addPlayerWoundedSoldiers(playerDoc, playerData, event.attackPlayerData.woundedSoldiers);
		DataUtils.refreshPlayerPower(playerDoc, playerData);
		DataUtils.refreshPlayerResources(playerDoc);
		playerData.push(["resources", playerDoc.resources])

		pushFuncs.push([self.cacheService, self.cacheService.removeMarchEventAsync, 'attackMarchReturnEvents', event]);
		allianceData.push(["marchEvents.attackMarchReturnEvents." + allianceDoc.marchEvents.attackMarchReturnEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(allianceDoc.marchEvents.attackMarchReturnEvents, event)
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'onAttackMarchReturnEvents', null, event.attackPlayerData.rewards, false])
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 突袭行军事件回调
 * @param allianceId
 * @param eventId
 * @param callback
 */
pro.onStrikeMarchEvents = function(allianceId, eventId, callback){
	var self = this
	var attackAllianceDoc = null
	var attackAllianceData = []
	var attackPlayerDoc = null
	var attackPlayerData = []
	var defencePlayerDoc = null
	var defenceAllianceDoc = null
	var defenceAllianceData = []
	var helpDefencePlayerDoc = null
	var helpDefencePlayerData = []
	var lockPairs = [];
	var eventFuncs = []
	var pushFuncs = [];
	var event = null;
	var deathEvent = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		attackAllianceDoc = doc;
		event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.strikeMarchEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'strikeMarchEvents', eventId));
	}).then(function(){
		if(_.isEqual(event.marchType, Consts.MarchType.City)){
			return Promise.fromCallback(function(callback){
				var defencePlayer = null
				var isInAllianceFight = null;
				var strikeMarchReturnEvent = null;
				var helpedByTroopCheckUsed = null;
				var funcs = []
				funcs.push(self.cacheService.findPlayerAsync(event.attackPlayerData.id))
				funcs.push(self.cacheService.findPlayerAsync(event.defencePlayerData.id))
				funcs.push(self.cacheService.findAllianceAsync(event.toAlliance.id))
				Promise.all(funcs).spread(function(doc_1, doc_2, doc_3){
					attackPlayerDoc = doc_1
					defencePlayerDoc = doc_2
					defenceAllianceDoc = doc_3
					if(!!defencePlayerDoc.helpedByTroop){
						helpedByTroopCheckUsed = Utils.clone(defencePlayerDoc.helpedByTroop);
						return self.cacheService.findPlayerAsync(defencePlayerDoc.helpedByTroop.id).then(function(doc){
							helpDefencePlayerDoc = doc
						})
					}
				}).then(function(){
					event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.strikeMarchEvents, eventId);
					if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'strikeMarchEvents', eventId));
					if(helpDefencePlayerDoc && !_.isEqual(helpedByTroopCheckUsed, defencePlayerDoc.helpedByTroop)){
						helpDefencePlayerDoc = null;
					}
					if(!defenceAllianceDoc || event.toAlliance.mapIndex !== defenceAllianceDoc.mapIndex) return Promise.resolve(false);
					var defencePlayerMapObject = LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id);
					if(!defencePlayerMapObject || !_.isEqual(defencePlayerMapObject.location, event.toAlliance.location)) return Promise.resolve(false);
					defencePlayer = LogicUtils.getObjectById(defenceAllianceDoc.members, defencePlayerDoc._id)
					if(attackAllianceDoc.basicInfo.status === Consts.AllianceStatus.Fight){
						var enemyAllianceId = LogicUtils.getEnemyAllianceId(attackAllianceDoc.allianceFight, attackAllianceDoc._id);
						isInAllianceFight = enemyAllianceId === defenceAllianceDoc._id
					}
					return Promise.resolve(true);
				}).then(function(defencePlayerExist){
					if(!defencePlayerExist){
						lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
						var titleKey = DataUtils.getLocalizationConfig("alliance", "AttackMissTitle");
						var contentKey = DataUtils.getLocalizationConfig("alliance", "AttackMissContent");
						var fullLocation = MarchUtils.getLocationFromAllianceData(event.toAlliance);
						var contentParams = [event.toAlliance.tag, event.defencePlayerData.name, fullLocation.x, fullLocation.y];
						pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, attackPlayerDoc._id, titleKey, [], contentKey, contentParams, []]);

						strikeMarchReturnEvent = MarchUtils.createStrikePlayerCityMarchReturnEvent(attackPlayerDoc, attackPlayerDoc.dragons[event.attackPlayerData.dragon.type], event.defencePlayerData, event.fromAlliance, event.toAlliance)
						pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'strikeMarchReturnEvents', strikeMarchReturnEvent]);
						attackAllianceDoc.marchEvents.strikeMarchReturnEvents.push(strikeMarchReturnEvent)
						attackAllianceData.push(["marchEvents.strikeMarchReturnEvents." + attackAllianceDoc.marchEvents.strikeMarchReturnEvents.indexOf(strikeMarchReturnEvent), strikeMarchReturnEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "strikeMarchReturnEvents", strikeMarchReturnEvent.id, strikeMarchReturnEvent.arriveTime - Date.now()])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
					}
					else{
						lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
						lockPairs.push({key:Consts.Pairs.Alliance, value:defenceAllianceDoc._id});
						lockPairs.push({key:Consts.Pairs.Player, value:attackPlayerDoc._id});
						lockPairs.push({key:Consts.Pairs.Player, value:defencePlayerDoc._id});
						if(!!helpDefencePlayerDoc) lockPairs.push({key:Consts.Pairs.Player, value:helpDefencePlayerDoc._id});
						if(isInAllianceFight){
							var allianceFight = attackAllianceDoc.allianceFight = defenceAllianceDoc.allianceFight;
							var allianceFightData = [];
							var attacker = null;
							var attackerString = null;
							if(_.isEqual(attackAllianceDoc._id, attackAllianceDoc.allianceFight.attacker.alliance.id)){
								attacker = allianceFight.attacker;
								attackerString = 'attacker';
							}else{
								attacker = allianceFight.defencer;
								attackerString = 'defencer';
							}
						}

						var attackDragon = attackPlayerDoc.dragons[event.attackPlayerData.dragon.type]
						DataUtils.refreshPlayerDragonsHp(attackPlayerDoc, attackDragon)
						var report = null
						if(_.isObject(helpDefencePlayerDoc)){
							var helpDefenceDragon = helpDefencePlayerDoc.dragons[defencePlayerDoc.helpedByTroop.dragon.type]
							DataUtils.refreshPlayerDragonsHp(defencePlayerDoc, helpDefenceDragon)
							report = ReportUtils.createStrikeCityFightWithHelpDefenceDragonReport(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc, defencePlayerDoc, helpDefencePlayerDoc, helpDefenceDragon)
							pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, report.reportForAttackPlayer])
							pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, helpDefencePlayerDoc._id, report.reportForDefencePlayer])
							var helpDefenceTitle = DataUtils.getLocalizationConfig("alliance", "HelpDefenceStrikeTitle")
							var helpDefenceContent = DataUtils.getLocalizationConfig("alliance", "HelpDefenceStrikeContent")
							var helpDefenceParams = [defenceAllianceDoc.basicInfo.tag, helpDefencePlayerDoc.basicInfo.name]
							pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, defencePlayerDoc._id, helpDefenceTitle, helpDefenceParams, helpDefenceContent, helpDefenceParams, []])

							attackDragon.hp -= report.reportForAttackPlayer.strikeCity.attackPlayerData.dragon.hpDecreased
							if(attackDragon.hp <= 0){
								deathEvent = DataUtils.createPlayerDragonDeathEvent(attackPlayerDoc, attackDragon)
								attackPlayerDoc.dragonDeathEvents.push(deathEvent)
								attackPlayerData.push(["dragonDeathEvents." + attackPlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
								eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, attackPlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
							}
							attackPlayerData.push(["dragons." + attackDragon.type + ".hp", attackDragon.hp])
							attackPlayerData.push(["dragons." + attackDragon.type + ".hpRefreshTime", attackDragon.hpRefreshTime])
							pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, helpDefencePlayerDoc, helpDefencePlayerData])

							if(isInAllianceFight){
								attacker.allianceCountData.strikeCount += 1;
								allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.strikeCount', attacker.allianceCountData.strikeCount]);
								if(report.powerCompare >= 1){
									attacker.allianceCountData.strikeSuccessCount += 1;
									allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.strikeSuccessCount', attacker.allianceCountData.strikeSuccessCount]);
								}
								attackAllianceData = attackAllianceData.concat(allianceFightData);
								defenceAllianceData = defenceAllianceData.concat(allianceFightData);
							}
							if(report.powerCompare >= 1){
								attackPlayerDoc.basicInfo.strikeWin += 1
								attackPlayerData.push(["basicInfo.strikeWin", attackPlayerDoc.basicInfo.strikeWin])
								TaskUtils.finishStrikeWinTaskIfNeed(attackPlayerDoc, attackPlayerData)
							}
						}

						if(attackDragon.hp <= 0){
							strikeMarchReturnEvent = MarchUtils.createStrikePlayerCityMarchReturnEvent(attackPlayerDoc, attackDragon, event.defencePlayerData, event.fromAlliance, event.toAlliance);
							pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'strikeMarchReturnEvents', strikeMarchReturnEvent]);
							attackAllianceDoc.marchEvents.strikeMarchReturnEvents.push(strikeMarchReturnEvent)
							attackAllianceData.push(["marchEvents.strikeMarchReturnEvents." + attackAllianceDoc.marchEvents.strikeMarchReturnEvents.indexOf(strikeMarchReturnEvent), strikeMarchReturnEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "strikeMarchReturnEvents", strikeMarchReturnEvent.id, strikeMarchReturnEvent.arriveTime - Date.now()])
							pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
							pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData])
						}else{
							DataUtils.refreshPlayerResources(defencePlayerDoc)
							var defenceDragon = LogicUtils.getPlayerDefenceDragon(defencePlayerDoc)
							if(!_.isObject(defenceDragon)){
								report = ReportUtils.createStrikeCityNoDefenceDragonReport(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc, defencePlayerDoc)
								pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, report.reportForAttackPlayer])
								pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, defencePlayerDoc._id, report.reportForDefencePlayer])
								pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData])

								strikeMarchReturnEvent = MarchUtils.createStrikePlayerCityMarchReturnEvent(attackPlayerDoc, attackDragon, event.defencePlayerData, event.fromAlliance, event.toAlliance);
								pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'strikeMarchReturnEvents', strikeMarchReturnEvent]);
								attackAllianceDoc.marchEvents.strikeMarchReturnEvents.push(strikeMarchReturnEvent)
								attackAllianceData.push(["marchEvents.strikeMarchReturnEvents." + attackAllianceDoc.marchEvents.strikeMarchReturnEvents.indexOf(strikeMarchReturnEvent), strikeMarchReturnEvent])
								eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "strikeMarchReturnEvents", strikeMarchReturnEvent.id, strikeMarchReturnEvent.arriveTime - Date.now()])

								if(isInAllianceFight){
									attacker.allianceCountData.strikeCount += 1;
									allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.strikeCount', attacker.allianceCountData.strikeCount]);
									attacker.allianceCountData.strikeSuccessCount += 1;
									allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.strikeSuccessCount', attacker.allianceCountData.strikeSuccessCount]);
									attackAllianceData = attackAllianceData.concat(allianceFightData);
									defenceAllianceData = defenceAllianceData.concat(allianceFightData);
								}
								attackPlayerDoc.basicInfo.strikeWin += 1
								attackPlayerData.push(["basicInfo.strikeWin", attackPlayerDoc.basicInfo.strikeWin])
								TaskUtils.finishStrikeWinTaskIfNeed(attackPlayerDoc, attackPlayerData)

								pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
								pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData])
							}else{
								report = ReportUtils.createStrikeCityFightWithDefenceDragonReport(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc, defencePlayerDoc, defenceDragon)
								pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, report.reportForAttackPlayer])
								pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, defencePlayerDoc._id, report.reportForDefencePlayer])
								pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData])

								attackDragon.hp -= report.reportForAttackPlayer.strikeCity.attackPlayerData.dragon.hpDecreased
								if(attackDragon.hp <= 0){
									deathEvent = DataUtils.createPlayerDragonDeathEvent(attackPlayerDoc, attackDragon)
									attackPlayerDoc.dragonDeathEvents.push(deathEvent)
									attackPlayerData.push(["dragonDeathEvents." + attackPlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
									eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, attackPlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
								}
								attackPlayerData.push(["dragons." + attackDragon.type + ".hp", attackDragon.hp])
								attackPlayerData.push(["dragons." + attackDragon.type + ".hpRefreshTime", attackDragon.hpRefreshTime])

								strikeMarchReturnEvent = MarchUtils.createStrikePlayerCityMarchReturnEvent(attackPlayerDoc, attackDragon, event.defencePlayerData, event.fromAlliance, event.toAlliance);
								pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'strikeMarchReturnEvents', strikeMarchReturnEvent]);
								attackAllianceDoc.marchEvents.strikeMarchReturnEvents.push(strikeMarchReturnEvent)
								attackAllianceData.push(["marchEvents.strikeMarchReturnEvents." + attackAllianceDoc.marchEvents.strikeMarchReturnEvents.indexOf(strikeMarchReturnEvent), strikeMarchReturnEvent])
								eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "strikeMarchReturnEvents", strikeMarchReturnEvent.id, strikeMarchReturnEvent.arriveTime - Date.now()])
								if(isInAllianceFight){
									attacker.allianceCountData.strikeCount += 1;
									allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.strikeCount', attacker.allianceCountData.strikeCount]);
									if(report.powerCompare >= 1){
										attacker.allianceCountData.strikeSuccessCount += 1;
										allianceFightData.push(['allianceFight.' + attackerString + '.allianceCountData.strikeSuccessCount', attacker.allianceCountData.strikeSuccessCount]);
									}
									attackAllianceData = attackAllianceData.concat(allianceFightData);
									defenceAllianceData = defenceAllianceData.concat(allianceFightData);
								}
								if(report.powerCompare >= 1){
									attackPlayerDoc.basicInfo.strikeWin += 1
									attackPlayerData.push(["basicInfo.strikeWin", attackPlayerDoc.basicInfo.strikeWin])
									TaskUtils.finishStrikeWinTaskIfNeed(attackPlayerDoc, attackPlayerData)
								}
								pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
								pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData])
							}
						}
					}
				}).then(function(){
					callback();
				}).catch(function(e){
					callback(e);
				})
			})
		}
		else if(_.isEqual(event.marchType, Consts.MarchType.Village)){
			return Promise.fromCallback(function(callback){
				var villageEvent = null
				var village = null
				var report = null
				var marchReturnEvent = null
				var villageAllianceDoc = null;
				var villageCheckUsed = null;
				self.cacheService.findPlayerAsync(event.attackPlayerData.id).then(function(doc){
					attackPlayerDoc = doc
					if(event.fromAlliance.id !== event.toAlliance.id){
						return self.cacheService.findAllianceAsync(event.toAlliance.id).then(function(doc){
							defenceAllianceDoc = doc
							if(!defenceAllianceDoc || event.toAlliance.mapIndex !== defenceAllianceDoc.mapIndex) return Promise.resolve();
							village = LogicUtils.getAllianceVillageById(defenceAllianceDoc, event.defenceVillageData.id)
							if(!!village){
								villageCheckUsed = Utils.clone(village);
							}
							return Promise.resolve()
						})
					}else{
						defenceAllianceDoc = attackAllianceDoc;
						village = LogicUtils.getAllianceVillageById(defenceAllianceDoc, event.defenceVillageData.id)
						if(!!village){
							villageCheckUsed = Utils.clone(village);
						}
						return Promise.resolve()
					}
				}).then(function(){
					event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.strikeMarchEvents, eventId);
					if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'strikeMarchEvents', eventId));
					if(!village || !village.villageEvent || (village.villageEvent && village.villageEvent.allianceId === event.fromAlliance.id)) return Promise.resolve();
					if(village.villageEvent.allianceId === event.toAlliance.id){
						villageEvent = _.find(defenceAllianceDoc.villageEvents, function(villageEvent){
							return villageEvent.id === village.villageEvent.eventId;
						})
						return self.cacheService.findPlayerAsync(villageEvent.playerData.id).then(function(doc){
							defencePlayerDoc = doc;
							return Promise.resolve();
						})
					}else{
						return self.cacheService.findAllianceAsync(village.villageEvent.allianceId).then(function(doc){
							villageAllianceDoc = doc;
							villageEvent = _.find(villageAllianceDoc.villageEvents, function(villageEvent){
								return villageEvent.id === village.villageEvent.eventId;
							})
							return self.cacheService.findPlayerAsync(villageEvent.playerData.id).then(function(doc){
								defencePlayerDoc = doc;
								return Promise.resolve();
							})
						})
					}
				}).then(function(){
					event = LogicUtils.getObjectById(attackAllianceDoc.marchEvents.strikeMarchEvents, eventId);
					if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'strikeMarchEvents', eventId));
					village = LogicUtils.getAllianceVillageById(defenceAllianceDoc, event.defenceVillageData.id);
					if(!village || !_.isEqual(village, villageCheckUsed)){
						village = null;
					}
					if(!village || !villageEvent){
						lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id})
						var titleKey = null;
						var contentKey = null;
						var fullLocation = MarchUtils.getLocationFromAllianceData(event.toAlliance);
						var contentParams = [event.toAlliance.tag, '__' + event.defenceVillageData.name, fullLocation.x, fullLocation.y];
						if(!village){
							titleKey = DataUtils.getLocalizationConfig("alliance", "AttackMissTitle");
							contentKey = DataUtils.getLocalizationConfig("alliance", "AttackMissContent");
						}else if(!village.villageEvent){
							titleKey = DataUtils.getLocalizationConfig("alliance", "StrikeVillageMissTitle");
							contentKey = DataUtils.getLocalizationConfig("alliance", "StrikeVillageMissContent");
						}else{
							titleKey = DataUtils.getLocalizationConfig("alliance", "CollectFailedTitle");
							contentKey = DataUtils.getLocalizationConfig("alliance", "CollectFailedContent");
						}
						pushFuncs.push([self.dataService, self.dataService.sendSysMailAsync, attackPlayerDoc._id, titleKey, [], contentKey, contentParams, []]);

						marchReturnEvent = MarchUtils.createStrikeVillageMarchReturnEvent(attackPlayerDoc, attackPlayerDoc.dragons[event.attackPlayerData.dragon.type], event.defenceVillageData, event.fromAlliance, event.toAlliance);
						pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'strikeMarchReturnEvents', marchReturnEvent]);
						attackAllianceDoc.marchEvents.strikeMarchReturnEvents.push(marchReturnEvent)
						attackAllianceData.push(["marchEvents.strikeMarchReturnEvents." + attackAllianceDoc.marchEvents.strikeMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "strikeMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
					}
					else{
						lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
						lockPairs.push({key:Consts.Pairs.Player, value:attackPlayerDoc._id});
						var attackDragon = attackPlayerDoc.dragons[event.attackPlayerData.dragon.type]
						var defenceDragon = defencePlayerDoc.dragons[villageEvent.playerData.dragon.type]
						report = ReportUtils.createStrikeVillageFightWithDefencePlayerDragonReport(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc, village, !!villageAllianceDoc ? villageAllianceDoc : defenceAllianceDoc, villageEvent, defencePlayerDoc, defenceDragon)
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, report.reportForAttackPlayer])
						pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, defencePlayerDoc._id, report.reportForDefencePlayer])
						attackDragon.hp -= report.reportForAttackPlayer.strikeVillage.attackPlayerData.dragon.hpDecreased
						if(attackDragon.hp <= 0){
							deathEvent = DataUtils.createPlayerDragonDeathEvent(attackPlayerDoc, attackDragon)
							attackPlayerDoc.dragonDeathEvents.push(deathEvent)
							attackPlayerData.push(["dragonDeathEvents." + attackPlayerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
							eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, attackPlayerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
						}
						attackPlayerData.dragons = {}
						attackPlayerData.dragons[attackDragon.type] = attackPlayerDoc.dragons[attackDragon.type]

						pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData])
						marchReturnEvent = MarchUtils.createStrikeVillageMarchReturnEvent(attackPlayerDoc, attackDragon, event.defenceVillageData, event.fromAlliance, event.toAlliance);
						pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'strikeMarchReturnEvents', marchReturnEvent]);
						attackAllianceDoc.marchEvents.strikeMarchReturnEvents.push(marchReturnEvent)
						attackAllianceData.push(["marchEvents.strikeMarchReturnEvents." + attackAllianceDoc.marchEvents.strikeMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "strikeMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
						pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
					}
				}).then(function(){
					callback();
				}).catch(function(e){
					callback(e);
				})
			})
		}
		else{
			return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, event.marchType, eventId));
		}
	}).then(function(){
		pushFuncs.push([self.cacheService, self.cacheService.removeMarchEventAsync, 'strikeMarchEvents', event])
		attackAllianceData.push(["marchEvents.strikeMarchEvents." + attackAllianceDoc.marchEvents.strikeMarchEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(attackAllianceDoc.marchEvents.strikeMarchEvents, event)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs);
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 突袭返回玩家城市事件回调
 * @param allianceId
 * @param eventId
 * @param callback
 */
pro.onStrikeMarchReturnEvents = function(allianceId, eventId, callback){
	var self = this
	var allianceDoc = null;
	var allianceData = [];
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var pushFuncs = []
	var event = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc;
		event = LogicUtils.getObjectById(allianceDoc.marchEvents.strikeMarchReturnEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'strikeMarchReturnEvents', eventId));
		return self.cacheService.findPlayerAsync(event.attackPlayerData.id);
	}).then(function(doc){
		playerDoc = doc;
		event = LogicUtils.getObjectById(allianceDoc.marchEvents.strikeMarchReturnEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'strikeMarchReturnEvents', eventId));
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var dragonType = event.attackPlayerData.dragon.type
		var dragon = playerDoc.dragons[dragonType]
		DataUtils.refreshPlayerDragonsHp(playerDoc, dragon)
		dragon.status = Consts.DragonStatus.Free
		playerData.push(["dragons." + dragonType + ".hp", dragon.hp])
		playerData.push(["dragons." + dragonType + ".hpRefreshTime", dragon.hpRefreshTime])
		playerData.push(["dragons." + dragonType + ".status", dragon.status])

		pushFuncs.push([self.cacheService, self.cacheService.removeMarchEventAsync, 'strikeMarchReturnEvents', event]);
		allianceData.push(["marchEvents.strikeMarchReturnEvents." + allianceDoc.marchEvents.strikeMarchReturnEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(allianceDoc.marchEvents.strikeMarchReturnEvents, event)
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 联盟圣地事件回调
 * @param allianceId
 * @param eventId
 * @param callback
 */
pro.onShrineEvents = function(allianceId, eventId, callback){
	var self = this
	var allianceDoc = null;
	var allianceData = []
	var lockPairs = [];
	var eventFuncs = []
	var pushFuncs = []
	var event = null;
	var deathEvent = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		event = LogicUtils.getObjectById(allianceDoc.shrineEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'shrineEvents', eventId));
		if(event.playerTroops.length == 0){
			lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
			var shrineReport = ReportUtils.createAttackShrineEmptyReport(event.stageName);
			if(allianceDoc.shrineReports.length >= Define.AllianceShrineReportsMaxSize){
				var willRemovedshrineReport = allianceDoc.shrineReports[0]
				allianceData.push(["shrineReports." + allianceDoc.shrineReports.indexOf(willRemovedshrineReport), null])
				LogicUtils.removeItemInArray(allianceDoc.shrineReports, willRemovedshrineReport)
			}
			allianceDoc.shrineReports.push(shrineReport)
			allianceData.push(["shrineReports." + allianceDoc.shrineReports.indexOf(shrineReport), shrineReport])
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
		}
		else{
			var playerDocs = {}
			var playerTroopsForFight = []
			lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
			_.each(event.playerTroops, function(playerTroop){
				lockPairs.push({key:Consts.Pairs.Player, value:playerTroop.id});
			})
			var findPlayerDoc = function(playerId){
				return self.cacheService.findPlayerAsync(playerId).then(function(doc){
					playerDocs[doc._id] = doc
				})
			}
			var funcs = []
			_.each(event.playerTroops, function(playerTroop){
				funcs.push(findPlayerDoc(playerTroop.id))
			})
			return Promise.all(funcs).then(function(){
				event = LogicUtils.getObjectById(allianceDoc.shrineEvents, eventId);
				if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'shrineEvents', eventId));
				_.each(event.playerTroops, function(playerTroop){
					var playerDoc = playerDocs[playerTroop.id]
					playerTroop.playerDoc = playerDoc
					var dragon = playerDoc.dragons[playerTroop.dragon.type]
					DataUtils.refreshPlayerDragonsHp(playerDoc, dragon)
					var dragonForFight = DataUtils.createPlayerDragonForFight(allianceDoc, playerDoc, dragon, allianceDoc.basicInfo.terrain)
					var soldiersForFight = DataUtils.createPlayerSoldiersForFight(playerDoc, playerTroop.soldiers, dragon, dragonForFight)
					var playerTroopForFight = {
						playerDoc:playerDoc,
						playerDragon:dragon,
						dragonForFight:dragonForFight,
						soldiers:playerTroop.soldiers,
						soldiersForFight:soldiersForFight,
						woundedSoldierPercent:DataUtils.getPlayerWoundedSoldierPercent(playerDocs[playerTroop.id], dragon)
					}
					playerTroopsForFight.push(playerTroopForFight)
				})

				var fightDatas = {};
				while(playerTroopsForFight.length > 0){
					var playerTroopForFight = playerTroopsForFight[0]
					var stageTroopForFight = DataUtils.getAllianceShrineStageTroop(allianceDoc, event.stageName);
					var dragonFightFixedEffect = DataUtils.getFightFixedEffect(playerTroopForFight.playerDoc, playerTroopForFight.soldiers, null, stageTroopForFight.soldiers);
					var dragonFightData = FightUtils.dragonToDragonFight(playerTroopForFight.dragonForFight, stageTroopForFight.dragonForFight, dragonFightFixedEffect.dragon)
					var soldierFightData = FightUtils.soldierToSoldierFight(dragonFightData.attackDragonAfterFight, playerTroopForFight.soldiersForFight, playerTroopForFight.woundedSoldierPercent + dragonFightFixedEffect.soldier.attackSoldierEffect, null, stageTroopForFight.soldiersForFight, 0)

					LogicUtils.removeItemInArray(playerTroopsForFight, playerTroopForFight)
					LogicUtils.resetFightSoldiersByFightResult(playerTroopForFight.soldiersForFight, soldierFightData.attackSoldiersAfterFight)
					fightDatas[playerTroopForFight.playerDoc._id] = {
						playerDoc:playerTroopForFight.playerDoc,
						dragonFightData:dragonFightData,
						soldierFightData:soldierFightData
					}
				}

				var report = ReportUtils.createAttackShrineReport(allianceDoc, event.stageName, event.playerTroops, fightDatas)
				//console.log(NodeUtils.inspect(report, false, null))
				var shrineReport = report.shrineReport;
				var isWin = report.isWin;
				if(allianceDoc.shrineReports.length >= Define.AllianceShrineReportsMaxSize){
					var willRemovedshrineReport = allianceDoc.shrineReports[0]
					allianceData.push(["shrineReports." + allianceDoc.shrineReports.indexOf(willRemovedshrineReport), null])
					LogicUtils.removeItemInArray(allianceDoc.shrineReports, willRemovedshrineReport)
				}
				allianceDoc.shrineReports.push(shrineReport)
				allianceData.push(["shrineReports." + allianceDoc.shrineReports.indexOf(shrineReport), shrineReport])
				allianceDoc.basicInfo.honour += report.allianceHonourGet;
				allianceData.push(["basicInfo.honour", allianceDoc.basicInfo.honour])
				if(isWin){
					var stageData = LogicUtils.getAllianceShrineStageData(allianceDoc, event.stageName)
					if(!stageData){
						stageData = {stageName:event.stageName}
						allianceDoc.shrineDatas.push(stageData)
						allianceData.push(["shrineDatas." + allianceDoc.shrineDatas.indexOf(stageData), stageData])
					}
				}

				_.each(event.playerTroops, function(playerTroop){
					var playerId = playerTroop.id;
					var playerDoc = playerTroop.playerDoc;
					var playerReport = report.playerFullReports[playerId];
					var soldiers = report.playerSoldiers[playerId].soldiers;
					var woundedSoldiers = report.playerSoldiers[playerId].woundedSoldiers;
					var rewards = report.playerRewards[playerId];
					var kill = report.playerKills[playerId];
					var dragon = playerDoc.dragons[playerTroop.dragon.type];
					var dragonHpDecreased = report.playerDragons[playerId].hpDecreased;
					var dragonExpAdd = report.playerDragons[playerId].expAdd;
					var playerData = [];

					playerDoc.basicInfo.kill += kill
					playerData.push(["basicInfo.kill", playerDoc.basicInfo.kill])
					TaskUtils.finishPlayerKillTaskIfNeed(playerDoc, playerData)
					dragon.hp -= dragonHpDecreased
					if(dragon.hp <= 0){
						deathEvent = DataUtils.createPlayerDragonDeathEvent(playerDoc, dragon)
						playerDoc.dragonDeathEvents.push(deathEvent)
						playerData.push(["dragonDeathEvents." + playerDoc.dragonDeathEvents.indexOf(deathEvent), deathEvent])
						eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
					}
					DataUtils.addPlayerDragonExp(playerDoc, playerData, dragon, dragonExpAdd)
					playerData.push(["dragons." + dragon.type + ".hp", dragon.hp])
					playerData.push(["dragons." + dragon.type + ".hpRefreshTime", dragon.hpRefreshTime])
					pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
					pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, playerDoc._id, playerReport])

					var marchReturnEvent = MarchUtils.createAttackAllianceShrineMarchReturnEvent(allianceDoc, playerDoc, dragon, soldiers, woundedSoldiers, rewards)
					pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
					allianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
					allianceData.push(["marchEvents.attackMarchReturnEvents." + allianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
					eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, allianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])
				})
				pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
			})
		}
	}).then(function(){
		allianceData.push(["shrineEvents." + allianceDoc.shrineEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(allianceDoc.shrineEvents, event)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 村落采集事件回调
 * @param allianceId
 * @param eventId
 * @param callback
 */
pro.onVillageEvents = function(allianceId, eventId, callback){
	var self = this
	var attackPlayerDoc = null
	var attackPlayerData = [];
	var attackAllianceDoc = null
	var attackAllianceData = []
	var defenceAllianceDoc = null
	var defenceAllianceData = null
	var lockPairs = [];
	var eventFuncs = []
	var pushFuncs = []
	var event = null;
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		attackAllianceDoc = doc;
		event = LogicUtils.getObjectById(attackAllianceDoc.villageEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'villageEvents', eventId));
		return self.cacheService.findPlayerAsync(event.playerData.id);
	}).then(function(doc){
		attackPlayerDoc = doc;
		event = LogicUtils.getObjectById(attackAllianceDoc.villageEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'villageEvents', eventId));
		if(event.fromAlliance.id !== event.toAlliance.id){
			return self.cacheService.findAllianceAsync(event.toAlliance.id).then(function(doc){
				defenceAllianceDoc = doc
				defenceAllianceData = []
			})
		}else{
			defenceAllianceDoc = attackAllianceDoc
			defenceAllianceData = attackAllianceData
		}
	}).then(function(){
		event = LogicUtils.getObjectById(attackAllianceDoc.villageEvents, eventId);
		if(!event) return Promise.reject(ErrorUtils.allianceEventNotExist(allianceId, 'villageEvents', eventId));
		lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id});
		if(attackAllianceDoc !== defenceAllianceDoc) lockPairs.push({
			key:Consts.Pairs.Alliance,
			value:defenceAllianceDoc._id
		});
	}).then(function(){
		var village = LogicUtils.getAllianceVillageById(defenceAllianceDoc, event.villageData.id)
		village.villageEvent = null;
		var resourceName = village.name.slice(0, -7)
		var rewards = [{
			type:"resources",
			name:resourceName,
			count:event.villageData.collectTotal
		}]
		LogicUtils.mergeRewards(event.playerData.rewards, rewards)
		_.each(event.playerData.rewards, function(reward){
			if(_.contains(Consts.BasicResource, reward.name) || reward.name === 'coin'){
				self.activityService.addPlayerActivityScore(attackPlayerDoc, attackPlayerData, 'collectResource', 'collectOne_' + reward.name, reward.count);
				self.activityService.addAllianceActivityScoreByDoc(attackAllianceDoc, attackAllianceData, 'collectResource', 'collectOne_' + reward.name, reward.count);
			}else if(reward.name === 'blood'){
				self.activityService.addPlayerActivityScore(attackPlayerDoc, attackPlayerData, 'collectHeroBlood', 'getOneBlood', reward.count);
				self.activityService.addAllianceActivityScoreByDoc(attackAllianceDoc, attackAllianceData, 'collectHeroBlood', 'getOneBlood', reward.count);
			}
		})
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, attackPlayerDoc, attackPlayerData]);
		var marchReturnEvent = MarchUtils.createAttackVillageMarchReturnEvent(attackAllianceDoc, attackPlayerDoc, attackPlayerDoc.dragons[event.playerData.dragon.type], event.playerData.soldiers, event.playerData.woundedSoldiers, event.playerData.rewards, event.villageData, event.fromAlliance, event.toAlliance);
		pushFuncs.push([self.cacheService, self.cacheService.addMarchEventAsync, 'attackMarchReturnEvents', marchReturnEvent]);
		attackAllianceDoc.marchEvents.attackMarchReturnEvents.push(marchReturnEvent)
		attackAllianceData.push(["marchEvents.attackMarchReturnEvents." + attackAllianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchReturnEvent), marchReturnEvent])
		eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, "attackMarchReturnEvents", marchReturnEvent.id, marchReturnEvent.arriveTime - Date.now()])

		var collectReport = ReportUtils.createCollectVillageReport(defenceAllianceDoc, village, rewards)
		pushFuncs.push([self.dataService, self.dataService.sendSysReportAsync, attackPlayerDoc._id, collectReport])

		if(event.villageData.collectTotal >= village.resource){
			defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village), null])
			LogicUtils.removeItemInArray(defenceAllianceDoc.villages, village)
			var villageMapObject = LogicUtils.getAllianceMapObjectById(defenceAllianceDoc, village.id)
			defenceAllianceData.push(["mapObjects." + defenceAllianceDoc.mapObjects.indexOf(villageMapObject), null])
			LogicUtils.removeItemInArray(defenceAllianceDoc.mapObjects, villageMapObject)
		}else{
			village.villageEvent = null;
			defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village) + ".villageEvent", village.villageEvent])
			village.resource -= event.villageData.collectTotal
			defenceAllianceData.push(["villages." + defenceAllianceDoc.villages.indexOf(village) + ".resource", village.resource])
		}

		if(attackAllianceDoc !== defenceAllianceDoc){
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData])
		}
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
		pushFuncs.push([self.cacheService, self.cacheService.removeVillageEventAsync, event]);
		attackAllianceData.push(["villageEvents." + attackAllianceDoc.villageEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(attackAllianceDoc.villageEvents, event)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 联盟野怪刷新事件触发
 * @param allianceId
 * @param callback
 */
pro.onMonsterRefreshEvent = function(allianceId, callback){
	var self = this
	var allianceDoc = null;
	var allianceData = []
	var lockPairs = [];
	var eventFuncs = []
	var pushFuncs = []
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc;
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var monsterCount = DataUtils.getAllianceIntInit('monsterCount')
		var monsterMapObjects = _.filter(allianceDoc.mapObjects, function(mapObject){
			return _.isEqual(mapObject.name, 'monster')
		});
		LogicUtils.removeItemsInArray(allianceDoc.mapObjects, monsterMapObjects);
		allianceDoc.monsters.length = 0;

		var mapRound = LogicUtils.getAllianceMapRound(allianceDoc);
		var monsterLevelConfigString = AllianceMap.buff[mapRound].monsterLevel;
		var monsterLevels = monsterLevelConfigString.split('_');
		var monsterLevelMin = parseInt(monsterLevels[0]);
		var monsterLevelMax = parseInt(monsterLevels[1]);

		var buildingConfig = AllianceMap.buildingName['monster'];
		var width = buildingConfig.width
		var height = buildingConfig.height
		var map = MapUtils.buildMap(allianceDoc.basicInfo.terrainStyle, allianceDoc.mapObjects);
		var mapObjects = allianceDoc.mapObjects;
		for(var i = 0; i < monsterCount; i++){
			var monsterLevel = _.random(monsterLevelMin, monsterLevelMax);
			var rect = MapUtils.getRect(map, width, height)
			var monsterConfig = AllianceInitData.monsters[monsterLevel];
			var soldiersConfigStrings = monsterConfig.soldiers.split(';');
			var monsterIndex = _.random(0, soldiersConfigStrings.length - 1);
			if(_.isObject(rect)){
				var monsterMapObject = MapUtils.addMapObject(map, mapObjects, rect, buildingConfig.name)
				var monster = {
					id:monsterMapObject.id,
					level:monsterLevel,
					index:monsterIndex
				}
				allianceDoc.monsters.push(monster)
			}
		}
		var monsterRefreshTime = DataUtils.getMonsterRefreshTime();
		allianceDoc.basicInfo.monsterRefreshTime = Date.now() + monsterRefreshTime;
		eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, allianceDoc, Consts.MonsterRefreshEvent, Consts.MonsterRefreshEvent, monsterRefreshTime]);
		allianceData.push(['basicInfo.monsterRefreshTime', allianceDoc.basicInfo.monsterRefreshTime])
		allianceData.push(['monsters', allianceDoc.monsters])
		allianceData.push(['mapObjects', [].concat(allianceDoc.mapObjects)])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 联盟村落刷新事件触发
 * @param allianceId
 * @param callback
 */
pro.onVillageRefreshEvent = function(allianceId, callback){
	var self = this
	var allianceDoc = null;
	var allianceData = []
	var lockPairs = [];
	var eventFuncs = []
	var pushFuncs = []
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc;
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var removedVillages = [];
		var usedVillageIds = [];
		_.each(allianceDoc.villages, function(village){
			if(!!village.villageEvent){
				usedVillageIds.push(village.id);
			}else{
				removedVillages.push(village);
			}
		})
		LogicUtils.removeItemsInArray(allianceDoc.villages, removedVillages);
		var villageMapObjects = _.filter(allianceDoc.mapObjects, function(mapObject){
			return mapObject.name.slice(-7) === 'Village' && !_.contains(usedVillageIds, mapObject.id);
		})
		LogicUtils.removeItemsInArray(allianceDoc.mapObjects, villageMapObjects);

		var totalCount = DataUtils.getAllianceVillagesTotalCount(allianceDoc);
		var currentCount = allianceDoc.villages.length;
		DataUtils.createAllianceVillage(allianceDoc, [], totalCount - currentCount);

		var villageRefreshTime = DataUtils.getVillageRefreshTime();
		allianceDoc.basicInfo.villageRefreshTime = Date.now() + villageRefreshTime;
		eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, allianceDoc, Consts.VillageRefreshEvent, Consts.VillageRefreshEvent, villageRefreshTime]);

		allianceData.push(['basicInfo.villageRefreshTime', allianceDoc.basicInfo.villageRefreshTime])
		allianceData.push(['villages', allianceDoc.villages])
		allianceData.push(['mapObjects', [].concat(allianceDoc.mapObjects)])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 到达指定时间时,联盟战斗触发的消息
 * @param ourAllianceId
 * @param enemyAllianceId
 * @param callback
 */
pro.onFightTimeEvent = function(ourAllianceId, enemyAllianceId, callback){
	var self = this
	var attackAllianceDoc = null
	var attackAllianceData = [];
	var defenceAllianceDoc = null
	var defenceAllianceData = [];
	var lockPairs = [];
	var pushFuncs = []
	var updateFuncs = []
	var eventFuncs = []
	var funcs = []
	var shouldKickDefenceAlliance = null;
	var shouldKickAttackAlliance = null;
	funcs.push(this.cacheService.findAllianceAsync(ourAllianceId))
	funcs.push(this.cacheService.findAllianceAsync(enemyAllianceId))
	Promise.all(funcs).spread(function(doc_1, doc_2){
		attackAllianceDoc = doc_1
		defenceAllianceDoc = doc_2
		updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, attackAllianceDoc._id])
		updateFuncs.push([self.cacheService, self.cacheService.flushAllianceAsync, defenceAllianceDoc._id])
		var now = Date.now()
		if(_.isEqual(attackAllianceDoc.basicInfo.status, Consts.AllianceStatus.Prepare)){
			lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id})
			lockPairs.push({key:Consts.Pairs.Alliance, value:defenceAllianceDoc._id})
			var statusFinishTime = now + (DataUtils.getAllianceIntInit("allianceFightTotalFightMinutes") * 60 * 1000)
			attackAllianceDoc.basicInfo.status = Consts.AllianceStatus.Fight
			attackAllianceData.push(["basicInfo.status", attackAllianceDoc.basicInfo.status])
			attackAllianceDoc.basicInfo.statusStartTime = now
			attackAllianceData.push(["basicInfo.statusStartTime", attackAllianceDoc.basicInfo.statusStartTime])
			attackAllianceDoc.basicInfo.statusFinishTime = statusFinishTime
			attackAllianceData.push(["basicInfo.statusFinishTime", attackAllianceDoc.basicInfo.statusFinishTime])
			defenceAllianceDoc.basicInfo.status = Consts.AllianceStatus.Fight
			defenceAllianceData.push(["basicInfo.status", defenceAllianceDoc.basicInfo.status])
			defenceAllianceDoc.basicInfo.statusStartTime = now
			defenceAllianceData.push(["basicInfo.statusStartTime", defenceAllianceDoc.basicInfo.statusStartTime])
			defenceAllianceDoc.basicInfo.statusFinishTime = statusFinishTime
			defenceAllianceData.push(["basicInfo.statusFinishTime", defenceAllianceDoc.basicInfo.statusFinishTime])
			pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, attackAllianceDoc.mapIndex, attackAllianceDoc])
			pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, defenceAllianceDoc.mapIndex, defenceAllianceDoc])
			eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceFightTimeEventAsync, attackAllianceDoc, defenceAllianceDoc, statusFinishTime - Date.now()])
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData])
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData])
			pushFuncs.push([self.remotePushService, self.remotePushService.onAllianceFightStart, attackAllianceDoc, defenceAllianceDoc])
		}
		else if(_.isEqual(attackAllianceDoc.basicInfo.status, Consts.AllianceStatus.Fight)){
			var allianceFight = attackAllianceDoc.allianceFight;
			var mapIndex = null;
			var allianceRound = null;
			var targetAllianceRound = null;
			var killMaxPlayer = (function(){
				var maxPlayerKill = null
				var playerKills = allianceFight.attacker.playerKills.concat(allianceFight.defencer.playerKills)
				_.each(playerKills, function(playerKill){
					if(maxPlayerKill == null || maxPlayerKill.kill < playerKill.kill) maxPlayerKill = playerKill
				})
				return maxPlayerKill
			})();
			if(!!killMaxPlayer){
				pushFuncs.push([self.dataService, self.dataService.sendAllianceFightKillMaxRewardsAsync, killMaxPlayer.id]);
			}
			var allianceFightInitHonour = DataUtils.getAllianceIntInit('allianceFightRewardHonour');
			var attackAllianceKill = allianceFight.attacker.allianceCountData.kill
			var defenceAllianceKill = allianceFight.defencer.allianceCountData.kill
			var allianceFightResult = attackAllianceKill >= defenceAllianceKill ? Consts.FightResult.AttackWin : Consts.FightResult.DefenceWin
			var allianceFightHonourTotal = allianceFightInitHonour + ((attackAllianceKill + defenceAllianceKill) * 2)
			var attackAllianceHonourGetPercent = _.isEqual(allianceFightResult, Consts.FightResult.AttackWin) ? 0.7 : 0.3
			var attackAllianceHonourGet = Math.floor(allianceFightHonourTotal * attackAllianceHonourGetPercent)
			var defenceAllianceHonourGet = allianceFightHonourTotal - attackAllianceHonourGet
			shouldKickDefenceAlliance = allianceFightResult === Consts.FightResult.AttackWin && allianceFight.attacker.allianceCountData.routCount >= defenceAllianceDoc.members.length
			shouldKickAttackAlliance = allianceFightResult === Consts.FightResult.DefenceWin && allianceFight.defencer.allianceCountData.routCount >= attackAllianceDoc.members.length
			var attackAllianceFightReport = {
				id:ShortId.generate(),
				attackAllianceId:attackAllianceDoc._id,
				defenceAllianceId:defenceAllianceDoc._id,
				fightResult:allianceFightResult,
				fightTime:now,
				killMax:{
					allianceId:_.isNull(killMaxPlayer) ? null : _.contains(allianceFight.attacker.playerKills, killMaxPlayer) ? attackAllianceDoc._id : defenceAllianceDoc._id,
					playerId:_.isNull(killMaxPlayer) ? null : killMaxPlayer.id,
					playerName:_.isNull(killMaxPlayer) ? null : killMaxPlayer.name
				},
				attackAlliance:{
					name:attackAllianceDoc.basicInfo.name,
					tag:attackAllianceDoc.basicInfo.tag,
					flag:attackAllianceDoc.basicInfo.flag,
					mapIndex:attackAllianceDoc.mapIndex,
					memberCount:allianceFight.attacker.alliance.memberCount,
					kill:attackAllianceKill,
					honour:attackAllianceHonourGet,
					routCount:allianceFight.attacker.allianceCountData.routCount,
					strikeCount:allianceFight.attacker.allianceCountData.strikeCount,
					strikeSuccessCount:allianceFight.attacker.allianceCountData.strikeSuccessCount,
					attackCount:allianceFight.attacker.allianceCountData.attackCount,
					attackSuccessCount:allianceFight.attacker.allianceCountData.attackSuccessCount
				},
				defenceAlliance:{
					name:defenceAllianceDoc.basicInfo.name,
					tag:defenceAllianceDoc.basicInfo.tag,
					flag:defenceAllianceDoc.basicInfo.flag,
					mapIndex:defenceAllianceDoc.mapIndex,
					memberCount:allianceFight.defencer.alliance.memberCount,
					kill:defenceAllianceKill,
					honour:defenceAllianceHonourGet,
					routCount:allianceFight.defencer.allianceCountData.routCount,
					strikeCount:allianceFight.defencer.allianceCountData.strikeCount,
					strikeSuccessCount:allianceFight.defencer.allianceCountData.strikeSuccessCount,
					attackCount:allianceFight.defencer.allianceCountData.attackCount,
					attackSuccessCount:allianceFight.defencer.allianceCountData.attackSuccessCount
				},
				playerDatas:[]
			};
			var defenceAllianceFightReport = Utils.clone(attackAllianceFightReport);
			var getLoyaltyPercent = function(killRank){
				var config = AllianceInitData.allianceFightLoyaltyGet[killRank]
				if(!config){
					config = AllianceInitData.allianceFightLoyaltyGet[AllianceInitData.allianceFightLoyaltyGet.length - 1];
				}
				return config;
			};
			var attackPlayerKills = _.sortBy(allianceFight.attacker.playerKills, function(playerKill){
				return -playerKill.kill;
			});
			var defencePlayerKills = _.sortBy(allianceFight.defencer.playerKills, function(playerKill){
				return -playerKill.kill;
			});
			(function(){
				for(var i = 0; i < attackPlayerKills.length; i++){
					var attackPlayerKill = attackPlayerKills[i];
					var attackLoyaltyConfig = getLoyaltyPercent(i + 1);
					var attackLoyaltyGet = Math.ceil(attackAllianceHonourGet * attackLoyaltyConfig.loyaltyPercent);
					attackAllianceFightReport.playerDatas.push({
						id:attackPlayerKill.id,
						name:attackPlayerKill.name,
						kill:attackPlayerKill.kill,
						loyalty:attackLoyaltyGet
					});
				}
			})();
			(function(){
				for(var i = 0; i < defencePlayerKills.length; i++){
					var defencePlayerKill = defencePlayerKills[i];
					var defenceLoyaltyConfig = getLoyaltyPercent(i + 1);
					var defenceLoyaltyGet = Math.ceil(defenceAllianceHonourGet * defenceLoyaltyConfig.loyaltyPercent);
					defenceAllianceFightReport.playerDatas.push({
						id:defencePlayerKill.id,
						name:defencePlayerKill.name,
						kill:defencePlayerKill.kill,
						loyalty:defenceLoyaltyGet
					});
				}
			})();
			lockPairs.push({key:Consts.Pairs.Alliance, value:attackAllianceDoc._id})
			lockPairs.push({key:Consts.Pairs.Alliance, value:defenceAllianceDoc._id})
			LogicUtils.addAllianceFightReport(attackAllianceDoc, attackAllianceData, attackAllianceFightReport)
			LogicUtils.addAllianceFightReport(defenceAllianceDoc, defenceAllianceData, defenceAllianceFightReport)
			LogicUtils.updateAllianceCountInfo(attackAllianceDoc, defenceAllianceDoc)
			attackAllianceData.push(["countInfo", attackAllianceDoc.countInfo])
			defenceAllianceData.push(["countInfo", defenceAllianceDoc.countInfo])
			attackAllianceDoc.basicInfo.honour += attackAllianceHonourGet
			attackAllianceData.push(["basicInfo.honour", attackAllianceDoc.basicInfo.honour])
			attackAllianceDoc.basicInfo.status = Consts.AllianceStatus.Protect
			attackAllianceData.push(["basicInfo.status", attackAllianceDoc.basicInfo.status])
			attackAllianceDoc.basicInfo.statusStartTime = now
			attackAllianceData.push(["basicInfo.statusStartTime", attackAllianceDoc.basicInfo.statusStartTime])
			var attackAllianceProtectTime = DataUtils.getAllianceIntInit(attackAllianceKill >= defenceAllianceKill ? "allianceFightSuccessProtectMinutes" : "allianceFightFaiedProtectMinutes") * 60 * 1000
			attackAllianceDoc.basicInfo.statusFinishTime = now + attackAllianceProtectTime
			attackAllianceData.push(["basicInfo.statusFinishTime", attackAllianceDoc.basicInfo.statusFinishTime])
			attackAllianceDoc.allianceFight = null
			attackAllianceData.push(["allianceFight", null])
			_.each(attackAllianceDoc.members, function(member){
				if(member.protectStartTime > 0){
					member.protectStartTime = 0;
					attackAllianceData.push(["members." + attackAllianceDoc.members.indexOf(member) + ".protectStartTime", member.protectStartTime])
				}
				if(member.lastBeAttackedTime > 0){
					member.lastBeAttackedTime = 0
					attackAllianceData.push(['members.' + attackAllianceDoc.members.indexOf(member) + '.lastBeAttackedTime', member.lastBeAttackedTime])
				}
			})
			defenceAllianceDoc.basicInfo.honour += defenceAllianceHonourGet
			defenceAllianceData.push(["basicInfo.honour", defenceAllianceDoc.basicInfo.honour])
			defenceAllianceDoc.basicInfo.status = Consts.AllianceStatus.Protect
			defenceAllianceData.push(["basicInfo.status", defenceAllianceDoc.basicInfo.status])
			defenceAllianceDoc.basicInfo.statusStartTime = now
			defenceAllianceData.push(["basicInfo.statusStartTime", defenceAllianceDoc.basicInfo.statusStartTime])
			var defenceAllianceProtectTime = DataUtils.getAllianceIntInit(attackAllianceKill < defenceAllianceKill ? "allianceFightSuccessProtectMinutes" : "allianceFightFaiedProtectMinutes") * 60 * 1000
			defenceAllianceDoc.basicInfo.statusFinishTime = now + defenceAllianceProtectTime
			defenceAllianceData.push(["basicInfo.statusFinishTime", defenceAllianceDoc.basicInfo.statusFinishTime])
			defenceAllianceDoc.allianceFight = null
			defenceAllianceData.push(["allianceFight", null])
			_.each(defenceAllianceDoc.members, function(member){
				if(member.protectStartTime > 0){
					member.protectStartTime = 0;
					defenceAllianceData.push(["members." + defenceAllianceDoc.members.indexOf(member) + ".protectStartTime", member.protectStartTime]);
				}
				if(member.lastBeAttackedTime > 0){
					member.lastBeAttackedTime = 0
					defenceAllianceData.push(['members.' + defenceAllianceDoc.members.indexOf(member) + '.lastBeAttackedTime', member.lastBeAttackedTime])
				}
			})
			if(shouldKickDefenceAlliance){
				pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, attackAllianceDoc.mapIndex, attackAllianceDoc])
				mapIndex = self.cacheService.getFreeMapIndex();
				if(!mapIndex){
					pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, defenceAllianceDoc.mapIndex, defenceAllianceDoc])
					return Promise.resolve();
				}
				allianceRound = LogicUtils.getAllianceMapRound(defenceAllianceDoc);
				targetAllianceRound = LogicUtils.getAllianceMapRound({mapIndex:mapIndex});
				pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, defenceAllianceDoc.mapIndex, null])
				defenceAllianceDoc.mapIndex = mapIndex;
				defenceAllianceData.push(['mapIndex', defenceAllianceDoc.mapIndex]);
				pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, defenceAllianceDoc.mapIndex, defenceAllianceDoc])
				defenceAllianceDoc.basicInfo.allianceMoveTime = Date.now();
				defenceAllianceData.push(['basicInfo.allianceMoveTime', defenceAllianceDoc.basicInfo.allianceMoveTime]);
				pushFuncs.push([self.dataService, self.dataService.updateAllianceEventsLocationAsync, defenceAllianceDoc._id]);
				pushFuncs.push([self.dataService, self.dataService.updateEnemyVillageEventsAsync, defenceAllianceDoc._id]);
			}
			else if(shouldKickAttackAlliance){
				pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, defenceAllianceDoc.mapIndex, defenceAllianceDoc])
				mapIndex = self.cacheService.getFreeMapIndex();
				if(!mapIndex){
					pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, attackAllianceDoc.mapIndex, attackAllianceDoc])
					return Promise.resolve();
				}
				allianceRound = LogicUtils.getAllianceMapRound(attackAllianceDoc);
				targetAllianceRound = LogicUtils.getAllianceMapRound({mapIndex:mapIndex});
				pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, attackAllianceDoc.mapIndex, null])
				attackAllianceDoc.mapIndex = mapIndex;
				attackAllianceData.push(['mapIndex', attackAllianceDoc.mapIndex]);
				pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, attackAllianceDoc.mapIndex, attackAllianceDoc])
				attackAllianceDoc.basicInfo.allianceMoveTime = Date.now();
				attackAllianceData.push(['basicInfo.allianceMoveTime', attackAllianceDoc.basicInfo.allianceMoveTime]);
				pushFuncs.push([self.dataService, self.dataService.updateAllianceEventsLocationAsync, attackAllianceDoc._id]);
				pushFuncs.push([self.dataService, self.dataService.updateEnemyVillageEventsAsync, attackAllianceDoc._id]);
			}
			else{
				pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, attackAllianceDoc.mapIndex, attackAllianceDoc])
				pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, defenceAllianceDoc.mapIndex, defenceAllianceDoc])
			}
			eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, attackAllianceDoc, Consts.AllianceStatusEvent, Consts.AllianceStatusEvent, attackAllianceDoc.basicInfo.statusFinishTime - Date.now()])
			eventFuncs.push([self.timeEventService, self.timeEventService.addAllianceTimeEventAsync, defenceAllianceDoc, Consts.AllianceStatusEvent, Consts.AllianceStatusEvent, defenceAllianceDoc.basicInfo.statusFinishTime - Date.now()])
			pushFuncs.push([self.dataService, self.dataService.deleteAllianceFightChannelAsync, attackAllianceDoc._id, defenceAllianceDoc._id])
			pushFuncs.push([self.dataService, self.dataService.addPlayerLoyaltyByAllianceFightDataAsync, attackAllianceFightReport.playerDatas])
			pushFuncs.push([self.dataService, self.dataService.addPlayerLoyaltyByAllianceFightDataAsync, defenceAllianceFightReport.playerDatas])
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, attackAllianceDoc, attackAllianceData]);
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, defenceAllianceDoc, defenceAllianceData]);
			Promise.fromCallback(function(callback){
				var attackPlayerIds = [];
				var defencePlayerIds = [];
				_.each(attackAllianceDoc.members, function(member){
					attackPlayerIds.push(member.id);
				})
				_.each(defenceAllianceDoc.members, function(member){
					defencePlayerIds.push(member.id);
				})
				var titleKey = DataUtils.getLocalizationConfig("alliance", "AllianceFightTitle")
				var contentSuccessKey = DataUtils.getLocalizationConfig("alliance", "AllianceFightSuccess")
				var contentFailedKey = DataUtils.getLocalizationConfig("alliance", "AllianceFightFailed");
				var attackContentKey = allianceFightResult === Consts.FightResult.AttackWin ? contentSuccessKey : contentFailedKey;
				var defenceContentKey = allianceFightResult === Consts.FightResult.DefenceWin ? contentSuccessKey : contentFailedKey;
				(function sendMail(){
					if(attackPlayerIds.length > 0){
						var attackPlayerId = attackPlayerIds.pop();
						self.dataService.sendSysMailAsync(attackPlayerId, titleKey, [], attackContentKey, [defenceAllianceDoc.basicInfo.tag, defenceAllianceDoc.basicInfo.name], []).then(function(){
							setImmediate(sendMail);
						})
					}else if(defencePlayerIds.length > 0){
						var defencePlayerId = defencePlayerIds.pop();
						self.dataService.sendSysMailAsync(defencePlayerId, titleKey, [], defenceContentKey, [attackAllianceDoc.basicInfo.tag, attackAllianceDoc.basicInfo.name], []).then(function(){
							setImmediate(sendMail);
						})
					}else{
						callback();
					}
				})();
			}).then(function(){
				var titleKey = null;
				var contentKey = null;
				if(shouldKickDefenceAlliance){
					titleKey = DataUtils.getLocalizationConfig("alliance", "AllianceMovedTitle");
					contentKey = DataUtils.getLocalizationConfig("alliance", "AllianceMovedContent");
					var defencePlayerIds = [];
					_.each(defenceAllianceDoc.members, function(member){
						defencePlayerIds.push(member.id);
					});
					(function sendMail(){
						if(defencePlayerIds.length > 0){
							var playerId = defencePlayerIds.pop();
							return self.dataService.sendSysMailAsync(playerId, titleKey, [], contentKey, [allianceRound + 1, targetAllianceRound + 1], []).then(function(){
								setImmediate(sendMail);
							})
						}
					})();
				}else if(shouldKickAttackAlliance){
					titleKey = DataUtils.getLocalizationConfig("alliance", "AllianceMovedTitle");
					contentKey = DataUtils.getLocalizationConfig("alliance", "AllianceMovedContent");
					var attackPlayerIds = [];
					_.each(attackAllianceDoc.members, function(member){
						attackPlayerIds.push(member.id);
					});
					(function sendMail(){
						if(attackPlayerIds.length > 0){
							var playerId = attackPlayerIds.pop();
							return self.dataService.sendSysMailAsync(playerId, titleKey, [], contentKey, [allianceRound + 1, targetAllianceRound + 1], []).then(function(){
								setImmediate(sendMail);
							})
						}
					})();
				}
			}).catch(function(e){
				self.logService.onError("cache.allianceTimeEventService.onFightTimeEvent", {
					ourAllianceId:ourAllianceId,
					enemyAllianceId:enemyAllianceId
				}, e.stack)
			})
		}
		else{
			return Promise.reject(ErrorUtils.illegalAllianceStatus(attackAllianceDoc._id, attackAllianceDoc.basicInfo.status))
		}
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}