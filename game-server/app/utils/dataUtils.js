"use strict"

/**
 * 和读取配置文件相关工具方法写在这里
 * Created by modun on 14-8-6.
 */

var _ = require("underscore")
var ShortId = require("shortid")

var Consts = require("../consts/consts")
var CommonUtils = require("./utils")
var MapUtils = require("./mapUtils")
var LogicUtils = require("./logicUtils")
var TaskUtils = require("./taskUtils")

var GameDatas = require("../datas/GameDatas")

var BuildingLevelUp = GameDatas.BuildingLevelUp
var BuildingFunction = GameDatas.BuildingFunction
var HouseLevelUp = GameDatas.HouseLevelUp
var HouseReturn = GameDatas.HouseReturn
var HouseFunction = GameDatas.HouseFunction
var GemsPayment = GameDatas.GemsPayment
var Houses = GameDatas.Houses
var Buildings = GameDatas.Buildings
var PlayerInitData = GameDatas.PlayerInitData
var Soldiers = GameDatas.Soldiers
var DragonEquipments = GameDatas.DragonEquipments
var Dragons = GameDatas.Dragons
var AllianceInitData = GameDatas.AllianceInitData
var AllianceRight = AllianceInitData.right
var AllianceBuilding = GameDatas.AllianceBuilding
var AllianceVillage = GameDatas.AllianceVillage
var DailyQuests = GameDatas.DailyQuests
var ProductionTechs = GameDatas.ProductionTechs
var ProductionTechLevelUp = GameDatas.ProductionTechLevelUp
var MilitaryTechs = GameDatas.MilitaryTechs
var MilitaryTechLevelUp = GameDatas.MilitaryTechLevelUp
var Items = GameDatas.Items
var KillDropItems = GameDatas.KillDropItems
var Gacha = GameDatas.Gacha
var Activities = GameDatas.Activities
var StoreItems = GameDatas.StoreItems
var GrowUpTasks = GameDatas.GrowUpTasks
var Vip = GameDatas.Vip
var Localizations = GameDatas.Localizations
var PvE = GameDatas.PvE;
var AllianceMap = GameDatas.AllianceMap;
var DragonSkills = GameDatas.DragonSkills;
var ScheduleActivities = GameDatas.ScheduleActivities;


var Utils = module.exports

/**
 * 购买资源
 * @param playerDoc
 * @param need
 * @param has
 * @returns {{gemUsed: number, totalBuy: {}}}
 */
Utils.buyResources = function(playerDoc, need, has){
	var self = this
	var gemUsed = 0
	var totalBuy = {}
	var i = null
	var item = null
	_.each(need, function(value, key){
		var config = GemsPayment[key]
		var required = _.isNumber(has[key]) ? value - has[key] : value
		if(required > 0){
			var currentBuy = 0
			if(_.isEqual(key, "citizen")){
				var freeCitizenLimit = self.getPlayerFreeCitizenLimit(playerDoc)
				if(freeCitizenLimit <= 0){
					freeCitizenLimit = 1;
				}
				while(required > 0){
					var requiredPercent = required / freeCitizenLimit
					for(i = config.length - 1; i >= 1; i--){
						item = config[i]
						if(item.min < requiredPercent){
							gemUsed += item.gem
							var citizenBuyed = Math.ceil(item.resource * freeCitizenLimit)
							required -= citizenBuyed
							currentBuy += citizenBuyed
							break
						}
					}
				}
			}else{
				while(required > 0){
					for(i = config.length - 1; i >= 1; i--){
						item = config[i]
						if(item.min < required){
							gemUsed += item.gem
							required -= item.resource
							currentBuy += item.resource
							break
						}
					}
				}
			}
			totalBuy[key] = currentBuy
		}
	})

	return {gemUsed:gemUsed, totalBuy:totalBuy}
}

/**
 * 购买材料
 * @param need
 * @param has
 */
Utils.buyMaterials = function(need, has){
	var gemUsed = 0
	var totalBuy = {}
	var config = GemsPayment.material[1]
	_.each(need, function(value, key){
		var required = null
		if(_.isNumber(has[key])){
			required = has[key] - value
		}else{
			required = -value
		}
		required = -required
		if(required > 0){
			gemUsed += config[key] * required
			totalBuy[key] = required
		}
	})
	return {gemUsed:gemUsed, totalBuy:totalBuy}
}

/**
 * 根据所缺时间换算成宝石,并返回宝石数量
 * @param interval
 * @returns {number}
 */
Utils.getGemByTimeInterval = function(interval){
	var gem = 0
	var config = GemsPayment.time
	while(interval > 0){
		for(var i = config.length - 1; i >= 0; i--){
			var item = config[i]
			if(!_.isObject(item)) continue
			if(item.min < interval){
				gem += item.gem
				interval -= item.speedup
				break
			}
		}
	}
	return gem
}

/**
 * 根据消费的宝石获取加速的时间
 * @param gem
 * @returns {*}
 */
Utils.getTimeIntervalByGem = function(gem){
	var interval = 0;
	var config = GemsPayment.time
	while(gem > 0){
		for(var i = config.length - 1; i >= 0; i--){
			var item = config[i]
			if(!_.isObject(item)) continue
			if(item.gem <= gem){
				interval += item.speedup;
				gem -= item.gem;
				break
			}
		}
	}
	return interval
}

/**
 * 获取建筑升级时,需要的资源和道具
 * @param playerDoc
 * @param buildingType
 * @param buildingLevel
 * @returns {{resources: {wood: *, stone: *, iron: *, citizen: *}, materials: {blueprints: *, tools: *, tiles: *, pulley: *}, buildTime: *}}
 */
Utils.getPlayerBuildingUpgradeRequired = function(playerDoc, buildingType, buildingLevel){
	var buildingTimeBuff = this.getPlayerProductionTechBuff(playerDoc, "crane")
	var config = BuildingLevelUp[buildingType][buildingLevel]
	var required = {
		resources:{
			wood:config.wood,
			stone:config.stone,
			iron:config.iron
		},
		materials:{
			blueprints:config.blueprints,
			tools:config.tools,
			tiles:config.tiles,
			pulley:config.pulley
		},
		buildTime:LogicUtils.getTimeEfffect(config.buildTime, buildingTimeBuff)
	}

	return required
}

/**
 * 获取生产科技升级时,需要的资源和道具
 * @param playerDoc
 * @param techName
 * @param techLevel
 * @returns {{resources: {coin: *}, materials: {blueprints: *, tools: *, tiles: *, pulley: *}, buildTime: *}}
 */
Utils.getPlayerProductionTechUpgradeRequired = function(playerDoc, techName, techLevel){
	var config = ProductionTechLevelUp[techName][techLevel]
	var building = playerDoc.buildings.location_7
	var buildTime = null
	if(building.level > 0){
		var buildingConfig = BuildingFunction[building.type][building.level]
		buildTime = LogicUtils.getTimeEfffect(config.buildTime, buildingConfig.efficiency)
	}else{
		buildTime = config.buildTime
	}

	var required = {
		resources:{
			coin:config.coin
		},
		materials:{
			blueprints:config.blueprints,
			tools:config.tools,
			tiles:config.tiles,
			pulley:config.pulley
		},
		buildTime:buildTime
	}

	return required
}

/**
 * 获取军事科技升级时,需要的资源和道具
 * @param playerDoc
 * @param techName
 * @param techLevel
 * @returns {{resources: {coin: *}, materials: {trainingFigure: *, bowTarget: *, saddle: *, ironPart: *}, buildTime: *}}
 */
Utils.getPlayerMilitaryTechUpgradeRequired = function(playerDoc, techName, techLevel){
	var config = MilitaryTechLevelUp[techName][techLevel]
	var building = playerDoc.buildings.location_7
	var buildTime = null
	if(building.level > 0){
		var buildingConfig = BuildingFunction[building.type][building.level]
		buildTime = LogicUtils.getTimeEfffect(config.buildTime, buildingConfig.efficiency)
	}else{
		buildTime = config.buildTime
	}

	var required = {
		resources:{
			coin:config.coin
		},
		materials:{
			trainingFigure:config.trainingFigure,
			bowTarget:config.bowTarget,
			saddle:config.saddle,
			ironPart:config.ironPart
		},
		buildTime:buildTime
	}

	return required
}

/**
 * 获取士兵升级所需资源
 * @param soldierName
 * @param star
 * @returns {{resources: {coin: *}, buildTime: *}}
 */
Utils.getSoldierStarUpgradeRequired = function(soldierName, star){
	var config = Soldiers.normal[soldierName + "_" + star]
	var required = {
		resources:{
			coin:config.upgradeCoinNeed
		},
		upgradeTime:config.upgradeTimeSecondsNeed
	}

	return required
}

/**
 * 获取小屋升级时,需要的资源和道具
 * @param playerDoc
 * @param houseType
 * @param houseLevel
 * @returns {{resources: {wood: *, stone: *, iron: *, citizen: *}, materials: {blueprints: *, tools: *, tiles: *, pulley: *}, buildTime: *}}
 */
Utils.getPlayerHouseUpgradeRequired = function(playerDoc, houseType, houseLevel){
	var buildingTimeBuff = this.getPlayerProductionTechBuff(playerDoc, "crane")
	var houseUsedCitizen = this.getHouseUsedCitizen(houseType, houseLevel - 1)
	var config = HouseLevelUp[houseType][houseLevel]
	var required = {
		resources:{
			wood:config.wood,
			stone:config.stone,
			iron:config.iron,
			citizen:config.citizen - houseUsedCitizen
		},
		materials:{
			blueprints:config.blueprints,
			tools:config.tools,
			tiles:config.tiles,
			pulley:config.pulley
		},
		buildTime:LogicUtils.getTimeEfffect(config.buildTime, buildingTimeBuff)
	}

	return required
}

/**
 * 拆除小屋时,返还的资源
 * @param houseType
 * @param houseLevel
 * @returns {{wood: *, stone: *, iron: *, citizen: *}}
 */
Utils.getHouseDestroyReturned = function(houseType, houseLevel){
	var config = HouseReturn[houseType][houseLevel]
	var returned = {
		wood:config.wood,
		stone:config.stone,
		iron:config.iron,
		citizen:config.citizen
	}

	return returned
}

/**
 * 建筑是否达到最高等级
 * @param buildingLevel
 * @returns {boolean}
 */
Utils.isBuildingReachMaxLevel = function(buildingLevel){
	return buildingLevel >= PlayerInitData.intInit.buildingMaxLevel.value
}

/**
 * 获取建筑最高等级
 * @param buildingType
 * @returns {*}
 */
Utils.getBuildingMaxLevel = function(buildingType){
	var configs = BuildingLevelUp[buildingType]
	var config = configs[configs.length - 1]
	return config.level
}

/**
 * 建筑是否达到最高等级
 * @param houseType
 * @param houseLevel
 * @returns {boolean}
 */
Utils.isHouseReachMaxLevel = function(houseType, houseLevel){
	var config = HouseLevelUp[houseType][houseLevel + 1]
	return !_.isObject(config)
}

/**
 * 获取小屋最高等级
 * @param houseType
 * @returns {*}
 */
Utils.getHouseMaxLevel = function(houseType){
	var configs = HouseLevelUp[houseType]
	var config = configs[configs.length - 1]
	return config.level
}

/**
 * 获取小屋尺寸
 * @param houseType
 * @returns {{width: *, height: *}}
 */
Utils.getHouseSize = function(houseType){
	var config = Houses.houses[houseType]
	return {width:config.width, height:config.height}
}

/**
 * 检查小屋类型是否存在
 * @param houseType
 * @returns {*}
 */
Utils.isHouseTypeExist = function(houseType){
	return _.isObject(Houses.houses[houseType])
}

/**
 * 检查大型建筑周围是否允许建造小建筑
 * @param buildingLocation
 * @returns {hasHouse|*}
 */
Utils.isBuildingHasHouse = function(buildingLocation){
	var config = Buildings.buildings[buildingLocation]
	return config.hasHouse
}

/**
 * 刷新玩家资源数据
 * @param playerDoc
 */
Utils.refreshPlayerResources = function(playerDoc){
	var self = this
	_.each(playerDoc.resources, function(value, key){
		if(_.isEqual(key, "food")){
			playerDoc.resources[key] = self.getPlayerFood(playerDoc)
		}else if(_.contains(Consts.BasicResource, key)){
			playerDoc.resources[key] = self.getPlayerResource(playerDoc, key)
		}else if(_.isEqual(key, "coin")){
			playerDoc.resources[key] = self.getPlayerCoin(playerDoc)
		}else if(_.isEqual("citizen", key)){
			playerDoc.resources[key] = self.getPlayerCitizen(playerDoc)
		}else if(_.isEqual("wallHp", key)){
			playerDoc.resources[key] = self.getPlayerWallHp(playerDoc)
		}else if(_.isEqual("cart", key)){
			playerDoc.resources[key] = self.getPlayerCart(playerDoc)
		}else if(_.isEqual("stamina", key)){
			playerDoc.resources[key] = self.getPlayerStamina(playerDoc)
		}
	})
	playerDoc.resources.refreshTime = Date.now()
}

/**
 * 获取玩家基础资源数据
 * @param playerDoc
 * @param resourceName
 * @returns {*}
 */
Utils.getPlayerResource = function(playerDoc, resourceName){
	var resourceLimit = this.getPlayerResourceUpLimit(playerDoc, resourceName)
	if(resourceLimit <= playerDoc.resources[resourceName]){
		return playerDoc.resources[resourceName]
	}

	var houseType = this.getHouseTypeByResourceName(resourceName)
	var houses = LogicUtils.getPlayerHousesByType(playerDoc, houseType)
	var totalPerHour = 0
	_.each(houses, function(house){
		if(house.level > 0){
			var config = HouseFunction[house.type][house.level]
			totalPerHour += config.production
		}
	})

	var totalPerSecond = totalPerHour / 60 / 60
	var totalSecond = (Date.now() - playerDoc.resources.refreshTime) / 1000
	var itemKey = resourceName + "Bonus"
	var itemBuff = this.isPlayerHasItemEvent(playerDoc, itemKey) ? Items.buffTypes[itemKey].effect1 : 0
	var techBuff = this.getPlayerProductionTechBuff(playerDoc, Consts.ResourceTechNameMap[resourceName])
	var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0][resourceName + "ProductionAdd"]
	var buildingBuff = LogicUtils.getPlayerResourceBuildingBuff(playerDoc, resourceName);
	var terrainBuff = this.getPlayerTerrainResourceBuff(playerDoc, resourceName);
	var output = Math.floor(totalSecond * totalPerSecond * (1 + itemBuff + techBuff + buildingBuff + vipBuff + terrainBuff));
	var totalResource = playerDoc.resources[resourceName] + output
	if(totalResource > resourceLimit) totalResource = resourceLimit
	if(totalResource < 0) totalResource = 0;
	return totalResource
}

/**
 * 获取玩家银币
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerCoin = function(playerDoc){
	var resourceName = "coin"
	var houses = LogicUtils.getPlayerHousesByType(playerDoc, "dwelling")
	var totalPerHour = 0
	_.each(houses, function(house){
		if(house.level > 0){
			var config = HouseFunction[house.type][house.level]
			totalPerHour += config.production
		}
	})

	var totalPerSecond = totalPerHour / 60 / 60
	var totalSecond = (Date.now() - playerDoc.resources.refreshTime) / 1000
	var itemKey = resourceName + "Bonus"
	var itemBuff = this.isPlayerHasItemEvent(playerDoc, itemKey) ? Items.buffTypes[itemKey].effect1 : 0
	var buildingBuff = LogicUtils.getPlayerResourceBuildingBuff(playerDoc, resourceName)
	var techBuff = this.getPlayerProductionTechBuff(playerDoc, 'mintedCoin');
	var output = Math.floor(totalSecond * totalPerSecond * (1 + itemBuff + buildingBuff + techBuff));
	var totalResource = playerDoc.resources[resourceName] + output
	if(totalResource < 0) totalResource = 0;
	return totalResource
}

/**
 * 获取玩家士兵的消耗
 * @param playerDoc
 * @param time
 * @returns {number}
 */
Utils.getPlayerSoldiersFoodConsumed = function(playerDoc, time){
	var self = this
	var consumed = 0
	_.each(playerDoc.soldiers, function(count, soldierName){
		var config = self.getPlayerSoldierConfig(playerDoc, soldierName)
		consumed += config.consumeFoodPerHour * count
	})
	if(!!playerDoc.defenceTroop){
		_.each(playerDoc.defenceTroop.soldiers, function(soldier){
			var soldierName = soldier.name;
			var count = soldier.count;
			var config = self.getPlayerSoldierConfig(playerDoc, soldierName)
			consumed += config.consumeFoodPerHour * count
		})
	}

	var itemBuff = this.isPlayerHasItemEvent(playerDoc, "quarterMaster") ? Items.buffTypes.quarterMaster.effect1 : 0
	var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0].soldierConsumeSub
	return Math.ceil(consumed * time / 1000 / 60 / 60 * (1 - itemBuff - vipBuff))
}

