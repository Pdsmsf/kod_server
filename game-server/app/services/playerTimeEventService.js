"use strict";

/**
 * Created by modun on 14-7-23.
 */
var ShortId = require("shortid");
var Promise = require("bluebird");
var _ = require("underscore");
var crypto = require("crypto");

var Utils = require("../utils/utils");
var DataUtils = require("../utils/dataUtils");
var LogicUtils = require("../utils/logicUtils");
var TaskUtils = require("../utils/taskUtils");
var ErrorUtils = require("../utils/errorUtils");
var Events = require("../consts/events");
var Consts = require("../consts/consts");
var Define = require("../consts/define");


var PlayerTimeEventService = function(app){
	this.app = app;
	this.env = app.get("env");
	this.pushService = app.get("pushService");
	this.cacheService = app.get('cacheService');
	this.logService = app.get('logService');
};
module.exports = PlayerTimeEventService;
var pro = PlayerTimeEventService.prototype;

/**
 * 到达指定时间时,触发的消息
 * @param playerId
 * @param eventType
 * @param eventId
 * @param callback
 */
pro.onTimeEvent = function(playerId, eventType, eventId, callback){
	var self = this;
	var playerDoc = null;
	var playerData = [];
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		if(!_.isObject(doc)){
			return Promise.reject(ErrorUtils.playerNotExist(playerId, playerId));
		}
		playerDoc = doc;
		var event = LogicUtils.getObjectById(playerDoc[eventType], eventId);
		if(!_.isObject(event)){
			return Promise.reject(ErrorUtils.playerEventNotExist(playerId, eventType, eventId));
		}
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		self.onPlayerEvent(playerDoc, playerData, eventType, eventId);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData);
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 刷新玩家时间数据
 * @param playerDoc
 * @param playerData
 * @param eventType
 * @param eventId
 * @returns {{playerData: Array, allianceData: Array}}
 */
