"use strict"

/**
 * Created by modun on 14/12/12.
 */

var ShortId = require("shortid")
var _ = require("underscore")
var Promise = require("bluebird")

var DataUtils = require("./dataUtils")
var Consts = require("../consts/consts")
var Define = require("../consts/define")
var LogicUtils = require("./logicUtils")

var GameDatas = require("../datas/GameDatas")
var AllianceInitData = GameDatas.AllianceInitData
var PlayerInitData = GameDatas.PlayerInitData
var DragonEquipments = GameDatas.DragonEquipments
var Items = GameDatas.Items
var Vip = GameDatas.Vip
var AllianceMap = GameDatas.AllianceMap;

var Utils = module.exports

var AllianceMapSize = {
	width:AllianceInitData.intInit.allianceRegionMapWidth.value,
	height:AllianceInitData.intInit.allianceRegionMapHeight.value
}

/**
 * 获取完整坐标
 * @param allianceData
 * @returns {{x: *, y: *}}
 */
var getLocationFromAllianceData = function(allianceData){
	var bigMapLength = DataUtils.getAllianceIntInit('bigMapLength');
	var getMapIndexLocation = function(mapIndex){
		return {
			x:mapIndex % bigMapLength,
			y:Math.floor(mapIndex / bigMapLength)
		};
	}

	var mapIndexLocation = getMapIndexLocation(allianceData.mapIndex);
	var location = allianceData.location;
	return {
		x:location.x + (mapIndexLocation.x * AllianceMapSize.width),
		y:location.y + (mapIndexLocation.y * AllianceMapSize.height)
	}
}

/**
 * 获取距离
 * @param fromAlliance
 * @param toAlliance
 * @returns {number}
 */
var getAllianceLocationDistance = function(fromAlliance, toAlliance){
	var fromLocation = getLocationFromAllianceData(fromAlliance);
	var toLocation = getLocationFromAllianceData(toAlliance);
	var getDistance = function(width, height){
		return Math.ceil(Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)))
	}

	var width = Math.abs(fromLocation.x - toLocation.x)
	var height = Math.abs(fromLocation.y - toLocation.y)
	return getDistance(width, height)
}

/**
 * 创建行军事件中联盟信息数据
 * @param allianceDoc
 * @param location
 * @returns {*}
 */
var createAllianceData = function(allianceDoc, location){
	var allianceData = {
		id:allianceDoc._id,
		name:allianceDoc.basicInfo.name,
		tag:allianceDoc.basicInfo.tag,
		location:location,
		mapIndex:allianceDoc.mapIndex
	}
	return allianceData
}

/**
 * 创建进攻行军事件中进攻玩家信息
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @returns {*}
 */
var createAttackPlayerData = function(playerDoc, dragon, soldiers){
	_.each(soldiers, function(soldier){
		soldier.star = DataUtils.getPlayerSoldierStar(playerDoc, soldier.name);
	})
	var playerData = {
		id:playerDoc._id,
		name:playerDoc.basicInfo.name,
		dragon:{
			type:dragon.type
		},
		soldiers:soldiers
	}
	return playerData
}

/**
 * 创建进攻回城行军事件中进攻玩家信息
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param woundedSoldiers
 * @param rewards
 * @returns {*}
 */
var createAttackPlayerReturnData = function(playerDoc, dragon, soldiers, woundedSoldiers, rewards){
	_.each(soldiers, function(soldier){
		soldier.star = DataUtils.getPlayerSoldierStar(playerDoc, soldier.name);
	})
	var playerData = {
		id:playerDoc._id,
		name:playerDoc.basicInfo.name,
		dragon:{
			type:dragon.type
		},
		soldiers:soldiers,
		woundedSoldiers:woundedSoldiers,
		rewards:rewards
	}
	return playerData
}

/**
 * 创建突袭行军事件中进攻玩家个人信息
 * @param playerDoc
 * @param dragon
 * @returns {*}
 */
