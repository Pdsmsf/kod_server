"use strict";

/**
 * Created by modun on 15/3/19.
 */

var _ = require("underscore");
var Promise = require("bluebird");

var Consts = require("../consts/consts");
var Define = require("../consts/define");
var GameDatas = require("../datas/GameDatas");
var ScheduleActivities = GameDatas.ScheduleActivities;

var ActivityRankState = {
	Done:'done',
	Refreshing:'refreshing'
};

var RankService = function(app){
	this.app = app;
	this.logService = app.get("logService");
	this.Alliance = app.get("Alliance");
	this.Player = app.get("Player");
	this.cacheServerIds = app.get('cacheServerIds');
	this.refreshTimeout = 10 * 60 * 1000;
	this.allianceCount = 100;
	this.playerCount = 500;
	this.servers = {};
	var self = this;
	_.each(app.get('cacheServerIds'), function(serverId){
		self.servers[serverId] = {
			allianceKills:[],
			allianceKillIds:{},
			alliancePowers:[],
			alliancePowerIds:{},
			playerKills:[],
			playerKillIds:{},
			playerPowers:[],
			playerPowerIds:{}
		};
	});
	this.activityRanks = {};
	this.activityRankState = {};
	this.allianceActivityRanks = {};
	this.allianceActivityRankState = {};
};
module.exports = RankService;
var pro = RankService.prototype;


var RefreshAlliancesAsync = function(serverId){
	var self = this;
	return Promise.fromCallback(function(callback){
		self.Alliance.collection.find({
			"serverId":serverId
		}, {
			_id:true,
			"basicInfo.name":true,
			"basicInfo.tag":true,
			"basicInfo.flag":true,
			"basicInfo.kill":true
		}).sort({"basicInfo.kill":-1}).limit(self.allianceCount).toArray(callback);
	}).then(function(docs){
		var alliances = [];
		var allianceIds = {};
		_.each(docs, function(doc){
			var theDoc = {
				id:doc._id,
				name:doc.basicInfo.name,
				tag:doc.basicInfo.tag,
				flag:doc.basicInfo.flag,
				value:doc.basicInfo.kill
			};
			alliances.push(theDoc);
			allianceIds[doc._id] = alliances.indexOf(theDoc);
		});
		self.servers[serverId].allianceKills = alliances;
		self.servers[serverId].allianceKillIds = allianceIds;
	}).then(function(){
		return Promise.fromCallback(function(callback){
			self.Alliance.collection.find({
				"serverId":serverId
			}, {
				_id:true,
				"basicInfo.name":true,
				"basicInfo.tag":true,
				"basicInfo.flag":true,
				"basicInfo.power":true
			}).sort({"basicInfo.power":-1}).limit(self.allianceCount).toArray(callback);
		});
	}).then(function(docs){
		var alliances = [];
		var allianceIds = {};
		_.each(docs, function(doc){
			var theDoc = {
				id:doc._id,
				name:doc.basicInfo.name,
				tag:doc.basicInfo.tag,
				flag:doc.basicInfo.flag,
				value:doc.basicInfo.power
			};
			alliances.push(theDoc);
			allianceIds[doc._id] = alliances.indexOf(theDoc);
		});
		self.servers[serverId].alliancePowers = alliances;
		self.servers[serverId].alliancePowerIds = allianceIds;
	});
};

var RefreshPlayersAsync = function(serverId){
	var self = this;
	return Promise.fromCallback(function(callback){
		self.Player.collection.find({
			"serverId":serverId
		}, {
			_id:true,
			"basicInfo.name":true,
			"basicInfo.icon":true,
			"basicInfo.kill":true
		}).sort({"basicInfo.kill":-1}).limit(self.playerCount).toArray(callback);
	}).then(function(docs){
		var players = [];
		var playerIds = {};
		_.each(docs, function(doc){
			var theDoc = {
				id:doc._id,
				name:doc.basicInfo.name,
				icon:doc.basicInfo.icon,
				value:doc.basicInfo.kill
			};
			players.push(theDoc);
			playerIds[doc._id] = players.indexOf(theDoc);
		});
		self.servers[serverId].playerKills = players;
		self.servers[serverId].playerKillIds = playerIds;
	}).then(function(){
		return Promise.fromCallback(function(callback){
			self.Player.collection.find({
				"serverId":serverId
			}, {
				_id:true,
				"basicInfo.name":true,
				"basicInfo.icon":true,
				"basicInfo.power":true
			}).sort({"basicInfo.power":-1}).limit(self.playerCount).toArray(callback);
		});
	}).then(function(docs){
		var players = [];
		var playerIds = {};
		_.each(docs, function(doc){
			var theDoc = {
				id:doc._id,
				name:doc.basicInfo.name,
				icon:doc.basicInfo.icon,
				value:doc.basicInfo.power
			};
			players.push(theDoc);
			playerIds[doc._id] = players.indexOf(theDoc);
		});
		self.servers[serverId].playerPowers = players;
		self.servers[serverId].playerPowerIds = playerIds;
	});
};

