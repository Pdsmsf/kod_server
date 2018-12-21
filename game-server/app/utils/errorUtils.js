"use strict"

/**
 * Created by modun on 15/3/4.
 */

var util = require('util')
var _ = require("underscore")
var GameDatas = require("../datas/GameDatas")
var Errors = GameDatas.Errors.errors


var CustomError = function(code, message, showCode){
	showCode = _.isBoolean(showCode) ? showCode : true
	Error.call(this)
	Error.captureStackTrace(this, CustomError)
	this.code = code
	this.name = "CustomError"
	this.message = showCode ? "(" + code + ")" + message : message
}
util.inherits(CustomError, Error)

var Utils = module.exports

var CreateError = function(config, params){
	var code = config.code
	var message = config.message
	if(_.isObject(params)) message += ":" + JSON.stringify(params)
	return new CustomError(code, message)
}

/**
 * 创建错误信息
 * @param code
 * @param message
 * @param showCode
 * @returns {CustomError}
 */
Utils.createError = function(code, message, showCode){
	return new CustomError(code, message, showCode)
}

/**
 * 修复错误信息
 * @param e
 */
Utils.getError = function(e){
	return {code:_.isNumber(e.code) ? e.code : 500}
}

/**
 * 设备不存在
 * @param deviceId
 */
Utils.deviceNotExist = function(deviceId){
	var config = Errors.deviceNotExist
	return CreateError(config, {deviceId:deviceId})
}

/**
 * 用户不存在
 * @param userId
 */
Utils.userNotExist = function(userId){
	var config = Errors.userNotExist
	return CreateError(config, {userId:userId})
}

/**
 * 玩家不存在
 * @param playerId
 * @param memberId
 */
Utils.playerNotExist = function(playerId, memberId){
	var config = Errors.playerNotExist
	return CreateError(config, {playerId:playerId, memberId:memberId})
}

/**
 * 对象被锁定
 * @param pair
 */
Utils.objectIsLocked = function(pair){
	var config = Errors.objectIsLocked
	return CreateError(config, pair);
}

/**
 * 是否为对象被锁定的错误
 * @param e
 * @returns {boolean}
 */
Utils.isObjectLockedError = function(e){
	return e.code === Errors.objectIsLocked.code;
}


/**
 * 玩家已经登录
 * @param playerId
 */
Utils.playerAlreadyLogin = function(playerId){
	var config = Errors.playerAlreadyLogin
	return CreateError(config, {playerId:playerId})
}

/**
 * 联盟不存在
 * @param allianceId
 */
Utils.allianceNotExist = function(allianceId){
	var config = Errors.allianceNotExist
	return CreateError(config, {allianceId:allianceId})
}

/**
 * 服务器维护中
 * @returns {CreateError}
 */
Utils.serverUnderMaintain = function(serverId){
	var config = Errors.serverUnderMaintain
	return CreateError(config, {serverId:serverId})
}

/**
 * 建筑不存在
 * @param playerId
 * @param buildingLocation
 */
Utils.buildingNotExist = function(playerId, buildingLocation){
	var config = Errors.buildingNotExist
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 建筑正在升级
 * @param playerId
 * @param buildingLocation
 */
Utils.buildingUpgradingNow = function(playerId, buildingLocation){
	var config = Errors.buildingUpgradingNow
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 建筑坑位不合法
 * @param playerId
 * @param buildingLocation
 */
Utils.buildingLocationNotLegal = function(playerId, buildingLocation){
	var config = Errors.buildingLocationNotLegal
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 建造数量已达建造上限
 * @param playerId
 * @param buildingLocation
 */
Utils.buildingCountReachUpLimit = function(playerId, buildingLocation){
	var config = Errors.buildingCountReachUpLimit
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 建筑已达到最高等级
 * @param playerId
 * @param buildingLocation
 */
Utils.buildingLevelReachUpLimit = function(playerId, buildingLocation){
	var config = Errors.buildingLevelReachUpLimit
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 升级前置条件未满足
 * @param playerId
 * @param buildingLocation
 */
Utils.buildingUpgradePreConditionNotMatch = function(playerId, buildingLocation){
	var config = Errors.buildingUpgradePreConditionNotMatch
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 宝石不足
 * @param playerId
 * @param need
 * @param has
 */
Utils.gemNotEnough = function(playerId, need, has){
	var config = Errors.gemNotEnough
	return CreateError(config, {playerId:playerId, need:need, has:has})
}

/**
 * 只有生产建筑才能转换
 * @param playerId
 * @param buildingLocation
 */
Utils.onlyProductionBuildingCanSwitch = function(playerId, buildingLocation){
	var config = Errors.onlyProductionBuildingCanSwitch
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 小屋数量过多
 * @param playerId
 * @param buildingLocation
 */
Utils.houseTooMuchMore = function(playerId, buildingLocation){
	var config = Errors.houseTooMuchMore
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 主体建筑必须大于等于1级
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 */
Utils.hostBuildingLevelMustBiggerThanOne = function(playerId, buildingLocation, houseLocation){
	var config = Errors.hostBuildingLevelMustBiggerThanOne
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation, houseLocation:houseLocation})
}

/**
 * 小屋类型不存在
 * @param playerId
 * @param houseLocation
 * @param houseType
 */
Utils.houseTypeNotExist = function(playerId, houseLocation, houseType){
	var config = Errors.houseTypeNotExist
	return CreateError(config, {playerId:playerId, houseLocation:houseLocation, houseType:houseType})
}

/**
 * 小屋数量超过限制
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 * @param houseType
 */
Utils.houseCountTooMuchMore = function(playerId, buildingLocation, houseLocation, houseType){
	var config = Errors.houseCountTooMuchMore
	return CreateError(config, {
		playerId:playerId,
		buildingLocation:buildingLocation,
		houseLocation:houseLocation,
		houseType:houseType
	})
}

/**
 * 建筑周围不允许建造小屋
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 * @param houseType
 */
Utils.buildingNotAllowHouseCreate = function(playerId, buildingLocation, houseLocation, houseType){
	var config = Errors.buildingNotAllowHouseCreate
	return CreateError(config, {
		playerId:playerId,
		buildingLocation:buildingLocation,
		houseLocation:houseLocation,
		houseType:houseType
	})
}

/**
 * 小屋坑位不合法
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 * @param houseType
 */
Utils.houseLocationNotLegal = function(playerId, buildingLocation, houseLocation, houseType){
	var config = Errors.houseLocationNotLegal
	return CreateError(config, {
		playerId:playerId,
		buildingLocation:buildingLocation,
		houseLocation:houseLocation,
		houseType:houseType
	})
}

/**
 * 建造小屋会造成可用城民小于0
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 */
Utils.noEnoughCitizenToCreateHouse = function(playerId, buildingLocation, houseLocation){
	var config = Errors.noEnoughCitizenToCreateHouse
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation, houseLocation:houseLocation})
}

/**
 * 小屋升级前置条件未满足
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 * @param houseType
 */
Utils.houseUpgradePrefixNotMatch = function(playerId, buildingLocation, houseLocation, houseType){
	var config = Errors.houseUpgradePrefixNotMatch
	return CreateError(config, {
		playerId:playerId,
		buildingLocation:buildingLocation,
		houseLocation:houseLocation,
		houseType:houseType
	})
}

/**
 * 小屋不存在
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 */
Utils.houseNotExist = function(playerId, buildingLocation, houseLocation){
	var config = Errors.houseNotExist
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation, houseLocation:houseLocation})
}

/**
 * 小屋正在升级
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 */
Utils.houseUpgradingNow = function(playerId, buildingLocation, houseLocation){
	var config = Errors.houseUpgradingNow
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation, houseLocation:houseLocation})
}

/**
 * 小屋达到最高等级
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 */
Utils.houseReachMaxLevel = function(playerId, buildingLocation, houseLocation){
	var config = Errors.houseReachMaxLevel
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation, houseLoation:houseLocation})
}

/**
 * 升级小屋会造成可用城民小于0
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 */
Utils.noEnoughCitizenToUpgradeHouse = function(playerId, buildingLocation, houseLocation){
	var config = Errors.noEnoughCitizenToUpgradeHouse
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation, houseLocation:houseLocation})
}

/**
 * 玩家事件不存在
 * @param playerId
 * @param eventType
 * @param eventId
 */
