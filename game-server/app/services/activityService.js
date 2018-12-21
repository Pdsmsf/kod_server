"use strict";

/**
 * Created by modun on 15/3/19.
 */

var _ = require("underscore");
var Promise = require("bluebird");
var ShortId = require("shortid");

var LogicUtils = require('../utils/logicUtils');
var DataUtils = require('../utils/dataUtils');
var ErrorUtils = require('../utils/errorUtils');

var Consts = require("../consts/consts");
var Define = require("../consts/define");

var GameDatas = require("../datas/GameDatas");
var ScheduleActivities = GameDatas.ScheduleActivities;

var ActivityService = function(app){
	this.app = app;
	this.logService = app.get("logService");
	this.ServerState = app.get("ServerState");
	this.cacheServerId = app.getServerId();
	this.rankServerId = app.get('rankServerId');
	this.cacheService = app.get('cacheService');
	this.pushService = app.get('pushService');
	this.activities = {};
	this.allianceActivities = {};
	this.excuteRefreshActivityTimer = null;
	this.excuteRefreshAllianceActivityTimer = null;
	this.refreshActivityInterval = 10 * 61 * 1000;
	this.refreshActivityTimer = null;
	this.refreshAllianceActivityInterval = 10 * 59 * 1000;
	this.refreshAllianceActivityTimer = null;
};
module.exports = ActivityService;
var pro = ActivityService.prototype;