var OnRefreshInterval = function(){
	var self = this;
	var currentIndex = 0;
	(function excute(){
		if(currentIndex < self.cacheServerIds.length){
			var serverId = self.cacheServerIds[currentIndex];
			RefreshAlliancesAsync.call(self, serverId).then(function(){
				return RefreshPlayersAsync.call(self, serverId);
			}).then(function(){
				self.logService.onEvent("rank.rankHandler.OnRefreshInterval", {serverId:serverId});
				excute();
			}).catch(function(e){
				self.logService.onError("rank.rankHandler.OnRefreshInterval", {serverId:serverId}, e.stack);
				excute();
			});
			currentIndex++;
		}else{
			setTimeout(OnRefreshInterval.bind(self), self.refreshTimeout);
		}
	})();
};

/**
 * 启动
 */
pro.init = function(){
	OnRefreshInterval.call(this);
};

/**
 * 获取玩家排名信息
 * @param serverId
 * @param playerId
 * @param rankType
 * @param fromRank
 * @returns {*[]}
 */
pro.getPlayerRankList = function(serverId, playerId, rankType, fromRank){
	var self = this;
	if(!self.servers[serverId]){
		return [null, []];
	}
	var myData = null;
	var datas = null;
	if(_.isEqual(Consts.RankTypes.Kill, rankType)){
		if(!self.servers[serverId].playerKillIds){
			return [null, []];
		}
		myData = {index:_.isNumber(this.servers[serverId].playerKillIds[playerId]) ? this.servers[serverId].playerKillIds[playerId] : null};
		datas = this.servers[serverId].playerKills.slice(fromRank, fromRank + Define.PlayerMaxReturnRankListSize);
		return [myData, datas];
	}else{
		if(!self.servers[serverId].playerPowerIds){
			return [null, []];
		}
		myData = {index:_.isNumber(this.servers[serverId].playerPowerIds[playerId]) ? this.servers[serverId].playerPowerIds[playerId] : null};
		datas = this.servers[serverId].playerPowers.slice(fromRank, fromRank + Define.PlayerMaxReturnRankListSize);
		return [myData, datas];
	}
};

/**
 * 获取联盟排名信息
 * @param serverId
 * @param allianceId
 * @param rankType
 * @param fromRank
 * @returns {*[]}
 */
pro.getAllianceRankList = function(serverId, allianceId, rankType, fromRank){
	var self = this;
	if(!self.servers[serverId]){
		return [null, []];
	}

	var myData = null;
	var datas = null;
	if(_.isEqual(Consts.RankTypes.Kill, rankType)){
		if(!self.servers[serverId].allianceKillIds){
			return [null, []];
		}
		myData = {index:_.isNumber(this.servers[serverId].allianceKillIds[allianceId]) ? this.servers[serverId].allianceKillIds[allianceId] : null};
		datas = this.servers[serverId].allianceKills.slice(fromRank, fromRank + Define.PlayerMaxReturnRankListSize);
		return [myData, datas];
	}else{
		if(!self.servers[serverId].alliancePowerIds){
			return [null, []];
		}
		myData = {index:_.isNumber(this.servers[serverId].alliancePowerIds[allianceId]) ? this.servers[serverId].alliancePowerIds[allianceId] : null};
		datas = this.servers[serverId].alliancePowers.slice(fromRank, fromRank + Define.PlayerMaxReturnRankListSize);
		return [myData, datas];
	}
};