/**
 * 获取玩家粮食数量
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerFood = function(playerDoc){
	var resourceName = "food"
	var resourceLimit = this.getPlayerResourceUpLimit(playerDoc, resourceName)
	var houseType = this.getHouseTypeByResourceName(resourceName)
	var houses = LogicUtils.getPlayerHousesByType(playerDoc, houseType)
	var totalPerHour = 0
	_.each(houses, function(house){
		if(house.level > 0){
			var config = HouseFunction[house.type][house.level]
			totalPerHour += config.production
		}
	})

	var totalPerSecond = totalPerHour / 60 / 60
	var totalTime = Date.now() - playerDoc.resources.refreshTime
	var soldierConsumed = this.getPlayerSoldiersFoodConsumed(playerDoc, totalTime)
	if(playerDoc.resources[resourceName] - soldierConsumed >= resourceLimit){
		return playerDoc.resources[resourceName] - soldierConsumed
	}else{
		var totalSecond = totalTime / 1000
		var itemKey = resourceName + "Bonus"
		var itemBuff = this.isPlayerHasItemEvent(playerDoc, itemKey) ? Items.buffTypes[itemKey].effect1 : 0
		var techBuff = this.getPlayerProductionTechBuff(playerDoc, Consts.ResourceTechNameMap[resourceName])
		var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0][resourceName + "ProductionAdd"]
		var buildingBuff = LogicUtils.getPlayerResourceBuildingBuff(playerDoc, resourceName)
		var terrainBuff = this.getPlayerTerrainResourceBuff(playerDoc, resourceName);
		var output = Math.floor(totalSecond * totalPerSecond * (1 + itemBuff + techBuff + buildingBuff + vipBuff + terrainBuff))
		var totalResource = playerDoc.resources[resourceName] + output - soldierConsumed
		if(totalResource > resourceLimit) totalResource = resourceLimit
		else if(totalResource < 0) totalResource = 0
		return totalResource
	}
}

/**
 * 获取玩家可用城民数据
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerCitizen = function(playerDoc){
	var itemCityzenMaxCountBuff = this.getPlayerProductionTechBuff(playerDoc, "beerSupply")
	var citizenLimit = Math.floor(this.getPlayerCitizenUpLimit(playerDoc) * (1 + itemCityzenMaxCountBuff))
	var usedCitizen = this.getPlayerUsedCitizen(playerDoc)
	if(citizenLimit <= playerDoc.resources.citizen + usedCitizen){
		return citizenLimit - usedCitizen
	}

	var totalPerHour = (citizenLimit - usedCitizen) / PlayerInitData.intInit.playerCitizenRecoverFullNeedHours.value
	var totalPerSecond = totalPerHour / 60 / 60
	var totalSecond = (Date.now() - playerDoc.resources.refreshTime) / 1000
	var itemCitizenRecoverBuff = this.isPlayerHasItemEvent(playerDoc, "citizenBonus") ? Items.buffTypes["citizenBonus"].effect1 : 0
	var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0].citizenRecoveryAdd
	var output = Math.floor(totalSecond * totalPerSecond * (1 + itemCitizenRecoverBuff + vipBuff))
	var totalCitizen = playerDoc.resources.citizen + output
	if(totalCitizen - usedCitizen > citizenLimit) totalCitizen = citizenLimit - usedCitizen
	return totalCitizen
}

/**
 * 获取玩家空闲城民上限
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerFreeCitizenLimit = function(playerDoc){
	var itemCityzenMaxCountBuff = this.getPlayerProductionTechBuff(playerDoc, "beerSupply")
	var citizenLimit = Math.floor(this.getPlayerCitizenUpLimit(playerDoc) * (1 + itemCityzenMaxCountBuff))
	var usedCitizen = this.getPlayerUsedCitizen(playerDoc)
	return citizenLimit - usedCitizen
}

/**
 * 获取玩家运输小车数量
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerCart = function(playerDoc){
	var building = playerDoc.buildings.location_14
	if(building.level < 1) return playerDoc.resources["cart"]

	var config = BuildingFunction.tradeGuild[building.level]
	var cartLimit = Math.ceil(config.maxCart * (1 + this.getPlayerProductionTechBuff(playerDoc, 'logistics')))
	if(cartLimit <= playerDoc.resources["cart"]){
		return playerDoc.resources["cart"]
	}

	var totalPerSecond = config.cartRecovery / 60 / 60
	var totalSecond = (Date.now() - playerDoc.resources.refreshTime) / 1000
	var output = Math.floor(totalSecond * totalPerSecond)
	var totalCart = playerDoc.resources["cart"] + output
	return totalCart > cartLimit ? cartLimit : totalCart
}

/**
 * 获取玩家精力数据
 * @param playerDoc
 * @returns {intInit.staminaMax|*}
 */
Utils.getPlayerStamina = function(playerDoc){
	var staminaRecoverPerHour = PlayerInitData.intInit.staminaRecoverPerHour.value
	var staminaMax = PlayerInitData.intInit.staminaMax.value
	if(staminaMax <= playerDoc.resources["stamina"]){
		return playerDoc.resources["stamina"]
	}

	var totalPerSecond = staminaRecoverPerHour / 60 / 60
	var totalSecond = (Date.now() - playerDoc.resources.refreshTime) / 1000
	var output = totalSecond * totalPerSecond;
	var totalStamina = Number((playerDoc.resources["stamina"] + output).toFixed(4));
	return totalStamina > staminaMax ? staminaMax : totalStamina
}

/**
 * 获取玩家资源上限信息
 * @param playerDoc
 * @param resourceName
 * @returns {number}
 */
Utils.getPlayerResourceUpLimit = function(playerDoc, resourceName){
	var building = LogicUtils.getPlayerBuildingByType(playerDoc, "warehouse")
	var totalUpLimit = 0
	if(building.level >= 1){
		var config = BuildingFunction["warehouse"][building.level]
		resourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
		resourceName = "max" + resourceName
		totalUpLimit += config[resourceName]
	}

	return totalUpLimit
}

/**
 * 获取玩家城民上限信息
 * @returns {number}
 */
Utils.getPlayerCitizenUpLimit = function(playerDoc){
	var houses = LogicUtils.getPlayerHousesByType(playerDoc, "dwelling")
	var totalUpLimit = this.getPlayerIntInit("initCitizen")
	_.each(houses, function(house){
		if(house.level > 0){
			var config = HouseFunction["dwelling"][house.level]
			totalUpLimit += config.citizen
		}
	})
	return totalUpLimit
}

/**
 * 获取已经占用的城民
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerUsedCitizen = function(playerDoc){
	var used = 0
	_.each(playerDoc.buildings, function(building){
		_.each(building.houses, function(house){
			var houseLevel = LogicUtils.hasHouseEvents(playerDoc, building.location, house.location) ? house.level + 1 : house.level
			var config = HouseLevelUp[house.type][houseLevel]
			used += config.citizen
		})
	})
	return used
}

/**
 * 获取指定建筑占用的城民
 * @param houseType
 * @param houseLevel
 * @returns {number}
 */
Utils.getHouseUsedCitizen = function(houseType, houseLevel){
	if(houseLevel > 0){
		return HouseLevelUp[houseType][houseLevel].citizen
	}
	return 0
}

/**
 * 获取玩家城墙血量
 * @param playerDoc
 */
Utils.getPlayerWallHp = function(playerDoc){
	var building = playerDoc.buildings.location_21
	if(building.level < 1) return playerDoc.resources["wallHp"]

	var config = BuildingFunction.wall[building.level]
	var hpLimit = config.wallHp
	if(hpLimit <= playerDoc.resources["wallHp"]){
		return hpLimit
	}

	var totalPerSecond = config.wallRecovery / 60 / 60
	var totalSecond = (Date.now() - playerDoc.resources.refreshTime) / 1000
	var techBuff = this.getPlayerProductionTechBuff(playerDoc, "fastFix")
	var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0].wallHpRecoveryAdd
	var output = Math.floor(totalSecond * totalPerSecond * (1 + techBuff + vipBuff))
	var totalHp = playerDoc.resources["wallHp"] + output
	if(totalHp < 1){
		totalHp = 1;
	}
	return totalHp > hpLimit ? hpLimit : totalHp
}

/**
 * 根据资源名称获取生产此资源的小屋类型
 * @param resourceName
 * @returns {*}
 */
Utils.getHouseTypeByResourceName = function(resourceName){
	var houseType = null
	_.each(Houses.houses, function(house){
		if(_.isEqual(resourceName, house.output)){
			houseType = house.type
		}
	})

	return houseType
}

/**
 * 根据小屋类型获取产出资源名称
 * @param houseType
 * @returns {houses.dwelling.output|*|houses.woodcutter.output|houses.farmer.output|houses.quarrier.output|houses.miner.output}
 */
Utils.getResourceNameByHouseType = function(houseType){
	return Houses.houses[houseType].output
}

/**
 * 获取住宅城民上限
 * @param houseLevel
 * @returns {citizen|*}
 */
Utils.getDwellingPopulationByLevel = function(houseLevel){
	if(houseLevel > 0){
		var config = HouseFunction["dwelling"][houseLevel]
		return config.citizen
	}
	return 0
}

/**
 * 获取建筑数量
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerBuildingsCount = function(playerDoc){
	var buildings = _.filter(playerDoc.buildings, function(building){
		return building.location <= 20 &&
			(building.level > 0 || (building.level == 0 && LogicUtils.hasBuildingEvents(playerDoc, building.location)))
	})
	return buildings.length
}

/**
 * 获取可建建筑总数量
 * @param playerDoc
 * @returns {unlock|*}
 */
Utils.getPlayerMaxBuildingsCount = function(playerDoc){
	var building = playerDoc.buildings.location_1
	var config = BuildingFunction[building.type][building.level]
	return config.unlock
}

/**
 * 获取可造建筑数量
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerFreeBuildingsCount = function(playerDoc){
	return this.getPlayerMaxBuildingsCount(playerDoc) - this.getPlayerBuildingsCount(playerDoc)
}

/**
 * 获取材料仓库单个材料上限
 * @param playerDoc
 * @param materialType
 * @returns {number}
 */
Utils.getMaterialUpLimit = function(playerDoc, materialType){
	var building = LogicUtils.getPlayerBuildingByType(playerDoc, "materialDepot")
	var totalUpLimit = 0
	if(building.level >= 1){
		var config = BuildingFunction["materialDepot"][building.level]
		totalUpLimit += config[materialType]
	}

	return totalUpLimit
}

/**
 * 获取制造材料所需的资源
 * @param playerDoc
 * @param type
 * @param toolShopLevel
 * @returns {{}}
 */
Utils.getMakeMaterialRequired = function(playerDoc, type, toolShopLevel){
	var required = {}
	var config = BuildingFunction["toolShop"][toolShopLevel]
	var buildTime = null;
	if(_.isEqual(Consts.MaterialType.BuildingMaterials, type)){
		required.resources = {
			wood:config.productBmWood,
			stone:config.productBmStone,
			iron:config.productBmIron
		}
		buildTime = config.productBmtime
	}else if(_.isEqual(Consts.MaterialType.TechnologyMaterials, type)){
		required.resources = {
			wood:config.productAmWood,
			stone:config.productAmStone,
			iron:config.productAmIron
		}
		buildTime = config.productAmtime
	}
	buildTime = Math.ceil(buildTime * (1 - this.getPlayerProductionTechBuff(playerDoc, 'sketching')));
	required.buildTime = buildTime;
	return required
}

/**
 * 产生制作材料的事件
 * @param toolShop
 * @param type
 * @param buildTime
 * @param finishNow
 */
Utils.createMaterialEvent = function(toolShop, type, buildTime, finishNow){
	var typeConfig = {}
	typeConfig[Consts.MaterialType.BuildingMaterials] = [
		"blueprints", "tools", "tiles", "pulley"
	]
	typeConfig[Consts.MaterialType.TechnologyMaterials] = [
		"trainingFigure", "bowTarget", "saddle", "ironPart"
	]

	var config = BuildingFunction["toolShop"][toolShop.level];
	var production = config.production;
	var materialTypeCount = config.productionType;
	var materialTypes = CommonUtils.shuffle(typeConfig[type]);
	materialTypes.length = materialTypeCount;
	var materials = {};
	while(production > 0){
		var name = _.sample(materialTypes);
		var count = _.random(1, production);
		if(!_.isObject(materials[name])) materials[name] = {name:name, count:0};
		materials[name].count += count;
		production -= count;
	}

	var event = {
		id:ShortId.generate(),
		type:type,
		materials:_.values(materials),
		startTime:Date.now(),
		finishTime:finishNow ? 0 : (Date.now() + (buildTime * 1000))
	}
	return event
}

/**
 * 刷新玩家兵力信息
 * @param playerDoc
 * @param playerData
 */
Utils.refreshPlayerPower = function(playerDoc, playerData){
	var buildingPower = this.getPlayerBuildingsPower(playerDoc)
	var housePower = this.getPlayerHousesPower(playerDoc)
	var soldierPower = this.getPlayerSoldiersPower(playerDoc)
	var techPower = this.getPlayerTechsPower(playerDoc)
	var totalPower = buildingPower + housePower + soldierPower + techPower

	playerDoc.basicInfo.power = totalPower
	playerData.push(["basicInfo.power", playerDoc.basicInfo.power])
}

/**
 * 获取玩家建筑和科技Power
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerBuildingAndTechPower = function(playerDoc){
	return this.getPlayerBuildingsPower(playerDoc) + this.getPlayerTechsPower(playerDoc);
}

/**
 * 获取建筑战斗力
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerBuildingsPower = function(playerDoc){
	var totalPower = 0
	_.each(playerDoc.buildings, function(building){
		if(building.level >= 1){
			var config = BuildingFunction[building.type][building.level]
			totalPower += config.power
		}
	})

	return totalPower
}

/**
 * 获取小屋战斗力
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerHousesPower = function(playerDoc){
	var totalPower = 0
	_.each(playerDoc.buildings, function(building){
		_.each(building.houses, function(house){
			if(house.level > 0){
				var config = HouseFunction[house.type][house.level]
				totalPower += config.power
			}
		})
	})

	return totalPower
}

/**
 * 获取士兵战斗力
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerSoldiersPower = function(playerDoc){
	var self = this
	var totalPower = 0
	_.each(playerDoc.soldiers, function(soldierCount, soldierName){
		var config = self.getPlayerSoldierConfig(playerDoc, soldierName)
		totalPower += config.power * soldierCount
	})
	_.each(playerDoc.troopsOut, function(troopOut){
		_.each(troopOut.soldiers, function(soldier){
			var config = self.getPlayerSoldierConfig(playerDoc, soldier.name);
			totalPower += config.power * soldier.count;
		})
	})

	return totalPower
}

/**
 * 获取玩家科技战斗力
 * @param playerDoc
 */
Utils.getPlayerTechsPower = function(playerDoc){
	var totalPower = 0
	_.each(playerDoc.productionTechs, function(tech, name){
		if(tech.level > 0)
			totalPower += ProductionTechLevelUp[name][tech.level].power;
	})
	_.each(playerDoc.militaryTechs, function(tech, name){
		if(tech.level > 0)
			totalPower += MilitaryTechLevelUp[name][tech.level].power;
	})
	return totalPower
}

/**
 * 获取玩家城堡等级
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerKeepLevel = function(playerDoc){
	return playerDoc.buildings.location_1.level
}

/**
 * 获取指定小屋最大建造数量
 * @param playerDoc
 * @param houseType
 * @returns {*}
 */
Utils.getPlayerHouseMaxCountByType = function(playerDoc, houseType){
	var limitBy = Consts.HouseBuildingMap[houseType]
	var totalCount = this.getPlayerIntInit('eachHouseInitCount');
	var buildings = LogicUtils.getPlayerBuildingsByType(playerDoc, limitBy)
	_.each(buildings, function(building){
		if(building.level >= 1){
			var buildingFunction = BuildingFunction[building.type][building.level]
			totalCount += buildingFunction.houseAdd
		}
	})

	return totalCount
}

/**
 * 获取生产建筑增加的额外资源小屋
 * @param playerDoc
 * @param buildingLocation
 * @returns {*}
 */
Utils.getPlayerBuildingAddedHouseCount = function(playerDoc, buildingLocation){
	var building = playerDoc.buildings["location_" + buildingLocation]
	if(building.level >= 1) return BuildingFunction[building.type][building.level].houseAdd
	return 0
}

/**
 * 获取指定小屋建造数量
 * @param playerDoc
 * @param houseType
 * @returns {number}
 */
Utils.getPlayerHouseCountByType = function(playerDoc, houseType){
	var count = 0
	_.each(playerDoc.buildings, function(building){
		_.each(building.houses, function(house){
			if(_.isEqual(houseType, house.type)){
				count += 1
			}
		})
	})

	return count
}

/**
 * 获取指定小屋可建造数量
 * @param playerDoc
 * @param houseType
 * @returns {number}
 */
Utils.getPlayerFreeHousesCount = function(playerDoc, houseType){
	var maxCount = this.getPlayerHouseMaxCountByType(playerDoc, houseType)
	var currentCount = this.getPlayerHouseCountByType(playerDoc, houseType)
	return maxCount - currentCount
}

/**
 * 是否有普通兵种
 * @param soldierName
 */
Utils.isNormalSoldier = function(soldierName){
	return !!Soldiers.normal[soldierName + '_1'];
}

/**
 * 是否有特殊兵种
 * @param soldierName
 * @returns {boolean}
 */
Utils.hasSpecialSoldier = function(soldierName){
	var keys = _.keys(Soldiers.special)
	return _.contains(keys, soldierName)
}

/**
 * 获取招募普通兵种所需的资源
 * @param playerDoc
 * @param soldierName
 * @param count
 * @returns {{resources: {wood: number, stone: number, iron: number, food: number}, recruitTime: (*|Array)}}
 */
Utils.getPlayerRecruitNormalSoldierRequired = function(playerDoc, soldierName, count){
	var config = this.getPlayerSoldierConfig(playerDoc, soldierName)
	var productionTechBuff = this.getPlayerProductionTechBuff(playerDoc, 'recruitment');
	var resources = {
		wood:Math.ceil(config.wood * count * (1 - productionTechBuff)),
		stone:Math.ceil(config.stone * count * (1 - productionTechBuff)),
		iron:Math.ceil(config.iron * count * (1 - productionTechBuff)),
		food:Math.ceil(config.food * count * (1 - productionTechBuff)),
		citizen:config.citizen * count
	}
	var totalNeed = {
		resources:resources,
		recruitTime:this.getPlayerRecruitSoldierTime(playerDoc, soldierName, count)
	}
	return totalNeed
}

/**
 * 获取招募特殊兵种所需的材料
 * @param playerDoc
 * @param soldierName
 * @param count
 * @returns {{materials: (*|Array), recruitTime: *}}
 */
Utils.getPlayerRecruitSpecialSoldierRequired = function(playerDoc, soldierName, count){
	var config = Soldiers.special[soldierName]
	var materialNames = config.specialMaterials.split(",")
	var materials = {}
	_.each(materialNames, function(value){
		var values = value.split("_")
		var materialName = values[0]
		var materialCount = parseInt(values[1])
		materials[materialName] = count * materialCount
	})
	var totalNeed = {
		materials:materials,
		recruitTime:this.getPlayerRecruitSoldierTime(playerDoc, soldierName, count),
		citizen:config.citizen * count
	}
	return totalNeed
}

/**
 * 获取招募士兵时需要的时间
 * @param playerDoc
 * @param soldierName
 * @param count
 * @returns {number}
 */
Utils.getPlayerRecruitSoldierTime = function(playerDoc, soldierName, count){
	var config = this.getPlayerSoldierConfig(playerDoc, soldierName)
	var buildingName = this.isNormalSoldier(soldierName) ? Soldiers.normal[soldierName + "_1"].techBuildingName : Soldiers.special[soldierName].techBuildingName
	var building = _.find(playerDoc.buildings, function(building){
		return _.isEqual(building.type, buildingName)
	})
	if(building.level > 0){
		var buildingConfig = BuildingFunction[building.type][building.level]
		var recruitTime = LogicUtils.getTimeEfffect(config.recruitTime * count, buildingConfig.efficiency)
		return recruitTime
	}else{
		return config.recruitTime * count
	}

}

/**
 * 获取士兵招募单次最大数量
 * @param playerDoc
 * @param soldierName
 * @returns {number}
 */
Utils.getPlayerSoldierMaxRecruitCount = function(playerDoc, soldierName){
	var building = playerDoc.buildings.location_5
	if(building.level < 1) return 0
	var config = BuildingFunction[building.type][building.level]
	var maxRecruit = config.maxRecruit
	var soldierConfig = this.getPlayerSoldierConfig(playerDoc, soldierName)
	var maxCount = Math.floor(maxRecruit / soldierConfig.citizen)
	return maxCount
}

/**
 * 龙装备是否存在
 * @param equipmentName
 * @returns {boolean}
 */
Utils.isDragonEquipment = function(equipmentName){
	var has = false
	_.each(DragonEquipments.equipments, function(value, key){
		if(_.isEqual(equipmentName, key)){
			has = true
		}
	})
	return has
}

