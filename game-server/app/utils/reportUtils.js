"use strict"

/**
 * Created by modun on 14-10-27.
 */

var _ = require("underscore")
var ShortId = require("shortid")
var Promise = require("bluebird")
var NodeUtils = require("util")

var DataUtils = require("./dataUtils")
var LogicUtils = require("./logicUtils")
var Consts = require("../consts/consts")
var Define = require("../consts/define")

var GameDatas = require("../datas/GameDatas")
var Soldiers = GameDatas.Soldiers
var AllianceInitData = GameDatas.AllianceInitData
var BuildingFunction = GameDatas.BuildingFunction
var Items = GameDatas.Items
var Vip = GameDatas.Vip
var AllianceMap = GameDatas.AllianceMap;

var Utils = module.exports

/**
 * 创建攻打玩家城市和协防玩家作战的战报
 * @param attackAllianceDoc
 * @param attackPlayerDoc
 * @param defenceAllianceDoc
 * @param defencePlayerDoc
 * @param helpDefencePlayerDoc
 * @param dragonFightData
 * @param soldierFightData
 * @returns {*}
 */
Utils.createAttackCityFightWithHelpDefencePlayerReport = function(attackAllianceDoc, attackPlayerDoc, defenceAllianceDoc, defencePlayerDoc, helpDefencePlayerDoc, dragonFightData, soldierFightData){
	var getKilledCitizen = function(soldiersForFight){
		var killed = 0
		var config = null
		_.each(soldiersForFight, function(soldierForFight){
			_.each(soldierForFight.killedSoldiers, function(soldier){
				if(DataUtils.isNormalSoldier(soldier.name)){
					var soldierFullKey = soldier.name + "_" + soldier.star
					config = Soldiers.normal[soldierFullKey]
					killed += soldier.count * config.killScore
				}else{
					config = Soldiers.special[soldier.name]
					killed += soldier.count * config.killScore
				}
			})
		})
		return killed
	}
	var createSoldiersDataAfterFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			var soldier = {
				name:soldierForFight.name,
				star:soldierForFight.star,
				count:soldierForFight.totalCount,
				countDecreased:soldierForFight.totalCount - soldierForFight.currentCount
			}
			soldiers.push(soldier)
		})
		return soldiers
	}
	var createDragonFightData = function(dragonForFight){
		var data = {
			type:dragonForFight.type,
			hpMax:dragonForFight.maxHp,
			hp:dragonForFight.totalHp,
			hpDecreased:dragonForFight.totalHp - dragonForFight.currentHp,
			isWin:dragonForFight.isWin
		}
		return data
	}

	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			mapIndex:allianceDoc.mapIndex
		}
		return data
	}
	var createDragonData = function(dragonAfterFight, expAdd){
		var dragonData = {
			type:dragonAfterFight.type,
			level:dragonAfterFight.level,
			expAdd:expAdd,
			hp:dragonAfterFight.totalHp,
			hpDecreased:dragonAfterFight.totalHp - dragonAfterFight.currentHp
		}
		return dragonData
	}
	var pushBloodToRewards = function(bloodCount, rewards){
		if(bloodCount > 0){
			var reward = {
				type:"resources",
				name:"blood",
				count:bloodCount
			}
			rewards.push(reward)
		}
	}

	var attackDragon = attackPlayerDoc.dragons[dragonFightData.attackDragonAfterFight.type]
	var attackPlayerKilledCitizen = getKilledCitizen(soldierFightData.attackSoldiersAfterFight)
	var helpDefenceDragon = helpDefencePlayerDoc.dragons[dragonFightData.defenceDragonAfterFight.type]
	var helpDefencePlayerKilledCitizen = getKilledCitizen(soldierFightData.defenceSoldiersAfterFight)
	var attackDragonExpAdd = DataUtils.getPlayerDragonExpAdd(attackAllianceDoc, attackPlayerDoc, attackPlayerKilledCitizen)
	var helpDefenceDragonExpAdd = DataUtils.getPlayerDragonExpAdd(defenceAllianceDoc, helpDefencePlayerDoc, helpDefencePlayerKilledCitizen)
	var attackPlayerGetBlood = DataUtils.getBloodAdd(attackAllianceDoc, attackDragon, attackPlayerKilledCitizen + helpDefencePlayerKilledCitizen, _.isEqual(Consts.FightResult.AttackWin, soldierFightData.fightResult))
	var helpDefencePlayerGetBlood = DataUtils.getBloodAdd(defenceAllianceDoc, helpDefenceDragon, attackPlayerKilledCitizen + helpDefencePlayerKilledCitizen, _.isEqual(Consts.FightResult.DefenceWin, soldierFightData.fightResult))

	var attackPlayerRewards = []
	var helpDefencePlayerRewards = []

	pushBloodToRewards(attackPlayerGetBlood, attackPlayerRewards)
	pushBloodToRewards(helpDefencePlayerGetBlood, helpDefencePlayerRewards)
	LogicUtils.mergeRewards(attackPlayerRewards, DataUtils.getRewardsByKillScoreAndTerrain(attackPlayerKilledCitizen, defenceAllianceDoc.basicInfo.terrain))
	LogicUtils.mergeRewards(helpDefencePlayerRewards, DataUtils.getRewardsByKillScoreAndTerrain(helpDefencePlayerKilledCitizen, defenceAllianceDoc.basicInfo.terrain))

	var attackCityReport = {
		attackTarget:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			location:LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id).location,
			alliance:createAllianceData(defenceAllianceDoc),
			terrain:defenceAllianceDoc.basicInfo.terrain
		},
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			fightWithHelpDefenceTroop:{
				dragon:createDragonData(dragonFightData.attackDragonAfterFight, attackDragonExpAdd),
				soldiers:createSoldiersDataAfterFight(soldierFightData.attackSoldiersAfterFight)
			},
			rewards:attackPlayerRewards
		},
		helpDefencePlayerData:{
			id:helpDefencePlayerDoc._id,
			name:helpDefencePlayerDoc.basicInfo.name,
			icon:helpDefencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:createDragonData(dragonFightData.defenceDragonAfterFight, helpDefenceDragonExpAdd),
			soldiers:createSoldiersDataAfterFight(soldierFightData.defenceSoldiersAfterFight),
			rewards:helpDefencePlayerRewards
		},
		fightWithHelpDefencePlayerReports:{
			attackPlayerDragonFightData:createDragonFightData(dragonFightData.attackDragonAfterFight),
			defencePlayerDragonFightData:createDragonFightData(dragonFightData.defenceDragonAfterFight),
			soldierRoundDatas:soldierFightData.roundDatas
		}
	}

	var reportForAttackPlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.AttackCity,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		attackCity:attackCityReport
	}
	var reportForDefencePlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.AttackCity,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		attackCity:attackCityReport
	}

	var countData = {
		attackPlayerKill:attackPlayerKilledCitizen,
		attackDragonExpAdd:attackDragonExpAdd,
		defencePlayerKill:helpDefencePlayerKilledCitizen,
		defenceDragonExpAdd:helpDefenceDragonExpAdd
	}

	return {
		reportForAttackPlayer:reportForAttackPlayer,
		reportForDefencePlayer:reportForDefencePlayer,
		countData:countData
	}
}

/**
 * 创建攻打玩家城市和防守玩家作战的战报
 * @param attackAllianceDoc
 * @param attackPlayerDoc
 * @param attackDragonForFight
 * @param attackSoldiersForFight
 * @param defenceAllianceDoc
 * @param defencePlayerDoc
 * @param dragonFightData
 * @param soldierFightData
 * @param wallFightData
 * @returns {*}
 */
