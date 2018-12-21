"use strict"

/**
 * Created by modun on 14-7-23.
 */
var ShortId = require("shortid")
var Promise = require("bluebird")
var _ = require("underscore")
var crypto = require("crypto")

var Utils = require("../utils/utils")
var DataUtils = require("../utils/dataUtils")
var LogicUtils = require("../utils/logicUtils")
var TaskUtils = require("../utils/taskUtils")
var ErrorUtils = require("../utils/errorUtils")
var Events = require("../consts/events")
var Consts = require("../consts/consts")
var Define = require("../consts/define")

var PlayerApiService = function(app){
	this.app = app
	this.env = app.get("env")
	this.pushService = app.get("pushService")
	this.timeEventService = app.get("timeEventService")
	this.playerTimeEventService = app.get("playerTimeEventService")
	this.logService = app.get("logService")
	this.cacheService = app.get('cacheService');
	this.dataService = app.get("dataService");
	this.GemChange = app.get("GemChange")
	this.Device = app.get("Device")
	this.activityService = app.get('activityService');
	this.cacheServerId = app.getServerId();
}
module.exports = PlayerApiService
var pro = PlayerApiService.prototype

/**
 * 玩家登陆逻辑服务器
 * @param deviceId
 * @param playerId
 * @param requestTime
 * @param needMapData
 * @param logicServerId
 * @param callback
 */
pro.login = function(deviceId, playerId, requestTime, needMapData, logicServerId, callback){
	var self = this
	var playerDoc = null
	var allianceDoc = null
	var allianceData = []
	var vipExpAdd = null
	var lockPairs = []
	var eventFuncs = []
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(playerDoc.countInfo.lockTime > Date.now()){
			var e = ErrorUtils.playerLocked(playerDoc._id);
			e.isLegal = true;
			return Promise.reject(e);
		}
		if(!_.isEmpty(playerDoc.allianceId)){
			return self.cacheService.findAllianceAsync(playerDoc.allianceId).then(function(doc){
				allianceDoc = doc;
			})
		}
	}).then(function(){
		return self.dataService.kickPlayerIfOnlineAsync(playerDoc)
	}).then(function(){
		if(!!allianceDoc) lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var previousLoginDateString = LogicUtils.getDateString(playerDoc.countInfo.lastLoginTime)
		var todayDateString = LogicUtils.getTodayDateString()
		if(!_.isEqual(todayDateString, previousLoginDateString)){
			_.each(playerDoc.allianceDonate, function(value, key){
				playerDoc.allianceDonate[key] = 1;
			});
			playerDoc.monthCard.todayRewardsGet = false;
			playerDoc.countInfo.todayOnLineTime = 0;
			playerDoc.countInfo.todayOnLineTimeRewards = [];
			playerDoc.countInfo.todayFreeNormalGachaCount = 0;
			playerDoc.countInfo.todayLoyaltyGet = 0;
			playerDoc.dailyTasks = [];
			playerDoc.countInfo.dailyTaskRewardCount = 0;
			playerDoc.pveFights = [];
			if(_.isEqual(playerDoc.countInfo.day60, playerDoc.countInfo.day60RewardsCount)){
				if(playerDoc.countInfo.day60 == 60){
					playerDoc.countInfo.day60 = 1
					playerDoc.countInfo.day60RewardsCount = 0
				}else{
					playerDoc.countInfo.day60 += 1
				}
			}
			if(_.isEqual(playerDoc.countInfo.day14, playerDoc.countInfo.day14RewardsCount) && playerDoc.countInfo.day14 < 14){
				playerDoc.countInfo.day14 += 1
			}
		}
		var yestodayString = LogicUtils.getYesterdayDateString()
		if(!_.isEqual(previousLoginDateString, yestodayString) && !_.isEqual(previousLoginDateString, todayDateString)){
			playerDoc.countInfo.vipLoginDaysCount = 1
			vipExpAdd = DataUtils.getPlayerVipExpByLoginDaysCount(1)
			DataUtils.addPlayerVipExp(playerDoc, [], vipExpAdd, eventFuncs, self.timeEventService)
		}else if(_.isEqual(previousLoginDateString, yestodayString)){
			playerDoc.countInfo.vipLoginDaysCount += 1
			vipExpAdd = DataUtils.getPlayerVipExpByLoginDaysCount(playerDoc.countInfo.vipLoginDaysCount)
			DataUtils.addPlayerVipExp(playerDoc, [], vipExpAdd, eventFuncs, self.timeEventService)
		}else if(playerDoc.countInfo.loginCount == 0){
			vipExpAdd = DataUtils.getPlayerVipExpByLoginDaysCount(1)
			DataUtils.addPlayerVipExp(playerDoc, [], vipExpAdd, eventFuncs, self.timeEventService)
		}
		playerDoc.countInfo.lastLoginTime = Date.now();
		playerDoc.countInfo.loginCount += 1;
		playerDoc.lastDeviceId = deviceId;
		playerDoc.logicServerId = logicServerId
		if(_.isObject(allianceDoc)){
			LogicUtils.updatePlayerPropertyInAlliance(playerDoc, true, allianceDoc, allianceData)
			DataUtils.refreshAllianceBasicInfo(allianceDoc, allianceData)
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedExceptMemberIdAsync, allianceDoc, allianceData, playerDoc._id])
		}
		eventFuncs.push([self.dataService, self.dataService.addPlayerToChannelsAsync, playerDoc])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		var mapData = null;
		var mapIndexData = null;
		if(_.isObject(allianceDoc)){
			mapData = self.cacheService.getMapDataAtIndex(allianceDoc.mapIndex).mapData;
			mapIndexData = needMapData ? self.cacheService.getMapIndexs() : null;
		}
		self.app.set('onlineCount', self.app.get('onlineCount') + 1)
		callback(null, [playerDoc, allianceDoc, mapData, mapIndexData])
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 玩家登出逻辑服务器
 * @param playerId
 * @param logicServerId
 * @param reason
 * @param callback
 */
