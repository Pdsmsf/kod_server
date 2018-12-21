"use strict";

/**
 * Created by modun on 14-7-29.
 */

var _ = require("underscore");
var ShortId = require('shortid');
var Promise = require('bluebird');
var usage = require('usage');
var os = require('os');

var DataUtils = require("../../../utils/dataUtils");
var ErrorUtils = require("../../../utils/errorUtils");
var LogicUtils = require('../../../utils/logicUtils');
var Utils = require('../../../utils/utils');
var Consts = require("../../../consts/consts");
var Define = require("../../../consts/define");

module.exports = function(app){
	return new CacheRemote(app);
};

var CacheRemote = function(app){
	this.app = app;
	this.logService = app.get('logService');
	this.channelService = app.get('channelService');
	this.cacheService = app.get('cacheService');
	this.pushService = app.get('pushService');
	this.dataService = app.get('dataService');
	this.activityService = app.get('activityService');
	this.Player = app.get('Player');
	this.Alliance = app.get('Alliance');
	this.GemChange = app.get('GemChange');
	this.ServerState = app.get('ServerState');
	this.cacheServerId = app.getServerId();
	this.chatServerId = app.getServerFromConfig('chat-server-1').id;
};

var pro = CacheRemote.prototype;

/**
 * 给在线玩家发全服邮件
 * @param playerIds
 * @param title
 * @param content
 * @param rewards
 * @param callback
 */
var SendInCacheServerMail = function(playerIds, title, content, rewards, callback){
	if(!_.isObject(title)){
		title = {en:title};
		content = {en:content};
	}
	var self = this;
	(function sendMail(){
		if(playerIds.length === 0){
			return callback();
		}
		var mail = {
			id:ShortId.generate(),
			fromId:"__system",
			fromName:"__system",
			fromIcon:0,
			fromAllianceTag:"",
			toIcon:0,
			sendTime:Date.now(),
			rewards:rewards,
			rewardGetted:false,
			isRead:false,
			isSaved:false
		};
		var playerId = playerIds.pop();
		var playerDoc = null;
		var playerData = [];
		var lockPairs = [];
		self.cacheService.findPlayerAsync(playerId).then(function(doc){
			playerDoc = doc;
			lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		}).then(function(){
			var language = playerDoc.basicInfo.language;
			var finalLanguage = !!title[language] ? language : !!title['en'] ? 'en' : _.keys[title][0];
			mail.title = title[finalLanguage];
			mail.content = content[finalLanguage];
			while(playerDoc.mails.length >= Define.PlayerMailsMaxSize){
				var willRemovedMail = LogicUtils.getPlayerFirstUnSavedMail(playerDoc);
				playerData.push(["mails." + playerDoc.mails.indexOf(willRemovedMail), null]);
				LogicUtils.removeItemInArray(playerDoc.mails, willRemovedMail);
			}
			playerDoc.mails.push(mail);
			playerData.push(["mails." + playerDoc.mails.indexOf(mail), mail]);
		}).then(function(){
			return self.cacheService.touchAllAsync(lockPairs);
		}).then(function(){
			return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData);
		}).catch(function(e){
			self.logService.onError('cache.gmApiRemote.SendInCacheServerMail', {
				playerId:playerId,
				title:title,
				content:content,
				rewards:rewards
			}, e.stack);
		}).finally(function(){
			setImmediate(sendMail);
		});
	})();
};

/**
 * 给离线玩家发送全服邮件
 * @param playerIds
 * @param title
 * @param content
 * @param rewards
 * @param callback
 */