/**
 * 获取龙装备制造需求
 * @param playerDoc
 * @param equipmentName
 * @returns {{}}
 */
Utils.getPlayerMakeDragonEquipmentRequired = function(playerDoc, equipmentName){
	var required = {}
	var config = DragonEquipments.equipments[equipmentName]
	var materialNameArray = config.materials.split(",")
	var materials = {}
	_.each(materialNameArray, function(materialName){
		var nameAndCountArray = materialName.split(":")
		materials[nameAndCountArray[0]] = Number(nameAndCountArray[1])
	})
	required.materials = materials
	required.coin = config.coin
	required.makeTime = this.getPlayerMakeDragonEquipmentTime(playerDoc, equipmentName)
	return required
}

/**
 * 获取龙装备制造时间
 * @param playerDoc
 * @param equipmentName
 * @returns {*}
 */
Utils.getPlayerMakeDragonEquipmentTime = function(playerDoc, equipmentName){
	var building = playerDoc.buildings.location_9
	var smithConfig = BuildingFunction[building.type][building.level]
	var dragonEquipmentConfig = DragonEquipments.equipments[equipmentName]
	var makeTime = dragonEquipmentConfig.makeTime
	return LogicUtils.getTimeEfffect(makeTime, smithConfig.efficiency)
}

/**
 * 是否还有可用的建筑建造队列
 * @param playerDoc
 */
Utils.playerHasFreeBuildQueue = function(playerDoc){
	return playerDoc.basicInfo.buildQueue - LogicUtils.getUsedBuildQueue(playerDoc) > 0
}

/**
 * 是否还有可用的造兵队列
 * @param playerDoc
 */
Utils.playerHasFreeRecruitQueue = function(playerDoc){
	return playerDoc.basicInfo.recruitQueue - playerDoc.soldierEvents.length > 0;
}

/**
 * 获取治疗指定伤兵所需时间
 * @param playerDoc
 * @param soldierName
 * @param count
 * @returns {number}
 */
Utils.getPlayerTreatSoldierTime = function(playerDoc, soldierName, count){
	var config = this.getPlayerSoldierConfig(playerDoc, soldierName)
	var time = config.treatTime * count;
	return Math.ceil(time * (1 - this.getPlayerProductionTechBuff(playerDoc, 'healingAgent')));
}

/**
 * 获取资料普通兵种所需的资源
 * @param playerDoc
 * @param soldiers
 * @returns {{resources: {coin: number}, treatTime: number}}
 */
Utils.getPlayerTreatSoldierRequired = function(playerDoc, soldiers){
	var self = this
	var totalNeed = {
		resources:{
			coin:0
		},
		treatTime:0
	}
	_.each(soldiers, function(soldier){
		var soldierName = soldier.name
		var config = self.getPlayerSoldierConfig(playerDoc, soldierName)
		totalNeed.resources.coin += config.treatCoin * soldier.count
		totalNeed.treatTime += self.getPlayerTreatSoldierTime(playerDoc, soldierName, soldier.count)
	})
	return totalNeed
}

/**
 * 获取龙的技能Buff
 * @param dragon
 * @param skillName
 */
Utils.getDragonSkillBuff = function(dragon, skillName){
	var skillBuff = 0
	var skill = _.find(dragon.skills, function(skill){
		return _.isEqual(skill.name, skillName)
	})
	if(_.isObject(skill) && skill.level >= 1){
		skillBuff = DragonSkills[skillName][skill.level].effect
	}
	return skillBuff
}

/**
 * 获取龙力量Buff
 * @param allianceDoc
 * @param dragon
 * @param terrain
 * @returns {number}
 */
Utils.getDragonStrengthBuff = function(allianceDoc, dragon, terrain){
	var dragonStrengthTerrainAddPercent = this.getPlayerIntInit("dragonStrengthTerrainAddPercent")
	var terrainBuff = _.isEqual(Consts.DragonFightBuffTerrain[dragon.type], terrain) ? (dragonStrengthTerrainAddPercent / 100) : 0
	var skillBuff = this.getDragonSkillBuff(dragon, "dragonBreath")
	var mapRoundBuff = !!allianceDoc ? AllianceMap.buff[LogicUtils.getAllianceMapRound(allianceDoc)].dragonStrengthAddPercent / 100 : 0;
	return terrainBuff + skillBuff + mapRoundBuff;
}

/**
 * 获取龙的力量
 * @param allianceDoc,
 * @param dragon
 * @param terrain
 * @returns {*}
 */
Utils.getDragonStrength = function(allianceDoc, dragon, terrain){
	var strength = Dragons.dragonLevel[dragon.level].strength
	strength += Dragons.dragonStar[dragon.star].initStrength
	var buff = this.getDragonStrengthBuff(allianceDoc, dragon, terrain)
	strength += Math.floor(strength * buff)
	_.each(dragon.equipments, function(equipment, category){
		if(!_.isEmpty(equipment.name)){
			var maxStar = DragonEquipments.equipments[equipment.name].maxStar
			var equipmentConfig = DragonEquipments[category][maxStar + "_" + equipment.star]
			var strengthAdd = equipmentConfig.strength
			strength += strengthAdd
		}
	})
	return strength
}

/**
 * 获取龙活力Buff
 * @param dragon
 * @returns {number}
 */
Utils.getDragonVitalityBuff = function(dragon){
	var skillBuff = this.getDragonSkillBuff(dragon, "dragonBlood")
	return skillBuff
}

/**
 * 获取龙的活力值
 * @param dragon
 * @returns {*}
 */
Utils.getDragonVitality = function(dragon){
	var vitality = Dragons.dragonLevel[dragon.level].vitality
	vitality += Dragons.dragonStar[dragon.star].initVitality
	var buff = this.getDragonVitalityBuff(dragon)
	vitality += Math.floor(vitality * buff)
	_.each(dragon.equipments, function(equipment, category){
		if(!_.isEmpty(equipment.name)){
			var maxStar = DragonEquipments.equipments[equipment.name].maxStar
			var equipmentConfig = DragonEquipments[category][maxStar + "_" + equipment.star]
			var strengthAdd = equipmentConfig.vitality
			vitality += strengthAdd
		}
	})
	return vitality
}

/**
 * 获取龙领导力Buff
 * @param playerDoc
 * @param dragon
 * @returns {number}
 */
Utils.getPlayerDragonLeadershipBuff = function(playerDoc, dragon){
	var itemBuff = 0
	var equipmentBuff = 0

	var eventType = "troopSizeBonus"
	var itemEvent = _.find(playerDoc.itemEvents, function(event){
		return _.isEqual(event.type, eventType)
	})
	if(_.isObject(itemEvent)) itemBuff = Items.buffTypes[eventType].effect1

	var skillBuff = this.getDragonSkillBuff(dragon, "leadership")
	var vipHpBuff = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0].dragonLeaderShipAdd

	var equipmentBuffKey = "troopSizeAdd"
	_.each(dragon.equipments, function(equipment){
		_.each(equipment.buffs, function(key){
			if(_.isEqual(key, equipmentBuffKey)){
				equipmentBuff += DragonEquipments.equipmentBuff[equipmentBuffKey].buffEffect
			}
		})
	})
	return itemBuff + skillBuff + equipmentBuff + vipHpBuff
}

/**
 * 获取龙的领导力
 * @param playerDoc
 * @param dragon
 * @returns {*}
 */
Utils.getPlayerDragonLeadership = function(playerDoc, dragon){
	var leadership = Dragons.dragonLevel[dragon.level].leadership
	leadership += Dragons.dragonStar[dragon.star].initLeadership
	var buff = this.getPlayerDragonLeadershipBuff(playerDoc, dragon)
	leadership += Math.floor(leadership * buff)
	_.each(dragon.equipments, function(equipment, category){
		if(!_.isEmpty(equipment.name)){
			var maxStar = DragonEquipments.equipments[equipment.name].maxStar
			var equipmentConfig = DragonEquipments[category][maxStar + "_" + equipment.star]
			var leadershipAdd = equipmentConfig.leadership
			leadership += leadershipAdd
		}
	})
	return leadership
}

/**
 * 随机生成Buff加成类型
 * @param equipmentName
 * @returns {Array}
 */
Utils.generateDragonEquipmentBuffs = function(equipmentName){
	var generatedBuffs = []
	var star = DragonEquipments.equipments[equipmentName].maxStar
	var buffs = DragonEquipments.equipmentBuff
	var buffKeys = Object.keys(buffs)
	LogicUtils.removeItemInArray(buffKeys, "troopSizeAdd")
	LogicUtils.removeItemInArray(buffKeys, "recoverAdd")
	for(var i = 0; i < star; i++){
		buffKeys = CommonUtils.shuffle(buffKeys)
		var key = buffKeys[0]
		generatedBuffs.push(key)
	}

	return generatedBuffs
}

/**
 * 检查某装备是否能装配到龙的制定位置上
 * @param equipmentName
 * @param equipmentCategory
 * @returns {boolean}
 */
Utils.isDragonEquipmentLegalAtCategory = function(equipmentName, equipmentCategory){
	var config = DragonEquipments.equipments[equipmentName]
	var categories = config.category.split(",")
	return _.contains(categories, equipmentCategory)

}

/**
 * 检查装备是否是属于此龙的类型
 * @param equipmentName
 * @param dragonType
 * @returns {*}
 */
Utils.isDragonEquipmentLegalOnDragon = function(equipmentName, dragonType){
	var config = DragonEquipments.equipments[equipmentName]
	return _.isEqual(dragonType, config.usedFor)
}

/**
 * 检查龙的装备的星级是否和龙的星级匹配
 * @param equipmentName
 * @param dragon
 * @returns {*}
 */
Utils.isDragonEquipmentStarEqualWithDragonStar = function(equipmentName, dragon){
	var config = DragonEquipments.equipments[equipmentName]
	return _.isEqual(config.maxStar, dragon.star)
}

/**
 * 龙装备是否已强化到最高等级
 * @param equipment
 * @returns {boolean}
 */
Utils.isDragonEquipmentReachMaxStar = function(equipment){
	var config = DragonEquipments.equipments[equipment.name]
	return config.maxStar <= equipment.star
}

/**
 * 获取指龙装备的最大星级
 * @param equipmentName
 * @returns {*}
 */
Utils.getDragonEquipmentMaxStar = function(equipmentName){
	var config = DragonEquipments.equipments[equipmentName]
	return config.maxStar
}

/**
 * 检查对龙技能的升级是否合法
 * @param dragon
 * @param skillName
 * @returns {boolean}
 */
Utils.isDragonSkillUnlocked = function(dragon, skillName){
	var unlockedSkills = Dragons.dragonStar[dragon.star].skillsUnlocked.split(",")
	return _.contains(unlockedSkills, skillName)
}

/**
 * 此龙类型是否存在
 * @param dragonType
 * @returns {*}
 */
Utils.isDragonTypeExist = function(dragonType){
	var config = Dragons.dragons
	return _.contains(Object.keys(config), dragonType)
}

/**
 * 获取升级龙的技能所需的资源
 * @param dragon
 * @param skill
 * @returns {{}}
 */
Utils.getDragonSkillUpgradeRequired = function(dragon, skill){
	var totalNeed = {}
	totalNeed.blood = DragonSkills[skill.name][skill.level + 1].bloodCost
	return totalNeed
}

/**
 * 技能是否以达到最高等级
 * @param skill
 * @returns {boolean}
 */
Utils.isDragonSkillReachMaxLevel = function(skill){
	return !DragonSkills[skill.name][skill.level + 1]
}

/**
 * 获取龙的指定技能的最高等级
 * @param skillName
 * @returns {*}
 */
Utils.getDragonSkillMaxLevel = function(skillName){
	return DragonSkills[skillName].length - 1;
}

/**
 * 强化龙的装备
 * @param playerDoc
 * @param dragon
 * @param category
 * @param equipments
 */
Utils.enhancePlayerDragonEquipment = function(playerDoc, dragon, category, equipments){
	var equipmentInDragon = dragon.equipments[category]
	var config = DragonEquipments.equipments[equipmentInDragon.name]
	var maxStar = config.maxStar
	var currentStar = equipmentInDragon.star
	var currentExp = Number(equipmentInDragon.exp)
	var totalExp = this.getDragonEquipmentsExp(dragon.type, equipmentInDragon, equipments)
	while(totalExp > 0 && currentStar < maxStar){
		var nextStar = currentStar + 1
		var categoryConfig = DragonEquipments[category][maxStar + "_" + nextStar]
		var expNeeded = categoryConfig.enhanceExp - currentExp
		if(expNeeded <= totalExp){
			currentStar += 1
			currentExp = 0
			totalExp -= expNeeded
		}else{
			currentExp += totalExp
			totalExp = 0
		}
	}
	equipmentInDragon.star = currentStar
	equipmentInDragon.exp = currentExp
}

/**
 * 获取龙装备的经验值
 * @param dragonType
 * @param equipmentInDragon
 * @param equipments
 * @returns {number}
 */
Utils.getDragonEquipmentsExp = function(dragonType, equipmentInDragon, equipments){
	var self = this
	var totalExp = 0
	_.each(equipments, function(equipment){
		var exp = self.getDragonEquipmentExp(dragonType, equipmentInDragon, equipment.name, equipment.count)
		totalExp += exp
	})
	return totalExp
}

/**
 * 获取单个龙装备的经验值
 * @param dragonType
 * @param equipmentInDragon
 * @param equipmentName
 * @param count
 * @returns {number}
 */
Utils.getDragonEquipmentExp = function(dragonType, equipmentInDragon, equipmentName, count){
	var config = DragonEquipments.equipments[equipmentName]
	var usedFor = config.usedFor
	if(_.isEqual(equipmentInDragon.name, equipmentName)){
		return config.resolveLExp * count
	}else if(_.isEqual(dragonType, usedFor)){
		return config.resolveMExp * count
	}else{
		return config.resolveSExp * count
	}
}

/**
 * 龙的等级是否达到让龙晋级的条件
 * @param dragon
 * @returns {boolean}
 */
Utils.isDragonReachUpgradeLevel = function(dragon){
	var config = Dragons.dragonStar[dragon.star]
	return dragon.level >= config.levelMax
}

/**
 * 龙的装备是否达到让龙晋级的条件
 * @param dragon
 */
Utils.isDragonEquipmentsReachUpgradeLevel = function(dragon){
	var allCategory = Dragons.dragonStar[dragon.star + 1].allCategory.split(",")
	return _.every(allCategory, function(category){
		var equipment = dragon.equipments[category]
		if(_.isEmpty(equipment.name)) return false
		var maxStar = DragonEquipments.equipments[equipment.name].maxStar
		return equipment.star >= maxStar
	})
}

/**
 * 获取龙的最大星级
 * @returns {number}
 */
Utils.getDragonMaxStar = function(){
	return 4
}

/**
 *龙是否已达到最高星级
 * @param dragon
 * @returns {boolean}
 */
Utils.isDragonReachMaxStar = function(dragon){
	return dragon.star >= 4
}

/**
 * 检查操作联盟相关API的权限是否足够
 * @param title
 * @param api
 * @returns {*}
 */
Utils.isAllianceOperationLegal = function(title, api){
	var config = AllianceRight[title]
	return config[api]
}

/**
 * 获取联盟职称等级
 * @param title
 * @returns {*}
 */
Utils.getAllianceTitleLevel = function(title){
	return AllianceRight[title].titleLevel
}

/**
 * 获取玩家Vip等级
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerVipLevel = function(playerDoc){
	var vipExpConfig = Vip.level
	var vipExp = playerDoc.basicInfo.vipExp
	for(var i = vipExpConfig.length - 1; i >= 0; i--){
		var minExp = vipExpConfig[i].expFrom
		if(vipExp >= minExp) return i
	}
	return 0
}

/**
 * 获取玩家协助加速效果
 * @param playerDoc
 * @param totalTime
 * @returns {number}
 */
Utils.getPlayerHelpAllianceMemberSpeedUpEffect = function(playerDoc, totalTime){
	var vipConfig = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0]
	return Math.floor(60 * 1000 + (totalTime * vipConfig.helpSpeedup / 100))
}

/**
 * 获取免费加速效果
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerFreeSpeedUpEffect = function(playerDoc){
	var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0].freeSpeedup
	return vipBuff * 60 * 1000
}

/**
 * 联盟捐赠是否含有此捐赠类型
 * @param donateType
 * @returns {boolean}
 */
Utils.hasAllianceDonateType = function(donateType){
	var has = false
	_.each(AllianceInitData.donate, function(config){
		if(_.isEqual(config.type, donateType)){
			has = true
		}
	})
	return has
}

/**
 * 根据捐赠类型和捐赠级别获取捐赠配置
 * @param donateType
 * @param donateLevel
 * @returns {*}
 */
Utils.getAllianceDonateConfigByTypeAndLevel = function(donateType, donateLevel){
	var donateConfig = null
	_.each(AllianceInitData.donate, function(config){
		if(_.isEqual(config.type, donateType) && _.isEqual(config.level, donateLevel)){
			donateConfig = config
		}
	})
	return donateConfig
}

/**
 * 更新玩家指定捐赠类型的下次捐赠等级
 * @param playerDoc
 * @param playerData
 * @param donateType
 * @returns {*}
 */
Utils.updatePlayerDonateLevel = function(playerDoc, playerData, donateType){
	var donates = _.filter(AllianceInitData.donate, function(donate){
		return _.isEqual(donate.type, donateType)
	})
	var currentLevel = playerDoc.allianceDonate[donateType]
	var hasNextLevel = _.find(donates, function(donate){
		return _.isEqual(donate.level, currentLevel + 1)
	})
	if(hasNextLevel){
		playerDoc.allianceDonate[donateType] = currentLevel + 1
		playerData.push(["allianceDonate." + donateType, playerDoc.allianceDonate[donateType]])
	}
}

/**
 * 获取升级联盟建筑所需的资源
 * @param buildingName
 * @param buildingLevel
 * @returns {{honour: (needHonour|*)}}
 */
Utils.getAllianceBuildingUpgradeRequired = function(buildingName, buildingLevel){
	var config = AllianceBuilding[buildingName][buildingLevel]
	var required = {
		honour:config.needHonour
	}
	return required
}

/**
 * 获取升级联盟村落所需要的资源
 * @param villageType
 * @param villageLevel
 * @returns {{honour: (needHonour|*)}}
 */
Utils.getAllianceVillageUpgradeRequired = function(villageType, villageLevel){
	var config = AllianceVillage[villageType][villageLevel]
	var required = {
		honour:config.needHonour
	}
	return required
}

/**
 * 指定联盟建筑是否到达最高等级
 * @param buildingName
 * @param buildingLevel
 * @returns {boolean}
 */
Utils.isAllianceBuildingReachMaxLevel = function(buildingName, buildingLevel){
	var config = AllianceBuilding[buildingName][buildingLevel + 1]
	return !_.isObject(config)
}

/**
 * 指定联盟村落类型是否到达最高等级
 * @param allianceType
 * @param allianceLevel
 * @returns {boolean}
 */
