"use strict"

/**
 * Created by modun on 14-7-29.
 */

var _ = require("underscore")
var Promise = require("bluebird")

var Consts = require("../../../consts/consts")
var Define = require("../../../consts/define")
var Events = require("../../../consts/events")
var ErrorUtils = require("../../../utils/errorUtils")
var LogicUtils = require("../../../utils/logicUtils")

module.exports = function(app){
	return new HttpHandler(app)
}

var HttpHandler = function(app){
	this.app = app
	this.logService = app.get("logService")
}

var pro = HttpHandler.prototype

pro.getAll = function(msg, session, next){
	var chats = this.app.get('gmChats')[session.uid];
	if(!chats) chats = this.app.get('gmChats')[session.uid] = [];
	next(null, {code:200, chats:chats});
}

/**
 * 发送聊天信息
 * @param msg
 * @param session
 * @param next
 */
pro.send = function(msg, session, next){
	var chats = this.app.get('gmChats')[session.uid];
	if(!chats) chats = this.app.get('gmChats')[session.uid] = [];

	var text = msg.text
	var e = null
	if(!_.isString(text) || _.isEmpty(text.trim())){
		e = new Error("text 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(chats.length > this.app.get('gmChatMaxLength')){
		chats.shift()
	}
	var message = {
		id:session.uid,
		icon:session.get("icon"),
		name:session.get("name"),
		vip:session.get("vipExp"),
		vipActive:session.get('isVipActive'),
		allianceId:session.get("allianceId"),
		allianceTag:session.get("allianceTag"),
		serverId:session.get('cacheServerId'),
		text:text,
		time:Date.now()
	}
	chats.push(message)
	next(null, {code:200})
}