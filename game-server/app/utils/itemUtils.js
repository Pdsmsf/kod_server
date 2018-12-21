"use strict";

/**
 * Created by modun on 15/1/17.
 */

var ShortId = require("shortid");
var Promise = require("bluebird");
var Filter = require('bad-words-chinese');
var _ = require("underscore");
var Consts = require("../consts/consts");
var Define = require("../consts/define");
var LogicUtils = require("./logicUtils");
var DataUtils = require("./dataUtils");
var TaskUtils = require("../utils/taskUtils");
var ErrorUtils = require("../utils/errorUtils");
var MapUtils = require("../utils/mapUtils");
var GameDatas = require("../datas/GameDatas");
var Items = GameDatas.Items;
var Buildings = GameDatas.Buildings;
var Keywords = GameDatas.Keywords;
var WordsFilter = new Filter(
	{
		englishList:_.keys(Keywords.en),
		chineseList:_.keys(Keywords.cn)
	}
);
var Utils = module.exports;

/**
 * 建筑移动
 * @param playerDoc
 * @param playerData
 * @param fromBuildingLocation
 * @param fromHouseLocation
 * @param toBuildingLocation
 * @param toHouseLocation
 * @returns {*}
 */
var MovingConstruction = function(playerDoc, playerData, fromBuildingLocation, fromHouseLocation, toBuildingLocation, toHouseLocation){
	DataUtils.refreshPlayerResources(playerDoc)
	var fromBuilding = playerDoc.buildings["location_" + fromBuildingLocation]
	var house = _.find(fromBuilding.houses, function(house){
		return house.location === fromHouseLocation
	})
	if(!_.isObject(house)) return Promise.reject(ErrorUtils.houseNotExist(playerDoc._id, fromBuildingLocation, fromHouseLocation))
	var hasHouseEvent = _.some(playerDoc.houseEvents, function(event){
		return _.isEqual(event.buildingLocation, fromBuildingLocation) && _.isEqual(event.houseLocation, fromHouseLocation)
	})
	if(hasHouseEvent) return Promise.reject(ErrorUtils.houseCanNotBeMovedNow(playerDoc._id, fromBuildingLocation, fromHouseLocation))
	var toBuilding = playerDoc.buildings["location_" + toBuildingLocation]
	if(toBuilding.level < 1) return Promise.reject(ErrorUtils.buildingNotBuild(playerDoc._id, toBuilding.location))
	if(!Buildings.buildings[toBuildingLocation].hasHouse) return Promise.reject(ErrorUtils.buildingNotAllowHouseCreate(playerDoc._id, toBuildingLocation, toHouseLocation, house.type))
	var toHouse = _.find(toBuilding.houses, function(house){
		return house.location == toHouseLocation
	})
	if(_.isObject(toHouse)){
		var hasToHouseEvent = _.some(playerDoc.houseEvents, function(event){
			return _.isEqual(event.buildingLocation, toBuildingLocation) && _.isEqual(event.houseLocation, toHouseLocation)
		})
		if(hasToHouseEvent) return Promise.reject(ErrorUtils.houseCanNotBeMovedNow(playerDoc._id, toBuildingLocation, toHouseLocation))
	}

	playerData.push(["buildings.location_" + fromBuilding.location + ".houses." + fromBuilding.houses.indexOf(house), null])
	LogicUtils.removeItemInArray(fromBuilding.houses, house)
	if(_.isObject(toHouse)){
		playerData.push(["buildings.location_" + toBuilding.location + ".houses." + toBuilding.houses.indexOf(toHouse), null])
		LogicUtils.removeItemInArray(toBuilding.houses, toHouse)
		if(!LogicUtils.isHouseCanCreateAtLocation(playerDoc, fromBuildingLocation, toHouse.type, fromHouseLocation)){
			fromBuilding.houses.push(house);
			toBuilding.houses.push(toHouse);
			return Promise.reject(ErrorUtils.houseLocationNotLegal(playerDoc._id, fromBuildingLocation, fromHouseLocation, toHouse.type));
		}
		if(!LogicUtils.isHouseCanCreateAtLocation(playerDoc, toBuildingLocation, house.type, toHouseLocation)){
			fromBuilding.houses.push(house);
			toBuilding.houses.push(toHouse);
			return Promise.reject(ErrorUtils.houseLocationNotLegal(playerDoc._id, toBuildingLocation, toHouseLocation, house.type))
		}
		toHouse.location = fromHouseLocation
		fromBuilding.houses.push(toHouse)
		playerData.push(["buildings.location_" + fromBuilding.location + ".houses." + fromBuilding.houses.indexOf(toHouse), toHouse])
		house.location = toHouseLocation
		toBuilding.houses.push(house)
		playerData.push(["buildings.location_" + toBuilding.location + ".houses." + toBuilding.houses.indexOf(house), house])
	}else{
		if(!LogicUtils.isHouseCanCreateAtLocation(playerDoc, toBuildingLocation, house.type, toHouseLocation)){
			fromBuilding.houses.push(house);
			return Promise.reject(ErrorUtils.houseLocationNotLegal(playerDoc._id, toBuildingLocation, toHouseLocation, house.type))
		}
		house.location = toHouseLocation
		toBuilding.houses.push(house)
		playerData.push(["buildings.location_" + toBuilding.location + ".houses." + toBuilding.houses.indexOf(house), house])
	}

	DataUtils.refreshPlayerResources(playerDoc)
	playerData.push(["resources", playerDoc.resources])

	return Promise.resolve()
}

/**
 * 使用火炬摧毁一个小屋或装饰物
 * @param playerDoc
 * @param playerData
 * @param buildingLocation
 * @param houseLocation
 * @returns {*}
 */
var Torch = function(playerDoc, playerData, buildingLocation, houseLocation){
	var building = playerDoc.buildings["location_" + buildingLocation]
	var house = _.find(building.houses, function(house){
		return _.isEqual(house.location, houseLocation)
	})
	if(!_.isObject(house)) return Promise.reject(ErrorUtils.houseNotExist(playerDoc._id, buildingLocation, houseLocation))
	var houseEvent = _.find(playerDoc.houseEvents, function(event){
		return _.isEqual(event.buildingLocation, buildingLocation) && _.isEqual(event.houseLocation, houseLocation)
	})
	if(_.isObject(houseEvent)) return Promise.reject(ErrorUtils.houseCanNotBeMovedNow(playerDoc._id, buildingLocation, houseLocation))

	DataUtils.refreshPlayerResources(playerDoc)
	playerData.push(["resources", playerDoc.resources])
	playerData.push(["buildings.location_" + building.location + ".houses." + building.houses.indexOf(house), null])
	LogicUtils.removeItemInArray(building.houses, house)
	DataUtils.refreshPlayerResources(playerDoc)
	if(house.type === 'dwelling' && playerDoc.resources.citizen < 0){
		building.houses.push(house);
		playerData.pop();
		return Promise.reject(ErrorUtils.houseCanNotBeMovedNow(playerDoc._id, buildingLocation, houseLocation))
	}
	return Promise.resolve(playerData);
}

/**
 * 修改玩家名称
 * @param playerDoc
 * @param playerData
 * @param newPlayerName
 * @param cacheService
 * @returns {*}
 */
var ChangePlayerName = function(playerDoc, playerData, newPlayerName, cacheService){
	if(_.isEqual(newPlayerName, playerDoc.basicInfo.name)) return Promise.reject(ErrorUtils.playerNameCanNotBeTheSame(playerDoc._id, newPlayerName))
	if(WordsFilter.isProfane(newPlayerName)){
		var e = ErrorUtils.playerNameNotLegal(playerDoc._id, newPlayerName);
		e.isLegal = true;
		return Promise.reject(e);
	}
	return Promise.fromCallback(function(callback){
		cacheService.getPlayerModel().collection.find({"basicInfo.name":newPlayerName}, {_id:true}).count(function(e, count){
			if(!!e) return callback(e);
			else if(count > 0){
				e = ErrorUtils.playerNameAlreadyUsed(playerDoc._id, newPlayerName);
				e.isLegal = true;
				return callback(e);
			}else{
				playerDoc.basicInfo.name = newPlayerName
				if(!playerDoc.countInfo.isFTEFinished){
					playerDoc.countInfo.isFTEFinished = true;
					playerData.push(["countInfo.isFTEFinished", playerDoc.countInfo.isFTEFinished])
				}
				playerData.push(["basicInfo.name", playerDoc.basicInfo.name])
				callback();
			}
		})
	})
}