Utils.playerEventNotExist = function(playerId, eventType, eventId){
	var config = Errors.playerEventNotExist
	return CreateError(config, {playerId:playerId, eventType:eventType, eventId:eventId})
}

/**
 * 还不能进行免费加速
 * @param playerId
 * @param eventType
 * @param eventId
 */
Utils.canNotFreeSpeedupNow = function(playerId, eventType, eventId){
	var config = Errors.canNotFreeSpeedupNow
	return CreateError(config, {playerId:playerId, eventType:eventType, eventId:eventId})
}

/**
 * 不需要宝石加速
 * @param playerId
 * @param eventType
 * @param eventId
 */
Utils.doNotNeedGemSpeedup = function(playerId, eventType, eventId){
	var config = Errors.doNotNeedGemSpeedup;
	return CreateError(config, {playerId:playerId, eventType:eventType, eventId:eventId})
}

/**
 * 建筑还未建造
 * @param playerId
 * @param buildingLocation
 */
Utils.buildingNotBuild = function(playerId, buildingLocation){
	var config = Errors.buildingNotBuild
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation})
}

/**
 * 同类型的材料正在制造
 * @param playerId
 * @param type
 */
Utils.materialAsSameTypeIsMakeNow = function(playerId, type){
	var config = Errors.materialAsSameTypeIsMakeNow
	return CreateError(config, {playerId:playerId, type:type})
}

/**
 * 同类型的材料制作完成后还未领取
 * @param playerId
 * @param type
 */
Utils.materialMakeFinishedButNotTakeAway = function(playerId, type){
	var config = Errors.materialMakeFinishedButNotTakeAway
	return CreateError(config, {playerId:playerId, type:type})
}

/**
 * 不同类型的材料正在制造
 * @param playerId
 * @param type
 */
Utils.materialAsDifferentTypeIsMakeNow = function(playerId, type){
	var config = Errors.materialAsDifferentTypeIsMakeNow
	return CreateError(config, {playerId:playerId, type:type})
}

/**
 * 材料事件不存在或者正在制作
 * @param playerId
 * @param eventId
 */
Utils.materialEventNotExistOrIsMakeing = function(playerId, eventId){
	var config = Errors.materialEventNotExistOrIsMakeing
	return CreateError(config, {playerId:playerId, eventId:eventId})
}

/**
 * 此士兵还处于锁定状态
 * @param playerId
 * @param soldierName
 */
Utils.theSoldierIsLocked = function(playerId, soldierName){
	var config = Errors.theSoldierIsLocked
	return CreateError(config, {playerId:playerId, soldierName:soldierName})
}

/**
 * 招募数量超过单次招募上限
 * @param playerId
 * @param soldierName
 * @param count
 */
Utils.recruitTooMuchOnce = function(playerId, soldierName, count){
	var config = Errors.recruitTooMuchOnce
	return CreateError(config, {playerId:playerId, soldierName:soldierName, count:count})
}

/**
 * 士兵招募材料不足
 * @param playerId
 * @param soldierName
 * @param count
 */
Utils.soldierRecruitMaterialsNotEnough = function(playerId, soldierName, count){
	var config = Errors.soldierRecruitMaterialsNotEnough
	return CreateError(config, {playerId:playerId, soldierName:soldierName, count:count})
}

/**
 * 制作龙装备材料不足
 * @param playerId
 * @param equipmentName
 */
Utils.dragonEquipmentMaterialsNotEnough = function(playerId, equipmentName){
	var config = Errors.dragonEquipmentMaterialsNotEnough
	return CreateError(config, {playerId:playerId, equipmentName:equipmentName})
}

/**
 * 士兵不存在或士兵数量不合法
 * @param playerId
 * @param soldiers
 */
Utils.soldierNotExistOrCountNotLegal = function(playerId, soldiers){
	var config = Errors.soldierNotExistOrCountNotLegal
	return CreateError(config, {playerId:playerId, soldiers:soldiers})
}

/**
 * 龙蛋早已成功孵化
 * @param playerId
 * @param dragonType
 */
Utils.dragonEggAlreadyHatched = function(playerId, dragonType){
	var config = Errors.dragonEggAlreadyHatched
	return CreateError(config, {playerId:playerId, dragonType:dragonType})
}

/**
 * 龙蛋孵化事件已存在
 * @param playerId
 * @param dragonType
 */
Utils.dragonEggHatchEventExist = function(playerId, dragonType){
	var config = Errors.dragonEggHatchEventExist
	return CreateError(config, {playerId:playerId, dragonType:dragonType})
}

/**
 * 龙还未孵化
 * @param playerId
 * @param dragonType
 */
Utils.dragonNotHatched = function(playerId, dragonType){
	var config = Errors.dragonNotHatched
	return CreateError(config, {playerId:playerId, dragonType:dragonType})
}

/**
 * 装备与龙的星级不匹配
 * @param playerId
 * @param dragonType
 * @param equipmentCategory
 * @param equipmentName
 */
Utils.dragonEquipmentNotMatchForTheDragon = function(playerId, dragonType, equipmentCategory, equipmentName){
	var config = Errors.dragonEquipmentNotMatchForTheDragon
	return CreateError(config, {
		playerId:playerId,
		dragonType:dragonType,
		equipmentCategory:equipmentCategory,
		equipmentName:equipmentName
	})
}

/**
 * 龙装备数量不足
 * @param playerId
 * @param dragonType
 * @param equipmentCategory
 * @param equipmentName
 */
Utils.dragonEquipmentNotEnough = function(playerId, dragonType, equipmentCategory, equipmentName){
	var config = Errors.dragonEquipmentNotEnough
	return CreateError(config, {
		playerId:playerId,
		dragonType:dragonType,
		equipmentCategory:equipmentCategory,
		equipmentName:equipmentName
	})
}

/**
 * 龙身上已经存在相同类型的装备
 * @param playerId
 * @param dragonType
 * @param equipmentCategory
 * @param equipmentName
 */
Utils.dragonAlreadyHasTheSameCategory = function(playerId, dragonType, equipmentCategory, equipmentName){
	var config = Errors.dragonAlreadyHasTheSameCategory
	return CreateError(config, {
		playerId:playerId,
		dragonType:dragonType,
		equipmentCategory:equipmentCategory,
		equipmentName:equipmentName
	})
}

/**
 * 此分类还没有配置装备
 * @param playerId
 * @param dragonType
 * @param equipmentCategory
 */
Utils.dragonDoNotHasThisEquipment = function(playerId, dragonType, equipmentCategory){
	var config = Errors.dragonDoNotHasThisEquipment
	return CreateError(config, {playerId:playerId, dragonType:dragonType, equipmentCategory:equipmentCategory})
}

/**
 * 装备已到最高星级
 * @param playerId
 * @param dragonType
 * @param equipmentCategory
 */
Utils.dragonEquipmentReachMaxStar = function(playerId, dragonType, equipmentCategory){
	var config = Errors.dragonEquipmentReachMaxStar
	return CreateError(config, {playerId:playerId, dragonType:dragonType, equipmentCategory:equipmentCategory})
}

/**
 * 被牺牲的装备不存在或数量不足
 * @param playerId
 * @param equipments
 */
Utils.dragonEquipmentsNotExistOrNotEnough = function(playerId, equipments){
	var config = Errors.dragonEquipmentsNotExistOrNotEnough
	return CreateError(config, {playerId:playerId, equipments:equipments})
}

/**
 * 龙技能不存在
 * @param playerId
 * @param dragonType
 * @param skillKey
 */
Utils.dragonSkillNotExist = function(playerId, dragonType, skillKey){
	var config = Errors.dragonSkillNotExist
	return CreateError(config, {playerId:playerId, dragonType:dragonType, skillKey:skillKey})
}

/**
 * 此龙技能还未解锁
 * @param playerId
 * @param dragonType
 * @param skillKey
 */
Utils.dragonSkillIsLocked = function(playerId, dragonType, skillKey){
	var config = Errors.dragonSkillIsLocked
	return CreateError(config, {playerId:playerId, dragonType:dragonType, skillKey:skillKey})
}

/**
 * 龙技能已达最高等级
 * @param playerId
 * @param dragonType
 * @param skillKey
 */
Utils.dragonSkillReachMaxLevel = function(playerId, dragonType, skillKey){
	var config = Errors.dragonSkillReachMaxLevel
	return CreateError(config, {playerId:playerId, dragonType:dragonType, skillKey:skillKey})
}

