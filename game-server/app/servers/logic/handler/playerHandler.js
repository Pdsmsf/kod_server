"use strict"

/**
 * Created by modun on 14-7-22.
 */

var ShortId = require("shortid")
var Promise = require("bluebird")
var _ = require("underscore")
var DOMParser = require('xmldom').DOMParser;

var DataUtils = require("../../../utils/dataUtils")
var LogicUtils = require("../../../utils/logicUtils")
var ErrorUtils = require("../../../utils/errorUtils")
var ItemUtils = require("../../../utils/itemUtils")

var Consts = require("../../../consts/consts")
var Define = require("../../../consts/define")

var GameDatas = require("../../../datas/GameDatas")

module.exports = function(app){
	return new Handler(app)
}

var Handler = function(app){
	this.app = app
	this.logService = app.get("logService")
	this.request = app.get('request');
}
var pro = Handler.prototype

/**
 * 升级大建筑
 * @param msg
 * @param session
 * @param next
 */
pro.upgradeBuilding = function(msg, session, next){
	var location = msg.location
	var finishNow = msg.finishNow
	var e = null
	if(!_.isNumber(location) || location % 1 !== 0 || location < 1 || location > 22){
		e = new Error("location 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'upgradeBuilding', [session.uid, location, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 转换生产建筑类型
 * @param msg
 * @param session
 * @param next
 */
pro.switchBuilding = function(msg, session, next){
	var buildingLocation = msg.buildingLocation
	var newBuildingName = msg.newBuildingName
	var e = null
	if(!_.isNumber(buildingLocation) || buildingLocation % 1 !== 0 || buildingLocation < 1){
		e = new Error("buildingLocation 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.contains(_.values(Consts.ResourceBuildingMap), newBuildingName) || _.isEqual("townHall", newBuildingName)){
		e = new Error("newBuildingName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'switchBuilding', [session.uid, buildingLocation, newBuildingName]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 创建小建筑
 * @param msg
 * @param session
 * @param next
 */
pro.createHouse = function(msg, session, next){
	var buildingLocation = msg.buildingLocation
	var houseType = msg.houseType
	var houseLocation = msg.houseLocation
	var finishNow = msg.finishNow
	var e = null
	if(!_.isNumber(buildingLocation) || buildingLocation % 1 !== 0 || buildingLocation < 1 || buildingLocation > 20){
		e = new Error("buildingLocation 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isString(houseType)){
		e = new Error("houseType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(houseLocation) || houseLocation % 1 !== 0 || houseLocation < 1 || houseLocation > 3){
		e = new Error("houseLocation 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'createHouse', [session.uid, buildingLocation, houseType, houseLocation, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 升级小建筑
 * @param msg
 * @param session
 * @param next
 */
pro.upgradeHouse = function(msg, session, next){
	var buildingLocation = msg.buildingLocation
	var houseLocation = msg.houseLocation
	var finishNow = msg.finishNow
	var e = null
	if(!_.isNumber(buildingLocation) || buildingLocation % 1 !== 0 || buildingLocation < 1 || buildingLocation > 20){
		e = new Error("buildingLocation 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(houseLocation) || houseLocation % 1 !== 0 || houseLocation < 1 || houseLocation > 3){
		e = new Error("houseLocation 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'upgradeHouse', [session.uid, buildingLocation, houseLocation, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 免费加速
 * @param msg
 * @param session
 * @param next
 */
pro.freeSpeedUp = function(msg, session, next){
	var eventType = msg.eventType
	var eventId = msg.eventId
	var e = null
	if(!_.contains(Consts.FreeSpeedUpAbleEventTypes, eventType)){
		e = new Error("eventType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isString(eventId)){
		e = new Error("eventId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'freeSpeedUp', [session.uid, eventType, eventId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 宝石加速
 * @param msg
 * @param session
 * @param next
 */
pro.speedUp = function(msg, session, next){
	var eventType = msg.eventType
	var eventId = msg.eventId
	var e = null
	if(!_.contains(Consts.SpeedUpEventTypes, eventType)){
		e = new Error("eventType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isString(eventId)){
		e = new Error("eventId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'speedUp', [session.uid, eventType, eventId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 制作材料
 * @param msg
 * @param session
 * @param next
 */
pro.makeMaterial = function(msg, session, next){
	var type = msg.type
	var finishNow = msg.finishNow
	var e = null
	if(!_.contains(Consts.MaterialType, type)){
		e = new Error("type 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'makeMaterial', [session.uid, type, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 领取制作完成
 * @param msg
 * @param session
 * @param next
 */
pro.getMaterials = function(msg, session, next){
	var eventId = msg.eventId
	var e = null
	if(!_.isString(eventId)){
		e = new Error("eventId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getMaterials', [session.uid, eventId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 招募普通士兵
 * @param msg
 * @param session
 * @param next
 */
pro.recruitNormalSoldier = function(msg, session, next){
	var soldierName = msg.soldierName
	var count = msg.count
	var finishNow = msg.finishNow
	var e = null
	if(!DataUtils.isNormalSoldier(soldierName)){
		e = new Error("soldierName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(count) || count % 1 !== 0 || count < 1){
		e = new Error("count 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'recruitNormalSoldier', [session.uid, soldierName, count, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 招募特殊士兵
 * @param msg
 * @param session
 * @param next
 */
pro.recruitSpecialSoldier = function(msg, session, next){
	var soldierName = msg.soldierName
	var count = msg.count
	var finishNow = msg.finishNow
	var e = null
	if(!DataUtils.hasSpecialSoldier(soldierName)){
		e = new Error("soldierName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(count) || count % 1 !== 0 || count < 1){
		e = new Error("count 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'recruitSpecialSoldier', [session.uid, soldierName, count, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 制作龙装备
 * @param msg
 * @param session
 * @param next
 */
pro.makeDragonEquipment = function(msg, session, next){
	var equipmentName = msg.equipmentName
	var finishNow = msg.finishNow
	var e = null
	if(!DataUtils.isDragonEquipment(equipmentName)){
		e = new Error("equipmentName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'makeDragonEquipment', [session.uid, equipmentName, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 治疗士兵
 * @param msg
 * @param session
 * @param next
 */
pro.treatSoldier = function(msg, session, next){
	var soldiers = msg.soldiers
	var finishNow = msg.finishNow
	var e = null
	if(!_.isArray(soldiers)){
		e = new Error("soldiers 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'treatSoldier', [session.uid, soldiers, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 孵化龙蛋
 * @param msg
 * @param session
 * @param next
 */
pro.hatchDragon = function(msg, session, next){
	var dragonType = msg.dragonType
	var e = null
	if(!DataUtils.isDragonTypeExist(dragonType)){
		e = new Error("dragonType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'hatchDragon', [session.uid, dragonType]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 设置龙的装备
 * @param msg
 * @param session
 * @param next
 */
pro.setDragonEquipment = function(msg, session, next){
	var dragonType = msg.dragonType
	var equipmentCategory = msg.equipmentCategory
	var equipmentName = msg.equipmentName
	var e = null
	if(!DataUtils.isDragonTypeExist(dragonType)){
		e = new Error("dragonType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.contains(Consts.DragonEquipmentCategory, equipmentCategory)){
		e = new Error("equipmentCategory 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!DataUtils.isDragonEquipment(equipmentName)){
		e = new Error("equipmentName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!DataUtils.isDragonEquipmentLegalAtCategory(equipmentName, equipmentCategory)){
		e = new Error("equipmentName 不能装备到equipmentCategory")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!DataUtils.isDragonEquipmentLegalOnDragon(equipmentName, dragonType)){
		e = new Error("equipmentName 不能装备到dragonType")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'setDragonEquipment', [session.uid, dragonType, equipmentCategory, equipmentName]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 强化龙的装备
 * @param msg
 * @param session
 * @param next
 */
pro.enhanceDragonEquipment = function(msg, session, next){
	var dragonType = msg.dragonType
	var equipmentCategory = msg.equipmentCategory
	var equipments = msg.equipments
	var e = null
	if(!DataUtils.isDragonTypeExist(dragonType)){
		e = new Error("dragonType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.contains(Consts.DragonEquipmentCategory, equipmentCategory)){
		e = new Error("equipmentCategory 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isArray(equipments)){
		e = new Error("equipments 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'enhanceDragonEquipment', [session.uid, dragonType, equipmentCategory, equipments]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 重置龙的装备的随机Buff
 * @param msg
 * @param session
 * @param next
 */
pro.resetDragonEquipment = function(msg, session, next){
	var dragonType = msg.dragonType
	var equipmentCategory = msg.equipmentCategory
	var e = null
	if(!DataUtils.isDragonTypeExist(dragonType)){
		e = new Error("dragonType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.contains(Consts.DragonEquipmentCategory, equipmentCategory)){
		e = new Error("equipmentCategory 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'resetDragonEquipment', [session.uid, dragonType, equipmentCategory]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 升级龙的技能
 * @param msg
 * @param session
 * @param next
 */
pro.upgradeDragonSkill = function(msg, session, next){
	var dragonType = msg.dragonType
	var skillKey = msg.skillKey
	var e = null
	if(!DataUtils.isDragonTypeExist(dragonType)){
		e = new Error("dragonType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isString(skillKey) || skillKey.trim().length === 0 || skillKey.trim().length > Define.InputLength.DragonSkillKey){
		e = new Error("skillKey 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'upgradeDragonSkill', [session.uid, dragonType, skillKey]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 升级龙的星级
 * @param msg
 * @param session
 * @param next
 */
pro.upgradeDragonStar = function(msg, session, next){
	var dragonType = msg.dragonType
	var e = null
	if(!DataUtils.isDragonTypeExist(dragonType)){
		e = new Error("dragonType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'upgradeDragonStar', [session.uid, dragonType]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取每日任务列表
 * @param msg
 * @param session
 * @param next
 */
pro.getDailyQuests = function(msg, session, next){
	this.request(session, 'getDailyQuests', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 为每日任务中某个任务增加星级
 * @param msg
 * @param session
 * @param next
 */
pro.addDailyQuestStar = function(msg, session, next){
	var questId = msg.questId
	var e = null
	if(!_.isString(questId) || !ShortId.isValid(questId)){
		e = new Error("questId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'addDailyQuestStar', [session.uid, questId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 开始一个每日任务
 * @param msg
 * @param session
 * @param next
 */
pro.startDailyQuest = function(msg, session, next){
	var questId = msg.questId
	var e = null
	if(!_.isString(questId) || !ShortId.isValid(questId)){
		e = new Error("questId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'startDailyQuest', [session.uid, questId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 领取每日任务奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getDailyQeustReward = function(msg, session, next){
	var questEventId = msg.questEventId
	var e = null
	if(!_.isString(questEventId) || !ShortId.isValid(questEventId)){
		e = new Error("questEventId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getDailyQeustReward', [session.uid, questEventId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 设置玩家语言
 * @param msg
 * @param session
 * @param next
 */
pro.setPlayerLanguage = function(msg, session, next){
	var language = msg.language
	var e = null
	if(!_.contains(Consts.PlayerLanguage, language)){
		e = new Error("language 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'setPlayerLanguage', [session.uid, language]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家个人信息
 * @param msg
 * @param session
 * @param next
 */
pro.getPlayerInfo = function(msg, session, next){
	var self = this;
	var memberId = msg.memberId;
	var e = null
	if(!_.isString(memberId) || !ShortId.isValid(memberId)){
		e = new Error("memberId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	self.app.get('Player').findById(memberId, 'serverId').then(function(doc){
		if(!_.isObject(doc)){
			return Promise.reject(ErrorUtils.playerNotExist(session.uid, memberId));
		}
		return self.request(session, 'getPlayerInfo', [session.uid, memberId], doc.serverId);
	}).then(function(playerViewData){
		next(null, {code:200, playerViewData:playerViewData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 发送个人邮件
 * @param msg
 * @param session
 * @param next
 */
pro.sendMail = function(msg, session, next){
	var self = this;
	var memberId = msg.memberId;
	var title = msg.title;
	var content = msg.content;
	var sendAsMod = msg.sendAsMod;
	var replyMod = msg.replyMod;
	var e = null
	if(!_.isString(memberId) || !ShortId.isValid(memberId)){
		e = new Error("memberId 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(_.isEqual(session.uid, memberId)){
		e = new Error("不能给自己发邮件")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isString(title) || title.trim().length === 0 || title.trim().length > Define.InputLength.MailTitle){
		e = new Error("title 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isString(content) || content.trim().length === 0 || content.trim().length > Define.InputLength.MailContent){
		e = new Error("content 不合法")
		return next(e, ErrorUtils.getError(e))
	}

	var amModDoc = null;
	var targetModDoc = null;
	var memberDoc = null;
	var Player = this.app.get('Player');
	Player.findById(memberId, 'serverId basicInfo.name').then(function(doc){
		if(!_.isObject(doc)){
			return Promise.reject(ErrorUtils.playerNotExist(session.uid, memberId));
		}
		memberDoc = doc;
	}).then(function(){
		if(!!sendAsMod){
			return self.app.get('Mod').findById(session.uid).then(function(doc){
				if(!doc){
					return Promise.reject(ErrorUtils.youAreNotTheMod(session.uid));
				}
				amModDoc = doc;
			})
		}
	}).then(function(){
		if(!!replyMod){
			return self.app.get('Mod').findById(memberId).then(function(doc){
				if(!doc){
					return Promise.reject(ErrorUtils.targetNotModNowCanNotReply(session.uid, memberId));
				}
				targetModDoc = doc;
			})
		}
	}).then(function(){
		var playerId = session.uid;
		var fromName = !!sendAsMod ? amModDoc.name : session.get('name');
		var fromIcon = !!sendAsMod ? -1 : session.get('icon');
		var fromAllianceTag = !!sendAsMod ? '' : session.get('allianceTag');
		var toName = !!replyMod ? targetModDoc.name : memberDoc.basicInfo.name;
		var toIcon = !!replyMod ? -1 : memberDoc.basicInfo.icon;
		var mailToMember = {
			id:ShortId.generate(),
			title:title,
			fromId:playerId,
			fromName:fromName,
			fromIcon:fromIcon,
			fromAllianceTag:fromAllianceTag,
			toIcon:toIcon,
			content:content,
			sendTime:Date.now(),
			rewards:[],
			rewardGetted:false,
			isRead:false,
			isSaved:false
		}
		var mailToPlayer = {
			id:ShortId.generate(),
			title:title,
			fromName:fromName,
			fromIcon:fromIcon,
			fromAllianceTag:fromAllianceTag,
			toId:memberId,
			toName:toName,
			toIcon:toIcon,
			content:content,
			sendTime:Date.now()
		}

		return self.request(session, 'addMail', [memberId, mailToMember], memberDoc.serverId).then(function(){
			return self.request(session, 'addSendMail', [playerId, mailToPlayer])
		})
	}).then(function(){
		next(null, {code:200})
	}).catch(function(e){
		console.error(e)
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 阅读邮件
 * @param msg
 * @param session
 * @param next
 */
pro.readMails = function(msg, session, next){
	var mailIds = msg.mailIds
	var e = null
	if(!_.isArray(mailIds) || mailIds.length == 0){
		e = new Error("mailIds 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	for(var i = 0; i < mailIds.length; i++){
		if(!ShortId.isValid(mailIds[i])){
			e = new Error("mailIds 不合法")
			next(e, ErrorUtils.getError(e))
			return
		}
	}

	this.request(session, 'readMails', [session.uid, mailIds]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 收藏邮件
 * @param msg
 * @param session
 * @param next
 */
pro.saveMail = function(msg, session, next){
	var mailId = msg.mailId
	var e = null
	if(!_.isString(mailId) || !ShortId.isValid(mailId)){
		e = new Error("mailId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'saveMail', [session.uid, mailId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 取消收藏邮件
 * @param msg
 * @param session
 * @param next
 */
pro.unSaveMail = function(msg, session, next){
	var mailId = msg.mailId
	var e = null
	if(!_.isString(mailId) || !ShortId.isValid(mailId)){
		e = new Error("mailId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'unSaveMail', [session.uid, mailId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家邮件
 * @param msg
 * @param session
 * @param next
 */
pro.getMails = function(msg, session, next){
	var fromIndex = msg.fromIndex
	var e = null
	if(!_.isNumber(fromIndex) || fromIndex % 1 !== 0 || fromIndex < 0){
		e = new Error("fromIndex 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getMails', [session.uid, fromIndex]).then(function(mails){
		next(null, {code:200, mails:mails})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家已发邮件
 * @param msg
 * @param session
 * @param next
 */
pro.getSendMails = function(msg, session, next){
	var fromIndex = msg.fromIndex
	var e = null
	if(!_.isNumber(fromIndex) || fromIndex % 1 !== 0 || fromIndex < 0){
		e = new Error("fromIndex 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getSendMails', [session.uid, fromIndex]).then(function(mails){
		next(null, {code:200, mails:mails})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家已存邮件
 * @param msg
 * @param session
 * @param next
 */
pro.getSavedMails = function(msg, session, next){
	var fromIndex = msg.fromIndex
	var e = null
	if(!_.isNumber(fromIndex) || fromIndex % 10 !== 0 || fromIndex < 0){
		e = new Error("fromIndex 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getSavedMails', [session.uid, fromIndex]).then(function(mails){
		next(null, {code:200, mails:mails})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 删除邮件
 * @param msg
 * @param session
 * @param next
 */
pro.deleteMails = function(msg, session, next){
	var mailIds = msg.mailIds
	var e = null
	if(!_.isArray(mailIds) || mailIds.length == 0){
		e = new Error("mailIds 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	for(var i = 0; i < mailIds.length; i++){
		if(!ShortId.isValid(mailIds[i])){
			e = new Error("mailIds 不合法")
			next(e, ErrorUtils.getError(e))
			return
		}
	}

	this.request(session, 'deleteMails', [session.uid, mailIds]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 删除已发邮件
 * @param msg
 * @param session
 * @param next
 */
pro.deleteSendMails = function(msg, session, next){
	var mailIds = msg.mailIds
	var e = null
	if(!_.isArray(mailIds) || mailIds.length == 0){
		e = new Error("mailIds 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	for(var i = 0; i < mailIds.length; i++){
		if(!ShortId.isValid(mailIds[i])){
			e = new Error("mailIds 不合法")
			next(e, ErrorUtils.getError(e))
			return
		}
	}

	this.request(session, 'deleteSendMails', [session.uid, mailIds]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 从邮件获取奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getMailRewards = function(msg, session, next){
	var mailId = msg.mailId
	var e = null
	if(!ShortId.isValid(mailId)){
		e = new Error("mailId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getMailRewards', [session.uid, mailId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 阅读战报
 * @param msg
 * @param session
 * @param next
 */
pro.readReports = function(msg, session, next){
	var reportIds = msg.reportIds
	var e = null
	if(!_.isArray(reportIds) || reportIds.length == 0){
		e = new Error("reportIds 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	for(var i = 0; i < reportIds.length; i++){
		if(!ShortId.isValid(reportIds[i])){
			e = new Error("reportIds 不合法")
			next(e, ErrorUtils.getError(e))
			return
		}
	}

	this.request(session, 'readReports', [session.uid, reportIds]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 收藏战报
 * @param msg
 * @param session
 * @param next
 */
pro.saveReport = function(msg, session, next){
	var reportId = msg.reportId
	var e = null
	if(!_.isString(reportId) || !ShortId.isValid(reportId)){
		e = new Error("reportId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'saveReport', [session.uid, reportId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 取消收藏战报
 * @param msg
 * @param session
 * @param next
 */
pro.unSaveReport = function(msg, session, next){
	var reportId = msg.reportId
	var e = null
	if(!_.isString(reportId) || !ShortId.isValid(reportId)){
		e = new Error("reportId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'unSaveReport', [session.uid, reportId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家战报
 * @param msg
 * @param session
 * @param next
 */
pro.getReports = function(msg, session, next){
	var fromIndex = msg.fromIndex
	var e = null
	if(!_.isNumber(fromIndex) || fromIndex % 1 !== 0 || fromIndex < 0){
		e = new Error("fromIndex 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getReports', [session.uid, fromIndex]).then(function(reports){
		next(null, {code:200, reports:reports})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家已存战报
 * @param msg
 * @param session
 * @param next
 */
pro.getSavedReports = function(msg, session, next){
	var fromIndex = msg.fromIndex
	var e = null
	if(!_.isNumber(fromIndex) || fromIndex % 1 !== 0 || fromIndex < 0){
		e = new Error("fromIndex 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getSavedReports', [session.uid, fromIndex]).then(function(reports){
		next(null, {code:200, reports:reports})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 删除战报
 * @param msg
 * @param session
 * @param next
 */
pro.deleteReports = function(msg, session, next){
	var reportIds = msg.reportIds
	var e = null
	if(!_.isArray(reportIds) || reportIds.length == 0){
		e = new Error("reportIds 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	for(var i = 0; i < reportIds.length; i++){
		if(!ShortId.isValid(reportIds[i])){
			e = new Error("reportIds 不合法")
			next(e, ErrorUtils.getError(e))
			return
		}
	}

	this.request(session, 'deleteReports', [session.uid, reportIds]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家可视化数据数据
 * @param msg
 * @param session
 * @param next
 */
pro.getPlayerViewData = function(msg, session, next){
	var targetPlayerId = msg.targetPlayerId
	var e = null
	if(!_.isString(targetPlayerId) || !ShortId.isValid(targetPlayerId)){
		e = new Error("targetPlayerId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getPlayerViewData', [session.uid, targetPlayerId]).then(function(playerViewData){
		next(null, {code:200, playerViewData:playerViewData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 设置驻防使用的部队
 * @param msg
 * @param session
 * @param next
 */
pro.setDefenceTroop = function(msg, session, next){
	var dragonType = msg.dragonType;
	var soldiers = msg.soldiers;
	var e = null
	if(!DataUtils.isDragonTypeExist(dragonType)){
		e = new Error("dragonType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isArray(soldiers)){
		e = new Error("soldiers 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'setDefenceTroop', [session.uid, dragonType, soldiers]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 取消驻防
 * @param msg
 * @param session
 * @param next
 */
pro.cancelDefenceTroop = function(msg, session, next){
	this.request(session, 'cancelDefenceTroop', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 出售商品
 * @param msg
 * @param session
 * @param next
 */
pro.sellItem = function(msg, session, next){
	var type = msg.type
	var name = msg.name
	var count = msg.count
	var price = msg.price
	var e = null
	if(!_.contains(_.values(_.keys(Consts.ResourcesCanDeal)), type)){
		e = new Error("type 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.contains(Consts.ResourcesCanDeal[type], name)){
		e = new Error("name 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isString(name)){
		e = new Error("name 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(count) || count % 1 !== 0 || count <= 0){
		e = new Error("count 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(price) || price % 1 !== 0 || price <= 0){
		e = new Error("price 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'sellItem', [session.uid, type, name, count, price]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取商品列表
 * @param msg
 * @param session
 * @param next
 */
pro.getSellItems = function(msg, session, next){
	var type = msg.type
	var name = msg.name
	var e = null
	if(!_.contains(_.values(_.keys(Consts.ResourcesCanDeal)), type)){
		e = new Error("type 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.contains(Consts.ResourcesCanDeal[type], name)){
		e = new Error("name 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isString(name)){
		e = new Error("name 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getSellItems', [session.uid, type, name]).then(function(itemDocs){
		next(null, {code:200, itemDocs:itemDocs})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 购买出售的商品
 * @param msg
 * @param session
 * @param next
 */
pro.buySellItem = function(msg, session, next){
	var itemId = msg.itemId
	var e = null
	if(!_.isString(itemId) || !ShortId.isValid(itemId)){
		e = new Error("itemId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'buySellItem', [session.uid, itemId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取出售后赚取的银币
 * @param msg
 * @param session
 * @param next
 */
pro.getMyItemSoldMoney = function(msg, session, next){
	var itemId = msg.itemId
	var e = null
	if(!_.isString(itemId) || !ShortId.isValid(itemId)){
		e = new Error("itemId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getMyItemSoldMoney', [session.uid, itemId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 下架商品
 * @param msg
 * @param session
 * @param next
 */
pro.removeMySellItem = function(msg, session, next){
	var itemId = msg.itemId
	var e = null
	if(!_.isString(itemId) || !ShortId.isValid(itemId)){
		e = new Error("itemId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'removeMySellItem', [session.uid, itemId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 设置玩家Push Notification Id
 * @param msg
 * @param session
 * @param next
 */
pro.setPushId = function(msg, session, next){
	var pushId = msg.pushId
	var e = null
	if(!_.isString(pushId)){
		e = new Error("pushId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'setPushId', [session.uid, pushId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 升级生产科技
 * @param msg
 * @param session
 * @param next
 */
pro.upgradeProductionTech = function(msg, session, next){
	var techName = msg.techName
	var finishNow = msg.finishNow
	var e = null
	if(!DataUtils.isProductionTechNameLegal(techName)){
		e = new Error("techName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'upgradeProductionTech', [session.uid, techName, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 升级军事科技
 * @param msg
 * @param session
 * @param next
 */
pro.upgradeMilitaryTech = function(msg, session, next){
	var techName = msg.techName
	var finishNow = msg.finishNow
	var e = null
	if(!DataUtils.isMilitaryTechNameLegal(techName)){
		e = new Error("techName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'upgradeMilitaryTech', [session.uid, techName, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 升级士兵星级
 * @param msg
 * @param session
 * @param next
 */
pro.upgradeSoldierStar = function(msg, session, next){
	var soldierName = msg.soldierName
	var finishNow = msg.finishNow
	var e = null
	if(!DataUtils.isNormalSoldier(soldierName)){
		e = new Error("soldierName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(finishNow)){
		e = new Error("finishNow 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'upgradeSoldierStar', [session.uid, soldierName, finishNow]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 设置玩家地形
 * @param msg
 * @param session
 * @param next
 */
pro.setTerrain = function(msg, session, next){
	var terrain = msg.terrain
	var e = null
	if(!_.contains(_.values(Consts.AllianceTerrain), terrain)){
		e = new Error("terrain 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'setTerrain', [session.uid, terrain]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 购买道具
 * @param msg
 * @param session
 * @param next
 */
pro.buyItem = function(msg, session, next){
	var itemName = msg.itemName
	var count = msg.count
	var e = null
	if(!DataUtils.isItemNameExist(itemName)){
		e = new Error("itemName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(count) || count % 1 !== 0 || count <= 0){
		e = new Error("count 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'buyItem', [session.uid, itemName, count]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 使用道具
 * @param msg
 * @param session
 * @param next
 */
pro.useItem = function(msg, session, next){
	var itemName = msg.itemName
	var params = msg.params
	var e = null
	if(!DataUtils.isItemNameExist(itemName)){
		e = new Error("itemName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isObject(params) || !ItemUtils.isParamsLegal(itemName, params)){
		e = new Error("params 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'useItem', [session.uid, itemName, params]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 购买并使用道具
 * @param msg
 * @param session
 * @param next
 */
pro.buyAndUseItem = function(msg, session, next){
	var itemName = msg.itemName
	var params = msg.params
	var e = null
	if(!DataUtils.isItemNameExist(itemName)){
		e = new Error("itemName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isObject(params) || !ItemUtils.isParamsLegal(itemName, params)){
		e = new Error("params 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'buyAndUseItem', [session.uid, itemName, params]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * gacha
 * @param msg
 * @param session
 * @param next
 */
pro.gacha = function(msg, session, next){
	var type = msg.type
	var e = null
	if(!_.contains(_.values(Consts.GachaType), type)){
		e = new Error("type 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'gacha', [session.uid, type]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 设置GameCenter Id
 * @param msg
 * @param session
 * @param next
 */
pro.bindGc = function(msg, session, next){
	var type = msg.type;
	var gcId = msg.gcId;
	var gcName = msg.gcName;
	var e = null
	if(!_.isString(gcId)){
		e = new Error("gcId 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.contains(Consts.GcTypes, type)){
		e = new Error("type 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isString(gcName)){
		e = new Error("gcName 不合法")
		return next(e, ErrorUtils.getError(e))
	}

	this.request(session, 'bindGc', [session.uid, type, gcId, gcName]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 更新GcName
 * @param msg
 * @param session
 * @param next
 */
pro.updateGcName = function(msg, session, next){
	var gcName = msg.gcName;
	var e = null
	if(!_.isString(gcName)){
		e = new Error("gcName 不合法")
		return next(e, ErrorUtils.getError(e))
	}

	this.request(session, 'updateGcName', [session.uid, gcName]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 切换GameCenter账号
 * @param msg
 * @param session
 * @param next
 */
pro.switchGc = function(msg, session, next){
	var gcId = msg.gcId
	var e = null
	if(!_.isString(gcId)){
		e = new Error("gcId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'switchGc', [session.uid, session.get("deviceId"), gcId]).then(function(){
		next(null, {code:200})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取每日登陆奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getDay60Reward = function(msg, session, next){
	this.request(session, 'getDay60Reward', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取每日在线奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getOnlineReward = function(msg, session, next){
	var timePoint = msg.timePoint
	var e = null
	if(!DataUtils.isOnLineTimePointExist(timePoint)){
		e = new Error("timePoint 不合法")
		next(e, ErrorUtils.getError(e))
	}

	this.request(session, 'getOnlineReward', [session.uid, timePoint]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取14日登陆奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getDay14Reward = function(msg, session, next){
	this.request(session, 'getDay14Reward', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取新玩家冲级奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getLevelupReward = function(msg, session, next){
	var levelupIndex = msg.levelupIndex
	var e = null
	if(!DataUtils.isLevelupIndexExist(levelupIndex)){
		e = new Error("levelupIndex 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getLevelupReward', [session.uid, levelupIndex]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 上传IosIAP信息
 * @param msg
 * @param session
 * @param next
 */
pro.addIosPlayerBillingData = function(msg, session, next){
	var receiptData = msg.receiptData
	var e = null
	if(!_.isString(receiptData) || _.isEmpty(receiptData.trim())){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	var jsonString = new Buffer(receiptData, 'base64').toString();
	var productIdMathResult = jsonString.match(/"product-id" = "(.*)";/)
	var transactionIdMathResult = jsonString.match(/"transaction-id" = "(.*)";/)
	if(!_.isArray(productIdMathResult) || productIdMathResult.length < 2){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isArray(transactionIdMathResult) || transactionIdMathResult.length < 2){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	var productId = productIdMathResult[1];
	var transactionId = transactionIdMathResult[1];
	this.request(session, 'addIosPlayerBillingData', [session.uid, productId, transactionId, receiptData]).then(function(playerData){
		next(null, {code:200, playerData:playerData, transactionId:transactionId})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 上传Wp官方IAP信息
 * @param msg
 * @param session
 * @param next
 */
pro.addWpOfficialPlayerBillingData = function(msg, session, next){
	var receiptData = msg.receiptData
	var e = null
	if(!_.isString(receiptData) || _.isEmpty(receiptData.trim())){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	var doc = new DOMParser().parseFromString(receiptData);
	if(!doc){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var receipt = doc.getElementsByTagName('Receipt')[0];
	if(!receipt){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var productReceipt = receipt.getElementsByTagName('ProductReceipt')[0];
	if(!productReceipt){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var productId = productReceipt.getAttribute('ProductId');
	if(!productId){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var transactionId = productReceipt.getAttribute('Id');
	if(!transactionId){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	this.request(session, 'addWpOfficialPlayerBillingData', [session.uid, productId, transactionId, receiptData]).then(function(playerData){
		next(null, {code:200, playerData:playerData, productId:productId, transactionId:transactionId})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 上传Wp Adeasygo IAP信息
 * @param msg
 * @param session
 * @param next
 */
pro.addWpAdeasygoPlayerBillingData = function(msg, session, next){
	var uid = msg.uid;
	var transactionId = msg.transactionId;
	var e = null
	if(!_.isString(uid) || _.isEmpty(uid.trim())){
		e = new Error("uid 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isString(transactionId) || _.isEmpty(transactionId.trim())){
		e = new Error("transactionId 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	this.request(session, 'addWpAdeasygoPlayerBillingData', [session.uid, uid, transactionId]).spread(function(playerData, productId){
		next(null, {code:200, playerData:playerData, productId:productId})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 上传Android官方IAP信息
 * @param msg
 * @param session
 * @param next
 */
pro.addAndroidOfficialPlayerBillingData = function(msg, session, next){
	var receiptData = msg.receiptData
	var receiptSignature = msg.receiptSignature
	var e = null
	if(!_.isString(receiptSignature) || _.isEmpty(receiptSignature.trim())){
		e = new Error("receiptSignature 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isString(receiptData) || _.isEmpty(receiptData.trim())){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	var receiptObj = null;
	try{
		receiptObj = JSON.parse(receiptData);
	}catch(e){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var productId = receiptObj.productId
	if(!productId){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var transactionId = receiptObj.orderId
	if(!transactionId){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	this.request(session, 'addAndroidOfficialPlayerBillingData', [session.uid, productId, transactionId, receiptData, receiptSignature]).then(function(playerData){
		next(null, {code:200, playerData:playerData, productId:productId, transactionId:transactionId})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 上传Ios月卡IAP信息
 * @param msg
 * @param session
 * @param next
 */
pro.addIosMonthcardBillingData = function(msg, session, next){
	var receiptData = msg.receiptData
	var e = null
	if(!_.isString(receiptData) || _.isEmpty(receiptData.trim())){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	var jsonString = new Buffer(receiptData, 'base64').toString();
	var productIdMathResult = jsonString.match(/"product-id" = "(.*)";/)
	var transactionIdMathResult = jsonString.match(/"transaction-id" = "(.*)";/)
	if(!_.isArray(productIdMathResult) || productIdMathResult.length < 2){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isArray(transactionIdMathResult) || transactionIdMathResult.length < 2){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	var productId = productIdMathResult[1];
	var transactionId = transactionIdMathResult[1];
	this.request(session, 'addIosMonthcardBillingData', [session.uid, productId, transactionId, receiptData]).then(function(playerData){
		next(null, {code:200, playerData:playerData, transactionId:transactionId})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 上传Wp月卡官方IAP信息
 * @param msg
 * @param session
 * @param next
 */
pro.addWpOfficialMonthcardBillingData = function(msg, session, next){
	var receiptData = msg.receiptData
	var e = null
	if(!_.isString(receiptData) || _.isEmpty(receiptData.trim())){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	var doc = new DOMParser().parseFromString(receiptData);
	if(!doc){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var receipt = doc.getElementsByTagName('Receipt')[0];
	if(!receipt){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var productReceipt = receipt.getElementsByTagName('ProductReceipt')[0];
	if(!productReceipt){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var productId = productReceipt.getAttribute('ProductId');
	if(!productId){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var transactionId = productReceipt.getAttribute('Id');
	if(!transactionId){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	this.request(session, 'addWpOfficialMonthcardBillingData', [session.uid, productId, transactionId, receiptData]).then(function(playerData){
		next(null, {code:200, playerData:playerData, productId:productId, transactionId:transactionId})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 上传Wp月卡Adeasygo IAP信息
 * @param msg
 * @param session
 * @param next
 */
pro.addWpAdeasygoMonthcardBillingData = function(msg, session, next){
	var uid = msg.uid;
	var transactionId = msg.transactionId;
	var e = null
	if(!_.isString(uid) || _.isEmpty(uid.trim())){
		e = new Error("uid 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isString(transactionId) || _.isEmpty(transactionId.trim())){
		e = new Error("transactionId 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	this.request(session, 'addWpAdeasygoMonthcardBillingData', [session.uid, uid, transactionId]).spread(function(playerData, productId){
		next(null, {code:200, playerData:playerData, productId:productId})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 上传Android月卡官方IAP信息
 * @param msg
 * @param session
 * @param next
 */
pro.addAndroidOfficialMonthcardBillingData = function(msg, session, next){
	var receiptData = msg.receiptData
	var receiptSignature = msg.receiptSignature
	var e = null
	if(!_.isString(receiptSignature) || _.isEmpty(receiptSignature.trim())){
		e = new Error("receiptSignature 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isString(receiptData) || _.isEmpty(receiptData.trim())){
		e = new Error("receiptData 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	var receiptObj = null;
	try{
		receiptObj = JSON.parse(receiptData);
	}catch(e){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var productId = receiptObj.productId
	if(!productId){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var transactionId = receiptObj.orderId
	if(!transactionId){
		e = new Error("receiptData 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	this.request(session, 'addAndroidOfficialMonthcardBillingData', [session.uid, productId, transactionId, receiptData, receiptSignature]).then(function(playerData){
		next(null, {code:200, playerData:playerData, productId:productId, transactionId:transactionId})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取新玩家冲级奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getFirstIAPRewards = function(msg, session, next){
	this.request(session, 'getFirstIAPRewards', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 领取日常任务奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getDailyTaskRewards = function(msg, session, next){
	this.request(session, 'getDailyTaskRewards', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 领取成就任务奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getGrowUpTaskRewards = function(msg, session, next){
	var taskType = msg.taskType
	var taskId = msg.taskId
	var e = null
	if(!_.contains(Consts.GrowUpTaskTypes, taskType)){
		e = new Error("taskType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(taskId) || taskId % 1 !== 0 || taskId < 0){
		e = new Error("taskId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getGrowUpTaskRewards', [session.uid, taskType, taskId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取联盟其他玩家赠送的礼品
 * @param msg
 * @param session
 * @param next
 */
pro.getIapGift = function(msg, session, next){
	var giftId = msg.giftId
	var e = null
	if(!_.isString(giftId) || !ShortId.isValid(giftId)){
		e = new Error("giftId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getIapGift', [session.uid, giftId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取服务器列表
 * @param msg
 * @param session
 * @param next
 */
pro.getServers = function(msg, session, next){
	this.request(session, 'getServers', [session.uid]).then(function(servers){
		next(null, {code:200, servers:servers})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 切换服务器
 * @param msg
 * @param session
 * @param next
 */
pro.switchServer = function(msg, session, next){
	var serverId = msg.serverId
	var e = null
	if(!_.isString(serverId)){
		e = new Error("serverId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'switchServer', [session.uid, serverId]).then(function(){
		next(null, {code:200})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 设置玩家头像
 * @param msg
 * @param session
 * @param next
 */
pro.setPlayerIcon = function(msg, session, next){
	var icon = msg.icon
	var e = null
	if(!_.isNumber(icon) || icon % 1 !== 0 || icon < 1 || icon > 11){
		e = new Error("icon 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'setPlayerIcon', [session.uid, icon]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 解锁玩家第二条队列
 * @param msg
 * @param session
 * @param next
 */
pro.unlockPlayerSecondMarchQueue = function(msg, session, next){
	this.request(session, 'unlockPlayerSecondMarchQueue', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 初始化玩家数据
 * @param msg
 * @param session
 * @param next
 */
pro.initPlayerData = function(msg, session, next){
	var terrain = msg.terrain
	var language = msg.language
	var e = null
	if(!_.contains(_.values(Consts.AllianceTerrain), terrain)){
		e = new Error("terrain 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.contains(Consts.PlayerLanguage, language)){
		e = new Error("language 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'initPlayerData', [session.uid, terrain, language]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 领取首次加入联盟奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getFirstJoinAllianceReward = function(msg, session, next){
	var allianceId = session.get('allianceId');
	var e = null
	if(_.isEmpty(allianceId)){
		e = ErrorUtils.playerNotJoinAlliance(session.uid)
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getFirstJoinAllianceReward', [session.uid, allianceId]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家城墙血量
 * @param msg
 * @param session
 * @param next
 */
pro.getPlayerWallInfo = function(msg, session, next){
	var memberId = msg.memberId
	var e = null
	if(!ShortId.isValid(memberId)){
		e = new Error("questId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getPlayerWallInfo', [session.uid, memberId]).then(function(wallInfo){
		next(null, {code:200, wallInfo:wallInfo})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 设置远程推送状态
 * @param msg
 * @param session
 * @param next
 */
pro.setPushStatus = function(msg, session, next){
	var type = msg.type
	var status = msg.status
	var e = null
	if(!_.contains(Consts.PushTypes, type)){
		e = new Error("type 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isBoolean(status)){
		e = new Error("status 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'setPushStatus', [session.uid, type, status]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 进攻PvE关卡
 * @param msg
 * @param session
 * @param next
 */
pro.attackPveSection = function(msg, session, next){
	var sectionName = msg.sectionName;
	var dragonType = msg.dragonType;
	var soldiers = msg.soldiers;
	var e = null
	if(!DataUtils.isPvESectionExist(sectionName)){
		e = new Error("sectionName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!DataUtils.isDragonTypeExist(dragonType)){
		e = new Error("dragonType 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isArray(soldiers)){
		e = new Error("soldiers 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(soldiers.length > DataUtils.getAllianceIntInit('maxTroopPerDragon')){
		e = new Error("soldiers 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'attackPveSection', [session.uid, sectionName, dragonType, soldiers]).spread(function(playerData, fightReport){
		next(null, {code:200, playerData:playerData, fightReport:fightReport})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取关卡星级奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getPveStageReward = function(msg, session, next){
	var stageName = msg.stageName;
	var e = null
	if(!DataUtils.isPvEStageExist(stageName)){
		e = new Error("stageName 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'getPveStageReward', [session.uid, stageName]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取战报详情
 * @param msg
 * @param session
 * @param next
 */
pro.getReportDetail = function(msg, session, next){
	var self = this;
	var memberId = msg.memberId;
	var reportId = msg.reportId;
	var e = null
	if(!ShortId.isValid(memberId)){
		e = new Error("memberId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!ShortId.isValid(reportId)){
		e = new Error("reportId 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	self.app.get('Player').findById(memberId, 'serverId').then(function(doc){
		if(!_.isObject(doc)){
			return Promise.reject(ErrorUtils.playerNotExist(session.uid, memberId));
		}
		return self.request(session, 'getReportDetail', [session.uid, memberId, reportId], doc.serverId);
	}).then(function(report){
		next(null, {code:200, report:report})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 根据昵称搜索玩家
 * @param msg
 * @param session
 * @param next
 */
pro.searchPlayerByName = function(msg, session, next){
	var name = msg.name;
	var fromIndex = msg.fromIndex;
	var e = null;
	if(!_.isString(name) || name.trim().length === 0 || name.trim().length > Define.InputLength.PlayerName){
		e = new Error("name 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}
	if(!_.isNumber(fromIndex) || fromIndex % 1 !== 0 || fromIndex < 0){
		e = new Error("fromIndex 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'searchPlayerByName', [session.uid, name, fromIndex]).spread(function(limit, playerDatas){
		next(null, {code:200, limit:limit, playerDatas:playerDatas})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取服务器公告列表
 * @param msg
 * @param session
 * @param next
 */
pro.getServerNotices = function(msg, session, next){
	this.request(session, 'getServerNotices', []).then(function(notices){
		next(null, {code:200, notices:notices})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取活动信息
 * @param msg
 * @param session
 * @param next
 */
pro.getActivities = function(msg, session, next){
	this.request(session, 'getActivities', []).then(function(activities){
		next(null, {code:200, activities:activities})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家活动积分奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getPlayerActivityScoreRewards = function(msg, session, next){
	var rankType = msg.rankType;
	if(!_.contains(DataUtils.getActivityTypes(), rankType)){
		var e = new Error("rankType 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	this.request(session, 'getPlayerActivityScoreRewards', [session.uid, rankType]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取玩家活动排名奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getPlayerActivityRankRewards = function(msg, session, next){
	var rankType = msg.rankType;
	if(!_.contains(DataUtils.getActivityTypes(), rankType)){
		var e = new Error("rankType 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	this.request(session, 'getPlayerActivityRankRewards', [session.uid, rankType]).then(function(playerData){
		next(null, {code:200, playerData:playerData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取我的墨子信息
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.getMyModData = function(msg, session, next){
	this.request(session, 'getMyModData', [session.uid]).then(function(modData){
		next(null, {code:200, modData:modData})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取被禁言列表
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.getMutedPlayerList = function(msg, session, next){
	this.request(session, 'getMutedPlayerList', [session.uid]).then(function(docs){
		next(null, {code:200, datas:docs})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 禁言玩家
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.mutePlayer = function(msg, session, next){
	var self = this;
	var targetPlayerId = msg.targetPlayerId;
	var muteMinutes = msg.muteMinutes;
	var muteReason = msg.muteReason;
	var e = null
	if(!_.isString(targetPlayerId) || !ShortId.isValid(targetPlayerId)){
		e = new Error("targetPlayerId 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isNumber(muteMinutes) || muteMinutes % 1 !== 0 || muteMinutes < 5 || muteMinutes > (60 * 6)){
		e = new Error("muteMinutes 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isString(muteReason) || muteReason.trim().length === 0){
		e = new Error("muteReason 不合法")
		return next(e, ErrorUtils.getError(e))
	}

	self.app.get('Player').findById(targetPlayerId, 'serverId').then(function(doc){
		if(!_.isObject(doc)){
			return Promise.reject(ErrorUtils.playerNotExist(session.uid, targetPlayerId));
		}
		return self.request(session, 'mutePlayer', [session.uid, targetPlayerId, muteMinutes, muteReason], doc.serverId);
	}).then(function(){
		next(null, {code:200});
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 提前解禁玩家
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.unMutePlayer = function(msg, session, next){
	var self = this;
	var targetPlayerId = msg.targetPlayerId;
	var e = null
	if(!_.isString(targetPlayerId) || !ShortId.isValid(targetPlayerId)){
		e = new Error("targetPlayerId 不合法")
		return next(e, ErrorUtils.getError(e))
	}

	self.app.get('Player').findById(targetPlayerId, 'serverId').then(function(doc){
		if(!_.isObject(doc)){
			return Promise.reject(ErrorUtils.playerNotExist(session.uid, targetPlayerId));
		}
		return self.request(session, 'unMutePlayer', [session.uid, targetPlayerId], doc.serverId);
	}).then(function(){
		next(null, {code:200})
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 添加黑名单
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.addBlocked = function(msg, session, next){
	var memberId = msg.memberId;
	var memberName = msg.memberName;
	var memberIcon = msg.memberIcon;
	var e = null
	if(!_.isString(memberId) || !ShortId.isValid(memberId)){
		e = new Error("memberId 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isString(memberName) || memberName.trim().length === 0){
		e = new Error("memberName 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isNumber(memberIcon) || memberIcon % 1 !== 0 || memberIcon < 1 || memberIcon > 11){
		e = new Error("icon 不合法")
		next(e, ErrorUtils.getError(e))
		return
	}

	this.request(session, 'addBlocked', [session.uid, memberId, memberName, memberIcon]).then(function(playerData){
		next(null, {code:200, playerData:playerData});
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 禁言玩家
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.removeBlocked = function(msg, session, next){
	var memberId = msg.memberId;
	var e = null
	if(!_.isString(memberId) || !ShortId.isValid(memberId)){
		e = new Error("memberId 不合法")
		return next(e, ErrorUtils.getError(e))
	}

	this.request(session, 'removeBlocked', [session.uid, memberId]).then(function(playerData){
		next(null, {code:200, playerData:playerData});
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取游戏状态信息
 * @param msg
 * @param session
 * @param next
 */
pro.getGameInfo = function(msg, session, next){
	this.request(session, 'getGameInfo', [session.uid]).then(function(serverInfo){
		next(null, {code:200, serverInfo:serverInfo});
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 获取累计充值奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getTotalIAPRewards = function(msg, session, next){
	this.request(session, 'getTotalIAPRewards', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData});
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}

/**
 * 领取月卡每日奖励
 * @param msg
 * @param session
 * @param next
 */
pro.getMothcardRewards = function(msg, session, next){
	this.request(session, 'getMothcardRewards', [session.uid]).then(function(playerData){
		next(null, {code:200, playerData:playerData});
	}).catch(function(e){
		next(null, ErrorUtils.getError(e))
	})
}