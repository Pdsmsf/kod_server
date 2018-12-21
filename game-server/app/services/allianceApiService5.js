"use strict"

/**
 * Created by modun on 14/12/10.
 */

var Promise = require("bluebird")
var ShortId = require("shortid")
var _ = require("underscore")

var Utils = require("../utils/utils")
var DataUtils = require("../utils/dataUtils")
var LogicUtils = require("../utils/logicUtils")
var ReportUtils = require('../utils/reportUtils')
var TaskUtils = require("../utils/taskUtils")
var ErrorUtils = require("../utils/errorUtils")
var Events = require("../consts/events")
var Consts = require("../consts/consts")
var Define = require("../consts/define")


var AllianceApiService5 = function(app){
	this.app = app
	this.env = app.get("env")
	this.logService = app.get('logService');
	this.pushService = app.get("pushService")
	this.timeEventService = app.get("timeEventService")
	this.dataService = app.get("dataService")
	this.cacheService = app.get('cacheService');
	this.activityService = app.get('activityService');
	this.rankServerId = app.get('rankServerId');
	this.cacheServerId = app.getServerId();
}
module.exports = AllianceApiService5
var pro = AllianceApiService5.prototype
//
///**
// * 为联盟成员添加荣耀值
// * @param playerId
// * @param allianceId
// * @param memberId
// * @param count
// * @param callback
// */
//pro.giveLoyaltyToAllianceMember = function(playerId, allianceId, memberId, count, callback){
//	var self = this
//	var memberDoc = null
//	var memberData = []
//	var memberObject = null
//	var allianceDoc = null
//	var allianceData = []
//	var lockPairs = [];
//	var pushFuncs = []
//	var eventFuncs = []
//	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
//		allianceDoc = doc
//		return self.cacheService.findPlayerAsync(memberId)
//	}).then(function(doc){
//		memberDoc = doc
//		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
//		if(!playerObject) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
//		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "giveLoyaltyToAllianceMember")){
//			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "giveLoyaltyToAllianceMember"))
//		}
//		if(allianceDoc.basicInfo.honour - count < 0) return Promise.reject(ErrorUtils.allianceHonourNotEnough(playerId, allianceDoc._id))
//		memberObject = LogicUtils.getObjectById(allianceDoc.members, memberId)
//		if(!_.isObject(memberObject)) return Promise.reject(ErrorUtils.allianceDoNotHasThisMember(playerId, allianceDoc._id, memberId))
//
//		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
//		lockPairs.push({key:Consts.Pairs.Player, value:memberDoc._id});
//	}).then(function(){
//		memberDoc.allianceData.loyalty += count
//		memberData.push(["allianceData.loyalty", memberDoc.allianceData.loyalty])
//		allianceDoc.basicInfo.honour -= count
//		allianceData.push(["basicInfo.honour", allianceDoc.basicInfo.honour])
//		memberObject.loyalty = memberDoc.allianceData.loyalty
//		allianceData.push(["members." + allianceDoc.members.indexOf(memberObject) + ".loyalty", memberObject.loyalty])
//		memberObject.lastRewardData = {
//			count:count,
//			time:Date.now()
//		}
//		allianceData.push(["members." + allianceDoc.members.indexOf(memberObject) + ".lastRewardData", memberObject.lastRewardData])
//
//		pushFuncs.push([self.pushService, self.pushService.onPlayerDataChangedAsync, memberDoc, memberData])
//		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData])
//	}).then(function(){
//		return self.cacheService.touchAllAsync(lockPairs);
//	}).then(function(){
//		return LogicUtils.excuteAll(eventFuncs)
//	}).then(function(){
//		return LogicUtils.excuteAll(pushFuncs)
//	}).then(function(){
//		callback()
//	}).then(
//		function(){
//			var allianceName = allianceDoc.basicInfo.name
//			allianceDoc = null
//			memberDoc = null
//			var titleKey = DataUtils.getLocalizationConfig("alliance", "giveLoyaltyToAllianceMemberTitle")
//			var contentKey = DataUtils.getLocalizationConfig("alliance", "giveLoyaltyToAllianceMemberContent")
//			self.dataService.sendSysMailAsync(memberId, titleKey, [], contentKey, [allianceName, count], [])
//		},
//		function(e){
//			callback(e)
//		}
//	)
//}

/**
 * 获取联盟圣地战历史记录
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.getShrineReports = function(playerId, allianceId, callback){
	var allianceDoc = null
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!_.isObject(playerObject)) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))

		callback(null, allianceDoc.shrineReports)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取联盟战历史记录
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.getAllianceFightReports = function(playerId, allianceId, callback){
	var allianceDoc = null
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!_.isObject(playerObject)) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))

		callback(null, allianceDoc.allianceFightReports)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取联盟商店买入卖出记录
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.getItemLogs = function(playerId, allianceId, callback){
	var allianceDoc = null
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!_.isObject(playerObject)) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))

		callback(null, allianceDoc.itemLogs)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 移动联盟
 * @param playerId
 * @param allianceId
 * @param targetMapIndex
 * @param callback
 */
