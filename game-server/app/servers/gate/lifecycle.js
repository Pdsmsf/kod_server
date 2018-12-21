"use strict"

/**
 * Created by modun on 14-8-9.
 */
var _ = require("underscore")
var Promise = require("bluebird")

var Consts = require("../../consts/consts");
var Player = require("../../domains/player")
var Device = require("../../domains/device")
var LoginLog = require("../../domains/loginLog")
var LogService = require("../../services/logService")
var GateService = require("../../services/gateService")

var life = module.exports

life.beforeStartup = function(app, callback){
	var servers = app.getServersFromConfig()
	_.each(servers, function(server, id){
		if(_.isEqual(server.serverType, "gate")){
			app.set("getServerId", id)
		}else if(_.isEqual(server.serverType, "chat")){
			app.set("chatServerId", id)
		}else if(_.isEqual(server.serverType, "rank")){
			app.set("rankServerId", id)
		}else if(_.isEqual(server.serverType, "http")){
			app.set("httpServerId", id)
		}
	})

	app.set("Player", Promise.promisifyAll(Player))
	app.set("Device", Promise.promisifyAll(Device))
	app.set("LoginLog", Promise.promisifyAll(LoginLog))
	app.set("logService", new LogService(app))
	app.set("gateService", Promise.promisifyAll(new GateService(app)))

	callback()
}

life.afterStartup = function(app, callback){
	app.get("logService").onEvent("server started", {serverId:app.getServerId()})
	app.set("serverStatus", Consts.ServerStatus.On);
	callback()
}

life.beforeShutdown = function(app, callback){
	app.set("serverStatus", Consts.ServerStatus.Stoping);
	app.get("logService").onEvent("server stoped", {serverId:app.getServerId()})
	setTimeout(callback, 1000)
}

life.afterStartAll = function(app){
}