var createStrikePlayerData = function(playerDoc, dragon){
	var playerData = {
		id:playerDoc._id,
		name:playerDoc.basicInfo.name,
		dragon:{
			type:dragon.type
		}
	}
	return playerData
}

/**
 * 创建突袭回城行军事件中进攻玩家信息
 * @param playerDoc
 * @param dragon
 * @returns {*}
 */
var createStrikePlayerReturnData = function(playerDoc, dragon){
	var playerData = {
		id:playerDoc._id,
		name:playerDoc.basicInfo.name,
		dragon:{
			type:dragon.type
		}
	}
	return playerData
}

/**
 * 获取玩家士兵行军时间
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param fromAlliance
 * @param toAlliance
 */
var getPlayerSoldiersMarchTime = function(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance){
	var distance = getAllianceLocationDistance(fromAlliance, toAlliance)
	var baseSpeed = 2000
	var totalSpeed = 0
	var totalCount = 0
	_.each(soldiers, function(soldier){
		var equipmentBuff = 0
		var soldierConfig = DataUtils.getPlayerSoldierConfig(playerDoc, soldier.name)
		var soldierType = soldierConfig.type
		var equipmentBuffKey = soldierType + "MarchAdd"
		_.each(dragon.equipments, function(equipment){
			_.each(equipment.buffs, function(key){
				if(_.isEqual(key, equipmentBuffKey)){
					equipmentBuff += DragonEquipments.equipmentBuff[equipmentBuffKey].buffEffect
				}
			})
		})
		var config = DataUtils.getPlayerSoldierConfig(playerDoc, soldier.name)
		var count = soldier.count
		totalCount += count
		totalSpeed += baseSpeed / config.march * count * (1 + equipmentBuff)
	})
	var skillBuff = DataUtils.getDragonSkillBuff(dragon, "surge")
	var itemBuff = DataUtils.isPlayerHasItemEvent(playerDoc, "marchSpeedBonus") ? Items.buffTypes["marchSpeedBonus"].effect1 : 0
	var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? DataUtils.getPlayerVipLevel(playerDoc) : 0].marchSpeedAdd
	var mapRoundBuff = AllianceMap.buff[LogicUtils.getAllianceMapRound(allianceDoc)].marchSpeedAddPercent / 100;
	var time = Math.ceil(totalSpeed / totalCount * distance * 1000)
	time = LogicUtils.getTimeEfffect(time, itemBuff + vipBuff + mapRoundBuff + skillBuff);
	return time //5 * 1000
}

/**
 * 获取玩家龙的行军时间
 * @param playerDoc
 * @param dragon
 * @param fromAlliance
 * @param toAlliance
 * @returns {number}
 */
var getPlayerDragonMarchTime = function(playerDoc, dragon, fromAlliance, toAlliance){
	var distance = getAllianceLocationDistance(fromAlliance, toAlliance)
	var baseSpeed = 2000
	var marchSpeed = PlayerInitData.intInit.dragonMarchSpeed.value
	var time = Math.ceil(baseSpeed / marchSpeed * distance * 1000)
	return time //5 * 1000
}

/**
 * 创建行军用AllianceData
 * @param allianceDoc
 * @param location
 * @returns {*}
 */
Utils.createAllianceData = function(allianceDoc, location){
	return createAllianceData(allianceDoc, location);
}

/**
 * 根据行军中的联盟信息获取完整坐标
 * @param allianceData
 * @returns {{x, y}|{x: *, y: *}}
 */
Utils.getLocationFromAllianceData = function(allianceData){
	return getLocationFromAllianceData(allianceData);
}

/**
 * 创建联盟圣地行军事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param shrineEventId
 * @returns {*}
 */
Utils.createAttackAllianceShrineMarchEvent = function(allianceDoc, playerDoc, dragon, soldiers, shrineEventId){
	var playerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location
	var shrineLocation = DataUtils.getAllianceBuildingLocation(allianceDoc, Consts.AllianceBuildingNames.Shrine);
	var fromAlliance = createAllianceData(allianceDoc, playerLocation);
	var toAlliance = createAllianceData(allianceDoc, shrineLocation);
	var marchTime = getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance);

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.Shrine,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerData(playerDoc, dragon, soldiers),
		defenceShrineData:{shrineEventId:shrineEventId}
	}
	return event
}

