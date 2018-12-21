"use strict"

/**
 * Created by modun on 14-7-22.
 */

var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema

var Consts = require("../consts/consts")
var GameDatas = require("../datas/GameDatas")

var Buildings = GameDatas.Buildings.buildings
var BuildingFunction = GameDatas.BuildingFunction
var ResourceInitData = GameDatas.PlayerInitData.resources[1]
var ProductionTechs = GameDatas.ProductionTechs.productionTechs
var Dragons = GameDatas.Dragons.dragons


var createBuildingSchema = function(location){
	var schema = {
		type:{type:String, required:true, default:Buildings[location].name},
		level:{type:Number, required:true, default:0},
		location:{type:Number, required:true, default:location},
		houses:[{
			_id:false,
			type:{type:String, required:true},
			level:{type:Number, required:true},
			location:{type:Number, required:true}
		}]
	}
	return schema
};

var createDragonEquipmentSchema = function(){
	var schema = {
		name:{type:String, required:false, default:""},
		star:{type:Number, required:true, default:0},
		exp:{type:Number, required:true, default:0},
		buffs:[String]
	}
	return schema
};

var createDragonSkillSchema = function(skillName){
	var schema = {
		name:{type:String, required:true, default:skillName},
		level:{type:Number, required:true, default:0}
	}
	return schema
};

var createDragonSchema = function(dragonType){
	var schema = {
		type:{type:String, required:true, default:dragonType},
		level:{type:Number, required:true, default:0},
		exp:{type:Number, required:true, default:0},
		star:{type:Number, required:true, default:0},
		hp:{type:Number, required:true, default:0},
		hpRefreshTime:{type:Number, required:true, default:Date.now},
		status:{type:String, required:true, default:Consts.DragonStatus.Free},
		equipments:{
			crown:createDragonEquipmentSchema(),
			armguardLeft:createDragonEquipmentSchema(),
			armguardRight:createDragonEquipmentSchema(),
			chest:createDragonEquipmentSchema(),
			sting:createDragonEquipmentSchema(),
			orb:createDragonEquipmentSchema()
		},
		skills:{
			skill_1:createDragonSkillSchema(Dragons[dragonType].skill_1),
			skill_2:createDragonSkillSchema(Dragons[dragonType].skill_2),
			skill_3:createDragonSkillSchema(Dragons[dragonType].skill_3),
			skill_4:createDragonSkillSchema(Dragons[dragonType].skill_4),
			skill_5:createDragonSkillSchema(Dragons[dragonType].skill_5),
			skill_6:createDragonSkillSchema(Dragons[dragonType].skill_6),
			skill_7:createDragonSkillSchema(Dragons[dragonType].skill_7),
			skill_8:createDragonSkillSchema(Dragons[dragonType].skill_8),
			skill_9:createDragonSkillSchema(Dragons[dragonType].skill_9)
		}
	}
	return schema
};

var createActivitySchema = function(type){
	var schema = {
		type:{type:String, required:true, default:type},
		score:{type:Number, required:true, default:0},
		scoreRewardedIndex:{type:Number, required:true, default:0},
		rankRewardsGeted:{type:Boolean, required:true, default:false},
		finishTime:{type:Number, required:true, default:0}
	};
	return schema;
};

var createAllianceActivitySchema = function(type){
	var schema = {
		type:{type:String, required:true, default:type},
		scoreRewardedIndex:{type:Number, required:true, default:0},
		rankRewardsGeted:{type:Boolean, required:true, default:false},
		finishTime:{type:Number, required:true, default:0}
	};
	return schema;
};

var getPlayerIcon = function(){
	var index = 1 + ((Math.random() * 5) << 0)
	return index
};