Utils.createAttackCityFightWithDefencePlayerReport = function(attackAllianceDoc, attackPlayerDoc, attackDragonForFight, attackSoldiersForFight, defenceAllianceDoc, defencePlayerDoc, dragonFightData, soldierFightData, wallFightData){
	var getKilledCitizen = function(soldiersForFight){
		var killed = 0
		var config = null
		_.each(soldiersForFight, function(soldierForFight){
			_.each(soldierForFight.killedSoldiers, function(soldier){
				if(DataUtils.isNormalSoldier(soldier.name)){
					var soldierFullKey = soldier.name + "_" + soldier.star
					config = Soldiers.normal[soldierFullKey]
					killed += soldier.count * config.killScore
				}else{
					config = Soldiers.special[soldier.name]
					killed += soldier.count * config.killScore
				}
			})
		})
		return killed
	}
	var createSoldiersDataAfterFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			var soldier = {
				name:soldierForFight.name,
				star:soldierForFight.star,
				count:soldierForFight.totalCount,
				countDecreased:soldierForFight.totalCount - soldierForFight.currentCount
			}
			soldiers.push(soldier)
		})
		return soldiers
	}
	var createDragonFightData = function(dragonForFight){
		var data = {
			type:dragonForFight.type,
			hpMax:dragonForFight.maxHp,
			hp:dragonForFight.totalHp,
			hpDecreased:dragonForFight.totalHp - dragonForFight.currentHp,
			isWin:dragonForFight.isWin
		}
		return data
	}
	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			mapIndex:allianceDoc.mapIndex
		}
		return data
	}
	var createDragonData = function(dragonAfterFight, expAdd){
		var dragonData = {
			type:dragonAfterFight.type,
			level:dragonAfterFight.level,
			expAdd:expAdd,
			hp:dragonAfterFight.totalHp,
			hpDecreased:dragonAfterFight.totalHp - dragonAfterFight.currentHp
		}
		return dragonData
	}
	var pushBloodToRewards = function(bloodCount, rewards){
		if(bloodCount > 0){
			var reward = {
				type:"resources",
				name:"blood",
				count:bloodCount
			}
			rewards.push(reward)
		}
	}
	var getSoldiersLoadTotal = function(soldiersForFight){
		var loadTotal = 0
		_.each(soldiersForFight, function(soldierForFight){
			loadTotal += soldierForFight.currentCount * soldierForFight.load
		})
		return loadTotal
	}
	var getDragonSkillResourceLootPercentAdd = function(dragon){
		var skillBuff = DataUtils.getDragonSkillBuff(dragon, "greedy")
		return skillBuff
	}
	var getBuildingBuffForResourceProtectPercent = function(playerDoc, resourceName){
		var buildingName = Consts.ResourceBuildingMap[resourceName]
		var buildings = LogicUtils.getPlayerBuildingsByType(playerDoc, buildingName)
		var protectPercent = 0
		_.each(buildings, function(building){
			if(building.level >= 1){
				var config = BuildingFunction[buildingName][building.level]
				protectPercent += config.protection
			}
		})
		return protectPercent
	}
	var getDefencePlayerResourceProtectCount = function(defencePlayerDoc, resourceName, attackDragon){
		var basePercent = DataUtils.getPlayerIntInit("playerResourceProtectPercent") / 100
		var buildingBuffAddPercent = getBuildingBuffForResourceProtectPercent(defencePlayerDoc, resourceName)
		var vipBuffAddPercent = Vip.level[defencePlayerDoc.vipEvents.length > 0 ? DataUtils.getPlayerVipLevel(defencePlayerDoc) : 0].storageProtectAdd
		var attackDragonBuffSubtractPercent = getDragonSkillResourceLootPercentAdd(attackDragon)
		var productionTechAddPercent = DataUtils.getPlayerProductionTechBuff(defencePlayerDoc, 'hideout');
		var finalPercent = basePercent + buildingBuffAddPercent + vipBuffAddPercent + productionTechAddPercent - attackDragonBuffSubtractPercent
		finalPercent = finalPercent > 0.9 ? 0.9 : finalPercent < 0.1 ? 0.1 : finalPercent
		return Math.floor(DataUtils.getPlayerResourceUpLimit(defencePlayerDoc, resourceName) * finalPercent)
	}

	var attackPlayerKilledCitizenWithDefenceSoldiers = _.isObject(soldierFightData) ? getKilledCitizen(soldierFightData.attackSoldiersAfterFight) : 0
	var defenceWallHpDecreased = _.isObject(wallFightData) ? wallFightData.defenceWallAfterFight.totalHp - wallFightData.defenceWallAfterFight.currentHp : 0
	var attackPlayerKilledCitizenWithDefenceWall = Math.floor(defenceWallHpDecreased * AllianceInitData.intInit.KilledCitizenPerWallHp.value)
	var defencePlayerKilledCitizenBySoldiers = _.isObject(soldierFightData) ? getKilledCitizen(soldierFightData.defenceSoldiersAfterFight) : 0
	var defencePlayerKilledCitizenByWall = _.isObject(wallFightData) ? getKilledCitizen([wallFightData.defenceWallAfterFight]) : 0
	var attackDragon = attackPlayerDoc.dragons[attackDragonForFight.type]
	var attackDragonExpAdd = DataUtils.getPlayerDragonExpAdd(attackAllianceDoc, attackPlayerDoc, attackPlayerKilledCitizenWithDefenceSoldiers)
	var defenceDragon = _.isObject(dragonFightData) ? defencePlayerDoc.dragons[dragonFightData.defenceDragonAfterFight.type] : null
	var defenceDragonExpAdd = DataUtils.getPlayerDragonExpAdd(defenceAllianceDoc, defencePlayerDoc, defencePlayerKilledCitizenBySoldiers)
	var attackPlayerGetBloodWithDefenceSoldiers = _.isObject(soldierFightData) ? DataUtils.getBloodAdd(attackAllianceDoc, attackDragon, attackPlayerKilledCitizenWithDefenceSoldiers + defencePlayerKilledCitizenBySoldiers, _.isEqual(Consts.FightResult.AttackWin, soldierFightData.fightResult)) : 0
	var attackPlayerGetBloodWithDefenceWall = _.isObject(wallFightData) ? DataUtils.getBloodAdd(attackAllianceDoc, null, attackPlayerKilledCitizenWithDefenceWall + defencePlayerKilledCitizenByWall, _.isEqual(Consts.FightResult.AttackWin, wallFightData.fightResult)) : 0
	var defencePlayerGetBloodBySoldiers = _.isObject(soldierFightData) ? DataUtils.getBloodAdd(defenceAllianceDoc, defenceDragon, attackPlayerKilledCitizenWithDefenceSoldiers + defencePlayerKilledCitizenBySoldiers, _.isEqual(Consts.FightResult.DefenceWin, soldierFightData.fightResult)) : 0
	var defencePlayerGetBloodByWall = _.isObject(wallFightData) ? DataUtils.getBloodAdd(defenceAllianceDoc, null, attackPlayerKilledCitizenWithDefenceWall + defencePlayerKilledCitizenByWall, _.isEqual(Consts.FightResult.DefenceWin, wallFightData.fightResult)) : 0
	var fixedGrabResourcePercent = DataUtils.getPlayerGrabResourceFixedPercent(attackPlayerDoc, defencePlayerDoc);

	var attackPlayerRewards = []
	var defencePlayerRewards = []
	pushBloodToRewards(attackPlayerGetBloodWithDefenceSoldiers + attackPlayerGetBloodWithDefenceWall, attackPlayerRewards)
	pushBloodToRewards(defencePlayerGetBloodBySoldiers + defencePlayerGetBloodByWall, defencePlayerRewards)
	var isDefencePlayerHasMasterOfDefenderBuff = !!LogicUtils.getPlayerMasterOfDefenderItemEvent(defencePlayerDoc);

	if(!isDefencePlayerHasMasterOfDefenderBuff && (!_.isObject(soldierFightData) || _.isEqual(Consts.FightResult.AttackWin, soldierFightData.fightResult))){
		var attackDragonCurrentHp = attackDragonForFight.currentHp
		var coinCanGet = attackDragonCurrentHp * 100
		var coinGet = defencePlayerDoc.resources.coin >= coinCanGet ? coinCanGet : defencePlayerDoc.resources.coin
		var finalCoinGet = Math.floor(coinGet * fixedGrabResourcePercent);
		attackPlayerRewards.push({
			type:"resources",
			name:"coin",
			count:finalCoinGet
		})
		defencePlayerRewards.push({
			type:"resources",
			name:"coin",
			count:-finalCoinGet
		})

		var defencePlayerResources = defencePlayerDoc.resources
		var woodProtectCount = getDefencePlayerResourceProtectCount(defencePlayerDoc, "wood", attackDragon)
		var stoneProtectCount = getDefencePlayerResourceProtectCount(defencePlayerDoc, "stone", attackDragon)
		var ironProtectCount = getDefencePlayerResourceProtectCount(defencePlayerDoc, "iron", attackDragon)
		var foodProtectCount = getDefencePlayerResourceProtectCount(defencePlayerDoc, "food", attackDragon)
		var woodLootCount = defencePlayerResources.wood > woodProtectCount ? defencePlayerResources.wood - woodProtectCount : 0
		var stoneLootCount = defencePlayerResources.stone > stoneProtectCount ? defencePlayerResources.stone - stoneProtectCount : 0
		var ironLootCount = defencePlayerResources.iron > ironProtectCount ? defencePlayerResources.iron - ironProtectCount : 0
		var foodLootCount = defencePlayerResources.food > foodProtectCount ? defencePlayerResources.food - foodProtectCount : 0
		var resourceLootTotal = woodLootCount + stoneLootCount + ironLootCount + foodLootCount
		var attackPlayerLoadTotal = getSoldiersLoadTotal(attackSoldiersForFight)
		var canLootPercent = resourceLootTotal > 0 ? attackPlayerLoadTotal / resourceLootTotal : 0
		canLootPercent = canLootPercent > 1 ? 1 : canLootPercent < 0 ? 0 : canLootPercent;
		var finalWoodLootCount = Math.floor(woodLootCount * canLootPercent * fixedGrabResourcePercent)
		var finalStoneLootCount = Math.floor(stoneLootCount * canLootPercent * fixedGrabResourcePercent)
		var finalIronLootCount = Math.floor(ironLootCount * canLootPercent * fixedGrabResourcePercent)
		var finalFoodLootCount = Math.floor(foodLootCount * canLootPercent * fixedGrabResourcePercent)
		attackPlayerRewards.push({
			type:"resources",
			name:"wood",
			count:finalWoodLootCount
		})
		defencePlayerRewards.push({
			type:"resources",
			name:"wood",
			count:-finalWoodLootCount
		})
		attackPlayerRewards.push({
			type:"resources",
			name:"stone",
			count:finalStoneLootCount
		})
		defencePlayerRewards.push({
			type:"resources",
			name:"stone",
			count:-finalStoneLootCount
		})
		attackPlayerRewards.push({
			type:"resources",
			name:"iron",
			count:finalIronLootCount
		})
		defencePlayerRewards.push({
			type:"resources",
			name:"iron",
			count:-finalIronLootCount
		})
		attackPlayerRewards.push({
			type:"resources",
			name:"food",
			count:finalFoodLootCount
		})
		defencePlayerRewards.push({
			type:"resources",
			name:"food",
			count:-finalFoodLootCount
		})
	}
	LogicUtils.mergeRewards(attackPlayerRewards, DataUtils.getRewardsByKillScoreAndTerrain(attackPlayerKilledCitizenWithDefenceSoldiers + attackPlayerKilledCitizenWithDefenceWall, defenceAllianceDoc.basicInfo.terrain))
	LogicUtils.mergeRewards(defencePlayerRewards, DataUtils.getRewardsByKillScoreAndTerrain(defencePlayerKilledCitizenBySoldiers + defencePlayerKilledCitizenByWall, defenceAllianceDoc.basicInfo.terrain))

	var attackCityReport = {
		attackTarget:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			location:LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id).location,
			alliance:createAllianceData(defenceAllianceDoc),
			terrain:defenceAllianceDoc.basicInfo.terrain
		},
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			fightWithDefenceTroop:!_.isObject(soldierFightData) ? null : {
				dragon:createDragonData(dragonFightData.attackDragonAfterFight, attackDragonExpAdd),
				soldiers:createSoldiersDataAfterFight(soldierFightData.attackSoldiersAfterFight)
			},
			fightWithDefenceWall:!_.isObject(wallFightData) ? null : {
				soldiers:createSoldiersDataAfterFight(wallFightData.attackSoldiersAfterFight)
			},
			rewards:attackPlayerRewards
		},
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			icon:defencePlayerDoc.basicInfo.icon,
			masterOfDefender:isDefencePlayerHasMasterOfDefenderBuff,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:!_.isObject(dragonFightData) ? null : createDragonData(dragonFightData.defenceDragonAfterFight, defenceDragonExpAdd),
			soldiers:!_.isObject(soldierFightData) ? null : createSoldiersDataAfterFight(soldierFightData.defenceSoldiersAfterFight),
			wall:!_.isObject(wallFightData) ? null : {
				level:defencePlayerDoc.buildings.location_21.level,
				hp:wallFightData.defenceWallAfterFight.totalHp,
				hpDecreased:wallFightData.defenceWallAfterFight.totalHp - wallFightData.defenceWallAfterFight.currentHp
			},
			rewards:defencePlayerRewards
		},
		fightWithDefencePlayerReports:!_.isObject(soldierFightData) && !_.isObject(wallFightData) ? null : {
			attackPlayerDragonFightData:!_.isObject(dragonFightData) ? null : createDragonFightData(dragonFightData.attackDragonAfterFight),
			defencePlayerDragonFightData:!_.isObject(dragonFightData) ? null : createDragonFightData(dragonFightData.defenceDragonAfterFight),
			soldierRoundDatas:!!soldierFightData ? soldierFightData.roundDatas : null,
			attackPlayerWallRoundDatas:!_.isObject(wallFightData) ? null : wallFightData.attackRoundDatas,
			defencePlayerWallRoundDatas:!_.isObject(wallFightData) ? null : wallFightData.defenceRoundDatas
		}
	}

	var reportForAttackPlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.AttackCity,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		attackCity:attackCityReport
	}
	var reportForDefencePlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.AttackCity,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		attackCity:attackCityReport
	}

	var countData = {
		attackPlayerKill:attackPlayerKilledCitizenWithDefenceSoldiers + attackPlayerKilledCitizenWithDefenceWall,
		attackDragonExpAdd:attackDragonExpAdd,
		defencePlayerKill:defencePlayerKilledCitizenBySoldiers + defencePlayerKilledCitizenByWall,
		defenceDragonExpAdd:defenceDragonExpAdd
	}
	return {
		reportForAttackPlayer:reportForAttackPlayer,
		reportForDefencePlayer:reportForDefencePlayer,
		countData:countData
	}
}