/**
 * 玩家从圣地回城事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param woundedSoldiers
 * @param rewards
 * @returns {*}
 */
Utils.createAttackAllianceShrineMarchReturnEvent = function(allianceDoc, playerDoc, dragon, soldiers, woundedSoldiers, rewards){
	var playerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location
	var shrineLocation = DataUtils.getAllianceBuildingLocation(allianceDoc, Consts.AllianceBuildingNames.Shrine);
	var fromAlliance = createAllianceData(allianceDoc, playerLocation);
	var toAlliance = createAllianceData(allianceDoc, shrineLocation);
	var marchTime = _.isEmpty(soldiers) ? getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance)
		: getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.Shrine,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerReturnData(playerDoc, dragon, soldiers, woundedSoldiers, rewards)
	}
	return event
}

/**
 * 创建联盟协防事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param beHelpedPlayerDoc
 * @returns {*}
 */
Utils.createHelpDefenceMarchEvent = function(allianceDoc, playerDoc, dragon, soldiers, beHelpedPlayerDoc){
	var playerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location
	var beHelpedPlayerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, beHelpedPlayerDoc._id).location
	var fromAlliance = createAllianceData(allianceDoc, playerLocation);
	var toAlliance = createAllianceData(allianceDoc, beHelpedPlayerLocation);
	var marchTime = getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.HelpDefence,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerData(playerDoc, dragon, soldiers),
		defencePlayerData:{
			id:beHelpedPlayerDoc._id,
			name:beHelpedPlayerDoc.basicInfo.name
		}
	}
	return event
}

/**
 * 创建玩家协助防御回城事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param woundedSoldiers
 * @param rewards
 * @param defencePlayerData
 * @param fromAlliance
 * @param toAlliance
 * @returns {*}
 */
Utils.createHelpDefenceMarchReturnEvent = function(allianceDoc, playerDoc, dragon, soldiers, woundedSoldiers, rewards, defencePlayerData, fromAlliance, toAlliance){
	var marchTime = _.isEmpty(soldiers) ? getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance)
		: getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance)
	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.HelpDefence,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerReturnData(playerDoc, dragon, soldiers, woundedSoldiers, rewards),
		defencePlayerData:defencePlayerData
	}
	return event
}

/**
 * 创建突袭玩家城市行军事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param defenceAllianceDoc
 * @param defencePlayerDoc
 * @returns {*}
 */
Utils.createStrikePlayerCityMarchEvent = function(allianceDoc, playerDoc, dragon, defenceAllianceDoc, defencePlayerDoc){
	var playerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location
	var defencePlayerLocation = LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id).location
	var fromAlliance = createAllianceData(allianceDoc, playerLocation);
	var toAlliance = createAllianceData(defenceAllianceDoc, defencePlayerLocation);
	var marchTime = getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.City,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createStrikePlayerData(playerDoc, dragon),
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name
		}
	}
	return event
}

/**
 * 创建突袭玩家城市回城行军事件
 * @param playerDoc
 * @param dragon
 * @param defencePlayerData
 * @param fromAlliance
 * @param toAlliance
 * @returns {*}
 */
Utils.createStrikePlayerCityMarchReturnEvent = function(playerDoc, dragon, defencePlayerData, fromAlliance, toAlliance){
	var marchTime = getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance);

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.City,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createStrikePlayerReturnData(playerDoc, dragon),
		defencePlayerData:defencePlayerData
	}
	return event
}

/**
 * 创建进攻玩家城市行军事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param defenceAllianceDoc
 * @param defencePlayerDoc
 * @returns {*}
 */