/**
 * 英雄之血不足
 * @param playerId
 * @param bloodNeed
 * @param bloodHas
 */
Utils.heroBloodNotEnough = function(playerId, bloodNeed, bloodHas){
	var config = Errors.heroBloodNotEnough
	return CreateError(config, {playerId:playerId, bloodNeed:bloodNeed, bloodHas:bloodHas})
}

/**
 * 龙的星级已达最高
 * @param playerId
 * @param dragonType
 * @param currentStar
 */
Utils.dragonReachMaxStar = function(playerId, dragonType, currentStar){
	var config = Errors.dragonReachMaxStar
	return CreateError(config, {playerId:playerId, dragonType:dragonType, currentStar:currentStar})
}

/**
 * 龙的等级未达到晋级要求
 * @param playerId
 * @param dragonType
 */
Utils.dragonUpgradeStarFailedForLevelNotLegal = function(playerId, dragonType){
	var config = Errors.dragonUpgradeStarFailedForLevelNotLegal
	return CreateError(config, {playerId:playerId, dragonType:dragonType})
}

/**
 * 龙的装备未达到晋级要求
 * @param playerId
 * @param dragonType
 */
Utils.dragonUpgradeStarFailedForEquipmentNotLegal = function(playerId, dragonType){
	var config = Errors.dragonUpgradeStarFailedForEquipmentNotLegal
	return CreateError(config, {playerId:playerId, dragonType:dragonType})
}

/**
 * 每日任务不存在
 * @param playerId
 * @param questId
 */
Utils.dailyQuestNotExist = function(playerId, questId){
	var config = Errors.dailyQuestNotExist
	return CreateError(config, {playerId:playerId, questId:questId})
}

/**
 * 每日任务已达最高星级
 * @param playerId
 * @param quest
 */
Utils.dailyQuestReachMaxStar = function(playerId, quest){
	var config = Errors.dailyQuestReachMaxStar
	return CreateError(config, {playerId:playerId, quest:quest})
}

/**
 * 每日任务事件已存在
 * @param playerId
 * @param events
 */
Utils.dailyQuestEventExist = function(playerId, events){
	var config = Errors.dailyQuestEventExist
	return CreateError(config, {playerId:playerId, events:events})
}

/**
 * 每日任务事件不存在
 * @param playerId
 * @param eventId
 * @param events
 */
Utils.dailyQuestEventNotExist = function(playerId, eventId, events){
	var config = Errors.dailyQuestEventNotExist
	return CreateError(config, {playerId:playerId, eventId:eventId, events:events})
}

/**
 * 每日任务事件还未完成
 * @param playerId
 * @param event
 */
Utils.dailyQuestEventNotFinished = function(playerId, event){
	var config = Errors.dailyQuestEventNotFinished
	return CreateError(config, {playerId:playerId, event:event})
}

/**
 * 邮件不存在
 * @param playerId
 * @param mailId
 */
Utils.mailNotExist = function(playerId, mailId){
	var config = Errors.mailNotExist
	return CreateError(config, {playerId:playerId, mailId:mailId})
}

/**
 * 战报不存在
 * @param playerId
 * @param reportId
 */
Utils.reportNotExist = function(playerId, reportId){
	var config = Errors.reportNotExist
	return CreateError(config, {playerId:playerId, reportId:reportId})
}

/**
 * 龙未处于空闲状态
 * @param playerId
 * @param dragonType
 */
Utils.dragonIsNotFree = function(playerId, dragonType){
	var config = Errors.dragonIsNotFree
	return CreateError(config, {playerId:playerId, dragonType:dragonType})
}

/**
 * 所选择的龙已经阵亡
 * @param playerId
 * @param dragonType
 */
Utils.dragonSelectedIsDead = function(playerId, dragonType){
	var config = Errors.dragonSelectedIsDead
	return CreateError(config, {playerId:playerId, dragonType:dragonType})
}

/**
 * 没有龙驻防在城墙
 * @param playerId
 */
Utils.noDragonInDefenceStatus = function(playerId){
	var config = Errors.noDragonInDefenceStatus
	return CreateError(config, {playerId:playerId})
}

/**
 * 没有足够的出售队列
 * @param playerId
 */
Utils.sellQueueNotEnough = function(playerId){
	var config = Errors.sellQueueNotEnough
	return CreateError(config, {playerId:playerId})
}

/**
 * 玩家资源不足
 * @param playerId
 * @param resourceType
 * @param resourceName
 * @param resourceHas
 * @param resourceNeed
 */
Utils.resourceNotEnough = function(playerId, resourceType, resourceName, resourceHas, resourceNeed){
	var config = Errors.resourceNotEnough
	return CreateError(config, {
		playerId:playerId,
		resourceType:resourceType,
		resourceName:resourceName,
		resourceHas:resourceHas,
		resourceNeed:resourceNeed
	})
}

/**
 * 马车数量不足
 * @param playerId
 * @param cartHas
 * @param cartNeed
 */
Utils.cartNotEnough = function(playerId, cartHas, cartNeed){
	var config = Errors.cartNotEnough
	return CreateError(config, {playerId:playerId, cartHas:cartHas, cartNeed:cartNeed})
}

/**
 * 商品不存在
 * @param playerId
 * @param itemId
 */
Utils.sellItemNotExist = function(playerId, itemId){
	var config = Errors.sellItemNotExist
	return CreateError(config, {playerId:playerId, itemId:itemId})
}

/**
 * 商品还未卖出
 * @param playerId
 * @param item
 */
Utils.sellItemNotSold = function(playerId, item){
	var config = Errors.sellItemNotSold
	return CreateError(config, {playerId:playerId, item:item})
}

/**
 * 您未出售此商品
 * @param playerId
 * @param itemDoc
 */
Utils.sellItemNotBelongsToYou = function(playerId, itemDoc){
	var config = Errors.sellItemNotBelongsToYou
	return CreateError(config, {playerId:playerId, itemDoc:itemDoc})
}

/**
 * 商品已经售出
 * @param playerId
 * @param item
 */
Utils.sellItemAlreadySold = function(playerId, item){
	var config = Errors.sellItemAlreadySold
	return CreateError(config, {playerId:playerId, item:item})
}

/**
 * 不能购买自己出售的商品
 * @param playerId
 * @param item
 */
Utils.canNotBuyYourOwnSellItem = function(playerId, item){
	var config = Errors.canNotBuyYourOwnSellItem;
	return CreateError(config, {playerId:playerId, item:item})
}

/**
 * 科技已达最高等级
 * @param playerId
 * @param techName
 * @param tech
 */
Utils.techReachMaxLevel = function(playerId, techName, tech){
	var config = Errors.techReachMaxLevel
	return CreateError(config, {playerId:playerId, techName:techName, tech:tech})
}

/**
 * 前置科技条件不满足
 * @param playerId
 * @param techName
 * @param tech
 */
Utils.techUpgradePreConditionNotMatch = function(playerId, techName, tech){
	var config = Errors.techUpgradePreConditionNotMatch
	return CreateError(config, {playerId:playerId, techName:techName, tech:tech})
}

/**
 * 所选择的科技正在升级
 * @param playerId
 * @param techName
 * @param tech
 */
Utils.techIsUpgradingNow = function(playerId, techName, tech){
	var config = Errors.techIsUpgradingNow
	return CreateError(config, {playerId:playerId, techName:techName, tech:tech})
}

/**
 * 士兵已达最高星级
 * @param playerId
 * @param soldierName
 */
Utils.soldierReachMaxStar = function(playerId, soldierName){
	var config = Errors.soldierReachMaxStar
	return CreateError(config, {playerId:playerId, soldierName:soldierName})
}

/**
 * 科技点不足
 * @param playerId
 * @param soldierName
 */
Utils.techPointNotEnough = function(playerId, soldierName){
	var config = Errors.techPointNotEnough
	return CreateError(config, {playerId:playerId, soldierName:soldierName})
}

/**
 * 士兵正在升级
 * @param playerId
 * @param soldierName
 */
Utils.soldierIsUpgradingNow = function(playerId, soldierName){
	var config = Errors.soldierIsUpgradingNow
	return CreateError(config, {playerId:playerId, soldierName:soldierName})
}

/**
 * 此道具未出售
 * @param playerId
 * @param itemName
 */
Utils.itemNotSell = function(playerId, itemName){
	var config = Errors.itemNotSell
	return CreateError(config, {playerId:playerId, itemName:itemName})
}

