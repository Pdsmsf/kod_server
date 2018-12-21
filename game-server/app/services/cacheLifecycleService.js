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

var CacheLifecycleService = function(app){
	this.app = app;
	this.logService = app.get("logService");
	this.ServerState = app.get("ServerState");
	this.cacheServerId = app.getServerId();
	this.rankServerId = app.get('rankServerId');
	this.cacheService = app.get('cacheService');
	this.pushService = app.get('pushService');
};
module.exports = CacheLifecycleService;
var pro = CacheLifecycleService.prototype;

/**
 * 更新单日数据统计
 * @param analyseDoc
 * @returns {Promise}
 * @private
 */
pro._updateAnalyseData = function(analyseDoc){
	var self = this;
	var analyseInterval = 1000 * 60 * 10;
	var todayStartTime = LogicUtils.getTodayDateTime();
	var dateFrom = analyseDoc.dateTime;
	var dateTo = LogicUtils.getNextDateTime(dateFrom, 1);
	return Promise.fromCallback(function(callback){
		if(todayStartTime > dateFrom && (Date.now() - analyseInterval) > dateTo){
			return callback();
		}
		self.app.get('Billing').aggregateAsync([
			{
				$match:{
					serverId:analyseDoc.serverId,
					time:{$gte:dateFrom, $lt:dateTo}
				}
			},
			{
				$group:{
					_id:"$playerId",
					totalPrice:{$sum:{$multiply:['$price', '$quantity']}},
					count:{$sum:1}
				}
			},
			{
				$group:{
					_id:null,
					payCount:{$sum:1},
					payTimes:{$sum:'$count'},
					revenue:{$sum:'$totalPrice'}
				}
			}
		]).then(function(docs){
			if(docs.length > 0){
				analyseDoc.payCount = docs[0].payCount;
				analyseDoc.payTimes = docs[0].payTimes;
				analyseDoc.revenue = docs[0].revenue;
			}
			return self.app.get('Player').countAsync({
				serverId:analyseDoc.serverId,
				'countInfo.registerTime':{$lt:dateTo},
				'countInfo.lastLoginTime':{$gte:dateFrom}
			});
		}).then(function(count){
			analyseDoc.dau = count;
			return self.app.get('Player').countAsync({
				serverId:analyseDoc.serverId,
				'countInfo.registerTime':{$gte:dateFrom, $lt:dateTo}
			});
		}).then(function(count){
			analyseDoc.dnu = count;
			callback();
		}).catch(function(e){
			callback(e);
		});
	}).then(function(){
		var day1From = LogicUtils.getNextDateTime(analyseDoc.dateTime, 1);
		var day3From = LogicUtils.getNextDateTime(analyseDoc.dateTime, 2);
		var day7From = LogicUtils.getNextDateTime(analyseDoc.dateTime, 6);
		var day15From = LogicUtils.getNextDateTime(analyseDoc.dateTime, 14);
		var day30From = LogicUtils.getNextDateTime(analyseDoc.dateTime, 29);
		var dayXFroms = [
			{key:'day1', value:day1From},
			{key:'day3', value:day3From},
			{key:'day7', value:day7From},
			{key:'day15', value:day15From},
			{key:'day30', value:day30From}
		];
		return Promise.fromCallback(function(callback){
			(function updateRetention(){
				var dayXFrom = dayXFroms.shift();
				if(!dayXFrom){
					analyseDoc.finished = true;
					return callback();
				}
				if(dayXFrom.value > todayStartTime){
					return callback();
				}
				if(dayXFrom.value < todayStartTime && analyseDoc[dayXFrom.key] !== -1){
					return updateRetention();
				}
				self.app.get('Player').countAsync({
					serverId:analyseDoc.serverId,
					'countInfo.registerTime':{$gte:dateFrom, $lt:dateTo},
					'countInfo.lastLoginTime':{$gte:dayXFrom.value}
				}).then(function(count){
					analyseDoc[dayXFrom.key] = count;
					updateRetention();
				}).catch(function(e){
					callback(e);
				});
			})();
		});
	}).then(function(){
		return Promise.fromCallback(function(callback){
			analyseDoc.save(callback);
		});
	}).catch(function(e){
		self.logService.onError("cache.lifecycle.afterStartup.dataAnalyse", null, e.stack);
		return Promise.resolve();
	});
};