Utils.isAllianceVillageReachMaxLevel = function(allianceType, allianceLevel){
	var config = AllianceVillage[allianceType][allianceLevel + 1]
	return !_.isObject(config)
}

/**
 * 获取村落配置
 * @returns {*}
 */
Utils.getAllianceVillageTypeConfigs = function(){
	var config = AllianceMap.buildingName
	var villages = _.filter(config, function(configObj){
		return _.isEqual(configObj.type, "village")
	})
	return villages
}

/**
 * 村落类型是否合法
 * @param villageType
 * @returns {*}
 */
Utils.isAllianceVillageTypeLegal = function(villageType){
	var keys = _.keys(AllianceVillage)
	return _.contains(keys, villageType)
}

/**
 * 获取村落产出
 * @param allianceDoc
 * @param villageName
 * @param villageLevel
 * @returns {production|*}
 */
Utils.getAllianceVillageProduction = function(allianceDoc, villageName, villageLevel){
	var config = AllianceVillage[villageName][villageLevel];
	return config.production;
	//var mapRound = LogicUtils.getAllianceMapRound(allianceDoc);
	//var mapRoundBuff = AllianceMap.buff[mapRound].villageAddPercent / 100;
	//return Math.floor(config.production * (1 + mapRoundBuff));
}

/**
 * 获取联盟村落建筑等级
 * @param allianceDoc
 * @param villageType
 * @returns {*}
 */
Utils.getAllianceVillageLevelByType = function(allianceDoc, villageType){
	return allianceDoc.villageLevels[villageType]
}

/**
 * 初始化联盟建筑和装饰物
 * @param allianceDoc
 */
Utils.initMapBuildings = function(allianceDoc){
	var buildings = []
	_.each(AllianceMap.buildingName, function(config){
		if(_.contains(Consts.AllianceBuildingNames, config.name)){
			var building = {
				id:ShortId.generate(),
				name:config.name,
				level:1
			}
			buildings.push(building)
		}
	})
	allianceDoc.buildings = buildings
}

/**
 * 初始化联盟村落
 * @param allianceDoc
 * @param mapObjects
 * @param map
 */
Utils.initMapVillages = function(allianceDoc, mapObjects, map){
	var self = this
	var villages = []
	var orderHallLevel = 1
	var orderHallConfig = AllianceBuilding.orderHall[orderHallLevel]
	var villageTypeConfigs = this.getAllianceVillageTypeConfigs()
	var villageCount = orderHallConfig.villageCount;
	while(villageCount > 0){
		var typeConfig = villageTypeConfigs[_.random(0, villageTypeConfigs.length - 1)];
		var width = typeConfig.width
		var height = typeConfig.height
		var rect = MapUtils.getRect(map, width, height)
		if(_.isObject(rect)){
			var villageMapObject = MapUtils.addMapObject(map, mapObjects, rect, typeConfig.name)
			var village = {
				id:villageMapObject.id,
				name:villageMapObject.name,
				level:1,
				resource:self.getAllianceVillageProduction(allianceDoc, villageMapObject.name, 1),
				villageEvent:null
			}
			villages.push(village)
		}
		villageCount--;
	}
	allianceDoc.villages = villages
}

/**
 * 初始化区域地图野怪
 * @param allianceDoc
 * @param mapObjects
 * @param map
 */
Utils.initMapMonsters = function(allianceDoc, mapObjects, map){
	var monsters = []
	var buildingConfig = AllianceMap.buildingName['monster']
	var width = buildingConfig.width
	var height = buildingConfig.height
	var monsterCount = this.getAllianceIntInit('monsterCount')
	var mapRound = LogicUtils.getAllianceMapRound(allianceDoc);
	var monsterLevelConfigString = AllianceMap.buff[mapRound].monsterLevel;
	var monsterLevels = monsterLevelConfigString.split('_');
	var monsterLevelMin = parseInt(monsterLevels[0]);
	var monsterLevelMax = parseInt(monsterLevels[1]);
	for(var i = 0; i < monsterCount; i++){
		(function(){
			var monsterLevel = _.random(monsterLevelMin, monsterLevelMax);
			var monsterConfig = AllianceInitData.monsters[monsterLevel];
			var soldiersConfigStrings = monsterConfig.soldiers.split(';');
			var monsterIndex = _.random(0, soldiersConfigStrings.length - 1);
			var rect = MapUtils.getRect(map, width, height)
			if(_.isObject(rect)){
				var monsterMapObject = MapUtils.addMapObject(map, mapObjects, rect, buildingConfig.name)
				var monster = {
					id:monsterMapObject.id,
					level:monsterLevel,
					index:monsterIndex
				}
				monsters.push(monster)
			}
		})();
	}
	allianceDoc.monsters = monsters
}

/**
 * 为联盟添加村落
 * @param allianceDoc
 * @param mapObject
 * @returns {{id: *, type: *, level: *, resource: *, dragon: *, soldiers: *, location: *}}
 */
Utils.addAllianceVillageObject = function(allianceDoc, mapObject){
	var villageName = mapObject.name
	var villageLevel = allianceDoc.villageLevels[villageName]
	var village = {
		id:mapObject.id,
		name:villageName,
		level:villageLevel,
		resource:this.getAllianceVillageProduction(allianceDoc, villageName, villageLevel),
		villageEvent:null
	}
	allianceDoc.villages.push(village)
	return village
}

/**
 * 获取建筑类型在联盟的宽高
 * @param buildingName
 * @returns {{width: *, height: *}}
 */
Utils.getSizeInAllianceMap = function(buildingName){
	var config = AllianceMap.buildingName[buildingName]
	return {width:config.width, height:config.height}
}

/**
 * 联盟地图对象是否为装饰对象
 * @param objectType
 * @returns {*}
 */
Utils.isAllianceMapObjectTypeADecorateObject = function(objectType){
	var config = AllianceMap.buildingName[objectType]
	return _.isEqual(config.category, "decorate")
}

/**
 * 刷新联盟感知力
 * @param allianceDoc
 * @returns {*|perception|AllianceSchema.basicInfo.perception|.basicInfo.perception}
 */
Utils.getAlliancePerception = function(allianceDoc){
	var shrine = this.getAllianceBuildingByName(allianceDoc, Consts.AllianceBuildingNames.Shrine)
	var config = AllianceBuilding.shrine[shrine.level]
	var perception = allianceDoc.basicInfo.perception
	var totalHours = (Date.now() - allianceDoc.basicInfo.perceptionRefreshTime) / 1000 / 60 / 60
	var perceptionAdd = Math.floor(config.pRecoveryPerHour * totalHours)
	return perception + perceptionAdd > config.perception ? config.perception : perception + perceptionAdd
}

/**
 * 联盟圣地事件名称是否合法
 * @param stageName
 * @returns {*}
 */
Utils.isAllianceShrineStageNameLegal = function(stageName){
	var config = AllianceInitData.shrineStage
	return _.contains(_.keys(config), stageName)
}

/**
 * 创建联盟圣地事件
 * @param stageName
 * @returns {*}
 */
Utils.createAllianceShrineStageEvent = function(stageName){
	var event = {
		id:ShortId.generate(),
		stageName:stageName,
		createTime:Date.now(),
		startTime:Date.now() + this.getAllianceIntInit("activeShrineStageEventMinutes") * 60 * 1000,
		playerTroops:[]
	}
	return event
}

/**
 * 获取激活圣地事件需要的感知力
 * @param stageName
 * @returns {{perception: *}}
 */
Utils.getAllianceActiveShrineStageRequired = function(stageName){
	var config = AllianceInitData.shrineStage[stageName]
	var required = {
		perception:config.needPerception
	}
	return required
}

/**
 * 获取士兵配置
 * @param playerDoc
 * @param soldierName
 * @returns {*}
 */
Utils.getPlayerSoldierConfig = function(playerDoc, soldierName){
	if(this.isNormalSoldier(soldierName)){
		return Soldiers.normal[soldierName + "_" + playerDoc.soldierStars[soldierName]]
	}else{
		return Soldiers.special[soldierName]
	}
}

/**
 * 获取玩家士兵星级
 * @param playerDoc
 * @param soldierName
 * @returns {*}
 */
Utils.getPlayerSoldierStar = function(playerDoc, soldierName){
	if(this.isNormalSoldier(soldierName)){
		return playerDoc.soldierStars[soldierName]
	}else{
		return Soldiers.special[soldierName].star
	}
}

/**
 * 获取玩家兵种的攻击力加成Buff
 * @param playerDoc
 * @param soldierName
 * @param dragon
 * @param dragonAfterFight
 * @returns {number}
 */
Utils.getPlayerSoldierAtkBuff = function(playerDoc, soldierName, dragon, dragonAfterFight){
	var itemBuff = 0
	var equipmentBuff = 0

	var buffAddPercent = this.getDragonBuffAddPercent(dragonAfterFight);
	var soldierConfig = this.getPlayerSoldierConfig(playerDoc, soldierName)
	var soldierType = soldierConfig.type

	var eventType = soldierType + "AtkBonus"
	var itemEvent = _.find(playerDoc.itemEvents, function(event){
		return _.isEqual(event.type, eventType)
	})
	if(_.isObject(itemEvent)) itemBuff = Items.buffTypes[eventType].effect1

	var dragonSkillName = soldierType + "Enhance"
	var skillBuff = this.getDragonSkillBuff(dragon, dragonSkillName)

	var equipmentBuffKey = soldierType + "AtkAdd"
	_.each(dragon.equipments, function(equipment){
		_.each(equipment.buffs, function(key){
			if(_.isEqual(key, equipmentBuffKey)){
				equipmentBuff += DragonEquipments.equipmentBuff[equipmentBuffKey].buffEffect
			}
		})
	})
	return itemBuff + ((skillBuff + equipmentBuff) * buffAddPercent)
}

/**
 * 龙技能对进攻城墙的加成Buff
 * @param dragon
 * @param dragonAfterFight
 * @returns {number}
 */
Utils.getDragonAtkWallBuff = function(dragon, dragonAfterFight){
	var dragonSkillName = "earthquake"
	var buffAddPercent = this.getDragonBuffAddPercent(dragonAfterFight);
	var skillBuff = this.getDragonSkillBuff(dragon, dragonSkillName)
	return skillBuff * buffAddPercent;
}

/**
 * 获取玩家兵种的Hp加成Buff
 * @param playerDoc
 * @param soldierName
 * @param dragon
 * @param dragonAfterFight
 * @returns {number}
 */
Utils.getPlayerSoldierHpBuff = function(playerDoc, soldierName, dragon, dragonAfterFight){
	var itemBuff = 0
	var equipmentBuff = 0

	var buffAddPercent = this.getDragonBuffAddPercent(dragonAfterFight);
	var soldierConfig = this.getPlayerSoldierConfig(playerDoc, soldierName)
	var soldierType = soldierConfig.type

	var eventType = "unitHpBonus"
	var itemEvent = _.find(playerDoc.itemEvents, function(event){
		return _.isEqual(event.type, eventType)
	})
	if(_.isObject(itemEvent)) itemBuff = Items.buffTypes[eventType].effect1

	var dragonSkillName = soldierType + "Enhance"
	var skillBuff = this.getDragonSkillBuff(dragon, dragonSkillName)

	var equipmentBuffKey = soldierType + "HpAdd"
	_.each(dragon.equipments, function(equipment){
		_.each(equipment.buffs, function(key){
			if(_.isEqual(key, equipmentBuffKey)){
				equipmentBuff += DragonEquipments.equipmentBuff[equipmentBuffKey].buffEffect
			}
		})
	})
	return itemBuff + ((skillBuff + equipmentBuff) * buffAddPercent)
}

/**
 * 获取玩家士兵负重Buff加成
 * @param playerDoc
 * @param soldierName
 * @param dragon
 * @param dragonAfterFight
 * @returns {number}
 */
Utils.getPlayerSoldierLoadBuff = function(playerDoc, soldierName, dragon, dragonAfterFight){
	var equipmentBuff = 0

	var buffAddPercent = this.getDragonBuffAddPercent(dragonAfterFight);
	var soldierConfig = this.getPlayerSoldierConfig(playerDoc, soldierName)
	var soldierType = soldierConfig.type

	var equipmentBuffKey = soldierType + "LoadAdd"
	_.each(dragon.equipments, function(equipment){
		_.each(equipment.buffs, function(key){
			if(_.isEqual(key, equipmentBuffKey)){
				equipmentBuff += DragonEquipments.equipmentBuff[equipmentBuffKey].buffEffect
			}
		})
	})

	return equipmentBuff * buffAddPercent
}

/**
 * 创建玩家战斗用军队
 * @param playerDoc
 * @param soldiers
 * @param dragon
 * @param dragonAfterFight
 * @returns {Array}
 */
Utils.createPlayerSoldiersForFight = function(playerDoc, soldiers, dragon, dragonAfterFight){
	var self = this
	var soldiersForFight = []
	_.each(soldiers, function(soldier){
		var soldierName = soldier.name
		var soldierStar = self.getPlayerSoldierStar(playerDoc, soldierName)
		var soldierCount = soldier.count
		var config = self.getPlayerSoldierConfig(playerDoc, soldierName)
		var atkBuff = self.getPlayerSoldierAtkBuff(playerDoc, soldierName, dragon, dragonAfterFight)
		var atkWallBuff = self.getDragonAtkWallBuff(dragon, dragonAfterFight);
		var hpBuff = self.getPlayerSoldierHpBuff(playerDoc, soldierName, dragon, dragonAfterFight)
		var loadBuff = self.getPlayerSoldierLoadBuff(playerDoc, soldierName, dragon, dragonAfterFight)
		var techBuffToInfantry = self.getPlayerMilitaryTechBuff(playerDoc, config.type + "_infantry")
		var techBuffToArcher = self.getPlayerMilitaryTechBuff(playerDoc, config.type + "_archer")
		var techBuffToCavalry = self.getPlayerMilitaryTechBuff(playerDoc, config.type + "_cavalry")
		var techBuffToSiege = self.getPlayerMilitaryTechBuff(playerDoc, config.type + "_siege")
		var techBuffHpAdd = self.getPlayerMilitaryTechBuff(playerDoc, config.type + "_hpAdd")
		var vipAttackBuff = Vip.level[playerDoc.vipEvents.length > 0 ? self.getPlayerVipLevel(playerDoc) : 0].soldierAttackPowerAdd
		var vipHpBuff = Vip.level[playerDoc.vipEvents.length > 0 ? self.getPlayerVipLevel(playerDoc) : 0].soldierHpAdd
		var terrainAttackBuff = self.getPlayerTerrainAttackBuff(playerDoc);
		var terrainDefenceBuff = self.getPlayerTerrainDefenceBuff(playerDoc);
		var soldierForFight = {
			name:soldierName,
			star:soldierStar,
			type:config.type,
			currentCount:soldierCount,
			totalCount:soldierCount,
			woundedCount:0,
			power:config.power,
			hp:Math.floor(config.hp * (1 + hpBuff + techBuffHpAdd + vipHpBuff + terrainDefenceBuff)),
			load:Math.floor(config.load * (1 + loadBuff)),
			citizen:config.citizen,
			round:1,
			position:soldiersForFight.length,
			attackPower:{
				infantry:Math.floor(config.infantry * (1 + atkBuff + techBuffToInfantry + vipAttackBuff + terrainAttackBuff)),
				archer:Math.floor(config.archer * (1 + atkBuff + techBuffToArcher + vipAttackBuff + terrainAttackBuff)),
				cavalry:Math.floor(config.cavalry * (1 + atkBuff + techBuffToCavalry + vipAttackBuff + terrainAttackBuff)),
				siege:Math.floor(config.siege * (1 + atkBuff + techBuffToSiege + vipAttackBuff + terrainAttackBuff)),
				wall:Math.floor(config.wall * (1 + atkBuff + atkWallBuff + vipAttackBuff + terrainAttackBuff))
			},
			killedSoldiers:[]
		}
		soldiersForFight.push(soldierForFight)
	})

	return soldiersForFight
}

/**
 * 创建战斗用军队
 * @param soldiers
 * @returns {Array}
 */
Utils.createSoldiersForFight = function(soldiers){
	var self = this
	var soldiersForFight = []
	_.each(soldiers, function(soldier){
		var soldierName = soldier.name
		var soldierCount = soldier.count
		var soldierStar = soldier.star
		var config = null
		if(self.isNormalSoldier(soldierName)){
			config = Soldiers.normal[soldierName + "_" + soldierStar]
		}else{
			config = Soldiers.special[soldierName]
		}

		var soldierForFight = {
			name:soldierName,
			star:soldierStar,
			type:config.type,
			currentCount:soldierCount,
			totalCount:soldierCount,
			woundedCount:0,
			power:config.power,
			hp:config.hp,
			load:config.load,
			citizen:config.citizen,
			round:1,
			position:soldiersForFight.length,
			attackPower:{
				infantry:config.infantry,
				archer:config.archer,
				cavalry:config.cavalry,
				siege:config.siege,
				wall:config.wall
			},
			killedSoldiers:[]
		}
		soldiersForFight.push(soldierForFight)
	})

	return soldiersForFight
}

/**
 * 创建玩家战斗用龙
 * @param allianceDoc
 * @param playerDoc
 * @param dragon
 * @param terrain
 * @returns {*}
 */
Utils.createPlayerDragonForFight = function(allianceDoc, playerDoc, dragon, terrain){
	var dragonForFight = {
		type:dragon.type,
		level:dragon.level,
		skills:dragon.skills,
		strength:this.getDragonStrength(allianceDoc, dragon, terrain),
		vitality:this.getDragonVitality(dragon),
		maxHp:this.getDragonMaxHp(dragon),
		totalHp:dragon.hp,
		currentHp:dragon.hp,
		isWin:false
	}
	return dragonForFight
}

/**
 * 创建圣地,村落中的战斗用龙
 * @param dragon
 * @returns {{type: *, level: *, strength: *, vitality: *, maxHp: number, totalHp: number, currentHp: number, isWin: boolean}}
 */
Utils.createDragonForFight = function(dragon){
	var dragonForFight = {
		type:dragon.type,
		level:dragon.level,
		strength:this.getDragonStrength(null, dragon, null),
		vitality:this.getDragonVitality(dragon),
		maxHp:this.getDragonMaxHp(dragon),
		totalHp:this.getDragonMaxHp(dragon),
		currentHp:this.getDragonMaxHp(dragon),
		isWin:false
	}
	return dragonForFight
}

/**
 * 创建战斗用的城墙
 * @param playerDoc
 * @returns {*}
 */