/**
 * 创建突袭玩家城市和协防玩家的龙发生战斗的战报
 * @param attackAllianceDoc
 * @param attackPlayerDoc
 * @param attackDragon
 * @param defenceAllianceDoc
 * @param defencePlayerDoc
 * @param helpDefencePlayerDoc
 * @param helpDefenceDragon
 * @returns {*}
 */
Utils.createStrikeCityFightWithHelpDefenceDragonReport = function(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc, defencePlayerDoc, helpDefencePlayerDoc, helpDefenceDragon){
	var getReportLevel = function(powerCompare){
		var reportLevel = null
		if(powerCompare < 1) reportLevel = Consts.DragonStrikeReportLevel.D
		else if(powerCompare >= 1 && powerCompare < 1.5) reportLevel = Consts.DragonStrikeReportLevel.C
		else if(powerCompare >= 1.5 && powerCompare < 2) reportLevel = Consts.DragonStrikeReportLevel.B
		else if(powerCompare >= 2 && powerCompare < 3) reportLevel = Consts.DragonStrikeReportLevel.A
		else reportLevel = Consts.DragonStrikeReportLevel.S
		return reportLevel
	}
	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			mapIndex:allianceDoc.mapIndex
		}
		return data
	}
	var createDragonData = function(dragon, hpDecreased){
		var dragonData = {
			type:dragon.type,
			level:dragon.level,
			hp:dragon.hp,
			hpDecreased:hpDecreased
		}
		return dragonData
	}
	var getDragonSkills = function(dragon){
		var skills = []
		_.each(dragon.skills, function(skill){
			if(skill.level > 0){
				skills.push(skill)
			}
		})
		return skills
	}
	var getDragonEquipments = function(dragon){
		var equipments = []
		_.each(dragon.equipments, function(theEquipment, type){
			if(!_.isEmpty(theEquipment.name)){
				var equipment = {
					type:type,
					name:theEquipment.name,
					star:theEquipment.star
				}
				equipments.push(equipment)
			}
		})
		return equipments
	}
	var getSoldiersInTroop = function(playerDoc, soldiersInTroop){
		var soldiers = []
		_.each(soldiersInTroop, function(soldierInTroop){
			var soldier = {
				name:soldierInTroop.name,
				star:DataUtils.getPlayerSoldierStar(playerDoc, soldierInTroop.name),
				count:soldierInTroop.count
			}
			soldiers.push(soldier)
		})
		return soldiers
	}
	var getMilitaryTechs = function(playerDoc){
		var techs = []
		_.each(playerDoc.militaryTechs, function(tech, name){
			if(tech.level > 0)techs.push({name:name, level:tech.level})
		})
		return techs
	}

	var attackDragonPower = DataUtils.getDragonStrength(attackAllianceDoc, attackDragon, defenceAllianceDoc.basicInfo.terrain)
	var defenceDragonPower = DataUtils.getDragonStrength(defenceAllianceDoc, helpDefenceDragon, defenceAllianceDoc.basicInfo.terrain)
	var powerCompare = attackDragonPower / defenceDragonPower
	var attackDragonMaxHp = DataUtils.getDragonMaxHp(attackDragon)
	var attackDragonHpDecreasedPercent = AllianceInitData.intInit.dragonStrikeHpDecreasedPercent.value / 100
	var attackDragonHpDecreased = Math.ceil(attackDragonMaxHp * attackDragonHpDecreasedPercent)
	attackDragonHpDecreased = attackDragonHpDecreased > attackDragon.hp ? attackDragon.hp : attackDragonHpDecreased
	var attackDragonData = createDragonData(attackDragon, attackDragonHpDecreased)
	var defenceDragonData = createDragonData(helpDefenceDragon, 0)

	var strikeCityReport = {
		level:getReportLevel(powerCompare),
		strikeTarget:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			location:LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id).location,
			alliance:createAllianceData(defenceAllianceDoc),
			terrain:defenceAllianceDoc.basicInfo.terrain,
			fogOfTrick:DataUtils.isPlayerHasItemEvent(defencePlayerDoc, "fogOfTrick")
		},
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:attackDragonData
		},
		helpDefencePlayerData:{
			id:helpDefencePlayerDoc._id,
			name:helpDefencePlayerDoc.basicInfo.name,
			icon:helpDefencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:_.extend(
				{
					equipments:getDragonEquipments(helpDefenceDragon),
					skills:getDragonSkills(helpDefenceDragon)
				},
				defenceDragonData
			),
			soldiers:getSoldiersInTroop(helpDefencePlayerDoc, defencePlayerDoc.helpedByTroop.soldiers),
			militaryTechs:getMilitaryTechs(helpDefencePlayerDoc)
		}
	}

	var cityBeStrikedReport = {
		level:strikeCityReport.level,
		strikeTarget:strikeCityReport.strikeTarget,
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:_.extend(
				{
					equipments:getDragonEquipments(attackDragon)
				},
				attackDragonData
			)
		},
		helpDefencePlayerData:{
			id:helpDefencePlayerDoc._id,
			name:helpDefencePlayerDoc.basicInfo.name,
			icon:helpDefencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:defenceDragonData
		}
	}

	var reportForAttackPlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.StrikeCity,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		strikeCity:strikeCityReport
	}
	var reportForDefencePlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.CityBeStriked,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		cityBeStriked:cityBeStrikedReport
	}

	return {
		reportForAttackPlayer:reportForAttackPlayer,
		reportForDefencePlayer:reportForDefencePlayer,
		powerCompare:powerCompare
	}
}