pro.logout = function(playerId, logicServerId, reason, callback){
	var self = this
	var playerDoc = null
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!!playerDoc.allianceId){
			return self.cacheService.findAllianceAsync(playerDoc.allianceId).then(function(doc){
				allianceDoc = doc;
			})
		}
	}).then(function(){
		if(!!allianceDoc) lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		return self.dataService.removePlayerFromChannelsAsync(playerDoc)
	}).then(function(){
		playerDoc.logicServerId = null
		playerDoc.countInfo.lastLogoutTime = Date.now();
		playerDoc.countInfo.todayOnLineTime += playerDoc.countInfo.lastLogoutTime - playerDoc.countInfo.lastLoginTime
		if(!!allianceDoc){
			LogicUtils.updatePlayerPropertyInAlliance(playerDoc, false, allianceDoc, allianceData)
			DataUtils.refreshAllianceBasicInfo(allianceDoc, allianceData)
			pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedExceptMemberIdAsync, allianceDoc, allianceData, playerDoc._id])
		}
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		if(playerDoc.serverId !== self.cacheServerId){
			return self.cacheService.timeoutPlayerAsync(playerDoc._id)
		}
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		self.app.set('onlineCount', self.app.get('onlineCount') - 1)
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 升级大型建筑
 * @param playerId
 * @param location
 * @param finishNow
 * @param callback
 */