Utils.createAttackPlayerCityMarchEvent = function(allianceDoc, playerDoc, dragon, soldiers, defenceAllianceDoc, defencePlayerDoc){
	var playerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location
	var defencePlayerLocation = LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id).location
	var fromAlliance = createAllianceData(allianceDoc, playerLocation);
	var toAlliance = createAllianceData(defenceAllianceDoc, defencePlayerLocation);
	var marchTime = getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.City,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerData(playerDoc, dragon, soldiers),
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name
		}
	}
	return event
}

/**
 * 创建进攻玩家城市行军回城事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param woundedSoldiers
 * @param rewards
 * @param defencePlayerDoc
 * @param defencePlayerData
 * @param fromAlliance
 * @param toAlliance
 * @returns {*}
 */
Utils.createAttackPlayerCityMarchReturnEvent = function(allianceDoc, playerDoc, dragon, soldiers, woundedSoldiers, rewards, defencePlayerDoc, defencePlayerData, fromAlliance, toAlliance){
	var marchTime = _.isEmpty(soldiers) ? getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance)
		: getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance);
	var timeAdd = !!defencePlayerDoc ? Math.ceil(marchTime * DataUtils.getPlayerProductionTechBuff(defencePlayerDoc, 'trap')) : 0;
	marchTime += timeAdd;

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.City,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerReturnData(playerDoc, dragon, soldiers, woundedSoldiers, rewards),
		defencePlayerData:defencePlayerData
	}
	return event
}

/**
 * 创建进攻联盟村落行军事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param defenceAllianceDoc
 * @param defenceVillage
 * @returns {*}
 */
Utils.createAttackVillageMarchEvent = function(allianceDoc, playerDoc, dragon, soldiers, defenceAllianceDoc, defenceVillage){
	var playerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location
	var defenceVillageLocation = LogicUtils.getAllianceMapObjectById(defenceAllianceDoc, defenceVillage.id).location
	var fromAlliance = createAllianceData(allianceDoc, playerLocation);
	var toAlliance = createAllianceData(defenceAllianceDoc, defenceVillageLocation);
	var marchTime = getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.Village,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerData(playerDoc, dragon, soldiers),
		defenceVillageData:{
			id:defenceVillage.id,
			name:defenceVillage.name,
			level:defenceVillage.level
		}
	}
	return event
}

/**
 * 创建进攻联盟村落回城事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param woundedSoldiers
 * @param rewards
 * @param defenceVillageData
 * @param fromAlliance
 * @param toAlliance
 * @returns {*}
 */
Utils.createAttackVillageMarchReturnEvent = function(allianceDoc, playerDoc, dragon, soldiers, woundedSoldiers, rewards, defenceVillageData, fromAlliance, toAlliance){
	var marchTime = _.isEmpty(soldiers) ? getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance)
		: getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.Village,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerReturnData(playerDoc, dragon, soldiers, woundedSoldiers, rewards),
		defenceVillageData:defenceVillageData
	}
	return event
}

/**
 * 创建进攻联盟村落行军事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param defenceAllianceDoc
 * @param defenceMonster
 * @returns {*}
 */
Utils.createAttackMonsterMarchEvent = function(allianceDoc, playerDoc, dragon, soldiers, defenceAllianceDoc, defenceMonster){
	var playerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location
	var defenceMonsterLocation = LogicUtils.getAllianceMapObjectById(defenceAllianceDoc, defenceMonster.id).location
	var fromAlliance = createAllianceData(allianceDoc, playerLocation);
	var toAlliance = createAllianceData(defenceAllianceDoc, defenceMonsterLocation);
	var marchTime = getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance);

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.Monster,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerData(playerDoc, dragon, soldiers),
		defenceMonsterData:{
			id:defenceMonster.id,
			level:defenceMonster.level,
			index:defenceMonster.index
		}
	}
	return event
}

/**
 * 创建进攻联盟村落回城事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param woundedSoldiers
 * @param rewards
 * @param defenceMonsterData
 * @param fromAlliance
 * @param toAlliance
 * @returns {*}
 */