Utils.createPlayerWallForFight = function(playerDoc){
	var getProperty = function(type, level, key){
		return BuildingFunction[type][level][key]
	}
	var getPowersByType = function(type){
		var power = getProperty("tower", playerDoc.buildings.location_22.level, type)
		return power
	}
	var itemDefencePowerBuff = this.getPlayerProductionTechBuff(playerDoc, "reinforcing")
	var itemAttackPowerBuff = this.getPlayerProductionTechBuff(playerDoc, "seniorTower")
	var wall = {
		maxHp:getProperty("wall", playerDoc.buildings.location_21.level, "wallHp"),
		totalHp:playerDoc.resources.wallHp,
		currentHp:playerDoc.resources.wallHp,
		round:0,
		attackPower:{
			infantry:Math.floor(getPowersByType("infantry") * (1 + itemAttackPowerBuff)),
			archer:Math.floor(getPowersByType("archer") * (1 + itemAttackPowerBuff)),
			cavalry:Math.floor(getPowersByType("cavalry") * (1 + itemAttackPowerBuff)),
			siege:Math.floor(getPowersByType("siege") * (1 + itemAttackPowerBuff))
		},
		defencePower:Math.floor(getPowersByType("defencePower") * (1 + itemDefencePowerBuff)),
		killedSoldiers:[]
	}
	return wall
}

/**
 * 获取圣地部队信息
 * @param allianceDoc
 * @param stageName
 * @returns {*}
 */
Utils.getAllianceShrineStageTroop = function(allianceDoc, stageName){
	var stageConfig = AllianceInitData.shrineStage[stageName]
	var troopString = stageConfig.troops
	var soldierConfigStrings = troopString.split(",")
	var dragonConfig = soldierConfigStrings.shift()
	var dragonParams = dragonConfig.split(":")
	var dragon = {
		type:Consts.TerrainDragonMap[allianceDoc.basicInfo.terrain],
		star:parseInt(dragonParams[1]),
		level:parseInt(dragonParams[2])
	}
	var dragonForFight = this.createDragonForFight(dragon)
	var soldiers = []
	_.each(soldierConfigStrings, function(soldierConfigString){
		var params = soldierConfigString.split(":")
		var soldierName = params[0]
		var soldierStar = parseInt(params[1])
		var soldierCount = parseInt(params[2])
		var soldier = {
			name:soldierName,
			star:soldierStar,
			count:soldierCount
		}
		soldiers.push(soldier)
	})
	var soldiersForFight = this.createSoldiersForFight(soldiers)
	return {
		stageName:stageName,
		dragonForFight:dragonForFight,
		soldiers:soldiers,
		soldiersForFight:soldiersForFight
	}
}

/**
 * 创建战斗用野怪
 * @param allianceDoc
 * @param monster
 * @returns {{dragonForFight: {type: *, level: *, strength: *, vitality: *, maxHp: number, totalHp: number, currentHp: number, isWin: boolean}, soldiersForFight: Array}}
 */
Utils.createAllianceMonsterForFight = function(allianceDoc, monster){
	var monsterConfig = AllianceInitData.monsters[monster.level]
	var dragonConfigArray = monsterConfig.dragon.split(':');
	var dragon = {
		type:dragonConfigArray[0],
		star:parseInt(dragonConfigArray[1]),
		level:parseInt(dragonConfigArray[2])
	}
	var dragonForFight = this.createDragonForFight(dragon)

	var soldierConfigStrings = monsterConfig.soldiers.split(';')[monster.index].split(',');
	var soldiers = [];
	_.each(soldierConfigStrings, function(configString){
		var soldierConfigArray = configString.split(':');
		var soldier = {
			name:soldierConfigArray[0],
			star:parseInt(soldierConfigArray[1]),
			count:parseInt(soldierConfigArray[2])
		}
		soldiers.push(soldier);
	})
	var soldiersForFight = this.createSoldiersForFight(soldiers)

	return {dragonForFight:dragonForFight, soldiers:soldiers, soldiersForFight:soldiersForFight}
}

/**
 * 获取野怪名称
 * @param monsterLevel
 * @param monsterIndex
 */
Utils.getMonsterName = function(monsterLevel, monsterIndex){
	var monsterConfig = AllianceInitData.monsters[monsterLevel]
	return monsterConfig.soldiers.split(';')[monsterIndex].split(',')[0].split('_')[0];
}

/**
 * 获取玩家战损兵力去医院的数量
 * @param playerDoc
 * @param dragon
 * @returns {number}
 */
Utils.getPlayerWoundedSoldierPercent = function(playerDoc, dragon){
	var basePercent = this.getAllianceIntInit('soldierFightWoundedPercent') / 100;
	var equipmentBuff = 0;
	var equipmentBuffKey = "recoverAdd"
	_.each(dragon.equipments, function(equipment){
		_.each(equipment.buffs, function(key){
			if(_.isEqual(key, equipmentBuffKey)){
				equipmentBuff += DragonEquipments.equipmentBuff[equipmentBuffKey].buffEffect
			}
		})
	})
	return basePercent + equipmentBuff
}

/**
 * 圣地战斗结束后,获取需要的结果
 * @param terrain
 * @param stageName
 * @param isWin
 * @param fightDatas
 * @returns {*}
 */
Utils.getAllianceShrineStageResultDatas = function(terrain, stageName, isWin, fightDatas){
	var self = this
	var playerDatas = {}
	var woundedSoldiers = {}
	var damagedSoldiers = {}
	var playerRewards = {}
	var playerKills = {}
	var playerDragonHps = {}
	var fightStar = 0
	var totalDeath = 0
	_.each(fightDatas, function(fightData){
		_.each(fightData.roundDatas, function(roundData){
			if(!_.isObject(playerDatas[roundData.playerId])){
				playerDatas[roundData.playerId] = {
					id:roundData.playerId,
					name:roundData.playerName,
					icon:roundData.playerIcon,
					kill:0,
					rewards:[]
				}
				woundedSoldiers[roundData.playerId] = {}
				damagedSoldiers[roundData.playerId] = {}
				playerKills[roundData.playerId] = 0
				playerDragonHps[roundData.playerId] = 0
			}
			var playerData = playerDatas[roundData.playerId]
			playerDragonHps[roundData.playerId] += roundData.attackDragonFightData.hpDecreased
			_.each(roundData.defenceSoldierRoundDatas, function(defenceSoldierRoundData){
				var soldierConfig = Soldiers.normal[defenceSoldierRoundData.soldierName + "_" + defenceSoldierRoundData.soldierStar]
				var kill = defenceSoldierRoundData.soldierDamagedCount * soldierConfig.killScore
				playerData.kill += kill
				playerKills[roundData.playerId] += kill
			})
			_.each(roundData.attackSoldierRoundDatas, function(attackSoldierRoundData){
				var soldierConfig = function(){
					if(self.isNormalSoldier(attackSoldierRoundData.soldierName)){
						soldierConfig = Soldiers.normal[attackSoldierRoundData.soldierName + "_" + attackSoldierRoundData.soldierStar]
					}else{
						soldierConfig = Soldiers.special[attackSoldierRoundData.soldierName]
					}
					return soldierConfig
				}()
				totalDeath += attackSoldierRoundData.soldierDamagedCount * soldierConfig.killScore
				if(!_.isObject(woundedSoldiers[roundData.playerId][attackSoldierRoundData.soldierName])){
					woundedSoldiers[roundData.playerId][attackSoldierRoundData.soldierName] = {
						name:attackSoldierRoundData.soldierName,
						count:0
					}
					damagedSoldiers[roundData.playerId][attackSoldierRoundData.soldierName] = {
						name:attackSoldierRoundData.soldierName,
						count:0
					}
				}
				var woundedSoldier = woundedSoldiers[roundData.playerId][attackSoldierRoundData.soldierName]
				woundedSoldier.count += attackSoldierRoundData.soldierWoundedCount
				var damagedSoldier = damagedSoldiers[roundData.playerId][attackSoldierRoundData.soldierName]
				damagedSoldier.count += attackSoldierRoundData.soldierDamagedCount
			})
		})
	})
	if(isWin)
		fightStar += 1;
	if(isWin && fightDatas.length > 0 && totalDeath <= AllianceInitData.shrineStage[stageName].star2DeathCitizen)
		fightStar += 1;
	if(isWin && fightDatas.length == 1)
		fightStar += 1;

	var getPlayerRewardsString = function(terrain, stageConfig, playerKill){
		var rewardsString = null
		for(var i = 3; i >= 1; i--){
			var killNeed = stageConfig["playerKill_" + i]
			if(playerKill < killNeed) continue
			rewardsString = stageConfig["playerRewards_" + i + "_" + terrain]
			break
		}
		return rewardsString
	}

	var stageConfig = AllianceInitData.shrineStage[stageName]
	_.each(playerDatas, function(playerData, playerId){
		var rewardString = getPlayerRewardsString(terrain, stageConfig, playerData.kill)
		if(_.isString(rewardString)){
			var rewardStrings = rewardString.split(",")
			_.each(rewardStrings, function(rewardString){
				var param = rewardString.split(":")
				var type = param[0]
				var name = param[1]
				var count = parseInt(param[2])
				playerData.rewards.push({
					type:type,
					name:name,
					count:count
				})
			})
		}
		var killRewards = self.getRewardsByKillScoreAndTerrain(playerData.kill, terrain)
		LogicUtils.mergeRewards(playerData.rewards, killRewards)
		playerRewards[playerId] = playerData.rewards
	})

	playerDatas = _.values(playerDatas)
	playerDatas.sort(function(a, b){
		return b.kill - a.kill
	})

	_.each(damagedSoldiers, function(damagedSoldier, playerId){
		damagedSoldiers[playerId] = _.values(damagedSoldier)
	})
	_.each(woundedSoldiers, function(woundedSoldier, playerId){
		woundedSoldiers[playerId] = _.values(woundedSoldier)
	})
	var params = {
		playerDatas:playerDatas,
		fightStar:fightStar,
		damagedSoldiers:damagedSoldiers,
		woundedSoldiers:woundedSoldiers,
		playerRewards:playerRewards,
		playerKills:playerKills,
		playerDragonHps:playerDragonHps
	}
	return params
}

/**
 * 联盟圣地关卡是否解锁
 * @param allianceDoc
 * @param stageName
 */
Utils.isAllianceShrineStageLocked = function(allianceDoc, stageName){
	var config = AllianceInitData.shrineStage[stageName]
	if(config.index == 1) return false
	var previousStageName = null
	_.each(AllianceInitData.shrineStage, function(theConfig){
		if(theConfig.index == config.index - 1) previousStageName = theConfig.stageName
	})

	var stageData = LogicUtils.getAllianceShrineStageData(allianceDoc, previousStageName)
	return !_.isObject(stageData)
}

/**
 * 获取联盟圣地战争联盟获得的荣耀
 * @param stageName
 * @param fightStar
 * @returns {*}
 */
Utils.getAllianceShrineStageFightHonour = function(stageName, fightStar){
	var config = AllianceInitData.shrineStage[stageName]
	var honourName = "star" + fightStar + "Honour"
	return config[honourName]
}

/**
 * 获取龙的血量的最大值
 * @param dragon
 * @returns {number}
 */
Utils.getDragonMaxHp = function(dragon){
	var vitality = this.getDragonVitality(dragon)
	return vitality * 4
}

/**
 * 获取龙Buff加成百分比
 * @param dragonAfterFight
 * @returns {number}
 */
Utils.getDragonBuffAddPercent = function(dragonAfterFight){
	var hpPercent = dragonAfterFight.currentHp / dragonAfterFight.maxHp * 100;
	for(var i = Dragons.dragonBuff.length - 1; i >= 0; i--){
		var buff = Dragons.dragonBuff[i];
		if(hpPercent <= buff.hpTo) return buff.buffPercent;
	}
	return 0;
}

/**
 * 获取龙的力量修正
 * @param attackPlayerDoc
 * @param attackSoldiers
 * @param defencePlayerDoc
 * @param defenceSoldiers
 * @returns {*}
 */
Utils.getFightFixedEffect = function(attackPlayerDoc, attackSoldiers, defencePlayerDoc, defenceSoldiers){
	var self = this;
	var getSumPower = function(playerDoc, soldiers){
		var power = 0
		_.each(soldiers, function(soldier){
			var config = self.getPlayerSoldierConfig(playerDoc, soldier.name);
			power += config.power * soldier.count
		})
		return power
	}
	var getSumPowerDirectly = function(soldiers){
		var power = 0
		_.each(soldiers, function(soldier){
			var config = null;
			if(self.isNormalSoldier(soldier.name)){
				config = Soldiers.normal[soldier.name + "_" + soldier.star];
			}else{
				config = Soldiers.special[soldier.name];
			}
			power += config.power * soldier.count
		})
		return power;
	}
	var getDragonEffectPercent = function(multiple){
		var configs = Dragons.fightFix
		for(var i = configs.length - 1; i >= 0; i--){
			var config = configs[i]
			if(multiple > config.multipleMin){
				return config.effect
			}
		}
		return configs[0].effect
	}
	var getSoldierEffectPercent = function(multiple){
		var configs = Soldiers.fightFix
		for(var i = configs.length - 1; i >= 0; i--){
			var config = configs[i]
			if(multiple > config.multipleMin){
				return config.effect
			}
		}
		return configs[0].effect
	}

	var attackSumPower = !!attackPlayerDoc ? getSumPower(attackPlayerDoc, attackSoldiers) : getSumPowerDirectly(attackSoldiers);
	var defenceSumPower = !!defencePlayerDoc ? getSumPower(defencePlayerDoc, defenceSoldiers) : getSumPowerDirectly(defenceSoldiers);
	var attackDragonEffect = getDragonEffectPercent(defenceSumPower / attackSumPower);
	var defenceDragonEffect = getDragonEffectPercent(attackSumPower / defenceSumPower);
	var attackSoldierEffect = getSoldierEffectPercent(defenceSumPower / attackSumPower);
	var defenceSoldierEffect = getSoldierEffectPercent(attackSumPower / defenceSumPower);
	return {
		soldier:{attackSoldierEffect:attackSoldierEffect, defenceSoldierEffect:defenceSoldierEffect},
		dragon:{attackDragonEffect:attackDragonEffect, defenceDragonEffect:defenceDragonEffect}
	}
}

/**
 * 刷新玩家龙的Hp信息
 * @param playerDoc
 * @param dragon
 */
Utils.refreshPlayerDragonsHp = function(playerDoc, dragon){
	var self = this
	if(!_.isObject(playerDoc)) return
	var config = BuildingFunction.dragonEyrie[playerDoc.buildings.location_4.level]
	var dragons = _.isObject(dragon) ? [dragon] : playerDoc.dragons
	_.each(dragons, function(dragon){
		if(dragon.hp > 0 && dragon.level > 0 && !_.isEqual(dragon.status, Consts.DragonStatus.March)){
			var dragonMaxHp = self.getDragonMaxHp(dragon)
			if(dragon.hp < dragonMaxHp){
				var totalMilSeconds = Date.now() - dragon.hpRefreshTime
				var recoveryPerMilSecond = config.hpRecoveryPerHour / 60 / 60 / 1000
				var itemBuff = self.isPlayerHasItemEvent(playerDoc, "dragonHpBonus") ? Items.buffTypes["dragonHpBonus"].effect1 : 0
				var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? self.getPlayerVipLevel(playerDoc) : 0].dragonHpRecoveryAdd
				var hpRecovered = Math.floor(totalMilSeconds * recoveryPerMilSecond * (1 + itemBuff + vipBuff))
				dragon.hp += hpRecovered
				dragon.hp = dragon.hp > dragonMaxHp ? dragonMaxHp : dragon.hp
			}
		}
		dragon.hpRefreshTime = Date.now()
	})
}

/**
 * 更新龙的属性
 * @param playerDoc
 * @param playerData
 * @param dragon
 * @param expAdd
 */
Utils.addPlayerDragonExp = function(playerDoc, playerData, dragon, expAdd){
	var currentStarMaxLevel = Dragons.dragonStar[dragon.star].levelMax
	while(true){
		var nextLevelExpNeed = Dragons.dragonLevel[dragon.level].expNeed
		if(dragon.exp + expAdd > nextLevelExpNeed){
			if(dragon.level >= currentStarMaxLevel){
				dragon.exp = nextLevelExpNeed
				break
			}else{
				expAdd -= (nextLevelExpNeed - dragon.exp)
				dragon.level += 1
				dragon.exp = 0
				TaskUtils.finishDragonLevelTaskIfNeed(playerDoc, playerData, dragon.type, dragon.level)
			}
		}else{
			dragon.exp += expAdd
			break
		}
	}
	playerData.push(["dragons." + dragon.type + ".level", dragon.level])
	playerData.push(["dragons." + dragon.type + ".exp", dragon.exp])
}

/**
 * 获取玩家士兵占用人口
 * @param playerDoc
 * @param soldiers
 */
Utils.getPlayerSoldiersCitizen = function(playerDoc, soldiers){
	var self = this
	var totalCitizen = 0
	_.each(soldiers, function(soldier){
		if(soldier.count > 0){
			var config = self.getPlayerSoldierConfig(playerDoc, soldier.name)
			totalCitizen += config.citizen * soldier.count
		}
	})
	return totalCitizen
}

/**
 * 获取龙的最大带兵量
 * @param playerDoc
 * @param dragon
 */
Utils.getPlayerDragonMaxCitizen = function(playerDoc, dragon){
	var leaderShip = this.getPlayerDragonLeadership(playerDoc, dragon)
	return leaderShip * this.getAllianceIntInit("citizenPerLeadership")
}

/**
 * 获取玩家部队负重
 * @param playerDoc
 * @param soldiers
 * @returns {number}
 */
Utils.getPlayerSoldiersTotalLoad = function(playerDoc, soldiers){
	var self = this
	var totalLoad = 0
	_.each(soldiers, function(soldier){
		var config = self.getPlayerSoldierConfig(playerDoc, soldier.name)
		totalLoad += config.load * soldier.count
	})
	return totalLoad
}

/**
 * 获取玩家对某资源的采集熟练度等级
 * @param resourceType
 * @returns {*}
 */
Utils.getCollectCountPerSecond = function(resourceType){
	if(resourceType === 'coin'){
		return this.getPlayerIntInit('coinCollectPerSecond')
	}else{
		return this.getPlayerIntInit('resourceCollectPerSecond')
	}
}

/**
 * 获取采集资源需要消耗的时间
 * @param allianceDoc
 * @param playerDoc
 * @param soldierLoadTotal
 * @param allianceVillage
 * @returns {*}
 */
Utils.getPlayerCollectResourceInfo = function(allianceDoc, playerDoc, soldierLoadTotal, allianceVillage){
	var techBuff = this.getPlayerProductionTechBuff(playerDoc, 'colonization');
	var mapRound = LogicUtils.getAllianceMapRound(allianceDoc);
	var mapRoundBuff = AllianceMap.buff[mapRound].villageAddPercent / 100;

	var villageResourceCurrent = allianceVillage.resource
	var collectTotal = soldierLoadTotal > villageResourceCurrent ? villageResourceCurrent : soldierLoadTotal
	var resourceType = allianceVillage.name.slice(0, -7)
	var collectCountPerSecond = this.getCollectCountPerSecond(resourceType);
	var totalSeconds = collectTotal / collectCountPerSecond
	var collectTime = totalSeconds * 1000;
	collectTime = Math.ceil(collectTime * (1 - techBuff - mapRoundBuff));
	return {collectTime:collectTime, collectTotal:collectTotal}
}

/**
 * 获取联盟村落最大产量
 * @param villageName
 * @param villageLevel
 * @returns {production|*}
 */
