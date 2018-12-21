"use strict"

/**
 * Created by modun on 14-7-22.
 */

var crypto = require('crypto')
var Promise = require("bluebird")
var _ = require("underscore")
var ErrorUtils = require("../../../utils/errorUtils")
var Consts = require("../../../consts/consts")


module.exports = function(app){
	return new Handler(app)
}

var Handler = function(app){
	this.app = app
	this.env = app.get("env")
	this.logService = app.get("logService")
	this.sessionService = app.get("sessionService")
	this.request = app.get('request');
	this.logicServerId = app.get('logicServerId')
	this.chatServerId = app.get('chatServerId')
	this.rankServerId = app.get('rankServerId')
	this.Device = app.get('Device');
	this.Player = app.get('Player');
}
var pro = Handler.prototype


/**
 * 玩家登陆
 * @param msg
 * @param session
 * @param next
 */
pro.login = function(msg, session, next){
	var deviceId = msg.deviceId;
	var requestTime = msg.requestTime;
	var needMapData = msg.needMapData;
	var e = null
	if(!_.isString(deviceId)){
		e = new Error("deviceId 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isNumber(requestTime) || requestTime <= 0){
		e = new Error("requestTime 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.isBoolean(needMapData)){
		e = new Error("needMapData 不合法")
		return next(e, ErrorUtils.getError(e))
	}

	var self = this
	var playerDoc = null
	var allianceDoc = null
	var mapData = null
	var mapIndexData = null;
	this.Device.findByIdAsync(deviceId).then(function(doc){
		if(!doc){
			e = ErrorUtils.deviceNotExist(deviceId)
			return next(e, ErrorUtils.getError(e))
		}
		return Promise.fromCallback(function(callback){
			self.Player.collection.findOne({_id:doc.playerId}, {'_id':true, 'serverId':true}, function(e, doc){
				if(!!e) return callback(e);
				if(!doc){
					e = ErrorUtils.playerNotExist(doc.playerId, doc.playerId);
					return callback(e)
				}
				callback(null, doc)
			})
		})
	}).then(function(doc){
		session.set('cacheServerId', doc.serverId);
		return self.request(session, 'login', [deviceId, doc._id, requestTime, needMapData, self.logicServerId]);
	}).spread(function(doc_1, doc_2, doc_3, doc_4){
		playerDoc = doc_1;
		allianceDoc = doc_2;
		mapData = doc_3;
		mapIndexData = doc_4;
		return Promise.fromCallback(function(callback){
			BindPlayerSession.call(self, session, deviceId, playerDoc, allianceDoc, callback);
		});
	}).then(function(){
		var unreadMails = _.filter(playerDoc.mails, function(mail){
			return !mail.isRead;
		}).length;
		var unreadReports = _.filter(playerDoc.reports, function(report){
			return !report.isRead;
		}).length;
		var filteredPlayerDoc = _.omit(playerDoc, ["__v", "mails", "sendMails", "reports"]);
		filteredPlayerDoc.mailStatus = {
			unreadMails:unreadMails,
			unreadReports:unreadReports
		};
		filteredPlayerDoc.deltaTime = Date.now() - requestTime;
		var filteredAllianceDoc = null;
		if(_.isObject(allianceDoc)){
			filteredAllianceDoc = _.omit(allianceDoc, ["shrineReports", "allianceFightReports", "itemLogs"]);
		}
		next(null, {code:200, playerData:filteredPlayerDoc, allianceData:filteredAllianceDoc, mapData:mapData, mapIndexData:mapIndexData});
	}).catch(function(e){
		self.logService.onWarning("logic.entryHandler.login failed", {
			deviceId:deviceId,
			playerId:_.isObject(playerDoc) ? playerDoc._id : null,
			logicServerId:self.logicServerId
		}, e.stack);
		next(null, ErrorUtils.getError(e));
	});
};

var BindPlayerSession = function(session, deviceId, playerDoc, allianceDoc, callback){
	var self = this;
	Promise.fromCallback(function(innerCallback){
		session.bind(playerDoc._id, function(e){
			innerCallback(e);
		});
	}).then(function(){
		return Promise.fromCallback(function(innerCallback){
			session.set("deviceId", deviceId)
			session.set('inited', playerDoc.basicInfo.terrain !== Consts.None);
			session.set("logicServerId", self.logicServerId)
			session.set("chatServerId", self.chatServerId)
			session.set("rankServerId", self.rankServerId)
			session.set("cacheServerId", playerDoc.serverId)
			session.set("name", playerDoc.basicInfo.name)
			session.set("icon", playerDoc.basicInfo.icon)
			session.set("allianceId", _.isObject(allianceDoc) ? allianceDoc._id : "")
			session.set("allianceTag", _.isObject(allianceDoc) ? allianceDoc.basicInfo.tag : "")
			session.set("vipExp", playerDoc.basicInfo.vipExp)
			session.set("isVipActive", playerDoc.vipEvents.length > 0)
			session.set('muteTime', playerDoc.countInfo.muteTime);
			session.on("closed", Logout.bind(self));
			session.pushAll(innerCallback);
		})
	}).then(function(){
		callback();
	}).catch(function(e){
		session.uid = playerDoc._id;
		Logout.call(self, session, e.message)
		callback(e);
	})
}

var Logout = function(session, reason){
	var self = this;
	if(reason !== 'serverClose'){
		this.request(session, 'logout', [session.uid, self.logicServerId, reason]).then(function(){
			self.logService.onEvent("logic.entryHandler.logout", {
				playerId:session.uid,
				logicServerId:self.logicServerId,
				reason:!!reason ? reason : 'unknow'
			})
		}).catch(function(e){
			self.logService.onError("logic.entryHandler.logout", {
				playerId:session.uid,
				logicServerId:self.logicServerId,
				reason:reason
			}, e.stack)
		})
	}
}