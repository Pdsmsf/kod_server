"use strict";

/**
 * Created by modun on 14-7-29.
 */

var _ = require("underscore");
var Consts = require("../../../consts/consts");
var ErrorUtils = require("../../../utils/errorUtils");
var DataUtils = require("../../../utils/dataUtils");

var GameDatas = require("../../../datas/GameDatas");

module.exports = function(app){
	return new RankHandler(app);
};

var RankHandler = function(app){
	this.app = app;
	this.logService = app.get("logService");
	this.rankService = app.get("rankService");
};

var pro = RankHandler.prototype;

/**
 * 获取玩家排名信息
 * @param msg
 * @param session
 * @param next
 */
pro.getPlayerRankList = function(msg, session, next){
	var rankType = msg.rankType;
	var fromRank = msg.fromRank;
	var e = null;
	if(!_.contains(Consts.RankTypes, rankType)){
		e = new Error("rankType 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	if(!_.isNumber(fromRank) || fromRank % 1 !== 0 || fromRank < 0 || fromRank > 480){
		e = new Error("fromRank 不合法");
		return next(e, ErrorUtils.getError(e));
	}

	var resp = this.rankService.getPlayerRankList(session.get('cacheServerId'), session.uid, rankType, fromRank);
	next(null, {code:200, myData:resp[0], datas:resp[1]});
};

/**
 * 获取联盟排名信息
 * @param msg
 * @param session
 * @param next
 */
pro.getAllianceRankList = function(msg, session, next){
	var allianceId = session.get('allianceId');
	var rankType = msg.rankType;
	var fromRank = msg.fromRank;
	var e = null;
	if(!_.contains(Consts.RankTypes, rankType)){
		e = new Error("rankType 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	if(!_.isNumber(fromRank) || fromRank % 1 !== 0 || fromRank < 0 || fromRank > 80){
		e = new Error("fromRank 不合法");
		return next(e, ErrorUtils.getError(e));
	}

	var resp = this.rankService.getAllianceRankList(session.get('cacheServerId'), allianceId, rankType, fromRank);
	next(null, {code:200, myData:resp[0], datas:resp[1]});
};

/**
 * 获取玩家活动排名信息列表
 * @param msg
 * @param session
 * @param next
 */
pro.getPlayerActivityRankList = function(msg, session, next){
	var rankType = msg.rankType;
	var fromRank = msg.fromRank;
	var e = null;
	if(!_.contains(DataUtils.getActivityTypes(), rankType)){
		e = new Error("rankType 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	if(!_.isNumber(fromRank) || fromRank % 1 !== 0 || fromRank < 0 || fromRank > 80){
		e = new Error("fromRank 不合法");
		return next(e, ErrorUtils.getError(e));
	}

	var resp = this.rankService.getPlayerActivityRankList(session.get('cacheServerId'), session.uid, rankType, fromRank);
	next(null, {code:200, myData:resp[0], datas:resp[1]});
};

/**
 * 获取联盟活动排名信息列表
 * @param msg
 * @param session
 * @param next
 */
pro.getAllianceActivityRankList = function(msg, session, next){
	var rankType = msg.rankType;
	var fromRank = msg.fromRank;
	var allianceId = session.get('allianceId');
	var e = null;
	if(!_.contains(DataUtils.getActivityTypes(), rankType)){
		e = new Error("rankType 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	if(!_.isNumber(fromRank) || fromRank % 1 !== 0 || fromRank < 0 || fromRank > 80){
		e = new Error("fromRank 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	if(_.isEmpty(allianceId)){
		e = ErrorUtils.playerNotJoinAlliance(session.uid);
		return next(e, ErrorUtils.getError(e));
	}

	var resp = this.rankService.getAllianceActivityRankList(session.get('cacheServerId'), allianceId, rankType, fromRank);
	next(null, {code:200, myData:resp[0], datas:resp[1]});
};

/**
 * 获取玩家自身的活动排名
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.getPlayerRank = function(msg, session, next){
	var rankType = msg.rankType;
	if(!_.contains(DataUtils.getActivityTypes(), rankType)){
		var e = new Error("rankType 不合法");
		return next(e, ErrorUtils.getError(e));
	}

	var myRank = this.rankService.getPlayerRank(session.get('cacheServerId'), session.uid, rankType);
	next(null, {code:200, myRank:myRank});
};

/**
 * 获取联盟自身的活动排名
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.getAllianceRank = function(msg, session, next){
	var rankType = msg.rankType;
	var allianceId = session.get('allianceId');
	var e = null;
	if(!_.contains(DataUtils.getActivityTypes(), rankType)){
		e = new Error("rankType 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	if(_.isEmpty(allianceId)){
		e = ErrorUtils.playerNotJoinAlliance(session.uid);
		return next(e, ErrorUtils.getError(e));
	}
	var myRank = this.rankService.getAllianceRank(session.get('cacheServerId'), allianceId, rankType);
	next(null, {code:200, myRank:myRank});
};