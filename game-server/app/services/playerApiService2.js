"use strict"

/**
 * Created by modun on 14-7-23.
 */

var ShortId = require("shortid")
var Promise = require("bluebird")
var _ = require("underscore")

var Utils = require("../utils/utils")
var DataUtils = require("../utils/dataUtils")
var LogicUtils = require("../utils/logicUtils")
var TaskUtils = require("../utils/taskUtils")
var ErrorUtils = require("../utils/errorUtils")
var Events = require("../consts/events")
var Consts = require("../consts/consts")
var Define = require("../consts/define")

var PlayerApiService2 = function(app){
	this.app = app
	this.env = app.get("env")
	this.pushService = app.get("pushService")
	this.timeEventService = app.get("timeEventService")
	this.playerTimeEventService = app.get("playerTimeEventService")
	this.cacheService = app.get('cacheService');
	this.dataService = app.get("dataService")
	this.GemChange = app.get("GemChange")
	this.cacheServerId = app.getServerId();
}
module.exports = PlayerApiService2
var pro = PlayerApiService2.prototype

/**
 * 制作龙的装备
 * @param playerId
 * @param equipmentName
 * @param finishNow
 * @param callback
 */
pro.makeDragonEquipment = function(playerId, equipmentName, finishNow, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var building = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		building = playerDoc.buildings.location_9
		if(building.level < 1) return Promise.reject(ErrorUtils.buildingNotBuild(playerId, building.location))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = 0
		var makeRequired = DataUtils.getPlayerMakeDragonEquipmentRequired(playerDoc, equipmentName)
		if(!LogicUtils.isEnough(makeRequired.materials, playerDoc.dragonMaterials)) return Promise.reject(ErrorUtils.dragonEquipmentMaterialsNotEnough(playerId, equipmentName))
		var buyedResources = null
		var preMakeEvent = null
		DataUtils.refreshPlayerResources(playerDoc)
		if(finishNow){
			gemUsed += DataUtils.getGemByTimeInterval(makeRequired.makeTime)
			buyedResources = DataUtils.buyResources(playerDoc, {coin:makeRequired.coin}, {})
			gemUsed += buyedResources.gemUsed
		}else{
			if(playerDoc.dragonEquipmentEvents.length > 0){
				preMakeEvent = playerDoc.dragonEquipmentEvents[0]
				var timeRemain = (preMakeEvent.finishTime - Date.now()) / 1000
				gemUsed += DataUtils.getGemByTimeInterval(timeRemain)
			}
			buyedResources = DataUtils.buyResources(playerDoc, {coin:makeRequired.coin}, playerDoc.resources)
			gemUsed += buyedResources.gemUsed
		}
		if(gemUsed > playerDoc.resources.gem) return Promise.reject(ErrorUtils.gemNotEnough(playerId, gemUsed, playerDoc.resources.gem))
		if(gemUsed > 0){
			playerDoc.resources.gem -= gemUsed
			var gemUse = {
				serverId:self.cacheServerId,
				playerId:playerId,
				playerName:playerDoc.basicInfo.name,
				changed:-gemUsed,
				left:playerDoc.resources.gem,
				api:"makeDragonEuipment",
				params:{
					equipmentName:equipmentName,
					finishNow:finishNow
				}
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		LogicUtils.increace(buyedResources.totalBuy, playerDoc.resources)
		LogicUtils.reduce({coin:makeRequired.coin}, playerDoc.resources)
		LogicUtils.reduce(makeRequired.materials, playerDoc.dragonMaterials)
		_.each(makeRequired.materials, function(value, key){
			playerData.push(["dragonMaterials." + key, playerDoc.dragonMaterials[key]])
		})
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'makeDragonEquipment');
		if(finishNow){
			playerDoc.dragonEquipments[equipmentName] += 1
			playerData.push(["dragonEquipments." + equipmentName, playerDoc.dragonEquipments[equipmentName]])
		}else{
			if(_.isObject(preMakeEvent)){
				self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, "dragonEquipmentEvents", preMakeEvent.id)
			}
			var finishTime = Date.now() + (makeRequired.makeTime * 1000)
			var event = LogicUtils.createDragonEquipmentEvent(playerDoc, equipmentName, finishTime)
			playerDoc.dragonEquipmentEvents.push(event)
			playerData.push(["dragonEquipmentEvents." + playerDoc.dragonEquipmentEvents.indexOf(event), event])
			eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "dragonEquipmentEvents", event.id, event.finishTime - Date.now()])
		}
		DataUtils.refreshPlayerResources(playerDoc)
		playerData.push(["resources", playerDoc.resources])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 治疗伤兵
 * @param playerId
 * @param soldiers
 * @param finishNow
 * @param callback
 */