/**
 * 刷新活动排行榜
 * @param cacheServerId
 * @param activities
 */
pro.refreshActivities = function(cacheServerId, activities){
	var self = this;
	if(!self.activityRankState[cacheServerId]){
		self.activityRankState[cacheServerId] = ActivityRankState.Done;
	}
	if(self.activityRankState[cacheServerId] === ActivityRankState.Refreshing){
		return;
	}

	self.activityRankState[cacheServerId] = ActivityRankState.Refreshing;
	Promise.fromCallback(function(callback){
		var onActivities = [].concat(activities.on);
		(function doRank(){
			if(onActivities.length === 0){
				return callback();
			}
			var onActivity = onActivities.pop();
			var searchOptions = {
				"serverId":cacheServerId
			};
			searchOptions['activities.' + onActivity.type + '.score'] = {$gt:0};
			searchOptions['activities.' + onActivity.type + '.finishTime'] = onActivity.finishTime;
			var filterOptions = {
				_id:true,
				"basicInfo.name":true,
				"basicInfo.icon":true
			};
			filterOptions['activities.' + onActivity.type + '.score'] = true;
			var sortOption = {};
			sortOption['activities.' + onActivity.type + '.score'] = -1;
			Promise.fromCallback(function(callback){
				self.Player.collection.find(searchOptions, filterOptions).sort(sortOption).limit(ScheduleActivities.type[onActivity.type].maxRank).toArray(callback);
			}).then(function(docs){
				var players = [];
				var playerIds = {};
				_.each(docs, function(doc){
					var theDoc = {
						id:doc._id,
						name:doc.basicInfo.name,
						icon:doc.basicInfo.icon,
						score:doc.activities[onActivity.type].score
					};
					players.push(theDoc);
					playerIds[doc._id] = players.indexOf(theDoc);
				});
				if(!self.activityRanks[cacheServerId]){
					self.activityRanks[cacheServerId] = {};
				}
				if(!self.activityRanks[cacheServerId][onActivity.type]){
					self.activityRanks[cacheServerId][onActivity.type] = {};
				}
				self.activityRanks[cacheServerId][onActivity.type].playerScores = players;
				self.activityRanks[cacheServerId][onActivity.type].playerScoreIds = playerIds;
			}).then(function(){
				doRank();
			});
		})();
	}).then(function(){
		return Promise.fromCallback(function(callback){
			var expireActivities = [].concat(activities.expired);
			(function doRank(){
				if(expireActivities.length === 0){
					return callback();
				}
				var expiredActivity = expireActivities.pop();
				var searchOptions = {
					"serverId":cacheServerId
				};
				searchOptions['activities.' + expiredActivity.type + '.score'] = {$gt:0};
				searchOptions['activities.' + expiredActivity.type + '.finishTime'] = expiredActivity.removeTime - (ScheduleActivities.type[expiredActivity.type].expireHours * 60 * 60 * 1000);
				var filterOptions = {
					_id:true,
					"basicInfo.name":true,
					"basicInfo.icon":true
				};
				filterOptions['activities.' + expiredActivity.type + '.score'] = true;
				var sortOption = {};
				sortOption['activities.' + expiredActivity.type + '.score'] = -1;
				Promise.fromCallback(function(callback){
					self.Player.collection.find(searchOptions, filterOptions).sort(sortOption).limit(ScheduleActivities.type[expiredActivity.type].maxRank).toArray(callback);
				}).then(function(docs){
					var players = [];
					var playerIds = {};
					_.each(docs, function(doc){
						var theDoc = {
							id:doc._id,
							name:doc.basicInfo.name,
							icon:doc.basicInfo.icon,
							score:doc.activities[expiredActivity.type].score
						};
						players.push(theDoc);
						playerIds[doc._id] = players.indexOf(theDoc);
					});
					if(!self.activityRanks[cacheServerId]){
						self.activityRanks[cacheServerId] = {};
					}
					if(!self.activityRanks[cacheServerId][expiredActivity.type]){
						self.activityRanks[cacheServerId][expiredActivity.type] = {};
					}
					self.activityRanks[cacheServerId][expiredActivity.type].playerScores = players;
					self.activityRanks[cacheServerId][expiredActivity.type].playerScoreIds = playerIds;
				}).then(function(){
					doRank();
				});
			})();
		});
	}).then(function(){
		self.activityRankState[cacheServerId] = ActivityRankState.Done;
		self.logService.onEvent("rank.rankService.refreshActivities", {serverId:cacheServerId, activities:activities});
	}).catch(function(e){
		self.logService.onError("rank.rankService.refreshActivities", {
			serverId:cacheServerId,
			activities:activities
		}, e.stack);
	});
};

