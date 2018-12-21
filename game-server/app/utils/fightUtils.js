"use strict"

/**
 * Created by modun on 14/10/31.
 */

var _ = require('underscore')
var DataUtils = require("./dataUtils")
var LogicUtils = require("./logicUtils")
var CommonUtils = require("./utils")
var Consts = require("../consts/consts")

var Utils = module.exports

var FireDragonSkill = function(dragonAfterFight, affectSoldiers){
	_.each(affectSoldiers, function(soldier){
		soldier.effect = 0;
	})
	var dragonSkilled = [];
	if(!dragonAfterFight || dragonAfterFight.currentHp <= 0) return dragonSkilled;
	var effect = null;
	if(dragonAfterFight.type === 'redDragon'){
		effect = DataUtils.getDragonSkillBuff(dragonAfterFight, 'hellFire');
		if(effect === 0) return dragonSkilled;
		//var sortedAffectedSoldiers = _.sortBy(affectSoldiers, function(soldier){
		//	return -soldier.power;
		//})
		//var soldier = sortedAffectedSoldiers[0];
		//soldier.effect = effect;
		//dragonSkilled.push(affectSoldiers.indexOf(soldier));
		affectSoldiers[0].effect = effect;
		dragonSkilled.push(0);
		return dragonSkilled;
	}else if(dragonAfterFight.type === 'blueDragon'){
		effect = DataUtils.getDragonSkillBuff(dragonAfterFight, 'lightningStorm');
		if(effect === 0) return dragonSkilled;
		var soldiers = _.sample(affectSoldiers, 3);
		_.each(soldiers, function(soldier){
			soldier.effect = effect;
			dragonSkilled.push(affectSoldiers.indexOf(soldier));
		})
		return dragonSkilled;
	}else if(dragonAfterFight.type === 'greenDragon'){
		effect = DataUtils.getDragonSkillBuff(dragonAfterFight, 'poisonNova');
		if(effect === 0) return dragonSkilled;
		_.each(affectSoldiers, function(soldier){
			soldier.effect = effect;
			dragonSkilled.push(affectSoldiers.indexOf(soldier));
		})
		return dragonSkilled;
	}
}

/**
 * 军队战斗
 * @param attackDragonAfterFight
 * @param attackSoldiers
 * @param attackWoundedSoldierPercent
 * @param defenceDragonAfterFight
 * @param defenceSoldiers
 * @param defenceWoundedSoldierPercent
 * @returns {*}
 */