/**
 * 帮玩家退出联盟
 * @param playerDoc
 * @returns {*|Promise}
 * @private
 */
pro._quitAlliance = function(playerDoc){
	var self = this;
	var allianceDoc = null;
	return Promise.fromCallback(function(callback){
		self.app.get('Alliance').collection.findOne({_id:playerDoc.allianceId}, {
			members:true,
			mapObjects:true
		}, callback);
	}).then(function(doc){
		allianceDoc = doc;
		var member = LogicUtils.getObjectById(allianceDoc.members, playerDoc._id);
		LogicUtils.removeItemInArray(allianceDoc.members, member);
		var mapMember = LogicUtils.getObjectById(allianceDoc.mapObjects, member.mapId);
		LogicUtils.removeItemInArray(allianceDoc.mapObjects, mapMember);
		if(member.title === Consts.AllianceTitle.Archon && allianceDoc.members.length > 0){
			var _sortedMembers = _.sortBy(allianceDoc.members, function(member){
				return -member.power;
			});
			var nextArchon = _sortedMembers[0];
			nextArchon.title = Consts.AllianceTitle.Archon;
		}
		playerDoc.allianceId = null;
	}).then(function(){
		return Promise.fromCallback(function(callback){
			self.app.get('Player').collection.updateOne({_id:playerDoc._id}, {$set:{allianceId:null}}, callback);
		});
	}).then(function(){
		return Promise.fromCallback(function(callback){
			self.app.get('Alliance').collection.updateOne({_id:allianceDoc._id}, {
					$set:{
						members:allianceDoc.members,
						mapObjects:allianceDoc.mapObjects
					}
				}, callback
			);
		});
	});
};

/**
 * 加载服务器状态信息
 * @param callback
 */