var PlayerSchema = new Schema({
	_id:{type:String, required:true},
	serverId:{type:String, required:true},
	lastDeviceId:{type:String, required:true},
	lastActiveTime:{type:Number, required:true, default:Date.now, index:true},
	gc:{
		type:{type:String},
		gcId:{type:String},
		gcName:{type:String}
	},
	pushId:{type:String},
	pushStatus:{
		onAllianceFightPrepare:{type:Boolean, required:true, default:true},
		onAllianceFightStart:{type:Boolean, required:true, default:true},
		onAllianceShrineEventStart:{type:Boolean, required:true, default:true},
		onCityBeAttacked:{type:Boolean, required:true, default:true}
	},
	allianceId:{type:String},
	countInfo:{
		registerTime:{type:Number, required:true, default:Date.now},
		lastLoginTime:{type:Number, required:true, default:Date.now},
		lastLogoutTime:{type:Number, required:true, default:Date.now},
		loginCount:{type:Number, required:true, default:0},
		day60:{type:Number, required:true, default:1},
		day60RewardsCount:{type:Number, required:true, default:0},
		todayOnLineTime:{type:Number, required:true, default:0},
		todayOnLineTimeRewards:[Number],
		dailyTaskRewardCount:{type:Number, required:true, default:0},
		day14:{type:Number, required:true, default:1},
		day14RewardsCount:{type:Number, rquired:true, default:0},
		vipLoginDaysCount:{type:Number, required:true, default:1},
		levelupRewards:[Number],
		iapCount:{type:Number, required:true, default:0},
		iapGemCount:{type:Number, required:true, default:0},
		todayFreeNormalGachaCount:{type:Number, required:true, default:0},
		isFirstIAPRewardsGeted:{type:Boolean, required:true, default:false},
		todayLoyaltyGet:{type:Number, require:true, default:0},
		firstJoinAllianceRewardGeted:{type:Boolean, require:true, default:false},
		isFTEFinished:{type:Boolean, required:true, default:false},
		pveCount:{type:Number, required:true, default:0},
		lockTime:{type:Number, required:true, default:0},
		muteTime:{type:Number, required:true, default:0}
	},
	iapGemEvent:{
		iapGemCount:{type:Number, required:true, default:0},
		iapRewardedIndex:{type:Number, required:true, default:-1},
		finishTime:{type:Number, required:true, default:0}
	},
	monthCard:{
		index:{type:Number, required:true, default:-1},
		finishTime:{type:Number, required:true, default:0},
		todayRewardsGet:{type:Boolean, required:true, default:false}
	},
	basicInfo:{
		name:{type:String, required:true, index:true},
		icon:{type:Number, required:true, default:getPlayerIcon},
		levelExp:{type:Number, required:true, default:0},
		attackWin:{type:Number, required:true, default:0},
		attackTotal:{type:Number, required:true, default:0},
		strikeWin:{type:Number, required:true, default:0},
		defenceWin:{type:Number, required:true, default:0},
		kill:{type:Number, required:true, default:0, index:true},
		power:{type:Number, required:true, default:0, index:true},
		vipExp:{type:Number, required:true, default:0},
		language:{type:String, required:true, default:Consts.PlayerLanguage.Cn},
		buildQueue:{type:Number, required:true, default:1},
		recruitQueue:{type:Number, required:true, default:1},
		marchQueue:{type:Number, required:true, default:1},
		terrain:{type:String, required:true, default:Consts.None}
	},
	resources:{
		refreshTime:{type:Number, required:true, default:Date.now},
		wood:{type:Number, required:true, default:ResourceInitData.wood},
		stone:{type:Number, required:true, default:ResourceInitData.stone},
		iron:{type:Number, required:true, default:ResourceInitData.iron},
		food:{type:Number, required:true, default:ResourceInitData.food},
		citizen:{type:Number, required:true, default:ResourceInitData.citizen},
		gem:{type:Number, required:true, default:ResourceInitData.gem},
		coin:{type:Number, required:true, default:ResourceInitData.coin},
		cart:{type:Number, required:true, default:ResourceInitData.cart},
		blood:{type:Number, required:true, default:ResourceInitData.blood},
		wallHp:{type:Number, required:true, default:BuildingFunction.wall[1].wallHp},
		stamina:{type:Number, required:true, default:ResourceInitData.stamina},
		casinoToken:{type:Number, required:true, default:ResourceInitData.casinoToken}
	},
	allianceData:{
		loyalty:{type:Number, reuqired:true, default:0}
	},
	allianceDonate:{
		wood:{type:Number, required:true, default:1},
		stone:{type:Number, required:true, default:1},
		iron:{type:Number, required:true, default:1},
		food:{type:Number, required:true, default:1},
		coin:{type:Number, required:true, default:1},
		gem:{type:Number, required:true, default:1}
	},
	vipEvents:[{
		_id:false,
		id:{type:String, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	buildingMaterials:{
		blueprints:{type:Number, required:true, default:0},
		tools:{type:Number, required:true, default:0},
		tiles:{type:Number, required:true, default:0},
		pulley:{type:Number, required:true, default:0}
	},
	technologyMaterials:{
		trainingFigure:{type:Number, required:true, default:0},
		bowTarget:{type:Number, required:true, default:0},
		saddle:{type:Number, required:true, default:0},
		ironPart:{type:Number, required:true, default:0}
	},
	materialEvents:[{
		_id:false,
		id:{type:String, required:true},
		type:{type:String, required:true},
		materials:[{
			_id:false,
			name:{type:String, required:true},
			count:{type:Number, required:true}
		}],
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	soldierMaterials:{
		deathHand:{type:Number, required:true, default:0},
		heroBones:{type:Number, required:true, default:0},
		soulStone:{type:Number, required:true, default:0},
		magicBox:{type:Number, required:true, default:0},
		confessionHood:{type:Number, required:true, default:0},
		brightRing:{type:Number, required:true, default:0},
		holyBook:{type:Number, required:true, default:0},
		brightAlloy:{type:Number, required:true, default:0}
	},
	soldiers:{
		swordsman_1:{type:Number, required:true, default:0},
		swordsman_2:{type:Number, required:true, default:0},
		swordsman_3:{type:Number, required:true, default:0},
		sentinel_1:{type:Number, required:true, default:0},
		sentinel_2:{type:Number, required:true, default:0},
		sentinel_3:{type:Number, required:true, default:0},
		ranger_1:{type:Number, required:true, default:0},
		ranger_2:{type:Number, required:true, default:0},
		ranger_3:{type:Number, required:true, default:0},
		crossbowman_1:{type:Number, required:true, default:0},
		crossbowman_2:{type:Number, required:true, default:0},
		crossbowman_3:{type:Number, required:true, default:0},
		lancer_1:{type:Number, required:true, default:0},
		lancer_2:{type:Number, required:true, default:0},
		lancer_3:{type:Number, required:true, default:0},
		horseArcher_1:{type:Number, required:true, default:0},
		horseArcher_2:{type:Number, required:true, default:0},
		horseArcher_3:{type:Number, required:true, default:0},
		catapult_1:{type:Number, required:true, default:0},
		catapult_2:{type:Number, required:true, default:0},
		catapult_3:{type:Number, required:true, default:0},
		ballista_1:{type:Number, required:true, default:0},
		ballista_2:{type:Number, required:true, default:0},
		ballista_3:{type:Number, required:true, default:0},
		skeletonWarrior:{type:Number, required:true, default:0},
		skeletonArcher:{type:Number, required:true, default:0},
		deathKnight:{type:Number, required:true, default:0},
		meatWagon:{type:Number, required:true, default:0}
	},
	soldierEvents:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		count:{type:Number, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	soldierStars:{
		swordsman_1:{type:Number, required:true, default:1},
		swordsman_2:{type:Number, required:true, default:1},
		swordsman_3:{type:Number, required:true, default:1},
		sentinel_1:{type:Number, required:true, default:1},
		sentinel_2:{type:Number, required:true, default:1},
		sentinel_3:{type:Number, required:true, default:1},
		ranger_1:{type:Number, required:true, default:1},
		ranger_2:{type:Number, required:true, default:1},
		ranger_3:{type:Number, required:true, default:1},
		crossbowman_1:{type:Number, required:true, default:1},
		crossbowman_2:{type:Number, required:true, default:1},
		crossbowman_3:{type:Number, required:true, default:1},
		lancer_1:{type:Number, required:true, default:1},
		lancer_2:{type:Number, required:true, default:1},
		lancer_3:{type:Number, required:true, default:1},
		horseArcher_1:{type:Number, required:true, default:1},
		horseArcher_2:{type:Number, required:true, default:1},
		horseArcher_3:{type:Number, required:true, default:1},
		catapult_1:{type:Number, required:true, default:1},
		catapult_2:{type:Number, required:true, default:1},
		catapult_3:{type:Number, required:true, default:1},
		ballista_1:{type:Number, required:true, default:1},
		ballista_2:{type:Number, required:true, default:1},
		ballista_3:{type:Number, required:true, default:1}
	},
	soldierStarEvents:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		helped:{type:Boolean, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	woundedSoldiers:{
		swordsman_1:{type:Number, required:true, default:0},
		swordsman_2:{type:Number, required:true, default:0},
		swordsman_3:{type:Number, required:true, default:0},
		sentinel_1:{type:Number, required:true, default:0},
		sentinel_2:{type:Number, required:true, default:0},
		sentinel_3:{type:Number, required:true, default:0},
		ranger_1:{type:Number, required:true, default:0},
		ranger_2:{type:Number, required:true, default:0},
		ranger_3:{type:Number, required:true, default:0},
		crossbowman_1:{type:Number, required:true, default:0},
		crossbowman_2:{type:Number, required:true, default:0},
		crossbowman_3:{type:Number, required:true, default:0},
		lancer_1:{type:Number, required:true, default:0},
		lancer_2:{type:Number, required:true, default:0},
		lancer_3:{type:Number, required:true, default:0},
		horseArcher_1:{type:Number, required:true, default:0},
		horseArcher_2:{type:Number, required:true, default:0},
		horseArcher_3:{type:Number, required:true, default:0},
		catapult_1:{type:Number, required:true, default:0},
		catapult_2:{type:Number, required:true, default:0},
		catapult_3:{type:Number, required:true, default:0},
		ballista_1:{type:Number, required:true, default:0},
		ballista_2:{type:Number, required:true, default:0},
		ballista_3:{type:Number, required:true, default:0},
		skeletonWarrior:{type:Number, required:true, default:0},
		skeletonArcher:{type:Number, required:true, default:0},
		deathKnight:{type:Number, required:true, default:0},
		meatWagon:{type:Number, required:true, default:0}
	},
	treatSoldierEvents:[{
		_id:false,
		id:{type:String, required:true},
		soldiers:[{
			_id:false,
			name:{type:String, required:true},
			count:{type:Number, required:true}
		}],
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	dragonMaterials:{
		ingo_1:{type:Number, required:true, default:0},
		ingo_2:{type:Number, required:true, default:0},
		ingo_3:{type:Number, required:true, default:0},
		ingo_4:{type:Number, required:true, default:0},
		redSoul_2:{type:Number, required:true, default:0},
		redSoul_3:{type:Number, required:true, default:0},
		redSoul_4:{type:Number, required:true, default:0},
		blueSoul_2:{type:Number, required:true, default:0},
		blueSoul_3:{type:Number, required:true, default:0},
		blueSoul_4:{type:Number, required:true, default:0},
		greenSoul_2:{type:Number, required:true, default:0},
		greenSoul_3:{type:Number, required:true, default:0},
		greenSoul_4:{type:Number, required:true, default:0},
		redCrystal_1:{type:Number, required:true, default:0},
		redCrystal_2:{type:Number, required:true, default:0},
		redCrystal_3:{type:Number, required:true, default:0},
		redCrystal_4:{type:Number, required:true, default:0},
		blueCrystal_1:{type:Number, required:true, default:0},
		blueCrystal_2:{type:Number, required:true, default:0},
		blueCrystal_3:{type:Number, required:true, default:0},
		blueCrystal_4:{type:Number, required:true, default:0},
		greenCrystal_1:{type:Number, required:true, default:0},
		greenCrystal_2:{type:Number, required:true, default:0},
		greenCrystal_3:{type:Number, required:true, default:0},
		greenCrystal_4:{type:Number, required:true, default:0},
		runes_1:{type:Number, required:true, default:0},
		runes_2:{type:Number, required:true, default:0},
		runes_3:{type:Number, required:true, default:0},
		runes_4:{type:Number, required:true, default:0}
	},
	dragonEquipments:{
		redCrown_s1:{type:Number, required:true, default:0},
		blueCrown_s1:{type:Number, required:true, default:0},
		greenCrown_s1:{type:Number, required:true, default:0},
		redCrown_s2:{type:Number, required:true, default:0},
		blueCrown_s2:{type:Number, required:true, default:0},
		greenCrown_s2:{type:Number, required:true, default:0},
		redCrown_s3:{type:Number, required:true, default:0},
		blueCrown_s3:{type:Number, required:true, default:0},
		greenCrown_s3:{type:Number, required:true, default:0},
		redCrown_s4:{type:Number, required:true, default:0},
		blueCrown_s4:{type:Number, required:true, default:0},
		greenCrown_s4:{type:Number, required:true, default:0},
		redCrown_s5:{type:Number, required:true, default:0},
		blueCrown_s5:{type:Number, required:true, default:0},
		greenCrown_s5:{type:Number, required:true, default:0},
		redChest_s2:{type:Number, required:true, default:0},
		blueChest_s2:{type:Number, required:true, default:0},
		greenChest_s2:{type:Number, required:true, default:0},
		redChest_s3:{type:Number, required:true, default:0},
		blueChest_s3:{type:Number, required:true, default:0},
		greenChest_s3:{type:Number, required:true, default:0},
		redChest_s4:{type:Number, required:true, default:0},
		blueChest_s4:{type:Number, required:true, default:0},
		greenChest_s4:{type:Number, required:true, default:0},
		redChest_s5:{type:Number, required:true, default:0},
		blueChest_s5:{type:Number, required:true, default:0},
		greenChest_s5:{type:Number, required:true, default:0},
		redSting_s2:{type:Number, required:true, default:0},
		blueSting_s2:{type:Number, required:true, default:0},
		greenSting_s2:{type:Number, required:true, default:0},
		redSting_s3:{type:Number, required:true, default:0},
		blueSting_s3:{type:Number, required:true, default:0},
		greenSting_s3:{type:Number, required:true, default:0},
		redSting_s4:{type:Number, required:true, default:0},
		blueSting_s4:{type:Number, required:true, default:0},
		greenSting_s4:{type:Number, required:true, default:0},
		redSting_s5:{type:Number, required:true, default:0},
		blueSting_s5:{type:Number, required:true, default:0},
		greenSting_s5:{type:Number, required:true, default:0},
		redOrd_s2:{type:Number, required:true, default:0},
		blueOrd_s2:{type:Number, required:true, default:0},
		greenOrd_s2:{type:Number, required:true, default:0},
		redOrd_s3:{type:Number, required:true, default:0},
		blueOrd_s3:{type:Number, required:true, default:0},
		greenOrd_s3:{type:Number, required:true, default:0},
		redOrd_s4:{type:Number, required:true, default:0},
		blueOrd_s4:{type:Number, required:true, default:0},
		greenOrd_s4:{type:Number, required:true, default:0},
		redOrd_s5:{type:Number, required:true, default:0},
		blueOrd_s5:{type:Number, required:true, default:0},
		greenOrd_s5:{type:Number, required:true, default:0},
		redArmguard_s1:{type:Number, required:true, default:0},
		blueArmguard_s1:{type:Number, required:true, default:0},
		greenArmguard_s1:{type:Number, required:true, default:0},
		redArmguard_s2:{type:Number, required:true, default:0},
		blueArmguard_s2:{type:Number, required:true, default:0},
		greenArmguard_s2:{type:Number, required:true, default:0},
		redArmguard_s3:{type:Number, required:true, default:0},
		blueArmguard_s3:{type:Number, required:true, default:0},
		greenArmguard_s3:{type:Number, required:true, default:0},
		redArmguard_s4:{type:Number, required:true, default:0},
		blueArmguard_s4:{type:Number, required:true, default:0},
		greenArmguard_s4:{type:Number, required:true, default:0},
		redArmguard_s5:{type:Number, required:true, default:0},
		blueArmguard_s5:{type:Number, required:true, default:0},
		greenArmguard_s5:{type:Number, required:true, default:0}
	},
	dragonEquipmentEvents:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	dragons:{
		redDragon:createDragonSchema("redDragon"),
		blueDragon:createDragonSchema("blueDragon"),
		greenDragon:createDragonSchema("greenDragon")
	},
	dragonDeathEvents:[{
		_id:false,
		id:{type:String, required:true},
		dragonType:{type:String, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	buildings:{
		location_1:createBuildingSchema(1),
		location_3:createBuildingSchema(3),
		location_4:createBuildingSchema(4),
		location_5:createBuildingSchema(5),
		location_6:createBuildingSchema(6),
		location_7:createBuildingSchema(7),
		location_8:createBuildingSchema(8),
		location_9:createBuildingSchema(9),
		location_10:createBuildingSchema(10),
		location_11:createBuildingSchema(11),
		location_12:createBuildingSchema(12),
		location_13:createBuildingSchema(13),
		location_14:createBuildingSchema(14),
		location_15:createBuildingSchema(15),
		location_16:createBuildingSchema(16),
		location_17:createBuildingSchema(17),
		location_18:createBuildingSchema(18),
		location_19:createBuildingSchema(19),
		location_20:createBuildingSchema(20),
		location_21:createBuildingSchema(21),
		location_22:createBuildingSchema(22)
	},
	buildingEvents:[{
		_id:false,
		id:{type:String, required:true},
		location:{type:Number, required:true},
		helped:{type:Boolean, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	houseEvents:[{
		_id:false,
		id:{type:String, required:true},
		buildingLocation:{type:Number, required:true},
		houseLocation:{type:Number, required:true},
		helped:{type:Boolean, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	productionTechs:{
		crane:{
			index:{type:Number, required:true, default:ProductionTechs.crane.index},
			level:{type:Number, required:true, default:0}
		},
		stoneCarving:{
			index:{type:Number, required:true, default:ProductionTechs.stoneCarving.index},
			level:{type:Number, required:true, default:0}
		},
		forestation:{
			index:{type:Number, required:true, default:ProductionTechs.forestation.index},
			level:{type:Number, required:true, default:0}
		},
		fastFix:{
			index:{type:Number, required:true, default:ProductionTechs.fastFix.index},
			level:{type:Number, required:true, default:0}
		},
		ironSmelting:{
			index:{type:Number, required:true, default:ProductionTechs.ironSmelting.index},
			level:{type:Number, required:true, default:0}
		},
		cropResearch:{
			index:{type:Number, required:true, default:ProductionTechs.cropResearch.index},
			level:{type:Number, required:true, default:0}
		},
		reinforcing:{
			index:{type:Number, required:true, default:ProductionTechs.reinforcing.index},
			level:{type:Number, required:true, default:0}
		},
		seniorTower:{
			index:{type:Number, required:true, default:ProductionTechs.seniorTower.index},
			level:{type:Number, required:true, default:0}
		},
		beerSupply:{
			index:{type:Number, required:true, default:ProductionTechs.beerSupply.index},
			level:{type:Number, required:true, default:0}
		},
		rescueTent:{
			index:{type:Number, required:true, default:ProductionTechs.rescueTent.index},
			level:{type:Number, required:true, default:0}
		},
		colonization:{
			index:{type:Number, required:true, default:ProductionTechs.colonization.index},
			level:{type:Number, required:true, default:0}
		},
		recruitment:{
			index:{type:Number, required:true, default:ProductionTechs.recruitment.index},
			level:{type:Number, required:true, default:0}
		},
		trap:{
			index:{type:Number, required:true, default:ProductionTechs.trap.index},
			level:{type:Number, required:true, default:0}
		},
		hideout:{
			index:{type:Number, required:true, default:ProductionTechs.hideout.index},
			level:{type:Number, required:true, default:0}
		},
		logistics:{
			index:{type:Number, required:true, default:ProductionTechs.logistics.index},
			level:{type:Number, required:true, default:0}
		},
		healingAgent:{
			index:{type:Number, required:true, default:ProductionTechs.healingAgent.index},
			level:{type:Number, required:true, default:0}
		},
		sketching:{
			index:{type:Number, required:true, default:ProductionTechs.sketching.index},
			level:{type:Number, required:true, default:0}
		},
		mintedCoin:{
			index:{type:Number, required:true, default:ProductionTechs.mintedCoin.index},
			level:{type:Number, required:true, default:0}
		}
	},
	productionTechEvents:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		helped:{type:Boolean, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	militaryTechs:{
		infantry_infantry:{
			building:{type:String, required:true, default:"trainingGround"},
			level:{type:Number, required:true, default:0}
		},
		infantry_archer:{
			building:{type:String, required:true, default:"trainingGround"},
			level:{type:Number, required:true, default:0}
		},
		infantry_cavalry:{
			building:{type:String, required:true, default:"trainingGround"},
			level:{type:Number, required:true, default:0}
		},
		infantry_siege:{
			building:{type:String, required:true, default:"trainingGround"},
			level:{type:Number, required:true, default:0}
		},
		infantry_hpAdd:{
			building:{type:String, required:true, default:"trainingGround"},
			level:{type:Number, required:true, default:0}
		},
		archer_infantry:{
			building:{type:String, required:true, default:"hunterHall"},
			level:{type:Number, required:true, default:0}
		},
		archer_archer:{
			building:{type:String, required:true, default:"hunterHall"},
			level:{type:Number, required:true, default:0}
		},
		archer_cavalry:{
			building:{type:String, required:true, default:"hunterHall"},
			level:{type:Number, required:true, default:0}
		},
		archer_siege:{
			building:{type:String, required:true, default:"hunterHall"},
			level:{type:Number, required:true, default:0}
		},
		archer_hpAdd:{
			building:{type:String, required:true, default:"hunterHall"},
			level:{type:Number, required:true, default:0}
		},
		cavalry_infantry:{
			building:{type:String, required:true, default:"stable"},
			level:{type:Number, required:true, default:0}
		},
		cavalry_archer:{
			building:{type:String, required:true, default:"stable"},
			level:{type:Number, required:true, default:0}
		},
		cavalry_cavalry:{
			building:{type:String, required:true, default:"stable"},
			level:{type:Number, required:true, default:0}
		},
		cavalry_siege:{
			building:{type:String, required:true, default:"stable"},
			level:{type:Number, required:true, default:0}
		},
		cavalry_hpAdd:{
			building:{type:String, required:true, default:"stable"},
			level:{type:Number, required:true, default:0}
		},
		siege_infantry:{
			building:{type:String, required:true, default:"workshop"},
			level:{type:Number, required:true, default:0}
		},
		siege_archer:{
			building:{type:String, required:true, default:"workshop"},
			level:{type:Number, required:true, default:0}
		},
		siege_cavalry:{
			building:{type:String, required:true, default:"workshop"},
			level:{type:Number, required:true, default:0}
		},
		siege_siege:{
			building:{type:String, required:true, default:"workshop"},
			level:{type:Number, required:true, default:0}
		},
		siege_hpAdd:{
			building:{type:String, required:true, default:"workshop"},
			level:{type:Number, required:true, default:0}
		}
	},
	militaryTechEvents:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		helped:{type:Boolean, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	requestToAllianceEvents:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		tag:{type:String, required:true},
		flag:{type:String, required:true},
		archon:{type:String, required:true},
		terrain:{type:String, required:true},
		members:{type:Number, required:true},
		membersMax:{type:Number, required:true},
		power:{type:Number, required:true},
		country:{type:String, required:true},
		kill:{type:String, required:true},
		requestTime:{type:Number, required:true}
	}],
	inviteToAllianceEvents:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		tag:{type:String, required:true},
		flag:{type:String, required:true},
		archon:{type:String, required:true},
		terrain:{type:String, required:true},
		members:{type:Number, required:true},
		membersMax:{type:Number, required:true},
		power:{type:Number, required:true},
		country:{type:String, required:true},
		kill:{type:String, required:true},
		inviterId:{type:String, reuqired:true},
		inviteTime:{type:Number, required:true}
	}],
	mails:[{
		_id:false,
		id:{type:String, required:true},
		title:{type:String, required:true},
		fromId:{type:String, required:true},
		fromAllianceTag:{type:String, required:true},
		fromName:{type:String, required:true},
		fromIcon:{type:Number, required:true},
		toIcon:{type:Number, required:true},
		content:{type:String, required:true},
		sendTime:{type:Number, required:true},
		rewards:[{
			_id:false,
			type:{type:String, required:true},
			name:{type:String, required:true},
			count:{type:Number, required:true}
		}],
		rewardGetted:{type:Boolean, required:true},
		isRead:{type:Boolean, require:true},
		isSaved:{type:Boolean, require:true}
	}],
	sendMails:[{
		_id:false,
		id:{type:String, required:true},
		title:{type:String, required:true},
		fromName:{type:String, required:true},
		fromIcon:{type:Number, required:true},
		fromAllianceTag:{type:String, required:true},
		toId:{type:String, required:true},
		toName:{type:String, required:true},
		toIcon:{type:Number, required:true},
		content:{type:String, required:true},
		sendTime:{type:Number, required:true}
	}],
	reports:[{
		_id:false,
		id:{type:String, required:true},
		type:{type:String, required:true},
		createTime:{type:String, required:true},
		isRead:{type:Boolean, require:true},
		isSaved:{type:Boolean, require:true},
		strikeCity:{
			type:{
				level:{type:Number, required:true},
				strikeTarget:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true}
					},
					terrain:{type:String, required:true},
					fogOfTrick:{type:Boolean, required:true}
				},
				attackPlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					}
				},
				helpDefencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						equipments:[{
							type:{type:String, required:true},
							name:{type:String, required:true},
							star:{type:String, required:true}
						}],
						skills:[{
							_id:false,
							name:{type:String, required:true},
							level:{type:String, required:true}
						}]
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true}
					}],
					militaryTechs:[{
						name:{type:String, required:true},
						level:{type:String, required:true}
					}]
				},
				defencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						equipments:[{
							type:{type:String, required:true},
							name:{type:String, required:true},
							star:{type:String, required:true}
						}],
						skills:[{
							_id:false,
							name:{type:String, required:true},
							level:{type:String, required:true}
						}]
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true}
					}],
					militaryTechs:[{
						name:{type:String, required:true},
						level:{type:String, required:true}
					}],
					resources:{
						wood:{type:Number, required:true},
						stone:{type:Number, required:true},
						iron:{type:Number, required:true},
						food:{type:Number, required:true}
					}
				}
			},
			required:false
		},
		cityBeStriked:{
			type:{
				level:{type:Number, required:true},
				strikeTarget:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true}
					},
					terrain:{type:String, required:true}
				},
				attackPlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						equipments:[{
							type:{type:String, required:true},
							name:{type:String, required:true},
							star:{type:String, required:true}
						}]
					}
				},
				helpDefencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					}
				},
				defencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					}
				}
			},
			required:false
		},
		strikeVillage:{
			type:{
				level:{type:Number, required:true},
				strikeTarget:{
					name:{type:String, required:true},
					level:{type:Number, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true}
					},
					terrain:{type:String, required:true}
				},
				attackPlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					}
				},
				defencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						equipments:[{
							type:{type:String, required:true},
							name:{type:String, required:true},
							star:{type:String, required:true}
						}],
						skills:[{
							_id:false,
							name:{type:String, required:true},
							level:{type:String, required:true}
						}]
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true}
					}],
					militaryTechs:[{
						name:{type:String, required:true},
						level:{type:String, required:true}
					}]
				}
			},
			required:false
		},
		villageBeStriked:{
			type:{
				level:{type:Number, required:true},
				strikeTarget:{
					name:{type:String, required:true},
					level:{type:Number, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true}
					},
					terrain:{type:String, required:true}
				},
				attackPlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						equipments:[{
							type:{type:String, required:true},
							name:{type:String, required:true},
							star:{type:String, required:true}
						}]
					}
				},
				defencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					}
				}
			},
			required:false
		},
		attackCity:{
			type:{
				attackTarget:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					terrain:{type:String, required:true}
				},
				attackPlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					fightWithHelpDefenceTroop:{
						dragon:{
							type:{type:String, required:true},
							level:{type:Number, required:true},
							expAdd:{type:Number, required:true},
							hp:{type:Number, required:true},
							hpDecreased:{type:Number, required:true}
						},
						soldiers:[{
							_id:false,
							name:{type:String, required:true},
							star:{type:Number, required:true},
							count:{type:Number, required:true},
							countDecreased:{type:Number, required:true}
						}]
					},
					fightWithDefenceTroop:{
						dragon:{
							type:{type:String, required:true},
							level:{type:Number, required:true},
							expAdd:{type:Number, required:true},
							hp:{type:Number, required:true},
							hpDecreased:{type:Number, required:true}
						},
						soldiers:[{
							_id:false,
							name:{type:String, required:true},
							star:{type:Number, required:true},
							count:{type:Number, required:true},
							countDecreased:{type:Number, required:true}
						}]
					},
					fightWithDefenceWall:{
						soldiers:[{
							_id:false,
							name:{type:String, required:true},
							star:{type:Number, required:true},
							count:{type:Number, required:true},
							countDecreased:{type:Number, required:true}
						}]
					},
					rewards:[{
						_id:false,
						type:{type:String, required:true},
						name:{type:String, required:true},
						count:{type:Number, required:true}
					}]
				},
				helpDefencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						expAdd:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true},
						countDecreased:{type:Number, required:true}
					}],
					rewards:[{
						_id:false,
						type:{type:String, required:true},
						name:{type:String, required:true},
						count:{type:Number, required:true}
					}]
				},
				defencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					masterOfDefender:{type:Boolean, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						expAdd:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true},
						countDecreased:{type:Number, required:true}
					}],
					wall:{
						level:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					rewards:[{
						_id:false,
						type:{type:String, required:true},
						name:{type:String, required:true},
						count:{type:Number, required:true}
					}]
				},
				fightWithHelpDefencePlayerReports:{
					attackPlayerDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					defencePlayerDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					soldierRoundDatas:[{
						_id:false,
						attackResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						defenceResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						attackDragonSkilled:[Number],
						defenceDragonSkilled:[Number]
					}]
				},
				fightWithDefencePlayerReports:{
					attackPlayerDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					defencePlayerDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					soldierRoundDatas:[{
						_id:false,
						attackResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						defenceResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						attackDragonSkilled:[Number],
						defenceDragonSkilled:[Number]
					}],
					attackPlayerWallRoundDatas:[{
						_id:false,
						soldierName:{type:String, required:true},
						soldierStar:{type:Number, required:true},
						soldierCount:{type:Number, required:true},
						soldierDamagedCount:{type:Number, required:true},
						soldierWoundedCount:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					}],
					defencePlayerWallRoundDatas:[{
						_id:false,
						wallMaxHp:{type:Number, required:true},
						wallHp:{type:Number, required:true},
						wallDamagedHp:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					}]
				}
			},
			required:false
		},
		attackVillage:{
			type:{
				attackTarget:{
					name:{type:String, required:true},
					level:{type:Number, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					terrain:{type:String, required:true}
				},
				attackPlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						expAdd:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true},
						countDecreased:{type:Number, required:true}
					}],
					rewards:[{
						_id:false,
						type:{type:String, required:true},
						name:{type:String, required:true},
						count:{type:Number, required:true}
					}]
				},
				defencePlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						expAdd:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true},
						countDecreased:{type:Number, required:true}
					}],
					rewards:[{
						_id:false,
						type:{type:String, required:true},
						name:{type:String, required:true},
						count:{type:Number, required:true}
					}]
				},
				fightWithDefencePlayerReports:{
					attackPlayerDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					defencePlayerDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					soldierRoundDatas:[{
						_id:false,
						attackResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						defenceResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						attackDragonSkilled:[Number],
						defenceDragonSkilled:[Number]
					}]
				}
			},
			required:false
		},
		attackMonster:{
			type:{
				attackTarget:{
					level:{type:Number, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					terrain:{type:String, required:true}
				},
				attackPlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						expAdd:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true},
						countDecreased:{type:Number, required:true}
					}],
					rewards:[{
						_id:false,
						type:{type:String, required:true},
						name:{type:String, required:true},
						count:{type:Number, required:true}
					}]
				},
				defenceMonsterData:{
					id:{type:String, required:true},
					level:{type:Number, required:true},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						expAdd:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true},
						countDecreased:{type:Number, required:true}
					}]
				},
				fightWithDefenceMonsterReports:{
					attackPlayerDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					defenceMonsterDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					soldierRoundDatas:[{
						_id:false,
						attackResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						defenceResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						attackDragonSkilled:[Number],
						defenceDragonSkilled:[Number]
					}]
				}
			},
			required:false
		},
		attackShrine:{
			type:{
				attackTarget:{
					stageName:{type:String, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true}
					},
					terrain:{type:String, required:true}
				},
				attackPlayerData:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					icon:{type:Number, required:true},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true},
						mapIndex:{type:Number, required:true}
					},
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						expAdd:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true},
						countDecreased:{type:Number, required:true}
					}],
					rewards:[{
						_id:false,
						type:{type:String, required:true},
						name:{type:String, required:true},
						count:{type:Number, required:true}
					}]
				},
				defenceTroopData:{
					dragon:{
						type:{type:String, required:true},
						level:{type:Number, required:true},
						expAdd:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true}
					},
					soldiers:[{
						_id:false,
						name:{type:String, required:true},
						star:{type:Number, required:true},
						count:{type:Number, required:true},
						countDecreased:{type:Number, required:true}
					}]
				},
				fightWithDefenceTroopReports:{
					attackPlayerDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					defenceTroopDragonFightData:{
						type:{type:String, required:true},
						hpMax:{type:Number, required:true},
						hp:{type:Number, required:true},
						hpDecreased:{type:Number, required:true},
						isWin:{type:Boolean, required:true}
					},
					soldierRoundDatas:[{
						_id:false,
						attackResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						defenceResults:[{
							_id:false,
							soldierName:{type:String, required:true},
							soldierStar:{type:Number, required:true},
							soldierCount:{type:Number, required:true},
							soldierDamagedCount:{type:Number, required:true},
							soldierWoundedCount:{type:Number, required:true},
							isWin:{type:Boolean, required:true}
						}],
						attackDragonSkilled:[Number],
						defenceDragonSkilled:[Number]
					}]
				}
			},
			required:false
		},
		collectResource:{
			type:{
				collectTarget:{
					name:{type:String, required:true},
					level:{type:Number, required:true},
					location:{
						x:{type:Number, required:true},
						y:{type:Number, required:true}
					},
					alliance:{
						id:{type:String, required:true},
						name:{type:String, required:true},
						tag:{type:String, required:true},
						flag:{type:String, required:true}
					}
				},
				rewards:[{
					_id:false,
					type:{type:String, required:true},
					name:{type:String, required:true},
					count:{type:Number, required:true}
				}]
			},
			required:false
		}
	}],
	helpToTroops:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		dragon:{type:String, required:true},
		location:{
			x:{type:Number, required:true},
			y:{type:Number, required:true}
		}
	}],
	helpedByTroop:{
		type:{
			id:{type:String, required:true},
			name:{type:String, required:true},
			dragon:{
				type:{type:String, required:true}
			},
			soldiers:[{
				_id:false,
				name:{type:String, required:true},
				count:{type:Number, required:true}
			}],
			woundedSoldiers:[{
				_id:false,
				name:{type:String, required:true},
				count:{type:Number, required:true}
			}],
			rewards:[{
				_id:false,
				type:{type:String, required:true},
				name:{type:String, required:true},
				count:{type:Number, required:true}
			}]
		},
		required:false
	},
	dailyQuests:{
		refreshTime:{type:Number, required:true, default:0},
		quests:[{
			_id:false,
			id:{type:String, required:true},
			index:{type:Number, required:true},
			star:{type:Number, required:true}
		}]
	},
	dailyQuestEvents:[{
		_id:false,
		id:{type:String, required:true},
		index:{type:Number, required:true},
		star:{type:Number, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	deals:[{
		_id:false,
		id:{type:String, required:true},
		isSold:{type:Boolean, required:true},
		itemData:{
			type:{type:String, required:true},
			name:{type:String, required:true},
			count:{type:Number, required:true},
			price:{type:Number, required:true}
		}
	}],
	items:[{
		_id:false,
		name:{type:String, required:true},
		count:{type:Number, required:true}
	}],
	itemEvents:[{
		_id:false,
		id:{type:String, required:true},
		type:{type:String, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true}
	}],
	pve:[{
		_id:false,
		sections:[Number],
		rewarded:[Number]
	}],
	pveFights:[{
		_id:false,
		sectionName:{type:String, required:true},
		count:{type:Number, required:true}
	}],
	dailyTasks:[Number],
	growUpTasks:{
		cityBuild:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			name:{type:String, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		dragonLevel:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			type:{type:String, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		dragonStar:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			type:{type:String, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		dragonSkill:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			type:{type:String, required:true},
			name:{type:String, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		productionTech:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			name:{type:String, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		militaryTech:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			name:{type:String, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		soldierStar:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			name:{type:String, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		soldierCount:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			name:{type:String, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		pveCount:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		attackWin:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		strikeWin:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		playerKill:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			rewarded:{type:Boolean, required:true}
		}],
		playerPower:[{
			_id:false,
			id:{type:Number, required:true},
			index:{type:Number, required:true},
			rewarded:{type:Boolean, required:true}
		}]
	},
	iapGifts:[{
		_id:false,
		id:{type:String, required:true},
		from:{type:String, required:true},
		name:{type:String, required:true},
		count:{type:Number, required:true},
		time:{type:Number, required:true}
	}],
	defenceTroop:{
		type:{
			dragonType:{type:String, required:true},
			soldiers:[{
				_id:false,
				name:{type:String, required:true},
				count:{type:Number, required:true}
			}]
		},
		required:false
	},
	troopsOut:[{
		_id:false,
		dragonType:{type:String, required:true},
		soldiers:[{
			_id:false,
			name:{type:String, required:true},
			count:{type:Number, required:true}
		}]
	}],
	activities:{
		gacha:createActivitySchema('gacha'),
		collectResource:createActivitySchema('collectResource'),
		pveFight:createActivitySchema('pveFight'),
		attackMonster:createActivitySchema('attackMonster'),
		collectHeroBlood:createActivitySchema('collectHeroBlood'),
		recruitSoldiers:createActivitySchema('recruitSoldiers')
	},
	allianceActivities:{
		gacha:createAllianceActivitySchema('gacha'),
		collectResource:createAllianceActivitySchema('collectResource'),
		pveFight:createAllianceActivitySchema('pveFight'),
		attackMonster:createAllianceActivitySchema('attackMonster'),
		collectHeroBlood:createAllianceActivitySchema('collectHeroBlood'),
		recruitSoldiers:createAllianceActivitySchema('recruitSoldiers')
	},
	blocked:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		icon:{type:Number, required:true}
	}]
});

module.exports = mongoose.model('player', PlayerSchema);