Utils.soldierToSoldierFight = function(attackDragonAfterFight, attackSoldiers, attackWoundedSoldierPercent, defenceDragonAfterFight, defenceSoldiers, defenceWoundedSoldierPercent){
	if(attackWoundedSoldierPercent > 1) attackWoundedSoldierPercent = 1;
	if(defenceWoundedSoldierPercent > 1) defenceWoundedSoldierPercent = 1;
	if(attackWoundedSoldierPercent < 0) attackWoundedSoldierPercent = 0;
	if(defenceWoundedSoldierPercent < 0) defenceWoundedSoldierPercent = 0;
	var attackSuccessSoldiers = [];
	var attackFailedSoldiers = [];
	var defenceSuccessSoldiers = [];
	var defenceFailedSoldiers = [];

	attackSoldiers = CommonUtils.clone(attackSoldiers)
	defenceSoldiers = CommonUtils.clone(defenceSoldiers)
	var roundDatas = []
	var roundData = null;
	while(attackSoldiers.length > 0 && defenceSoldiers.length > 0){
		if(!roundData){
			roundData = {
				attackResults:[],
				defenceResults:[],
				attackDragonSkilled:null,
				defenceDragonSkilled:null
			}
			roundDatas.push(roundData);
			roundData.attackDragonSkilled = FireDragonSkill(attackDragonAfterFight, defenceSoldiers);
			roundData.defenceDragonSkilled = FireDragonSkill(defenceDragonAfterFight, attackSoldiers);
		}
		var attackSoldier = attackSoldiers[0]
		var defenceSoldier = defenceSoldiers[0]
		var attackSoldierType = attackSoldier.type
		var defenceSoldierType = defenceSoldier.type
		var attackTotalPower = attackSoldier.attackPower[defenceSoldierType] * attackSoldier.currentCount * (1 - attackSoldier.effect)
		var defenceTotalPower = defenceSoldier.attackPower[attackSoldierType] * defenceSoldier.currentCount * (1 - defenceSoldier.effect)
		var attackDamagedSoldierCount = null
		var defenceDamagedSoldierCount = null
		if(attackTotalPower >= defenceTotalPower){
			attackDamagedSoldierCount = Math.ceil(defenceTotalPower * 0.3 / attackSoldier.hp)
			defenceDamagedSoldierCount = Math.ceil(Math.sqrt(attackTotalPower * defenceTotalPower) * 0.3 / defenceSoldier.hp)
		}else{
			attackDamagedSoldierCount = Math.ceil(Math.sqrt(attackTotalPower * defenceTotalPower) * 0.3 / attackSoldier.hp)
			defenceDamagedSoldierCount = Math.ceil(attackTotalPower * 0.3 / defenceSoldier.hp)
		}
		if(attackDamagedSoldierCount > attackSoldier.currentCount) attackDamagedSoldierCount = attackSoldier.currentCount
		if(defenceDamagedSoldierCount > defenceSoldier.currentCount) defenceDamagedSoldierCount = defenceSoldier.currentCount

		var attackWoundedSoldierCount = Math.floor(attackDamagedSoldierCount * attackWoundedSoldierPercent)
		var defenceWoundedSoldierCount = Math.floor(defenceDamagedSoldierCount * defenceWoundedSoldierPercent)

		roundData.attackResults.push({
			soldierName:attackSoldier.name,
			soldierStar:attackSoldier.star,
			soldierCount:attackSoldier.currentCount,
			soldierDamagedCount:attackDamagedSoldierCount,
			soldierWoundedCount:attackWoundedSoldierCount,
			isWin:attackTotalPower >= defenceTotalPower
		})
		roundData.defenceResults.push({
			soldierName:defenceSoldier.name,
			soldierStar:defenceSoldier.star,
			soldierCount:defenceSoldier.currentCount,
			soldierDamagedCount:defenceDamagedSoldierCount,
			soldierWoundedCount:defenceWoundedSoldierCount,
			isWin:attackTotalPower < defenceTotalPower
		})
		attackSoldier.round += 1
		attackSoldier.currentCount -= attackDamagedSoldierCount
		attackSoldier.woundedCount += attackWoundedSoldierCount
		attackSoldier.killedSoldiers.push({
			name:defenceSoldier.name,
			star:defenceSoldier.star,
			count:defenceDamagedSoldierCount
		})
		defenceSoldier.round += 1
		defenceSoldier.currentCount -= defenceDamagedSoldierCount
		defenceSoldier.woundedCount += defenceWoundedSoldierCount
		defenceSoldier.killedSoldiers.push({
			name:attackSoldier.name,
			star:attackSoldier.star,
			count:attackDamagedSoldierCount
		})
		LogicUtils.removeItemInArray(attackSoldiers, attackSoldier)
		LogicUtils.removeItemInArray(defenceSoldiers, defenceSoldier)
		if(attackTotalPower >= defenceTotalPower){
			attackSuccessSoldiers.push(attackSoldier);
			defenceFailedSoldiers.push(defenceSoldier);
		}else{
			attackFailedSoldiers.push(attackSoldier);
			defenceSuccessSoldiers.push(defenceSoldier);
		}

		if((attackSoldiers.length === 0 && attackSuccessSoldiers.length > 0) || (defenceSoldiers.length === 0 && defenceSuccessSoldiers.length > 0)){
			attackSoldiers = attackSuccessSoldiers.concat(attackSoldiers);
			defenceSoldiers = defenceSuccessSoldiers.concat(defenceSoldiers);
			attackSuccessSoldiers.length = 0;
			defenceSuccessSoldiers.length = 0;
			roundData = null;
		}
	}
	attackSoldiers = attackSuccessSoldiers.concat(attackSoldiers);
	defenceSoldiers = defenceSuccessSoldiers.concat(defenceSoldiers);
	var attackSoldiersAfterFight = attackSoldiers.concat(attackFailedSoldiers);
	attackSoldiersAfterFight = _.sortBy(attackSoldiersAfterFight, function(soldier){
		return soldier.position;
	})
	var defenceSoldiersAfterFight = defenceSoldiers.concat(defenceFailedSoldiers);
	defenceSoldiersAfterFight = _.sortBy(defenceSoldiersAfterFight, function(soldier){
		return soldier.position;
	})
	var fightResult = null
	if(attackSoldiers.length > 0)
		fightResult = Consts.FightResult.AttackWin;
	else
		fightResult = Consts.FightResult.DefenceWin;

	var response = {
		fightResult:fightResult,
		roundDatas:roundDatas,
		attackSuccessSoldiers:attackSoldiers,
		attackSoldiersAfterFight:attackSoldiersAfterFight,
		defenceSuccessSoldiers:defenceSoldiers,
		defenceSoldiersAfterFight:defenceSoldiersAfterFight
	}
	return response
}

/**
 * 龙战斗
 * @param attackDragon
 * @param defenceDragon
 * @param effect
 * @returns {*}
 */