Utils.getAllianceVillageResourceMax = function(villageName, villageLevel){
	return AllianceVillage[villageName][villageLevel].production
}

/**
 * 龙经验获取数量
 * @param allianceDoc
 * @param playerDoc
 * @param kill
 * @returns {number}
 */
Utils.getPlayerDragonExpAdd = function(allianceDoc, playerDoc, kill){
	var expAdd = kill / this.getAllianceIntInit("KilledCitizenPerDragonExp")
	var itemBuff = this.isPlayerHasItemEvent(playerDoc, "dragonExpBonus") ? Items.buffTypes["dragonExpBonus"].effect1 : 0
	var vipBuff = Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0].dragonExpAdd
	var mapRoundBuff = !!allianceDoc ? AllianceMap.buff[LogicUtils.getAllianceMapRound(allianceDoc)].dragonExpAddPercent / 100 : 0;
	expAdd = Math.floor(expAdd * (1 + itemBuff + vipBuff + mapRoundBuff));
	return expAdd
}

/**
 * 英雄之血获得数量
 * @param allianceDoc
 * @param dragon
 * @param kill
 * @param isWinner
 * @returns {number}
 */
Utils.getBloodAdd = function(allianceDoc, dragon, kill, isWinner){
	var mapRoundBuff = !!allianceDoc ? AllianceMap.buff[LogicUtils.getAllianceMapRound(allianceDoc)].bloodAddPercent / 100 : 0;
	var blood = kill / this.getAllianceIntInit("KilledCitizenPerBlood");
	return Math.floor(blood * (isWinner ? 0.7 : 0.3) * (1 + mapRoundBuff));
}

/**
 * 创建龙孵化事件
 * @param playerDoc
 * @param dragon
 * @returns {{id: *, dragonType: *, finishTime: number}}
 */
Utils.createPlayerHatchDragonEvent = function(playerDoc, dragon){
	var needTime = PlayerInitData.intInit.playerHatchDragonNeedMinutes.value * 60 * 1000
	var event = {
		id:ShortId.generate(),
		dragonType:dragon.type,
		startTime:Date.now(),
		finishTime:Date.now() + needTime
	}
	return event
}

/**
 * 创建每日任务
 * @returns {Array}
 */
Utils.createDailyQuests = function(){
	var style = 1 + (Math.random() * 3) << 0
	var styleConfig = DailyQuests.dailyQuestStyle[style]
	var questsConfig = DailyQuests.dailyQuests
	var quests = []
	var star1Count = styleConfig.star_1
	var star2Count = styleConfig.star_2
	var star3Count = styleConfig.star_3
	var star4Count = styleConfig.star_4
	var star5Count = styleConfig.star_5
	var starCounts = [star1Count, star2Count, star3Count, star4Count, star5Count]
	for(var i = 0; i < starCounts.length; i++){
		for(var j = 0; j < starCounts[i]; j++){
			var questIndex = (Math.random() * questsConfig.length) >> 0
			var quest = {
				id:ShortId.generate(),
				index:questIndex,
				star:i + 1
			}
			quests.push(quest)
		}
	}
	return quests
}

/**
 * 获取每日任务刷新时间
 * @returns {number}
 */
Utils.getDailyQuestsRefreshTime = function(){
	return PlayerInitData.intInit.dailyQuestsRefreshMinites.value * 60 * 1000
}

/**
 * 获取为任务添加星级说需宝石
 * @returns {intInit.dailyQuestAddStarNeedGemCount.value|*}
 */
Utils.getDailyQuestAddStarNeedGemCount = function(){
	return PlayerInitData.intInit.dailyQuestAddStarNeedGemCount.value
}

/**
 * 创建每日任务事件
 * @param playerDoc
 * @param quest
 * @returns {{id: *, index: *, star: *, startTime: number, finishTime: number}}
 */
Utils.createPlayerDailyQuestEvent = function(playerDoc, quest){
	var config = DailyQuests.dailyQuestStar[quest.star]
	var now = Date.now()
	var finishTime = now + (config.needMinutes * 60 * 1000)
	var event = {
		id:ShortId.generate(),
		index:quest.index,
		star:quest.star,
		startTime:now,
		finishTime:finishTime
	}

	return event
}

/**
 * 获取玩家每日任务事件奖励
 * @param playerDoc
 * @param questEvent
 * @returns {Array}
 */
Utils.getPlayerDailyQuestEventRewards = function(playerDoc, questEvent){
	var config = DailyQuests.dailyQuests[questEvent.index]
	var building = playerDoc.buildings.location_15
	var buildingConfig = BuildingFunction.townHall[building.level]
	var effect = questEvent.star * (1 + buildingConfig.efficiency)
	var rewards = []
	var rewardStrings = config.rewards.split(",")
	_.each(rewardStrings, function(rewardString){
		var param = rewardString.split(":")
		var type = param[0]
		var name = param[1]
		var count = Math.floor(parseInt(param[2]) * effect)
		rewards.push({
			type:type,
			name:name,
			count:count
		})
	})
	return rewards
}

/**
 * 获取出售资源所需的小车
 * @param playerDoc
 * @param resourceType
 * @param resourceName
 * @param resourceCount
 */
Utils.getPlayerCartUsedForSale = function(playerDoc, resourceType, resourceName, resourceCount){
	var resourceCountPerCart = null
	if(_.isEqual(resourceType, "resources")){
		resourceCountPerCart = PlayerInitData.intInit.resourcesPerCart.value
	}else{
		resourceCountPerCart = PlayerInitData.intInit.materialsPerCart.value
	}
	return Math.ceil(resourceCount / resourceCountPerCart);
}

/**
 * 玩家商品出售队列是否足够
 * @param playerDoc
 * @returns {boolean}
 */
Utils.isPlayerSellQueueEnough = function(playerDoc){
	var buildingLevel = playerDoc.buildings.location_14.level
	if(buildingLevel < 1) return false
	var maxSellQueue = BuildingFunction.tradeGuild[buildingLevel].maxSellQueue
	return playerDoc.deals.length < maxSellQueue
}

/**
 * 生产科技名称是否合法
 * @param techName
 * @returns {*}
 */
Utils.isProductionTechNameLegal = function(techName){
	return _.contains(_.keys(ProductionTechs.productionTechs), techName)
}

/**
 * 解锁科技是否合法
 * @param playerDoc
 * @param techName
 * @returns {boolean}
 */
Utils.isPlayerUnlockProductionTechLegal = function(playerDoc, techName){
	var buildingLevel = playerDoc.buildings.location_7.level
	var techConfig = ProductionTechs.productionTechs[techName]
	var preTechConfig = _.find(ProductionTechs.productionTechs, function(theTech){
		return theTech.index == techConfig.unlockBy
	})
	var preTech = playerDoc.productionTechs[preTechConfig.name]
	return preTech.level >= techConfig.unlockLevel && buildingLevel >= techConfig.academyLevel
}

/**
 * 生产科技是否已达最高等级
 * @param techLevel
 * @returns {boolean}
 */
Utils.isProductionTechReachMaxLevel = function(techLevel){
	return this.getPlayerIntInit("productionTechnologyMaxLevel") <= techLevel
}

/**
 * 军事科技名称是否合法
 * @param techName
 * @returns {*}
 */
Utils.isMilitaryTechNameLegal = function(techName){
	return _.contains(_.keys(MilitaryTechs.militaryTechs), techName)
}

/**
 * 获取玩家军事科技所属建筑
 * @param playerDoc
 * @param techName
 * @returns {*}
 */
Utils.getPlayerMilitaryTechBuilding = function(playerDoc, techName){
	var tech = playerDoc.militaryTechs[techName]
	var buildingName = tech.building
	var buildingConfig = _.find(Buildings.buildings, function(config){
		return _.isObject(config) && _.isEqual(buildingName, config.name)
	})
	var building = playerDoc.buildings["location_" + buildingConfig.location]
	return building
}

/**
 * 根据士兵名称获取所属科技建筑
 * @param playerDoc
 * @param soldierName
 * @returns {*}
 */
Utils.getPlayerSoldierMilitaryTechBuilding = function(playerDoc, soldierName){
	var fullSoldierName = soldierName + '_' + playerDoc.soldierStars[soldierName];
	var soldierConfig = Soldiers.normal[fullSoldierName]
	var buildingName = soldierConfig.techBuildingName
	var buildingConfig = _.find(Buildings.buildings, function(config){
		return _.isObject(config) && _.isEqual(buildingName, config.name)
	})
	var building = playerDoc.buildings["location_" + buildingConfig.location]
	return building
}

/**
 * 军事科技是否已达最高等级
 * @param techLevel
 * @returns {boolean}
 */
Utils.isMilitaryTechReachMaxLevel = function(techLevel){
	return this.getPlayerIntInit("militaryTechnologyMaxLevel") <= techLevel
}

/**
 * 获取升级科技所需的科技点
 * @param playerDoc
 * @param soldierName
 * @returns {Boolean}
 */
Utils.isPlayerUpgradeSoldierStarTechPointEnough = function(playerDoc, soldierName){
	var soldierStar = playerDoc.soldierStars[soldierName]
	var config = Soldiers.normal[soldierName + "_" + (soldierStar + 1)]
	var soldierType = config.type
	var techPointNeed = config.upgradeTechPointNeed
	var techNames = _.filter(_.keys(playerDoc.militaryTechs), function(name){
		return name.indexOf(soldierType + "_") == 0
	})
	var techPointTotal = 0
	_.each(techNames, function(name){
		var techPointPerLevel = MilitaryTechs.militaryTechs[name].techPointPerLevel
		var tech = playerDoc.militaryTechs[name]
		techPointTotal += techPointPerLevel * tech.level
	})
	return techPointTotal >= techPointNeed
}

/**
 * 道具名称是否存在
 * @param itemName
 * @returns {*}
 */
Utils.isItemNameExist = function(itemName){
	var keys = []
	keys = keys.concat(_.keys(Items.special))
	keys = keys.concat(_.keys(Items.buff))
	keys = keys.concat(_.keys(Items.resource))
	keys = keys.concat(_.keys(Items.speedup))
	return _.contains(keys, itemName)
}

/**
 * 获取某个商品的配置信息
 * @param itemName
 * @returns {*}
 */
Utils.getItemConfig = function(itemName){
	return _.contains(_.keys(Items.special), itemName) ? Items.special[itemName]
		: _.contains(_.keys(Items.buff), itemName) ? Items.buff[itemName]
		: _.contains(_.keys(Items.resource), itemName) ? Items.resource[itemName]
		: Items.speedup[itemName]
}

/**
 * 创建龙死亡事件
 * @param playerDoc
 * @param dragon
 * @returns {{id: *, dragonType: *, startTime: number, finishTime: number}}
 */
Utils.createPlayerDragonDeathEvent = function(playerDoc, dragon){
	var reviveTime = PlayerInitData.intInit.dragonReviveNeedMinutes.value * 60 * 1000
	var event = {
		id:ShortId.generate(),
		dragonType:dragon.type,
		startTime:Date.now(),
		finishTime:Date.now() + reviveTime
	}
	return event
}

/**
 * 根据击杀和地形获取奖励
 * @param killScore
 * @param terrain
 * @returns {Array}
 */