/**
 * 撤销行军事件
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 * @param eventType
 * @param eventId
 * @param cacheService
 * @param eventFuncs
 * @param timeEventService
 * @returns {*}
 */
var RetreatTroop = function(playerDoc, playerData, allianceDoc, allianceData, eventType, eventId, cacheService, eventFuncs, timeEventService){
	var marchEvent = _.find(allianceDoc.marchEvents[eventType], function(marchEvent){
		return _.isEqual(marchEvent.id, eventId)
	})
	if(!_.isObject(marchEvent)) return Promise.reject(ErrorUtils.marchEventNotExist(playerDoc._id, allianceDoc._id, eventType, eventId))

	var marchDragon = playerDoc.dragons[marchEvent.attackPlayerData.dragon.type]
	LogicUtils.removePlayerTroopOut(playerDoc, playerData, marchDragon.type);
	DataUtils.refreshPlayerDragonsHp(playerDoc, marchDragon)
	playerDoc.dragons[marchDragon.type].status = Consts.DragonStatus.Free
	playerData.push(["dragons." + marchDragon.type, marchDragon])
	allianceData.push(['marchEvents.' + eventType + "." + allianceDoc.marchEvents[eventType].indexOf(marchEvent), null])
	LogicUtils.removeItemInArray(allianceDoc.marchEvents[eventType], marchEvent)
	eventFuncs.push([cacheService, cacheService.removeMarchEventAsync, eventType, marchEvent]);
	eventFuncs.push([timeEventService, timeEventService.removeAllianceTimeEventAsync, allianceDoc, eventType, marchEvent.id])

	if(_.isEqual(eventType, "attackMarchEvents")){
		_.each(marchEvent.attackPlayerData.soldiers, function(soldier){
			playerDoc.soldiers[soldier.name] += soldier.count
			playerData.push(["soldiers." + soldier.name, playerDoc.soldiers[soldier.name]])
		})
	}
	return Promise.resolve();
}

/**
 * 移城
 * @param playerDoc
 * @param playerData
 * @param locationX
 * @param locationY
 * @param allianceDoc
 * @param allianceData
 * @param cacheService
 */
var MoveTheCity = function(playerDoc, playerData, allianceDoc, allianceData, locationX, locationY, cacheService){
	if(_.isEqual(allianceDoc.basicInfo.status, Consts.AllianceStatus.Fight)){
		return Promise.reject(ErrorUtils.allianceInFightStatus(playerDoc._id, allianceDoc._id))
	}
	if(_.isObject(allianceDoc.allianceFight)) return Promise.reject(ErrorUtils.allianceInFightStatusCanNotQuitAlliance(playerDoc._id, allianceDoc._id))
	var hasStrikeMarchEventsToPlayer = _.some(cacheService.getMapDataAtIndex(allianceDoc.mapIndex).mapData.marchEvents.strikeMarchEvents, function(event){
		return event.marchType === Consts.MarchType.City && event.defencePlayerData.id === playerDoc._id;
	})
	var hasAttackMarchEventsToPlayer = _.some(cacheService.getMapDataAtIndex(allianceDoc.mapIndex).mapData.marchEvents.attackMarchEvents, function(event){
		return event.marchType === Consts.MarchType.City && event.defencePlayerData.id === playerDoc._id;
	})
	if(hasStrikeMarchEventsToPlayer || hasAttackMarchEventsToPlayer){
		return Promise.reject(ErrorUtils.beAttackedNowCanNotMoveCityNow(playerDoc._id, allianceId));
	}

	var marchEvents = [];
	marchEvents = marchEvents.concat(allianceDoc.marchEvents.attackMarchEvents, allianceDoc.marchEvents.attackMarchReturnEvents, allianceDoc.marchEvents.strikeMarchEvents, allianceDoc.marchEvents.strikeMarchReturnEvents)
	var hasMarchEvent = _.some(marchEvents, function(marchEvent){
		return _.isEqual(marchEvent.attackPlayerData.id, playerDoc._id)
	})
	var hasVillageEvent = _.some(allianceDoc.villageEvents, function(villageEvent){
		return villageEvent.playerData.id === playerDoc._id;
	})
	if(hasMarchEvent || hasVillageEvent) return Promise.reject(ErrorUtils.playerHasMarchEvent(playerDoc._id, allianceDoc._id))
	var playerMapId = LogicUtils.getObjectById(allianceDoc.members, playerDoc._id).mapId
	var playerMapObject = LogicUtils.getAllianceMapObjectById(allianceDoc, playerMapId)
	var mapObjects = allianceDoc.mapObjects
	var memberSizeInMap = DataUtils.getSizeInAllianceMap("member")
	var oldRect = {
		x:playerMapObject.location.x,
		y:playerMapObject.location.y,
		width:memberSizeInMap.width,
		height:memberSizeInMap.height
	}

	var newRect = {x:locationX, y:locationY, width:memberSizeInMap.width, height:memberSizeInMap.height}
	var map = MapUtils.buildMap(allianceDoc.basicInfo.terrainStyle, mapObjects)
	if(!MapUtils.isRectLegal(map, newRect, oldRect)) return Promise.reject(ErrorUtils.canNotMoveToTargetPlace(playerDoc._id, allianceDoc._id, oldRect, newRect))
	playerMapObject.location = {x:newRect.x, y:newRect.y}
	allianceData.push(["mapObjects." + allianceDoc.mapObjects.indexOf(playerMapObject) + ".location", playerMapObject.location])
	return Promise.resolve()
}

/**
 * 为指定的龙增加经验
 * @param playerDoc
 * @param playerData
 * @param dragonType
 * @param itemConfig
 * @returns {*}
 */
var DragonExp = function(playerDoc, playerData, dragonType, itemConfig){
	var dragon = playerDoc.dragons[dragonType]
	if(dragon.star <= 0) return Promise.reject(ErrorUtils.dragonNotHatched(playerDoc._id, dragonType))
	DataUtils.addPlayerDragonExp(playerDoc, playerData, dragon, parseInt(itemConfig.effect))

	return Promise.resolve()
}

/**
 * 为指定的龙增加Hp
 * @param playerDoc
 * @param playerData
 * @param dragonType
 * @param itemConfig
 * @returns {*}
 */
var DragonHp = function(playerDoc, playerData, dragonType, itemConfig){
	var dragon = playerDoc.dragons[dragonType]
	if(dragon.star <= 0) return Promise.reject(ErrorUtils.dragonNotHatched(playerDoc._id, dragonType))
	if(dragon.hp <= 0) return Promise.reject(ErrorUtils.dragonSelectedIsDead(playerDoc._id, dragon.type))
	DataUtils.refreshPlayerDragonsHp(playerDoc, dragon)
	var dragonHpMax = DataUtils.getDragonMaxHp(dragon)
	dragon.hp += parseInt(itemConfig.effect)
	dragon.hp = dragon.hp <= dragonHpMax ? dragon.hp : dragonHpMax
	playerData.push(["dragons." + dragon.type + ".hp", dragon.hp])
	playerData.push(["dragons." + dragon.type + ".hpRefreshTime", dragon.hpRefreshTime])

	return Promise.resolve()
}

/**
 * 增加英雄之血
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @returns {*}
 */
var HeroBlood = function(playerDoc, playerData, itemConfig){
	playerDoc.resources.blood += parseInt(itemConfig.effect)
	playerData.push(["resources.blood", playerDoc.resources.blood])
	return Promise.resolve()
}

/**
 * 增加精力
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @returns {*}
 */
var Stamina = function(playerDoc, playerData, itemConfig){
	DataUtils.refreshPlayerResources(playerDoc)
	playerDoc.resources.stamina += parseInt(itemConfig.effect)
	playerData.push(["resources", playerDoc.resources])
	return Promise.resolve()
}