pro.upgradeBuilding = function(playerId, location, finishNow, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = []
	var eventFuncs = []
	var building = null
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		building = playerDoc.buildings["location_" + location]
		if(!_.isObject(building))return Promise.reject(ErrorUtils.buildingNotExist(playerId, location))
		if(LogicUtils.hasBuildingEvents(playerDoc, location))return Promise.reject(ErrorUtils.buildingUpgradingNow(playerId, location))
		if(building.level == 0 && !LogicUtils.isBuildingCanCreateAtLocation(playerDoc, location)) return Promise.reject(ErrorUtils.buildingLocationNotLegal(playerId, location))
		if(building.level == 0 && DataUtils.getPlayerFreeBuildingsCount(playerDoc) <= 0) return Promise.reject(ErrorUtils.buildingCountReachUpLimit(playerId, location))
		if(building.level > 0 && DataUtils.isBuildingReachMaxLevel(building.level)) return Promise.reject(ErrorUtils.buildingLevelReachUpLimit(playerId, location))
		if(!DataUtils.isPlayerBuildingUpgradeLegal(playerDoc, location)) return Promise.reject(ErrorUtils.buildingUpgradePreConditionNotMatch(playerId, location))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = 0
		var upgradeRequired = DataUtils.getPlayerBuildingUpgradeRequired(playerDoc, building.type, building.level + 1)
		var buyedResources = null
		var buyedMaterials = null
		var preBuildEvent = null
		DataUtils.refreshPlayerResources(playerDoc)
		if(finishNow){
			gemUsed += DataUtils.getGemByTimeInterval(upgradeRequired.buildTime)
			buyedResources = DataUtils.buyResources(playerDoc, upgradeRequired.resources, {})
			gemUsed += buyedResources.gemUsed
			buyedMaterials = DataUtils.buyMaterials(upgradeRequired.materials, {})
			gemUsed += buyedMaterials.gemUsed
		}else{
			buyedResources = DataUtils.buyResources(playerDoc, upgradeRequired.resources, playerDoc.resources)
			gemUsed += buyedResources.gemUsed
			buyedMaterials = DataUtils.buyMaterials(upgradeRequired.materials, playerDoc.buildingMaterials)
			gemUsed += buyedMaterials.gemUsed
			if(!DataUtils.playerHasFreeBuildQueue(playerDoc)){
				preBuildEvent = LogicUtils.getSmallestBuildEvent(playerDoc)
				var timeRemain = (preBuildEvent.event.finishTime - Date.now()) / 1000
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
				api:"upgradeBuilding",
				params:{
					type:building.type,
					location:location,
					currentLevel:building.level,
					finishNow:finishNow
				}
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		LogicUtils.increace(buyedResources.totalBuy, playerDoc.resources)
		LogicUtils.increace(buyedMaterials.totalBuy, playerDoc.buildingMaterials)
		LogicUtils.reduce(upgradeRequired.resources, playerDoc.resources)
		LogicUtils.reduce(upgradeRequired.materials, playerDoc.buildingMaterials)
		playerData.push(["buildingMaterials", playerDoc.buildingMaterials])
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'upgradeBuilding');
		if(finishNow){
			building.level = building.level + 1
			playerData.push(["buildings.location_" + building.location + ".level", building.level])
			DataUtils.refreshPlayerPower(playerDoc, playerData)
			TaskUtils.finishPlayerPowerTaskIfNeed(playerDoc, playerData)
		}else{
			if(_.isObject(preBuildEvent)){
				self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, preBuildEvent.type, preBuildEvent.event.id);
			}
			var finishTime = Date.now() + (upgradeRequired.buildTime * 1000)
			var event = LogicUtils.createBuildingEvent(playerDoc, building.location, finishTime)
			playerDoc.buildingEvents.push(event)
			playerData.push(["buildingEvents." + playerDoc.buildingEvents.indexOf(event), event])
			eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "buildingEvents", event.id, finishTime - Date.now()])
		}
		TaskUtils.finishCityBuildTaskIfNeed(playerDoc, playerData, building.type, finishNow ? building.level : building.level + 1);
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
 * 转换生产建筑类型
 * @param playerId
 * @param buildingLocation
 * @param newBuildingName
 * @param callback
 */
pro.switchBuilding = function(playerId, buildingLocation, newBuildingName, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var building = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		building = playerDoc.buildings["location_" + buildingLocation]
		if(!_.isObject(building) || building.level < 1) return Promise.reject(ErrorUtils.buildingNotExist(playerId, buildingLocation))
		if(!_.contains(_.values(Consts.HouseBuildingMap), building.type)) return Promise.reject(ErrorUtils.onlyProductionBuildingCanSwitch(playerId, buildingLocation))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = DataUtils.getPlayerIntInit("switchProductionBuilding")
		if(gemUsed > playerDoc.resources.gem) return Promise.reject(ErrorUtils.gemNotEnough(playerId, gemUsed, playerDoc.resources.gem))
		var houseType = Consts.BuildingHouseMap[building.type]
		var maxHouseCount = DataUtils.getPlayerHouseMaxCountByType(playerDoc, houseType)
		var currentCount = DataUtils.getPlayerHouseCountByType(playerDoc, houseType)
		var buildingAddedHouseCount = DataUtils.getPlayerBuildingAddedHouseCount(playerDoc, buildingLocation)
		if(maxHouseCount - buildingAddedHouseCount < currentCount) return Promise.reject(ErrorUtils.houseTooMuchMore(playerId, buildingLocation))
		var buildingType = building.type
		building.type = newBuildingName
		building.level -= 1
		if(!DataUtils.isPlayerBuildingUpgradeLegal(playerDoc, buildingLocation)){
			building.type = buildingType
			building.level += 1
			return Promise.reject(ErrorUtils.buildingUpgradePreConditionNotMatch(playerId, buildingLocation))
		}
		playerDoc.resources.gem -= gemUsed
		var gemUse = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:-gemUsed,
			left:playerDoc.resources.gem,
			api:"switchBuilding",
			params:{
				location:buildingLocation,
				originalType:buildingType,
				newType:building.type
			}
		}
		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		playerData.push(["resources.gem", playerDoc.resources.gem])
		building.level += 1
		building.type = newBuildingName
		playerData.push(["buildings.location_" + buildingLocation + ".type", newBuildingName])
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
 * 创建小屋
 * @param playerId
 * @param buildingLocation
 * @param houseType
 * @param houseLocation
 * @param finishNow
 * @param callback
 */
