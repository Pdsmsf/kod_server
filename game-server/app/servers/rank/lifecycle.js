"use strict"

/**
 * Created by modun on 14-8-9.
 */
var _ = require("underscore")
var Promise = require("bluebird")
var mongoose = require('mongoose')

var Consts = require("../../consts/consts");
var LogService = require("../../services/logService")
var RankService = require("../../services/rankService")
var Player = require("../../domains/player")
var Alliance = require("../../domains/alliance")

var life = module.exports

life.beforeStartup = function(app, callback){
	var cacheServerIds = [];
	_.each(app.getServersFromConfig(), function(server, id){
		if(_.isEqual(server.serverType, "gate")){
			app.set("getServerId", id)
		}else if(_.isEqual(server.serverType, "chat")){
			app.set("chatServerId", id)
		}else if(_.isEqual(server.serverType, "rank")){
			app.set("rankServerId", id)
		}else if(_.isEqual(server.serverType, "http")){
			app.set("httpServerId", id)
		}else if(_.isEqual(server.serverType, 'cache')){
			cacheServerIds.push(id);
		}
	})
	app.set('cacheServerIds', cacheServerIds);

	app.set("Player", Promise.promisifyAll(Player))
	app.set("Alliance", Promise.promisifyAll(Alliance))

	app.set("logService", new LogService(app))
	app.set("rankService", Promise.promisifyAll(new RankService(app)))

	callback()
}

life.afterStartup = function(app, callback){
	app.get("logService").onEvent("server started", {serverId:app.getServerId()})
	app.set("serverStatus", Consts.ServerStatus.On);
	callback();

	Promise.fromCallback(function(callback){
		(function checkConnection(){
			if(mongoose.connection.readyState === 1) return callback();
			return setTimeout(checkConnection, 1000);
		})();
	}).then(function(){
		app.get("rankService").init();
	})
}

life.beforeShutdown = function(app, callback){
	app.set("serverStatus", Consts.ServerStatus.Stoping);
	app.get("logService").onEvent("server stoped", {serverId:app.getServerId()})
	setTimeout(callback, 1000);
}

life.afterStartAll = function(app){

}