var SendOutCacheServerMail = function(playerIds, title, content, rewards, callback){
	if(!_.isObject(title)){
		title = {en:title};
		content = {en:content};
	}
	var self = this;
	var languages = _.keys(title);
	var validLanguages = _.keys(title);
	var finalLanguage = !!title.en ? 'en' : _.keys[title][0];
	(function send(){
		if(!languages){
			return callback();
		}
		var language = null;
		var query = {
			serverId:self.cacheServerId,
			_id:{$in:playerIds}
		};
		if(languages.length > 0){
			language = languages.pop();
			query['basicInfo.language'] = language;
		}else{
			language = finalLanguage;
			query['basicInfo.language'] = {$nin:validLanguages};
			languages = null;
		}

		var mail = {
			id:ShortId.generate(),
			title:title[language],
			fromId:"__system",
			fromName:"__system",
			fromIcon:0,
			fromAllianceTag:"",
			toIcon:0,
			sendTime:Date.now(),
			content:content[language],
			rewards:rewards,
			rewardGetted:false,
			isRead:false,
			isSaved:false
		};

		Promise.fromCallback(function(_callback){
			self.Player.collection.update(query, {$push:{mails:mail}}, {multi:true}, _callback);
		}).then(function(){
			send();
		}).catch(function(e){
			self.logService.onError('cache.gmApiRemote.SendOutCacheServerMail', {
				playerIds:playerIds,
				title:title,
				content:content,
				rewards:rewards
			}, e.stack);
			send();
		});
	})();
};

/**
 * 发送全服系统邮件
 * @param title
 * @param content
 * @param rewards
 * @param callback
 */
pro.sendGlobalMail = function(title, content, rewards, callback){
	this.logService.onEvent('cache.gmApiRemote.sendGlobalMail', {title:title, content:content, rewards:rewards});
	callback(null, {code:200, data:null});

	var self = this;
	var lastLoginTime = Date.now() - (DataUtils.getPlayerIntInit('activePlayerNeedDays') * 24 * 60 * 60 * 1000);
	var inCacheIds = [];
	var outCacheIds = [];
	var sendOutCacheServerMailAsync = Promise.promisify(SendOutCacheServerMail, {context:self});
	var sendInCacheServerMailAsync = Promise.promisify(SendInCacheServerMail, {context:self});
	var idDocs = null;
	Promise.fromCallback(function(callback){
		self.Player.collection.find({
			serverId:self.cacheServerId,
			'countInfo.lastLogoutTime':{$gt:lastLoginTime}
		}, {_id:true}).toArray(callback);
	}).then(function(docs){
		idDocs = docs;
		_.each(docs, function(doc){
			var id = doc._id;
			if(self.cacheService.isPlayerInCache(id)){
				inCacheIds.push(id);
			}
			else{
				outCacheIds.push(id);
			}
		});
		return sendOutCacheServerMailAsync(outCacheIds, title, content, rewards);
	}).then(function(){
		return sendInCacheServerMailAsync(inCacheIds, title, content, rewards);
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.sendGlobalMail', {
			playerCount:idDocs.length,
			title:title,
			content:content,
			rewards:rewards
		}, e.stack);
	});
};

/**
 * 向指定玩家发送系统邮件
 * @param ids
 * @param title
 * @param content
 * @param rewards
 * @param callback
 */
pro.sendMailToPlayers = function(ids, title, content, rewards, callback){
	this.logService.onEvent('cache.gmApiRemote.sendMailToPlayers', {
		ids:ids,
		title:title,
		content:content,
		rewards:rewards
	});
	callback(null, {code:200, data:null});

	var self = this;
	var inCacheIds = [];
	var outCacheIds = [];
	_.each(ids, function(id){
		if(self.cacheService.isPlayerInCache(id)){
			inCacheIds.push(id);
		}
		else{
			outCacheIds.push(id);
		}
	});
	var sendOutCacheServerMailAsync = Promise.promisify(SendOutCacheServerMail, {context:this});
	var sendInCacheServerMailAsync = Promise.promisify(SendInCacheServerMail, {context:this});
	sendOutCacheServerMailAsync(outCacheIds, title, content, rewards).then(function(){
		return sendInCacheServerMailAsync(inCacheIds, title, content, rewards);
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.sendMailToPlayers', {
			count:ids.length,
			title:title,
			content:content,
			rewards:rewards
		}, e.stack);
	});
};

/**
 * 根据ID查找玩家
 * @param id
 * @param callback
 */