pro.createHouse = function(playerId, buildingLocation, houseType, houseLocation, finishNow, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var building = null
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		building = playerDoc.buildings["location_" + buildingLocation]
		if(building.level <= 0) return Promise.reject(ErrorUtils.hostBuildingLevelMustBiggerThanOne(playerId, buildingLocation, houseLocation))
		if(!DataUtils.isHouseTypeExist(houseType)) return Promise.reject(ErrorUtils.houseTypeNotExist(playerId, houseLocation, houseType))
		if(DataUtils.getPlayerFreeHousesCount(playerDoc, houseType) <= 0) return Promise.reject(ErrorUtils.houseCountTooMuchMore(playerId, buildingLocation, houseLocation, houseType))
		if(!DataUtils.isBuildingHasHouse(buildingLocation)) return Promise.reject(ErrorUtils.buildingNotAllowHouseCreate(playerId, buildingLocation, houseLocation, houseType))
		if(!LogicUtils.isHouseCanCreateAtLocation(playerDoc, buildingLocation, houseType, houseLocation)) return Promise.reject(ErrorUtils.houseLocationNotLegal(playerId, buildingLocation, houseLocation, houseType))
		if(!DataUtils.isPlayerHouseUpgradeLegal(playerDoc, buildingLocation, houseType, houseLocation)) return Promise.reject(ErrorUtils.houseUpgradePrefixNotMatch(playerId, buildingLocation, houseLocation, houseType))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = 0
		var upgradeRequired = DataUtils.getPlayerHouseUpgradeRequired(playerDoc, houseType, 1)
		var freeCitizenLimit = DataUtils.getPlayerFreeCitizenLimit(playerDoc)
		if(freeCitizenLimit <= upgradeRequired.resources.citizen) return Promise.reject(ErrorUtils.noEnoughCitizenToCreateHouse(playerId, buildingLocation, houseLocation))
		var buyedResources = null
		var buyedMaterials = null
		var preBuildEvent = null
		DataUtils.refreshPlayerResources(playerDoc)
		if(finishNow){
			gemUsed += DataUtils.getGemByTimeInterval(upgradeRequired.buildTime)
			buyedResources = DataUtils.buyResources(playerDoc, upgradeRequired.resources, {})
			gemUsed += buyedResources.gemUsed
			buyedMaterials = DataUtils.buyMaterials(upgradeRequired.materials, {})
			gemUsed += buyedMaterials.gemUsed
		}else{
			buyedResources = DataUtils.buyResources(playerDoc, upgradeRequired.resources, playerDoc.resources)
			gemUsed += buyedResources.gemUsed
			buyedMaterials = DataUtils.buyMaterials(upgradeRequired.materials, playerDoc.buildingMaterials)
			gemUsed += buyedMaterials.gemUsed
			if(!DataUtils.playerHasFreeBuildQueue(playerDoc)){
				preBuildEvent = LogicUtils.getSmallestBuildEvent(playerDoc)
				var timeRemain = (preBuildEvent.event.finishTime - Date.now()) / 1000
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
				api:"createHouse",
				params:{
					buildingType:building.type,
					buildingLocation:buildingLocation,
					houseType:houseType,
					houseLocation:houseLocation,
					finishNow:finishNow
				}
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		LogicUtils.increace(buyedResources.totalBuy, playerDoc.resources)
		LogicUtils.increace(buyedMaterials.totalBuy, playerDoc.buildingMaterials)
		LogicUtils.reduce(upgradeRequired.resources, playerDoc.resources)
		LogicUtils.reduce(upgradeRequired.materials, playerDoc.buildingMaterials)
		playerData.push(["buildingMaterials", playerDoc.buildingMaterials])
		var house = {
			type:houseType,
			level:0,
			location:houseLocation
		}
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'upgradeBuilding');
		if(finishNow){
			house.level += 1
			building.houses.push(house)
			DataUtils.refreshPlayerPower(playerDoc, playerData)
			TaskUtils.finishPlayerPowerTaskIfNeed(playerDoc, playerData)
		}else{
			if(_.isObject(preBuildEvent)){
				self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, preBuildEvent.type, preBuildEvent.event.id)
			}
			building.houses.push(house)
			var finishTime = Date.now() + (upgradeRequired.buildTime * 1000)
			var event = LogicUtils.createHouseEvent(playerDoc, buildingLocation, houseLocation, finishTime)
			playerDoc.houseEvents.push(event)
			playerData.push(["houseEvents." + playerDoc.houseEvents.indexOf(event), event])
			eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "houseEvents", event.id, finishTime - Date.now()])
		}
		playerData.push(["buildings.location_" + building.location + ".houses." + building.houses.indexOf(house), house])

		if(_.isEqual("dwelling", house.type) && finishNow){
			var previous = DataUtils.getDwellingPopulationByLevel(house.level - 1)
			var next = DataUtils.getDwellingPopulationByLevel(house.level)
			playerDoc.resources.citizen += next - previous
		}
		TaskUtils.finishCityBuildTaskIfNeed(playerDoc, playerData, house.type, finishNow ? house.level : house.level + 1);
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
 * 升级小屋
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 * @param finishNow
 * @param callback
 */