/**
 * 恢复城墙血量
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @returns {*}
 */
var RestoreWallHp = function(playerDoc, playerData, itemConfig){
	DataUtils.refreshPlayerResources(playerDoc)
	playerDoc.resources.wallHp += parseInt(itemConfig.effect)
	DataUtils.refreshPlayerResources(playerDoc)
	playerData.push(["resources", playerDoc.resources])
	return Promise.resolve()
}

/**
 * 开巨龙宝箱
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @returns {*}
 */
var DragonChest = function(playerDoc, playerData, itemConfig){
	var ParseConfig = function(config){
		var objects = []
		var configArray_1 = config.split("|")
		_.each(configArray_1, function(config_1){
			var configArray_2 = config_1.split(",")
			var weight = parseInt(configArray_2.pop())
			var items = []
			_.each(configArray_2, function(config_2){
				var configArray_3 = config_2.split(":")
				var item = {
					type:configArray_3[0],
					name:configArray_3[1],
					count:parseInt(configArray_3[2])
				}
				items.push(item)
			})
			var object = {
				items:items,
				weight:weight
			}
			objects.push(object)
		})
		return objects
	}
	var SortFunc = function(objects){
		var totalWeight = 0
		_.each(objects, function(object){
			totalWeight += object.weight + 1
		})

		_.each(objects, function(object){
			var weight = object.weight + 1 + (Math.random() * totalWeight << 0)
			object.weight = weight
		})

		return _.sortBy(objects, function(object){
			return -object.weight
		})
	}

	var objects = ParseConfig(itemConfig.effect)
	objects = SortFunc(objects)
	var items = objects[0].items

	for(var i = 0; i < items.length; i++){
		var item = items[i]
		playerDoc[item.type][item.name] += item.count
		playerData.push([item.type + "." + item.name, playerDoc[item.type][item.name]])
	}

	return Promise.resolve()
}

/**
 * 扫荡PvE关卡
 * @param playerDoc
 * @param playerData
 * @param sectionName
 * @param count
 * @param dataService
 * @param activityService
 * @constructor
 */
var SweepPveSection = function(playerDoc, playerData, sectionName, count, dataService, activityService){
	if(!LogicUtils.isPlayerPvESectionReachMaxStar(playerDoc, sectionName))
		return Promise.reject(ErrorUtils.currentPvESectionCanNotBeSweepedYet(playerDoc._id, sectionName));
	var pveFight = _.find(playerDoc.pveFights, function(pveFight){
		return _.isEqual(pveFight.sectionName, sectionName);
	})
	var maxFightCount = DataUtils.getPvEMaxFightCount(sectionName);
	if((count > maxFightCount) || (_.isObject(pveFight) && pveFight.count + count > maxFightCount))
		return Promise.reject(ErrorUtils.currentSectionReachMaxFightCount(playerDoc._id, sectionName));
	DataUtils.refreshPlayerResources(playerDoc);
	playerData.push(["resources", playerDoc.resources])
	var staminaUsed = DataUtils.getPvESectionStaminaCount(sectionName, count);
	if(playerDoc.resources.stamina < staminaUsed)
		return Promise.reject(ErrorUtils.playerStaminaNotEnough(playerDoc._id, playerDoc.resources.stamina, staminaUsed));
	var totalRewards = [];
	var rewards = [];
	for(var i = 0; i < count; i++){
		var reward = DataUtils.getPveSectionReward(sectionName, 3);
		LogicUtils.mergeRewards(rewards, [reward]);
		totalRewards.push(reward);
	}
	playerData.push(['__rewards', totalRewards]);
	if(!_.isObject(pveFight)){
		pveFight = {
			sectionName:sectionName,
			count:count
		}
		playerDoc.pveFights.push(pveFight);
		playerData.push(['pveFights.' + playerDoc.pveFights.indexOf(pveFight), pveFight]);
	}else{
		pveFight.count += count;
		playerData.push(['pveFights.' + playerDoc.pveFights.indexOf(pveFight) + '.count', pveFight.count]);
	}
	playerDoc.resources.stamina -= staminaUsed;
	playerDoc.countInfo.pveCount += count;
	playerData.push(['countInfo.pveCount', playerDoc.countInfo.pveCount]);
	TaskUtils.finishPveCountTaskIfNeed(playerDoc, playerData);
	var stageIndex = parseInt(sectionName.split('_')[0]);
	var scoreKey = DataUtils.getPveScoreConditionKey(stageIndex);
	activityService.addPlayerActivityScore(playerDoc, playerData, 'pveFight', scoreKey, count);
	if(!!playerDoc.allianceId){
		activityService.addAllianceActivityScoreById(playerDoc.allianceId, 'pveFight', scoreKey, count);
	}
	return dataService.addPlayerRewardsAsync(playerDoc, playerData, 'SweepPveSection', null, rewards, false);
}

/**
 * 开宝箱,送道具
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @param dataService
 * @returns {*}
 * @constructor
 */
var Chest = function(playerDoc, playerData, itemConfig, dataService){
	var ParseConfig = function(config){
		var objects = []
		var configArray_1 = config.split(",")
		_.each(configArray_1, function(config_1){
			var configArray_2 = config_1.split(":")
			var object = {
				type:configArray_2[0],
				name:configArray_2[1],
				count:parseInt(configArray_2[2]),
				weight:parseInt(configArray_2[3])
			}
			objects.push(object)
		})
		return objects
	}
	var SortFunc = function(objects){
		var totalWeight = 0
		_.each(objects, function(object){
			totalWeight += object.weight + 1
		})

		_.each(objects, function(object){
			var weight = object.weight + 1 + (Math.random() * totalWeight << 0)
			object.weight = weight
		})

		return _.sortBy(objects, function(object){
			return -object.weight
		})
	}

	var items = ParseConfig(itemConfig.effect)
	items = SortFunc(items)
	var selectCount = DataUtils.getPlayerIntInit('chestSelectCountPerItem');
	var selectedItems = [];
	for(var i = 0; i < selectCount; i++){
		var item = items[i]
		selectedItems.push(item);
	}
	return dataService.addPlayerItemsAsync(playerDoc, playerData, 'Chest', null, selectedItems)
}

/**
 * Vip激活
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @param eventFuncs
 * @param timeEventService
 * @return {*}
 */
var VipActive = function(playerDoc, playerData, itemConfig, eventFuncs, timeEventService){
	var event = playerDoc.vipEvents[0]
	var time = parseInt(itemConfig.effect) * 60 * 1000

	if(_.isObject(event) && !LogicUtils.willFinished(event.finishTime)){
		event.finishTime += time
		playerData.push(["vipEvents." + playerDoc.vipEvents.indexOf(event) + ".finishTime", event.finishTime])
		eventFuncs.push([timeEventService, timeEventService.updatePlayerTimeEventAsync, playerDoc, "vipEvents", event.id, event.finishTime - Date.now()])
	}else{
		if(_.isObject(event) && LogicUtils.willFinished(event.finishTime)){
			playerData.push(["vipEvents." + playerDoc.vipEvents.indexOf(event), null])
			LogicUtils.removeItemInArray(playerDoc.vipEvents, event)
			eventFuncs.push([timeEventService, timeEventService.removePlayerTimeEventAsync, playerDoc, "vipEvents", event.id])
		}
		event = {
			id:ShortId.generate(),
			startTime:Date.now(),
			finishTime:Date.now() + time
		}
		playerDoc.vipEvents.push(event)
		playerData.push(["vipEvents." + playerDoc.vipEvents.indexOf(event), event])
		eventFuncs.push([timeEventService, timeEventService.addPlayerTimeEventAsync, playerDoc, "vipEvents", event.id, event.finishTime - Date.now()])
	}

	return Promise.resolve()
}

/**
 * 增加Vip经验值
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @param eventFuncs
 * @param timeEventService
 * @returns {*}
 */
var VipPoint = function(playerDoc, playerData, itemConfig, eventFuncs, timeEventService){
	var vipPoint = parseInt(itemConfig.effect)
	DataUtils.addPlayerVipExp(playerDoc, playerData, vipPoint, eventFuncs, timeEventService)
	return Promise.resolve()
}

