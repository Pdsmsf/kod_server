"use strict"

/**
 * Created by modun on 14-8-6.
 */

var ShortId = require("shortid")
var _ = require("underscore")
var sprintf = require("sprintf")
var Promise = require("bluebird")
var moment = require('moment');

var CommonUtils = require('./utils');
var DataUtils = require("./dataUtils")
var MapUtils = require("./mapUtils")
var Consts = require("../consts/consts")
var Define = require("../consts/define")

var Utils = module.exports


/**
 * 获取Buff加成效果
 * @param time
 * @param decreasePercent
 * @returns {number}
 */
Utils.getTimeEfffect = function(time, decreasePercent){
	return Math.ceil(time / (1 + decreasePercent))
}

/**
 * 检查是否足够
 * @param need
 * @param has
 */
Utils.isEnough = function(need, has){
	return _.every(need, function(value, key){
		return _.isNumber(has[key]) && has[key] >= need[key]
	})
}

/**
 * 从Array中移除Item
 * @param array
 * @param item
 */
Utils.removeItemInArray = function(array, item){
	var index = array.indexOf(item)
	if(index >= 0){
		array.splice(index, 1)
	}
}

/**
 * 清空Array
 * @param array
 */
Utils.clearArray = function(array){
	array.length = 0;
}

/**
 * 清空Object
 * @param object
 */
Utils.clearObject = function(object){
	_.each(object, function(value, key){
		delete object[key]
	})
}

/**
 * 减少相应数值
 * @param need
 * @param has
 */
Utils.reduce = function(need, has){
	_.each(need, function(value, key){
		if(_.isNumber(has[key])){
			has[key] -= value
		}else{
			has[key] = -value
		}
	})
}

/**
 * 增加相应数量
 * @param willAdd
 * @param has
 */
Utils.increace = function(willAdd, has){
	_.each(willAdd, function(value, key){
		if(_.isNumber(has[key])){
			has[key] += value
		}else{
			has[key] = value
		}
	})
}

/**
 * 一次执行所有函数
 * @param functionObjects
 * @returns {*}
 */
Utils.excuteAll = function(functionObjects){
	var funcs = []
	_.each(functionObjects, function(functionObj){
		var caller = functionObj[0]
		var func = functionObj[1]
		funcs.push(func.apply(caller, Array.prototype.slice.call(functionObj, 2)))
	})
	return Promise.all(funcs)
}

/**
 * 检测是否有建筑和箭塔需要从-1级升级到0级
 * @param playerDoc
 */
Utils.updateBuildingsLevel = function(playerDoc){
	var buildings = playerDoc.buildings
	for(var i = 1; i <= _.size(buildings); i++){
		var building = buildings["location_" + i]
		if(building.level == -1){
			for(var j = i - 1; j >= 1; j--){
				var preBuilding = buildings["location_" + j]
				if(preBuilding.level <= 0){
					return false
				}
			}

			var round = this.getBuildingCurrentRound(i)
			var fromToEnd = this.getBuildingRoundFromAndEnd(round)
			for(var k = fromToEnd.from; k < fromToEnd.to; k++){
				var theBuilding = buildings["location_" + k]
				if(_.isObject(theBuilding) && theBuilding.level < 0){
					buildings["location_" + k].level = 0
				}
			}
			return true
		}
	}
	return false
}

/**
 * 检查建筑创建时坑位是否合法
 * @param playerDoc
 * @param location
 * @returns {boolean}
 */
Utils.isBuildingCanCreateAtLocation = function(playerDoc, location){
	var currentRound = this.getBuildingCurrentRound(location)
	var previousRoundFromAndTo = this.getBuildingRoundFromAndEnd(currentRound - 1);
	for(var i = previousRoundFromAndTo.from; i < previousRoundFromAndTo.to; i++){
		var building = playerDoc.buildings['location_' + i];
		if(building && building.level <= 0) return false
	}
	var middleLocation = this.getBuildingRoundMiddleLocation(currentRound)
	if(middleLocation == location){
		var previousBuilding = playerDoc.buildings['location_' + (middleLocation - 1)]
		var nextBuilding = playerDoc.buildings['location_' + (middleLocation + 1)]
		if(previousBuilding.level == 0 && nextBuilding.level == 0) return false
	}
	return true
}

/**
 * 小屋是否能在指定位置创建
 * @param playerDoc
 * @param buildingLocation
 * @param houseType
 * @param houseLocation
 * @returns {boolean}
 */
Utils.isHouseCanCreateAtLocation = function(playerDoc, buildingLocation, houseType, houseLocation){
	var conditions = {
		location_1:{
			widthMax:2,
			heightMax:1
		},
		location_2:{
			widthMax:1,
			heightMax:1
		},
		location_3:{
			widthMax:1,
			heightMax:1
		}
	}

	var building = playerDoc.buildings["location_" + buildingLocation]
	var houses = building.houses
	var willBeSize = DataUtils.getHouseSize(houseType)
	var condition = conditions["location_" + houseLocation]
	if(willBeSize.width > condition.widthMax) return false
	if(willBeSize.height > condition.heightMax) return false
	var wantUse = [houseLocation]
	if(willBeSize.width > 1 || willBeSize.height > 1){
		wantUse.push(houseLocation + 1)
	}

	var alreadyUsed = []
	_.each(houses, function(house){
		var houseSize = DataUtils.getHouseSize(house.type)
		alreadyUsed.push(house.location)
		if(houseSize.width > 1 || houseSize.height > 1){
			wantUse.push(house.location + 1)
		}
	})

	return _.intersection(wantUse, alreadyUsed).length == 0
}

/**
 * 获取当前坐标的上一个坐标
 * @param currentLocation
 * @returns {*}
 */
Utils.getPreviousBuildingLocation = function(currentLocation){
	var round = this.getBuildingCurrentRound(currentLocation)
	var previousRound = this.getBuildingCurrentRound(currentLocation - 1)
	if(_.isEqual(round, previousRound)) return currentLocation - 1
	return null
}

/**
 * 获取当前坐标的下一个坐标
 * @param currentLocation
 * @returns {*}
 */
Utils.getNextBuildingLocation = function(currentLocation){
	var round = this.getBuildingCurrentRound(currentLocation)
	var previousRound = this.getBuildingCurrentRound(currentLocation + 1)
	if(_.isEqual(round, previousRound)) return currentLocation + 1
	return null
}

/**
 * 获取当前坐标的前一个坐标
 * @param currentLocation
 * @returns {*}
 */
Utils.getFrontBuildingLocation = function(currentLocation){
	var round = this.getBuildingCurrentRound(currentLocation)
	var middle = Math.floor(this.getBuildingRoundMiddleLocation(round))

	if(currentLocation == middle) return null
	if(currentLocation < middle){
		return currentLocation - ((round - 1) * 2) + 1
	}else if(currentLocation > middle){
		return currentLocation - ((round - 1) * 2) - 1
	}
	return null
}

/**
 *
 * @param currentLocation
 * @returns {*}
 */
Utils.getBuildingCurrentRound = function(currentLocation){
	var nextFrom = 1
	for(var i = 1; i <= 5; i++){
		var from = nextFrom
		var to = from + (i - 1) * 2 + 1
		nextFrom = to
		if(currentLocation >= from && currentLocation < to){
			return i
		}
	}

	return null
}

/**
 * 根据当前建筑坐标获取当前坐标所属圈数的起点坐标和结束坐标
 * @param currentRound
 * @returns {{from: *, to: *}}
 */
Utils.getBuildingRoundFromAndEnd = function(currentRound){
	var from = null
	var to = null
	var nextFrom = 1
	for(var i = 1; i <= currentRound; i++){
		from = nextFrom
		to = from + (i - 1) * 2 + 1
		nextFrom = to
	}

	return {from:from, to:to}
}

/**
 * 根据当前建筑坐标获取当前圈数的中间坐标
 * @param currentRound
 * @returns {*}
 */
Utils.getBuildingRoundMiddleLocation = function(currentRound){
	var fromAndTo = this.getBuildingRoundFromAndEnd(currentRound)
	var middle = fromAndTo.from + ((fromAndTo.to - fromAndTo.from) / 2)
	return Math.floor(middle)
}

/**
 * 是否有指定坑位的建筑建造事件
 * @param playerDoc
 * @param buildingLocation
 * @returns {boolean}
 */
Utils.hasBuildingEvents = function(playerDoc, buildingLocation){
	return _.some(playerDoc.buildingEvents, function(event){
		return _.isEqual(buildingLocation, event.location)
	})
}

/**
 * 是否有指定坑位的小屋建造事件
 * @param playerDoc
 * @param buildingLocation
 * @param houseLocation
 * @returns {boolean}
 */
Utils.hasHouseEvents = function(playerDoc, buildingLocation, houseLocation){
	return _.some(playerDoc.houseEvents, function(event){
		return _.isEqual(event.buildingLocation, buildingLocation) && _.isEqual(event.houseLocation, houseLocation)
	})
}

/**
 * 创建建筑建造事件
 * @param playerDoc
 * @param location
 * @param finishTime
 * @returns {{location: *, finishTime: *}}
 */