/**
 * 创建突袭玩家城市和防守玩家的龙发生战斗的战报
 * @param attackAllianceDoc
 * @param attackPlayerDoc
 * @param attackDragon
 * @param defenceAllianceDoc
 * @param defencePlayerDoc
 * @param defenceDragon
 * @returns {*}
 */
Utils.createStrikeCityFightWithDefenceDragonReport = function(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc, defencePlayerDoc, defenceDragon){
	var getReportLevel = function(powerCompare){
		var reportLevel = null
		if(powerCompare < 1) reportLevel = Consts.DragonStrikeReportLevel.D
		else if(powerCompare >= 1 && powerCompare < 1.5) reportLevel = Consts.DragonStrikeReportLevel.C
		else if(powerCompare >= 1.5 && powerCompare < 2) reportLevel = Consts.DragonStrikeReportLevel.B
		else if(powerCompare >= 2 && powerCompare < 3) reportLevel = Consts.DragonStrikeReportLevel.A
		else reportLevel = Consts.DragonStrikeReportLevel.S
		return reportLevel
	}
	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			mapIndex:allianceDoc.mapIndex
		}
		return data
	}
	var createDragonData = function(dragon, hpDecreased){
		var dragonData = {
			type:dragon.type,
			level:dragon.level,
			hp:dragon.hp,
			hpDecreased:hpDecreased
		}
		return dragonData
	}
	var getDragonSkills = function(dragon){
		var skills = []
		_.each(dragon.skills, function(skill){
			if(skill.level > 0){
				skills.push(skill)
			}
		})
		return skills
	}
	var getDragonEquipments = function(dragon){
		var equipments = []
		_.each(dragon.equipments, function(theEquipment, type){
			if(!_.isEmpty(theEquipment.name)){
				var equipment = {
					type:type,
					name:theEquipment.name,
					star:theEquipment.star
				}
				equipments.push(equipment)
			}
		})
		return equipments
	}
	var getDefenceSoldiers = function(playerDoc){
		var soldiers = !!playerDoc.defenceTroop ? playerDoc.defenceTroop.soldiers : [];
		_.each(soldiers, function(soldier){
			soldier.star = DataUtils.getPlayerSoldierStar(playerDoc, soldier.name)
		})
		return soldiers
	}
	var getMilitaryTechs = function(playerDoc){
		var techs = []
		_.each(playerDoc.militaryTechs, function(tech, name){
			if(tech.level > 0)techs.push({name:name, level:tech.level})
		})
		return techs
	}
	var getBuildingBuffForResourceProtectPercent = function(playerDoc, resourceName){
		var buildingName = Consts.ResourceBuildingMap[resourceName]
		var buildings = LogicUtils.getPlayerBuildingsByType(playerDoc, buildingName)
		var protectPercent = 0
		_.each(buildings, function(building){
			if(building.level >= 1){
				var config = BuildingFunction[buildingName][building.level]
				protectPercent += config.protection
			}
		})
		return protectPercent
	}
	var getPlayerResourceProtectCount = function(defencePlayerDoc, resourceName){
		var basePercent = DataUtils.getPlayerIntInit("playerResourceProtectPercent") / 100
		var buildingBuffAddPercent = getBuildingBuffForResourceProtectPercent(defencePlayerDoc, resourceName)
		var vipBuffAddPercent = Vip.level[defencePlayerDoc.vipEvents.length > 0 ? DataUtils.getPlayerVipLevel(defencePlayerDoc) : 0].storageProtectAdd
		var productionTechAddPercent = DataUtils.getPlayerProductionTechBuff(defencePlayerDoc, 'hideout');
		var finalPercent = basePercent + buildingBuffAddPercent + vipBuffAddPercent + productionTechAddPercent;
		finalPercent = finalPercent > 0.9 ? 0.9 : finalPercent < 0.1 ? 0.1 : finalPercent
		return Math.floor(DataUtils.getPlayerResourceUpLimit(defencePlayerDoc, resourceName) * finalPercent)
	}

	var attackDragonPower = DataUtils.getDragonStrength(attackAllianceDoc, attackDragon, defenceAllianceDoc.basicInfo.terrain)
	var defenceDragonPower = DataUtils.getDragonStrength(defenceAllianceDoc, defenceDragon, defenceAllianceDoc.basicInfo.terrain)
	var powerCompare = attackDragonPower / defenceDragonPower
	var attackDragonMaxHp = DataUtils.getDragonMaxHp(attackDragon)
	var attackDragonHpDecreasedPercent = AllianceInitData.intInit.dragonStrikeHpDecreasedPercent.value / 100
	var attackDragonHpDecreased = Math.ceil(attackDragonMaxHp * attackDragonHpDecreasedPercent)
	attackDragonHpDecreased = attackDragonHpDecreased > attackDragon.hp ? attackDragon.hp : attackDragonHpDecreased
	var attackDragonData = createDragonData(attackDragon, attackDragonHpDecreased)
	var defenceDragonData = createDragonData(defenceDragon, 0)
	var fixedGrabResourcePercent = DataUtils.getPlayerGrabResourceFixedPercent(attackPlayerDoc, defencePlayerDoc);

	var woodCanbeLooted = defencePlayerDoc.resources.wood - getPlayerResourceProtectCount(defencePlayerDoc, "wood")
	if(woodCanbeLooted < 0)
		woodCanbeLooted = 0;
	var stoneCanbeLooted = defencePlayerDoc.resources.stone - getPlayerResourceProtectCount(defencePlayerDoc, "stone")
	if(stoneCanbeLooted < 0)
		stoneCanbeLooted = 0;
	var ironCanbeLooted = defencePlayerDoc.resources.iron - getPlayerResourceProtectCount(defencePlayerDoc, "iron")
	if(ironCanbeLooted < 0)
		ironCanbeLooted = 0;
	var foodCanbeLooted = defencePlayerDoc.resources.food - getPlayerResourceProtectCount(defencePlayerDoc, "food")
	if(foodCanbeLooted < 0)
		foodCanbeLooted = 0;
	var coinCanbeLooted = defencePlayerDoc.resources.coin

	var strikeCityReport = {
		level:(function(){
			var itemEvent = _.find(defencePlayerDoc.itemEvents, function(event){
				return _.isEqual(event.type, 'fogOfTrick')
			})
			return _.isObject(itemEvent) ? Consts.DragonStrikeReportLevel.E : getReportLevel(powerCompare)
		})(),
		strikeTarget:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			location:LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id).location,
			alliance:createAllianceData(defenceAllianceDoc),
			terrain:defenceAllianceDoc.basicInfo.terrain,
			fogOfTrick:DataUtils.isPlayerHasItemEvent(defencePlayerDoc, "fogOfTrick")
		},
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:attackDragonData
		},
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			icon:defencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:_.extend(
				{
					equipments:getDragonEquipments(defenceDragon),
					skills:getDragonSkills(defenceDragon)
				},
				defenceDragonData
			),
			soldiers:getDefenceSoldiers(defencePlayerDoc),
			militaryTechs:getMilitaryTechs(defencePlayerDoc),
			resources:{
				wood:Math.floor(woodCanbeLooted * fixedGrabResourcePercent),
				stone:Math.floor(stoneCanbeLooted * fixedGrabResourcePercent),
				iron:Math.floor(ironCanbeLooted * fixedGrabResourcePercent),
				food:Math.floor(foodCanbeLooted * fixedGrabResourcePercent),
				coin:Math.floor(coinCanbeLooted * fixedGrabResourcePercent)
			}
		}
	}

	var cityBeStrikedReport = {
		level:strikeCityReport.level,
		strikeTarget:strikeCityReport.strikeTarget,
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:_.extend(
				{
					equipments:getDragonEquipments(attackDragon)
				},
				attackDragonData
			)
		},
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			icon:defencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:defenceDragonData
		}
	}

	var reportForAttackPlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.StrikeCity,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		strikeCity:strikeCityReport
	}
	var reportForDefencePlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.CityBeStriked,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		cityBeStriked:cityBeStrikedReport
	}
	return {
		reportForAttackPlayer:reportForAttackPlayer,
		reportForDefencePlayer:reportForDefencePlayer,
		powerCompare:powerCompare
	}
}

/**
 * 创建突袭玩家城市无协防无防守龙的战报
 * @param attackAllianceDoc
 * @param attackPlayerDoc
 * @param attackDragon
 * @param defenceAllianceDoc
 * @param defencePlayerDoc
 * @returns {*}
 */