pro.upgradeHouse = function(playerId, buildingLocation, houseLocation, finishNow, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var building = null
	var house = null
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		building = playerDoc.buildings["location_" + buildingLocation]
		if(building.level <= 0) return Promise.reject(ErrorUtils.hostBuildingLevelMustBiggerThanOne(playerId, buildingLocation, houseLocation))
		_.each(building.houses, function(value){
			if(value.location == houseLocation){
				house = value
			}
		})
		if(!_.isObject(house))return Promise.reject(ErrorUtils.houseNotExist(playerId, buildingLocation, houseLocation))
		if(LogicUtils.hasHouseEvents(playerDoc, building.location, house.location))return Promise.reject(ErrorUtils.houseUpgradingNow(playerId, buildingLocation, houseLocation))
		if(DataUtils.isHouseReachMaxLevel(house.type, house.level))return Promise.reject(ErrorUtils.houseReachMaxLevel(playerId, buildingLocation, houseLocation))
		if(!DataUtils.isPlayerHouseUpgradeLegal(playerDoc, buildingLocation, house.type, houseLocation)) return Promise.reject(ErrorUtils.houseUpgradePrefixNotMatch(playerId, buildingLocation, houseLocation, house.type))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = 0
		var upgradeRequired = DataUtils.getPlayerHouseUpgradeRequired(playerDoc, house.type, house.level + 1)
		var freeCitizenLimit = DataUtils.getPlayerFreeCitizenLimit(playerDoc)
		if(freeCitizenLimit <= upgradeRequired.resources.citizen) return Promise.reject(ErrorUtils.noEnoughCitizenToCreateHouse(playerId, buildingLocation, houseLocation))
		var buyedResources = null
		var buyedMaterials = null
		var preBuildEvent = null
		DataUtils.refreshPlayerResources(playerDoc)
		if(finishNow){
			gemUsed += DataUtils.getGemByTimeInterval(upgradeRequired.buildTime)
			buyedResources = DataUtils.buyResources(playerDoc, upgradeRequired.resources, {})
			gemUsed += buyedResources.gemUsed
			buyedMaterials = DataUtils.buyMaterials(upgradeRequired.materials, {})
			gemUsed += buyedMaterials.gemUsed
		}else{
			buyedResources = DataUtils.buyResources(playerDoc, upgradeRequired.resources, playerDoc.resources)
			gemUsed += buyedResources.gemUsed
			buyedMaterials = DataUtils.buyMaterials(upgradeRequired.materials, playerDoc.buildingMaterials)
			gemUsed += buyedMaterials.gemUsed
			if(!DataUtils.playerHasFreeBuildQueue(playerDoc)){
				preBuildEvent = LogicUtils.getSmallestBuildEvent(playerDoc)
				var timeRemain = (preBuildEvent.event.finishTime - Date.now()) / 1000
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
				api:"upgradeHouse",
				params:{
					buildingLocation:buildingLocation,
					buildingType:building.type,
					houseType:house.type,
					houseLocation:houseLocation,
					currentLevel:house.level,
					finishNow:finishNow
				}
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		LogicUtils.increace(buyedResources.totalBuy, playerDoc.resources)
		LogicUtils.increace(buyedMaterials.totalBuy, playerDoc.buildingMaterials)
		LogicUtils.reduce(upgradeRequired.resources, playerDoc.resources)
		LogicUtils.reduce(upgradeRequired.materials, playerDoc.buildingMaterials)
		playerData.push(["buildingMaterials", playerDoc.buildingMaterials])
		TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'upgradeBuilding');
		if(finishNow){
			house.level += 1
			playerData.push(["buildings.location_" + building.location + ".houses." + building.houses.indexOf(house) + ".level", house.level])
			DataUtils.refreshPlayerPower(playerDoc, playerData)
			TaskUtils.finishPlayerPowerTaskIfNeed(playerDoc, playerData)
		}else{
			if(_.isObject(preBuildEvent)){
				self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, preBuildEvent.type, preBuildEvent.event.id)
			}
			var finishTime = Date.now() + (upgradeRequired.buildTime * 1000)
			var event = LogicUtils.createHouseEvent(playerDoc, building.location, house.location, finishTime)
			playerDoc.houseEvents.push(event)
			playerData.push(["houseEvents." + playerDoc.houseEvents.indexOf(event), event])
			eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "houseEvents", event.id, finishTime - Date.now()])
		}
		if(_.isEqual("dwelling", house.type) && finishNow){
			var previous = DataUtils.getDwellingPopulationByLevel(house.level - 1)
			var next = DataUtils.getDwellingPopulationByLevel(house.level)
			playerDoc.resources.citizen += next - previous
		}
		TaskUtils.finishCityBuildTaskIfNeed(playerDoc, playerData, house.type, finishNow ? house.level : house.level + 1);
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
 * 免费加速
 * @param playerId
 * @param eventType
 * @param eventId
 * @param callback
 */