Utils.createAttackMonsterMarchReturnEvent = function(allianceDoc, playerDoc, dragon, soldiers, woundedSoldiers, rewards, defenceMonsterData, fromAlliance, toAlliance){
	var marchTime = _.isEmpty(soldiers) ? getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance)
		: getPlayerSoldiersMarchTime(allianceDoc, playerDoc, dragon, soldiers, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.Monster,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createAttackPlayerReturnData(playerDoc, dragon, soldiers, woundedSoldiers, rewards),
		defenceMonsterData:defenceMonsterData
	}
	return event
}

/**
 * 创建突袭联盟村落行军事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param defenceAllianceDoc
 * @param defenceVillage
 * @returns {*}
 */
Utils.createStrikeVillageMarchEvent = function(allianceDoc, playerDoc, dragon, defenceAllianceDoc, defenceVillage){
	var playerLocation = LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location
	var defenceVillageLocation = LogicUtils.getAllianceMapObjectById(defenceAllianceDoc, defenceVillage.id).location
	var fromAlliance = createAllianceData(allianceDoc, playerLocation);
	var toAlliance = createAllianceData(defenceAllianceDoc, defenceVillageLocation);
	var marchTime = getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.Village,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createStrikePlayerData(playerDoc, dragon),
		defenceVillageData:{
			id:defenceVillage.id,
			name:defenceVillage.name,
			level:defenceVillage.level
		}
	}
	return event
}

/**
 * 创建突袭联盟村落回城事件
 * @param playerDoc
 * @param dragon
 * @param defenceVillageData
 * @param fromAlliance
 * @param toAlliance
 * @returns {*}
 */
Utils.createStrikeVillageMarchReturnEvent = function(playerDoc, dragon, defenceVillageData, fromAlliance, toAlliance){
	var marchTime = getPlayerDragonMarchTime(playerDoc, dragon, fromAlliance, toAlliance)

	var event = {
		id:ShortId.generate(),
		marchType:Consts.MarchType.Village,
		startTime:Date.now(),
		arriveTime:Date.now() + marchTime,
		fromAlliance:fromAlliance,
		toAlliance:toAlliance,
		attackPlayerData:createStrikePlayerReturnData(playerDoc, dragon),
		defenceVillageData:defenceVillageData
	}
	return event
}

/**
 * 创建采集联盟村落事件
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @param woundedSoldiers
 * @param rewards
 * @param defenceAllianceDoc
 * @param defenceVillage
 * @returns {*}
 */
Utils.createAllianceVillageEvent = function(allianceDoc, playerDoc, dragon, soldiers, woundedSoldiers, rewards, defenceAllianceDoc, defenceVillage){
	var soldiersTotalLoad = DataUtils.getPlayerSoldiersTotalLoad(playerDoc, soldiers)
	var collectInfo = DataUtils.getPlayerCollectResourceInfo(allianceDoc, playerDoc, soldiersTotalLoad, defenceVillage)
	var event = {
		id:ShortId.generate(),
		startTime:Date.now(),
		finishTime:Date.now() + collectInfo.collectTime,
		fromAlliance:createAllianceData(allianceDoc, LogicUtils.getAllianceMemberMapObjectById(allianceDoc, playerDoc._id).location),
		toAlliance:createAllianceData(defenceAllianceDoc, LogicUtils.getAllianceMapObjectById(defenceAllianceDoc, defenceVillage.id).location),
		playerData:{
			id:playerDoc._id,
			name:playerDoc.basicInfo.name,
			dragon:{
				type:dragon.type
			},
			soldiers:soldiers,
			woundedSoldiers:woundedSoldiers,
			rewards:rewards
		},
		villageData:{
			id:defenceVillage.id,
			name:defenceVillage.name,
			level:defenceVillage.level,
			resource:defenceVillage.resource,
			collectTotal:collectInfo.collectTotal
		}
	}

	var data = {
		event:event,
		soldiersTotalLoad:soldiersTotalLoad,
		collectTime:collectInfo.collectTime,
		collectTotal:collectInfo.collectTotal
	}
	return data
}