Utils.createStrikeCityNoDefenceDragonReport = function(attackAllianceDoc, attackPlayerDoc, attackDragon, defenceAllianceDoc, defencePlayerDoc){
	var reportLevel = Consts.DragonStrikeReportLevel.S
	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			mapIndex:allianceDoc.mapIndex
		}
		return data
	}
	var createDragonData = function(dragon, hpDecreased){
		var dragonData = {
			type:dragon.type,
			level:dragon.level,
			hp:dragon.hp,
			hpDecreased:hpDecreased
		}
		return dragonData
	}
	var getDragonEquipments = function(dragon){
		var equipments = []
		_.each(dragon.equipments, function(theEquipment, type){
			if(!_.isEmpty(theEquipment.name)){
				var equipment = {
					type:type,
					name:theEquipment.name,
					star:theEquipment.star
				}
				equipments.push(equipment)
			}
		})
		return equipments
	}
	var getBuildingBuffForResourceProtectPercent = function(playerDoc, resourceName){
		var buildingName = Consts.ResourceBuildingMap[resourceName]
		var buildings = LogicUtils.getPlayerBuildingsByType(playerDoc, buildingName)
		var protectPercent = 0
		_.each(buildings, function(building){
			if(building.level >= 1){
				var config = BuildingFunction[buildingName][building.level]
				protectPercent += config.protection
			}
		})
		return protectPercent
	}
	var getPlayerResourceProtectCount = function(defencePlayerDoc, resourceName){
		var basePercent = DataUtils.getPlayerIntInit("playerResourceProtectPercent") / 100
		var buildingBuffAddPercent = getBuildingBuffForResourceProtectPercent(defencePlayerDoc, resourceName)
		var vipBuffAddPercent = Vip.level[defencePlayerDoc.vipEvents.length > 0 ? DataUtils.getPlayerVipLevel(defencePlayerDoc) : 0].storageProtectAdd
		var productionTechAddPercent = DataUtils.getPlayerProductionTechBuff(defencePlayerDoc, 'hideout');
		var finalPercent = basePercent + buildingBuffAddPercent + vipBuffAddPercent + productionTechAddPercent;
		finalPercent = finalPercent > 0.9 ? 0.9 : finalPercent < 0.1 ? 0.1 : finalPercent
		return Math.floor(DataUtils.getPlayerResourceUpLimit(defencePlayerDoc, resourceName) * finalPercent)
	}
	var fixedGrabResourcePercent = DataUtils.getPlayerGrabResourceFixedPercent(attackPlayerDoc, defencePlayerDoc);

	var woodCanbeLooted = defencePlayerDoc.resources.wood - getPlayerResourceProtectCount(defencePlayerDoc, "wood")
	if(woodCanbeLooted < 0)
		woodCanbeLooted = 0;
	var stoneCanbeLooted = defencePlayerDoc.resources.stone - getPlayerResourceProtectCount(defencePlayerDoc, "stone")
	if(stoneCanbeLooted < 0)
		stoneCanbeLooted = 0;
	var ironCanbeLooted = defencePlayerDoc.resources.iron - getPlayerResourceProtectCount(defencePlayerDoc, "iron")
	if(ironCanbeLooted < 0)
		ironCanbeLooted = 0;
	var foodCanbeLooted = defencePlayerDoc.resources.food - getPlayerResourceProtectCount(defencePlayerDoc, "food")
	if(foodCanbeLooted < 0)
		foodCanbeLooted = 0;
	var coinCanbeLooted = defencePlayerDoc.resources.coin

	var attackDragonData = createDragonData(attackDragon, 0)
	var strikeCityReport = {
		level:reportLevel,
		strikeTarget:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			location:LogicUtils.getAllianceMemberMapObjectById(defenceAllianceDoc, defencePlayerDoc._id).location,
			alliance:createAllianceData(defenceAllianceDoc),
			terrain:defenceAllianceDoc.basicInfo.terrain,
			fogOfTrick:DataUtils.isPlayerHasItemEvent(defencePlayerDoc, "fogOfTrick")
		},
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:createDragonData(attackDragon, 0)
		},
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			icon:defencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			resources:{
				wood:Math.floor(woodCanbeLooted * fixedGrabResourcePercent),
				stone:Math.floor(stoneCanbeLooted * fixedGrabResourcePercent),
				iron:Math.floor(ironCanbeLooted * fixedGrabResourcePercent),
				food:Math.floor(foodCanbeLooted * fixedGrabResourcePercent),
				coin:Math.floor(coinCanbeLooted * fixedGrabResourcePercent)
			}
		}
	}

	var cityBeStrikedReport = {
		level:strikeCityReport.level,
		strikeTarget:strikeCityReport.strikeTarget,
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:_.extend(
				{
					equipments:getDragonEquipments(attackDragon)
				},
				attackDragonData
			)
		},
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			icon:defencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc)
		}
	}

	var reportForAttackPlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.StrikeCity,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		strikeCity:strikeCityReport
	}
	var reportForDefencePlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.CityBeStriked,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		cityBeStriked:cityBeStrikedReport
	}

	return {reportForAttackPlayer:reportForAttackPlayer, reportForDefencePlayer:reportForDefencePlayer}
}

/**
 * 创建进攻联盟村落并和正在采集村落的部队战斗的战报
 * @param attackAllianceDoc
 * @param attackPlayerDoc
 * @param defenceAllianceDoc
 * @param targetAllianceDoc
 * @param defenceVillage
 * @param defencePlayerDoc
 * @param dragonFightData
 * @param soldierFightData
 * @returns {*}
 */
Utils.createAttackVillageFightWithDefenceTroopReport = function(attackAllianceDoc, attackPlayerDoc, targetAllianceDoc, defenceVillage, defenceAllianceDoc, defencePlayerDoc, dragonFightData, soldierFightData){
	var getKilledCitizen = function(soldiersForFight){
		var killed = 0
		var config = null
		_.each(soldiersForFight, function(soldierForFight){
			_.each(soldierForFight.killedSoldiers, function(soldier){
				if(DataUtils.isNormalSoldier(soldier.name)){
					var soldierFullKey = soldier.name + "_" + soldier.star
					config = Soldiers.normal[soldierFullKey]
					killed += soldier.count * config.killScore
				}else{
					config = Soldiers.special[soldier.name]
					killed += soldier.count * config.killScore
				}
			})
		})
		return killed
	}
	var createSoldiersDataAfterFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			var soldier = {
				name:soldierForFight.name,
				star:soldierForFight.star,
				count:soldierForFight.totalCount,
				countDecreased:soldierForFight.totalCount - soldierForFight.currentCount
			}
			soldiers.push(soldier)
		})
		return soldiers
	}
	var createDragonFightData = function(dragonForFight){
		var data = {
			type:dragonForFight.type,
			hpMax:dragonForFight.maxHp,
			hp:dragonForFight.totalHp,
			hpDecreased:dragonForFight.totalHp - dragonForFight.currentHp,
			isWin:dragonForFight.isWin
		}
		return data
	}

	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			mapIndex:allianceDoc.mapIndex
		}
		return data
	}
	var createDragonData = function(dragonAfterFight, expAdd){
		var dragonData = {
			type:dragonAfterFight.type,
			level:dragonAfterFight.level,
			expAdd:expAdd,
			hp:dragonAfterFight.totalHp,
			hpDecreased:dragonAfterFight.totalHp - dragonAfterFight.currentHp
		}
		return dragonData
	}
	var pushBloodToRewards = function(bloodCount, rewards){
		if(bloodCount > 0){
			var reward = {
				type:"resources",
				name:"blood",
				count:bloodCount
			}
			rewards.push(reward)
		}
	}

	var attackPlayerKilledCitizen = getKilledCitizen(soldierFightData.attackSoldiersAfterFight)
	var defencePlayerKilledCitizen = getKilledCitizen(soldierFightData.defenceSoldiersAfterFight)
	var totalKilledCitizen = attackPlayerKilledCitizen + defencePlayerKilledCitizen
	var attackDragon = attackPlayerDoc.dragons[dragonFightData.attackDragonAfterFight.type]
	var attackDragonExpAdd = DataUtils.getPlayerDragonExpAdd(attackAllianceDoc, attackPlayerDoc, attackPlayerKilledCitizen)
	var attackPlayerGetBlood = DataUtils.getBloodAdd(attackAllianceDoc, attackDragon, totalKilledCitizen, _.isEqual(Consts.FightResult.AttackWin, soldierFightData.fightResult))
	var defenceDragon = defencePlayerDoc.dragons[dragonFightData.defenceDragonAfterFight.type]
	var defenceDragonExpAdd = DataUtils.getPlayerDragonExpAdd(defenceAllianceDoc, defencePlayerDoc, defencePlayerKilledCitizen)
	var defencePlayerGetBlood = DataUtils.getBloodAdd(defenceAllianceDoc, defenceDragon, totalKilledCitizen, _.isEqual(Consts.FightResult.DefenceWin, soldierFightData.fightResult))

	var attackPlayerRewards = []
	var defencePlayerRewards = []
	pushBloodToRewards(attackPlayerGetBlood, attackPlayerRewards)
	pushBloodToRewards(defencePlayerGetBlood, defencePlayerRewards)
	LogicUtils.mergeRewards(attackPlayerRewards, DataUtils.getRewardsByKillScoreAndTerrain(attackPlayerKilledCitizen, targetAllianceDoc.basicInfo.terrain))
	LogicUtils.mergeRewards(defencePlayerRewards, DataUtils.getRewardsByKillScoreAndTerrain(defencePlayerKilledCitizen, targetAllianceDoc.basicInfo.terrain))

	var attackVillageReport = {
		attackTarget:{
			name:defenceVillage.name,
			level:defenceVillage.level,
			location:LogicUtils.getAllianceMapObjectById(targetAllianceDoc, defenceVillage.id).location,
			alliance:createAllianceData(targetAllianceDoc),
			terrain:targetAllianceDoc.basicInfo.terrain
		},
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:createDragonData(dragonFightData.attackDragonAfterFight, attackDragonExpAdd),
			soldiers:createSoldiersDataAfterFight(soldierFightData.attackSoldiersAfterFight),
			rewards:attackPlayerRewards
		},
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			icon:defencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:createDragonData(dragonFightData.defenceDragonAfterFight, defenceDragonExpAdd),
			soldiers:createSoldiersDataAfterFight(soldierFightData.defenceSoldiersAfterFight),
			rewards:defencePlayerRewards
		},
		fightWithDefencePlayerReports:{
			attackPlayerDragonFightData:createDragonFightData(dragonFightData.attackDragonAfterFight),
			defencePlayerDragonFightData:createDragonFightData(dragonFightData.defenceDragonAfterFight),
			soldierRoundDatas:soldierFightData.roundDatas
		}
	}

	var reportForAttackPlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.AttackVillage,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		attackVillage:attackVillageReport
	}
	var reportForDefencePlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.AttackVillage,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		attackVillage:attackVillageReport
	}

	var countData = {
		attackPlayerKill:attackPlayerKilledCitizen,
		attackDragonExpAdd:attackDragonExpAdd,
		defencePlayerKill:defencePlayerKilledCitizen,
		defenceDragonExpAdd:defenceDragonExpAdd
	}

	return {
		reportForAttackPlayer:reportForAttackPlayer,
		reportForDefencePlayer:reportForDefencePlayer,
		countData:countData
	}
}