/**
 * 道具不存在
 * @param playerId
 * @param itemName
 */
Utils.itemNotExist = function(playerId, itemName){
	var config = Errors.itemNotExist
	return CreateError(config, {playerId:playerId, itemName:itemName})
}

/**
 * 小屋当前不能被移动
 * @param playerId
 * @param buildingLocation
 * @param houseLocation
 */
Utils.houseCanNotBeMovedNow = function(playerId, buildingLocation, houseLocation){
	var config = Errors.houseCanNotBeMovedNow
	return CreateError(config, {playerId:playerId, buildingLocation:buildingLocation, houseLocation:houseLocation})
}

/**
 * 不能修改为相同的玩家名称
 * @param playerId
 * @param playerName
 */
Utils.playerNameCanNotBeTheSame = function(playerId, playerName){
	var config = Errors.playerNameCanNotBeTheSame
	return CreateError(config, {playerId:playerId, playerName:playerName})
}

/**
 * 玩家名称已被其他玩家占用
 * @param playerId
 * @param playerName
 */
Utils.playerNameAlreadyUsed = function(playerId, playerName){
	var config = Errors.playerNameAlreadyUsed
	return CreateError(config, {playerId:playerId, playerName:playerName})
}

/**
 * 玩家未加入联盟
 * @param playerId
 */
Utils.playerNotJoinAlliance = function(playerId){
	var config = Errors.playerNotJoinAlliance
	return CreateError(config, {playerId:playerId})
}

/**
 * 行军事件不存在
 * @param playerId
 * @param allianceId
 * @param eventType
 * @param eventId
 */
Utils.marchEventNotExist = function(playerId, allianceId, eventType, eventId){
	var config = Errors.marchEventNotExist
	return CreateError(config, {playerId:playerId, allianceId:allianceId, eventType:eventType, eventId:eventId})
}

/**
 * 联盟正处于战争期
 * @param playerId
 * @param allianceId
 */