pro.treatSoldier = function(playerId, soldiers, finishNow, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var building = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		building = playerDoc.buildings.location_6
		if(building.level < 1) return Promise.reject(ErrorUtils.buildingNotBuild(playerId, building.location))
		if(!LogicUtils.isTreatSoldierLegal(playerDoc, soldiers)) return Promise.reject(ErrorUtils.soldierNotExistOrCountNotLegal(playerId, soldiers))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = 0
		var treatRequired = DataUtils.getPlayerTreatSoldierRequired(playerDoc, soldiers)
		var buyedResources = null
		var preTreatEvent = null
		DataUtils.refreshPlayerResources(playerDoc)
		if(finishNow){
			gemUsed += DataUtils.getGemByTimeInterval(treatRequired.treatTime)
			buyedResources = DataUtils.buyResources(playerDoc, treatRequired.resources, {})
			gemUsed += buyedResources.gemUsed
		}else{
			buyedResources = DataUtils.buyResources(playerDoc, treatRequired.resources, playerDoc.resources)
			gemUsed += buyedResources.gemUsed
			if(playerDoc.treatSoldierEvents.length > 0){
				preTreatEvent = playerDoc.treatSoldierEvents[0]
				var timeRemain = (preTreatEvent.finishTime - Date.now()) / 1000
				gemUsed += DataUtils.getGemByTimeInterval(timeRemain)
			}
		}
		if(gemUsed > playerDoc.resources.gem) return Promise.reject(ErrorUtils.gemNotEnough(playerId, gemUsed, playerDoc.resources.gem))
		if(gemUsed > 0){
			playerDoc.resources.gem -= gemUsed
			var gemUse = {
				serverId:self.cacheServerId,
				playerId:playerId,
				playerName:playerDoc.basicInfo.name,
				changed:-gemUsed,
				left:playerDoc.resources.gem,
				api:"treatSoldier",
				params:{
					soldiers:soldiers,
					finishNow:finishNow
				}
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		LogicUtils.increace(buyedResources.totalBuy, playerDoc.resources)
		LogicUtils.reduce(treatRequired.resources, playerDoc.resources)
		if(finishNow){
			_.each(soldiers, function(soldier){
				playerDoc.soldiers[soldier.name] += soldier.count
				playerDoc.woundedSoldiers[soldier.name] -= soldier.count
				playerData.push(["soldiers." + soldier.name, playerDoc.soldiers[soldier.name]])
				playerData.push(["woundedSoldiers." + soldier.name, playerDoc.woundedSoldiers[soldier.name]])
			})
			DataUtils.refreshPlayerPower(playerDoc, playerData)
			TaskUtils.finishPlayerPowerTaskIfNeed(playerDoc, playerData)
		}else{
			if(_.isObject(preTreatEvent)){
				self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, "treatSoldierEvents", preTreatEvent.id)
			}
			_.each(soldiers, function(soldier){
				playerDoc.woundedSoldiers[soldier.name] -= soldier.count
				playerData.push(["woundedSoldiers." + soldier.name, playerDoc.woundedSoldiers[soldier.name]])
			})
			var finishTime = Date.now() + (treatRequired.treatTime * 1000)
			var event = LogicUtils.createTreatSoldierEvent(playerDoc, soldiers, finishTime)
			playerDoc.treatSoldierEvents.push(event)
			playerData.push(["treatSoldierEvents." + playerDoc.treatSoldierEvents.indexOf(event), event])
			eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "treatSoldierEvents", event.id, event.finishTime - Date.now()])
		}
		_.each(soldiers, function(soldier){
			TaskUtils.finishSoldierCountTaskIfNeed(playerDoc, playerData, soldier.name);
		})
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'treatSoldiers');
		DataUtils.refreshPlayerResources(playerDoc)
		playerData.push(["resources", playerDoc.resources])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 孵化龙蛋
 * @param playerId
 * @param dragonType
 * @param callback
 */