pro.moveAlliance = function(playerId, allianceId, targetMapIndex, callback){
	var self = this;
	var allianceDoc = null;
	var allianceData = [];
	var playerObject = null;
	var allianceRound = null;
	var targetAllianceRound = null;
	var lockPairs = [];
	var eventFuncs = [];
	var pushFuncs = [];
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc;
		playerObject = LogicUtils.getObjectById(allianceDoc.members, playerId)
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "moveAlliance")){
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(playerId, allianceId, "moveAlliance"))
		}
		if(allianceDoc.basicInfo.allianceMoveTime + (DataUtils.getAllianceIntInit('allianceMoveColdMinutes') * 60 * 1000) > Date.now()){
			return Promise.reject(ErrorUtils.canNotMoveAllianceRightNow(playerId, allianceId));
		}
		if(!!allianceDoc.allianceFight){
			return Promise.reject(ErrorUtils.allianceInFightStatus(playerId, allianceId));
		}
		if(allianceDoc.mapIndex === targetMapIndex){
			return Promise.reject(ErrorUtils.canNotMoveToTargetMapIndex(playerId, allianceId, targetMapIndex));
		}
		targetAllianceRound = LogicUtils.getAllianceMapRound({mapIndex:targetMapIndex});
		if(!DataUtils.isAllianceMoveLegal(allianceDoc, targetAllianceRound)){
			return Promise.reject(ErrorUtils.alliancePalaceLevelTooLowCanNotMoveAlliance(playerId, allianceId));
		}
		if(!!self.cacheService.getMapDataAtIndex(targetMapIndex).allianceData){
			return Promise.reject(ErrorUtils.canNotMoveToTargetMapIndex(playerId, allianceId, targetMapIndex));
		}
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		allianceRound = LogicUtils.getAllianceMapRound(allianceDoc);
		pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, allianceDoc.mapIndex, null])
		allianceDoc.mapIndex = targetMapIndex;
		allianceData.push(['mapIndex', allianceDoc.mapIndex]);
		pushFuncs.push([self.cacheService, self.cacheService.updateMapAllianceAsync, allianceDoc.mapIndex, allianceDoc])
		allianceDoc.basicInfo.allianceMoveTime = Date.now();
		allianceData.push(['basicInfo.allianceMoveTime', allianceDoc.basicInfo.allianceMoveTime]);

		LogicUtils.AddAllianceEvent(allianceDoc, allianceData, Consts.AllianceEventCategory.Important, Consts.AllianceEventType.MoveAlliance, playerObject.name, []);
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData]);
		pushFuncs.push([self.dataService, self.dataService.updateAllianceEventsLocationAsync, allianceDoc._id]);
		pushFuncs.push([self.dataService, self.dataService.updateEnemyVillageEventsAsync, allianceDoc._id]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).then(
		function(){
			var members = allianceDoc.members;
			allianceDoc = null;
			var titleKey = DataUtils.getLocalizationConfig("alliance", "AllianceMovedTitle");
			var contentKey = DataUtils.getLocalizationConfig("alliance", "AllianceMovedContent");
			var playerIds = [];
			_.each(members, function(member){
				playerIds.push(member.id);
			});
			(function sendMail(){
				if(playerIds.length === 0) return;
				var playerId = playerIds.pop();
				self.dataService.sendSysMailAsync(playerId, titleKey, [], contentKey, [allianceRound + 1, targetAllianceRound + 1], []).then(function(){
					sendMail();
				})
			})();
		},
		function(e){
			callback(e)
		}
	)
}

/**
 * 进入被观察地块
 * @param logicServerId
 * @param playerId
 * @param allianceId
 * @param mapIndex
 * @param callback
 */
