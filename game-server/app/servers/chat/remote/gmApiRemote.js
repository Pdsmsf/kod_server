"use strict"

/**
 * Created by modun on 14-7-29.
 */

var _ = require("underscore")
var Promise = require('bluebird');

var DataUtils = require('../../../utils/dataUtils')
var LogicUtils = require('../../../utils/logicUtils')
var ErrorUtils = require('../../../utils/errorUtils')

var Define = require("../../../consts/define")
var Consts = require("../../../consts/consts")
var Events = require("../../../consts/events")

module.exports = function(app){
	return new GmApiRemote(app)
}

var GmApiRemote = function(app){
	this.app = app
	this.logService = app.get('logService');
	this.channelService = app.get("channelService")
	this.globalChatChannel = this.channelService.getChannel(Consts.GlobalChatChannel, true)
	this.allianceChats = app.get('allianceChats')
	this.chats = app.get('chats');
	this.Player = app.get('Player');
	this.Alliance = app.get('Alliance');
}

var pro = GmApiRemote.prototype

/**
 * 发送全服通告
 * @param servers
 * @param type
 * @param content
 * @param callback
 */
pro.sendGlobalNotice = function(servers, type, content, callback){
	this.logService.onEvent('chat.chatRemote.sendGlobalNotice', {servers:servers, type:type, content:content});
	var self = this
	_.each(servers, function(cacheServerId){
		var channel = self.channelService.getChannel(Consts.GlobalChatChannel + "_" + cacheServerId, false)
		if(_.isObject(channel)){
			channel.pushMessage(Events.chat.onNotice, {type:type, content:content}, {}, null)
		}
	})
	callback(null, {code:200, data:null});
}

/**
 * 获取公共聊天记录
 * @param time
 * @param callback
 */
pro.getGlobalChats = function(time, callback){
	var self = this;
	if(time === 0) return callback(null, {code:200, data:this.chats});

	var sliceFrom = null;
	for(var i = this.chats.length - 1; i >= 0; i--){
		var chat = self.chats[i];
		if(chat.time <= time){
			sliceFrom = i + 1;
			break;
		}
	}
	if(sliceFrom >= 0) return callback(null, {code:200, data:this.chats.slice(sliceFrom)});

	callback(null, {code:200, data:[]});
}

/**
 * 发送系统聊天
 * @param content
 * @param callback
 */
pro.sendSysChat = function(content, callback){
	this.logService.onEvent('chat.chatRemote.sendSysChat', {content:content});
	var message = LogicUtils.createSysChatMessage(content);
	if(this.chats.length > Define.MaxChatCount){
		this.chats.shift()
	}
	this.chats.push(message)
	this.globalChatChannel.pushMessage(Events.chat.onChat, message, {}, null)
	callback(null, {code:200, data:null});
}

/**
 * 获取联盟聊天记录
 * @param allianceId
 * @param time
 * @param callback
 */
pro.getAllianceChats = function(allianceId, time, callback){
	var chats = this.allianceChats[allianceId];
	if(!_.isArray(chats)) chats = [];
	if(time === 0) return callback(null, {code:200, data:chats});

	var sliceFrom = null;
	for(var i = chats.length - 1; i >= 0; i--){
		var chat = chats[i];
		if(chat.time <= time){
			sliceFrom = i + 1;
			break;
		}
	}
	if(sliceFrom >= 0) return callback(null, {code:200, data:chats.slice(sliceFrom)});

	callback(null, {code:200, data:[]});
}