/**
 * 获取玩家活动排行榜信息
 * @param serverId
 * @param playerId
 * @param rankType
 * @param fromRank
 * @returns {*[]}
 */
pro.getPlayerActivityRankList = function(serverId, playerId, rankType, fromRank){
	var self = this;
	if(!self.activityRanks[serverId]){
		return [null, []];
	}
	if(!self.activityRanks[serverId][rankType]){
		return [null, []];
	}
	var myData = {index:_.isNumber(this.activityRanks[serverId][rankType].playerScoreIds[playerId]) ? this.activityRanks[serverId][rankType].playerScoreIds[playerId] : null};
	var datas = this.activityRanks[serverId][rankType].playerScores.slice(fromRank, fromRank + Define.PlayerMaxReturnRankListSize);
	return [myData, datas];
};

/**
 * 获取玩家积分排行
 * @param serverId
 * @param playerId
 * @param rankType
 * @returns {*}
 */
pro.getPlayerRank = function(serverId, playerId, rankType){
	var self = this;
	if(!self.activityRanks[serverId]){
		return null;
	}
	if(!self.activityRanks[serverId][rankType]){
		return null;
	}
	var myRank = _.isNumber(this.activityRanks[serverId][rankType].playerScoreIds[playerId]) ? this.activityRanks[serverId][rankType].playerScoreIds[playerId] + 1 : null;
	return myRank;
};

/**
 * 刷新联盟活动排行榜
 * @param cacheServerId
 * @param activities
 */