pro.enterMapIndex = function(logicServerId, playerId, allianceId, mapIndex, callback){
	var mapIndexData = this.cacheService.getMapDataAtIndex(mapIndex);
	if(!!mapIndexData.allianceData && mapIndexData.allianceData.id === allianceId){
		return callback(ErrorUtils.canNotViewYourOwnAlliance(playerId, allianceId));
	}
	this.cacheService.enterMapIndexChannelAsync(playerId, logicServerId, mapIndex).then(function(data){
		callback(null, [data.allianceData, data.mapData]);
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 玩家离开被观察的地块
 * @param logicServerId
 * @param playerId
 * @param callback
 */
pro.leaveMapIndex = function(logicServerId, playerId, callback){
	this.cacheService.leaveMapIndexChannelAsync(playerId, logicServerId).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 在大地图中获取联盟基础信息
 * @param playerId
 * @param mapIndexs
 * @param callback
 */
pro.getMapAllianceDatas = function(playerId, mapIndexs, callback){
	var self = this;
	var datas = {};
	_.each(mapIndexs, function(mapIndex){
		var data = self.cacheService.getMapDataAtIndex(mapIndex).allianceData;
		if(!!data){
			datas[mapIndex] = self.cacheService.getMapDataAtIndex(mapIndex).allianceData;
		}
	});

	callback(null, datas);
}

/**
 * 获取联盟活动信息
 * @param callback
 */
pro.getAllianceActivities = function(callback){
	callback(null, this.activityService.allianceActivities);
}

/**
 * 获取联盟活动积分奖励
 * @param playerId
 * @param allianceId
 * @param activityType
 * @param callback
 */
pro.getAllianceActivityScoreRewards = function(playerId, allianceId, activityType, callback){
	var self = this
	var playerDoc = null;
	var playerData = [];
	var allianceDoc = null;
	var updateFuncs = [];
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		if(!playerDoc.allianceId) {
			return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		}
		return self.cacheService.findAllianceAsync(allianceId);
	}).then(function(doc){
		allianceDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var allianceActivity = allianceDoc.activities[activityType];
		if(!DataUtils.isAllianceActivityValid(allianceActivity, self.activityService.allianceActivities)){
			return Promise.reject(ErrorUtils.invalidAllianceActivity(allianceId, allianceActivity));
		}
		var activityInPlayer = playerDoc.allianceActivities[activityType];
		if(activityInPlayer.finishTime !== allianceActivity.finishTime){
			activityInPlayer.scoreRewardedIndex = 0;
			activityInPlayer.rankRewardsGeted = false;
			activityInPlayer.finishTime = allianceActivity.finishTime;
		}
		var nextRewardIndex = activityInPlayer.scoreRewardedIndex + 1;
		var scoreNeed = DataUtils.getAllianceActivityScoreByIndex(activityType, nextRewardIndex);
		if(_.isUndefined(scoreNeed) || allianceActivity.score < scoreNeed){
			return Promise.reject(ErrorUtils.noAvailableRewardsCanGet(playerId, activityInPlayer));
		}
		var items = DataUtils.getAllianceActivityScoreRewards(activityType, nextRewardIndex);
		activityInPlayer.scoreRewardedIndex = nextRewardIndex;
		playerData.push(["allianceActivities." + activityType, activityInPlayer]);
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getAllianceActivityScoreRewards', {activityType:activityType}, items])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取联盟活动排名奖励
 * @param playerId
 * @param allianceId
 * @param activityType
 * @param callback
 */
pro.getAllianceActivityRankRewards = function(playerId, allianceId, activityType, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null;
	var updateFuncs = [];
	var lockPairs = [];
	var myRank = null;
	Promise.fromCallback(function(_callback){
		self.app.rpc.rank.rankRemote.getAllianceRank.toServer(self.rankServerId, self.cacheServerId, allianceId, activityType, _callback)
	}).then(function(resp){
		myRank = resp;
		return self.cacheService.findPlayerAsync(playerId)
	}).then(function(doc){
		playerDoc = doc;
		if(!playerDoc.allianceId) {
			return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId));
		}
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var allianceActivity = allianceDoc.activities[activityType];
		if(!DataUtils.isAllianceExpiredActivityValid(allianceActivity, self.activityService.allianceActivities)){
			return Promise.reject(ErrorUtils.invalidAllianceActivity(allianceId, allianceActivity));
		}
		var activityInPlayer = playerDoc.allianceActivities[activityType];
		if(activityInPlayer.finishTime !== allianceActivity.finishTime){
			activityInPlayer.scoreRewardedIndex = 0;
			activityInPlayer.rankRewardsGeted = false;
			activityInPlayer.finishTime = allianceActivity.finishTime;
		}
		if(!myRank){
			return Promise.reject(ErrorUtils.noAvailableRewardsCanGet(playerId, activityInPlayer));
		}
		if(activityInPlayer.rankRewardsGeted){
			return Promise.reject(ErrorUtils.noAvailableRewardsCanGet(playerId, activityInPlayer));
		}
		var items = DataUtils.getAllianceActivityRankRewards(activityType, myRank);
		activityInPlayer.rankRewardsGeted = true;
		playerData.push(["allianceActivities." + activityType, activityInPlayer]);
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getAllianceActivityRankRewards', {
			activityType:activityType,
			myRank:myRank
		}, items])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}