/**
 * 使用Buff道具
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @param eventFuncs
 * @param timeEventService
 * @returns {*}
 */
var Buff = function(playerDoc, playerData, itemConfig, eventFuncs, timeEventService){
	DataUtils.refreshPlayerResources(playerDoc)
	playerData.push(["resources", playerDoc.resources])
	var time = itemConfig.effect * 60 * 60 * 1000
	var event = _.find(playerDoc.itemEvents, function(itemEvent){
		return _.isEqual(itemEvent.type, itemConfig.type)
	})

	if(_.isObject(event) && !LogicUtils.willFinished(event.finishTime)){
		event.finishTime += time
		playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event) + ".finishTime", event.finishTime])
		eventFuncs.push([timeEventService, timeEventService.updatePlayerTimeEventAsync, playerDoc, "itemEvents", event.id, event.finishTime - Date.now()])
	}else{
		if(_.isObject(event) && LogicUtils.willFinished(event.finishTime)){
			playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event), null])
			LogicUtils.removeItemInArray(playerDoc.itemEvents, event)
			eventFuncs.push([timeEventService, timeEventService.removePlayerTimeEventAsync, playerDoc, "itemEvents", event.id])
		}
		event = {
			id:ShortId.generate(),
			type:itemConfig.type,
			startTime:Date.now(),
			finishTime:Date.now() + time
		}
		playerDoc.itemEvents.push(event)
		playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event), event])
		eventFuncs.push([timeEventService, timeEventService.addPlayerTimeEventAsync, playerDoc, "itemEvents", event.id, event.finishTime - Date.now()])
	}

	return Promise.resolve()
}

/**
 * 使用资源道具
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @param resourceName
 * @param resourceCount
 * @param dataService
 * @return {*}
 */
var Resource = function(playerDoc, playerData, itemConfig, resourceName, resourceCount, dataService){
	DataUtils.refreshPlayerResources(playerDoc)
	var count = 0
	if(_.isEqual(resourceName, "citizen")){
		var freeCitizenLimit = DataUtils.getPlayerFreeCitizenLimit(playerDoc)
		var freeCitizen = DataUtils.getPlayerCitizen(playerDoc)
		var citizenAddCount = Math.round(itemConfig.effect * freeCitizenLimit * resourceCount);
		count = Math.floor(citizenAddCount + freeCitizen > freeCitizenLimit ? freeCitizenLimit - freeCitizen : citizenAddCount)
		playerDoc.resources[resourceName] += count;
	}else if(_.isEqual(resourceName, "gem")){
		count = Math.floor(itemConfig.effect)
		dataService.addPlayerRewardsAsync(playerDoc, playerData, 'useItem.Resource', null, [{
			type:'resources',
			name:'gem',
			count:(count * resourceCount)
		}], true);
	}else{
		count = Math.floor(itemConfig.effect * 1000)
		playerDoc.resources[resourceName] += count * resourceCount
	}
	playerData.push(["resources", playerDoc.resources])
	return Promise.resolve();
}

/**
 * 事件加速
 * @param playerDoc
 * @param playerData
 * @param eventType
 * @param eventId
 * @param speedupTime
 * @param eventFuncs
 * @param timeEventService
 * @param playerTimeEventService
 * @returns {*}
 */
var Speedup = function(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService){
	var event = _.find(playerDoc[eventType], function(event){
		return _.isEqual(event.id, eventId)
	})
	if(!_.isObject(event)) return Promise.reject(ErrorUtils.playerEventNotExist(playerDoc._id, eventType, eventId))
	event.startTime -= speedupTime
	event.finishTime -= speedupTime

	if(LogicUtils.willFinished(event.finishTime)){
		playerTimeEventService.onPlayerEvent(playerDoc, playerData, eventType, eventId)
	}else{
		playerData.push([eventType + "." + playerDoc[eventType].indexOf(event), event])
		eventFuncs.push([timeEventService, timeEventService.updatePlayerTimeEventAsync, playerDoc, eventType, event.id, event.finishTime - Date.now()])
	}

	if(_.contains(Consts.BuildingSpeedupEventTypes, eventType)){
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'speedupBuildingUpgrade')
	}else if(_.isEqual(eventType, "soldierEvents")){
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'speedupSoldierRecruit')
	}
	return Promise.resolve()
}

/**
 * 行军事件加速
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 * @param eventType
 * @param eventId
 * @param speedupPercent
 * @param cacheService
 * @param eventFuncs
 * @param timeEventService
 * @returns {*}
 */
var WarSpeedup = function(playerDoc, playerData, allianceDoc, allianceData, eventType, eventId, speedupPercent, cacheService, eventFuncs, timeEventService){
	var marchEvent = _.find(allianceDoc.marchEvents[eventType], function(marchEvent){
		return _.isEqual(marchEvent.id, eventId)
	})
	if(!_.isObject(marchEvent)) return Promise.reject(ErrorUtils.marchEventNotExist(playerDoc._id, allianceDoc._id, eventType, eventId))
	if(!LogicUtils.willFinished(marchEvent.arriveTime)){
		var marchTimeLeft = marchEvent.arriveTime - Date.now()
		var marchTimeSpeedup = Math.round(marchTimeLeft * speedupPercent)
		marchEvent.startTime -= marchTimeSpeedup
		marchEvent.arriveTime -= marchTimeSpeedup
		allianceData.push(['marchEvents.' + eventType + "." + allianceDoc.marchEvents[eventType].indexOf(marchEvent), marchEvent])
		eventFuncs.push([timeEventService, timeEventService.updateAllianceTimeEventAsync, allianceDoc, eventType, marchEvent.id, marchEvent.arriveTime - Date.now()])
		eventFuncs.push([cacheService, cacheService.updateMarchEventAsync, eventType, marchEvent])
	}
	return Promise.resolve()
}

/**
 * 拆红包,送道具
 * @param playerDoc
 * @param playerData
 * @param itemConfig
 * @param dataService
 * @returns {*}
 * @constructor
 */
var Redbag = function(playerDoc, playerData, itemConfig, dataService){
	var ParseConfig = function(config){
		var objects = []
		var configArray_1 = config.split(",")
		_.each(configArray_1, function(config_1){
			var configArray_2 = config_1.split(":")
			var object = {
				type:configArray_2[0],
				name:configArray_2[1],
				count:parseInt(configArray_2[2]),
				weight:parseInt(configArray_2[3])
			}
			objects.push(object)
		})
		return objects
	}
	var SortFunc = function(objects){
		var totalWeight = 0
		_.each(objects, function(object){
			totalWeight += object.weight + 1
		})

		_.each(objects, function(object){
			var weight = object.weight + 1 + (Math.random() * totalWeight << 0)
			object.weight = weight
		})

		return _.sortBy(objects, function(object){
			return -object.weight
		})
	}

	var items = ParseConfig(itemConfig.effect)
	items = SortFunc(items)
	var item = items[0]
	return dataService.addPlayerRewardsAsync(playerDoc, playerData, 'useItem.Redbag', null, [item], true);
}

/**
 * 参数是否合法
 * @param itemName
 * @param params
 * @returns {*}
 */