pro.hatchDragon = function(playerId, dragonType, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var dragon = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var dragons = playerDoc.dragons
		dragon = dragons[dragonType]
		if(dragon.star > 0) return Promise.reject(ErrorUtils.dragonEggAlreadyHatched(playerId, dragonType))
		if(!DataUtils.isPlayerDragonHatchLegal(playerDoc)) return Promise.reject(ErrorUtils.hatchConditionNotMatch(playerId, dragonType))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		dragon.star = 1
		dragon.level = 1
		dragon.status = Consts.DragonStatus.Free;
		dragon.hp = DataUtils.getDragonMaxHp(dragon)
		dragon.hpRefreshTime = Date.now()
		playerData.push(["dragons." + dragonType, playerDoc.dragons[dragonType]])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置龙的某部位的装备
 * @param playerId
 * @param dragonType
 * @param equipmentCategory
 * @param equipmentName
 * @param callback
 */
pro.setDragonEquipment = function(playerId, dragonType, equipmentCategory, equipmentName, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var dragon = null;
	var equipment = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		dragon = playerDoc.dragons[dragonType]
		if(dragon.star <= 0) return Promise.reject(ErrorUtils.dragonNotHatched(playerId, dragonType))
		if(!DataUtils.isDragonEquipmentStarEqualWithDragonStar(equipmentName, dragon)) return Promise.reject(ErrorUtils.dragonEquipmentNotMatchForTheDragon(playerId, dragonType, equipmentCategory, equipmentName))
		if(playerDoc.dragonEquipments[equipmentName] <= 0) return Promise.reject(ErrorUtils.dragonEquipmentNotEnough(playerId, dragonType, equipmentCategory, equipmentName))
		equipment = dragon.equipments[equipmentCategory]
		if(!_.isEmpty(equipment.name)) return Promise.reject(ErrorUtils.dragonAlreadyHasTheSameCategory(playerId, dragonType, equipmentCategory, equipmentName))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		equipment.name = equipmentName
		equipment.buffs = DataUtils.generateDragonEquipmentBuffs(equipmentName)
		playerDoc.dragonEquipments[equipmentName] -= 1
		playerData.push(["dragonEquipments." + equipmentName, playerDoc.dragonEquipments[equipmentName]])
		playerData.push(["dragons." + dragonType + ".equipments." + equipmentCategory, equipment])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 强化龙的装备
 * @param playerId
 * @param dragonType
 * @param equipmentCategory
 * @param equipments
 * @param callback
 */
pro.enhanceDragonEquipment = function(playerId, dragonType, equipmentCategory, equipments, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var dragon = null;
	var equipment = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		dragon = playerDoc.dragons[dragonType]
		equipment = dragon.equipments[equipmentCategory]
		if(_.isEmpty(equipment.name)) return Promise.reject(ErrorUtils.dragonDoNotHasThisEquipment(playerId, dragonType, equipmentCategory))
		if(DataUtils.isDragonEquipmentReachMaxStar(equipment)) return Promise.reject(ErrorUtils.dragonEquipmentReachMaxStar(playerId, dragonType, equipmentCategory))
		if(!LogicUtils.isEnhanceDragonEquipmentLegal(playerDoc, equipments)) return Promise.reject(ErrorUtils.dragonEquipmentsNotExistOrNotEnough(playerId, equipments))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		DataUtils.enhancePlayerDragonEquipment(playerDoc, dragon, equipmentCategory, equipments)
		_.each(equipments, function(equipment){
			playerDoc.dragonEquipments[equipment.name] -= equipment.count
			playerData.push(["dragonEquipments." + equipment.name, playerDoc.dragonEquipments[equipment.name]])
		})
		playerData.push(["dragons." + dragonType + ".equipments." + equipmentCategory, equipment])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 重置装备随机属性
 * @param playerId
 * @param dragonType
 * @param equipmentCategory
 * @param callback
 */
pro.resetDragonEquipment = function(playerId, dragonType, equipmentCategory, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var dragon = null;
	var equipment = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		dragon = playerDoc.dragons[dragonType]
		equipment = dragon.equipments[equipmentCategory]
		if(_.isEmpty(equipment.name)) return Promise.reject(ErrorUtils.dragonDoNotHasThisEquipment(playerId, dragonType, equipmentCategory))
		if(playerDoc.dragonEquipments[equipment.name] <= 0) return Promise.reject(ErrorUtils.dragonEquipmentNotEnough(playerId, dragonType, equipmentCategory, equipment.name))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		equipment.buffs = DataUtils.generateDragonEquipmentBuffs(equipment.name)
		playerDoc.dragonEquipments[equipment.name] -= 1
		playerData.push(["dragonEquipments." + equipment.name, playerDoc.dragonEquipments[equipment.name]])
		playerData.push(["dragons." + dragonType + ".equipments." + equipmentCategory, equipment])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 升级龙的技能
 * @param playerId
 * @param dragonType
 * @param skillKey
 * @param callback
 */
pro.upgradeDragonSkill = function(playerId, dragonType, skillKey, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var dragon = null;
	var skill = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		dragon = playerDoc.dragons[dragonType]
		if(dragon.star <= 0) return Promise.reject(ErrorUtils.dragonNotHatched(playerId, dragonType))
		skill = dragon.skills[skillKey]
		if(!_.isObject(skill)) return Promise.reject(ErrorUtils.dragonSkillNotExist(playerId, dragonType, skillKey))
		if(!DataUtils.isDragonSkillUnlocked(dragon, skill.name)) return Promise.reject(ErrorUtils.dragonSkillIsLocked(playerId, dragonType, skillKey))
		if(DataUtils.isDragonSkillReachMaxLevel(skill)) return Promise.reject(ErrorUtils.dragonSkillReachMaxLevel(playerId, dragonType, skillKey))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var upgradeRequired = DataUtils.getDragonSkillUpgradeRequired(dragon, skill)
		if(playerDoc.resources.blood < upgradeRequired.blood) return Promise.reject(ErrorUtils.heroBloodNotEnough(playerId, upgradeRequired.blood, playerDoc.resources.blood))
		skill.level += 1
		TaskUtils.finishDragonSkillTaskIfNeed(playerDoc, playerData, dragon.type, skill.name, skill.level)
		playerDoc.resources.blood -= upgradeRequired.blood
		playerData.push(["resources.blood", playerDoc.resources.blood])
		playerData.push(["dragons." + dragonType + ".skills." + skillKey, skill])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 升级龙的星级
 * @param playerId
 * @param dragonType
 * @param callback
 */
pro.upgradeDragonStar = function(playerId, dragonType, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var dragon = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		dragon = playerDoc.dragons[dragonType]
		if(dragon.star < 1) return Promise.reject(ErrorUtils.dragonNotHatched(playerId, dragonType))
		if(DataUtils.isDragonReachMaxStar(dragon)) return Promise.reject(ErrorUtils.dragonReachMaxStar(playerId, dragonType, dragon.star))
		if(!DataUtils.isDragonReachUpgradeLevel(dragon)) return Promise.reject(ErrorUtils.dragonUpgradeStarFailedForLevelNotLegal(playerId, dragon.type))
		if(!DataUtils.isDragonEquipmentsReachUpgradeLevel(dragon)) return Promise.reject(ErrorUtils.dragonUpgradeStarFailedForEquipmentNotLegal(playerId, dragon.type))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		dragon.star += 1
		_.each(dragon.equipments, function(equipment){
			equipment.name = ""
			equipment.star = 0
			equipment.exp = 0
			equipment.buffs = []
		})
		TaskUtils.finishDragonStarTaskIfNeed(playerDoc, playerData, dragon.type, dragon.star)
		DataUtils.refreshPlayerDragonsHp(playerDoc, dragon)
		playerData.push(["dragons." + dragonType, playerDoc.dragons[dragonType]])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取每日任务列表
 * @param playerId
 * @param callback
 */
pro.getDailyQuests = function(playerId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var building = playerDoc.buildings.location_15
		if(building.level <= 0) return Promise.reject(ErrorUtils.buildingNotBuild(playerId, building.location))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var refreshTime = DataUtils.getDailyQuestsRefreshTime()
		var now = Date.now()
		if(playerDoc.dailyQuests.refreshTime + refreshTime <= now){
			var dailyQuests = DataUtils.createDailyQuests()
			playerDoc.dailyQuests.quests = dailyQuests
			playerDoc.dailyQuests.refreshTime = now
		}
		playerData.push(["dailyQuests", playerDoc.dailyQuests])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 为每日任务中某个任务增加星级
 * @param playerId
 * @param questId
 * @param callback
 */
pro.addDailyQuestStar = function(playerId, questId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var quest = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		quest = _.find(playerDoc.dailyQuests.quests, function(quest){
			return _.isEqual(quest.id, questId)
		})
		if(!_.isObject(quest)) return Promise.reject(ErrorUtils.dailyQuestNotExist(playerId, questId))
		if(quest.star >= 5) return Promise.reject(ErrorUtils.dailyQuestReachMaxStar(playerId, quest))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = DataUtils.getDailyQuestAddStarNeedGemCount()
		if(gemUsed > playerDoc.resources.gem) return Promise.reject(ErrorUtils.gemNotEnough(playerId, gemUsed, playerDoc.resources.gem))
		playerDoc.resources.gem -= gemUsed
		playerData.push(["resources.gem", playerDoc.resources.gem])
		var gemUse = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:-gemUsed,
			left:playerDoc.resources.gem,
			api:"addDailyQuestStar",
			params:{
				currentStar:quest.star
			}
		}
		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		quest.star += 1
		playerData.push(["dailyQuests.quests." + playerDoc.dailyQuests.quests.indexOf(quest) + ".star", quest.star])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 开始一个每日任务
 * @param playerId
 * @param questId
 * @param callback
 */
pro.startDailyQuest = function(playerId, questId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var quest = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		quest = _.find(playerDoc.dailyQuests.quests, function(quest){
			return _.isEqual(quest.id, questId)
		})
		if(!_.isObject(quest)) return Promise.reject(ErrorUtils.dailyQuestNotExist(playerId, questId))
		if(playerDoc.dailyQuestEvents.length > 0) return Promise.reject(ErrorUtils.dailyQuestEventExist(playerId, playerDoc.dailyQuestEvents))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerData.push(["dailyQuests.quests." + playerDoc.dailyQuests.quests.indexOf(quest), null])
		LogicUtils.removeItemInArray(playerDoc.dailyQuests.quests, quest)
		var event = DataUtils.createPlayerDailyQuestEvent(playerDoc, quest)
		playerDoc.dailyQuestEvents.push(event)
		playerData.push(["dailyQuestEvents." + playerDoc.dailyQuestEvents.indexOf(event), event])
		eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "dailyQuestEvents", event.id, event.finishTime - Date.now()])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 领取每日任务奖励
 * @param playerId
 * @param questEventId
 * @param callback
 */
pro.getDailyQeustReward = function(playerId, questEventId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	var questEvent = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		questEvent = _.find(playerDoc.dailyQuestEvents, function(event){
			return _.isEqual(event.id, questEventId)
		})
		if(!_.isObject(questEvent)) return Promise.reject(ErrorUtils.dailyQuestEventNotExist(playerId, questEventId, playerDoc.dailyQuestEvents))
		if(questEvent.finishTime > 0) return Promise.reject(ErrorUtils.dailyQuestEventNotFinished(playerId, questEvent))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerData.push(["dailyQuestEvents." + playerDoc.dailyQuestEvents.indexOf(questEvent), null])
		LogicUtils.removeItemInArray(playerDoc.dailyQuestEvents, questEvent)
		var rewards = DataUtils.getPlayerDailyQuestEventRewards(playerDoc, questEvent)
		DataUtils.refreshPlayerResources(playerDoc)
		playerData.push(["resources", playerDoc.resources])
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'getDailyQeustReward', null, rewards, true]);
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置玩家语言
 * @param playerId
 * @param language
 * @param callback
 */
pro.setPlayerLanguage = function(playerId, language, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.basicInfo.language = language
		playerData.push(["basicInfo.language", language])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取玩家个人信息
 * @param playerId
 * @param memberId
 * @param callback
 */
pro.getPlayerInfo = function(playerId, memberId, callback){
	var self = this
	var playerViewData = null
	var memberDoc = null
	this.cacheService.findPlayerAsync(memberId).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.playerNotExist(playerId, memberId))
		memberDoc = doc

		playerViewData = {
			id:memberDoc._id,
			name:memberDoc.basicInfo.name,
			icon:memberDoc.basicInfo.icon,
			power:memberDoc.basicInfo.power,
			kill:memberDoc.basicInfo.kill,
			levelExp:memberDoc.basicInfo.levelExp,
			vipExp:memberDoc.basicInfo.vipExp,
			lastLogoutTime:memberDoc.countInfo.lastLogoutTime,
			online:!_.isEmpty(memberDoc.logicServerId)
		}

		if(_.isString(memberDoc.allianceId)){
			return self.cacheService.findAllianceAsync(memberDoc.allianceId).then(function(doc){
				var memberObject = LogicUtils.getObjectById(doc.members, memberId)
				playerViewData.alliance = {
					id:doc._id,
					name:doc.basicInfo.name,
					tag:doc.basicInfo.tag,
					title:memberObject.title
				}
			})
		}
	}).then(function(){
		callback(null, playerViewData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 添加玩家已发送邮件
 * @param playerId
 * @param mail
 * @param callback
 */
pro.addSendMail = function(playerId, mail, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.playerNotExist(playerId, playerId));
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		while(playerDoc.sendMails.length >= Define.PlayerSendMailsMaxSize){
			(function(){
				playerDoc.sendMails.shift()
				playerData.push(["sendMails.0", null])
			})();
		}
		playerDoc.sendMails.push(mail)
		playerData.push(["sendMails." + playerDoc.sendMails.indexOf(mail), mail])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 添加玩家邮件
 * @param playerId
 * @param mail
 * @param callback
 */
pro.addMail = function(playerId, mail, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.playerNotExist(playerId, playerId));
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var isBlocked = _.find(playerDoc.blocked, function(_blocked){
			return _blocked.id === mail.fromId;
		})
		if(isBlocked) return Promise.resolve();
		while(playerDoc.mails.length >= Define.PlayerMailsMaxSize){
			(function(){
				var mail = LogicUtils.getPlayerFirstUnSavedMail(playerDoc)
				playerData.push(["mails." + playerDoc.mails.indexOf(mail), null])
				LogicUtils.removeItemInArray(playerDoc.mails, mail)
			})();
		}
		playerDoc.mails.push(mail)
		playerData.push(["mails." + playerDoc.mails.indexOf(mail), mail])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 阅读邮件
 * @param playerId
 * @param mailIds
 * @param callback
 */
pro.readMails = function(playerId, mailIds, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		for(var i = 0; i < mailIds.length; i++){
			(function(){
				var mail = LogicUtils.getPlayerMailById(playerDoc, mailIds[i])
				if(!_.isObject(mail)) return;
				mail.isRead = true
				playerData.push(["mails." + playerDoc.mails.indexOf(mail) + ".isRead", true])
			})()
		}
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 收藏邮件
 * @param playerId
 * @param mailId
 * @param callback
 */
pro.saveMail = function(playerId, mailId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var mail = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		mail = LogicUtils.getPlayerMailById(playerDoc, mailId)
		if(!_.isObject(mail)) return Promise.reject(ErrorUtils.mailNotExist(playerId, mailId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		mail.isSaved = true
		playerData.push(["mails." + playerDoc.mails.indexOf(mail) + ".isSaved", true])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}