/**
 * 创建突袭村落和村落的采集者的龙发生战斗
 * @param attackAllianceDoc
 * @param attackPlayerDoc
 * @param attackDragon
 * @param targetAllianceDoc
 * @param defenceAllianceDoc
 * @param targetVillage
 * @param defenceVillageEvent
 * @param defencePlayerDoc
 * @param defenceDragon
 * @returns {*}
 */
Utils.createStrikeVillageFightWithDefencePlayerDragonReport = function(attackAllianceDoc, attackPlayerDoc, attackDragon, targetAllianceDoc, targetVillage, defenceAllianceDoc, defenceVillageEvent, defencePlayerDoc, defenceDragon){
	var getReportLevel = function(powerCompare){
		var reportLevel = null
		if(powerCompare < 1) reportLevel = Consts.DragonStrikeReportLevel.D
		else if(powerCompare >= 1 && powerCompare < 1.5) reportLevel = Consts.DragonStrikeReportLevel.C
		else if(powerCompare >= 1.5 && powerCompare < 2) reportLevel = Consts.DragonStrikeReportLevel.B
		else if(powerCompare >= 2 && powerCompare < 3) reportLevel = Consts.DragonStrikeReportLevel.A
		else reportLevel = Consts.DragonStrikeReportLevel.S
		return reportLevel
	}
	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			mapIndex:allianceDoc.mapIndex
		}
		return data
	}
	var createDragonData = function(dragon, hpDecreased){
		var dragonData = {
			type:dragon.type,
			level:dragon.level,
			hp:dragon.hp,
			hpDecreased:hpDecreased
		}
		return dragonData
	}
	var getDragonSkills = function(dragon){
		var skills = []
		_.each(dragon.skills, function(skill){
			if(skill.level > 0){
				skills.push(skill)
			}
		})
		return skills
	}
	var getDragonEquipments = function(dragon){
		var equipments = []
		_.each(dragon.equipments, function(theEquipment, type){
			if(!_.isEmpty(theEquipment.name)){
				var equipment = {
					type:type,
					name:theEquipment.name,
					star:theEquipment.star
				}
				equipments.push(equipment)
			}
		})
		return equipments
	}
	var getSoldiersInTroop = function(playerDoc, soldiersInTroop){
		var soldiers = []
		_.each(soldiersInTroop, function(soldierInTroop){
			var soldier = {
				name:soldierInTroop.name,
				star:1,
				count:soldierInTroop.count
			}
			soldiers.push(soldier)
		})
		return soldiers
	}
	var getMilitaryTechs = function(playerDoc){
		var techs = []
		_.each(playerDoc.militaryTechs, function(tech, name){
			if(tech.level > 0)techs.push({name:name, level:tech.level})
		})
		return techs
	}

	var attackDragonPower = DataUtils.getDragonStrength(attackAllianceDoc, attackDragon, targetAllianceDoc.basicInfo.terrain)
	var defenceDragonPower = DataUtils.getDragonStrength(defenceAllianceDoc, defenceDragon, targetAllianceDoc.basicInfo.terrain)
	var powerCompare = attackDragonPower / defenceDragonPower
	var attackDragonMaxHp = DataUtils.getDragonMaxHp(attackDragon)
	var attackDragonHpDecreasedPercent = AllianceInitData.intInit.dragonStrikeHpDecreasedPercent.value / 100
	var attackDragonHpDecreased = Math.ceil(attackDragonMaxHp * attackDragonHpDecreasedPercent)
	attackDragonHpDecreased = attackDragonHpDecreased > attackDragon.hp ? attackDragon.hp : attackDragonHpDecreased
	var attackDragonData = createDragonData(attackDragon, attackDragonHpDecreased)
	var defenceDragonData = createDragonData(defenceDragon, 0)

	var strikeVillageReport = {
		level:getReportLevel(powerCompare),
		strikeTarget:{
			name:targetVillage.name,
			level:targetVillage.level,
			location:LogicUtils.getAllianceMapObjectById(targetAllianceDoc, targetVillage.id).location,
			alliance:createAllianceData(targetAllianceDoc),
			terrain:targetAllianceDoc.basicInfo.terrain
		},
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:attackDragonData
		},
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			icon:defencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:_.extend(
				{
					equipments:getDragonEquipments(defenceDragon),
					skills:getDragonSkills(defenceDragon)
				},
				defenceDragonData
			),
			soldiers:getSoldiersInTroop(defencePlayerDoc, defenceVillageEvent.playerData.soldiers),
			militaryTechs:getMilitaryTechs(defencePlayerDoc)
		}
	}

	var villageBeStrikedReport = {
		level:strikeVillageReport.level,
		strikeTarget:strikeVillageReport.strikeTarget,
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:_.extend(
				{
					equipments:getDragonEquipments(attackDragon)
				},
				attackDragonData
			)
		},
		defencePlayerData:{
			id:defencePlayerDoc._id,
			name:defencePlayerDoc.basicInfo.name,
			icon:defencePlayerDoc.basicInfo.icon,
			alliance:createAllianceData(defenceAllianceDoc),
			dragon:defenceDragonData
		}
	}

	var reportForAttackPlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.StrikeVillage,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		strikeVillage:strikeVillageReport
	}
	var reportForDefencePlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.VillageBeStriked,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		villageBeStriked:villageBeStrikedReport
	}

	return {
		reportForAttackPlayer:reportForAttackPlayer,
		reportForDefencePlayer:reportForDefencePlayer,
		powerCompare:powerCompare
	}
}

/**
 * 创建采集村落回城战报
 * @param defenceAllianceDoc
 * @param defenceVillage
 * @param rewards
 * @returns {*}
 */
Utils.createCollectVillageReport = function(defenceAllianceDoc, defenceVillage, rewards){
	var collectResource = {
		collectTarget:{
			name:defenceVillage.name,
			level:defenceVillage.level,
			location:LogicUtils.getAllianceMapObjectById(defenceAllianceDoc, defenceVillage.id).location,
			alliance:{
				id:defenceAllianceDoc._id,
				name:defenceAllianceDoc.basicInfo.name,
				tag:defenceAllianceDoc.basicInfo.tag,
				flag:defenceAllianceDoc.basicInfo.flag
			}
		},
		rewards:rewards
	}

	var report = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.CollectResource,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		collectResource:collectResource
	}
	return report
}

/**
 * 创建进攻联盟圣地战报
 * @param allianceDoc
 * @param stageName
 * @param playerTroops
 * @param fightDatas
 * @returns {*}
 */