pro.setServerStateData = function(callback){
	var self = this;
	self.app.get('ServerState').findByIdAsync(self.cacheServerId).then(function(doc){
		if(!!doc){
			return Promise.resolve(doc);
		}
		doc = {_id:self.cacheServerId};
		return self.app.get('ServerState').createAsync(doc);
	}).then(function(doc){
		var serverStopTime = Date.now() - doc.lastStopTime;
		var serverOpenAt = doc.openAt;
		self.app.set('__serverStopTime', serverStopTime);
		self.app.set('__serverOpenAt', serverOpenAt);
		self.app.set('__serverNotices', doc.notices.toObject());
		self.app.set('__gameInfo', doc.gameInfo.toObject());
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 更新数据统计信息
 * @param dateTime
 * @param callback
 * @returns {*}
 */
pro.updateAnalyseDatas = function(dateTime, callback){
	var self = this;
	var serverCreateTime = LogicUtils.getPreviousDateTime(self.app.get('__serverOpenAt'), 0);
	(function excute(_dateTime){
		if(_dateTime < serverCreateTime){
			return callback();
		}
		self.app.get('Analyse').findOneAsync({serverId:self.cacheServerId, dateTime:_dateTime}).then(function(doc){
			if(!!doc){
				return Promise.resolve(doc);
			}
			doc = {serverId:self.cacheServerId, dateTime:_dateTime};
			return self.app.get('Analyse').createAsync(doc);
		}).then(function(doc){
			if(doc.finished){
				return Promise.resolve(false);
			}
			return self._updateAnalyseData(doc).then(function(){
				return Promise.resolve(true);
			});
		}).then(function(continued){
			if(continued){
				setImmediate(excute.bind(self, LogicUtils.getPreviousDateTime(_dateTime, 1)));
			}else{
				callback();
			}
		}).catch(function(e){
			callback(e);
		});
	})(dateTime);
};

/**
 * 更新日报信息
 * @param callback
 * @returns {*}
 */
pro.updateDailyReport = function(callback){
	var self = this;
	var analyseInterval = 1000 * 60 * 10;
	var todayStartTime = LogicUtils.getTodayDateTime();
	var yestodayStartTime = LogicUtils.getPreviousDateTime(todayStartTime, 1);
	var analyseDoc = null;
	var reportDoc = null;
	if(Date.now() - todayStartTime > analyseInterval){
		return callback();
	}
	self.app.get('Analyse').findOneAsync({serverId:self.cacheServerId, dateTime:yestodayStartTime}).then(function(doc){
		analyseDoc = doc;
		return self.app.get('DailyReport').findOneAsync({
			serverId:self.cacheServerId,
			dateTime:yestodayStartTime
		}).then(function(doc){
			if(!doc){
				doc = {serverId:self.cacheServerId, dateTime:yestodayStartTime};
				return self.app.get('DailyReport').createAsync(doc);
			}
			return Promise.resolve(doc);
		}).then(function(doc){
			reportDoc = doc;
			reportDoc.dau = analyseDoc.dau;
			reportDoc.dnu = analyseDoc.dnu;
		});
	}).then(function(){
		return Promise.fromCallback(function(callback){
			var currentLevel = 40;
			(function countLevel(){
				if(currentLevel < 0){
					return callback();
				}
				var sql = {
					'serverId':self.cacheServerId,
					'countInfo.lastLoginTime':{$gte:yestodayStartTime},
					'buildings.location_1.level':currentLevel
				};
				self.app.get('Player').countAsync(sql).then(function(count){
					reportDoc.keepLevels.push({level:currentLevel, count:count});
				}).finally(function(){
					currentLevel--;
					countLevel();
				});
			})();
		});
	}).then(function(){
		return self.app.get('Player').countAsync({
			'serverId':self.cacheServerId,
			'countInfo.registerTime':{$gte:yestodayStartTime, $lt:todayStartTime},
			'countInfo.isFTEFinished':true
		}).then(function(count){
			reportDoc.ftePassed = count;
		});
	}).then(function(){
		return self.app.get('GemChange').aggregateAsync([
			{
				$match:{
					'serverId':self.cacheServerId,
					changed:{$lt:0},
					time:{$gte:yestodayStartTime, $lt:todayStartTime}
				}
			},
			{$group:{_id:null, totalUsed:{$sum:'$changed'}}}
		]).then(function(datas){
			if(datas.length > 0){
				reportDoc.gemUsed = -datas[0].totalUsed;
			}
		});
	}).then(function(){
		return self.app.get('Player').aggregateAsync([
			{
				$match:{
					'serverId':self.cacheServerId,
					'countInfo.lastLoginTime':{$gte:yestodayStartTime}
				}
			},
			{$group:{_id:null, gemsTotal:{$sum:'$resources.gem'}}}
		]).then(function(datas){
			if(datas.length > 0){
				reportDoc.gemLeft = datas[0].gemsTotal;
			}
		});
	}).then(function(){
		return Promise.fromCallback(function(callback){
			reportDoc.save(callback);
		});
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 将僵尸玩家移除出联盟,并删除玩家数为0的联盟
 * @param callback
 */
pro.kickZombiePlayersFromAlliance = function(callback){
	var self = this;
	var activePlayerNeedTime = DataUtils.getPlayerIntInit('activePlayerNeedDays') * 24 * 60 * 60 * 1000;
	var activePlayerLastLoginTime = Date.now() - activePlayerNeedTime - self.app.get('__serverStopTime');
	var cursor = self.app.get('Player').collection.find({
		'serverId':self.cacheServerId,
		'countInfo.lastLogoutTime':{$lte:activePlayerLastLoginTime},
		'allianceId':{$ne:null},
		'helpedByTroop':{$eq:null},
		$or:[
			{$and:[{'defenceTroop':{$eq:null}, 'troopsOut.0':{$exists:false}}]},
			{$and:[{'defenceTroop':{$ne:null}, 'troopsOut.1':{$exists:false}}]}
		]
	}, {_id:true, allianceId:true});

	Promise.fromCallback(function(_callback){
		(function getNext(){
			cursor.next(function(e, playerDoc){
				if(!!e){
					return _callback(e);
				}
				if(!playerDoc){
					return _callback();
				}
				return self._quitAlliance(playerDoc).then(function(){
					return getNext();
				});
			});
		})();
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 删除长时间不登陆的玩家
 * @param callback
 */
pro.deleteZombiePlayers = function(callback){
	var self = this;
	var zombiePlayerNeedTime = DataUtils.getPlayerIntInit('zombiePlayerNeedDays') * 24 * 60 * 60 * 1000;
	var zombiePlayerLastLoginTime = Date.now() - zombiePlayerNeedTime - self.app.get('__serverStopTime');
	Promise.fromCallback(function(_callback){
		self.app.get('Player').collection.deleteMany({
			'serverId':self.cacheServerId,
			'countInfo.lastLogoutTime':{$lte:zombiePlayerLastLoginTime},
			'allianceId':{$eq:null},
			'deals.0':{$exists:false},
			'resources.gem':{$lte:2000},
			'countInfo.iapCount':{$eq:0}
		}, _callback);
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 清理玩家数为0的联盟
 * @param callback
 */
pro.deleteEmptyAlliances = function(callback){
	var self = this;
	Promise.fromCallback(function(_callback){
		self.app.get('Alliance').collection.deleteMany({
			'serverId':self.cacheServerId,
			'members.0':{$exists:false},
			'villages':{
				$not:{
					$elemMatch:{villageEvent:{$ne:null}}
				}
			},
			$or:[
				{'basicInfo.status':Consts.AllianceStatus.Peace},
				{'basicInfo.status':Consts.AllianceStatus.Protect}
			]
		}, _callback);
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 更新大地图数据
 * @param callback
 */
pro.updateBigMapData = function(callback){
	var self = this;
	var cursor = self.app.get('Alliance').collection.find({
		serverId:self.cacheServerId
	}, {
		_id:true,
		mapIndex:true,
		basicInfo:true,
		allianceFight:true
	});
	Promise.fromCallback(function(_callback){
		(function getNext(){
			cursor.next(function(e, doc){
				if(!!e){
					return _callback(e);
				}
				if(!doc){
					return _callback();
				}
				self.app.get('cacheService').updateMapAlliance(doc.mapIndex, doc);
				return getNext();
			});
		})();
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 更新国战数据
 * @param callback
 */
pro.updateCountryData = function(callback){
	var self = this;
	self.app.get('Country').findByIdAsync(self.cacheServerId).then(function(doc){
		if(!!doc){
			return Promise.resolve(doc);
		}
		doc = {
			_id:self.cacheServerId,
			status:{
				status:Consts.AllianceStatus.Peace,
				startTime:Date.now(),
				finishTime:0
			},
			monsters:{
				refreshTime:Date.now(),
				undeadsquads:[],
				necronators:[]
			},
			dominator:null
		};
		return self.app.get('Country').createAsync(doc);
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};

/**
 * 更新联盟事件数据
 * @param callback
 */
pro.restoreAllianceEvents = function(callback){
	var self = this;
	Promise.fromCallback(function(_callback){
		self.app.get('Alliance').collection.find({
			serverId:self.cacheServerId,
			$or:[
				{"basicInfo.status":Consts.AllianceStatus.Protect},
				{"basicInfo.status":Consts.AllianceStatus.Prepare},
				{"basicInfo.status":Consts.AllianceStatus.Fight},
				{"shrineEvents.0":{$exists:true}},
				{"villageEvents.0":{$exists:true}},
				{"marchEvents.strikeMarchEvents.0":{$exists:true}},
				{"marchEvents.strikeMarchReturnEvents.0":{$exists:true}},
				{"marchEvents.attackMarchEvents.0":{$exists:true}},
				{"marchEvents.attackMarchReturnEvents.0":{$exists:true}}
			]
		}, {_id:true}).toArray(function(e, docs){
			if(_.isObject(e)){
				_callback(e);
			}else{
				_callback(null, docs);
			}
		});
	}).then(function(ids){
		return Promise.fromCallback(function(_callback){
			(function excute(){
				if(ids.length === 0){
					return _callback();
				}
				var id = ids.pop()._id;
				self.app.get('timeEventService').restoreAllianceTimeEventsAsync(id, self.app.get('__serverStopTime')).then(function(){
					return setImmediate(excute);
				}).catch(function(e){
					_callback(e);
				});
			})();
		});
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
};