Utils.getRewardsByKillScoreAndTerrain = function(killScore, terrain){
	var ParseConfig = function(config){
		var objects = []
		var configArray_1 = config.split(",")
		_.each(configArray_1, function(config_1){
			var configArray_2 = config_1.split(":")
			var object = {
				reward:{
					type:configArray_2[0],
					name:configArray_2[1],
					count:parseInt(configArray_2[2])
				},
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

	var config = null
	for(var i = KillDropItems[terrain].length - 1; i >= 1; i--){
		var theConfig = KillDropItems[terrain][i]
		if(killScore >= theConfig.killScoreMin){
			config = theConfig
			break
		}
	}

	if(!_.isObject(config)) return []

	var rewards = []
	var items = ParseConfig(config.rewards)
	items = SortFunc(items)
	var item = items[0]
	rewards.push({
		type:item.type,
		name:item.name,
		count:item.count
	})

	return [SortFunc(items)[0].reward];
}

/**
 * 获取所需的赌币
 * @param gachaType
 * @returns {*}
 */
Utils.getCasinoTokeNeededInGachaType = function(gachaType){
	if(_.isEqual(gachaType, Consts.GachaType.Normal)){
		return PlayerInitData.intInit.casinoTokenNeededPerNormalGacha.value
	}
	return PlayerInitData.intInit.casinoTokenNeededPerAdvancedGacha.value
}

/**
 * 获取Gacha出的道具
 * @param gachaType
 * @param excludes
 * @returns {*}
 */
Utils.getGachaItemByType = function(gachaType, excludes){
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

	var items = []
	var itemConfigs = Gacha[gachaType]
	_.each(itemConfigs, function(itemConfig){
		if(_.isObject(itemConfig)){
			if(!_.contains(excludes, itemConfig.itemName)){
				var item = {
					name:itemConfig.itemName,
					count:itemConfig.itemCount,
					weight:itemConfig.weight
				}
				items.push(item)
			}
		}
	})

	items = SortFunc(items)
	return items[0]
}

/**
 * 获取每日登陆奖励中当日的奖励道具
 * @param day
 * @returns {*}
 */
Utils.getDay60RewardItem = function(day){
	var configString = Activities.day60[day].rewards
	var configStrings = configString.split(",")
	var rewards = []
	_.each(configStrings, function(configString){
		var params = configString.split(":")
		var reward = {
			type:params[0],
			name:params[1],
			count:parseInt(params[2])
		}
		rewards.push(reward)
	})

	return rewards
}

/**
 * 玩家是否达到在线奖励所需的时间
 * @param playerDoc
 * @param timePoint
 * @returns {boolean}
 */
Utils.isPlayerReachOnlineTimePoint = function(playerDoc, timePoint){
	var onlineTime = playerDoc.countInfo.todayOnLineTime + (Date.now() - playerDoc.countInfo.lastLoginTime)
	var onlineMinutes = Math.floor(onlineTime / 1000 / 60)
	var needMinutes = Activities.online[timePoint].onLineMinutes
	return onlineMinutes >= needMinutes
}

/**
 * 获取在线时间奖励
 * @param timePoint
 * @returns {Array}
 */
Utils.getOnlineRewardItem = function(timePoint){
	var configString = Activities.online[timePoint].rewards
	var configStrings = configString.split(",")
	var rewards = []
	_.each(configStrings, function(configString){
		var params = configString.split(":")
		var reward = {
			type:params[0],
			name:params[1],
			count:parseInt(params[2])
		}
		rewards.push(reward)
	})

	return rewards
}

/**
 * 获取14日登陆奖励
 * @param day
 * @returns {Array}
 */
Utils.getDay14Rewards = function(day){
	var configString = Activities.day14[day].rewards
	var configStrings = configString.split(",")
	var rewards = []
	_.each(configStrings, function(configString){
		var params = configString.split(":")
		var reward = {
			type:params[0],
			name:params[1],
			count:parseInt(params[2])
		}
		rewards.push(reward)
	})

	return rewards
}

/**
 * 获取首冲奖励
 * @returns {Array}
 */
Utils.getFirstIAPRewards = function(){
	var configString = PlayerInitData.stringInit.firstIAPRewards.value
	var configStrings = configString.split(",")
	var rewards = []
	_.each(configStrings, function(configString){
		var params = configString.split(":")
		var reward = {
			type:params[0],
			name:params[1],
			count:parseInt(params[2])
		}
		rewards.push(reward)
	})

	return rewards
}

/**
 * 获取首次加入联盟奖励
 * @returns {Array}
 */
Utils.getFirstJoinAllianceRewards = function(){
	var configString = PlayerInitData.stringInit.firstJoinAllianceRewards.value
	var configStrings = configString.split(",")
	var rewards = []
	_.each(configStrings, function(configString){
		var params = configString.split(":")
		var reward = {
			type:params[0],
			name:params[1],
			count:parseInt(params[2])
		}
		rewards.push(reward)
	})

	return rewards
}

/**
 * 获取日常任务奖励
 * @param index
 * @returns {Array}
 */
Utils.getDailyTaskRewardsByIndex = function(index){
	var configString = PlayerInitData.dailyTaskRewards[index].rewards;
	var configStrings = configString.split(";")
	var rewards = []
	_.each(configStrings, function(configString){
		var params = configString.split(":")
		var reward = {
			type:params[0],
			name:params[1],
			count:parseInt(params[2])
		}
		rewards.push(reward)
	})

	return rewards
}

/**
 * 获取玩家等级
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerLevel = function(playerDoc){
	var levelConfigs = PlayerInitData.playerLevel
	for(var i = levelConfigs.length - 1; i >= 1; i--){
		var levelConfig = levelConfigs[i]
		if(playerDoc.basicInfo.levelExp >= levelConfig.expFrom) return levelConfig.level
	}
	return 1
}

/**
 * 新手冲击奖励是否存在
 * @param levelupIndex
 * @returns {*}
 */
Utils.isLevelupIndexExist = function(levelupIndex){
	return _.isObject(Activities.levelup[levelupIndex])
}

/**
 * 玩家等级是否足够以领取冲级奖励
 * @param playerDoc
 * @param levelupIndex
 * @returns {boolean}
 */
Utils.isPlayerKeepLevelLegalForLevelupIndex = function(playerDoc, levelupIndex){
	var keepLevel = playerDoc.buildings.location_1.level
	var needLevel = Activities.levelup[levelupIndex].level
	return keepLevel >= needLevel
}

/**
 * 获取冲级奖励
 * @param levelupIndex
 * @returns {Array}
 */
Utils.getLevelupRewards = function(levelupIndex){
	var configString = Activities.levelup[levelupIndex].rewards
	var configStrings = configString.split(",")
	var rewards = []
	_.each(configStrings, function(configString){
		var params = configString.split(":")
		var reward = {
			type:params[0],
			name:params[1],
			count:parseInt(params[2])
		}
		rewards.push(reward)
	})

	return rewards
}

/**
 * 玩家是否有相关道具Buff
 * @param playerDoc
 * @param eventType
 * @returns {*}
 */
Utils.isPlayerHasItemEvent = function(playerDoc, eventType){
	return _.some(playerDoc.itemEvents, function(event){
		return _.isEqual(event.type, eventType)
	})
}

/**
 * 获取玩家生产科技的Buff效果
 * @param playerDoc
 * @param techName
 * @returns {number}
 */
Utils.getPlayerProductionTechBuff = function(playerDoc, techName){
	var techConfig = ProductionTechs.productionTechs[techName]
	var tech = playerDoc.productionTechs[techName]
	return tech.level * techConfig.effectPerLevel
}

/**
 * 获取玩家地形资源产量加成
 * @param playerDoc
 * @param resourceName
 * @returns {number}
 */
Utils.getPlayerTerrainResourceBuff = function(playerDoc, resourceName){
	resourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
	if(playerDoc.basicInfo.terrain === Consts.AllianceTerrain.GrassLand){
		return this.getPlayerIntInit('grassLand' + resourceName + 'AddPercent') / 100;
	}
	return 0;
}

/**
 * 获取玩家地形攻击力加成
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerTerrainAttackBuff = function(playerDoc){
	if(playerDoc.basicInfo.terrain === Consts.AllianceTerrain.Desert){
		return this.getPlayerIntInit('desertAttackAddPercent') / 100;
	}
	return 0;
}

/**
 * 获取玩家地形防御力加成
 * @param playerDoc
 * @returns {number}
 */
Utils.getPlayerTerrainDefenceBuff = function(playerDoc){
	if(playerDoc.basicInfo.terrain === Consts.AllianceTerrain.IceField){
		return this.getPlayerIntInit('iceFieldDefenceAddPercent') / 100;
	}
	return 0;
}

/**
 * 获取玩家军事科技的Buff效果
 * @param playerDoc
 * @param techName
 * @returns {number}
 */
Utils.getPlayerMilitaryTechBuff = function(playerDoc, techName){
	var techConfig = MilitaryTechs.militaryTechs[techName]
	var tech = playerDoc.militaryTechs[techName]
	return tech.level * techConfig.effectPerLevel
}

/**
 * 获取医院最大容量
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerHospitalMaxCitizen = function(playerDoc){
	var itemBuff = this.getPlayerProductionTechBuff(playerDoc, "rescueTent")
	var building = playerDoc.buildings.location_6
	if(building.level < 1) return 0
	var config = BuildingFunction.hospital[building.level]
	return Math.floor(config.maxCitizen * (1 + itemBuff))
}

/**
 * 为玩家添加伤兵
 * @param playerDoc
 * @param playerData
 * @param woundedSoldiers
 */
Utils.addPlayerWoundedSoldiers = function(playerDoc, playerData, woundedSoldiers){
	var maxCitizen = this.getPlayerHospitalMaxCitizen(playerDoc)
	var usedCitizen = this.getPlayerSoldiersCitizen(playerDoc, LogicUtils.getFormatedSoldiers(playerDoc.woundedSoldiers))
	if(maxCitizen > usedCitizen){
		_.each(woundedSoldiers, function(woundedSoldier){
			playerDoc.woundedSoldiers[woundedSoldier.name] += woundedSoldier.count
			playerData.push(["woundedSoldiers." + woundedSoldier.name, playerDoc.woundedSoldiers[woundedSoldier.name]])
		})
	}
}

/**
 * 获取商城商品的配置信息
 * @returns {GameDatas.StoreItems.items|*}
 */
Utils.getStoreItemConfigs = function(){
	return StoreItems.items
}

/**
 * 根据军事科技名称查找士兵升星事件
 * @param playerDoc
 * @param militaryTechName
 * @returns {*}
 */
Utils.getPlayerSoldierStarUpgradeEvent = function(playerDoc, militaryTechName){
	var buildingName = MilitaryTechs.militaryTechs[militaryTechName].building
	return _.find(playerDoc.soldierStarEvents, function(event){
		var soldierConfig = Soldiers.normal[event.name + "_1"]
		return _.isEqual(soldierConfig.techBuildingName, buildingName)
	})
}

/**
 * 查找是否有此科技建筑对应的军事科技升级事件
 * @param playerDoc
 * @param buildingName
 * @returns {*}
 */
Utils.getPlayerMilitaryTechUpgradeEvent = function(playerDoc, buildingName){
	var soldierStarEvent = _.find(playerDoc.soldierStarEvents, function(event){
		var soldierConfig = Soldiers.normal[event.name + "_1"]
		return _.isEqual(soldierConfig.techBuildingName, buildingName)
	})
	if(_.isObject(soldierStarEvent)){
		return {type:"soldierStarEvents", event:soldierStarEvent}
	}
	var militaryTechEvent = _.find(playerDoc.militaryTechEvents, function(event){
		var techConfig = MilitaryTechs.militaryTechs[event.name]
		return _.isEqual(techConfig.building, buildingName)
	})
	if(_.isObject(militaryTechEvent)){
		return {type:"militaryTechEvents", event:militaryTechEvent}
	}
}

/**
 * 检查玩家建筑升级是否合法
 * @param playerDoc
 * @param location
 * @returns {boolean}
 */
Utils.isPlayerBuildingUpgradeLegal = function(playerDoc, location){
	var building = playerDoc.buildings["location_" + location]
	var config = _.find(Buildings.buildings, function(config){
		return _.isObject(config) && _.isEqual(config.name, building.type)
	})
	if(building.level <= 5) return true
	var configParams = config.preCondition.split("_")
	var preType = configParams[0]
	var preName = configParams[1]
	var preLevel = parseInt(configParams[2])
	if(_.isEqual("building", preType)){
		var preBuilding = LogicUtils.getPlayerBuildingByType(playerDoc, preName)
		return preBuilding.level >= building.level + preLevel
	}else{
		var houses = LogicUtils.getPlayerHousesByType(playerDoc, preName)
		houses = _.sortBy(houses, function(house){
			return -house.level
		})
		return houses.length == 0 ? false : houses[0].level >= building.level + preLevel
	}
}

/**
 * 检查玩家小屋升级是否合法
 * @param playerDoc
 * @param buildingLocation
 * @param houseType
 * @param houseLocation
 * @returns {boolean}
 */
Utils.isPlayerHouseUpgradeLegal = function(playerDoc, buildingLocation, houseType, houseLocation){
	var theHouses = playerDoc.buildings["location_" + buildingLocation].houses
	var theHouse = _.find(theHouses, function(house){
		return house.location == houseLocation
	})
	if(!_.isObject(theHouse)) theHouse = {level:0}
	if(theHouse.level <= 5) return true
	var config = Houses.houses[houseType]
	var configParams = config.preCondition.split("_")
	var preType = configParams[0]
	var preName = configParams[1]
	var preLevel = parseInt(configParams[2])
	if(_.isEqual("building", preType)){
		var preBuilding = LogicUtils.getPlayerBuildingByType(playerDoc, preName)
		return preBuilding.level >= theHouse.level + preLevel
	}else{
		var houses = LogicUtils.getPlayerHousesByType(playerDoc, preName)
		houses = _.sortBy(houses, function(house){
			return -house.level
		})
		return houses.length == 0 ? false : houses[0].level >= theHouse.level + preLevel
	}
}

/**
 * 获取玩家冲级奖励过期时间
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerLevelupExpireTime = function(playerDoc){
	return playerDoc.countInfo.registerTime + (PlayerInitData.intInit.playerLevelupRewardsHours.value * 60 * 60 * 1000)
}

/**
 * 获取玩家Int配置表
 * @param type
 * @returns {*}
 */
Utils.getPlayerIntInit = function(type){
	return PlayerInitData.intInit[type].value
}

/**
 * 获取联盟Int配置表
 * @param type
 * @returns {*}
 */
Utils.getAllianceIntInit = function(type){
	return AllianceInitData.intInit[type].value
}

/**
 * 获取日常任务奖励
 * @param type
 * @param id
 * @returns {*}
 */
Utils.getGrowUpTaskRewards = function(type, id){
	var config = GrowUpTasks[type][id]
	return {
		rewards:[
			{
				type:'resources',
				name:'wood',
				count:config.wood
			}, {
				type:'resources',
				name:'stone',
				count:config.stone
			}, {
				type:'resources',
				name:'iron',
				count:config.iron
			}, {
				type:'resources',
				name:'food',
				count:config.food
			}, {
				type:'resources',
				name:'coin',
				count:config.coin
			}, {
				type:'resources',
				name:'gem',
				count:config.gem
			}
		],
		exp:config.exp
	}
}

/**
 * 根据连续登录天数获取Vip经验值的增加量
 * @param vipLoginDaysCount
 * @returns {*}
 */
Utils.getPlayerVipExpByLoginDaysCount = function(vipLoginDaysCount){
	var maxLoginDaysCount = Vip.loginDays.length - 1
	if(vipLoginDaysCount > maxLoginDaysCount) vipLoginDaysCount = maxLoginDaysCount
	var expAdd = Vip.loginDays[vipLoginDaysCount].expAdd
	return expAdd
}

/**
 * 为玩家增加Vip经验值
 * @param playerDoc
 * @param playerData
 * @param expAdd
 * @param eventFuncs
 * @param timeEventService
 */
Utils.addPlayerVipExp = function(playerDoc, playerData, expAdd, eventFuncs, timeEventService){
	var preLevel = this.getPlayerVipLevel(playerDoc)
	playerDoc.basicInfo.vipExp += expAdd
	playerData.push(["basicInfo.vipExp", playerDoc.basicInfo.vipExp])
	var afterLevel = this.getPlayerVipLevel(playerDoc)
	var itemConfig = Items.special.vipActive_3
	var totalVipTime = 0
	for(var i = 0; i < afterLevel - preLevel; i++){
		totalVipTime += parseInt(itemConfig.effect) * 60 * 1000
	}
	if(totalVipTime <= 0) return

	var event = playerDoc.vipEvents[0]
	if(_.isObject(event) && !LogicUtils.willFinished(event.finishTime)){
		event.finishTime += totalVipTime
		playerData.push(["vipEvents." + playerDoc.vipEvents.indexOf(event) + ".finishTime", event.finishTime])
		eventFuncs.push([timeEventService, timeEventService.updatePlayerTimeEventAsync, playerDoc, "vipEvents", event.id, event.finishTime - Date.now()])
	}else{
		if(_.isObject(event) && LogicUtils.willFinished(event.finishTime)){
			playerData.push("vipEvents." + playerDoc.vipEvents.indexOf(event), null)
			LogicUtils.removeItemInArray(playerDoc.vipEvents, event)
			eventFuncs.push([timeEventService, timeEventService.removePlayerTimeEventAsync, playerDoc, "vipEvents", event.id])
		}
		event = {
			id:ShortId.generate(),
			startTime:Date.now(),
			finishTime:Date.now() + totalVipTime
		}
		playerDoc.vipEvents.push(event)
		playerData.push(["vipEvents." + playerDoc.vipEvents.indexOf(event), event])
		eventFuncs.push([timeEventService, timeEventService.addPlayerTimeEventAsync, playerDoc, "vipEvents", event.id, event.finishTime - Date.now()])
	}
}

/**
 * 玩家是否还能尽享免费普通Gacha
 * @param playerDoc
 * @returns {boolean}
 */
Utils.isPlayerCanFreeNormalGacha = function(playerDoc){
	var freeCount = PlayerInitData.intInit.freeNormalGachaCountPerDay.value
	freeCount += Vip.level[playerDoc.vipEvents.length > 0 ? this.getPlayerVipLevel(playerDoc) : 0].normalGachaAdd
	return freeCount > playerDoc.countInfo.todayFreeNormalGachaCount
}

/**
 * 为联盟添加帮助事件
 * @param allianceDoc
 * @param playerDoc
 * @param eventType
 * @param eventId
 * @param objectName
 * @param objectLevel
 * @returns {*}
 */
Utils.addAllianceHelpEvent = function(allianceDoc, playerDoc, eventType, eventId, objectName, objectLevel){
	var keep = playerDoc.buildings.location_1
	var event = {
		id:eventId,
		playerData:{
			id:playerDoc._id,
			name:playerDoc.basicInfo.name,
			vipExp:playerDoc.basicInfo.vipExp
		},
		eventData:{
			type:eventType,
			id:eventId,
			name:objectName,
			level:objectLevel,
			maxHelpCount:BuildingFunction.keep[keep.level].beHelpedCount,
			helpedMembers:[]
		}
	}
	allianceDoc.helpEvents.push(event)
	return event
}

/**
 * 玩家士兵是否处于锁定状态(兵营等级解锁)
 * @param playerDoc
 * @param soldierName
 */
Utils.isPlayerSoldierLocked = function(playerDoc, soldierName){
	var fullSoldierName = soldierName + '_' + playerDoc.soldierStars[soldierName];
	return Soldiers.normal[fullSoldierName].needBarracksLevel > playerDoc.buildings.location_5.level;
}

/**
 * 某道具是否在联盟商店出售
 * @param allianceDoc
 * @param itemName
 * @returns {*}
 */
Utils.isItemSellInAllianceShop = function(allianceDoc, itemName){
	var building = this.getAllianceBuildingByName(allianceDoc, Consts.AllianceBuildingNames.Shop)
	var unlockedItems = AllianceBuilding.shop[building.level].itemsUnlock.split(",")
	return _.contains(unlockedItems, itemName)
}

/**
 * 协助加速忠诚值获取
 * @param playerDoc
 * @param playerData
 * @param helpCount
 */
Utils.addPlayerHelpLoyalty = function(playerDoc, playerData, helpCount){
	var maxLoyaltyGetPerDay = this.getPlayerIntInit("maxLoyaltyGetPerDay")
	var loyaltyGet = this.getPlayerIntInit("loyaltyCountPerHelp") * helpCount
	if(playerDoc.countInfo.todayLoyaltyGet < maxLoyaltyGetPerDay){
		if(playerDoc.countInfo.todayLoyaltyGet + loyaltyGet > maxLoyaltyGetPerDay){
			loyaltyGet = maxLoyaltyGetPerDay - playerDoc.countInfo.todayLoyaltyGet
		}
		playerDoc.countInfo.todayLoyaltyGet += loyaltyGet
		playerData.push(["countInfo.todayLoyaltyGet", playerDoc.countInfo.todayLoyaltyGet])
		playerDoc.allianceData.loyalty += loyaltyGet
		playerData.push(["allianceData.loyalty", playerDoc.allianceData.loyalty])
	}
}

/**
 * 获取联盟最大人数
 * @param allianceDoc
 * @returns {number}
 */
Utils.getAllianceMemberMaxCount = function(allianceDoc){
	var allianceBuilding = this.getAllianceBuildingByName(allianceDoc, Consts.AllianceBuildingNames.Palace)
	return AllianceBuilding.palace[allianceBuilding.level].memberCount
}

/**
 * 获取玩家等级升级奖励
 * @param level
 * @returns {Array}
 */
Utils.getLevelUpRewards = function(level){
	var rewardStrings = PlayerInitData.playerLevel[level].rewards.split(",")
	var rewards = [];
	_.each(rewardStrings, function(rewardString){
		var params = rewardString.split(":")
		var reward = {
			type:params[0],
			name:params[1],
			count:parseInt(params[2])
		}
		rewards.push(reward);
	})
	return rewards;
}

/**
 * 创建联盟村落刷新事件
 * @param villageName
 * @returns {{id: *, name: *, startTime: number, finishTime: number}}
 */
Utils.createVillageCreateEvent = function(villageName){
	var event = {
		id:ShortId.generate(),
		name:villageName,
		startTime:Date.now(),
		finishTime:Date.now() + (this.getAllianceIntInit('villageRefreshMinutes') * 60 * 1000)
	}
	return event
}

/**
 * 获取服务器本地化配置
 * @param type
 * @param key
 * @returns {*}
 */
Utils.getLocalizationConfig = function(type, key){
	return Localizations[type][key]
}

/**
 * 查找联盟建筑
 * @param allianceDoc
 * @param buildingName
 */
Utils.getAllianceBuildingByName = function(allianceDoc, buildingName){
	return _.find(allianceDoc.buildings, function(building){
		return _.isEqual(building.name, buildingName)
	})
}

/**
 * 获取联盟村落总个数
 * @param allianceDoc
 * @returns {*}
 */
Utils.getAllianceVillagesTotalCount = function(allianceDoc){
	var building = this.getAllianceBuildingByName(allianceDoc, Consts.AllianceBuildingNames.OrderHall)
	return AllianceBuilding[building.name][building.level].villageCount
}

/**
 * 创建联盟村落
 * @param allianceDoc
 * @param allianceData
 * @param count
 */
Utils.createAllianceVillage = function(allianceDoc, allianceData, count){
	var self = this
	var mapObjects = allianceDoc.mapObjects
	var map = MapUtils.buildMap(allianceDoc.basicInfo.terrainStyle, mapObjects)
	var villageTypeConfigs = this.getAllianceVillageTypeConfigs();
	while(count > 0){
		var typeConfig = villageTypeConfigs[_.random(0, villageTypeConfigs.length - 1)];
		var width = typeConfig.width
		var height = typeConfig.height
		var rect = MapUtils.getRect(map, width, height)
		if(_.isObject(rect)){
			var villageMapObject = MapUtils.addMapObject(map, mapObjects, rect, typeConfig.name)
			allianceData.push(["mapObjects." + allianceDoc.mapObjects.indexOf(villageMapObject), villageMapObject])
			var village = self.addAllianceVillageObject(allianceDoc, villageMapObject)
			allianceData.push(["villages." + allianceDoc.villages.indexOf(village), village])
		}
		count--
	}
}

/**
 * 刷新联盟属性
 * @param allianceDoc
 * @param allianceData
 */
Utils.refreshAllianceBasicInfo = function(allianceDoc, allianceData){
	var totalPower = 0
	var totalKill = 0
	var powerPercent = [
		{from:1, to:2, percent:0.5},
		{from:2, to:5, percent:0.2},
		{from:5, to:10, percent:0.1},
		{from:10, to:15, percent:0.05},
		{from:15, to:9999, percent:0.02}
	]
	var sortedMembers = _.sortBy(allianceDoc.members, function(member){
		return -member.power
	})
	for(var i = 0; i < sortedMembers.length; i++){
		for(var j = 0; j < powerPercent.length; j++){
			if((i + 1) < powerPercent[j].to){
				totalPower += Math.ceil(sortedMembers[i].power * powerPercent[j].percent)
				totalKill += sortedMembers[i].kill
				break
			}
		}
	}
	_.each(allianceDoc.buildings, function(building){
		totalPower += AllianceBuilding[building.name][building.level].power
	})
	allianceDoc.basicInfo.power = totalPower
	allianceData.push(["basicInfo.power", allianceDoc.basicInfo.power])
	allianceDoc.basicInfo.kill = totalKill
	allianceData.push(["basicInfo.kill", allianceDoc.basicInfo.kill])
}

/**
 * 龙技能名称是否存在
 * @param skillName
 * @returns {boolean}
 */
Utils.isValidDragonSkillName = function(skillName){
	var skillTotalCount = 7
	var config = Dragons.dragons
	for(var i = 1; i <= skillTotalCount; i++){
		if(_.isEqual(config["skill_" + i], skillName)) return true
	}
	return false
}

/**
 * 在线时间节点是否合法
 * @param timePoint
 */
Utils.isOnLineTimePointExist = function(timePoint){
	return _.isObject(Activities.online[timePoint])
}

/**
 * 获取野怪奖励
 * @param monsterLevel
 * @returns {*}
 */
Utils.getMonsterRewards = function(monsterLevel){
	var rewardStrings = AllianceInitData.monsters[monsterLevel].rewards.split(',');
	var rewards = [];
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			reward:{
				type:rewardParams[0],
				name:rewardParams[1],
				count:parseInt(rewardParams[2])
			},
			weight:parseInt(rewardParams[3])
		};
		rewards.push(reward);
	})
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
	return SortFunc(rewards)[0].reward;
}

/**
 * 是否资源道具
 * @param itemName
 */
Utils.isResourceItem = function(itemName){
	return _.isObject(Items.resource[itemName]);
}

/**
 * 孵化巨龙是否合法
 * @param playerDoc
 * @returns {boolean}
 */
Utils.isPlayerDragonHatchLegal = function(playerDoc){
	var dragonCount = 0;
	_.each(playerDoc.dragons, function(dragon){
		if(dragon.star > 0) dragonCount += 1;
	})
	var building = playerDoc.buildings.location_4;
	return dragonCount < BuildingFunction.dragonEyrie[building.level].dragonCount;
}

/**
 * 创建PVE战斗野怪
 * @param sectionName
 * @returns {*}
 */
Utils.createPveSecionTroopForFight = function(sectionName){
	var troopStrings = PvE.sections[sectionName].troops.split(',')
	var dragonStrings = troopStrings.shift().split(':');
	var dragon = {
		type:dragonStrings[0],
		star:parseInt(dragonStrings[1]),
		level:parseInt(dragonStrings[2])
	};
	var soldiers = [];
	_.each(troopStrings, function(troopString){
		var soldierStrings = troopString.split(':');
		var soldier = {
			name:soldierStrings[0],
			star:parseInt(soldierStrings[1]),
			count:parseInt(soldierStrings[2])
		}
		soldiers.push(soldier);
	})
	var dragonForFight = this.createDragonForFight(dragon);
	var soldiersForFight = this.createSoldiersForFight(soldiers);

	return {dragonForFight:dragonForFight, soldiers:soldiers, soldiersForFight:soldiersForFight};
}

/**
 * 获取Pve关卡奖励
 * @param sectionName
 * @param fightStar
 * @returns {Array}
 */
Utils.getPveSectionReward = function(sectionName, fightStar){
	if(fightStar <= 0) return null;
	var rewards = [];
	var rewardStrings = PvE.sections[sectionName].rewards.split(',');
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			reward:{
				type:rewardParams[0],
				name:rewardParams[1],
				count:parseInt(rewardParams[2])
			},
			weight:parseInt(rewardParams[3])
		}
		rewards.push(reward);
	})
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
	return SortFunc(rewards)[0].reward;
}