Utils.isParamsLegal = function(itemName, params){
	var itemData = _.isObject(params[itemName]) ? params[itemName] : null
	if(_.isEqual(itemName, "movingConstruction")){
		if(!_.isObject(itemData)) return false
		var fromBuildingLocation = itemData.fromBuildingLocation
		var fromHouseLocation = itemData.fromHouseLocation
		var toBuildingLocation = itemData.toBuildingLocation
		var toHouseLocation = itemData.toHouseLocation

		if(!_.isNumber(fromBuildingLocation) || fromBuildingLocation % 1 !== 0 || fromBuildingLocation < 1 || fromBuildingLocation > 20) return false
		if(!_.isNumber(fromHouseLocation) || fromHouseLocation % 1 !== 0 || fromHouseLocation < 1 || fromHouseLocation > 3) return false
		if(!_.isNumber(toBuildingLocation) || toBuildingLocation % 1 !== 0 || toBuildingLocation < 1 || toBuildingLocation > 20) return false
		if(!_.isNumber(toHouseLocation) || toHouseLocation % 1 !== 0 || toHouseLocation < 1 || toHouseLocation > 3) return false
		return !(fromBuildingLocation == toBuildingLocation && fromHouseLocation == toHouseLocation)
	}
	if(_.isEqual(itemName, "torch")){
		if(!_.isObject(itemData)) return false
		var buildingLocation = itemData.buildingLocation
		var houseLocation = itemData.houseLocation

		if(!_.isNumber(buildingLocation) || buildingLocation % 1 !== 0 || buildingLocation < 1 || buildingLocation > 20) return false
		return !(!_.isNumber(houseLocation) || houseLocation % 1 !== 0 || houseLocation < 1 || houseLocation > 3)
	}
	if(_.isEqual(itemName, "changePlayerName")){
		if(!_.isObject(itemData)) return false
		var playerName = itemData.playerName
		return !(!_.isString(playerName) || playerName.trim().length === 0 || playerName.trim().length > Define.InputLength.PlayerName)
	}
	var eventType = null;
	var eventId = null;
	var count = null;
	if(_.isEqual(itemName, "retreatTroop")){
		if(!_.isObject(itemData)) return false
		eventType = itemData.eventType
		eventId = itemData.eventId
		if(!_.isString(eventType)) return false
		if(!_.isEqual(eventType, "strikeMarchEvents") && !_.isEqual(eventType, "attackMarchEvents")) return false
		return _.isString(eventId)
	}
	if(_.isEqual(itemName, "moveTheCity")){
		if(!_.isObject(itemData)) return false
		var locationX = itemData.locationX
		var locationY = itemData.locationY
		var locationXMax = DataUtils.getAllianceIntInit('allianceRegionMapWidth') - 1;
		var locationYMax = DataUtils.getAllianceIntInit('allianceRegionMapHeight') - 1;

		if(!_.isNumber(locationX) || locationX % 1 !== 0 || locationX < 0 || locationX > locationXMax) return false
		return !(!_.isNumber(locationY) || locationY % 1 !== 0 || locationY < 0 || locationY > locationYMax)
	}
	var dragonType = null
	if(itemName.indexOf('dragonExp_') === 0){
		if(!_.isObject(itemData)) return false
		dragonType = itemData.dragonType
		return DataUtils.isDragonTypeExist(dragonType)
	}
	if(itemName.indexOf('dragonHp_') === 0){
		if(!_.isObject(itemData)) return false
		dragonType = itemData.dragonType
		return DataUtils.isDragonTypeExist(dragonType)
	}
	if(itemName.indexOf('speedup_') === 0){
		if(!_.isObject(itemData)) return false;
		eventType = itemData.eventType
		eventId = itemData.eventId
		count = itemData.count;
		if(!_.contains(Consts.SpeedUpEventTypes, eventType)) return false
		if(!_.isNumber(count) || count % 1 !== 0 || count < 1) return false;
		return _.isString(eventId)
	}
	if(itemName.indexOf('warSpeedupClass_') === 0){
		if(!_.isObject(itemData)) return false
		eventType = itemData.eventType
		eventId = itemData.eventId
		if(!_.contains(_.values(Consts.WarSpeedupEventTypes), eventType)) return false
		return _.isString(eventId)
	}
	if(_.isEqual(itemName, 'sweepScroll')){
		if(!_.isObject(itemData)) return false
		var sectionName = itemData.sectionName;
		if(!DataUtils.isPvESectionSweepAble(sectionName)) return false;
		if(!_.isNumber(itemData.count) || itemData.count % 1 !== 0 || itemData.count < 1) return false;
	}
	if(_.isObject(Items.resource[itemName])){
		if(!_.isObject(itemData)) return false;
		count = itemData.count;
		if(!_.isNumber(count) || count % 1 !== 0 || count < 1) return false;
	}
	return true
}

/**
 * 使用道具
 * @param itemName
 * @param itemData
 * @param playerDoc
 * @param playerData
 * @param cacheService
 * @param eventFuncs
 * @param timeEventService
 * @param playerTimeEventService
 * @param dataService
 * @param activityService
 * @returns {*}
 */