pro.freeSpeedUp = function(playerId, eventType, eventId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var event = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		event = LogicUtils.getObjectById(playerDoc[eventType], eventId)
		if(!_.isObject(event)) return Promise.reject(ErrorUtils.playerEventNotExist(playerId, eventType, eventId))
		if(event.finishTime - DataUtils.getPlayerFreeSpeedUpEffect(playerDoc) > Date.now()){
			return Promise.reject(ErrorUtils.canNotFreeSpeedupNow(playerId, eventType, eventId))
		}
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, eventType, eventId)
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
 * 宝石加速
 * @param playerId
 * @param eventType
 * @param eventId
 * @param callback
 */
pro.speedUp = function(playerId, eventType, eventId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var canFreeSpeedup = _.contains(Consts.FreeSpeedUpAbleEventTypes, eventType);
	var event = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		event = LogicUtils.getObjectById(playerDoc[eventType], eventId)
		if(!_.isObject(event)) return Promise.reject(ErrorUtils.playerEventNotExist(playerId, eventType, eventId))
		if(canFreeSpeedup && (event.finishTime - DataUtils.getPlayerFreeSpeedUpEffect(playerDoc) <= Date.now())){
			return Promise.reject(ErrorUtils.doNotNeedGemSpeedup(playerId, eventType, eventId))
		}
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var timeRemain = (event.finishTime - Date.now() - (canFreeSpeedup ? DataUtils.getPlayerFreeSpeedUpEffect(playerDoc) : 0))
		var gemUsed = DataUtils.getGemByTimeInterval(timeRemain / 1000);
		var buyedTimeInterval = DataUtils.getTimeIntervalByGem(gemUsed) * 1000;
		if(gemUsed > playerDoc.resources.gem) return Promise.reject(ErrorUtils.gemNotEnough(playerId, gemUsed, playerDoc.resources.gem))
		playerDoc.resources.gem -= gemUsed
		var gemUse = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:-gemUsed,
			left:playerDoc.resources.gem,
			api:"speedUp",
			params:{
				eventType:eventType,
				eventId:eventId
			}
		}
		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		DataUtils.refreshPlayerResources(playerDoc)
		playerData.push(["resources", playerDoc.resources])

		event.startTime -= buyedTimeInterval
		event.finishTime -= buyedTimeInterval
		if(LogicUtils.willFinished(event.finishTime)){
			self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, eventType, eventId)
		}else{
			playerData.push([eventType + "." + playerDoc[eventType].indexOf(event), event])
			eventFuncs.push([self.timeEventService, self.timeEventService.updatePlayerTimeEventAsync, playerDoc, eventType, eventId, event.finishTime - Date.now()])
		}
		if(_.contains(Consts.BuildingSpeedupEventTypes, eventType)){
			TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'speedupBuildingUpgrade')
		}else if(_.isEqual(eventType, "soldierEvents")){
			TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'speedupSoldierRecruit')
		}
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
 * 制造建筑,科技使用的材料
 * @param playerId
 * @param type
 * @param finishNow
 * @param callback
 */