pro.findPlayerById = function(id, callback){
	var self = this;
	this.logService.onEvent('cache.gmApiRemote.findPlayerById', {id:id});
	this.cacheService.findPlayerAsync(id).then(function(doc){
		var playerDoc = null;
		if(!!doc){
			playerDoc = Utils.clone(doc);
			playerDoc.basicInfo.level = DataUtils.getPlayerLevel(doc);
			playerDoc.basicInfo.vipLevel = DataUtils.getPlayerVipLevel(doc);
		}
		callback(null, {code:200, data:playerDoc});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.findPlayerById', {
			id:id
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 根据ID查找联盟
 * @param id
 * @param callback
 */
pro.findAllianceById = function(id, callback){
	var self = this;
	this.logService.onEvent('cache.gmApiRemote.findAllianceById', {id:id});
	this.cacheService.findAllianceAsync(id).then(function(doc){
		var allianceDoc = null;
		if(!!doc){
			allianceDoc = Utils.clone(doc);
			allianceDoc.basicInfo.round = LogicUtils.getMapRoundByMapIndex(allianceDoc.mapIndex);
		}
		callback(null, {code:200, data:allianceDoc});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.findAllianceById', {
			id:id
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 禁止玩家登陆
 * @param playerId
 * @param minutes
 * @param reason
 * @param callback
 */
pro.banPlayer = function(playerId, minutes, reason, callback){
	this.logService.onEvent('cache.gmApiRemote.banPlayer', {playerId:playerId, minutes:minutes, reason:reason});
	var self = this;
	var playerDoc = null;
	var lockPairs = [];
	var banFinishTime = Date.now() + (minutes * 60 * 1000);
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		return self.app.get('Baned').findById(playerId);
	}).then(function(doc){
		if(!!doc){
			doc.name = playerDoc.basicInfo.name;
			doc.reason = reason;
			doc.finishTime = banFinishTime;
			doc.time = Date.now();
			return doc.save();
		}else{
			var baned = {
				_id:playerDoc._id,
				name:playerDoc.basicInfo.name,
				reason:reason,
				finishTime:banFinishTime
			};
			return self.app.get('Baned').create(baned);
		}
	}).then(function(){
		playerDoc.countInfo.lockTime = banFinishTime;
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, {code:200, data:null});
	}).then(
		function(){
			if(!!playerDoc.logicServerId && !!self.app.getServerById(playerDoc.logicServerId)){
				self.app.rpc.logic.logicRemote.kickPlayer.toServer(playerDoc.logicServerId, playerDoc._id, "禁止登录");
			}
		},
		function(e){
			self.logService.onError('cache.gmApiRemote.banPlayer', {
				playerId:playerId,
				minutes:minutes
			}, e.stack);
			callback(null, {code:500, data:e.message});
		}
	);
};

/**
 * 取消禁止登陆
 * @param playerId
 * @param callback
 */
pro.unBanPlayer = function(playerId, callback){
	this.logService.onEvent('cache.gmApiRemote.unBanPlayer', {playerId:playerId});
	var self = this;
	var playerDoc = null;
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		return self.app.get('Baned').findByIdAndRemove(playerId);
	}).then(function(){
		playerDoc.countInfo.lockTime = 0;
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, {code:200, data:null});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.unBanPlayer', {
			playerId:playerId
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 禁言玩家
 * @param playerId
 * @param minutes
 * @param reason
 * @param callback
 */
pro.mutePlayer = function(playerId, minutes, reason, callback){
	this.logService.onEvent('cache.gmApiRemote.mutePlayer', {playerId:playerId, minutes:minutes, reason:reason});
	var self = this;
	var playerDoc = null;
	var playerData = [];
	var lockPairs = [];
	var muteFinishTime = Date.now() + (minutes * 60 * 1000);
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		return self.app.get('Muted').findById(playerId);
	}).then(function(doc){
		if(!!doc){
			doc.name = playerDoc.basicInfo.name;
			doc.icon = playerDoc.basicInfo.icon;
			doc.serverId = playerDoc.serverId;
			doc.reason = reason;
			doc.by.id = '__system';
			doc.by.name = '__system';
			doc.finishTime = muteFinishTime;
			doc.time = Date.now();
			return doc.save();
		}else{
			var muted = {
				_id:playerDoc._id,
				name:playerDoc.basicInfo.name,
				icon:playerDoc.basicInfo.icon,
				serverId:playerDoc.serverId,
				reason:reason,
				by:{
					id:'__system',
					name:'__system'
				},
				finishTime:muteFinishTime
			};
			return self.app.get('Muted').create(muted);
		}
	}).then(function(){
		var modLog = {
			mod:{
				id:'__system',
				name:'__system'
			},
			action:{
				type:Consts.ModActionType.Mute,
				value:playerId + '::' + playerDoc.basicInfo.name
			}
		};
		return self.app.get('ModLog').create(modLog);
	}).then(function(){
		playerDoc.countInfo.muteTime = muteFinishTime;
		playerData.push(['countInfo.muteTime', muteFinishTime]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.dataService.updatePlayerSessionAsync(playerDoc, {muteTime:muteFinishTime});
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData);
	}).then(function(){
		var titleKey = DataUtils.getLocalizationConfig("player", "MuteTitle");
		var contentKey = DataUtils.getLocalizationConfig("player", "MuteContent");
		return self.dataService.sendSysMailAsync(playerId, titleKey, [], contentKey, ['__system', minutes, reason], []);
	}).then(function(){
		callback(null, {code:200, data:null});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.mutePlayer', {
			playerId:playerId,
			minutes:minutes
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 取消禁言
 * @param playerId
 * @param callback
 */
pro.unMutePlayer = function(playerId, callback){
	this.logService.onEvent('cache.gmApiRemote.unMutePlayer', {playerId:playerId});
	var self = this;
	var playerDoc = null;
	var playerData = [];
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		return self.app.get('Muted').findByIdAndRemove(playerId);
	}).then(function(){
		var modLog = {
			mod:{
				id:'__system',
				name:'__system'
			},
			action:{
				type:Consts.ModActionType.UnMute,
				value:playerId + '::' + playerDoc.basicInfo.name
			}
		};
		return self.app.get('ModLog').create(modLog);
	}).then(function(){
		playerDoc.countInfo.muteTime = 0;
		playerData.push(['countInfo.muteTime', 0]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.dataService.updatePlayerSessionAsync(playerDoc, {muteTime:0});
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData);
	}).then(function(){
		var titleKey = DataUtils.getLocalizationConfig("player", "UnMuteTitle");
		var contentKey = DataUtils.getLocalizationConfig("player", "UnMuteContent");
		return self.dataService.sendSysMailAsync(playerId, titleKey, [], contentKey, [], []);
	}).then(function(){
		callback(null, {code:200, data:null});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.unMutePlayer', {
			playerId:playerId
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 获取
 * @param callback
 */
pro.getServerInfo = function(callback){
	this.logService.onEvent('cache.cacheRemote.getServerInfo');

	var self = this;
	var info = {};
	var memoryTotal = (os.totalmem() / (1024 * 1024)).toFixed(2);
	var memoryUsage = process.memoryUsage();
	var heapUsed = (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2);
	var rss = (memoryUsage.rss / (1024 * 1024)).toFixed(2);
	var heapTotal = (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2);
	var uptime = (process.uptime() / 60).toFixed(2);
	info.sysInfo = {
		memoryTotal:memoryTotal,
		heapTotal:heapTotal,
		heapUsed:heapUsed,
		rss:rss,
		uptime:uptime
	};
	info.gameInfo = {
		onlineCount:self.app.get('onlineCount')
	};
	this.cacheService.getPlayerModel().countAsync({
		serverId:self.cacheServerId,
		'countInfo.lastLogoutTime':{$gt:Date.now() - (24 * 60 * 60 * 1000)}
	}).then(function(activeCount){
		info.gameInfo.activeCount = activeCount;
		return self.cacheService.getPlayerModel().countAsync({serverId:self.cacheServerId});
	}).then(function(totalCount){
		info.gameInfo.totalCount = totalCount;
		return Promise.fromCallback(function(callback){
			usage.lookup(process.pid, function(e, res){
				callback(null, !!e ? 0 : res.cpu);
			});
		});
	}).then(function(cpu){
		info.sysInfo.cpu = cpu.toFixed(2);
		return self.ServerState.findByIdAsync(self.cacheServerId, 'openAt');
	}).then(function(doc){
		info.sysInfo.openAt = doc.openAt;
	}).then(function(){
		callback(null, {code:200, data:info});
	}).catch(function(e){
		self.logService.onError('cache.cacheRemote.getServerInfo', {}, e.stack);
		callback(null, {code:200, data:info});
	});
};

/**
 * 添加服务器公告
 * @param title
 * @param content
 * @param callback
 */
pro.addServerNotice = function(title, content, callback){
	var self = this;
	var serverNotices = this.app.get('__serverNotices');
	var data = [];
	while(serverNotices.length >= Define.ServerNoticeMaxSize){
		data.push({
			type:Consts.DataChangedType.Remove,
			data:serverNotices[serverNotices.length - 1].id
		});
		serverNotices.shift();
	}
	var notice = {
		id:ShortId.generate(),
		title:title,
		content:content,
		time:Date.now()
	};
	serverNotices.push(notice);
	data.push({
		type:Consts.DataChangedType.Add,
		data:notice
	});
	this.ServerState.findByIdAsync(this.cacheServerId).then(function(doc){
		doc.notices = serverNotices;
		return Promise.fromCallback(function(callback){
			doc.save(callback);
		});
	}).then(function(){
		callback(null, {code:200, data:notice});
	}).then(
		function(){
			if(!!self.app.getServerById(self.chatServerId)){
				self.app.rpc.chat.chatRemote.onServerNoticeChanged.toServer(self.chatServerId, self.cacheServerId, data, function(){
				});
			}
		},
		function(e){
			self.logService.onError('cache.gmApiRemote.addServerNotice', {
				title:title,
				content:content
			}, e.stack);
			callback(null, {code:500, data:e.message});
		}
	);
};

/**
 * 删除服务器公告
 * @param id
 * @param callback
 */
pro.deleteServerNotice = function(id, callback){
	var self = this;
	var data = [];
	var serverNotices = this.app.get('__serverNotices');
	var notice = LogicUtils.getObjectById(serverNotices, id);
	if(!notice){
		return callback(null, {code:200, data:null});
	}
	data.push({
		type:Consts.DataChangedType.Remove,
		data:notice.id
	});
	LogicUtils.removeItemInArray(serverNotices, notice);
	this.ServerState.findByIdAsync(this.cacheServerId).then(function(doc){
		doc.notices = serverNotices;
		return Promise.fromCallback(function(callback){
			doc.save(callback);
		});
	}).then(function(){
		callback(null, {code:200, data:null});
	}).then(
		function(){
			if(!!self.app.getServerById(self.chatServerId)){
				self.app.rpc.chat.chatRemote.onServerNoticeChanged.toServer(self.chatServerId, self.cacheServerId, data, function(){
				});
			}
		},
		function(e){
			self.logService.onError('cache.gmApiRemote.deleteServerNotice', {
				id:id
			}, e.stack);
			callback(null, {code:500, data:e.message});
		}
	);
};

/**
 * 服务器公告列表
 * @param callback
 */
pro.getServerNotices = function(callback){
	callback(null, {code:200, data:this.app.get('__serverNotices')});
};

/**
 * 创建活动
 * @param type
 * @param dateToStart
 * @param callback
 */
pro.createActivity = function(type, dateToStart, callback){
	var self = this;
	return self.activityService.createActivityAsync(type, dateToStart).then(function(){
		callback(null, {code:200, data:null});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.createActivity', {
			type:type,
			dateToStart:dateToStart
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 删除活动
 * @param type
 * @param callback
 */
pro.deleteActivity = function(type, callback){
	var self = this;
	return self.activityService.deleteActivityAsync(type).then(function(){
		callback(null, {code:200, data:null});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.deleteActivity', {
			type:type
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 获取活动信息
 * @param callback
 */
pro.getActivities = function(callback){
	var activities = this.activityService.getActivities();
	callback(null, {code:200, data:activities});
};

/**
 * 创建联盟活动
 * @param type
 * @param dateToStart
 * @param callback
 */
pro.createAllianceActivity = function(type, dateToStart, callback){
	var self = this;
	return self.activityService.createAllianceActivityAsync(type, dateToStart).then(function(){
		callback(null, {code:200, data:null});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.createAllianceActivity', {
			type:type,
			dateToStart:dateToStart
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 删除联盟活动
 * @param type
 * @param callback
 */
pro.deleteAllianceActivity = function(type, callback){
	var self = this;
	return self.activityService.deleteAllianceActivityAsync(type).then(function(){
		callback(null, {code:200, data:null});
	}).catch(function(e){
		self.logService.onError('cache.gmApiRemote.deleteAllianceActivity', {
			type:type
		}, e.stack);
		callback(null, {code:500, data:e.message});
	});
};

/**
 * 获取联盟活动信息
 * @param callback
 */
pro.getAllianceActivities = function(callback){
	var activities = this.activityService.getAllianceActivities();
	callback(null, {code:200, data:activities});
};

/**
 * 获取游戏状态信息
 * @param callback
 */
pro.getGameInfo = function(callback){
	callback(null, {code:200, data:this.app.get('__gameInfo')});
};

/**
 * 编辑游戏状态信息
 * @param gameInfo
 * @param callback
 */
pro.editGameInfo = function(gameInfo, callback){
	var self = this;
	var oldGameInfo = this.app.get('__gameInfo');
	var _gameInfo = Utils.clone(gameInfo);
	delete _gameInfo.iapGemEventEnabled;
	if(gameInfo.iapGemEventEnabled){
		if(oldGameInfo.iapGemEventFinishTime > Date.now()){
			_gameInfo.iapGemEventFinishTime = oldGameInfo.iapGemEventFinishTime;
		}else{
			_gameInfo.iapGemEventFinishTime = LogicUtils.getNextDateTime(LogicUtils.getTodayDateTime(), DataUtils.getPlayerIntInit('iapGemEventActiveDays'));
		}
	}else{
		_gameInfo.iapGemEventFinishTime = 0;
	}
	this.app.set('__gameInfo', _gameInfo);
	this.ServerState.findByIdAsync(this.cacheServerId).then(function(doc){
		doc.gameInfo = _gameInfo;
		return Promise.fromCallback(function(callback){
			doc.save(callback);
		});
	}).then(function(){
		callback(null, {code:200, data:null});
	}).then(
		function(){
			if(!!self.app.getServerById(self.chatServerId)){
				self.app.rpc.chat.chatRemote.onGameInfoChanged.toServer(self.chatServerId, self.cacheServerId, _gameInfo, function(){
				});
			}
		},
		function(e){
			self.logService.onError('cache.gmApiRemote.editGameInfo', {
				gameInfo:gameInfo
			}, e.stack);
			callback(null, {code:500, data:e.message});
		}
	);
};

/**
 * 补发玩家充值礼包
 * @param playerId
 * @param productId
 * @param callback
 * @returns {*}
 */
pro.addShopProduct = function(playerId, productId, callback){
	var self = this;
	var playerDoc = null;
	var allianceDoc = null;
	var playerData = [];
	var lockPairs = [];
	var updateFuncs = [];
	var eventFuncs = [];
	var rewards = null;

	var itemConfig = DataUtils.getStoreProudctConfig(productId);
	if(!_.isObject(itemConfig)){
		var e = ErrorUtils.iapProductNotExist(playerId, productId);
		return callback(null, {code:500, data:e.message});
	}

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var quantity = 1;
		playerDoc.resources.gem += itemConfig.gem * quantity;
		playerData.push(["resources.gem", playerDoc.resources.gem]);
		playerDoc.countInfo.iapCount += 1;
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount]);
		playerDoc.countInfo.iapGemCount += itemConfig.gem * quantity;
		playerData.push(["countInfo.iapGemCount", playerDoc.countInfo.iapGemCount]);
		rewards = DataUtils.getStoreProductRewardsFromConfig(itemConfig);
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'addIosPlayerBillingData', null, rewards.rewardsToMe, true]);
		var gemAdd = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:itemConfig.gem * quantity,
			left:playerDoc.resources.gem,
			api:"addShopProduct",
			params:{
				productId:productId
			}
		};

		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemAdd]);
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id]);
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData);
	}).then(
		function(){
			if(!rewards.rewardToAllianceMember || !playerDoc.allianceId){
				return callback(null, {code:200, data:null});
			}
			self.cacheService.findAllianceAsync(playerDoc.allianceId).then(function(doc){
				allianceDoc = doc;
				var memberIds = [];
				_.each(allianceDoc.members, function(member){
					if(!_.isEqual(member.id, playerId)){
						memberIds.push(member.id);
					}
				});
				(function sendRewards(){
					if(memberIds.length === 0){
						return callback(null, {code:200, data:null});
					}
					var memberId = memberIds.pop();
					self.app.get('playerIAPService').sendAllianceMembersRewardsAsync(playerId, playerDoc.basicInfo.name, memberId, rewards.rewardToAllianceMember).finally(function(){
						sendRewards();
					});
				})();
			});
		},
		function(e){
			callback(null, {code:500, data:e.message});
		}
	);
};