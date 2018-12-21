"use strict";

/**
 * Created by modun on 15/3/19.
 */

var _ = require('underscore');

var Consts = require("../consts/consts");


var LogService = function(app){
	this.app = app;
	this.serverId = app.getServerId();
	this.httpServerId = app.get('httpServerId');
};
module.exports = LogService;
var pro = LogService.prototype;

/**
 * 请求时间日志
 * @param api
 * @param code
 * @param uid
 * @param uname
 * @param time
 * @param msg
 * @param resp
 */
pro.onRequest = function(api, code, uid, uname, time, msg, resp){
	if(!this.app.getServerById(this.httpServerId) || this.app.get('serverStatus') !== Consts.ServerStatus.On){
		console.info('[%s] Code:%d Time:%dms Api:%s Uid:%s UName:%s Msg:%j Resp:%j', this.serverId, code, time, api, uid, uname, _.omit(msg, '__route__'), resp);
	}else{
		this.app.rpc.http.httpRemote.addLog.toServer(this.httpServerId, Consts.SysLogType.Request, [this.serverId, api, code, uid, uname, time, _.omit(msg, '__route__'), resp], null);
	}
};

/**
 * 事件触发日志
 * @param api
 * @param object
 */
pro.onEvent = function(api, object){
	if(!this.app.getServerById(this.httpServerId) || this.app.get('serverStatus') !== Consts.ServerStatus.On){
		console.info('[' + this.serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {});
	}else{
		this.app.rpc.http.httpRemote.addLog.toServer(this.httpServerId, Consts.SysLogType.Event, [this.serverId, api, object], null);
	}
};

/**
 * 一般错误触发日志
 * @param api
 * @param object
 * @param stack
 */
pro.onWarning = function(api, object, stack){
	if(!this.app.getServerById(this.httpServerId) || this.app.get('serverStatus') !== Consts.ServerStatus.On){
		console.warn('[' + this.serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {});
		console.warn(_.isString(stack) ? stack : '');
	}else{
		this.app.rpc.http.httpRemote.addLog.toServer(this.httpServerId, Consts.SysLogType.Warning, [this.serverId, api, object, stack], null);
	}
};

/**
 * 事件触发错误日志
 * @param api
 * @param object
 * @param stack
 */
pro.onError = function(api, object, stack){
	if(!this.app.getServerById(this.httpServerId) || this.app.get('serverStatus') !== Consts.ServerStatus.On){
		console.error('[' + this.serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {});
		console.error(_.isString(stack) ? stack : '');
	}else{
		this.app.rpc.http.httpRemote.addLog.toServer(this.httpServerId, Consts.SysLogType.Error, [this.serverId, api, object, stack], null);
	}
};