Utils.allianceInFightStatus = function(playerId, allianceId){
	var config = Errors.allianceInFightStatus
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 玩家有部队正在行军中
 * @param playerId
 * @param allianceId
 */
Utils.playerHasMarchEvent = function(playerId, allianceId){
	var config = Errors.playerHasMarchEvent
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 不能移动到目标点位
 * @param playerId
 * @param allianceId
 * @param fromLocation
 * @param toLocation
 */
Utils.canNotMoveToTargetPlace = function(playerId, allianceId, fromLocation, toLocation){
	var config = Errors.canNotMoveToTargetPlace
	return CreateError(config, {
		playerId:playerId,
		allianceId:allianceId,
		fromLocation:fromLocation,
		toLocation:toLocation
	})
}

/**
 * 此道具不允许直接使用
 * @param playerId
 * @param itemName
 */
Utils.itemCanNotBeUsedDirectly = function(playerId, itemName){
	var config = Errors.itemCanNotBeUsedDirectly
	return CreateError(config, {playerId:playerId, itemName:itemName})
}

/**
 * 赌币不足
 * @param playerId
 * @param has
 * @param need
 */
Utils.casinoTokenNotEnough = function(playerId, has, need){
	var config = Errors.casinoTokenNotEnough
	return CreateError(config, {playerId:playerId, has:has, need:need})
}

/**
 * 今日登陆奖励已领取
 * @param playerId
 */
Utils.loginRewardAlreadyGet = function(playerId){
	var config = Errors.loginRewardAlreadyGet
	return CreateError(config, {playerId:playerId})
}

/**
 * 在线时间不足,不能领取
 * @param playerId
 */
Utils.onlineTimeNotEough = function(playerId){
	var config = Errors.onlineTimeNotEough
	return CreateError(config, {playerId:playerId})
}

/**
 * 此时间节点的在线奖励已经领取
 * @param playerId
 */
Utils.onlineTimeRewardAlreadyGet = function(playerId){
	var config = Errors.onlineTimeRewardAlreadyGet
	return CreateError(config, {playerId:playerId})
}

/**
 * 今日王城援军奖励已领取
 * @param playerId
 */
Utils.wonderAssistanceRewardAlreadyGet = function(playerId){
	var config = Errors.wonderAssistanceRewardAlreadyGet
	return CreateError(config, {playerId:playerId})
}

/**
 * 冲级奖励时间已过
 * @param playerId
 */
Utils.levelUpRewardExpired = function(playerId){
	var config = Errors.levelUpRewardExpired
	return CreateError(config, {playerId:playerId})
}

/**
 * 当前等级的冲级奖励已经领取
 * @param playerId
 */
Utils.levelUpRewardAlreadyGet = function(playerId){
	var config = Errors.levelUpRewardAlreadyGet
	return CreateError(config, {playerId:playerId})
}

/**
 * 玩家城堡等级不足以领取当前冲级奖励
 * @param playerId
 */
Utils.levelUpRewardCanNotBeGetForCastleLevelNotMatch = function(playerId){
	var config = Errors.levelUpRewardCanNotBeGetForCastleLevelNotMatch
	return CreateError(config, {playerId:playerId})
}

/**
 * 玩家还未进行首次充值
 * @param playerId
 */
Utils.firstIAPNotHappen = function(playerId){
	var config = Errors.firstIAPNotHappen
	return CreateError(config, {playerId:playerId})
}

/**
 * 首次充值奖励已经领取
 * @param playerId
 */
Utils.firstIAPRewardAlreadyGet = function(playerId){
	var config = Errors.firstIAPRewardAlreadyGet
	return CreateError(config, {playerId:playerId})
}

/**
 * 日常任务奖励已经领取
 * @param playerId
 */
Utils.dailyTaskRewardAlreadyGet = function(playerId){
	var config = Errors.dailyTaskRewardAlreadyGet
	return CreateError(config, {playerId:playerId})
}

/**
 * 日常任务还未完成
 * @param playerId
 */
Utils.dailyTaskNotFinished = function(playerId){
	var config = Errors.dailyTaskNotFinished
	return CreateError(config, {playerId:playerId})
}

/**
 * 成长任务不存在
 * @param playerId
 * @param taskType
 * @param taskId
 */
Utils.growUpTaskNotExist = function(playerId, taskType, taskId){
	var config = Errors.growUpTaskNotExist
	return CreateError(config, {playerId:playerId, taskType:taskType, taskId:taskId})
}

/**
 * 成长任务奖励已经领取
 * @param playerId
 * @param taskType
 * @param taskId
 */
Utils.growUpTaskRewardAlreadyGet = function(playerId, taskType, taskId){
	var config = Errors.growUpTaskRewardAlreadyGet
	return CreateError(config, {playerId:playerId, taskType:taskType, taskId:taskId})
}

/**
 * 前置任务奖励未领取
 * @param playerId
 * @param taskType
 * @param taskId
 */
Utils.growUpTaskRewardCanNotBeGetForPreTaskRewardNotGet = function(playerId, taskType, taskId){
	var config = Errors.growUpTaskRewardCanNotBeGetForPreTaskRewardNotGet
	return CreateError(config, {playerId:playerId, taskType:taskType, taskId:taskId})
}

/**
 * 重复的订单号
 * @param playerId
 * @param transactionId
 */
Utils.duplicateIAPTransactionId = function(playerId, transactionId){
	var config = Errors.duplicateIAPTransactionId
	return CreateError(config, {playerId:playerId, transactionId:transactionId})
}

/**
 * 订单商品不存在
 * @param playerId
 * @param productId
 */
Utils.iapProductNotExist = function(playerId, productId){
	var config = Errors.iapProductNotExist
	return CreateError(config, {playerId:playerId, productId:productId})
}

/**
 * 订单验证失败
 * @param playerId
 * @param errorData
 */
Utils.iapValidateFaild = function(playerId, errorData){
	var config = Errors.iapValidateFaild
	return CreateError(config, {playerId:playerId, errorData:errorData})
}

/**
 * IAP服务器通讯出错
 * @param playerId
 * @param errorData
 */
Utils.netErrorWithIapServer = function(playerId, errorData){
	var config = Errors.netErrorWithIapServer
	return CreateError(config, {playerId:playerId, errorData:errorData})
}

/**
 * 玩家已加入了联盟
 * @param playerId
 * @param memberId
 */
Utils.playerAlreadyJoinAlliance = function(playerId, memberId){
	var config = Errors.playerAlreadyJoinAlliance
	return CreateError(config, {playerId:playerId, memberId:memberId})
}

/**
 * 联盟名称已经存在
 * @param playerId
 * @param allianceName
 */
Utils.allianceNameExist = function(playerId, allianceName){
	var config = Errors.allianceNameExist
	return CreateError(config, {playerId:playerId, allianceName:allianceName})
}

/**
 * 联盟标签已经存在
 * @param playerId
 * @param allianceTag
 */
Utils.allianceTagExist = function(playerId, allianceTag){
	var config = Errors.allianceTagExist
	return CreateError(config, {playerId:playerId, allianceTag:allianceTag})
}

/**
 * 联盟操作权限不足
 * @param playerId
 * @param allianceId
 * @param operation
 */
Utils.allianceOperationRightsIllegal = function(playerId, allianceId, operation){
	var config = Errors.allianceOperationRightsIllegal
	return CreateError(config, {playerId:playerId, allianceId:allianceId, operation:operation})
}

/**
 * 联盟荣耀值不足
 * @param playerId
 * @param allianceId
 */
Utils.allianceHonourNotEnough = function(playerId, allianceId){
	var config = Errors.allianceHonourNotEnough
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 联盟没有此玩家
 * @param playerId
 * @param allianceId
 * @param memberId
 */
Utils.allianceDoNotHasThisMember = function(playerId, allianceId, memberId){
	var config = Errors.allianceDoNotHasThisMember
	return CreateError(config, {playerId:playerId, allianceId:allianceId, memberId:memberId})
}

/**
 * 联盟正在战争准备期或战争期,不能将玩家踢出联盟
 * @param playerId
 * @param allianceId
 * @param memberId
 */
Utils.allianceInFightStatusCanNotKickMemberOff = function(playerId, allianceId, memberId){
	var config = Errors.allianceInFightStatusCanNotKickMemberOff
	return CreateError(config, {playerId:playerId, allianceId:allianceId, memberId:memberId})
}

/**
 * 不能将职级高于或等于自己的玩家踢出联盟
 * @param playerId
 * @param allianceId
 * @param memberId
 */
Utils.canNotKickAllianceMemberOffForTitleIsUpperThanMe = function(playerId, allianceId, memberId){
	var config = Errors.canNotKickAllianceMemberOffForTitleIsUpperThanMe
	return CreateError(config, {playerId:playerId, allianceId:allianceId, memberId:memberId})
}

/**
 * 别逗了,你是不盟主好么
 * @param playerId
 * @param allianceId
 */
Utils.youAreNotTheAllianceArchon = function(playerId, allianceId){
	var config = Errors.youAreNotTheAllianceArchon
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 别逗了,仅当联盟成员为空时,盟主才能退出联盟
 * @param playerId
 * @param allianceId
 */
Utils.allianceArchonCanNotQuitAlliance = function(playerId, allianceId){
	var config = Errors.allianceArchonCanNotQuitAlliance
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 联盟正在战争准备期或战争期,不能退出联盟
 * @param playerId
 * @param allianceId
 */
Utils.allianceInFightStatusCanNotQuitAlliance = function(playerId, allianceId){
	var config = Errors.allianceInFightStatusCanNotQuitAlliance
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 联盟不允许直接加入
 * @param playerId
 * @param allianceId
 */
Utils.allianceDoNotAllowJoinDirectly = function(playerId, allianceId){
	var config = Errors.allianceDoNotAllowJoinDirectly
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 联盟申请已满,请撤消部分申请后再来申请
 * @param playerId
 */
Utils.joinAllianceRequestIsFull = function(playerId){
	var config = Errors.joinAllianceRequestIsFull
	return CreateError(config, {playerId:playerId})
}

/**
 * 对此联盟的申请已发出,请耐心等候审核
 * @param playerId
 * @param allianceId
 */
Utils.joinTheAllianceRequestAlreadySend = function(playerId, allianceId){
	var config = Errors.joinTheAllianceRequestAlreadySend
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 此联盟的申请信息已满,请等候其处理后再进行申请
 * @param playerId
 * @param allianceId
 */
Utils.allianceJoinRequestMessagesIsFull = function(playerId, allianceId){
	var config = Errors.allianceJoinRequestMessagesIsFull
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 联盟申请事件不存在
 * @param playerId
 * @param allianceId
 */
Utils.joinAllianceRequestNotExist = function(playerId, allianceId){
	var config = Errors.joinAllianceRequestNotExist
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 玩家已经取消对此联盟的申请
 * @param playerId
 * @param allianceId
 */
Utils.playerCancelTheJoinRequestToTheAlliance = function(playerId, allianceId){
	var config = Errors.playerCancelTheJoinRequestToTheAlliance
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 此玩家的邀请信息已满,请等候其处理后再进行邀请
 * @param playerId
 * @param allianceId
 * @param memberId
 */
Utils.inviteRequestMessageIsFullForThisPlayer = function(playerId, allianceId, memberId){
	var config = Errors.inviteRequestMessageIsFullForThisPlayer
	return CreateError(config, {playerId:playerId, allianceId:allianceId, memberId:memberId})
}

/**
 * 联盟邀请事件不存在
 * @param playerId
 * @param allianceId
 */
Utils.allianceInviteEventNotExist = function(playerId, allianceId){
	var config = Errors.allianceInviteEventNotExist
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 玩家已经是盟主了
 * @param playerId
 * @param allianceId
 */
Utils.playerAlreadyTheAllianceArchon = function(playerId, allianceId){
	var config = Errors.playerAlreadyTheAllianceArchon
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 盟主连续7天不登陆时才能购买盟主职位
 * @param playerId
 * @param allianceId
 */
Utils.onlyAllianceArchonMoreThanSevenDaysNotOnLinePlayerCanBuyArchonTitle = function(playerId, allianceId){
	var config = Errors.onlyAllianceArchonMoreThanSevenDaysNotOnLinePlayerCanBuyArchonTitle
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 此事件已经发送了加速请求
 * @param playerId
 * @param allianceId
 * @param eventType
 * @param eventId
 */
Utils.speedupRequestAlreadySendForThisEvent = function(playerId, allianceId, eventType, eventId){
	var config = Errors.speedupRequestAlreadySendForThisEvent
	return CreateError(config, {playerId:playerId, allianceId:allianceId, eventType:eventType, eventId:eventId})
}

/**
 * 帮助事件不存在
 * @param playerId
 * @param eventId
 */
Utils.allianceHelpEventNotExist = function(playerId, eventId){
	var config = Errors.allianceHelpEventNotExist
	return CreateError(config, {playerId:playerId, eventId:eventId})
}

/**
 * 不能帮助自己加速建造
 * @param playerId
 * @param eventId
 */
Utils.canNotHelpSelfSpeedup = function(playerId, eventId){
	var config = Errors.canNotHelpSelfSpeedup
	return CreateError(config, {playerId:playerId, eventId:eventId})
}

/**
 * 您已经帮助过此事件了
 * @param playerId
 * @param eventId
 */
Utils.youAlreadyHelpedTheEvent = function(playerId, eventId){
	var config = Errors.youAlreadyHelpedTheEvent
	return CreateError(config, {playerId:playerId, eventId:eventId})
}

/**
 * 联盟建筑已达到最高等级
 * @param playerId
 * @param allianceId
 * @param buildingName
 */
Utils.allianceBuildingReachMaxLevel = function(playerId, allianceId, buildingName){
	var config = Errors.allianceBuildingReachMaxLevel
	return CreateError(config, {playerId:playerId, allianceId:allianceId, buildingName:buildingName})
}

/**
 * 此联盟事件已经激活
 * @param playerId
 * @param allianceId
 * @param stageName
 */
Utils.theAllianceShrineEventAlreadyActived = function(playerId, allianceId, stageName){
	var config = Errors.theAllianceShrineEventAlreadyActived
	return CreateError(config, {playerId:playerId, allianceId:allianceId, stageName:stageName})
}

/**
 * 联盟感知力不足
 * @param playerId
 * @param allianceId
 * @param stageName
 */
Utils.alliancePerceptionNotEnough = function(playerId, allianceId, stageName){
	var config = Errors.alliancePerceptionNotEnough
	return CreateError(config, {playerId:playerId, allianceId:allianceId, stageName:stageName})
}

/**
 * 所选择的龙领导力不足
 * @param playerId
 * @param dragonType
 */
Utils.dragonLeaderShipNotEnough = function(playerId, dragonType){
	var config = Errors.dragonLeaderShipNotEnough
	return CreateError(config, {playerId:playerId, dragonType:dragonType})
}

/**
 * 没有空闲的行军队列
 * @param playerId
 */
Utils.noFreeMarchQueue = function(playerId){
	var config = Errors.noFreeMarchQueue
	return CreateError(config, {playerId:playerId})
}

/**
 * 此关卡还未激活
 * @param playerId
 * @param allianceId
 * @param stageEventId
 */
Utils.shrineStageEventNotFound = function(playerId, allianceId, stageEventId){
	var config = Errors.shrineStageEventNotFound
	return CreateError(config, {playerId:playerId, allianceId:allianceId, stageEventId:stageEventId})
}

/**
 * 此联盟圣地关卡还未解锁
 * @param playerId
 * @param allianceId
 * @param stageName
 */
Utils.theShrineStageIsLocked = function(playerId, allianceId, stageName){
	var config = Errors.theShrineStageIsLocked
	return CreateError(config, {playerId:playerId, allianceId:allianceId, stageName:stageName})
}

/**
 * 玩家已经对此关卡派出了部队
 * @param playerId
 * @param allianceId
 * @param stageName
 */
Utils.youHadSendTroopToTheShrineStage = function(playerId, allianceId, stageName){
	var config = Errors.youHadSendTroopToTheShrineStage
	return CreateError(config, {playerId:playerId, allianceId:allianceId, stageName:stageName})
}

/**
 * 联盟正处于战争准备期或战争期
 * @param playerId
 * @param allianceId
 */
Utils.allianceInFightStatus = function(playerId, allianceId){
	var config = Errors.allianceInFightStatus
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 已经发送过开战请求
 * @param playerId
 * @param allianceId
 */
Utils.alreadySendAllianceFightRequest = function(playerId, allianceId){
	var config = Errors.alreadySendAllianceFightRequest
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 未能找到战力相匹配的联盟
 * @param playerId
 * @param allianceId
 */
Utils.canNotFindAllianceToFight = function(playerId, allianceId){
	var config = Errors.canNotFindAllianceToFight
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 联盟战报不存在
 * @param playerId
 * @param allianceId
 * @param reportId
 */
Utils.allianceFightReportNotExist = function(playerId, allianceId, reportId){
	var config = Errors.allianceFightReportNotExist
	return CreateError(config, {playerId:playerId, allianceId:allianceId, reportId:reportId})
}

/**
 * 联盟战胜利方不能发起复仇
 * @param playerId
 * @param allianceId
 * @param reportId
 */
Utils.winnerOfAllianceFightCanNotRevenge = function(playerId, allianceId, reportId){
	var config = Errors.winnerOfAllianceFightCanNotRevenge
	return CreateError(config, {playerId:playerId, allianceId:allianceId, reportId:reportId})
}

/**
 * 超过最长复仇期限
 * @param playerId
 * @param allianceId
 * @param reportId
 */
Utils.allianceFightRevengeTimeExpired = function(playerId, allianceId, reportId){
	var config = Errors.allianceFightRevengeTimeExpired
	return CreateError(config, {playerId:playerId, allianceId:allianceId, reportId:reportId})
}

/**
 * 目标联盟未处于和平期
 * @param playerId
 * @param allianceId
 */
Utils.targetAllianceNotInPeaceStatus = function(playerId, allianceId){
	var config = Errors.targetAllianceNotInPeaceStatus
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 玩家已经对目标玩家派出了协防部队
 * @param playerId
 * @param targetPlayerId
 * @param allianceId
 */
Utils.playerAlreadySendHelpDefenceTroopToTargetPlayer = function(playerId, targetPlayerId, allianceId){
	var config = Errors.playerAlreadySendHelpDefenceTroopToTargetPlayer
	return CreateError(config, {playerId:playerId, targetPlayerId:targetPlayerId, allianceId:allianceId})
}

/**
 * 目标玩家协防部队数量已达最大
 * @param playerId
 * @param targetPlayerId
 * @param allianceId
 */
Utils.targetPlayersHelpDefenceTroopsCountReachMax = function(playerId, targetPlayerId, allianceId){
	var config = Errors.targetPlayersHelpDefenceTroopsCountReachMax
	return CreateError(config, {playerId:playerId, targetPlayerId:targetPlayerId, allianceId:allianceId})
}

/**
 * 玩家没有协防部队驻扎在目标玩家城市
 * @param playerId
 * @param allianceId
 * @param targetPlayerId
 */
Utils.noHelpDefenceTroopInTargetPlayerCity = function(playerId, allianceId, targetPlayerId){
	var config = Errors.noHelpDefenceTroopInTargetPlayerCity
	return CreateError(config, {playerId:playerId, allianceId:allianceId, targetPlayerId:targetPlayerId})
}

/**
 * 联盟未处于战争期
 * @param playerId
 * @param allianceId
 */
Utils.allianceNotInFightStatus = function(playerId, allianceId){
	var config = Errors.allianceNotInFightStatus
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 玩家不在敌对联盟中
 * @param playerId
 * @param allianceId
 * @param enemyPlayerId
 * @param enemyAllianceId
 */
Utils.playerNotInEnemyAlliance = function(playerId, allianceId, enemyPlayerId, enemyAllianceId){
	var config = Errors.playerNotInEnemyAlliance
	return CreateError(config, {
		playerId:playerId,
		allianceId:allianceId,
		enemyPlayerId:enemyAllianceId,
		enemyAllianceId:enemyAllianceId
	})
}

/**
 * 玩家处于保护状态
 * @param playerId
 * @param targetPlayerId
 */
Utils.playerInProtectStatus = function(playerId, targetPlayerId){
	var config = Errors.playerInProtectStatus
	return CreateError(config, {playerId:playerId, targetPlayerId:targetPlayerId})
}

/**
 * 目标联盟非当前匹配的敌对联盟
 * @param playerId
 * @param allianceId
 * @param targetAllianceId
 */
Utils.targetAllianceNotTheEnemyAlliance = function(playerId, allianceId, targetAllianceId){
	var config = Errors.playerInProtectStatus
	return CreateError(config, {playerId:playerId, allianceId:allianceId, targetAllianceId:targetAllianceId})
}

/**
 * 村落不存在
 * @param playerId
 * @param allianceId
 * @param villageId
 */
Utils.villageNotExist = function(playerId, allianceId, villageId){
	var config = Errors.villageNotExist
	return CreateError(config, {playerId:playerId, allianceId:allianceId, villageId:villageId})
}

/**
 * 野怪不存在
 * @param playerId
 * @param allianceId
 * @param monsterId
 */
Utils.monsterNotExist = function(playerId, allianceId, monsterId){
	var config = Errors.monsterNotExist
	return CreateError(config, {playerId:playerId, allianceId:allianceId, monsterId:monsterId})
}

/**
 * 村落采集事件不存在
 * @param playerId
 * @param allianceId
 * @param eventId
 */
Utils.villageCollectEventNotExist = function(playerId, allianceId, eventId){
	var config = Errors.villageCollectEventNotExist
	return CreateError(config, {playerId:playerId, allianceId:allianceId, eventId:eventId})
}

/**
 * 没有此玩家的协防部队
 * @param playerId
 * @param allianceId
 * @param beHelpedPlayerId
 */
Utils.noHelpDefenceTroopByThePlayer = function(playerId, allianceId, beHelpedPlayerId){
	var config = Errors.noHelpDefenceTroopByThePlayer
	return CreateError(config, {
		playerId:playerId,
		allianceId:allianceId,
		beHelpedPlayerId:beHelpedPlayerId
	})
}

/**
 * 此道具未在联盟商店出售
 * @param playerId
 * @param allianceId
 * @param itemName
 */
Utils.theItemNotSellInAllianceShop = function(playerId, allianceId, itemName){
	var config = Errors.theItemNotSellInAllianceShop
	return CreateError(config, {playerId:playerId, allianceId:allianceId, itemName:itemName})
}

/**
 * 普通道具不需要进货补充
 * @param playerId
 * @param allianceId
 * @param itemName
 */
Utils.normalItemsNotNeedToAdd = function(playerId, allianceId, itemName){
	var config = Errors.normalItemsNotNeedToAdd
	return CreateError(config, {playerId:playerId, allianceId:allianceId, itemName:itemName})
}

/**
 * 玩家级别不足,不能购买高级道具
 * @param playerId
 * @param allianceId
 * @param itemName
 */
Utils.playerLevelNotEoughCanNotBuyAdvancedItem = function(playerId, allianceId, itemName){
	var config = Errors.playerLevelNotEoughCanNotBuyAdvancedItem
	return CreateError(config, {playerId:playerId, allianceId:allianceId, itemName:itemName})
}

/**
 * 道具数量不足
 * @param playerId
 * @param allianceId
 * @param itemName
 */
Utils.itemCountNotEnough = function(playerId, allianceId, itemName){
	var config = Errors.itemCountNotEnough
	return CreateError(config, {playerId:playerId, allianceId:allianceId, itemName:itemName})
}

/**
 * 玩家忠诚值不足
 * @param playerId
 * @param allianceId
 */
Utils.playerLoyaltyNotEnough = function(playerId, allianceId){
	var config = Errors.playerLoyaltyNotEnough
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 联盟事件不存在
 * @param allianceId
 * @param eventType
 * @param eventId
 */
Utils.allianceEventNotExist = function(allianceId, eventType, eventId){
	var config = Errors.allianceEventNotExist
	return CreateError(config, {allianceId:allianceId, eventType:eventType, eventId:eventId})
}

/**
 * 非法的联盟状态
 * @param allianceId
 * @param allianceStatus
 */
Utils.illegalAllianceStatus = function(allianceId, allianceStatus){
	var config = Errors.illegalAllianceStatus
	return CreateError(config, {allianceId:allianceId, allianceStatus:allianceStatus})
}

/**
 * 账号GameCenter账号已经绑定
 * @param playerId
 * @param gc
 */
Utils.playerAlreadyBindGC = function(playerId, gc){
	var config = Errors.playerAlreadyBindGC
	return CreateError(config, {playerId:playerId, gc:gc})
}

/**
 * 玩家还未绑定GC
 * @param playerId
 */
Utils.playerNotBindGC = function(playerId){
	var config = Errors.playerNotBindGC
	return CreateError(config, {playerId:playerId})
}

/**
 * 此GameCenter账号已被其他玩家绑定
 * @param playerId
 * @param gc
 */
Utils.theGCAlreadyBindedByOtherPlayer = function(playerId, gc){
	var config = Errors.theGCAlreadyBindedByOtherPlayer
	return CreateError(config, {playerId:playerId, gc:gc})
}

/**
 * 此GameCenter账号已绑定当前玩家
 * @param playerId
 * @param gc
 */
Utils.theGCAlreadyBindedByCurrentPlayer = function(playerId, gc){
	var config = Errors.theGCAlreadyBindedByCurrentPlayer
	return CreateError(config, {playerId:playerId, gc:gc})
}

/**
 * ApnId已经设置
 * @param playerId
 * @param pushId
 */
Utils.pushIdAlreadySeted = function(playerId, pushId){
	var config = Errors.pushIdAlreadySeted
	return CreateError(config, {playerId:playerId, pushId:pushId})
}

/**
 * 礼品不存在
 * @param playerId
 * @param giftId
 */
Utils.giftNotExist = function(playerId, giftId){
	var config = Errors.giftNotExist
	return CreateError(config, {playerId:playerId, giftId:giftId})
}

/**
 * 服务器不存在
 * @param playerId
 * @param serverId
 */
Utils.serverNotExist = function(playerId, serverId){
	var config = Errors.serverNotExist
	return CreateError(config, {playerId:playerId, serverId:serverId})
}

/**
 * 不能切换到相同的服务器
 * @param playerId
 * @param serverId
 */
Utils.canNotSwitchToTheSameServer = function(playerId, serverId){
	var config = Errors.canNotSwitchToTheSameServer
	return CreateError(config, {playerId:playerId, serverId:serverId})
}

/**
 * 玩家未在当前服务器
 * @param playerId
 * @param currentServerId
 * @param dbServerId
 */
Utils.playerNotInCurrentServer = function(playerId, currentServerId, dbServerId){
	var config = Errors.playerNotInCurrentServer
	return CreateError(config, {playerId:playerId, currentServerId:currentServerId, dbServerId:dbServerId})
}

/**
 * 没有事件需要协助加速
 * @param playerId
 */
Utils.noEventsNeedTobeSpeedup = function(playerId){
	var config = Errors.noEventsNeedTobeSpeedup
	return CreateError(config, {playerId:playerId})
}

/**
 * 联盟人数已达最大
 * @param playerId
 * @param allianceId
 */
Utils.allianceMemberCountReachMax = function(playerId, allianceId){
	var config = Errors.allianceMemberCountReachMax
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 服务器繁忙
 * @param api
 * @param data
 */
Utils.serverTooBusy = function(api, data){
	var config = Errors.serverTooBusy
	return CreateError(config, {api:api, data:data})
}

/**
 * 玩家第二条队列已经解锁
 * @param playerId
 */
Utils.playerSecondMarchQueueAlreadyUnlocked = function(playerId){
	var config = Errors.playerSecondMarchQueueAlreadyUnlocked
	return CreateError(config, {playerId:playerId})
}

/**
 * 非法的请求
 * @param msg
 */
Utils.illegalRequest = function(msg){
	var config = Errors.illegalRequest
	return CreateError(config, msg)
}

/**
 * 玩家数据已经初始化
 * @param playerId
 */
Utils.playerDataAlreadyInited = function(playerId){
	var config = Errors.playerDataAlreadyInited
	return CreateError(config, {playerId:playerId})
}

/**
 * 设备禁止登陆
 * @param deviceId
 */
Utils.deviceLocked = function(deviceId){
	var config = Errors.deviceLocked
	return CreateError(config, {deviceId:deviceId})
}

/**
 * 玩家禁止登陆
 * @param playerId
 */
Utils.playerLocked = function(playerId){
	var config = Errors.playerLocked
	return CreateError(config, {playerId:playerId})
}

/**
 * 首次加入联盟奖励已经领取
 * @param playerId
 */
Utils.firstJoinAllianceRewardAlreadyGeted = function(playerId){
	var config = Errors.firstJoinAllianceRewardAlreadyGeted
	return CreateError(config, {playerId:playerId})
}

/**
 * 版本验证失败
 * @param tagUpload
 */
Utils.versionValidateFailed = function(tagUpload){
	var config = Errors.versionValidateFailed
	return CreateError(config, {tagUpload:tagUpload})
}

/**
 * 版本不匹配
 * @param tagUpload
 * @param tag
 */
Utils.versionNotEqual = function(tagUpload, tag){
	var config = Errors.versionNotEqual
	return CreateError(config, {tagUpload:tagUpload, tag:tag})
}

/**
 * 此联盟不需要申请加入
 * @param playerId
 * @param allianceId
 */
Utils.theAllianceDoNotNeedRequestToJoin = function(playerId, allianceId){
	var config = Errors.theAllianceDoNotNeedRequestToJoin
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 孵化条件不满足
 * @param playerId
 * @param dragonType
 */
Utils.hatchConditionNotMatch = function(playerId, dragonType){
	var config = Errors.hatchConditionNotMatch;
	return CreateError(config, {playerId:playerId, dragonType:dragonType});
}

/**
 * 关卡未解锁
 * @param playerId
 * @param sectionName
 */
Utils.pveSecionIsLocked = function(playerId, sectionName){
	var config = Errors.pveSecionIsLocked;
	return CreateError(config, {playerId:playerId, sectionName:sectionName});
}

/**
 * 还不能领取星级奖励
 * @param playerId
 * @param stageName
 */
Utils.canNotGetPvEStarRewardyet = function(playerId, stageName){
	var config = Errors.canNotGetPvEStarRewardyet;
	return CreateError(config, {playerId:playerId, stageName:stageName});
}

/**
 * Pve星级奖励已经领取
 * @param playerId
 * @param stageName
 */
Utils.pveStarRewardAlreadyGet = function(playerId, stageName){
	var config = Errors.pveStarRewardAlreadyGet;
	return CreateError(config, {playerId:playerId, stageName:stageName});
}

/**
 * 当前关卡已达最大战斗次数
 * @param playerId
 * @param sectionName
 */
Utils.currentSectionReachMaxFightCount = function(playerId, sectionName){
	var config = Errors.currentSectionReachMaxFightCount;
	return CreateError(config, {playerId:playerId, sectionName:sectionName});
}

/**
 * 玩家体力值不足
 * @param playerId
 * @param staminaHas
 * @param staminaNeed
 */
Utils.playerStaminaNotEnough = function(playerId, staminaHas, staminaNeed){
	var config = Errors.playerStaminaNotEnough;
	return CreateError(config, {playerId:playerId, staminaHas:staminaHas, staminaNeed:staminaNeed});
}

/**
 * 当前PvE关卡还不能被扫荡
 * @param playerId
 * @param sectionName
 */
Utils.currentPvESectionCanNotBeSweepedYet = function(playerId, sectionName){
	var config = Errors.currentPvESectionCanNotBeSweepedYet;
	return CreateError(config, {playerId:playerId, sectionName:sectionName});
}

/**
 * 此邮件未包含奖励信息
 * @param playerId
 * @param mailId
 */
Utils.thisMailNotContainsRewards = function(playerId, mailId){
	var config = Errors.thisMailNotContainsRewards;
	return CreateError(config, {playerId:playerId, mailId:mailId});
}

/**
 * 此邮件的奖励已经领取
 * @param playerId
 * @param mailId
 */
Utils.theRewardsAlreadyGetedFromThisMail = function(playerId, mailId){
	var config = Errors.theRewardsAlreadyGetedFromThisMail;
	return CreateError(config, {playerId:playerId, mailId:mailId});
}

/**
 * 玩家被禁止发言
 * @param playerId
 * @param muteTime
 */
Utils.playerIsForbiddenToSpeak = function(playerId, muteTime){
	var config = Errors.playerIsForbiddenToSpeak;
	return CreateError(config, {playerId:playerId, muteTime:muteTime});
}

/**
 * 不能观察自己的联盟
 * @param playerId
 * @param allianceId
 */
Utils.canNotViewYourOwnAlliance = function(playerId, allianceId){
	var config = Errors.canNotViewYourOwnAlliance;
	return CreateError(config, {playerId:playerId, allianceId:allianceId})
}

/**
 * 没有空闲的地图区域
 */
Utils.noFreeMapArea = function(){
	var config = Errors.noFreeMapArea;
	return CreateError(config, {});
}

/**
 * 当前还不能移动联盟
 * @param playerId
 * @param allianceId
 */
Utils.canNotMoveAllianceRightNow = function(playerId, allianceId){
	var config = Errors.canNotMoveAllianceRightNow;
	return CreateError(config, {playerId:playerId, allianceId:allianceId});
}

/**
 * 不能移动到目标地块
 * @param playerId
 * @param allianceId
 * @param targetMapIndex
 */
Utils.canNotMoveToTargetMapIndex = function(playerId, allianceId, targetMapIndex){
	var config = Errors.canNotMoveToTargetMapIndex;
	return CreateError(config, {playerId:playerId, allianceId:allianceId, targetMapIndex:targetMapIndex});
}

/**
 * 玩家将被攻打,不能退出联盟
 * @param playerId
 * @param allianceId
 * @param memberId
 */
Utils.canNotQuitAllianceForPlayerWillBeAttacked = function(playerId, allianceId, memberId){
	var config = Errors.canNotQuitAllianceForPlayerWillBeAttacked;
	return CreateError(config, {playerId:playerId, allianceId:allianceId, memberId:memberId});
}

/**
 * 您有商品正在出售,不能切换服务器
 * @param playerId
 */
Utils.youHaveProductInSellCanNotSwitchServer = function(playerId){
	var config = Errors.youHaveProductInSellCanNotSwitchServer;
	return CreateError(config, {playerId:playerId});
}

/**
 * 联盟宫殿等级过低,不能移动联盟
 * @param playerId
 * @param allianceId
 */
Utils.alliancePalaceLevelTooLowCanNotMoveAlliance = function(playerId, allianceId){
	var config = Errors.alliancePalaceLevelTooLowCanNotMoveAlliance;
	return CreateError(config, {playerId:playerId, allianceId:allianceId});
}

/**
 * 不能迁移到选定的服务器
 * @param playerId
 * @param serverId
 */
Utils.canNotSwitchToTheSelectedServer = function(playerId, serverId){
	var config = Errors.canNotSwitchToTheSelectedServer;
	return CreateError(config, {playerId:playerId, serverId:serverId});
}

/**
 * 已有龙驻防在城墙
 * @param playerId
 * @param dragonType
 */
Utils.alreadyHasDefenceDragon = function(playerId, dragonType){
	var config = Errors.alreadyHasDefenceDragon;
	return CreateError(config, {playerId:playerId, dragonType:dragonType});
}

/**
 * 玩家昵称不合法
 * @param playerId
 * @param playerName
 */
Utils.playerNameNotLegal = function(playerId, playerName){
	var config = Errors.playerNameNotLegal;
	return CreateError(config, {playerId:playerId, playerName:playerName});
}

/**
 * 联盟昵称不合法
 * @param playerId
 * @param allianceName
 */
Utils.allianceNameNotLegal = function(playerId, allianceName){
	var config = Errors.allianceNameNotLegal;
	return CreateError(config, {playerId:playerId, allianceName:allianceName});
}

/**
 * 无效的活动信息
 * @param playerId
 * @param activity
 */
Utils.invalidActivity = function(playerId, activity){
	var config = Errors.invalidActivity;
	return CreateError(config, {playerId:playerId, activity:activity});
}

/**
 * 无效的活动信息
 * @param allianceId
 * @param activity
 */
Utils.invalidAllianceActivity = function(allianceId, activity){
	var config = Errors.invalidAllianceActivity;
	return CreateError(config, {allianceId:allianceId, activity:activity});
}

/**
 * 没有可领取的奖励
 * @param playerId
 * @param activity
 */
Utils.noAvailableRewardsCanGet = function(playerId, activity){
	var config = Errors.noAvailableRewardsCanGet;
	return CreateError(config, {playerId:playerId, activity:activity});
}

/**
 * 还不能退出联盟
 * @param playerId
 * @param allianceId
 */
Utils.canNotQuitAllianceNow = function(playerId, allianceId){
	var config = Errors.canNotQuitAllianceNow;
	return CreateError(config, {playerId:playerId, allianceId:allianceId});
}

/**
 * 你不是墨子
 * @param playerId
 */
Utils.youAreNotTheMod = function(playerId){
	var config = Errors.youAreNotTheMod;
	return CreateError(config, {playerId:playerId});
}

/**
 * 现在还不能进行协防
 * @param playerId
 * @param allianceId
 */
Utils.canNotHelpDefenceNow = function(playerId, allianceId){
	var config = Errors.canNotHelpDefenceNow;
	return CreateError(config, {playerId:playerId, allianceId:allianceId});
}

/**
 * 正遭受攻击,不能退出移动城市
 * @param playerId
 * @param allianceId
 */
Utils.beAttackedNowCanNotMoveCityNow = function(playerId, allianceId){
	var config = Errors.beAttackedNowCanNotMoveCityNow;
	return CreateError(config, {playerId:playerId, allianceId:allianceId});
}

/**
 * 目标已不是墨子,不能回复
 * @param playerId
 * @param memberId
 */
Utils.targetNotModNowCanNotReply = function(playerId, memberId){
	var config = Errors.targetNotModNowCanNotReply;
	return CreateError(config, {playerId:playerId, memberId:memberId});
}

/**
 * 还不能领取累计充值奖励
 * @param playerId
 */
Utils.canNotGetTotalIAPRewardsNow = function(playerId){
	var config = Errors.canNotGetTotalIAPRewardsNow;
	return CreateError(config, {playerId:playerId});
}

/**
 * 还不能领取月卡每日奖励
 * @param playerId
 */
Utils.canNotGetMonthcardRewardsNow = function(playerId){
	var config = Errors.canNotGetMonthcardRewardsNow;
	return CreateError(config, {playerId:playerId});
}

/**
 * 还不能使用城防大师
 * @param playerId
 */
Utils.canNotUseMasterOfDefenderNow = function(playerId){
	var config = Errors.canNotUseMasterOfDefenderNow;
	return CreateError(config, {playerId:playerId})
}

/**
 * 城墙已被攻破,不能出兵
 * @param playerId
 */
Utils.wallWasBrokenCanNotSendTroopsOut = function(playerId, allianceId){
	var config = Errors.wallWasBrokenCanNotSendTroopsOut;
	return CreateError(config, {playerId:playerId, allianceId:allianceId});
}