Utils.dragonToDragonFight = function(attackDragon, defenceDragon, effect){
	attackDragon = CommonUtils.clone(attackDragon)
	defenceDragon = CommonUtils.clone(defenceDragon)

	var attackDragonStrength = attackDragon.strength
	var defenceDragonStrength = defenceDragon.strength
	var attackDragonEffect = effect.attackDragonEffect;
	var defenceDragonEffect = effect.defenceDragonEffect;
	var attackDragonHpDecreased = null
	var defenceDragonHpDecreased = null
	if(attackDragonStrength >= defenceDragonStrength){
		attackDragonHpDecreased = Math.ceil(defenceDragonStrength * 0.5 * attackDragonEffect);
		defenceDragonHpDecreased = Math.ceil(Math.sqrt(attackDragonStrength * defenceDragonStrength) * 0.5 * defenceDragonEffect);
	}else{
		attackDragonHpDecreased = Math.ceil(Math.sqrt(attackDragonStrength * defenceDragonStrength) * 0.5 * attackDragonEffect);
		defenceDragonHpDecreased = Math.ceil(attackDragonStrength * 0.5 * defenceDragonEffect);
	}
	attackDragon.currentHp = attackDragonHpDecreased > attackDragon.currentHp ? 0 : attackDragon.currentHp - attackDragonHpDecreased
	defenceDragon.currentHp = defenceDragonHpDecreased > defenceDragon.currentHp ? 0 : defenceDragon.currentHp - defenceDragonHpDecreased
	attackDragon.isWin = attackDragonStrength >= defenceDragonStrength
	defenceDragon.isWin = attackDragonStrength < defenceDragonStrength

	var response = {
		powerCompare:attackDragonStrength / defenceDragonStrength,
		attackDragonHpDecreased:attackDragon.totalHp - attackDragon.currentHp,
		defenceDragonHpDecreased:defenceDragon.totalHp - defenceDragon.currentHp,
		fightResult:attackDragonStrength >= defenceDragonStrength ? Consts.FightResult.AttackWin : Consts.FightResult.DefenceWin,
		attackDragonAfterFight:attackDragon,
		defenceDragonAfterFight:defenceDragon
	}
	return response
}

/**
 * 士兵和城墙的战斗
 * @param attackSoldiers
 * @param defenceWall
 * @returns {*}
 */
Utils.soldierToWallFight = function(attackSoldiers, defenceWall){
	attackSoldiers = CommonUtils.clone(attackSoldiers)
	defenceWall = CommonUtils.clone(defenceWall)
	var attackSoldiersAfterFight = []
	var attackResults = []
	var defenceResults = []
	while(attackSoldiers.length > 0 && defenceWall.currentHp > 0){
		var attackSoldier = attackSoldiers[0]
		var attackSoldierType = attackSoldier.type
		var defenceSoldierType = "wall"
		var attackTotalPower = attackSoldier.attackPower[defenceSoldierType] * attackSoldier.currentCount
		var defenceTotalPower = defenceWall.attackPower[attackSoldierType] * defenceWall.currentHp
		var attackDamagedSoldierCount = null
		var defenceDamagedHp = null
		if(attackTotalPower >= defenceTotalPower){
			attackDamagedSoldierCount = Math.ceil(defenceTotalPower * 0.3 / attackSoldier.hp)
			defenceDamagedHp = Math.ceil(Math.sqrt(attackTotalPower * defenceTotalPower) * 0.3 / defenceWall.defencePower)
		}else{
			attackDamagedSoldierCount = Math.ceil(Math.sqrt(attackTotalPower * defenceTotalPower) * 0.3 / attackSoldier.hp)
			defenceDamagedHp = Math.ceil(attackTotalPower * 0.3 / defenceWall.defencePower)
		}
		if(attackDamagedSoldierCount > attackSoldier.currentCount) attackDamagedSoldierCount = attackSoldier.currentCount
		if(defenceDamagedHp > defenceWall.currentHp) defenceDamagedHp = defenceWall.currentHp

		attackResults.push({
			soldierName:attackSoldier.name,
			soldierStar:attackSoldier.star,
			soldierCount:attackSoldier.currentCount,
			soldierDamagedCount:attackDamagedSoldierCount,
			soldierWoundedCount:0,
			isWin:defenceWall.currentHp - defenceDamagedHp <= 0
		})
		defenceResults.push({
			wallMaxHp:defenceWall.maxHp,
			wallHp:defenceWall.currentHp,
			wallDamagedHp:defenceDamagedHp,
			isWin:defenceWall.currentHp - defenceDamagedHp > 0
		})
		attackSoldier.round += 1
		attackSoldier.currentCount -= attackDamagedSoldierCount
		attackSoldier.damagedCount += attackDamagedSoldierCount
		attackSoldier.woundedCount += 0
		defenceWall.round += 1
		defenceWall.currentHp -= defenceDamagedHp
		defenceWall.killedSoldiers.push({
			name:attackSoldier.name,
			star:attackSoldier.star,
			count:attackDamagedSoldierCount
		})

		LogicUtils.removeItemInArray(attackSoldiers, attackSoldier)
		attackSoldiersAfterFight.push(attackSoldier)
	}
	attackSoldiersAfterFight = attackSoldiersAfterFight.concat(attackSoldiers)
	var fightResult = null
	if(defenceWall.currentHp <= 0){
		fightResult = Consts.FightResult.AttackWin
	}else{
		fightResult = Consts.FightResult.DefenceWin
	}

	var response = {
		attackRoundDatas:attackResults,
		defenceRoundDatas:defenceResults,
		fightResult:fightResult,
		attackSoldiersAfterFight:attackSoldiersAfterFight,
		defenceWallAfterFight:defenceWall
	}
	return response
}