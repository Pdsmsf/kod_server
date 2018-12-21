"use strict"

/**
 * Created by modun on 14-8-23.
 */

var Promise = require("bluebird")
var _ = require("underscore")

var Utils = require("../../../utils/utils")
var DataUtils = require("../../../utils/dataUtils")
var LogicUtils = require("../../../utils/logicUtils")
var ErrorUtils = require("../../../utils/errorUtils")
var Consts = require("../../../consts/consts")

var GameDatas = require("../../../datas/GameDatas")
var PlayerInitData = GameDatas.PlayerInitData
var Dragons = GameDatas.Dragons

module.exports = function(app){
	return new CommandRemote(app)
}

var CommandRemote = function(app){
	this.app = app
	this.serverId = app.getServerId()
	this.pushService = app.get("pushService")
	this.sessionService = app.get("backendSessionService")
	this.timeEventService = app.get("timeEventService")
	this.playerTimeEventService = app.get("playerTimeEventService")
	this.cacheService = app.get('cacheService')
}

var pro = CommandRemote.prototype

/**
 * 修改指定资源数量
 * @param playerId
 * @param name
 * @param count
 * @param callback
 */
pro.resources = function(playerId, name, count, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(_.isUndefined(playerDoc.resources[name])) return Promise.reject(new Error("资源不存在"))
		playerDoc.resources[name] = count
		DataUtils.refreshPlayerResources(playerDoc)
		playerData.push(["resources", playerDoc.resources])
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 设置建筑等级
 * @param playerId
 * @param location
 * @param level
 * @param callback
 */
pro.buildinglevel = function(playerId, location, level, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var building = playerDoc.buildings["location_" + location]
		if(!_.isObject(building)) return Promise.reject(new Error("建筑不存在"))
		building.level = level
		playerData.push(["buildings.location_" + building.location, building])
		var events = _.each(playerDoc.buildingEvents, function(event){
			return _.isEqual(event.type, building.type)
		})
		var funcs = []
		_.each(events, function(event){
			funcs.push(self.timeEventService.removePlayerTimeEventAsync(playerDoc, "buildingEvents", event.id))
		})
		LogicUtils.removeItemsInArray(playerDoc.buildingEvents, events)
		playerData.push(["buildingEvents", playerDoc.buildingEvents])
		return Promise.all(funcs)
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 清除玩家事件
 * @param playerId
 * @param eventType
 * @param callback
 */
pro.rmevents = function(playerId, eventType, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!_.isArray(playerDoc[eventType])) return Promise.reject(new Error("玩家事件类型不存在"))
		var funcs = []
		while(playerDoc[eventType].length > 0){
			var event = playerDoc[eventType].pop()
			funcs.push(self.timeEventService.removePlayerTimeEventAsync(playerDoc, eventType, event.id))
		}
		playerData.push([eventType, playerDoc[eventType]])
		return Promise.all(funcs)
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 统一修改玩家特殊材料数量
 * @param playerId
 * @param count
 * @param callback
 */
pro.soldiermaterial = function(playerId, count, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		playerDoc.soldierMaterials.deathHand = count
		playerDoc.soldierMaterials.heroBones = count
		playerDoc.soldierMaterials.soulStone = count
		playerDoc.soldierMaterials.magicBox = count
		playerDoc.soldierMaterials.confessionHood = count
		playerDoc.soldierMaterials.brightRing = count
		playerDoc.soldierMaterials.holyBook = count
		playerDoc.soldierMaterials.brightAlloy = count
		playerData.push(["soldierMaterials", playerDoc.soldierMaterials])
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 统一修改玩家制作龙装备的材料数量
 * @param playerId
 * @param count
 * @param callback
 */
pro.dragonmaterial = function(playerId, count, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		_.each(playerDoc.dragonMaterials, function(theCount, key){
			playerDoc.dragonMaterials[key] = count
		})
		playerData.push(["dragonMaterials", playerDoc.dragonMaterials])
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 统一修改玩家龙装备的数量
 * @param playerId
 * @param count
 * @param callback
 */
pro.dragonequipment = function(playerId, count, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		_.each(playerDoc.dragonEquipments, function(theCount, key){
			playerDoc.dragonEquipments[key] = count
		})
		playerData.push(["dragonEquipments", playerDoc.dragonEquipments])
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置士兵数量
 * @param playerId
 * @param count
 * @param callback
 */
pro.soldiers = function(playerId, count, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		_.each(playerDoc.soldiers, function(value, key){
			playerDoc.soldiers[key] = count
		})
		playerData.push(["soldiers", playerDoc.soldiers])
		DataUtils.refreshPlayerPower(playerDoc, playerData);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置伤兵数量
 * @param playerId
 * @param count
 * @param callback
 */
pro.woundedsoldiers = function(playerId, count, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		_.each(playerDoc.woundedSoldiers, function(value, key){
			playerDoc.woundedSoldiers[key] = count
		})
		playerData.push(["woundedSoldiers", playerDoc.woundedSoldiers])
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 修改指定龙的活力
 * @param playerId
 * @param dragonType
 * @param count
 * @param callback
 */
pro.dragonhp = function(playerId, dragonType, count, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var pushFuncs = []
	var eventFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var dragon = _.find(playerDoc.dragons, function(dragon){
			if(_.isEqual(dragon.type, dragonType)) return true
		})
		if(dragon && count >= 0){
			dragon.hp = count
			dragon.hpRefreshTime = Date.now()
			var deathEvent = null
			if(dragon.hp <= 0){
				deathEvent = DataUtils.createPlayerDragonDeathEvent(playerDoc, dragon)
				playerDoc.dragonDeathEvents.push(deathEvent)
				eventFuncs.push([self.timeEventService, self.timeEventService.addPlayerTimeEventAsync, playerDoc, "dragonDeathEvents", deathEvent.id, deathEvent.finishTime - Date.now()])
			}else{
				deathEvent = _.find(playerDoc.dragonDeathEvents, function(deathEvent){
					return _.isEqual(deathEvent.dragonType, dragon.type)
				})
				if(_.isObject(deathEvent)){
					LogicUtils.removeItemInArray(playerDoc.dragonDeathEvents, deathEvent)
					eventFuncs.push([self.timeEventService, self.timeEventService.removePlayerTimeEventAsync, playerDoc, "dragonDeathEvents", deathEvent.id])
				}
			}
			playerData.push(["dragonDeathEvents", playerDoc.dragonDeathEvents])
			playerData.push(["dragons." + dragon.type, dragon])
			pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
		}
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
 * 设置龙的技能的等级
 * @param playerId
 * @param dragonType
 * @param level
 * @param callback
 */
pro.dragonskill = function(playerId, dragonType, level, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var dragon = _.find(playerDoc.dragons, function(dragon){
			if(_.isEqual(dragon.type, dragonType)) return true
		})
		if(dragon && level >= 0){
			_.each(dragon.skills, function(skill){
				if(DataUtils.isDragonSkillUnlocked(dragon, skill.name)){
					var maxLevel = DataUtils.getDragonSkillMaxLevel(skill.name)
					skill.level = maxLevel > level ? level : maxLevel
				}
			})
		}
		playerData.push(["dragons." + dragon.type, dragon])
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置龙装备的星级
 * @param playerId
 * @param dragonType
 * @param star
 * @param callback
 */
pro.dragonequipmentstar = function(playerId, dragonType, star, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var dragon = _.find(playerDoc.dragons, function(dragon){
			if(_.isEqual(dragon.type, dragonType)) return true
		})
		if(dragon && star >= 0){
			_.each(dragon.equipments, function(equipment){
				if(!_.isEmpty(equipment.name)){
					var maxStar = DataUtils.getDragonEquipmentMaxStar(equipment.name)
					equipment.star = maxStar > star ? star : maxStar
				}
			})
		}
		playerData.push(["dragons." + dragon.type, dragon])
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置龙的星级
 * @param playerId
 * @param dragonType
 * @param star
 * @param callback
 */
pro.dragonstar = function(playerId, dragonType, star, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var dragon = playerDoc.dragons[dragonType]
		if(dragon && star >= 0 && star <= 5){
			var maxStar = DataUtils.getDragonMaxStar()
			dragon.star = maxStar > star ? star : maxStar
			_.each(dragon.equipments, function(equipment){
				equipment.name = ""
				equipment.star = 0
				equipment.exp = 0
				equipment.buffs = []
			})

			var maxLevel = Dragons.dragonStar[dragon.star].levelMax
			var minLevel = dragon.star == 1 ? 1 : Dragons.dragonStar[dragon.star - 1].levelMax + 1
			if(dragon.level > maxLevel) dragon.level = maxLevel
			if(dragon.level < minLevel) dragon.level = minLevel
			dragon.hp = DataUtils.getDragonMaxHp(dragon)
			dragon.hpRefreshTime = Date.now()
			playerData.push(["dragons." + dragon.type, dragon])
		}
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置龙的等级
 * @param playerId
 * @param dragonType
 * @param level
 * @param callback
 */
pro.dragonlevel = function(playerId, dragonType, level, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var dragon = playerDoc.dragons[dragonType]
		if(dragon){
			var maxLevel = Dragons.dragonStar[dragon.star].levelMax
			var minLevel = dragon.star == 1 ? 1 : Dragons.dragonStar[dragon.star - 1].levelMax + 1
			dragon.level = level > maxLevel ? maxLevel : level < minLevel ? minLevel : level
			dragon.hp = DataUtils.getDragonMaxHp(dragon)
			dragon.hpRefreshTime = Date.now()
		}
		playerData.push(["dragons." + dragon.type, dragon])
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置捐赠级别
 * @param playerId
 * @param donatelevel
 * @param callback
 */
pro.donatelevel = function(playerId, donatelevel, callback){
	var self = this
	var pushFuncs = []
	var playerDoc = null
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		_.each(playerDoc.allianceDonate, function(value, key){
			playerDoc.allianceDonate[key] = donatelevel
		})
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerDoc])
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置联盟荣耀
 * @param playerId
 * @param honnour
 * @param callback
 */
pro.alliancehonour = function(playerId, honnour, callback){
	var self = this
	var pushFuncs = []
	var playerDoc = null
	var allianceDoc = null
	var allianceData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		if(!_.isString(doc.allianceId)){
			return Promise.reject(new Error("玩家未加入联盟"))
		}
		playerDoc = doc
		return self.cacheService.findAllianceAsync(playerDoc.allianceId)
	}).then(function(doc){
		allianceDoc = doc
		allianceDoc.basicInfo.honour = honnour
		allianceData.push(["basicInfo", allianceDoc.basicInfo])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置联盟感知力
 * @param playerId
 * @param perception
 * @param callback
 */
pro.allianceperception = function(playerId, perception, callback){
	var self = this
	var pushFuncs = []
	var playerDoc = null
	var allianceDoc = null
	var allianceData = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		if(!_.isString(doc.allianceId)){
			return Promise.reject(new Error("玩家未加入联盟"))
		}
		playerDoc = doc
		return self.cacheService.findAllianceAsync(playerDoc.allianceId)
	}).then(function(doc){
		allianceDoc = doc
		allianceDoc.basicInfo.perception = perception
		allianceDoc.basicInfo.perceptionRefreshTime = Date.now()
		allianceData.push(["basicInfo", allianceDoc.basicInfo])
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置玩家等级
 * @param playerId
 * @param level
 * @param callback
 */
pro.playerlevel = function(playerId, level, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		playerDoc.basicInfo.levelExp = PlayerInitData.playerLevel[level].expFrom
		playerData.push(["basicInfo", playerDoc.basicInfo])
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 清除所有玩家的GC
 * @param playerId
 * @param callback
 */
pro.cleargc = function(playerId, callback){
	var playerDoc = null
	var kickPlayer = Promise.promisify(this.sessionService.kickByUid, {context:this})
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		playerDoc.gcId = null
	}).then(function(){
		callback()
	}).then(function(){
		kickPlayer(playerDoc.logicServerId, playerDoc._id)
	})
}

/**
 * 显示在线玩家数量
 * @param playerId
 * @param callback
 */
pro.online = function(playerId, callback){
	callback(null, '当前在线:' + this.app.get('onlineCount'))
}

/**
 * 修改道具Buff时间
 * @param playerId
 * @param seconds
 * @param callback
 */
pro.vipevents = function(playerId, seconds, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var eventFuncs = []
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var event = playerDoc.vipEvents[0]
		if(!_.isObject(event)) return Promise.reject(new Error('事件不存在'))
		event.finishTime = Date.now() + (seconds * 1000);
		playerData.push(['vipEvents.' + playerDoc.vipEvents.indexOf(event) + '.finishTime', event.finishTime]);
		eventFuncs.push([self.timeEventService, self.timeEventService.updatePlayerTimeEventAsync, playerDoc, 'vipEvents', event.id, (seconds * 1000)])
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
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
 * 修改军事科技等级
 * @param playerId
 * @param techName
 * @param techLevel
 * @param callback
 */
pro.militarytech = function(playerId, techName, techLevel, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var eventFuncs = []
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!playerDoc.militaryTechs[techName]) return Promise.reject(new Error('科技不存在'));
		playerDoc.militaryTechs[techName].level = techLevel;
		playerData.push(['militaryTechs.' + techName + '.level', playerDoc.militaryTechs[techName].level]);
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
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
 * 修改生产科技等级
 * @param playerId
 * @param techName
 * @param techLevel
 * @param callback
 */
pro.productiontech = function(playerId, techName, techLevel, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var eventFuncs = []
	var pushFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!playerDoc.productionTechs[techName]) return Promise.reject(new Error('科技不存在'));
		playerDoc.productionTechs[techName].level = techLevel;
		playerData.push(['productionTechs.' + techName + '.level', playerDoc.productionTechs[techName].level]);
		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, playerDoc, playerData])
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