Utils.createBuildingEvent = function(playerDoc, location, finishTime){
	var event = {
		id:ShortId.generate(),
		location:location,
		helped:false,
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建生产科技升级事件
 * @param playerDoc
 * @param techName
 * @param finishTime
 * @returns {{id: *, name: *, startTime: number, finishTime: *}}
 */
Utils.createProductionTechEvent = function(playerDoc, techName, finishTime){
	var event = {
		id:ShortId.generate(),
		name:techName,
		helped:false,
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建军事科技升级事件
 * @param playerDoc
 * @param techName
 * @param finishTime
 * @returns {{id: *, name: *, startTime: number, finishTime: *}}
 */
Utils.createMilitaryTechEvent = function(playerDoc, techName, finishTime){
	var event = {
		id:ShortId.generate(),
		name:techName,
		helped:false,
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建士兵升级事件
 * @param playerDoc
 * @param soldierName
 * @param finishTime
 * @returns {{id: *, name: *, startTime: number, finishTime: *}}
 */
Utils.createSoldierStarEvent = function(playerDoc, soldierName, finishTime){
	var event = {
		id:ShortId.generate(),
		name:soldierName,
		helped:false,
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建小屋建造事件
 * @param playerDoc
 * @param buildingLocation
 * @param houseLocation
 * @param finishTime
 * @returns {{buildingLocation: *, houseLocation: *, finishTime: *}}
 */
Utils.createHouseEvent = function(playerDoc, buildingLocation, houseLocation, finishTime){
	var event = {
		id:ShortId.generate(),
		buildingLocation:buildingLocation,
		houseLocation:houseLocation,
		helped:false,
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建防御塔建造事件
 * @param playerDoc
 * @param finishTime
 * @returns {{id: *, startTime: number, finishTime: *}}
 */
Utils.createTowerEvent = function(playerDoc, finishTime){
	var event = {
		id:ShortId.generate(),
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建城墙事件
 * @param playerDoc
 * @param finishTime
 * @returns {{finishTime: *}}
 */
Utils.createWallEvent = function(playerDoc, finishTime){
	var event = {
		id:ShortId.generate(),
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建士兵招募事件
 * @param playerDoc
 * @param soldierName
 * @param count
 * @param finishTime
 * @returns {{name: *, count: *, finishTime: *}}
 */
Utils.createSoldierEvent = function(playerDoc, soldierName, count, finishTime){
	var event = {
		id:ShortId.generate(),
		name:soldierName,
		count:count,
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建龙装备制造事件
 * @param playerDoc
 * @param equipmentName
 * @param finishTime
 * @returns {{name: *, finishTime: *}}
 */
Utils.createDragonEquipmentEvent = function(playerDoc, equipmentName, finishTime){
	var event = {
		id:ShortId.generate(),
		name:equipmentName,
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 创建士兵治疗事件
 * @param playerDoc
 * @param soldiers
 * @param finishTime
 * @returns {{soldiers: *, finishTime: *}}
 */
Utils.createTreatSoldierEvent = function(playerDoc, soldiers, finishTime){
	var event = {
		id:ShortId.generate(),
		soldiers:soldiers,
		startTime:Date.now(),
		finishTime:finishTime
	}
	return event
}

/**
 * 根据建筑建造事件查找建筑
 * @param playerDoc
 * @param buildingEvent
 * @returns {*}
 */
Utils.getBuildingByEvent = function(playerDoc, buildingEvent){
	return playerDoc.buildings["location_" + buildingEvent.location]
}

/**
 * 根据小屋建造事件查找小屋
 * @param playerDoc
 * @param houseEvent
 * @returns {*}
 */
Utils.getHouseByEvent = function(playerDoc, houseEvent){
	var building = playerDoc.buildings["location_" + houseEvent.buildingLocation]
	return _.find(building.houses, function(house){
		return _.isEqual(house.location, houseEvent.houseLocation)
	})
}

/**
 * 移除数组中指定的元素
 * @param array
 * @param items
 */
Utils.removeItemsInArray = function(array, items){
	for(var i = 0; i < items.length; i++){
		for(var j = 0; j < array.length; j++){
			if(_.isEqual(array[j], items[i])){
				array.splice(j, 1)
				break
			}
		}
	}
}

/**
 * 检查需要治疗的伤兵数据是否合法
 * @param playerDoc
 * @param soldiers
 * @returns {boolean}
 */
Utils.isTreatSoldierLegal = function(playerDoc, soldiers){
	if(soldiers.length == 0) return false
	return _.every(soldiers, function(soldier){
		var name = soldier.name
		var count = soldier.count
		if(!_.isString(name) || !_.isNumber(count)) return false
		count = Math.floor(count)
		if(count <= 0) return false
		return _.isNumber(playerDoc.woundedSoldiers[name]) && playerDoc.woundedSoldiers[name] >= count
	})
}

/**
 * 检查强化龙装备是否合法
 * @param playerDoc
 * @param equipments
 * @returns {boolean}
 */
Utils.isEnhanceDragonEquipmentLegal = function(playerDoc, equipments){
	if(equipments.length == 0) return false
	return _.every(equipments, function(equipment){
		var equipmentName = equipment.name
		var count = equipment.count
		if(!_.isString(equipmentName) || !_.isNumber(count)) return false
		count = Math.floor(count)
		if(count <= 0) return false
		return _.isNumber(playerDoc.dragonEquipments[equipmentName]) && playerDoc.dragonEquipments[equipmentName] >= count
	})
}

/**
 * 更新玩家在联盟的属性
 * @param playerDoc
 * @param online
 * @param allianceDoc
 * @param allianceData
 * @returns {*}
 */
Utils.updatePlayerPropertyInAlliance = function(playerDoc, online, allianceDoc, allianceData){
	var member = _.find(allianceDoc.members, function(member){
		return _.isEqual(member.id, playerDoc._id)
	})
	if(!member){
		return;
	}
	var memberIndex = allianceDoc.members.indexOf(member)
	member.online = online
	allianceData.push(["members." + memberIndex + ".online", member.online])
	if(!_.isEqual(member.pushId, playerDoc.pushId)){
		member.pushId = playerDoc.pushId
		allianceData.push(["members." + memberIndex + ".pushId", member.pushId])
	}
	if(!_.isEqual(member.language, playerDoc.basicInfo.language)){
		member.language = playerDoc.basicInfo.language
		allianceData.push(["members." + memberIndex + ".language", member.language])
	}
	if(!_.isEqual(member.name, playerDoc.basicInfo.name)){
		member.name = playerDoc.basicInfo.name
		allianceData.push(["members." + memberIndex + ".name", member.name])
	}
	if(!_.isEqual(member.icon, playerDoc.basicInfo.icon)){
		member.icon = playerDoc.basicInfo.icon
		allianceData.push(["members." + memberIndex + ".icon", member.icon])
	}
	if(!_.isEqual(member.terrain, playerDoc.basicInfo.terrain)){
		member.terrain = playerDoc.basicInfo.terrain
		allianceData.push(["members." + memberIndex + ".terrain", member.terrain])
	}
	if(!_.isEqual(member.levelExp, playerDoc.basicInfo.levelExp)){
		member.levelExp = playerDoc.basicInfo.levelExp
		allianceData.push(["members." + memberIndex + ".levelExp", member.levelExp])
	}
	if(!_.isEqual(member.power, playerDoc.basicInfo.power)){
		member.power = playerDoc.basicInfo.power
		allianceData.push(["members." + memberIndex + ".power", member.power])
	}
	if(!_.isEqual(member.kill, playerDoc.basicInfo.kill)){
		member.kill = playerDoc.basicInfo.kill
		allianceData.push(["members." + memberIndex + ".kill", member.kill])
	}
	if(!_.isEqual(member.lastLogoutTime, playerDoc.countInfo.lastLogoutTime)){
		member.lastLogoutTime = playerDoc.countInfo.lastLogoutTime
		allianceData.push(["members." + memberIndex + ".lastLogoutTime", member.lastLogoutTime])
	}
	if(!_.isEqual(member.keepLevel, playerDoc.buildings.location_1.level)){
		member.keepLevel = playerDoc.buildings.location_1.level
		allianceData.push(["members." + memberIndex + ".keepLevel", member.keepLevel])
	}
	if(!_.isEqual(member.loyalty, playerDoc.allianceData.loyalty)){
		member.loyalty = playerDoc.allianceData.loyalty
		allianceData.push(["members." + memberIndex + ".loyalty", member.loyalty])
	}
	member.pushStatus = CommonUtils.clone(playerDoc.pushStatus);
}

/**
 * 刷新联盟感知力
 * @param allianceDoc
 */
Utils.refreshAlliancePerception = function(allianceDoc){
	allianceDoc.basicInfo.perception = DataUtils.getAlliancePerception(allianceDoc)
	allianceDoc.basicInfo.perceptionRefreshTime = Date.now()
}

/**
 * 联盟是否存在此玩家
 * @param allianceDoc
 * @param playerId
 * @returns {boolean}
 */
Utils.isAllianceHasMember = function(allianceDoc, playerId){
	return _.some(allianceDoc.members, function(member){
		return _.isEqual(member.id, playerId)
	})
}

/**
 * 获取联盟地图对象
 * @param allianceDoc
 * @param memberId
 * @returns {*}
 */
Utils.getAllianceMemberMapObjectById = function(allianceDoc, memberId){
	var memberObject = _.find(allianceDoc.members, function(member){
		return _.isEqual(member.id, memberId)
	})
	if(!memberObject) return null;
	return _.find(allianceDoc.mapObjects, function(mapObject){
		return _.isEqual(mapObject.id, memberObject.mapId)
	})
}

/**
 * 根据村落ID查找村落
 * @param allianceDoc
 * @param villageId
 * @returns {*}
 */
Utils.getAllianceVillageById = function(allianceDoc, villageId){
	return _.find(allianceDoc.villages, function(village){
		return _.isEqual(village.id, villageId)
	})
}

/**
 * 是否有对某联盟的有效申请存在
 * @param playerDoc
 * @param allianceId
 * @returns {boolean}
 */
Utils.hasPendingRequestEventToAlliance = function(playerDoc, allianceId){
	var has = false
	_.each(playerDoc.requestToAllianceEvents, function(event){
		if(_.isEqual(event.id, allianceId)){
			has = true
		}
	})
	return has
}

/**
 * 获取联盟邀请事件
 * @param playerDoc
 * @param allianceId
 * @returns {*}
 */
Utils.getInviteToAllianceEvent = function(playerDoc, allianceId){
	var theEvent = null
	_.each(playerDoc.inviteToAllianceEvents, function(event){
		if(_.isEqual(event.id, allianceId)){
			theEvent = event
		}
	})
	return theEvent
}

/**
 * 获取联盟中某人的申请信息
 * @param allianceDoc
 * @param playerId
 * @returns {*}
 */
Utils.getPlayerRequestEventAtAlliance = function(allianceDoc, playerId){
	var theEvent = null
	_.each(allianceDoc.joinRequestEvents, function(event){
		if(_.isEqual(event.id, playerId)){
			theEvent = event
		}
	})
	return theEvent
}

/**
 * 添加联盟申请事件
 * @param allianceDoc
 * @param playerDoc
 * @param requestTime
 * @return {*}
 */
Utils.addAllianceRequestEvent = function(allianceDoc, playerDoc, requestTime){
	var event = {
		id:playerDoc._id,
		name:playerDoc.basicInfo.name,
		icon:playerDoc.basicInfo.icon,
		levelExp:playerDoc.basicInfo.levelExp,
		power:playerDoc.basicInfo.power,
		requestTime:requestTime
	}
	allianceDoc.joinRequestEvents.push(event)
	return event
}

/**
 * 添加玩家对联盟的申请事件
 * @param playerDoc
 * @param allianceDoc
 * @param requestTime
 * @return {*}
 */
Utils.addPlayerJoinAllianceEvent = function(playerDoc, allianceDoc, requestTime){
	var event = {
		id:allianceDoc._id,
		name:allianceDoc.basicInfo.name,
		tag:allianceDoc.basicInfo.tag,
		flag:allianceDoc.basicInfo.flag,
		archon:this.getAllianceArchon(allianceDoc).name,
		terrain:allianceDoc.basicInfo.terrain,
		members:allianceDoc.members.length,
		membersMax:DataUtils.getAllianceMemberMaxCount(allianceDoc),
		power:allianceDoc.basicInfo.power,
		country:allianceDoc.basicInfo.country,
		kill:allianceDoc.basicInfo.kill,
		status:Consts.AllianceJoinStatus.Pending,
		requestTime:requestTime
	}
	playerDoc.requestToAllianceEvents.push(event)
	return event
}

/**
 * 添加联盟对玩家的邀请事件
 * @param inviterId
 * @param playerDoc
 * @param allianceDoc
 * @param inviteTime
 * @return {*}
 */
Utils.addPlayerInviteAllianceEvent = function(inviterId, playerDoc, allianceDoc, inviteTime){
	var event = {
		id:allianceDoc._id,
		name:allianceDoc.basicInfo.name,
		tag:allianceDoc.basicInfo.tag,
		flag:allianceDoc.basicInfo.flag,
		archon:this.getAllianceArchon(allianceDoc).name,
		terrain:allianceDoc.basicInfo.terrain,
		members:allianceDoc.members.length,
		membersMax:DataUtils.getAllianceMemberMaxCount(allianceDoc),
		power:allianceDoc.basicInfo.power,
		country:allianceDoc.basicInfo.country,
		kill:allianceDoc.basicInfo.kill,
		inviterId:inviterId,
		inviteTime:inviteTime
	}
	playerDoc.inviteToAllianceEvents.push(event)
	return event
}

/**
 * 是否有对某联盟的邀请存在
 * @param playerDoc
 * @param allianceDoc
 * @returns {boolean}
 */
Utils.hasInviteEventToAlliance = function(playerDoc, allianceDoc){
	return _.some(playerDoc.inviteToAllianceEvents, function(event){
		return _.isEqual(event.id, allianceDoc._id)
	})
}

/**
 * 获取已经使用的建筑建造队列
 * @param playerDoc
 * @returns {number}
 */
Utils.getUsedBuildQueue = function(playerDoc){
	var usedBuildQueue = 0
	usedBuildQueue += playerDoc.buildingEvents.length
	usedBuildQueue += playerDoc.houseEvents.length

	return usedBuildQueue
}

/**
 * 获取最先完成的建筑建造事件
 * @param playerDoc
 * @returns {*}
 */
Utils.getSmallestBuildEvent = function(playerDoc){
	var event = null
	_.each(playerDoc.buildingEvents, function(theEvent){
		if(event == null || event.event.finishTime > theEvent.finishTime){
			event = {event:theEvent, type:"buildingEvents"}
		}
	})
	_.each(playerDoc.houseEvents, function(theEvent){
		if(event == null || event.event.finishTime > theEvent.finishTime){
			event = {event:theEvent, type:"houseEvents"}
		}
	})

	return event
}

/**
 * 获取最先完成的造兵事件
 * @param playerDoc
 * @returns {*}
 */
Utils.getSmallestRecruitEvent = function(playerDoc){
	var event = null
	_.each(playerDoc.soldierEvents, function(theEvent){
		if(event == null || event.event.finishTime > theEvent.finishTime){
			event = {event:theEvent, type:"soldierEvents"}
		}
	})

	return event
}

/**
 * 获取玩家建造事件
 * @param playerDoc
 * @param eventType
 * @param eventId
 * @returns {*}
 */
Utils.getPlayerEventByTypeAndId = function(playerDoc, eventType, eventId){
	if(_.isArray(playerDoc[eventType])){
		return this.getObjectById(playerDoc[eventType], eventId)
	}
	return null
}

/**
 * 根据Id获取事件
 * @param objects
 * @param id
 * @returns {*}
 */
Utils.getObjectById = function(objects, id){
	return _.find(objects, function(object){
		return _.isEqual(object.id, id)
	})
}

/**
 * 根据协助加速类型和建造事件获取建筑
 * @param playerDoc
 * @param eventType
 * @param eventId
 * @returns {*}
 */
Utils.getPlayerObjectByEvent = function(playerDoc, eventType, eventId){
	var event = _.find(playerDoc[eventType], function(event){
		return _.isEqual(event.id, eventId)
	})

	if(_.isEqual(eventType, Consts.AllianceHelpEventType.BuildingEvents)){
		var building = playerDoc.buildings["location_" + event.location]
		return {name:building.type, level:building.level}
	}else if(_.isEqual(eventType, Consts.AllianceHelpEventType.HouseEvents)){
		var theBuilding = playerDoc.buildings["location_" + event.buildingLocation]
		var theHouse = _.find(theBuilding.houses, function(house){
			return _.isEqual(house.location, event.houseLocation)
		})
		return {name:theHouse.type, level:theHouse.level}
	}else if(_.isEqual(eventType, Consts.AllianceHelpEventType.ProductionTechEvents)){
		var productionTech = playerDoc.productionTechs[event.name]
		return {name:event.name, level:productionTech.level}
	}else if(_.isEqual(eventType, Consts.AllianceHelpEventType.MilitaryTechEvents)){
		var militaryTech = playerDoc.militaryTechs[event.name]
		return {name:event.name, level:militaryTech.level}
	}else if(_.isEqual(eventType, Consts.AllianceHelpEventType.SoldierStarEvents)){
		return {name:event.name, level:playerDoc.soldierStars[event.name]}
	}

	return null
}

/**
 * 根据邮件Id获取邮件
 * @param playerDoc
 * @param mailId
 * @returns {*}
 */
Utils.getPlayerMailById = function(playerDoc, mailId){
	return _.find(playerDoc.mails, function(mail){
		return _.isEqual(mail.id, mailId)
	})
}

/**
 * 根据战报Id获取战报
 * @param playerDoc
 * @param reportId
 * @returns {*}
 */
Utils.getPlayerReportById = function(playerDoc, reportId){
	return _.find(playerDoc.reports, function(report){
		return _.isEqual(report.id, reportId)
	})
}

/**
 * 获取第一份未保存的邮件
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerFirstUnSavedMail = function(playerDoc){
	for(var i = 0; i < playerDoc.mails.length; i++){
		var mail = playerDoc.mails[i]
		if(!mail.isSaved && mail.isRead){
			return mail
		}
	}
	return playerDoc.mails[0]
}

/**
 * 获取第一份未保存的战报
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerFirstUnSavedReport = function(playerDoc){
	for(var i = 0; i < playerDoc.reports.length; i++){
		var report = playerDoc.reports[i]
		if(!report.isSaved){
			return report
		}
	}
	return playerDoc.reports[0]
}

/**
 * 获取联盟盟主信息
 * @param allianceDoc
 * @returns {*}
 */
Utils.getAllianceArchon = function(allianceDoc){
	for(var i = 0; i < allianceDoc.members.length; i++){
		var member = allianceDoc.members[i]
		if(_.isEqual(member.title, Consts.AllianceTitle.Archon)){
			return member
		}
	}
	return null
}

/**
 * 添加联盟事件
 * @param allianceDoc
 * @param allianceData
 * @param category
 * @param type
 * @param key
 * @param params
 * @returns {{category: *, type: *, key: *, time: number, params: *}}
 */
Utils.AddAllianceEvent = function(allianceDoc, allianceData, category, type, key, params){
	var event = {
		category:category,
		type:type,
		key:key,
		time:Date.now(),
		params:params
	}

	if(allianceDoc.events.length >= Define.AllianceEventsMaxSize){
		allianceData.push(["events." + 0, null])
		allianceDoc.events.shift()
	}
	allianceDoc.events.push(event)
	allianceData.push(["events." + allianceDoc.events.indexOf(event), event])
}

/**
 * 为联盟添加成员
 * @param allianceDoc
 * @param playerDoc
 * @param title
 * @param mapId
 * @param online
 * @return {*}
 */
Utils.addAllianceMember = function(allianceDoc, playerDoc, title, mapId, online){
	var newbeeProtectItemEvent = this.getPlayerNewbeeProtectItemEvent(playerDoc);
	var member = {
		id:playerDoc._id,
		mapId:mapId,
		pushId:playerDoc.pushId,
		language:playerDoc.basicInfo.language,
		name:playerDoc.basicInfo.name,
		icon:playerDoc.basicInfo.icon,
		terrain:playerDoc.basicInfo.terrain,
		levelExp:playerDoc.basicInfo.levelExp,
		keepLevel:playerDoc.buildings.location_1.level,
		status:Consts.PlayerStatus.Normal,
		power:playerDoc.basicInfo.power,
		kill:playerDoc.basicInfo.kill,
		loyalty:playerDoc.allianceData.loyalty,
		lastLogoutTime:playerDoc.countInfo.lastLogoutTime,
		lastBeAttackedTime:0,
		title:title,
		pushStatus:CommonUtils.clone(playerDoc.pushStatus),
		beHelped:false,
		protectStartTime:0,
		newbeeProtectFinishTime:!!newbeeProtectItemEvent ? newbeeProtectItemEvent.finishTime : 0,
		joinAllianceTime:Date.now(),
		lastThreeDaysKillData:[],
		lastRewardData:null
	}
	if(!!online)
		member.online = online
	allianceDoc.members.push(member)
	return member
}

/**
 * 获取可用的地图坐标
 * @param allianceDoc
 * @param width
 * @param height
 * @returns {{x: *, y: *, width: *, height: *}}
 */
Utils.getFreePointInAllianceMap = function(allianceDoc, width, height){
	var map = MapUtils.buildMap(allianceDoc.basicInfo.terrainStyle, allianceDoc.mapObjects);
	var rect = MapUtils.getRect(map, width, height)
	return rect
}

/**
 * 根据Id获取联盟地图中的对象
 * @param allianceDoc
 * @param objectId
 * @returns {*}
 */
Utils.getAllianceMapObjectById = function(allianceDoc, objectId){
	for(var i = 0; i < allianceDoc.mapObjects.length; i++){
		var mapObject = allianceDoc.mapObjects[i]
		if(_.isEqual(mapObject.id, objectId)) return mapObject
	}
	return null
}

/**
 * 创建联盟建筑对象
 * @param name
 * @param rect
 * @returns {{type: *, location: {x: (rect.x|*), y: (rect.y|*)}}}
 */
Utils.createAllianceMapObject = function(name, rect){
	var object = {
		id:ShortId.generate(),
		name:name,
		location:{
			x:rect.x,
			y:rect.y
		}
	}
	return object
}

/**
 * 联盟某个村落是否真正被采集
 * @param allianceDoc
 * @param villageId
 * @returns {boolean}
 */
Utils.isAllianceVillageBeingCollect = function(allianceDoc, villageId){
	for(var i = 0; i < allianceDoc.villageEvents.length; i++){
		var collectEvent = allianceDoc.collectEvents[i]
		if(_.isEqual(collectEvent.villageId, villageId)) return true
	}
	return false
}

/**
 * 联盟某个圣地事件是否已经激活
 * @param allianceDoc
 * @param stageName
 * @returns {boolean}
 */
Utils.isAllianceShrineStageActivated = function(allianceDoc, stageName){
	for(var i = 0; i < allianceDoc.shrineEvents.length; i++){
		var event = allianceDoc.shrineEvents[i]
		if(_.isEqual(event.stageName, stageName)) return true
	}
	return false
}

/**
 * 获取联盟指定类型的建筑的数量类型
 * @param allianceDoc
 * @param decorateType
 * @returns {number}
 */
Utils.getAllianceDecorateObjectCountByType = function(allianceDoc, decorateType){
	var count = 0
	_.each(allianceDoc.mapObjects, function(mapObject){
		if(_.isEqual(mapObject.type, decorateType)) count++
	})

	return count
}

/**
 * 行军派出的士兵数量是否合法
 * @param playerDoc
 * @param soldiers
 * @returns {boolean}
 */
Utils.isPlayerMarchSoldiersLegal = function(playerDoc, soldiers){
	if(soldiers.length == 0) return false
	var kvSoldiers = {};
	_.each(soldiers, function(soldier){
		if(!kvSoldiers[soldier.name]) kvSoldiers[soldier.name] = 0;
		kvSoldiers[soldier.name] += soldier.count;
	})
	return !_.some(kvSoldiers, function(count, name){
		return !playerDoc.soldiers[name] || playerDoc.soldiers[name] < count;
	})
}

/**
 * 重置玩家部队战斗数据
 * @param soldiersForFight
 * @param soldiersAfterFight
 */
Utils.resetFightSoldiersByFightResult = function(soldiersForFight, soldiersAfterFight){
	var soldiersWillRemoved = []
	_.each(soldiersAfterFight, function(soldierAfterFight){
		var soldierForFight = _.find(soldiersForFight, function(soldierForFight){
			return _.isEqual(soldierForFight.position, soldierAfterFight.position)
		})
		soldierForFight.totalCount = soldierAfterFight.currentCount;
		soldierForFight.currentCount = soldierForFight.totalCount;
		soldierForFight.woundedCount = 0;
		if(soldierForFight.totalCount <= 0) soldiersWillRemoved.push(soldierForFight)
	})
	this.removeItemsInArray(soldiersForFight, soldiersWillRemoved)
}

/**
 * 从联盟圣地事件中获取玩家龙的信息
 * @param playerId
 * @param event
 * @returns {*}
 */
Utils.getPlayerDragonDataFromAllianceShrineStageEvent = function(playerId, event){
	for(var i = 0; i < event.playerTroops.length; i++){
		var playerTroop = event.playerTroops[i]
		if(_.isEqual(playerTroop.id, playerId)) return playerTroop.dragon
	}
	return null
}

/**
 * 圣地指定关卡是否已经有玩家部队存在
 * @param allianceDoc
 * @param shrineEvent
 * @param playerId
 * @returns {boolean}
 */
Utils.isPlayerHasTroopMarchToAllianceShrineStage = function(allianceDoc, shrineEvent, playerId){
	for(var i = 0; i < allianceDoc.marchEvents.attackMarchEvents.length; i++){
		var marchEvent = allianceDoc.marchEvents.attackMarchEvents[i]
		if(_.isEqual(marchEvent.marchType, Consts.MarchType.Shrine)
			&& _.isEqual(marchEvent.defenceShrineData.shrineEventId, shrineEvent.id)
			&& _.isEqual(marchEvent.attackPlayerData.id, playerId)
		) return true
	}
	for(i = 0; i < shrineEvent.playerTroops.length; i++){
		var playerTroop = shrineEvent.playerTroops[i]
		if(_.isEqual(playerTroop.id, playerId)) return true
	}
	return false
}

/**
 * 获取联盟某关卡的历史星级数据
 * @param allianceDoc
 * @param stageName
 * @returns {*}
 */
Utils.getAllianceShrineStageData = function(allianceDoc, stageName){
	for(var i = 0; i < allianceDoc.shrineDatas.length; i++){
		var stageData = allianceDoc.shrineDatas[i]
		if(_.isEqual(stageData.stageName, stageName)){
			return stageData
		}
	}
	return null
}

/**
 * 修复联盟圣地战战报中的未参战的玩家的数据
 * @param playerTroops
 * @param playerDatas
 * @return {*}
 */
Utils.fixAllianceShrineStagePlayerData = function(playerTroops, playerDatas){
	var thePlayerTroops = {}
	_.each(playerTroops, function(playerTroop){
		thePlayerTroops[playerTroop.id] = playerTroop
	})
	_.each(playerDatas, function(playerData){
		delete thePlayerTroops[playerData.id]
	})
	_.each(thePlayerTroops, function(playerTroop){
		var playerData = {
			id:playerTroop.id,
			name:playerTroop.name,
			icon:playerTroop.icon,
			kill:0,
			rewards:[]
		}
		playerDatas.push(playerData)
	})
	return playerDatas
}

/**
 * 联盟战匹配成功后,创建初始数据结构
 * @param attackAllianceDoc
 * @param defenceAllianceDoc
 * @param prepareTime
 */
Utils.prepareForAllianceFight = function(attackAllianceDoc, defenceAllianceDoc, prepareTime){
	var now = Date.now()
	attackAllianceDoc.basicInfo.status = Consts.AllianceStatus.Prepare
	attackAllianceDoc.basicInfo.statusStartTime = now
	attackAllianceDoc.basicInfo.statusFinishTime = prepareTime
	attackAllianceDoc.allianceFight = {
		attacker:{
			alliance:{
				id:attackAllianceDoc._id,
				name:attackAllianceDoc.basicInfo.name,
				tag:attackAllianceDoc.basicInfo.tag,
				flag:attackAllianceDoc.basicInfo.flag,
				mapIndex:attackAllianceDoc.mapIndex,
				memberCount:attackAllianceDoc.members.length
			},
			playerKills:[],
			allianceCountData:{
				kill:0,
				routCount:0,
				strikeCount:0,
				strikeSuccessCount:0,
				attackCount:0,
				attackSuccessCount:0
			}
		},
		defencer:{
			alliance:{
				id:defenceAllianceDoc._id,
				name:defenceAllianceDoc.basicInfo.name,
				tag:defenceAllianceDoc.basicInfo.tag,
				flag:defenceAllianceDoc.basicInfo.flag,
				mapIndex:defenceAllianceDoc.mapIndex,
				memberCount:defenceAllianceDoc.members.length
			},
			playerKills:[],
			allianceCountData:{
				kill:0,
				routCount:0,
				strikeCount:0,
				strikeSuccessCount:0,
				attackCount:0,
				attackSuccessCount:0
			}
		}
	}
	defenceAllianceDoc.basicInfo.status = Consts.AllianceStatus.Prepare
	defenceAllianceDoc.basicInfo.statusStartTime = now
	defenceAllianceDoc.basicInfo.statusFinishTime = prepareTime
	defenceAllianceDoc.allianceFight = attackAllianceDoc.allianceFight;
}

/**
 * 更新联盟统计数据
 * @param attackAllianceDoc
 * @param defenceAllianceDoc
 */
Utils.updateAllianceCountInfo = function(attackAllianceDoc, defenceAllianceDoc){
	var attackAllianceCountInfo = attackAllianceDoc.countInfo
	var defenceAllianceCountInfo = defenceAllianceDoc.countInfo
	var allianceFight = attackAllianceDoc.allianceFight
	var attacker = allianceFight.attacker;
	var defencer = allianceFight.defencer;
	attackAllianceCountInfo.kill += attacker.allianceCountData.kill
	attackAllianceCountInfo.beKilled += defencer.allianceCountData.kill
	attackAllianceCountInfo.routCount += attacker.allianceCountData.routCount
	attackAllianceCountInfo.winCount += attacker.allianceCountData.kill >= defencer.allianceCountData.kill ? 1 : 0
	attackAllianceCountInfo.failedCount += attacker.allianceCountData.kill >= defencer.allianceCountData.kill ? 0 : 1
	defenceAllianceCountInfo.kill += defencer.allianceCountData.kill
	defenceAllianceCountInfo.beKilled += attacker.allianceCountData.kill
	defenceAllianceCountInfo.routCount += defencer.allianceCountData.routCount
	defenceAllianceCountInfo.winCount += defencer.allianceCountData.kill >= attacker.allianceCountData.kill ? 1 : 0
	defenceAllianceCountInfo.failedCount += defencer.allianceCountData.kill >= attacker.allianceCountData.kill ? 0 : 1
}

/**
 * 获取玩家正在进行防守的龙
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerDefenceDragon = function(playerDoc){
	return !!playerDoc.defenceTroop ? playerDoc.dragons[playerDoc.defenceTroop.dragonType] : null;
}

/**
 * 添加联盟战历史记录战报
 * @param allianceDoc
 * @param allianceData
 * @param report
 */
Utils.addAllianceFightReport = function(allianceDoc, allianceData, report){
	var self = this
	var willRemovedReport = null
	if(allianceDoc.allianceFightReports.length >= Define.AllianceFightReportsMaxSize){
		willRemovedReport = allianceDoc.allianceFightReports[0]
		allianceData.push(["allianceFightReports." + allianceDoc.allianceFightReports.indexOf(willRemovedReport), null])
		self.removeItemInArray(allianceDoc.allianceFightReports, willRemovedReport)
	}
	allianceDoc.allianceFightReports.push(report)
	allianceData.push(["allianceFightReports." + allianceDoc.allianceFightReports.indexOf(report), report])
}

/**
 * 合并奖励
 * @param rewards
 * @param rewardsNew
 * @returns {*}
 */
Utils.mergeRewards = function(rewards, rewardsNew){
	_.each(rewardsNew, function(rewardNew){
		var reward = _.find(rewards, function(reward){
			return _.isEqual(reward.type, rewardNew.type) && _.isEqual(reward.name, rewardNew.name)
		})
		if(!_.isObject(reward)){
			reward = {
				type:rewardNew.type,
				name:rewardNew.name,
				count:0
			}
			rewards.push(reward)
		}
		reward.count += rewardNew.count
	})
	return rewards
}

/**
 * 合并兵力数据
 * @param soldiers
 * @param soldiersNew
 * @returns {*}
 */
Utils.mergeSoldiers = function(soldiers, soldiersNew){
	_.each(soldiersNew, function(soldierNew){
		var soldier = _.find(soldiers, function(soldier){
			return _.isEqual(soldier.name, soldierNew.name)
		})
		if(!_.isObject(soldier)){
			soldier = {
				name:soldierNew.name,
				count:0
			}
			soldiers.push(soldier)
		}
		soldier.count += soldierNew.count
	})
	return soldiers
}

/**
 * 玩家龙领导力是否足以派出指定的士兵
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @returns {boolean}
 */
Utils.isPlayerDragonLeadershipEnough = function(playerDoc, dragon, soldiers){
	var dragonMaxCitizen = DataUtils.getPlayerDragonMaxCitizen(playerDoc, dragon)
	return !_.some(soldiers, function(soldier){
		var soldierCitizen = DataUtils.getPlayerSoldiersCitizen(playerDoc, [soldier])
		return dragonMaxCitizen < soldierCitizen
	})
}

/**
 * 退还玩家在圣地的数据
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 */
Utils.returnPlayerShrineTroops = function(playerDoc, playerData, allianceDoc, allianceData){
	var self = this
	var playerTroops = [];
	_.each(allianceDoc.shrineEvents, function(shrineEvent){
		var playerTroop = _.find(shrineEvent.playerTroops, function(playerTroop){
			return _.isEqual(playerDoc._id, playerTroop.id)
		})
		if(_.isObject(playerTroop)) playerTroops.push({event:shrineEvent, troop:playerTroop});
	})
	_.each(playerTroops, function(playerTroop){
		allianceData.push(["shrineEvents." + allianceDoc.shrineEvents.indexOf(playerTroop.event) + ".playerTroops." + playerTroop.event.playerTroops.indexOf(playerTroop.troop), null])
		self.removeItemInArray(playerTroop.event.playerTroops, playerTroop.troop)

		self.removePlayerTroopOut(playerDoc, playerData, playerTroop.troop.dragon.type);
		DataUtils.refreshPlayerDragonsHp(playerDoc, playerDoc.dragons[playerTroop.troop.dragon.type])
		playerDoc.dragons[playerTroop.troop.dragon.type].status = Consts.DragonStatus.Free
		playerData.push(["dragons." + playerTroop.troop.dragon.type, playerDoc.dragons[playerTroop.troop.dragon.type]])
		self.addPlayerSoldiers(playerDoc, playerData, playerTroop.troop.soldiers);
	})
}

/**
 * 退还进攻行军中玩家的数据
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 * @param pushFuncs
 * @param eventFuncs
 * @param timeEventService
 * @param cacheService
 */
Utils.returnPlayerMarchTroops = function(playerDoc, playerData, allianceDoc, allianceData, eventFuncs, pushFuncs, timeEventService, cacheService){
	var self = this
	var i = allianceDoc.marchEvents.strikeMarchEvents.length
	var marchEvent = null
	while(i--){
		marchEvent = allianceDoc.marchEvents.strikeMarchEvents[i]
		if(_.isEqual(marchEvent.attackPlayerData.id, playerDoc._id)){
			pushFuncs.push([cacheService, cacheService.removeMarchEventAsync, 'strikeMarchEvents', marchEvent]);
			allianceData.push(["marchEvents.strikeMarchEvents." + allianceDoc.marchEvents.strikeMarchEvents.indexOf(marchEvent), null])
			allianceDoc.marchEvents.strikeMarchEvents.splice(i, 1)
			eventFuncs.push([timeEventService, timeEventService.removeAllianceTimeEventAsync, allianceDoc, "strikeMarchEvents", marchEvent.id])

			DataUtils.refreshPlayerDragonsHp(playerDoc, playerDoc.dragons[marchEvent.attackPlayerData.dragon.type])
			playerDoc.dragons[marchEvent.attackPlayerData.dragon.type].status = Consts.DragonStatus.Free
			playerData.push(["dragons." + marchEvent.attackPlayerData.dragon.type, playerDoc.dragons[marchEvent.attackPlayerData.dragon.type]])
		}
	}
	i = allianceDoc.marchEvents.attackMarchEvents.length
	while(i--){
		marchEvent = allianceDoc.marchEvents.attackMarchEvents[i]
		if(_.isEqual(marchEvent.attackPlayerData.id, playerDoc._id)){
			pushFuncs.push([cacheService, cacheService.removeMarchEventAsync, 'attackMarchEvents', marchEvent]);
			allianceData.push(["marchEvents.attackMarchEvents." + allianceDoc.marchEvents.attackMarchEvents.indexOf(marchEvent), null])
			allianceDoc.marchEvents.attackMarchEvents.splice(i, 1)
			eventFuncs.push([timeEventService, timeEventService.removeAllianceTimeEventAsync, allianceDoc, "attackMarchEvents", marchEvent.id])

			self.removePlayerTroopOut(playerDoc, playerData, marchEvent.attackPlayerData.dragon.type);
			DataUtils.refreshPlayerDragonsHp(playerDoc, playerDoc.dragons[marchEvent.attackPlayerData.dragon.type])
			playerDoc.dragons[marchEvent.attackPlayerData.dragon.type].status = Consts.DragonStatus.Free
			playerData.push(["dragons." + marchEvent.attackPlayerData.dragon.type, playerDoc.dragons[marchEvent.attackPlayerData.dragon.type]])
			self.addPlayerSoldiers(playerDoc, playerData, marchEvent.attackPlayerData.soldiers)
		}
	}
}

/**
 * 退还回城行军中玩家的数据
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param allianceData
 * @param updateFuncs
 * @param eventFuncs
 * @param pushFuncs
 * @param timeEventService
 * @param cacheService
 * @param dataService
 */
Utils.returnPlayerMarchReturnTroops = function(playerDoc, playerData, allianceDoc, allianceData, updateFuncs, eventFuncs, pushFuncs, timeEventService, cacheService, dataService){
	var self = this
	var i = allianceDoc.marchEvents.strikeMarchReturnEvents.length
	var marchEvent = null
	while(i--){
		marchEvent = allianceDoc.marchEvents.strikeMarchReturnEvents[i]
		if(_.isEqual(marchEvent.attackPlayerData.id, playerDoc._id)){
			pushFuncs.push([cacheService, cacheService.removeMarchEventAsync, 'strikeMarchReturnEvents', marchEvent]);
			allianceData.push(["marchEvents.strikeMarchReturnEvents." + allianceDoc.marchEvents.strikeMarchReturnEvents.indexOf(marchEvent), null])
			allianceDoc.marchEvents.strikeMarchReturnEvents.splice(i, 1)
			eventFuncs.push([timeEventService, timeEventService.removeAllianceTimeEventAsync, allianceDoc, "strikeMarchReturnEvents", marchEvent.id])

			DataUtils.refreshPlayerDragonsHp(playerDoc, playerDoc.dragons[marchEvent.attackPlayerData.dragon.type])
			playerDoc.dragons[marchEvent.attackPlayerData.dragon.type].status = Consts.DragonStatus.Free
			playerData.push(["dragons." + marchEvent.attackPlayerData.dragon.type, playerDoc.dragons[marchEvent.attackPlayerData.dragon.type]])
		}
	}
	i = allianceDoc.marchEvents.attackMarchReturnEvents.length
	while(i--){
		marchEvent = allianceDoc.marchEvents.attackMarchReturnEvents[i]
		if(_.isEqual(marchEvent.attackPlayerData.id, playerDoc._id)){
			pushFuncs.push([cacheService, cacheService.removeMarchEventAsync, 'attackMarchReturnEvents', marchEvent]);
			allianceData.push(["marchEvents.attackMarchReturnEvents." + allianceDoc.marchEvents.attackMarchReturnEvents.indexOf(marchEvent), null])
			allianceDoc.marchEvents.attackMarchReturnEvents.splice(i, 1)
			eventFuncs.push([timeEventService, timeEventService.removeAllianceTimeEventAsync, allianceDoc, "attackMarchReturnEvents", marchEvent.id])

			self.removePlayerTroopOut(playerDoc, playerData, marchEvent.attackPlayerData.dragon.type);
			DataUtils.refreshPlayerDragonsHp(playerDoc, playerDoc.dragons[marchEvent.attackPlayerData.dragon.type])
			playerDoc.dragons[marchEvent.attackPlayerData.dragon.type].status = Consts.DragonStatus.Free
			playerData.push(["dragons." + marchEvent.attackPlayerData.dragon.type, playerDoc.dragons[marchEvent.attackPlayerData.dragon.type]])
			self.addPlayerSoldiers(playerDoc, playerData, marchEvent.attackPlayerData.soldiers)
			DataUtils.addPlayerWoundedSoldiers(playerDoc, playerData, marchEvent.attackPlayerData.woundedSoldiers)
			updateFuncs.push([dataService, dataService.addPlayerRewardsAsync, playerDoc, playerData, 'returnPlayerMarchReturnTroops', null, marchEvent.attackPlayerData.rewards, false])
		}
	}
}

/**
 * 退还数据给协防方
 * @param playerDoc
 * @param playerData
 * @param helpedByPlayerDoc
 * @param helpedByPlayerData
 * @param updateFuncs
 * @param dataService
 */
Utils.returnPlayerHelpedByTroop = function(playerDoc, playerData, helpedByPlayerDoc, helpedByPlayerData, updateFuncs, dataService){
	var helpedByTroop = playerDoc.helpedByTroop;
	this.removePlayerTroopOut(helpedByPlayerDoc, helpedByPlayerData, helpedByTroop.dragon.type);
	DataUtils.refreshPlayerDragonsHp(helpedByPlayerDoc, helpedByPlayerDoc.dragons[helpedByTroop.dragon.type])
	helpedByPlayerDoc.dragons[helpedByTroop.dragon.type].status = Consts.DragonStatus.Free
	helpedByPlayerData.push(["dragons." + helpedByTroop.dragon.type, helpedByPlayerDoc.dragons[helpedByTroop.dragon.type]])
	this.addPlayerSoldiers(helpedByPlayerDoc, helpedByPlayerData, helpedByTroop.soldiers);
	DataUtils.addPlayerWoundedSoldiers(helpedByPlayerDoc, helpedByPlayerData, helpedByTroop.woundedSoldiers);
	updateFuncs.push([dataService, dataService.addPlayerRewardsAsync, playerDoc, playerData, 'returnPlayerHelpedByTroop', null, helpedByTroop.rewards, false])
	playerDoc.helpedByTroop = null;
	playerData.push(['helpedByTroop', null]);

	var helpToTroop = this.getObjectById(helpedByPlayerDoc.helpToTroops, playerDoc._id);
	helpedByPlayerData.push(['helpToTroops.' + helpedByPlayerDoc.helpToTroops.indexOf(helpToTroop), null]);
	this.removeItemInArray(helpedByPlayerDoc.helpToTroops, helpToTroop);
}

/**
 * 退还数据给协防方
 * @param playerDoc
 * @param playerData
 * @param beHelpedPlayerDoc
 * @param beHelpedPlayerData
 * @param updateFuncs
 * @param dataService
 */
Utils.returnPlayerHelpToTroop = function(playerDoc, playerData, beHelpedPlayerDoc, beHelpedPlayerData, updateFuncs, dataService){
	this.returnPlayerHelpedByTroop(beHelpedPlayerDoc, beHelpedPlayerData, playerDoc, playerData, updateFuncs, dataService)
}

/**
 * 移除玩家在联盟中的协助加速信息
 * @param playerDoc
 * @param allianceDoc
 * @param allianceData
 */
Utils.removePlayerHelpEvents = function(playerDoc, allianceDoc, allianceData){
	var self = this;
	var helpEvents = [].concat(allianceDoc.helpEvents);
	_.each(helpEvents, function(helpEvent){
		var memberId = helpEvent.playerData.id
		if(_.isEqual(memberId, playerDoc._id)){
			allianceData.push(["helpEvents." + allianceDoc.helpEvents.indexOf(helpEvent), null])
			self.removeItemInArray(allianceDoc.helpEvents, helpEvent)
		}
	})
}


/**
 * 将材料添加到材料仓库中,超过仓库上限后直接丢弃
 * @param playerDoc
 * @param playerData
 * @param materialType
 * @param materials
 * @param forceAdd
 */
Utils.addPlayerMaterials = function(playerDoc, playerData, materialType, materials, forceAdd){
	if(materials.length === 0) return;
	var materialUpLimit = DataUtils.getMaterialUpLimit(playerDoc, materialType)
	var playerMaterilas = playerDoc[materialType]
	_.each(materials, function(material){
		var currentMaterial = playerMaterilas[material.name]
		if(forceAdd || currentMaterial < materialUpLimit){
			currentMaterial += material.count
			playerMaterilas[material.name] = currentMaterial
			playerData.push([materialType, playerMaterilas]);
		}
	})
}

/**
 * 创建一笔交易
 * @param playerDoc
 * @param type
 * @param name
 * @param count
 * @param price
 * @returns {*}
 */
Utils.createDeal = function(playerDoc, type, name, count, price){
	var id = ShortId.generate()
	var dealForPlayer = {
		id:id,
		isSold:false,
		itemData:{
			type:type,
			name:name,
			count:count,
			price:price
		}
	}
	var dealForAll = {
		_id:id,
		playerId:playerDoc._id,
		serverId:playerDoc.serverId,
		itemData:{
			type:type,
			name:name,
			count:count,
			price:price
		}
	}

	return {dealForPlayer:dealForPlayer, dealForAll:dealForAll}
}

/**
 * 为联盟添加道具
 * @param allianceDoc
 * @param name
 * @param count
 * @returns {{item: *, newlyCreated: boolean}}
 */
Utils.addAllianceItem = function(allianceDoc, name, count){
	var newlyCreated = false
	var item = _.find(allianceDoc.items, function(item){
		return _.isEqual(item.name, name)
	})
	if(!_.isObject(item)){
		item = {
			name:name,
			count:0
		}
		allianceDoc.items.push(item)
		newlyCreated = true
	}
	item.count += count

	return {item:item, newlyCreated:newlyCreated}
}

/**
 * 获取今日的日期
 * @returns {String}
 */
Utils.getTodayDateString = function(){
	return this.getDateString(Date.now());
}

/**
 * 获取昨天的日期
 * @returns {string}
 */
Utils.getYesterdayDateString = function(){
	return this.getDateString(Date.now() - (1000 * 60 * 60 * 24));
}

/**
 * 根据毫秒值获取日期
 * @param time
 */
Utils.getDateString = function(time){
	var date = new Date(time)
	return date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate()
}

/**
 * 获取今天开始时的毫秒值
 * @returns {number}
 */
Utils.getTodayDateTime = function(){
	return Date.parse(this.getTodayDateString() + ' GMT+0000');
}

/**
 * 获取前N天的开始时的毫秒值
 * @param time
 * @param n
 * @returns {number}
 */
Utils.getPreviousDateTime = function(time, n){
	var timeNext = time - (1000 * 60 * 60 * 24 * n);
	return Date.parse(this.getDateString(timeNext) + ' GMT+0000');
}

/**
 * 获取后N天开始时的毫秒值
 * @param time
 * @param n
 * @returns {number}
 */
Utils.getNextDateTime = function(time, n){
	var timeNext = time + (1000 * 60 * 60 * 24 * n);
	return Date.parse(this.getDateString(timeNext) + ' GMT+0000');
}

/**
 * 是否合法的日期字符串
 * @param dateString
 * @returns {*}
 */
Utils.isValidDateString = function(dateString){
	return moment.utc(dateString, 'YYYY-MM-DD', true).isValid();
}

/**
 * 获取UTC DateString
 * @param dateString
 * @returns {number}
 */
Utils.getDateTimeFromString = function(dateString){
	if(!this.isValidDateString(dateString)) return this.getTodayDateTime();
	return moment.utc(dateString, 'YYYY-MM-DD', true).valueOf();
}

/**
 * 添加联盟成员最近3天的击杀数据
 * @param allianceDoc
 * @param memberObject
 * @param kill
 */
Utils.addAlliancePlayerLastThreeDaysKillData = function(allianceDoc, memberObject, kill){
	var todayString = this.getTodayDateString()
	var killData = _.find(memberObject.lastThreeDaysKillData, function(killData){
		return _.isEqual(killData.date, todayString)
	})
	if(_.isObject(killData)){
		killData.kill += kill
	}else{
		if(memberObject.lastThreeDaysKillData.length >= 3){
			memberObject.lastThreeDaysKillData.pop()
		}
		killData = {
			kill:kill,
			date:todayString
		}
		memberObject.lastThreeDaysKillData.push(killData)
	}
	return memberObject
}

/**
 * 创建联盟道具商城日志
 * @param logType
 * @param playerName
 * @param itemName
 * @param itemCount
 * @returns {{type: *, playerName: *, itemName: *, itemCount: *, time: number}}
 */
Utils.createAllianceItemLog = function(logType, playerName, itemName, itemCount){
	var log = {
		type:logType,
		playerName:playerName,
		itemName:itemName,
		itemCount:itemCount,
		time:Date.now()
	}
	return log
}

/**
 * 添加联盟商店日志
 * @param allianceDoc
 * @param allianceData
 * @param log
 */
Utils.addAllianceItemLog = function(allianceDoc, allianceData, log){
	var willRemovedLog = null
	if(allianceDoc.itemLogs.length >= Define.AllianceItemLogsMaxSize){
		willRemovedLog = allianceDoc.itemLogs[0]
		allianceData.push(["itemLogs." + allianceDoc.itemLogs.indexOf(willRemovedLog), null])
		this.removeItemInArray(allianceDoc.itemLogs, willRemovedLog)
	}
	allianceDoc.itemLogs.push(log)
	allianceData.push(["itemLogs." + allianceDoc.itemLogs.indexOf(log), log])
}

/**
 * 格式化玩家数据中的士兵信息
 * @param soldiers
 * @returns {Array}
 */
Utils.getFormatedSoldiers = function(soldiers){
	var formatedSoldiers = []
	_.each(soldiers, function(count, name){
		var soldier = {
			name:name,
			count:count
		}
		formatedSoldiers.push(soldier)
	})

	return formatedSoldiers
}

/**
 * 为玩家添加士兵
 * @param playerDoc
 * @param playerData
 * @param soldiers
 */
Utils.addPlayerSoldiers = function(playerDoc, playerData, soldiers){
	_.each(soldiers, function(soldier){
		playerDoc.soldiers[soldier.name] += soldier.count
		playerData.push(["soldiers." + soldier.name, playerDoc.soldiers[soldier.name]])
	})
}

/**
 * 玩家是否有空闲的行军队列
 * @param playerDoc
 * @returns {boolean}
 */
Utils.isPlayerHasFreeMarchQueue = function(playerDoc){
	return (!!playerDoc.defenceTroop ? playerDoc.troopsOut.length - 1 : playerDoc.troopsOut.length) < playerDoc.basicInfo.marchQueue
}

/**
 * 获取玩家建筑对资源的加成Buff
 * @param playerDoc
 * @param resourceType
 * @returns {number}
 */
Utils.getPlayerResourceBuildingBuff = function(playerDoc, resourceType){
	var buildingName = Consts.ResourceBuildingMap[resourceType]
	var buildings = _.filter(playerDoc.buildings, function(building){
		return _.isEqual(building.type, buildingName)
	})
	var buff = 0
	_.each(buildings, function(building){
		var nextLocation = null;
		if(building.location === 15){
			nextLocation = 14;
		}else{
			nextLocation = building.location + 7
		}
		var nextBuilding = playerDoc.buildings["location_" + nextLocation]
		var houseCount = 0
		var houses = building.houses.concat(nextBuilding.houses)
		_.each(houses, function(house){
			if(_.isEqual(house.type, Consts.ResourceHouseMap[resourceType])) houseCount += 1
		})
		if(houseCount >= 6) buff += 0.1
		else if(houseCount >= 3) buff += 0.05
	})
	return buff
}

/**
 * 创建一个设备
 * @param deviceId
 * @param fromIp
 * @param identity
 * @param playerId
 * @returns {{_id: *, playerId: *}}
 */
Utils.createDevice = function(deviceId, fromIp, identity, playerId){
	var device = {
		_id:deviceId,
		registerData:{
			fromIp:fromIp,
			identity:identity
		},
		playerId:playerId
	}
	return device
}

/**
 * 创建玩家
 * @param playerId
 * @param deviceId
 * @param serverId
 */
Utils.createPlayer = function(playerId, deviceId, serverId){
	var name = ShortId.generate()
	var player = {
		_id:playerId,
		serverId:serverId,
		lastDeviceId:deviceId,
		pushId:null,
		gcId:null,
		allianceId:null,
		basicInfo:{name:"p_" + name},
		helpedByTroop:null,
		defenceTroop:null
	}
	return player
}

/**
 * 时间是否靠近当前时间
 * @param interval
 * @returns {boolean}
 */
Utils.willFinished = function(interval){
	return interval - 2000 <= Date.now()
}

/**
 * 根据建筑类型获取所有相关建筑
 * @param playerDoc
 * @param buildingType
 * @returns {Array}
 */
Utils.getPlayerBuildingByType = function(playerDoc, buildingType){
	return _.find(playerDoc.buildings, function(building){
		return _.isEqual(buildingType, building.type)
	})
}

/**
 * 根据建筑类型获取所有相关建筑
 * @param playerDoc
 * @param buildingType
 * @returns {*}
 */
Utils.getPlayerBuildingsByType = function(playerDoc, buildingType){
	return _.filter(playerDoc.buildings, function(building){
		return _.isEqual(buildingType, building.type)
	})
}

/**
 * 根据小屋类型获取所有相关小屋
 * @param playerDoc
 * @param houseType
 * @returns {Array}
 */
Utils.getPlayerHousesByType = function(playerDoc, houseType){
	var houses = []
	_.each(playerDoc.buildings, function(building){
		_.each(building.houses, function(house){
			if(_.isEqual(houseType, house.type)){
				houses.push(house)
			}
		})
	})

	return houses
}

/**
 * 获取地推联盟Id
 * @param allianceFight
 * @param myAllianceId
 * @returns {*}
 */
Utils.getEnemyAllianceId = function(allianceFight, myAllianceId){
	return _.isEqual(allianceFight.attacker.alliance.id, myAllianceId) ? allianceFight.defencer.alliance.id : allianceFight.attacker.alliance.id;
}

/**
 * 初始化玩家数据
 * @param playerDoc
 * @param playerData
 * @param terrain
 * @param language
 */
Utils.initPlayerData = function(playerDoc, playerData, terrain, language){
	playerDoc.buildings.location_1.level = 1
	playerDoc.buildings.location_3.level = 1
	playerDoc.buildings.location_4.level = 1
	playerDoc.buildings.location_21.level = 1
	playerDoc.buildings.location_22.level = 1
	playerData.push(['buildings', playerDoc.buildings]);
	playerDoc.soldiers.ranger_1 = 100
	playerDoc.soldiers.swordsman_1 = 100
	playerData.push(['soldiers', playerDoc.soldiers]);
	playerDoc.items.push({
		name:'changePlayerName',
		count:1
	})
	playerDoc.items.push({
		name:'moveTheCity',
		count:1
	})
	playerDoc.items.push({
		name:'foodClass_2',
		count:1
	})
	playerDoc.items.push({
		name:'woodClass_2',
		count:1
	})
	playerData.push(['items', playerDoc.items]);
	playerDoc.basicInfo.terrain = terrain
	playerDoc.basicInfo.language = language
	playerData.push(["basicInfo.terrain", playerDoc.basicInfo.terrain])
	playerData.push(["basicInfo.language", playerDoc.basicInfo.language])
	playerDoc.dragonMaterials.ingo_1 = 5;
	playerDoc.dragonMaterials.blueCrystal_1 = 5;
	playerDoc.dragonMaterials.greenCrystal_1 = 5;
	playerDoc.dragonMaterials.redCrystal_1 = 5;
	playerDoc.dragonMaterials.runes_1 = 5;
	playerData.push(["dragonMaterials", playerDoc.dragonMaterials]);
	DataUtils.refreshPlayerPower(playerDoc, playerData);
}

/**
 * 创建玩家在外行军的部队信息
 * @param playerDoc
 * @param playerData
 * @param dragonType
 * @param soldiers
 */
Utils.addPlayerTroopOut = function(playerDoc, playerData, dragonType, soldiers){
	var troopOut = {
		dragonType:dragonType,
		soldiers:soldiers
	}
	playerDoc.troopsOut.push(troopOut);
	playerData.push(['troopsOut.' + playerDoc.troopsOut.indexOf(troopOut), troopOut]);
}

/**
 * 移除玩家外在行军的部队信息
 * @param playerDoc
 * @param playerData
 * @param dragonType
 */
Utils.removePlayerTroopOut = function(playerDoc, playerData, dragonType){
	var troopOut = _.find(playerDoc.troopsOut, function(troopOut){
		return _.isEqual(troopOut.dragonType, dragonType)
	})

	if(_.isObject(troopOut)){
		playerData.push(['troopsOut.' + playerDoc.troopsOut.indexOf(troopOut), null]);
		this.removeItemInArray(playerDoc.troopsOut, troopOut);
	}
}

/**
 * Pve关卡是否解锁
 * @param playerDoc
 * @param stageIndex
 * @param sectionIndex
 * @returns {boolean}
 */
Utils.isPlayerPveSectionUnlocked = function(playerDoc, stageIndex, sectionIndex){
	if(stageIndex == playerDoc.pve.length && sectionIndex == 0) return true;
	return (stageIndex < playerDoc.pve.length && sectionIndex <= playerDoc.pve[stageIndex].sections.length);
}

/**
 * 更新玩家Pve进度数据
 * @param playerDoc
 * @param playerData
 * @param stageIndex
 * @param sectionIndex
 * @param fightStar
 */
Utils.updatePlayerPveData = function(playerDoc, playerData, stageIndex, sectionIndex, fightStar){
	if(fightStar <= 0) return;
	var stage = playerDoc.pve[stageIndex]
	if(!_.isObject(stage)){
		playerDoc.pve[stageIndex] = stage = {sections:[], rewarded:[]};
		stage.sections[sectionIndex] = fightStar;
		playerData.push(['pve.' + stageIndex, stage]);
	}else{
		var previousStar = stage.sections[sectionIndex];
		if(_.isUndefined(previousStar) || previousStar < fightStar){
			stage.sections[sectionIndex] = fightStar;
			playerData.push(['pve.' + stageIndex + '.sections.' + sectionIndex, stage.sections[sectionIndex]])
		}
	}
}

/**
 *
 * @param playerDoc
 * @param sectionName
 * @returns {boolean}
 */
Utils.isPlayerPvESectionReachMaxStar = function(playerDoc, sectionName){
	var sectionParams = sectionName.split('_');
	var stageIndex = parseInt(sectionParams[0]) - 1;
	var sectionIndex = parseInt(sectionParams[1]) - 1;
	return _.isObject(playerDoc.pve[stageIndex]) && playerDoc.pve[stageIndex].sections[sectionIndex] === 3;
}

/**
 * 创建系统聊天消息
 * @param content
 * @returns {*}
 */
Utils.createSysChatMessage = function(content){
	var message = {
		id:"system",
		icon:0,
		name:"System",
		vip:0,
		vipActive:false,
		allianceId:'',
		allianceTag:'',
		serverId:'',
		channel:'global',
		text:content,
		time:Date.now()
	}
	return message;
}

/**
 * 获取当前处在大地图第几圈
 * @param allianceDoc
 * @returns {number}
 */
Utils.getAllianceMapRound = function(allianceDoc){
	return this.getMapRoundByMapIndex(allianceDoc.mapIndex);
}

/**
 * 根据MapIndex获取MapRound
 * @param mapIndex
 * @returns {*}
 */
Utils.getMapRoundByMapIndex = function(mapIndex){
	var bigMapLength = DataUtils.getAllianceIntInit('bigMapLength');
	var roundMax = Math.floor(bigMapLength / 2);
	var locationX = mapIndex % bigMapLength;
	var locationY = Math.floor(mapIndex / bigMapLength);
	var locations = [];
	for(var i = 0; i <= roundMax; i++){
		var location = [];
		var width = bigMapLength - (i * 2);
		var height = bigMapLength - (i * 2);

		var x = i;
		var y = i;
		var from = {x:x, y:y};
		var to = {x:x + width - 1, y:y};
		location.push({from:from, to:to});

		x = i;
		y = height - 1 + i
		if(x !== y){
			from = {x:x, y:y};
			to = {x:x + width - 1, y:y};
			location.push({from:from, to:to});
		}

		if(i !== roundMax){
			x = i;
			y = i + 1;
			from = {x:x, y:y};
			to = {x:x, y:y + height - 2 - 1};
			location.push({from:from, to:to});

			x = width - 1 + i
			y = i + 1;
			if(x !== y){
				from = {x:x, y:y};
				to = {x:x, y:y + height - 2 - 1};
				location.push({from:from, to:to});
			}
		}
		locations.push(location);
	}

	var theRound = null;
	_.some(locations, function(location, round){
		var hasFound = _.some(location, function(location){
			return (location.from.x <= locationX && location.from.y <= locationY && location.to.x >= locationX && location.to.y >= locationY)
		})
		if(hasFound){
			theRound = round;
			return true;
		}
		return false;
	})
	return _.isNull(theRound) ? null : (roundMax - theRound)
}

/**
 * 玩家是否开启了城防大师
 * @param playerDoc
 */
Utils.getPlayerMasterOfDefenderItemEvent = function(playerDoc){
	var eventType = "masterOfDefender"
	return _.find(playerDoc.itemEvents, function(event){
		return _.isEqual(event.type, eventType)
	})
}

/**
 * 获取新手保护罩Buff
 * @param playerDoc
 */
Utils.getPlayerNewbeeProtectItemEvent = function(playerDoc){
	var eventType = "newbeeProtect"
	return _.find(playerDoc.itemEvents, function(event){
		return _.isEqual(event.type, eventType)
	})
}