pro.makeMaterial = function(playerId, type, finishNow, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var event = null;
	var building = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		building = playerDoc.buildings.location_16
		if(building.level < 1) return Promise.reject(ErrorUtils.buildingNotBuild(playerId, building.location))
		for(var i = 0; i < playerDoc.materialEvents.length; i++){
			event = playerDoc.materialEvents[i]
			if(_.isEqual(event.type, type)){
				if(event.finishTime > 0) return Promise.reject(ErrorUtils.materialAsSameTypeIsMakeNow(playerId, type))
				else return Promise.reject(ErrorUtils.materialMakeFinishedButNotTakeAway(playerId, type))
			}else if(!finishNow && event.finishTime > 0) return Promise.reject(ErrorUtils.materialAsDifferentTypeIsMakeNow(playerId, type))
		}
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = 0
		var makeRequired = DataUtils.getMakeMaterialRequired(playerDoc, type, building.level)
		var buyedResources = null
		DataUtils.refreshPlayerResources(playerDoc)
		if(finishNow){
			gemUsed += DataUtils.getGemByTimeInterval(makeRequired.buildTime)
			buyedResources = DataUtils.buyResources(playerDoc, makeRequired.resources, {})
			gemUsed += buyedResources.gemUsed
		}else{
			buyedResources = DataUtils.buyResources(playerDoc, makeRequired.resources, playerDoc.resources)
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
				api:"makeMaterial",
				params:{
					type:type,
					finishNow:finishNow
				}
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		LogicUtils.increace(buyedResources.totalBuy, playerDoc.resources)
		LogicUtils.reduce(makeRequired.resources, playerDoc.resources)

		event = DataUtils.createMaterialEvent(building, type, makeRequired.buildTime, finishNow)
		playerDoc.materialEvents.push(event)
		playerData.push(["materialEvents." + playerDoc.materialEvents.indexOf(event), event])
		if(_.isEqual(type, Consts.MaterialType.BuildingMaterials)){
			TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'makeBuildingMaterial');
		}else{
			TaskUtils.finishDailyTaskIfNeeded(playerDoc, playerData, 'makeTechnologyMaterial');
		}
		if(!finishNow){
			eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "materialEvents", event.id, event.finishTime - Date.now()])
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
 * 领取材料
 * @param playerId
 * @param eventId
 * @param callback
 */
