"use strict"

/**
 * Created by modun on 14-7-29.
 */

var Promise = require("bluebird")
var _ = require("underscore")
var Consts = require("../../../consts/consts")

module.exports = function(app) {
	return new LogicRemote(app)
}

var LogicRemote = function(app) {
	this.app = app
	this.logService = app.get('logService');
	this.sessionService = app.get("sessionService")
	this.channelService = app.get("channelService")
}
var pro = LogicRemote.prototype


/**
 * 将玩家踢下线
 * @param uid
 * @param reason
 * @param callback
 */
pro.kickPlayer = function(uid, reason, callback){
	this.sessionService.kick(uid, reason, callback)
}

/**
 * 更新玩家session信息
 * @param playerId
 * @param params
 * @param callback
 */
pro.updatePlayerSession = function(playerId, params, callback){
	if(_.size(params) == 0){
		callback()
		return
	}

	var sessions = this.sessionService.service.uidMap[playerId]
	if(!sessions || sessions.length == 0) callback()
	else{
		var session = sessions[0]
		_.each(params, function(value, key){
			session.settings[key] = value
		})
		callback()
	}
}

/**
 * 玩家是否在线
 * @param playerId
 * @param callback
 */
pro.isPlayerOnline = function(playerId, callback){
	var sessions = this.sessionService.service.uidMap[playerId]
	callback(null, !_.isEmpty(sessions))
}