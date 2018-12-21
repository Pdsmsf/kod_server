"use strict"

/**
 * Created by modun on 14/10/28.
 */

var _ = require("underscore")

var requestLogger = require("pomelo/node_modules/pomelo-logger").getLogger("kod-request")
var warningLogger = require("pomelo/node_modules/pomelo-logger").getLogger("kod-warning")
var errorLogger = require("pomelo/node_modules/pomelo-logger").getLogger("kod-error")
var errorsLogger = require("pomelo/node_modules/pomelo-logger").getLogger("kod-errors")
var allLogger = require("pomelo/node_modules/pomelo-logger").getLogger("kod-all")
var mailWarningLogger = require("pomelo/node_modules/pomelo-logger").getLogger("kod-mail-warning")
var mailErrorLogger = require("pomelo/node_modules/pomelo-logger").getLogger("kod-mail-error")

var Consts = require("../../../consts/consts")

module.exports = function(app){
	return new HttpRemote(app)
}

var HttpRemote = function(app){
	this.app = app
	this.serverConfig = app.get('serverConfig');
}
var pro = HttpRemote.prototype


pro.addLog = function(type, params, callback){
	callback();
	if(type === Consts.SysLogType.Request) return this.onRequest.apply(this, params);
	else if(type === Consts.SysLogType.Event) return this.onEvent.apply(this, params);
	else if(type === Consts.SysLogType.Warning) return this.onWarning.apply(this, params);
	else if(type === Consts.SysLogType.Error) return this.onError.apply(this, params);
}


/**
 * 请求时间日志
 * @param serverId
 * @param api
 * @param code
 * @param uid
 * @param uname
 * @param time
 * @param msg
 * @param resp
 */
pro.onRequest = function(serverId, api, code, uid, uname, time, msg, resp){
	requestLogger.info('[%s] Code:%d Time:%dms Api:%s Uid:%s UName:%s Msg:%j Resp:%j', serverId, code, time, api, uid, uname, msg, resp);
	allLogger.info('[%s] Code:%d Time:%dms Api:%s Uid:%s UName:%s Msg:%j Resp:%j', serverId, code, time, api, uid, uname, msg, resp);
}

/**
 * 事件触发日志
 * @param serverId
 * @param api
 * @param object
 */
pro.onEvent = function(serverId, api, object){
	allLogger.info('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
}

/**
 * 一般错误触发日志
 * @param serverId
 * @param api
 * @param object
 * @param stack
 */
pro.onWarning = function(serverId, api, object, stack){
	warningLogger.warn('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
	warningLogger.warn(_.isString(stack) ? stack : '')
	errorsLogger.warn('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
	errorsLogger.warn(_.isString(stack) ? stack : '')
	allLogger.warn('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
	allLogger.warn(_.isString(stack) ? stack : '')
	if(this.serverConfig.env === Consts.GameEnv.Production){
		mailWarningLogger.warn('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
		mailWarningLogger.warn(_.isString(stack) ? stack : '')
	}
}

/**
 * 事件触发错误日志
 * @param serverId
 * @param api
 * @param object
 * @param stack
 */
pro.onError = function(serverId, api, object, stack){
	errorLogger.error('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
	errorLogger.error(_.isString(stack) ? stack : '')
	errorsLogger.error('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
	errorsLogger.error(_.isString(stack) ? stack : '')
	allLogger.error('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
	allLogger.error(_.isString(stack) ? stack : '')
	if(this.app.env.indexOf('local-') === -1){
		mailErrorLogger.error('[' + serverId + '] ' + api + ":" + " %j", _.isObject(object) ? object : {})
		mailErrorLogger.error(_.isString(stack) ? stack : '');
	}
}