Utils.createAttackShrineReport = function(allianceDoc, stageName, playerTroops, fightDatas){
	var getKilledCitizen = function(soldiersForFight){
		var killed = 0;
		var config = null;
		_.each(soldiersForFight, function(soldierForFight){
			_.each(soldierForFight.killedSoldiers, function(soldier){
				if(DataUtils.isNormalSoldier(soldier.name)){
					var soldierFullKey = soldier.name + "_" + soldier.star
					config = Soldiers.normal[soldierFullKey]
					killed += soldier.count * config.killScore
				}else{
					config = Soldiers.special[soldier.name]
					killed += soldier.count * config.killScore
				}
			})
		});
		return killed
	}
	var createSoldiersDataAfterFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			var soldier = {
				name:soldierForFight.name,
				star:soldierForFight.star,
				count:soldierForFight.totalCount,
				countDecreased:soldierForFight.totalCount - soldierForFight.currentCount
			}
			soldiers.push(soldier)
		})
		return soldiers;
	}
	var createDragonFightData = function(dragonForFight){
		var data = {
			type:dragonForFight.type,
			hpMax:dragonForFight.maxHp,
			hp:dragonForFight.totalHp,
			hpDecreased:dragonForFight.totalHp - dragonForFight.currentHp,
			isWin:dragonForFight.isWin
		}
		return data
	}
	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag
		}
		return data
	}
	var createDragonData = function(dragonAfterFight, expAdd){
		var dragonData = {
			type:dragonAfterFight.type,
			level:dragonAfterFight.level,
			expAdd:expAdd,
			hp:dragonAfterFight.totalHp,
			hpDecreased:dragonAfterFight.totalHp - dragonAfterFight.currentHp
		}
		return dragonData
	}
	var getSoldiersFromSoldiersForFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			if(soldierForFight.currentCount > 0){
				var soldier = {
					name:soldierForFight.name,
					count:soldierForFight.currentCount
				}
				soldiers.push(soldier)
			}
		})
		return soldiers
	}
	var getWoundedSoldiersFromSoldiersForFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			if(soldierForFight.woundedCount > 0){
				var soldier = {
					name:soldierForFight.name,
					count:soldierForFight.woundedCount
				}
				soldiers.push(soldier)
			}
		})
		return soldiers
	}
	var getPlayerRewards = function(terrain, stageConfig, playerKill, mapRoundBuff){
		var rewards = []
		for(var i = 3; i >= 1; i--){
			var killNeed = stageConfig["playerKill_" + i]
			if(playerKill < killNeed) continue
			var rewardsString = stageConfig["playerRewards_" + i + "_" + terrain]
			var rewardStrings = rewardsString.split(",")
			_.each(rewardStrings, function(rewardString){
				var param = rewardString.split(":")
				var type = param[0]
				var name = param[1]
				var count = parseInt(param[2])
				if(name === 'loyalty'){
					count = Math.floor(count * (1 + mapRoundBuff));
				}
				rewards.push({
					type:type,
					name:name,
					count:count
				})
			})
			break
		}
		return rewards;
	}

	var mapRound = LogicUtils.getAllianceMapRound(allianceDoc);
	var mapRoundBuff = AllianceMap.buff[mapRound].loyaltyAddPercent / 100;
	var winCount = 0;
	var playerReports = {};
	var playerKills = {};
	var playerRewards = {};
	var playerSoldiers = {};
	var playerDragons = {};
	var shrineLocation = DataUtils.getAllianceBuildingLocation(allianceDoc, Consts.AllianceBuildingNames.Shrine);
	var stageConfig = AllianceInitData.shrineStage[stageName];
	var shrineReportPlayerDatas = [];
	_.each(fightDatas, function(fightData){
		var playerDoc = fightData.playerDoc;
		var dragonFightData = fightData.dragonFightData;
		var soldierFightData = fightData.soldierFightData;
		if(soldierFightData.fightResult === Consts.FightResult.AttackWin){
			winCount += 1;
		}
		playerSoldiers[playerDoc._id] = {
			soldiers:getSoldiersFromSoldiersForFight(soldierFightData.attackSoldiersAfterFight),
			woundedSoldiers:getWoundedSoldiersFromSoldiersForFight(soldierFightData.attackSoldiersAfterFight)
		};
		playerKills[playerDoc._id] = getKilledCitizen(soldierFightData.attackSoldiersAfterFight);
		playerRewards[playerDoc._id] = getPlayerRewards(allianceDoc.basicInfo.terrain, stageConfig, playerKills[playerDoc._id], mapRoundBuff);
		playerDragons[playerDoc._id] = {
			type:dragonFightData.attackDragonAfterFight.type,
			hpDecreased:dragonFightData.attackDragonAfterFight.totalHp - dragonFightData.attackDragonAfterFight.currentHp,
			expAdd:DataUtils.getPlayerDragonExpAdd(allianceDoc, playerDoc, playerKills[playerDoc._id])
		};
		playerReports[playerDoc._id] = {
			id:ShortId.generate(),
			type:Consts.PlayerReportType.AttackShrine,
			createTime:Date.now(),
			isRead:false,
			isSaved:false,
			attackShrine:{
				attackTarget:{
					stageName:stageName,
					location:shrineLocation,
					alliance:createAllianceData(allianceDoc),
					terrain:allianceDoc.basicInfo.terrain
				},
				attackPlayerData:{
					id:playerDoc._id,
					name:playerDoc.basicInfo.name,
					icon:playerDoc.basicInfo.icon,
					alliance:createAllianceData(allianceDoc),
					dragon:createDragonData(dragonFightData.attackDragonAfterFight, playerDragons[playerDoc._id].expAdd),
					soldiers:createSoldiersDataAfterFight(soldierFightData.attackSoldiersAfterFight),
					rewards:playerRewards[playerDoc._id]
				},
				defenceTroopData:{
					dragon:createDragonData(dragonFightData.defenceDragonAfterFight, 0),
					soldiers:createSoldiersDataAfterFight(soldierFightData.defenceSoldiersAfterFight)
				},
				fightWithDefenceTroopReports:{
					attackPlayerDragonFightData:createDragonFightData(dragonFightData.attackDragonAfterFight),
					defenceTroopDragonFightData:createDragonFightData(dragonFightData.defenceDragonAfterFight),
					soldierRoundDatas:soldierFightData.roundDatas
				}
			}
		};
		shrineReportPlayerDatas.push({
			id:playerDoc._id,
			name:playerDoc.basicInfo.name,
			icon:playerDoc.basicInfo.icon,
			kill:playerKills[playerDoc._id],
			rewards:playerRewards[playerDoc._id],
			fightResult:soldierFightData.fightResult
		})
	})

	var shrineReport = {
		id:ShortId.generate(),
		stageName:stageName,
		isWin:winCount > 0,
		time:Date.now(),
		playerCount:playerTroops.length,
		playerDatas:_.sortBy(shrineReportPlayerDatas, function(playerData){
			return -playerData.kill;
		})
	};

	var allianceHonourGet = stageConfig.honour * winCount;
	return {
		isWin:winCount > 0,
		allianceHonourGet:allianceHonourGet,
		shrineReport:shrineReport,
		playerFullReports:playerReports,
		playerSoldiers:playerSoldiers,
		playerKills:playerKills,
		playerRewards:playerRewards,
		playerDragons:playerDragons
	}
}

/**
 * 创建空的圣地战战报
 * @param stageName
 * @returns {*}
 */
Utils.createAttackShrineEmptyReport = function(stageName){
	return {
		id:ShortId.generate(),
		stageName:stageName,
		star:0,
		time:Date.now(),
		playerCount:0,
		playerAvgPower:0,
		playerDatas:[],
		fightDatas:[]
	}
}

/**
 * 创建进攻区域地图野怪报告
 * @param attackAllianceDoc
 * @param attackPlayerDoc
 * @param attackDragonForFight
 * @param attackSoldiersForFight
 * @param defenceAllianceDoc
 * @param defenceMonster
 * @param dragonFightData
 * @param soldierFightData
 * @returns {*}
 */
Utils.createAttackMonsterReport = function(attackAllianceDoc, attackPlayerDoc, attackDragonForFight, attackSoldiersForFight, defenceAllianceDoc, defenceMonster, dragonFightData, soldierFightData){
	var getKilledCitizen = function(soldiersForFight){
		var killed = 0
		var config = null
		_.each(soldiersForFight, function(soldierForFight){
			_.each(soldierForFight.killedSoldiers, function(soldier){
				if(DataUtils.isNormalSoldier(soldier.name)){
					var soldierFullKey = soldier.name + "_" + soldier.star
					config = Soldiers.normal[soldierFullKey]
					killed += soldier.count * config.killScore
				}else{
					config = Soldiers.special[soldier.name]
					killed += soldier.count * config.killScore
				}
			})
		})
		return killed
	}
	var createSoldiersDataAfterFight = function(soldiersForFight){
		var soldiers = []
		_.each(soldiersForFight, function(soldierForFight){
			var soldier = {
				name:soldierForFight.name,
				star:soldierForFight.star,
				count:soldierForFight.totalCount,
				countDecreased:soldierForFight.totalCount - soldierForFight.currentCount
			}
			soldiers.push(soldier)
		})
		return soldiers
	}
	var createDragonFightData = function(dragonForFight){
		var data = {
			type:dragonForFight.type,
			hpMax:dragonForFight.maxHp,
			hp:dragonForFight.totalHp,
			hpDecreased:dragonForFight.totalHp - dragonForFight.currentHp,
			isWin:dragonForFight.isWin
		}
		return data
	}
	var createAllianceData = function(allianceDoc){
		var data = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			mapIndex:allianceDoc.mapIndex
		}
		return data
	}
	var createDragonData = function(dragonAfterFight, expAdd){
		var dragonData = {
			type:dragonAfterFight.type,
			level:dragonAfterFight.level,
			expAdd:expAdd,
			hp:dragonAfterFight.totalHp,
			hpDecreased:dragonAfterFight.totalHp - dragonAfterFight.currentHp
		}
		return dragonData
	}

	var attackPlayerKilledCitizen = getKilledCitizen(soldierFightData.attackSoldiersAfterFight)
	var attackDragonExpAdd = DataUtils.getPlayerDragonExpAdd(attackAllianceDoc, attackPlayerDoc, attackPlayerKilledCitizen)
	var attackPlayerRewards = []

	if(_.isEqual(Consts.FightResult.AttackWin, soldierFightData.fightResult))
		attackPlayerRewards.push(DataUtils.getMonsterRewards(defenceMonster.level));

	var attackMonsterReport = {
		attackTarget:{
			level:defenceMonster.level,
			location:_.find(defenceAllianceDoc.mapObjects, function(mapObject){
				return _.isEqual(mapObject.id, defenceMonster.id);
			}).location,
			alliance:createAllianceData(defenceAllianceDoc),
			terrain:defenceAllianceDoc.basicInfo.terrain
		},
		attackPlayerData:{
			id:attackPlayerDoc._id,
			name:attackPlayerDoc.basicInfo.name,
			icon:attackPlayerDoc.basicInfo.icon,
			alliance:createAllianceData(attackAllianceDoc),
			dragon:createDragonData(dragonFightData.attackDragonAfterFight, attackDragonExpAdd),
			soldiers:createSoldiersDataAfterFight(soldierFightData.attackSoldiersAfterFight),
			rewards:attackPlayerRewards
		},
		defenceMonsterData:{
			id:defenceMonster.id,
			level:defenceMonster.level,
			dragon:createDragonData(dragonFightData.defenceDragonAfterFight),
			soldiers:createSoldiersDataAfterFight(soldierFightData.defenceSoldiersAfterFight)
		},
		fightWithDefenceMonsterReports:{
			attackPlayerDragonFightData:createDragonFightData(dragonFightData.attackDragonAfterFight),
			defenceMonsterDragonFightData:createDragonFightData(dragonFightData.defenceDragonAfterFight),
			soldierRoundDatas:soldierFightData.roundDatas
		}
	}

	var reportForAttackPlayer = {
		id:ShortId.generate(),
		type:Consts.PlayerReportType.AttackMonster,
		createTime:Date.now(),
		isRead:false,
		isSaved:false,
		attackMonster:attackMonsterReport
	}

	var countData = {
		attackPlayerKill:attackPlayerKilledCitizen,
		attackDragonExpAdd:attackDragonExpAdd
	}

	return {
		reportForAttackPlayer:reportForAttackPlayer,
		countData:countData
	}
}

