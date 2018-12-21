"use strict"

/**
 * Created by modun on 15/4/16.
 */

var routeUtil = module.exports

routeUtil.chat = function(session, msg, app, callback){
	if(!session.get("chatServerId")){
		callback(new Error("fail to find chatServerId in session"))
		return
	}
	callback(null, session.get("chatServerId"))
}

routeUtil.rank = function(session, msg, app, callback){
	if(!session.get("rankServerId")){
		callback(new Error("fail to find rankServerId in session"))
		return
	}
	callback(null, session.get("rankServerId"))
}

routeUtil.logic = function(session, msg, app, callback){
	if(!session.get("logicServerId")){
		callback(new Error("fail to find logicServerId in session"))
		return
	}
	callback(null, session.get("logicServerId"))
}

routeUtil.cache = function(session, msg, app, callback){
	if(!session.get("cacheServerId")){
		callback(new Error("fail to find cacheServerId in session"))
		return
	}
	callback(null, session.get("cacheServerId"))
}