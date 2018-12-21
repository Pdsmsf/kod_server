"use strict"

/**
 * Created by modun on 14-8-9.
 */
var _ = require("underscore");
var Promise = require("bluebird");
var jsonfile = require('jsonfile');

var Consts = require("../../consts/consts");
var LogService = require("../../services/logService");
var Player = require("../../domains/player");
var Alliance = require("../../domains/alliance");
var Mod = require("../../domains/mod");
var ModLog = require("../../domains/modLog");
var Muted = require("../../domains/muted");
var Baned = require("../../domains/baned");

var life = module.exports;

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
	app.set('chatsFile', app.getBase() + '/config/globalChats-' + app.env + '.json');
	app.set('allianceChats', {});
	app.set('allianceFights', {});
	app.set('allianceFightChats', {});
	app.set('chats', []);
	app.set("logService", new LogService(app));
	app.set("Player", Promise.promisifyAll(Player));
	app.set("Alliance", Promise.promisifyAll(Alliance));
	app.set("Mod", Mod);
	app.set("ModLog", ModLog);
	app.set("Muted", Muted);
	app.set("Baned", Baned);

	callback();
}

life.afterStartup = function(app, callback){
	app.get("logService").onEvent("server started", {serverId:app.getServerId()});
	var chatsFile = app.get('chatsFile');
	jsonfile.readFile(chatsFile, function(e, docs){
		if(!!e) return callback();
		var chats = app.get('chats');
		_.each(docs, function(doc){
			chats.push(doc);
		})
		app.set("serverStatus", Consts.ServerStatus.On);
		callback();
	})
}

life.beforeShutdown = function(app, callback, cancelShutDownTimer){
	app.set("serverStatus", Consts.ServerStatus.Stoping);
	cancelShutDownTimer();
	var chatsFile = app.get('chatsFile');
	jsonfile.writeFile(chatsFile, app.get('chats'), {spaces:2}, function(){
		app.get("logService").onEvent("server stoped", {serverId:app.getServerId()});
		setTimeout(callback, 1000);
	});
};

life.afterStartAll = function(app){

}