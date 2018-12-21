"use strict";

/**
 * Created by modun on 14-7-29.
 */

var _ = require("underscore");

module.exports = function(app){
	return new RankRemote(app);
};

var RankRemote = function(app){
	this.app = app;
	this.logService = app.get('logService');
	this.rankService = app.get('rankService');
};
var pro = RankRemote.prototype;

/**
 * 刷新活动排行榜
 * @param cacheServerId
 * @param activities
 * @param callback
 */
pro.refreshActivities = function(cacheServerId, activities, callback){
	this.rankService.refreshActivities(cacheServerId, activities);
	callback();
};

/**
 * 刷新联盟活动排行榜
 * @param cacheServerId
 * @param activities
 * @param callback
 */
pro.refreshAllianceActivities = function(cacheServerId, activities, callback){
	this.rankService.refreshAllianceActivities(cacheServerId, activities);
	callback();
};


/**
 * 获取玩家个人活动排名信息
 * @param cacheServerId
 * @param playerId
 * @param rankType
 * @param callback
 * @returns {*}
 */
pro.getPlayerRank = function(cacheServerId, playerId, rankType, callback){
	var myRank = this.rankService.getPlayerRank(cacheServerId, playerId, rankType);
	callback(null, myRank);
};

/**
 * 获取联盟活动排名信息
 * @param cacheServerId
 * @param allianceId
 * @param rankType
 * @param callback
 * @returns {*}
 */
pro.getAllianceRank = function(cacheServerId, allianceId, rankType, callback){
	var myRank = this.rankService.getAllianceRank(cacheServerId, allianceId, rankType);
	callback(null, myRank);
};