/**
 * 获取部队详细信息
 * @param playerDoc
 * @param marchEventId
 * @param dragon
 * @param soldiers
 * @return {*}
 */
Utils.getPlayerMarchTroopDetail = function(playerDoc, marchEventId, dragon, soldiers){
	var getDragonSkills = function(dragon){
		var skills = []
		_.each(dragon.skills, function(skill){
			if(skill.level > 0){
				skills.push(skill)
			}
		})
		return skills
	}
	var getDragonEquipments = function(dragon){
		var equipments = []
		_.each(dragon.equipments, function(theEquipment, type){
			if(!_.isEmpty(theEquipment.name)){
				var equipment = {
					type:type,
					name:theEquipment.name,
					star:theEquipment.star
				}
				equipments.push(equipment)
			}
		})
		return equipments
	}
	var getSoldiersInTroop = function(playerDoc, soldiersInTroop){
		var soldiers = []
		_.each(soldiersInTroop, function(soldierInTroop){
			var soldier = {
				name:soldierInTroop.name,
				star:DataUtils.getPlayerSoldierStar(playerDoc, soldierInTroop.name),
				count:soldierInTroop.count
			}
			soldiers.push(soldier)
		})
		return soldiers
	}
	var getMiliraryTechs = function(playerDoc){
		var techs = []
		_.each(playerDoc.militaryTechs, function(theTech, name){
			if(theTech.level > 0){
				var tech = {
					name:name,
					level:theTech.level
				}
				techs.push(tech)
			}
		})
		return techs
	}
	var getMilitaryBuffs = function(playerDoc){
		return _.filter(playerDoc.itemEvents, function(event){
			return _.contains(Consts.MilitaryItemEventTypes, event.type)
		})
	}
	dragon = playerDoc.dragons[dragon.type]
	var detail = {
		marchEventId:marchEventId,
		dragon:{
			type:dragon.type,
			star:dragon.star,
			level:dragon.level,
			hp:dragon.hp,
			equipments:getDragonEquipments(dragon),
			skills:getDragonSkills(dragon)
		},
		soldiers:_.isArray(soldiers) ? getSoldiersInTroop(playerDoc, soldiers) : null,
		militaryTechs:getMiliraryTechs(playerDoc),
		militaryBuffs:getMilitaryBuffs(playerDoc)
	}

	if(!_.isArray(soldiers)) delete detail.soldiers

	return detail
}

/**
 * 获取协防部队详细信息
 * @param playerDoc
 * @param dragon
 * @param soldiers
 * @return {*}
 */
Utils.getPlayerHelpDefenceTroopDetail = function(playerDoc, dragon, soldiers){
	var getDragonSkills = function(dragon){
		var skills = []
		_.each(dragon.skills, function(skill){
			if(skill.level > 0){
				skills.push(skill)
			}
		})
		return skills
	}
	var getDragonEquipments = function(dragon){
		var equipments = []
		_.each(dragon.equipments, function(theEquipment, type){
			if(!_.isEmpty(theEquipment.name)){
				var equipment = {
					type:type,
					name:theEquipment.name,
					star:theEquipment.star
				}
				equipments.push(equipment)
			}
		})
		return equipments
	}
	var getSoldiersInTroop = function(playerDoc, soldiersInTroop){
		var soldiers = []
		_.each(soldiersInTroop, function(soldierInTroop){
			var soldier = {
				name:soldierInTroop.name,
				star:DataUtils.getPlayerSoldierStar(playerDoc, soldierInTroop.name),
				count:soldierInTroop.count
			}
			soldiers.push(soldier)
		})
		return soldiers
	}

	dragon = playerDoc.dragons[dragon.type]
	var detail = {
		player:{
			id:playerDoc._id,
			name:playerDoc.basicInfo.name,
			icon:playerDoc.basicInfo.icon,
			power:playerDoc.basicInfo.power,
			levelExp:playerDoc.basicInfo.levelExp
		},
		dragon:{
			type:dragon.type,
			star:dragon.star,
			level:dragon.level,
			hp:dragon.hp,
			equipments:getDragonEquipments(dragon),
			skills:getDragonSkills(dragon)
		},
		soldiers:getSoldiersInTroop(playerDoc, soldiers)
	}

	if(!_.isArray(soldiers)) delete detail.soldiers

	return detail
}

/**
 * 创建进攻Pve关卡战报
 * @param playerDoc
 * @param sectionName
 * @param dragonFightData
 * @param soldierFightData
 * @returns {{playerDragonExpAdd: number, playerDragonHpDecreased: number, playerSoldiers, playerWoundedSoldiers, playerRewards}}
 */
Utils.createAttackPveSectionReport = function(playerDoc, sectionName, dragonFightData, soldierFightData){
	var createDragonFightData = function(dragonForFight){
		var data = {
			type:dragonForFight.type,
			hpMax:dragonForFight.maxHp,
			hp:dragonForFight.totalHp,
			hpDecreased:dragonForFight.totalHp - dragonForFight.currentHp,
			isWin:dragonForFight.isWin
		}
		return data
	}
	var createSoldiers = function(soldiersAfterFight){
		var soldiers = []
		_.each(soldiersAfterFight, function(soldierAfterFight){
			if(soldierAfterFight.currentCount > 0){
				var soldier = {
					name:soldierAfterFight.name,
					count:soldierAfterFight.currentCount
				}
				soldiers.push(soldier)
			}
		})
		return soldiers
	}
	var createWoundedSoldiers = function(soldiersAfterFight){
		var soldiers = []
		_.each(soldiersAfterFight, function(soldierAfterFight){
			var woundedCount = soldierAfterFight.totalCount - soldierAfterFight.currentCount;
			if(woundedCount){
				var soldier = {
					name:soldierAfterFight.name,
					count:woundedCount
				}
				soldiers.push(soldier)
			}
		})
		return soldiers
	}
	var getKilledCitizen = function(soldiersForFight){
		var killed = 0
		var config = null
		_.each(soldiersForFight, function(soldierForFight){
			_.each(soldierForFight.killedSoldiers, function(soldier){
				if(DataUtils.isNormalSoldier(soldier.name)){
					var soldierFullKey = soldier.name + "_" + soldier.star
					config = Soldiers.normal[soldierFullKey]
					killed += soldier.count * config.killScore
				}else{
					config = Soldiers.special[soldier.name]
					killed += soldier.count * config.killScore
				}
			})
		})
		return killed
	}

	var fightStar = 0;

	if(Consts.FightResult.AttackWin === soldierFightData.fightResult)
		fightStar += 1;
	if(fightStar > 0 && Consts.FightResult.AttackWin === dragonFightData.fightResult)
		fightStar += 1;
	if(fightStar > 0 && soldierFightData.roundDatas.length <= 1)
		fightStar += 1;

	var playerDragonFightData = createDragonFightData(dragonFightData.attackDragonAfterFight);
	var sectionDragonFightData = createDragonFightData(dragonFightData.defenceDragonAfterFight);
	var playerKilledCitizen = getKilledCitizen(soldierFightData.attackSoldiersAfterFight);
	var playerDragonExpAdd = DataUtils.getPlayerDragonExpAdd(null, playerDoc, playerKilledCitizen);
	var playerDragonHpDecreased = dragonFightData.attackDragonAfterFight.totalHp - dragonFightData.attackDragonAfterFight.currentHp;
	var playerSoldiers = createSoldiers(soldierFightData.attackSoldiersAfterFight);
	var playerWoundedSoldiers = createWoundedSoldiers(soldierFightData.attackSoldiersAfterFight);
	var playerReward = DataUtils.getPveSectionReward(sectionName, fightStar);

	return {
		playerDragonExpAdd:playerDragonExpAdd,
		playerDragonHpDecreased:playerDragonHpDecreased,
		playerSoldiers:playerSoldiers,
		playerWoundedSoldiers:playerWoundedSoldiers,
		playerRewards:_.isObject(playerReward) ? [playerReward] : null,
		fightReport:{
			fightStar:fightStar,
			playerDragonFightData:playerDragonFightData,
			sectionDragonFightData:sectionDragonFightData,
			roundDatas:soldierFightData.roundDatas
		}
	}
}