Utils.useItem = function(itemName, itemData, playerDoc, playerData, cacheService, eventFuncs, timeEventService, playerTimeEventService, dataService, activityService){
	var functionMap = {
		movingConstruction:function(){
			var fromBuildingLocation = itemData.fromBuildingLocation
			var fromHouseLocation = itemData.fromHouseLocation
			var toBuildingLocation = itemData.toBuildingLocation
			var toHouseLocation = itemData.toHouseLocation
			return MovingConstruction(playerDoc, playerData, fromBuildingLocation, fromHouseLocation, toBuildingLocation, toHouseLocation)
		},
		torch:function(){
			var buildingLocation = itemData.buildingLocation
			var houseLocation = itemData.houseLocation
			return Torch(playerDoc, playerData, buildingLocation, houseLocation)
		},
		changePlayerName:function(){
			var playerName = itemData.playerName
			return ChangePlayerName(playerDoc, playerData, playerName, cacheService)
		},
		dragonExp_1:function(){
			var dragonType = itemData.dragonType
			var itemConfig = Items.special.dragonExp_1
			return DragonExp(playerDoc, playerData, dragonType, itemConfig)
		},
		dragonExp_2:function(){
			var dragonType = itemData.dragonType
			var itemConfig = Items.special.dragonExp_2
			return DragonExp(playerDoc, playerData, dragonType, itemConfig)
		},
		dragonExp_3:function(){
			var dragonType = itemData.dragonType
			var itemConfig = Items.special.dragonExp_3
			return DragonExp(playerDoc, playerData, dragonType, itemConfig)
		},
		dragonHp_1:function(){
			var dragonType = itemData.dragonType
			var itemConfig = Items.special.dragonHp_1
			return DragonHp(playerDoc, playerData, dragonType, itemConfig)
		},
		dragonHp_2:function(){
			var dragonType = itemData.dragonType
			var itemConfig = Items.special.dragonHp_2
			return DragonHp(playerDoc, playerData, dragonType, itemConfig)
		},
		dragonHp_3:function(){
			var dragonType = itemData.dragonType
			var itemConfig = Items.special.dragonHp_3
			return DragonHp(playerDoc, playerData, dragonType, itemConfig)
		},
		heroBlood_1:function(){
			var itemConfig = Items.special.heroBlood_1
			return HeroBlood(playerDoc, playerData, itemConfig)
		},
		heroBlood_2:function(){
			var itemConfig = Items.special.heroBlood_2
			return HeroBlood(playerDoc, playerData, itemConfig)
		},
		heroBlood_3:function(){
			var itemConfig = Items.special.heroBlood_3
			return HeroBlood(playerDoc, playerData, itemConfig)
		},
		stamina_1:function(){
			var itemConfig = Items.special.stamina_1
			return Stamina(playerDoc, playerData, itemConfig)
		},
		stamina_2:function(){
			var itemConfig = Items.special.stamina_2
			return Stamina(playerDoc, playerData, itemConfig)
		},
		stamina_3:function(){
			var itemConfig = Items.special.stamina_3
			return Stamina(playerDoc, playerData, itemConfig)
		},
		restoreWall_1:function(){
			var itemConfig = Items.special.restoreWall_1
			return RestoreWallHp(playerDoc, playerData, itemConfig)
		},
		restoreWall_2:function(){
			var itemConfig = Items.special.restoreWall_2
			return RestoreWallHp(playerDoc, playerData, itemConfig)
		},
		restoreWall_3:function(){
			var itemConfig = Items.special.restoreWall_3
			return RestoreWallHp(playerDoc, playerData, itemConfig)
		},
		sweepScroll:function(){
			var sectionName = itemData.sectionName;
			var count = itemData.count;
			return SweepPveSection(playerDoc, playerData, sectionName, count, dataService, activityService);
		},
		dragonChest_1:function(){
			var itemConfig = Items.special.dragonChest_1
			return DragonChest(playerDoc, playerData, itemConfig)
		},
		dragonChest_2:function(){
			var itemConfig = Items.special.dragonChest_2
			return DragonChest(playerDoc, playerData, itemConfig)
		},
		dragonChest_3:function(){
			var itemConfig = Items.special.dragonChest_3
			return DragonChest(playerDoc, playerData, itemConfig)
		},
		chest_1:function(){
			var itemConfig = Items.special.chest_1
			return Chest(playerDoc, playerData, itemConfig, dataService)
		},
		chest_2:function(){
			var itemConfig = Items.special.chest_2
			return Chest(playerDoc, playerData, itemConfig, dataService)
		},
		chest_3:function(){
			var itemConfig = Items.special.chest_3
			return Chest(playerDoc, playerData, itemConfig, dataService)
		},
		chest_4:function(){
			var itemConfig = Items.special.chest_4
			return Chest(playerDoc, playerData, itemConfig, dataService)
		},
		vipActive_1:function(){
			var itemConfig = Items.special.vipActive_1
			return VipActive(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		vipActive_2:function(){
			var itemConfig = Items.special.vipActive_2
			return VipActive(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		vipActive_3:function(){
			var itemConfig = Items.special.vipActive_3
			return VipActive(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		vipActive_4:function(){
			var itemConfig = Items.special.vipActive_4
			return VipActive(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		vipActive_5:function(){
			var itemConfig = Items.special.vipActive_5
			return VipActive(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		vipPoint_1:function(){
			var itemConfig = Items.special.vipPoint_1
			return VipPoint(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		vipPoint_2:function(){
			var itemConfig = Items.special.vipPoint_2
			return VipPoint(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		vipPoint_3:function(){
			var itemConfig = Items.special.vipPoint_3
			return VipPoint(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		vipPoint_4:function(){
			var itemConfig = Items.special.vipPoint_4
			return VipPoint(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		masterOfDefender_1:function(){
			var itemConfig = Items.buff.masterOfDefender_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		masterOfDefender_2:function(){
			var itemConfig = Items.buff.masterOfDefender_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		masterOfDefender_3:function(){
			var itemConfig = Items.buff.masterOfDefender_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		masterOfDefender_4:function(){
			var itemConfig = Items.buff.masterOfDefender_4
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		quarterMaster_1:function(){
			var itemConfig = Items.buff.quarterMaster_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		quarterMaster_2:function(){
			var itemConfig = Items.buff.quarterMaster_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		quarterMaster_3:function(){
			var itemConfig = Items.buff.quarterMaster_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		fogOfTrick_1:function(){
			var itemConfig = Items.buff.fogOfTrick_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		fogOfTrick_2:function(){
			var itemConfig = Items.buff.fogOfTrick_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		fogOfTrick_3:function(){
			var itemConfig = Items.buff.fogOfTrick_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		woodBonus_1:function(){
			var itemConfig = Items.buff.woodBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		woodBonus_2:function(){
			var itemConfig = Items.buff.woodBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		woodBonus_3:function(){
			var itemConfig = Items.buff.woodBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		stoneBonus_1:function(){
			var itemConfig = Items.buff.stoneBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		stoneBonus_2:function(){
			var itemConfig = Items.buff.stoneBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		stoneBonus_3:function(){
			var itemConfig = Items.buff.stoneBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		ironBonus_1:function(){
			var itemConfig = Items.buff.ironBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		ironBonus_2:function(){
			var itemConfig = Items.buff.ironBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		ironBonus_3:function(){
			var itemConfig = Items.buff.ironBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		foodBonus_1:function(){
			var itemConfig = Items.buff.foodBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		foodBonus_2:function(){
			var itemConfig = Items.buff.foodBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		foodBonus_3:function(){
			var itemConfig = Items.buff.foodBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		coinBonus_1:function(){
			var itemConfig = Items.buff.coinBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		coinBonus_2:function(){
			var itemConfig = Items.buff.coinBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		coinBonus_3:function(){
			var itemConfig = Items.buff.coinBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		citizenBonus_1:function(){
			var itemConfig = Items.buff.citizenBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		citizenBonus_2:function(){
			var itemConfig = Items.buff.citizenBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		citizenBonus_3:function(){
			var itemConfig = Items.buff.citizenBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		dragonExpBonus_1:function(){
			var itemConfig = Items.buff.dragonExpBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		dragonExpBonus_2:function(){
			var itemConfig = Items.buff.dragonExpBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		dragonExpBonus_3:function(){
			var itemConfig = Items.buff.dragonExpBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		troopSizeBonus_1:function(){
			var itemConfig = Items.buff.troopSizeBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		troopSizeBonus_2:function(){
			var itemConfig = Items.buff.troopSizeBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		troopSizeBonus_3:function(){
			var itemConfig = Items.buff.troopSizeBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		dragonHpBonus_1:function(){
			var itemConfig = Items.buff.dragonHpBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		dragonHpBonus_2:function(){
			var itemConfig = Items.buff.dragonHpBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		dragonHpBonus_3:function(){
			var itemConfig = Items.buff.dragonHpBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		marchSpeedBonus_1:function(){
			var itemConfig = Items.buff.marchSpeedBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		marchSpeedBonus_2:function(){
			var itemConfig = Items.buff.marchSpeedBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		marchSpeedBonus_3:function(){
			var itemConfig = Items.buff.marchSpeedBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		unitHpBonus_1:function(){
			var itemConfig = Items.buff.unitHpBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		unitHpBonus_2:function(){
			var itemConfig = Items.buff.unitHpBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		unitHpBonus_3:function(){
			var itemConfig = Items.buff.unitHpBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		infantryAtkBonus_1:function(){
			var itemConfig = Items.buff.infantryAtkBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		infantryAtkBonus_2:function(){
			var itemConfig = Items.buff.infantryAtkBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		infantryAtkBonus_3:function(){
			var itemConfig = Items.buff.infantryAtkBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		archerAtkBonus_1:function(){
			var itemConfig = Items.buff.archerAtkBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		archerAtkBonus_2:function(){
			var itemConfig = Items.buff.archerAtkBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		archerAtkBonus_3:function(){
			var itemConfig = Items.buff.archerAtkBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		cavalryAtkBonus_1:function(){
			var itemConfig = Items.buff.cavalryAtkBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		cavalryAtkBonus_2:function(){
			var itemConfig = Items.buff.cavalryAtkBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		cavalryAtkBonus_3:function(){
			var itemConfig = Items.buff.cavalryAtkBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		siegeAtkBonus_1:function(){
			var itemConfig = Items.buff.siegeAtkBonus_1
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		siegeAtkBonus_2:function(){
			var itemConfig = Items.buff.siegeAtkBonus_2
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		siegeAtkBonus_3:function(){
			var itemConfig = Items.buff.siegeAtkBonus_3
			return Buff(playerDoc, playerData, itemConfig, eventFuncs, timeEventService)
		},
		woodClass_1:function(){
			var itemConfig = Items.resource.woodClass_1
			return Resource(playerDoc, playerData, itemConfig, "wood", itemData.count, dataService)
		},
		woodClass_2:function(){
			var itemConfig = Items.resource.woodClass_2
			return Resource(playerDoc, playerData, itemConfig, "wood", itemData.count, dataService)
		},
		woodClass_3:function(){
			var itemConfig = Items.resource.woodClass_3
			return Resource(playerDoc, playerData, itemConfig, "wood", itemData.count, dataService)
		},
		woodClass_4:function(){
			var itemConfig = Items.resource.woodClass_4
			return Resource(playerDoc, playerData, itemConfig, "wood", itemData.count, dataService)
		},
		woodClass_5:function(){
			var itemConfig = Items.resource.woodClass_5
			return Resource(playerDoc, playerData, itemConfig, "wood", itemData.count, dataService)
		},
		woodClass_6:function(){
			var itemConfig = Items.resource.woodClass_6
			return Resource(playerDoc, playerData, itemConfig, "wood", itemData.count, dataService)
		},
		woodClass_7:function(){
			var itemConfig = Items.resource.woodClass_7
			return Resource(playerDoc, playerData, itemConfig, "wood", itemData.count, dataService)
		},
		stoneClass_1:function(){
			var itemConfig = Items.resource.stoneClass_1
			return Resource(playerDoc, playerData, itemConfig, "stone", itemData.count, dataService)
		},
		stoneClass_2:function(){
			var itemConfig = Items.resource.stoneClass_2
			return Resource(playerDoc, playerData, itemConfig, "stone", itemData.count, dataService)
		},
		stoneClass_3:function(){
			var itemConfig = Items.resource.stoneClass_3
			return Resource(playerDoc, playerData, itemConfig, "stone", itemData.count, dataService)
		},
		stoneClass_4:function(){
			var itemConfig = Items.resource.stoneClass_4
			return Resource(playerDoc, playerData, itemConfig, "stone", itemData.count, dataService)
		},
		stoneClass_5:function(){
			var itemConfig = Items.resource.stoneClass_5
			return Resource(playerDoc, playerData, itemConfig, "stone", itemData.count, dataService)
		},
		stoneClass_6:function(){
			var itemConfig = Items.resource.stoneClass_6
			return Resource(playerDoc, playerData, itemConfig, "stone", itemData.count, dataService)
		},
		stoneClass_7:function(){
			var itemConfig = Items.resource.stoneClass_7
			return Resource(playerDoc, playerData, itemConfig, "stone", itemData.count, dataService)
		},
		ironClass_1:function(){
			var itemConfig = Items.resource.ironClass_1
			return Resource(playerDoc, playerData, itemConfig, "iron", itemData.count, dataService)
		},
		ironClass_2:function(){
			var itemConfig = Items.resource.ironClass_2
			return Resource(playerDoc, playerData, itemConfig, "iron", itemData.count, dataService)
		},
		ironClass_3:function(){
			var itemConfig = Items.resource.ironClass_3
			return Resource(playerDoc, playerData, itemConfig, "iron", itemData.count, dataService)
		},
		ironClass_4:function(){
			var itemConfig = Items.resource.ironClass_4
			return Resource(playerDoc, playerData, itemConfig, "iron", itemData.count, dataService)
		},
		ironClass_5:function(){
			var itemConfig = Items.resource.ironClass_5
			return Resource(playerDoc, playerData, itemConfig, "iron", itemData.count, dataService)
		},
		ironClass_6:function(){
			var itemConfig = Items.resource.ironClass_6
			return Resource(playerDoc, playerData, itemConfig, "iron", itemData.count, dataService)
		},
		ironClass_7:function(){
			var itemConfig = Items.resource.ironClass_7
			return Resource(playerDoc, playerData, itemConfig, "iron", itemData.count, dataService)
		},
		foodClass_1:function(){
			var itemConfig = Items.resource.foodClass_1
			return Resource(playerDoc, playerData, itemConfig, "food", itemData.count, dataService)
		},
		foodClass_2:function(){
			var itemConfig = Items.resource.foodClass_2
			return Resource(playerDoc, playerData, itemConfig, "food", itemData.count, dataService)
		},
		foodClass_3:function(){
			var itemConfig = Items.resource.foodClass_3
			return Resource(playerDoc, playerData, itemConfig, "food", itemData.count, dataService)
		},
		foodClass_4:function(){
			var itemConfig = Items.resource.foodClass_4
			return Resource(playerDoc, playerData, itemConfig, "food", itemData.count, dataService)
		},
		foodClass_5:function(){
			var itemConfig = Items.resource.foodClass_5
			return Resource(playerDoc, playerData, itemConfig, "food", itemData.count, dataService)
		},
		foodClass_6:function(){
			var itemConfig = Items.resource.foodClass_6
			return Resource(playerDoc, playerData, itemConfig, "food", itemData.count, dataService)
		},
		foodClass_7:function(){
			var itemConfig = Items.resource.foodClass_7
			return Resource(playerDoc, playerData, itemConfig, "food", itemData.count, dataService)
		},
		coinClass_1:function(){
			var itemConfig = Items.resource.coinClass_1
			return Resource(playerDoc, playerData, itemConfig, "coin", itemData.count, dataService)
		},
		coinClass_2:function(){
			var itemConfig = Items.resource.coinClass_2
			return Resource(playerDoc, playerData, itemConfig, "coin", itemData.count, dataService)
		},
		coinClass_3:function(){
			var itemConfig = Items.resource.coinClass_3
			return Resource(playerDoc, playerData, itemConfig, "coin", itemData.count, dataService)
		},
		coinClass_4:function(){
			var itemConfig = Items.resource.coinClass_4
			return Resource(playerDoc, playerData, itemConfig, "coin", itemData.count, dataService)
		},
		coinClass_5:function(){
			var itemConfig = Items.resource.coinClass_5
			return Resource(playerDoc, playerData, itemConfig, "coin", itemData.count, dataService)
		},
		coinClass_6:function(){
			var itemConfig = Items.resource.coinClass_6
			return Resource(playerDoc, playerData, itemConfig, "coin", itemData.count, dataService)
		},
		coinClass_7:function(){
			var itemConfig = Items.resource.coinClass_7
			return Resource(playerDoc, playerData, itemConfig, "coin", itemData.count, dataService)
		},
		citizenClass_1:function(){
			var itemConfig = Items.resource.citizenClass_1
			return Resource(playerDoc, playerData, itemConfig, "citizen", itemData.count, dataService)
		},
		citizenClass_2:function(){
			var itemConfig = Items.resource.citizenClass_2
			return Resource(playerDoc, playerData, itemConfig, "citizen", itemData.count, dataService)
		},
		citizenClass_3:function(){
			var itemConfig = Items.resource.citizenClass_3
			return Resource(playerDoc, playerData, itemConfig, "citizen", itemData.count, dataService)
		},
		casinoTokenClass_1:function(){
			var itemConfig = Items.resource.casinoTokenClass_1
			return Resource(playerDoc, playerData, itemConfig, "casinoToken", itemData.count, dataService)
		},
		casinoTokenClass_2:function(){
			var itemConfig = Items.resource.casinoTokenClass_2
			return Resource(playerDoc, playerData, itemConfig, "casinoToken", itemData.count, dataService)
		},
		casinoTokenClass_3:function(){
			var itemConfig = Items.resource.casinoTokenClass_3
			return Resource(playerDoc, playerData, itemConfig, "casinoToken", itemData.count, dataService)
		},
		casinoTokenClass_4:function(){
			var itemConfig = Items.resource.casinoTokenClass_4
			return Resource(playerDoc, playerData, itemConfig, "casinoToken", itemData.count, dataService)
		},
		casinoTokenClass_5:function(){
			var itemConfig = Items.resource.casinoTokenClass_5
			return Resource(playerDoc, playerData, itemConfig, "casinoToken", itemData.count, dataService)
		},
		gemClass_1:function(){
			var itemConfig = Items.resource.gemClass_1
			return Resource(playerDoc, playerData, itemConfig, "gem", itemData.count, dataService)
		},
		gemClass_2:function(){
			var itemConfig = Items.resource.gemClass_2
			return Resource(playerDoc, playerData, itemConfig, "gem", itemData.count, dataService)
		},
		gemClass_3:function(){
			var itemConfig = Items.resource.gemClass_3
			return Resource(playerDoc, playerData, itemConfig, "gem", itemData.count, dataService)
		},
		speedup_1:function(){
			var itemConfig = Items.speedup.speedup_1
			var speedupTime = Math.round(itemConfig.effect * 60 * 1000 * itemData.count)
			var eventType = itemData.eventType
			var eventId = itemData.eventId
			return Speedup(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService)
		},
		speedup_2:function(){
			var itemConfig = Items.speedup.speedup_2
			var speedupTime = Math.round(itemConfig.effect * 60 * 1000 * itemData.count)
			var eventType = itemData.eventType
			var eventId = itemData.eventId
			return Speedup(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService)
		},
		speedup_3:function(){
			var itemConfig = Items.speedup.speedup_3
			var speedupTime = Math.round(itemConfig.effect * 60 * 1000 * itemData.count)
			var eventType = itemData.eventType
			var eventId = itemData.eventId
			return Speedup(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService)
		},
		speedup_4:function(){
			var itemConfig = Items.speedup.speedup_4
			var speedupTime = Math.round(itemConfig.effect * 60 * 1000 * itemData.count)
			var eventType = itemData.eventType
			var eventId = itemData.eventId
			return Speedup(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService)
		},
		speedup_5:function(){
			var itemConfig = Items.speedup.speedup_5
			var speedupTime = Math.round(itemConfig.effect * 60 * 1000 * itemData.count)
			var eventType = itemData.eventType
			var eventId = itemData.eventId
			return Speedup(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService)
		},
		speedup_6:function(){
			var itemConfig = Items.speedup.speedup_6
			var speedupTime = Math.round(itemConfig.effect * 60 * 1000 * itemData.count)
			var eventType = itemData.eventType
			var eventId = itemData.eventId
			return Speedup(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService)
		},
		speedup_7:function(){
			var itemConfig = Items.speedup.speedup_7
			var speedupTime = Math.round(itemConfig.effect * 60 * 1000 * itemData.count)
			var eventType = itemData.eventType
			var eventId = itemData.eventId
			return Speedup(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService)
		},
		speedup_8:function(){
			var itemConfig = Items.speedup.speedup_8
			var speedupTime = Math.round(itemConfig.effect * 60 * 1000 * itemData.count)
			var eventType = itemData.eventType
			var eventId = itemData.eventId
			return Speedup(playerDoc, playerData, eventType, eventId, speedupTime, eventFuncs, timeEventService, playerTimeEventService)
		},
		redbag_1:function(){
			var itemConfig = Items.special.redbag_1
			return Redbag(playerDoc, playerData, itemConfig, dataService)
		},
		redbag_2:function(){
			var itemConfig = Items.special.redbag_2
			return Redbag(playerDoc, playerData, itemConfig, dataService)
		},
		redbag_3:function(){
			var itemConfig = Items.special.redbag_3
			return Redbag(playerDoc, playerData, itemConfig, dataService)
		}
	}
	return functionMap[itemName]()
}

/**
 * 撤军道具
 * @param itemData
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 * @param cacheService
 * @param eventFuncs
 * @param timeEventService
 * @returns {*}
 */
Utils.retreatTroop = function(itemData, playerDoc, playerData, allianceDoc, allianceData, cacheService, eventFuncs, timeEventService){
	var eventType = itemData.eventType
	var eventId = itemData.eventId
	return RetreatTroop(playerDoc, playerData, allianceDoc, allianceData, eventType, eventId, cacheService, eventFuncs, timeEventService)
}

/**
 * 移城道具
 * @param itemData
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 * @param cacheService
 */
Utils.moveTheCity = function(itemData, playerDoc, playerData, allianceDoc, allianceData, cacheService){
	var locationX = itemData.locationX
	var locationY = itemData.locationY
	return MoveTheCity(playerDoc, playerData, allianceDoc, allianceData, locationX, locationY, cacheService)
}

/**
 * 行军加速
 * @param itemName
 * @param itemData
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 * @param cacheService
 * @param eventFuncs
 * @param timeEventService
 * @returns {*}
 */
Utils.warSpeedup = function(itemName, itemData, playerDoc, playerData, allianceDoc, allianceData, cacheService, eventFuncs, timeEventService){
	var itemConfig = Items.speedup[itemName];
	var speedupPercent = itemConfig.effect
	var eventType = itemData.eventType
	var eventId = itemData.eventId
	return WarSpeedup(playerDoc, playerData, allianceDoc, allianceData, eventType, eventId, speedupPercent, cacheService, eventFuncs, timeEventService)
}

/**
 * 新手保护罩道具效果
 * @param itemName
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 * @param eventFuncs
 * @param timeEventService
 */
Utils.newbeeProtect = function(itemName, playerDoc, playerData, allianceDoc, allianceData, eventFuncs, timeEventService){
	var itemConfig = Items.buff[itemName];
	var time = itemConfig.effect * 60 * 60 * 1000
	var event = _.find(playerDoc.itemEvents, function(itemEvent){
		return _.isEqual(itemEvent.type, itemConfig.type)
	})

	if(_.isObject(event) && !LogicUtils.willFinished(event.finishTime)){
		event.finishTime += time
		playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event) + ".finishTime", event.finishTime])
		eventFuncs.push([timeEventService, timeEventService.updatePlayerTimeEventAsync, playerDoc, "itemEvents", event.id, event.finishTime - Date.now()])
	}else{
		if(_.isObject(event) && LogicUtils.willFinished(event.finishTime)){
			playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event), null])
			LogicUtils.removeItemInArray(playerDoc.itemEvents, event)
			eventFuncs.push([timeEventService, timeEventService.removePlayerTimeEventAsync, playerDoc, "itemEvents", event.id])
		}
		event = {
			id:ShortId.generate(),
			type:itemConfig.type,
			startTime:Date.now(),
			finishTime:Date.now() + time
		}
		playerDoc.itemEvents.push(event)
		playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event), event])
		eventFuncs.push([timeEventService, timeEventService.addPlayerTimeEventAsync, playerDoc, "itemEvents", event.id, event.finishTime - Date.now()])
		if(!!allianceDoc){
			var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerDoc._id);
			playerObject.newbeeProtectFinishTime = event.finishTime;
			allianceData.push(['members.' + allianceDoc.members.indexOf(playerObject) + '.newbeeProtectFinishTime', playerObject.newbeeProtectFinishTime]);
		}
	}

	return Promise.resolve()
}

/**
 * 城防大师效果
 * @param itemName
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param eventFuncs
 * @param timeEventService
 */
Utils.masterOfDefender = function(itemName, playerDoc, playerData, allianceDoc, eventFuncs, timeEventService){
	if(!!allianceDoc){
		var hasMarchEvent = null;
		_.each(allianceDoc.marchEvents.strikeMarchEvents, function(event){
			if(event.attackPlayerData.id === playerDoc._id && event.marchType === Consts.MarchType.City){
				hasMarchEvent = true;
			}
		})
		_.each(allianceDoc.marchEvents.strikeMarchReturnEvents, function(event){
			if(event.attackPlayerData.id === playerDoc._id && event.marchType === Consts.MarchType.City){
				hasMarchEvent = true;
			}
		})
		_.each(allianceDoc.marchEvents.attackMarchEvents, function(event){
			if(event.attackPlayerData.id === playerDoc._id && event.marchType === Consts.MarchType.City){
				hasMarchEvent = true;
			}
		})
		_.each(allianceDoc.marchEvents.attackMarchReturnEvents, function(event){
			if(event.attackPlayerData.id === playerDoc._id && event.marchType === Consts.MarchType.City){
				hasMarchEvent = true;
			}
		})
		if(hasMarchEvent){
			return Promise.reject(ErrorUtils.canNotUseMasterOfDefenderNow(playerDoc._id));
		}
	}

	var itemConfig = Items.buff[itemName];
	var time = itemConfig.effect * 60 * 60 * 1000
	var event = _.find(playerDoc.itemEvents, function(itemEvent){
		return _.isEqual(itemEvent.type, itemConfig.type)
	})

	if(_.isObject(event) && !LogicUtils.willFinished(event.finishTime)){
		event.finishTime += time
		playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event) + ".finishTime", event.finishTime])
		eventFuncs.push([timeEventService, timeEventService.updatePlayerTimeEventAsync, playerDoc, "itemEvents", event.id, event.finishTime - Date.now()])
	}else{
		if(_.isObject(event) && LogicUtils.willFinished(event.finishTime)){
			playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event), null])
			LogicUtils.removeItemInArray(playerDoc.itemEvents, event)
			eventFuncs.push([timeEventService, timeEventService.removePlayerTimeEventAsync, playerDoc, "itemEvents", event.id])
		}
		event = {
			id:ShortId.generate(),
			type:itemConfig.type,
			startTime:Date.now(),
			finishTime:Date.now() + time
		}
		playerDoc.itemEvents.push(event)
		playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event), event])
		eventFuncs.push([timeEventService, timeEventService.addPlayerTimeEventAsync, playerDoc, "itemEvents", event.id, event.finishTime - Date.now()])
	}

	return Promise.resolve()
}