pro.onPlayerEvent = function(playerDoc, playerData, eventType, eventId){
	var self = this;
	var event = null
	var dragon = null
	var building = null
	var allianceDoc = null;
	var allianceData = [];
	var lockPairs = [];

	DataUtils.refreshPlayerResources(playerDoc)
	playerData.push(["resources", playerDoc.resources])

	if(_.isEqual(eventType, "buildingEvents")){
		event = LogicUtils.getObjectById(playerDoc.buildingEvents, eventId)
		playerData.push(["buildingEvents." + playerDoc.buildingEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.buildingEvents, event)
		building = LogicUtils.getBuildingByEvent(playerDoc, event)
		building.level += 1
		playerData.push(["buildings.location_" + building.location + ".level", building.level])
	}else if(_.isEqual(eventType, "houseEvents")){
		event = LogicUtils.getObjectById(playerDoc.houseEvents, eventId)
		building = playerDoc.buildings["location_" + event.buildingLocation]
		playerData.push(["houseEvents." + playerDoc.houseEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.houseEvents, event)
		var house = LogicUtils.getHouseByEvent(playerDoc, event)
		house.level += 1
		playerData.push(["buildings.location_" + event.buildingLocation + ".houses." + building.houses.indexOf(house) + ".level", house.level])
		if(_.isEqual("dwelling", house.type)){
			var previous = DataUtils.getDwellingPopulationByLevel(house.level - 1)
			var next = DataUtils.getDwellingPopulationByLevel(house.level)
			playerDoc.resources.citizen += next - previous
			DataUtils.refreshPlayerResources(playerDoc)
		}
	}else if(_.isEqual(eventType, "materialEvents")){
		event = LogicUtils.getObjectById(playerDoc.materialEvents, eventId)
		event.finishTime = 0
		playerData.push(["materialEvents." + playerDoc.materialEvents.indexOf(event) + ".finishTime", 0])
	}else if(_.isEqual(eventType, "soldierEvents")){
		event = LogicUtils.getObjectById(playerDoc.soldierEvents, eventId)
		playerData.push(["soldierEvents." + playerDoc.soldierEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.soldierEvents, event)
		playerDoc.soldiers[event.name] += event.count
		playerData.push(["soldiers." + event.name, playerDoc.soldiers[event.name]])
	}else if(_.isEqual(eventType, "dragonEquipmentEvents")){
		event = LogicUtils.getObjectById(playerDoc.dragonEquipmentEvents, eventId)
		playerData.push(["dragonEquipmentEvents." + playerDoc.dragonEquipmentEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.dragonEquipmentEvents, event)
		playerDoc.dragonEquipments[event.name] += 1
		playerData.push(["dragonEquipments." + event.name, playerDoc.dragonEquipments[event.name]])
	}else if(_.isEqual(eventType, "treatSoldierEvents")){
		event = LogicUtils.getObjectById(playerDoc.treatSoldierEvents, eventId)
		playerData.push(["treatSoldierEvents." + playerDoc.treatSoldierEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.treatSoldierEvents, event)
		_.each(event.soldiers, function(soldier){
			playerDoc.soldiers[soldier.name] += soldier.count
			playerData.push(["soldiers." + soldier.name, playerDoc.soldiers[soldier.name]])
		})
	}else if(_.isEqual(eventType, "dragonDeathEvents")){
		event = LogicUtils.getObjectById(playerDoc.dragonDeathEvents, eventId)
		playerData.push(["dragonDeathEvents." + playerDoc.dragonDeathEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.dragonDeathEvents, event)
		dragon = playerDoc.dragons[event.dragonType]
		dragon.hp = 1
		dragon.hpRefreshTime = Date.now()
		playerData.push(["dragons." + dragon.type + ".hp", dragon.hp])
		playerData.push(["dragons." + dragon.type + ".hpRefreshTime", dragon.hpRefreshTime])
	}else if(_.isEqual(eventType, "dailyQuestEvents")){
		event = LogicUtils.getObjectById(playerDoc.dailyQuestEvents, eventId)
		event.finishTime = 0
		playerData.push(["dailyQuestEvents." + playerDoc.dailyQuestEvents.indexOf(event) + ".finishTime", event.finishTime])
	}else if(_.isEqual(eventType, "productionTechEvents")){
		event = LogicUtils.getObjectById(playerDoc.productionTechEvents, eventId)
		playerData.push(["productionTechEvents." + playerDoc.productionTechEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.productionTechEvents, event)
		var productionTech = playerDoc.productionTechs[event.name]
		productionTech.level += 1
		playerData.push(["productionTechs." + event.name + ".level", productionTech.level])
	}else if(_.isEqual(eventType, "militaryTechEvents")){
		event = LogicUtils.getObjectById(playerDoc.militaryTechEvents, eventId)
		playerData.push(["militaryTechEvents." + playerDoc.militaryTechEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.militaryTechEvents, event)
		var militaryTech = playerDoc.militaryTechs[event.name]
		militaryTech.level += 1
		playerData.push(["militaryTechs." + event.name + ".level", militaryTech.level])
	}else if(_.isEqual(eventType, "soldierStarEvents")){
		event = LogicUtils.getObjectById(playerDoc.soldierStarEvents, eventId)
		playerData.push(["soldierStarEvents." + playerDoc.soldierStarEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.soldierStarEvents, event)
		playerDoc.soldierStars[event.name] += 1
		playerData.push(["soldierStars." + event.name, playerDoc.soldierStars[event.name]])
	}else if(_.isEqual(eventType, "vipEvents")){
		event = LogicUtils.getObjectById(playerDoc.vipEvents, eventId)
		playerData.push(["vipEvents." + playerDoc.vipEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.vipEvents, event)
	}else if(_.isEqual(eventType, "itemEvents")){
		event = LogicUtils.getObjectById(playerDoc.itemEvents, eventId)
		playerData.push(["itemEvents." + playerDoc.itemEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.itemEvents, event)
		if(event.type === 'newbeeProtect' && !!playerDoc.allianceId && event.finishTime >= Date.now()){
			allianceDoc = null;
			allianceData = [];
			lockPairs = [];
			self.cacheService.findAllianceAsync(playerDoc.allianceId).then(function(doc){
				allianceDoc = doc;
				lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
			}).then(function(){
				var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerDoc._id);
				playerObject.newbeeProtectFinishTime = 0;
				allianceData.push(['members.' + allianceDoc.members.indexOf(playerObject) + '.newbeeProtectFinishTime', playerObject.newbeeProtectFinishTime]);
				self.pushService.onAllianceDataChangedAsync(allianceDoc, allianceData);
			}).catch(function(e){
				self.logService.onError('cache.playerTimeEventService.onPlayerEvent', {
					playerId:playerDoc._id,
					eventType:eventType,
					eventId:eventId
				}, e.stack);
			})
		}
	}

	self.app.get('timeEventService').removePlayerTimeEventAsync(playerDoc, eventType, eventId);

	DataUtils.refreshPlayerPower(playerDoc, playerData)
	TaskUtils.finishPlayerPowerTaskIfNeed(playerDoc, playerData)
}