"use strict"

/**
 * Created by modun on 14-8-7.
 */

var _ = require("underscore")
var Promise = require("bluebird")

var Consts = require("../consts/consts")
var Events = require("../consts/events")
var Utils = require("../utils/utils")
var LogicUtils = require("../utils/logicUtils")

var PushService = function(app){
	this.app = app
	this.channelService = app.get("channelService")
	this.logService = app.get("logService")
}
module.exports = PushService
var pro = PushService.prototype

/**
 * 推送消息给单个玩家
 * @param playerDoc
 * @param eventName
 * @param data
 * @param callback
 */
pro.pushToPlayer = function(playerDoc, eventName, data, callback){
	var self = this;
	if(!playerDoc.logicServerId || _.isEmpty(data)){
		return callback();
	}
	this.channelService.pushMessageByUids(eventName, data, [{
		uid:playerDoc._id,
		sid:playerDoc.logicServerId
	}], {}, function(e){
		if(_.isObject(e)) self.logService.onError("cache.pushService.pushToPlayer", {
			playerId:playerDoc._id,
			serverId:playerDoc.logicServerId
		}, e.stack)
	})
	callback()
}

/**
 * 推送玩家数据给玩家
 * @param playerDoc
 * @param data
 * @param callback
 */
pro.onPlayerDataChanged = function(playerDoc, data, callback){
	this.logService.onEvent('cache.pushService.onPlayerDataChanged', {playerId:playerDoc._id, data:data});
	this.pushToPlayer(playerDoc, Events.player.onPlayerDataChanged, data, callback)
}

/**
 * 成功获取联盟完整数据
 * @param playerDoc
 * @param playerData
 * @param allianceDoc
 * @param mapData
 * @param mapIndexData
 * @param callback
 */
pro.onJoinAllianceSuccess = function(playerDoc, playerData, allianceDoc, mapData, mapIndexData, callback){
	this.logService.onEvent('cache.pushService.onJoinAllianceSuccess', {
		playerId:playerDoc._id
	});
	this.pushToPlayer(playerDoc, Events.player.onJoinAllianceSuccess, {
		playerData:playerData,
		allianceData:allianceDoc,
		mapData:mapData,
		mapIndexData:mapIndexData
	}, callback)
}

/**
 * 联盟内部Banner消息
 * @param allianceId
 * @param key
 * @param params
 * @param callback
 */
pro.onAllianceNotice = function(allianceId, key, params, callback){
	var self = this
	var eventName = Events.chat.onAllianceNotice;
	var channelName = Consts.AllianceChannelPrefix + ":" + allianceId
	var channel = this.channelService.getChannel(channelName, false)
	var uids = [];
	if(!!channel){
		uids = uids.concat(_.values(channel.records))
	}
	this.logService.onEvent('cache.pushService.onAllianceNotice', {
		uids:uids,
		key:key
	});
	if(uids.length > 0){
		self.channelService.pushMessageByUids(eventName, {
			targetAllianceId:allianceId,
			data:{key:key, params:params}
		}, uids, {}, function(e){
			if(_.isObject(e)) self.logService.onError("cache.pushService.onAllianceNotice", {allianceId:allianceId}, e.stack)
		})
	}
	callback()
}

/**
 * 推送联盟数据给玩家
 * @param allianceDoc
 * @param data
 * @param callback
 */
pro.onAllianceDataChanged = function(allianceDoc, data, callback){
	var self = this
	var eventName = Events.alliance.onAllianceDataChanged;
	var channelName = Consts.AllianceChannelPrefix + ":" + allianceDoc._id
	var channel = this.channelService.getChannel(channelName, false)
	var cacheService = this.app.get('cacheService');
	var mapIndexData = cacheService.getMapDataAtIndex(allianceDoc.mapIndex);

	var uids = [];
	if(!!channel){
		uids = uids.concat(_.values(channel.records))
	}
	this.logService.onEvent('cache.pushService.onAllianceDataChanged', {
		uids:uids,
		data:data
	});
	uids = uids.concat(_.values(mapIndexData.channel.records))
	if(uids.length > 0){
		self.channelService.pushMessageByUids(eventName, {
			targetAllianceId:allianceDoc._id,
			data:data
		}, uids, {}, function(e){
			if(_.isObject(e)) self.logService.onError("cache.pushService.onAllianceDataChanged", {allianceId:allianceDoc._id}, e.stack)
		})
	}
	callback()
}

/**
 * 推送给联盟除指定玩家之外的其他玩家
 * @param allianceDoc
 * @param data
 * @param memberId
 * @param callback
 */
pro.onAllianceDataChangedExceptMemberId = function(allianceDoc, data, memberId, callback){
	var self = this
	var eventName = Events.alliance.onAllianceDataChanged
	var channelName = Consts.AllianceChannelPrefix + ":" + allianceDoc._id
	var channel = this.channelService.getChannel(channelName, false)
	var cacheService = this.app.get('cacheService');
	var mapIndexData = cacheService.getMapDataAtIndex(allianceDoc.mapIndex);

	if(!!channel){
		var uids = _.values(channel.records)
		uids = _.filter(uids, function(uid){
			return !_.isEqual(uid.uid, memberId)
		})
	}
	uids = uids.concat(_.values(mapIndexData.channel.records))
	this.logService.onEvent('cache.pushService.onAllianceDataChangedExceptMemberId', {
		uids:uids
	});
	if(uids.length > 0){
		self.channelService.pushMessageByUids(eventName, {
			targetAllianceId:allianceDoc._id,
			data:data
		}, uids, {}, function(e){
			if(_.isObject(e)) self.logService.onError("cache.pushService.onAllianceDataChangedExceptMemberId", {
				allianceId:allianceDoc._id,
				memberId:memberId
			}, e.stack)
		})
	}

	callback()
}