pro.init = function(callback){
	var self = this;
	var serverStateDoc = null;
	self.ServerState.findByIdAsync(self.cacheServerId).then(function(doc){
		serverStateDoc = doc;
	}).then(function(){
		self.activities = serverStateDoc.activities.toObject();
		return self.onActivityDataChangedAsync();
	}).then(function(){
		self.allianceActivities = serverStateDoc.allianceActivities.toObject();
		return self.onAllianceActivityDataChangedAsync();
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 活动状态改变回调
 * @param callback
 */
pro.onActivityDataChanged = function(callback){
	var self = this;
	for(var i = self.activities.next.length - 1; i >= 0; i--){
		var activity = self.activities.next[i];
		if(activity.startTime <= Date.now()){
			LogicUtils.removeItemInArray(self.activities.next, activity);
			var _activity = {
				type:activity.type,
				finishTime:activity.startTime + (ScheduleActivities.type[activity.type].existHours * 60 * 60 * 1000)
			};
			self.activities.on.push(_activity);
		}
	}
	for(var i = self.activities.on.length - 1; i >= 0; i--){
		var activity = self.activities.on[i];
		if(activity.finishTime <= Date.now()){
			LogicUtils.removeItemInArray(self.activities.on, activity);
			var _activity = {
				type:activity.type,
				removeTime:activity.finishTime + (ScheduleActivities.type[activity.type].expireHours * 60 * 60 * 1000)
			};
			self.activities.expired.push(_activity);
		}
	}
	for(var i = this.activities.expired.length - 1; i >= 0; i--){
		var activity = self.activities.expired[i];
		if(activity.removeTime <= Date.now()){
			LogicUtils.removeItemInArray(self.activities.expired, activity);
		}
	}

	var smallestTimout = null;
	_.each(self.activities.next, function(activity){
		if(smallestTimout === null || smallestTimout > activity.startTime){
			smallestTimout = activity.startTime;
		}
	});
	_.each(self.activities.on, function(activity){
		if(smallestTimout === null || smallestTimout > activity.finishTime){
			smallestTimout = activity.finishTime;
		}
	});
	_.each(self.activities.expired, function(activity){
		if(smallestTimout === null || smallestTimout > activity.removeTime){
			smallestTimout = activity.removeTime;
		}
	});
	self.ServerState.findByIdAndUpdateAsync(self.cacheServerId, {$set:{activities:self.activities}}).then(function(){
		if(!!smallestTimout){
			setTimeout(self.onActivityDataChangedAsync.bind(self), smallestTimout - Date.now());
		}
		self.refreshActivityRankData();
	}).then(function(){
		callback();
	});
};

/**
 * 联盟活动状态改变回调
 * @param callback
 */
pro.onAllianceActivityDataChanged = function(callback){
	var self = this;
	for(var i = self.allianceActivities.next.length - 1; i >= 0; i--){
		var activity = self.allianceActivities.next[i];
		if(activity.startTime <= Date.now()){
			LogicUtils.removeItemInArray(self.allianceActivities.next, activity);
			var _activity = {
				type:activity.type,
				finishTime:activity.startTime + (ScheduleActivities.allianceType[activity.type].existHours * 60 * 60 * 1000)
			};
			self.allianceActivities.on.push(_activity);
		}
	}
	for(var i = self.allianceActivities.on.length - 1; i >= 0; i--){
		var activity = self.allianceActivities.on[i];
		if(activity.finishTime <= Date.now()){
			LogicUtils.removeItemInArray(self.allianceActivities.on, activity);
			var _activity = {
				type:activity.type,
				removeTime:activity.finishTime + (ScheduleActivities.allianceType[activity.type].expireHours * 60 * 60 * 1000)
			};
			self.allianceActivities.expired.push(_activity);
		}
	}
	for(var i = this.allianceActivities.expired.length - 1; i >= 0; i--){
		var activity = self.allianceActivities.expired[i];
		if(activity.removeTime <= Date.now()){
			LogicUtils.removeItemInArray(self.allianceActivities.expired, activity);
		}
	}

	var smallestTimout = null;
	_.each(self.allianceActivities.next, function(activity){
		if(smallestTimout === null || smallestTimout > activity.startTime){
			smallestTimout = activity.startTime;
		}
	});
	_.each(self.allianceActivities.on, function(activity){
		if(smallestTimout === null || smallestTimout > activity.finishTime){
			smallestTimout = activity.finishTime;
		}
	});
	_.each(self.allianceActivities.expired, function(activity){
		if(smallestTimout === null || smallestTimout > activity.removeTime){
			smallestTimout = activity.removeTime;
		}
	});
	self.ServerState.findByIdAndUpdateAsync(self.cacheServerId, {$set:{allianceActivities:self.allianceActivities}}).then(function(){
		if(!!smallestTimout){
			setTimeout(self.onAllianceActivityDataChangedAsync.bind(self), smallestTimout - Date.now());
		}
		self.refreshAllianceActivityRankData();
	}).then(function(){
		callback();
	});
};

/**
 * 刷新活动排行榜数据
 */
pro.refreshActivityRankData = function(){
	var self = this;
	if(this.excuteRefreshActivityTimer){
		clearTimeout(this.excuteRefreshActivityTimer);
	}
	if(this.refreshActivityTimer){
		clearTimeout(this.refreshActivityTimer);
	}
	(function _excute(){
		if(!self.app.getServerById(self.rankServerId)){
			self.excuteRefreshActivityTimer = setTimeout(_excute, 2000);
			return;
		}
		self.excuteRefreshActivityTimer = null;
		self.app.rpc.rank.rankRemote.refreshActivities.toServer(self.rankServerId, self.cacheServerId, self.activities, function(e){
			if(!!e){
				self.logService.onError('cache.activityService.refreshActivityRankData', self.activities, e.stack);
			}
		});
		self.refreshActivityTimer = setTimeout(_excute, self.refreshActivityInterval);
	})();
};

/**
 * 刷新联盟活动排行榜数据
 */
pro.refreshAllianceActivityRankData = function(){
	var self = this;
	if(this.excuteRefreshAllianceActivityTimer){
		clearTimeout(this.excuteRefreshAllianceActivityTimer);
	}
	if(this.refreshAllianceActivityTimer){
		clearTimeout(this.refreshAllianceActivityTimer);
	}
	(function _excute(){
		if(!self.app.getServerById(self.rankServerId)){
			self.excuteRefreshAllianceActivityTimer = setTimeout(_excute, 2000);
			return;
		}
		self.excuteRefreshAllianceActivityTimer = null;
		self.app.rpc.rank.rankRemote.refreshAllianceActivities.toServer(self.rankServerId, self.cacheServerId, self.allianceActivities, function(e){
			if(!!e){
				self.logService.onError('cache.activityService.refreshAllianceActivityRankData', self.allianceActivities, e.stack);
			}
		});
		self.refreshAllianceActivityTimer = setTimeout(_excute, self.refreshAllianceActivityInterval);
	})();
};

/**
 * 创建活动
 * @param type
 * @param dateToStart
 * @param callback
 * @returns {*}
 */
pro.createActivity = function(type, dateToStart, callback){
	if(!_.contains(_.keys(ScheduleActivities.type), type)){
		return callback(new Error('活动类型不存在'));
	}
	var self = this;
	var activities = [].concat(self.activities.on).concat(self.activities.expired).concat(self.activities.next);
	var alreadyExist = _.some(activities, function(activity){
		return activity.type === type;
	});
	if(alreadyExist){
		return callback(new Error('活动已经存在'));
	}
	if(!LogicUtils.isValidDateString(dateToStart)){
		return callback(new Error('开始日期不合法'));
	}
	var startDate = LogicUtils.getDateTimeFromString(dateToStart);
	var todayDate = LogicUtils.getTodayDateTime();
	var finishDate = startDate + (ScheduleActivities.type[type].existHours * 60 * 60 * 1000);
	if(finishDate <= todayDate){
		return callback(new Error('开始日期不合法'));
	}
	if(finishDate < Date.now()){
		finishDate = Date.now() + (ScheduleActivities.type[type].existHours * 60 * 60 * 1000);
	}
	if(startDate <= todayDate){
		var onActivity = {
			type:type,
			finishTime:finishDate
		};
		self.activities.on.push(onActivity);
	}else{
		var nextActivity = {
			type:type,
			startTime:startDate
		};
		self.activities.next.push(nextActivity);
	}

	self.onActivityDataChangedAsync().then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 创建联盟活动
 * @param type
 * @param dateToStart
 * @param callback
 * @returns {*}
 */
pro.createAllianceActivity = function(type, dateToStart, callback){
	if(!_.contains(_.keys(ScheduleActivities.allianceType), type)){
		return callback(new Error('活动类型不存在'));
	}
	var self = this;
	var activities = [].concat(self.allianceActivities.on).concat(self.allianceActivities.expired).concat(self.allianceActivities.next);
	var alreadyExist = _.some(activities, function(activity){
		return activity.type === type;
	});
	if(alreadyExist){
		return callback(new Error('活动已经存在'));
	}
	if(!LogicUtils.isValidDateString(dateToStart)){
		return callback(new Error('开始日期不合法'));
	}
	var startDate = LogicUtils.getDateTimeFromString(dateToStart);
	var todayDate = LogicUtils.getTodayDateTime();
	var finishDate = startDate + (ScheduleActivities.allianceType[type].existHours * 60 * 60 * 1000);
	if(finishDate <= todayDate){
		return callback(new Error('开始日期不合法'));
	}
	if(finishDate < Date.now()){
		finishDate = Date.now() + (ScheduleActivities.allianceType[type].existHours * 60 * 60 * 1000);
	}
	if(startDate <= todayDate){
		var onActivity = {
			type:type,
			finishTime:finishDate
		};
		self.allianceActivities.on.push(onActivity);
	}else{
		var nextActivity = {
			type:type,
			startTime:startDate
		};
		self.allianceActivities.next.push(nextActivity);
	}

	self.onAllianceActivityDataChangedAsync().then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 删除活动
 * @param type
 * @param callback
 * @returns {*}
 */
pro.deleteActivity = function(type, callback){
	if(!_.contains(_.keys(ScheduleActivities.type), type)){
		return callback(new Error('活动类型不存在'));
	}
	var self = this;
	var activity = _.find(self.activities.on, function(activity){
		return activity.type === type;
	});
	Promise.fromCallback(function(_callback){
		activity = _.find(self.activities.next, function(activity){
			return activity.type === type;
		});
		if(activity){
			LogicUtils.removeItemInArray(self.activities.next, activity);
			return _callback();
		}
		activity = _.find(self.activities.on, function(activity){
			return activity.type === type;
		});
		if(activity){
			LogicUtils.removeItemInArray(self.activities.on, activity);
			return _callback();
		}
		activity = _.find(self.activities.expired, function(activity){
			return activity.type === type;
		});
		if(activity){
			LogicUtils.removeItemInArray(self.activities.expired, activity);
			return _callback();
		}
		_callback(new Error('活动不存在'));
	}).then(function(){
		return self.onActivityDataChangedAsync();
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 删除联盟活动
 * @param type
 * @param callback
 * @returns {*}
 */
pro.deleteAllianceActivity = function(type, callback){
	if(!_.contains(_.keys(ScheduleActivities.allianceType), type)){
		return callback(new Error('活动类型不存在'));
	}
	var self = this;
	var activity = _.find(self.allianceActivities.on, function(activity){
		return activity.type === type;
	});
	Promise.fromCallback(function(_callback){
		activity = _.find(self.allianceActivities.next, function(activity){
			return activity.type === type;
		});
		if(activity){
			LogicUtils.removeItemInArray(self.allianceActivities.next, activity);
			return _callback();
		}
		activity = _.find(self.allianceActivities.on, function(activity){
			return activity.type === type;
		});
		if(activity){
			LogicUtils.removeItemInArray(self.allianceActivities.on, activity);
			return _callback();
		}
		activity = _.find(self.allianceActivities.expired, function(activity){
			return activity.type === type;
		});
		if(activity){
			LogicUtils.removeItemInArray(self.allianceActivities.expired, activity);
			return _callback();
		}
		_callback(new Error('活动不存在'));
	}).then(function(){
		return self.onAllianceActivityDataChangedAsync();
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 获取活动列表
 */
pro.getActivities = function(){
	return this.activities;
};

/**
 * 获取联盟活动列表
 */
pro.getAllianceActivities = function(){
	return this.allianceActivities;
};

/**
 * 为玩家添加活动积分
 * @param playerDoc
 * @param playerData
 * @param type
 * @param key
 * @param count
 */
pro.addPlayerActivityScore = function(playerDoc, playerData, type, key, count){
	var self = this;
	var activity = _.find(self.activities.on, function(activity){
		return activity.type === type;
	});
	if(!activity){
		return;
	}
	var scoreConfig = ScheduleActivities.scoreCondition[key];
	if(!scoreConfig){
		var e = new Error('积分配置文件不存在');
		self.logService.onError('cache.activityService.addPlayerActivityScore', {
			playerId:playerDoc._id,
			type:type,
			key:key
		}, e.stack);
		return;
	}
	var activityInPlayer = playerDoc.activities[type];
	if(activityInPlayer.finishTime !== activity.finishTime){
		activityInPlayer.score = 0;
		activityInPlayer.scoreRewardedIndex = 0;
		activityInPlayer.rankRewardsGeted = false;
		activityInPlayer.finishTime = activity.finishTime;
	}
	activityInPlayer.score += scoreConfig.score * count;
	if(activityInPlayer.score <= 0){
		activityInPlayer.score = 0;
	}
	playerData.push(['activities.' + type, activityInPlayer]);
};

/**
 * 为联盟添加活动积分
 * @param allianceId
 * @param type
 * @param key
 * @param count
 */
pro.addAllianceActivityScoreById = function(allianceId, type, key, count){
	var self = this;
	var activity = _.find(self.allianceActivities.on, function(activity){
		return activity.type === type;
	});
	if(!activity){
		return;
	}
	var scoreConfig = ScheduleActivities.scoreCondition[key];
	if(!scoreConfig){
		var e = new Error('积分配置文件不存在');
		self.logService.onError('cache.activityService.addAllianceActivityScore', {
			allianceId:allianceId,
			type:type,
			key:key
		}, e.stack);
		return;
	}
	var allianceDoc = null;
	var allianceData = [];
	var lockPairs = [];
	var pushFuncs = [];
	self.cacheService.findAllianceAsync(allianceId).then(function(doc){
		if(!_.isObject(doc)){
			return Promise.reject(ErrorUtils.allianceNotExist(allianceId));
		}
		allianceDoc = doc;
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		var activityInAlliance = allianceDoc.activities[type];
		if(activityInAlliance.finishTime !== activity.finishTime){
			activityInAlliance.score = 0;
			activityInAlliance.finishTime = activity.finishTime;
		}
		activityInAlliance.score += scoreConfig.score * count;
		if(activityInAlliance.score <= 0){
			activityInAlliance.score = 0;
		}
		allianceData.push(['activities.' + type, activityInAlliance]);
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs);
	}).catch(function(e){
		self.logService.onError('cache.activityService.addAllianceActivityScore', {
			allianceId:allianceId,
			type:type,
			key:key
		}, e.stack);
	});
};

pro.addAllianceActivityScoreByDoc = function(allianceDoc, allianceData, type, key, count){
	var self = this;
	var activity = _.find(self.allianceActivities.on, function(activity){
		return activity.type === type;
	});
	if(!activity){
		return;
	}
	var scoreConfig = ScheduleActivities.scoreCondition[key];
	if(!scoreConfig){
		var e = new Error('积分配置文件不存在');
		self.logService.onError('cache.activityService.addAllianceActivityScore', {
			allianceId:allianceId,
			type:type,
			key:key
		}, e.stack);
		return;
	}
	var activityInAlliance = allianceDoc.activities[type];
	if(activityInAlliance.finishTime !== activity.finishTime){
		activityInAlliance.score = 0;
		activityInAlliance.finishTime = activity.finishTime;
	}
	activityInAlliance.score += scoreConfig.score * count;
	if(activityInAlliance.score <= 0){
		activityInAlliance.score = 0;
	}
	allianceData.push(['activities.' + type, activityInAlliance]);
};