pro.getMaterials = function(playerId, eventId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var event = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		event = _.find(playerDoc.materialEvents, function(event){
			return _.isEqual(event.id, eventId)
		})
		if(!_.isObject(event) || event.finishTime > 0) return Promise.reject(ErrorUtils.materialEventNotExistOrIsMakeing(playerId, eventId))

		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerData.push(["materialEvents." + playerDoc.materialEvents.indexOf(event), null])
		LogicUtils.removeItemInArray(playerDoc.materialEvents, event)
		LogicUtils.addPlayerMaterials(playerDoc, playerData, event.type, event.materials, false)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 招募普通士兵
 * @param playerId
 * @param soldierName
 * @param count
 * @param finishNow
 * @param callback
 */
pro.recruitNormalSoldier = function(playerId, soldierName, count, finishNow, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var building = playerDoc.buildings.location_5
		if(building.level < 1) return Promise.reject(ErrorUtils.buildingNotBuild(playerId, building.location))
		if(DataUtils.isPlayerSoldierLocked(playerDoc, soldierName)) return Promise.reject(ErrorUtils.theSoldierIsLocked(playerId, soldierName))
		if(count > DataUtils.getPlayerSoldierMaxRecruitCount(playerDoc, soldierName)) return Promise.reject(ErrorUtils.recruitTooMuchOnce(playerId, soldierName, count))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = 0
		var recruitRequired = DataUtils.getPlayerRecruitNormalSoldierRequired(playerDoc, soldierName, count)
		var buyedResources = null
		var preRecruitEvent = null
		DataUtils.refreshPlayerResources(playerDoc)
		if(finishNow){
			gemUsed += DataUtils.getGemByTimeInterval(recruitRequired.recruitTime)
			buyedResources = DataUtils.buyResources(playerDoc, recruitRequired.resources, {})
			gemUsed += buyedResources.gemUsed
		}else{
			buyedResources = DataUtils.buyResources(playerDoc, recruitRequired.resources, playerDoc.resources)
			gemUsed += buyedResources.gemUsed
			if(!DataUtils.playerHasFreeRecruitQueue(playerDoc)){
				preRecruitEvent = LogicUtils.getSmallestRecruitEvent(playerDoc)
				var timeRemain = (preRecruitEvent.event.finishTime - Date.now()) / 1000
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
				api:"recruitNormalSoldier",
				params:{
					soldierName:soldierName,
					count:count,
					finishNow:finishNow
				}
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		LogicUtils.increace(buyedResources.totalBuy, playerDoc.resources)
		LogicUtils.reduce(recruitRequired.resources, playerDoc.resources)
		if(finishNow){
			playerDoc.soldiers[soldierName] += count
			playerData.push(["soldiers." + soldierName, playerDoc.soldiers[soldierName]])
			DataUtils.refreshPlayerPower(playerDoc, playerData)
			TaskUtils.finishPlayerPowerTaskIfNeed(playerDoc, playerData)
		}else{
			if(_.isObject(preRecruitEvent)){
				self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, preRecruitEvent.type, preRecruitEvent.event.id)
			}
			var finishTime = Date.now() + (recruitRequired.recruitTime * 1000)
			var event = LogicUtils.createSoldierEvent(playerDoc, soldierName, count, finishTime)
			playerDoc.soldierEvents.push(event)
			playerData.push(["soldierEvents." + playerDoc.soldierEvents.indexOf(event), event])
			eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "soldierEvents", event.id, event.finishTime - Date.now()])
		}
		TaskUtils.finishSoldierCountTaskIfNeed(playerDoc, playerData, soldierName)
		var scoreKey = DataUtils.getRecruitScoreConditionKey(soldierName);
		self.activityService.addPlayerActivityScore(playerDoc, playerData, 'recruitSoldiers', scoreKey, count);
		if(!!playerDoc.allianceId){
			self.activityService.addAllianceActivityScoreById(playerDoc.allianceId, 'recruitSoldiers', scoreKey, count);
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
 * 招募特殊士兵
 * @param playerId
 * @param soldierName
 * @param count
 * @param finishNow
 * @param callback
 */
pro.recruitSpecialSoldier = function(playerId, soldierName, count, finishNow, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var building = playerDoc.buildings.location_5
		if(building.level < 1) return Promise.reject(ErrorUtils.buildingNotBuild(playerId, building.location))
		if(count > DataUtils.getPlayerSoldierMaxRecruitCount(playerDoc, soldierName)) return Promise.reject(ErrorUtils.recruitTooMuchOnce(playerId, soldierName, count))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = 0
		var recruitRequired = DataUtils.getPlayerRecruitSpecialSoldierRequired(playerDoc, soldierName, count)
		var buyedResources = null
		var preRecruitEvent = null
		DataUtils.refreshPlayerResources(playerDoc)
		if(!LogicUtils.isEnough(recruitRequired.materials, playerDoc.soldierMaterials)) return Promise.reject(ErrorUtils.soldierRecruitMaterialsNotEnough(playerId, soldierName, count))
		if(finishNow){
			gemUsed += DataUtils.getGemByTimeInterval(recruitRequired.recruitTime)
			buyedResources = DataUtils.buyResources(playerDoc, {citizen:recruitRequired.citizen}, {})
			gemUsed += buyedResources.gemUsed
		}else{
			buyedResources = DataUtils.buyResources(playerDoc, {citizen:recruitRequired.citizen}, playerDoc.resources)
			gemUsed += buyedResources.gemUsed
			if(!DataUtils.playerHasFreeRecruitQueue(playerDoc)){
				preRecruitEvent = LogicUtils.getSmallestRecruitEvent(playerDoc)
				var timeRemain = (preRecruitEvent.event.finishTime - Date.now()) / 1000
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
				api:"recruitSpecialSoldier",
				params:{
					soldierName:soldierName,
					count:count,
					finishNow:finishNow
				}
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		LogicUtils.increace(buyedResources.totalBuy, playerDoc.resources)
		LogicUtils.reduce(recruitRequired.materials, playerDoc.soldierMaterials)
		LogicUtils.reduce({citizen:recruitRequired.citizen}, playerDoc.resources)
		playerData.push(["soldierMaterials", playerDoc.soldierMaterials])
		if(finishNow){
			playerDoc.soldiers[soldierName] += count
			playerData.push(["soldiers." + soldierName, playerDoc.soldiers[soldierName]])
			DataUtils.refreshPlayerPower(playerDoc, playerData)
			TaskUtils.finishPlayerPowerTaskIfNeed(playerDoc, playerData)
		}else{
			if(_.isObject(preRecruitEvent)){
				self.playerTimeEventService.onPlayerEvent(playerDoc, playerData, preRecruitEvent.type, preRecruitEvent.event.id)
			}
			var finishTime = Date.now() + (recruitRequired.recruitTime * 1000)
			var event = LogicUtils.createSoldierEvent(playerDoc, soldierName, count, finishTime)
			playerDoc.soldierEvents.push(event)
			playerData.push(["soldierEvents." + playerDoc.soldierEvents.indexOf(event), event])
			eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "soldierEvents", event.id, event.finishTime - Date.now()])
		}
		TaskUtils.finishSoldierCountTaskIfNeed(playerDoc, playerData, soldierName)
		var scoreKey = DataUtils.getRecruitScoreConditionKey(soldierName);
		self.activityService.addPlayerActivityScore(playerDoc, playerData, 'recruitSoldiers', scoreKey, count);
		if(!!playerDoc.allianceId){
			self.activityService.addAllianceActivityScoreById(playerDoc.allianceId, 'recruitSoldiers', scoreKey, count);
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