/**
 * PvE关卡是否存在
 * @param sectionName
 */
Utils.isPvESectionExist = function(sectionName){
	return _.isObject(PvE.sections[sectionName]);
}

/**
 * PvE关卡是否能被扫荡
 * @param sectionName
 * @returns {boolean}
 */
Utils.isPvESectionSweepAble = function(sectionName){
	return _.isObject(PvE.sections[sectionName]) && !!PvE.sections[sectionName].sweepAble;
}

/**
 * 领取PvE星级奖励所获得的星星数量是否足够
 * @param playerDoc
 * @param stageName
 * @returns {boolean}
 */
Utils.isPlayerPvEStageRewardStarEnough = function(playerDoc, stageName){
	var starNeed = PvE.stages[stageName].needStar;
	var stageIndex = parseInt(stageName.split('_')[0] - 1);
	var starHas = 0;
	_.each(playerDoc.pve[stageIndex].sections, function(star, index){
		var sectionName = (stageIndex + 1) + '_' + (index + 1);
		var starAble = PvE.sections[sectionName].starAble;
		if(starAble) starHas += star;
	})
	return starHas >= starNeed;
}

/**
 * 获取PvE关卡星级奖励
 * @param stageName
 * @returns {Array}
 */
Utils.getPveStageRewards = function(stageName){
	var rewards = [];
	var rewardStrings = PvE.stages[stageName].rewards.split(',');
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			type:rewardParams[0],
			name:rewardParams[1],
			count:parseInt(rewardParams[2])
		}
		rewards.push(reward);
	})
	return rewards;
}

/**
 * PvE星级奖励是否存在
 * @param stageName
 */
Utils.isPvEStageExist = function(stageName){
	return _.isObject(PvE.stages[stageName]);
}

/**
 * 获取最大PvE关卡战斗次数
 * @param sectionName
 * @returns {*}
 */
Utils.getPvEMaxFightCount = function(sectionName){
	return PvE.sections[sectionName].maxFightCount;
}

/**
 * 获取PvE关卡所需体力
 * @param sectionName
 * @param count
 */
Utils.getPvESectionStaminaCount = function(sectionName, count){
	return PvE.sections[sectionName].staminaUsed * count;
}

/**
 * 获取PvE关卡地形
 * @param sectionName
 * @returns {*}
 */
Utils.getPvESectionTerrain = function(sectionName){
	return PvE.sections[sectionName].terrain;
}

/**
 * 获取联盟建筑坐标
 * @param allianceDoc
 * @param buildingName
 * @returns {*}
 */
Utils.getAllianceBuildingLocation = function(allianceDoc, buildingName){
	var config = AllianceMap['allianceMap_' + allianceDoc.basicInfo.terrainStyle];
	var building = _.find(config, function(building){
		return building.name === buildingName;
	})
	return !!building ? {x:building.x, y:building.y} : null;
}

/**
 * 移动联盟是否合法
 * @param allianceDoc
 * @param targetMapRound
 * @returns {boolean}
 */
Utils.isAllianceMoveLegal = function(allianceDoc, targetMapRound){
	var building = this.getAllianceBuildingByName(allianceDoc, Consts.AllianceBuildingNames.Palace);
	return building.level >= AllianceMap.moveLimit[targetMapRound].needPalaceLevel;
}

/**
 * 获取每日任务最大数量
 */
Utils.getDailyTasksMaxCount = function(){
	return _.keys(PlayerInitData.dailyTasks).length;
}

/**
 * 玩家每日任务积分是否达到领奖标准
 * @param playerDoc
 * @param index
 * @returns {boolean}
 */
Utils.isPlayerDailyTaskScoreReachIndex = function(playerDoc, index){
	var totalScore = 0;
	for(var i = 0; i < playerDoc.dailyTasks.length; i++){
		var count = playerDoc.dailyTasks[i];
		if(count > 0){
			var config = _.find(PlayerInitData.dailyTasks, function(config){
				return config.index === i;
			})
			totalScore += config.score * count;
		}
	}
	return totalScore >= PlayerInitData.dailyTaskRewards[index].score;
}

/**
 * 获取联盟野怪刷新时间
 * @returns {number}
 */
Utils.getMonsterRefreshTime = function(){
	return 1000 * 60 * this.getAllianceIntInit('monsterRefreshMinutes');
}

/**
 * 村落刷新时间
 * @returns {number}
 */
Utils.getVillageRefreshTime = function(){
	return 1000 * 60 * this.getAllianceIntInit('villageRefreshMinutes');
}

/**
 * 获取活动类型
 */
Utils.getActivityTypes = function(){
	return _.keys(ScheduleActivities.type);
}

/**
 * 获取联盟活动类型
 */
Utils.getAllianceActivityTypes = function(){
	return _.keys(ScheduleActivities.allianceType);
}

/**
 * 玩家活动数据是否有效
 * @param activity
 * @param serverActivities
 */
Utils.isPlayerActivityValid = function(activity, serverActivities){
	var isValid = _.some(serverActivities.on, function(serverActivity){
		return activity.finishTime === serverActivity.finishTime;
	})
	if(!isValid){
		isValid = _.some(serverActivities.expired, function(serverActivity){
			return activity.finishTime === serverActivity.removeTime - (ScheduleActivities.type[activity.type].expireHours * 60 * 60 * 1000);
		})
	}
	return isValid;
};

/**
 * 玩家已结束的活动是否有效
 * @param activity
 * @param serverActivities
 * @returns {isValid}
 */
Utils.isPlayerExpiredActivityValid = function(activity, serverActivities){
	var isValid = _.some(serverActivities.expired, function(serverActivity){
		return activity.finishTime === serverActivity.removeTime - (ScheduleActivities.type[activity.type].expireHours * 60 * 60 * 1000);
	})
	return isValid;
}

/**
 * 联盟活动数据是否有效
 * @param activity
 * @param serverActivities
 */
Utils.isAllianceActivityValid = function(activity, serverActivities){
	var isValid = _.some(serverActivities.on, function(serverActivity){
		return activity.finishTime === serverActivity.finishTime;
	})
	if(!isValid){
		isValid = _.some(serverActivities.expired, function(serverActivity){
			return activity.finishTime === serverActivity.removeTime - (ScheduleActivities.allianceType[activity.type].expireHours * 60 * 60 * 1000);
		})
	}
	return isValid;
};

/**
 * 联盟已结束的活动是否有效
 * @param activity
 * @param serverActivities
 * @returns {isValid}
 */
Utils.isAllianceExpiredActivityValid = function(activity, serverActivities){
	var isValid = _.some(serverActivities.expired, function(serverActivity){
		return activity.finishTime === serverActivity.removeTime - (ScheduleActivities.allianceType[activity.type].expireHours * 60 * 60 * 1000);
	})
	return isValid;
}

/**
 * 获取活动积分奖励所需积分
 * @param type
 * @param index
 * @returns {*}
 */
Utils.getActivityScoreByIndex = function(type, index){
	var score = ScheduleActivities.type[type]['scoreIndex' + index]
	return score;
};


/**
 * 获取联盟活动积分奖励所需积分
 * @param type
 * @param index
 * @returns {*}
 */
Utils.getAllianceActivityScoreByIndex = function(type, index){
	var score = ScheduleActivities.allianceType[type]['scoreIndex' + index]
	return score;
};

/**
 * 获取活动积分奖励
 * @param type
 * @param index
 * @returns {Array}
 */
Utils.getActivityScoreRewards = function(type, index){
	var config = ScheduleActivities.type[type]['scoreRewards' + index];
	if(!config){
		return [];
	}
	var rewards = [];
	var rewardStrings = config.split(',');
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			type:rewardParams[0],
			name:rewardParams[1],
			count:parseInt(rewardParams[2])
		}
		rewards.push(reward);
	})
	return rewards;
};


/**
 * 获取活动积分奖励
 * @param type
 * @param index
 * @returns {Array}
 */
Utils.getAllianceActivityScoreRewards = function(type, index){
	var config = ScheduleActivities.allianceType[type]['scoreRewards' + index];
	if(!config){
		return [];
	}
	var rewards = [];
	var rewardStrings = config.split(',');
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			type:rewardParams[0],
			name:rewardParams[1],
			count:parseInt(rewardParams[2])
		}
		rewards.push(reward);
	})
	return rewards;
};

/**
 * 获取活动排名奖励
 * @param type
 * @param rank
 * @returns {Array}
 */
Utils.getActivityRankRewards = function(type, rank){
	var config = null;
	for(var i = 1; i <= 8; i++){
		if(i === 8){
			config = ScheduleActivities.type[type]['rankRewards' + i];
			break;
		}else{
			var rankMax = ScheduleActivities.type[type]['rankPoint' + (i + 1)];
			if(rank < rankMax){
				config = ScheduleActivities.type[type]['rankRewards' + i];
				break;
			}
		}
	}
	var rewards = [];
	var rewardStrings = config.split(',');
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			type:rewardParams[0],
			name:rewardParams[1],
			count:parseInt(rewardParams[2])
		}
		rewards.push(reward);
	})
	return rewards;
};


/**
 * 获取联盟活动排名奖励
 * @param type
 * @param rank
 * @returns {Array}
 */
Utils.getAllianceActivityRankRewards = function(type, rank){
	var config = null;
	for(var i = 1; i <= 8; i++){
		if(i === 8){
			config = ScheduleActivities.allianceType[type]['rankRewards' + i];
			break;
		}else{
			var rankMax = ScheduleActivities.allianceType[type]['rankPoint' + (i + 1)];
			if(rank < rankMax){
				config = ScheduleActivities.allianceType[type]['rankRewards' + i];
				break;
			}
		}
	}
	var rewards = [];
	var rewardStrings = config.split(',');
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			type:rewardParams[0],
			name:rewardParams[1],
			count:parseInt(rewardParams[2])
		}
		rewards.push(reward);
	})
	return rewards;
};

/**
 * 获取pve活动的积分key
 * @param stage
 */
Utils.getPveScoreConditionKey = function(stage){
	var keys = _.filter(_.keys(ScheduleActivities.scoreCondition), function(key){
		return key.indexOf('attackPve_') === 0;
	})
	var key = _.find(keys, function(key){
		var stageParams = key.split('_');
		var from = parseInt(stageParams[1]);
		var to = parseInt(stageParams[2]);
		if(stage >= from && stage <= to){
			return true;
		}
	})
	return key;
}

/**
 * 获取野怪活动的积分key
 * @param monsterLevel
 */
Utils.getMonsterScoreConditionKey = function(monsterLevel){
	var keys = _.filter(_.keys(ScheduleActivities.scoreCondition), function(key){
		return key.indexOf('attackOneMonster_') === 0;
	})
	var key = _.find(keys, function(key){
		var monsterParams = key.split('_');
		var from = parseInt(monsterParams[1]);
		var to = parseInt(monsterParams[2]);
		if(monsterLevel >= from && monsterLevel <= to){
			return true;
		}
	})
	return key;
}

/**
 * 获取造兵活动的积分key
 * @param soldierName
 */
Utils.getRecruitScoreConditionKey = function(soldierName){
	var soldierType = null;
	var soldierLevel = null;
	if(this.isNormalSoldier(soldierName)){
		soldierType = Soldiers.normal[soldierName + '_1'].type;
		soldierLevel = parseInt(soldierName.split('_')[1]);
	}else{
		soldierType = Soldiers.special[soldierName].type;
		soldierLevel = Soldiers.special[soldierName].star;
	}
	var key = _.find(_.keys(ScheduleActivities.scoreCondition), function(key){
		return key.indexOf('recruitOneLevel' + soldierLevel + '_') === 0 && key.indexOf(soldierType) > 0;
	})
	return key;
}

/**
 * 玩家是否能退出联盟
 * @param memberObj
 * @returns {boolean}
 */
Utils.isMemberCanQuitAlliance = function(memberObj){
	var joinAllianceTime = memberObj.joinAllianceTime;
	if(!joinAllianceTime) joinAllianceTime = Date.now();
	var quitAvailableTime = joinAllianceTime + (this.getPlayerIntInit('quitAllianceCoolingMinutes') * 60 * 1000);
	return quitAvailableTime <= Date.now();
}

/**
 * 获取玩家资源可掠夺比例
 * @param attackPlayerDoc
 * @param defencePlayerDoc
 */
Utils.getPlayerGrabResourceFixedPercent = function(attackPlayerDoc, defencePlayerDoc){
	var attackPlayerPower = this.getPlayerBuildingAndTechPower(attackPlayerDoc);
	var defencePlayerPower = this.getPlayerBuildingAndTechPower(defencePlayerDoc);
	var powerCompare = attackPlayerPower / defencePlayerPower;
	var config = _.find(AllianceInitData.grabResourceFix, function(_config){
		return powerCompare <= _config.powerCompare || AllianceInitData.grabResourceFix[AllianceInitData.grabResourceFix.length - 1] === _config;
	})
	return config.grabPercentFix;
}

/**
 * 获取商店礼包配置信息
 * @param productId
 */
Utils.getStoreProudctConfig = function(productId){
	var itemConfig = _.find(StoreItems.items, function(item){
		if(!!item){
			return item.productId === productId;
		}
	})
	if(!itemConfig){
		itemConfig = _.find(StoreItems.promotionItems, function(item){
			if(!!item){
				return item.productId === productId;
			}
		})
	}
	return itemConfig;
}

/**
 * 获取月卡配置信息
 * @param productId
 */
Utils.getStoreMonthcardProductConfig = function(productId){
	return _.find(PlayerInitData.monthCard, function(item){
		return item.productId === productId;
	})
}

/**
 * 获取商品道具奖励
 * @param itemConfig
 * @returns {{rewardsToMe: Array, rewardToAllianceMember: *}}
 * @constructor
 */
Utils.getStoreProductRewardsFromConfig = function(itemConfig){
	var rewardsToMe = []
	var rewardToAllianceMember = null
	var configArray_1 = itemConfig.rewards.split(",")
	_.each(configArray_1, function(itemConfig){
		var rewardArray = itemConfig.split(":")
		var reward = {
			type:rewardArray[0],
			name:rewardArray[1],
			count:parseInt(rewardArray[2])
		}
		rewardsToMe.push(reward)
	})
	if(!_.isEmpty(itemConfig.allianceRewards)){
		var rewardArray = itemConfig.allianceRewards.split(":")
		rewardToAllianceMember = {
			type:rewardArray[0],
			name:rewardArray[1],
			count:parseInt(rewardArray[2])
		}
	}

	return {rewardsToMe:rewardsToMe, rewardToAllianceMember:rewardToAllianceMember}
}

/**
 * 获取玩家累计充值奖励
 * @param playerDoc
 * @param gameInfo
 * @returns {*}
 */
Utils.getPlayerTotalIAPRewardsConfig = function(playerDoc, gameInfo){
	if(gameInfo.iapGemEventFinishTime <= Date.now() || playerDoc.iapGemEvent.finishTime !== gameInfo.iapGemEventFinishTime){
		return null;
	}
	var config = _.find(PlayerInitData.iapRewards, function(config){
		return config.gemNeed <= playerDoc.iapGemEvent.iapGemCount
			&& playerDoc.iapGemEvent.iapRewardedIndex < config.index;
	});
	if(!config){
		return null;
	}

	var rewards = [];
	var rewardStrings = config.rewards.split(',');
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			type:rewardParams[0],
			name:rewardParams[1],
			count:parseInt(rewardParams[2])
		}
		rewards.push(reward);
	})
	return {index:config.index, rewards:rewards};
}

/**
 * 获取玩家月卡每日奖励
 * @param playerDoc
 * @returns {*}
 */
Utils.getPlayerMonthcardRewards = function(playerDoc){
	var config = PlayerInitData.monthCard[playerDoc.monthCard.index];
	if(!config || playerDoc.monthCard.finishTime < Date.now() || playerDoc.monthCard.todayRewardsGet){
		return null;
	}

	var rewards = [];
	var rewardStrings = config.dailyRewards.split(',');
	_.each(rewardStrings, function(rewardString){
		var rewardParams = rewardString.split(':');
		var reward = {
			type:rewardParams[0],
			name:rewardParams[1],
			count:parseInt(rewardParams[2])
		}
		rewards.push(reward);
	})
	return rewards;
};

/**
 * 是否能派出兵力出去打仗
 * @param memberObject
 * @returns {boolean}
 */
Utils.canSendTroopsOut = function(memberObject){
	return memberObject.protectStartTime <= 0 ||
		memberObject.protectStartTime + (this.getAllianceIntInit('protectMinutes') * 60 * 1000) < Date.now();
}

/**
 * 玩家是否能转入到新服务器去
 * @param playerDoc
 * @param serverDoc
 * @returns {{canSwitch: boolean, gem: *}}
 */
Utils.getSwitchServerCondition = function(playerDoc, serverDoc){
	var openAt = serverDoc.openAt;
	var keepLevel = playerDoc.buildings.location_1.level;
	var config = _.find(PlayerInitData.switchServerLimit, function(_config){
		return keepLevel <= _config.keepLevelMax;
	})
	var canSwitch = openAt + (config.limitDays * 24 * 60 * 60 * 1000) <= Date.now();
	return {canSwitch:canSwitch, gemUsed:config.needGem};
}