pro.refreshAllianceActivities = function(cacheServerId, activities){
	var self = this;
	if(!self.allianceActivityRankState[cacheServerId]){
		self.allianceActivityRankState[cacheServerId] = ActivityRankState.Done;
	}
	if(self.allianceActivityRankState[cacheServerId] === ActivityRankState.Refreshing){
		return;
	}

	self.allianceActivityRankState[cacheServerId] = ActivityRankState.Refreshing;
	Promise.fromCallback(function(callback){
		var onActivities = [].concat(activities.on);
		(function doRank(){
			if(onActivities.length === 0){
				return callback();
			}
			var onActivity = onActivities.pop();
			var searchOptions = {
				"serverId":cacheServerId
			};
			searchOptions['activities.' + onActivity.type + '.score'] = {$gt:0};
			searchOptions['activities.' + onActivity.type + '.finishTime'] = onActivity.finishTime;
			var filterOptions = {
				_id:true,
				"basicInfo.name":true,
				"basicInfo.tag":true,
				"basicInfo.flag":true
			};
			filterOptions['activities.' + onActivity.type + '.score'] = true;
			var sortOption = {};
			sortOption['activities.' + onActivity.type + '.score'] = -1;
			Promise.fromCallback(function(callback){
				self.Alliance.collection.find(searchOptions, filterOptions).sort(sortOption).limit(ScheduleActivities.allianceType[onActivity.type].maxRank).toArray(callback);
			}).then(function(docs){
				var alliances = [];
				var allianceIds = {};
				_.each(docs, function(doc){
					var theDoc = {
						id:doc._id,
						name:doc.basicInfo.name,
						tag:doc.basicInfo.tag,
						flag:doc.basicInfo.flag,
						score:doc.activities[onActivity.type].score
					};
					alliances.push(theDoc);
					allianceIds[doc._id] = alliances.indexOf(theDoc);
				});
				if(!self.allianceActivityRanks[cacheServerId]){
					self.allianceActivityRanks[cacheServerId] = {};
				}
				if(!self.allianceActivityRanks[cacheServerId][onActivity.type]){
					self.allianceActivityRanks[cacheServerId][onActivity.type] = {};
				}
				self.allianceActivityRanks[cacheServerId][onActivity.type].allianceScores = alliances;
				self.allianceActivityRanks[cacheServerId][onActivity.type].allianceScoreIds = allianceIds;
			}).then(function(){
				doRank();
			});
		})();
	}).then(function(){
		return Promise.fromCallback(function(callback){
			var expireActivities = [].concat(activities.expired);
			(function doRank(){
				if(expireActivities.length === 0){
					return callback();
				}
				var expiredActivity = expireActivities.pop();
				var searchOptions = {
					"serverId":cacheServerId
				};
				searchOptions['activities.' + expiredActivity.type + '.score'] = {$gt:0};
				searchOptions['activities.' + expiredActivity.type + '.finishTime'] = expiredActivity.removeTime - (ScheduleActivities.allianceType[expiredActivity.type].expireHours * 60 * 60 * 1000);
				var filterOptions = {
					_id:true,
					"basicInfo.name":true,
					"basicInfo.tag":true,
					"basicInfo.flag":true
				};
				filterOptions['activities.' + expiredActivity.type + '.score'] = true;
				var sortOption = {};
				sortOption['activities.' + expiredActivity.type + '.score'] = -1;
				Promise.fromCallback(function(callback){
					self.Alliance.collection.find(searchOptions, filterOptions).sort(sortOption).limit(ScheduleActivities.allianceType[expiredActivity.type].maxRank).toArray(callback);
				}).then(function(docs){
					var alliances = [];
					var allianceIds = {};
					_.each(docs, function(doc){
						var theDoc = {
							id:doc._id,
							name:doc.basicInfo.name,
							tag:doc.basicInfo.tag,
							flag:doc.basicInfo.flag,
							score:doc.activities[expiredActivity.type].score
						};
						alliances.push(theDoc);
						allianceIds[doc._id] = alliances.indexOf(theDoc);
					});
					if(!self.allianceActivityRanks[cacheServerId]){
						self.allianceActivityRanks[cacheServerId] = {};
					}
					if(!self.allianceActivityRanks[cacheServerId][expiredActivity.type]){
						self.allianceActivityRanks[cacheServerId][expiredActivity.type] = {};
					}
					self.allianceActivityRanks[cacheServerId][expiredActivity.type].allianceScores = alliances;
					self.allianceActivityRanks[cacheServerId][expiredActivity.type].allianceScoreIds = allianceIds;
				}).then(function(){
					doRank();
				});
			})();
		});
	}).then(function(){
		self.allianceActivityRankState[cacheServerId] = ActivityRankState.Done;
		self.logService.onEvent("rank.rankService.refreshAllianceActivities", {
			serverId:cacheServerId,
			activities:activities
		});
	}).catch(function(e){
		self.logService.onError("rank.rankService.refreshAllianceActivities", {
			serverId:cacheServerId,
			activities:activities
		}, e.stack);
	});
};

/**
 * 获取联盟活动排行榜信息
 * @param serverId
 * @param allianceId
 * @param rankType
 * @param fromRank
 * @returns {*[]}
 */
pro.getAllianceActivityRankList = function(serverId, allianceId, rankType, fromRank){
	var self = this;
	if(!self.allianceActivityRanks[serverId]){
		return [null, []];
	}
	if(!self.allianceActivityRanks[serverId][rankType]){
		return [null, []];
	}
	var myData = {index:_.isNumber(this.allianceActivityRanks[serverId][rankType].allianceScoreIds[allianceId]) ? this.allianceActivityRanks[serverId][rankType].allianceScoreIds[allianceId] : null};
	var datas = this.allianceActivityRanks[serverId][rankType].allianceScores.slice(fromRank, fromRank + Define.PlayerMaxReturnRankListSize);
	return [myData, datas];
};

/**
 * 获取联盟积分排行
 * @param serverId
 * @param allianceId
 * @param rankType
 * @returns {*}
 */
pro.getAllianceRank = function(serverId, allianceId, rankType){
	var self = this;
	if(!self.allianceActivityRanks[serverId]){
		return null;
	}
	if(!self.allianceActivityRanks[serverId][rankType]){
		return null;
	}
	var myRank = _.isNumber(this.allianceActivityRanks[serverId][rankType].allianceScoreIds[allianceId]) ? this.allianceActivityRanks[serverId][rankType].allianceScoreIds[allianceId] + 1 : null;
	return myRank;
};