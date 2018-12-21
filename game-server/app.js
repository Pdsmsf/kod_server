"use strict";

//TRACE, DEBUG, INFO, WARN, ERROR, FATAL
var fs = require('fs');
var pomelo = require("pomelo");
var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
var path = require("path");
var _ = require("underscore");
//var wsrpc = require("pomelo-rpc-ws")
var httpPlugin = require('pomelo-http-plugin');

var FilterService = require("./app/services/filterService");
var RouteUtils = require("./app/utils/routeUtils");

var app = pomelo.createApp()
app.set("name", "DragonFall Game Server")
//app.enable('systemMonitor');
app.route("chat", RouteUtils.chat)
app.route("logic", RouteUtils.logic)
app.route("rank", RouteUtils.rank)
app.route("cache", RouteUtils.cache)

//app.configure(function(){
//	app.set('proxyConfig', {
//		rpcClient:wsrpc.client
//	});
//	app.set('remoteConfig', {
//		rpcServer:wsrpc.server
//	});
//})
app.configure("all", "master", function(){

})

app.configure("all", "gate", function(){
	var connectorConfig = {
		connector:pomelo.connectors.hybridconnector,
		heartbeat:5,
		useDict:false,
		useProtobuf:false,
		useCrypto2:false,
		disconnectOnTimeout:true
	}

	app.set("connectorConfig", connectorConfig)

	var filterService = new FilterService(app)
	app.before(filterService.toobusyFilter())
	app.filter(filterService.requestTimeFilter())

	app.loadConfig("serverConfig", app.getBase() + "/config/" + app.get('env') + "/config.json");
	var serverConfig = app.get("serverConfig");
	var mongoUrl = serverConfig.mongoHost + '/' + serverConfig.dbName;
	var mongooseClient = mongoose.connect(mongoUrl, {server:{socketOptions:{keepAlive:1}}});
	app.set("mongoose", mongooseClient);
})

app.configure("all", "logic", function(){
	var idParams = app.serverId.split("-")
	var intId = parseInt(idParams[idParams.length - 1])
	process.NODE_UNIQUE_ID = intId

	var connectorConfig = {
		connector:pomelo.connectors.hybridconnector,
		heartbeat:60,
		useDict:true,
		useProtobuf:false,
		useCrypto2:false,
		disconnectOnTimeout:true
	};
	app.set("connectorConfig", connectorConfig)

	var filterService = new FilterService(app)
	app.before(filterService.toobusyFilter())
	app.before(filterService.loginFilter())
	app.before(filterService.initFilter());
	app.filter(filterService.requestTimeFilter())

	app.loadConfig("serverConfig", app.getBase() + "/config/" + app.get('env') + "/config.json");
	var serverConfig = app.get("serverConfig");
	var mongoUrl = serverConfig.mongoHost + '/' + serverConfig.dbName;
	var mongooseClient = mongoose.connect(mongoUrl, {server:{socketOptions:{keepAlive:1}}});
	app.set("mongoose", mongooseClient);
})

app.configure("all", "chat", function(){
	app.loadConfig("serverConfig", app.getBase() + "/config/" + app.get('env') + "/config.json")
	var filterService = new FilterService(app)
	app.before(filterService.toobusyFilter())
	app.before(filterService.loginFilter())
	app.before(filterService.initFilter());
	app.filter(filterService.requestTimeFilter());
	app.before(filterService.wordsFilter());

	app.loadConfig("serverConfig", app.getBase() + "/config/" + app.get('env') + "/config.json");
	var serverConfig = app.get("serverConfig");
	var mongoUrl = serverConfig.mongoHost + '/' + serverConfig.dbName;
	var mongooseClient = mongoose.connect(mongoUrl, {server:{socketOptions:{keepAlive:1}}});
	app.set("mongoose", mongooseClient);
})

app.configure("all", "cache", function(){
	app.loadConfig("serverConfig", app.getBase() + "/config/" + app.get('env') + "/config.json");
	var serverConfig = app.get("serverConfig");
	var mongoUrl = serverConfig.mongoHost + '/' + serverConfig.dbName;
	var mongooseClient = mongoose.connect(mongoUrl, {server:{socketOptions:{keepAlive:1}}});
	app.set("mongoose", mongooseClient);
})

app.configure("all", "rank", function(){
	var filterService = new FilterService(app)
	app.before(filterService.toobusyFilter())
	app.before(filterService.loginFilter())
	app.before(filterService.initFilter());
	app.filter(filterService.requestTimeFilter())

	app.loadConfig("serverConfig", app.getBase() + "/config/" + app.get('env') + "/config.json");
	var serverConfig = app.get("serverConfig");
	var mongoUrl = serverConfig.mongoHost + '/' + serverConfig.dbName;
	var mongooseClient = mongoose.connect(mongoUrl, {server:{socketOptions:{keepAlive:1}}});
	app.set("mongoose", mongooseClient);
})

app.configure("all", 'http', function(){
	app.loadConfig("serverConfig", app.getBase() + "/config/" + app.get('env') + "/config.json");
	var serverConfig = app.get("serverConfig");
	var mongoUrl = serverConfig.mongoHost + '/' + serverConfig.dbName;
	var mongooseClient = mongoose.connect(mongoUrl, {server:{socketOptions:{keepAlive:1}}});
	app.set("mongoose", mongooseClient);

	app.use(httpPlugin, {
		http:app.get('serverConfig').http
	});
});

app.set('errorHandler', function(e, msg, resp, session, opts, cb){
	cb(e, resp);
	if(e.isLegal) {
		return;
	}
	app.get("logService").onWarning("app.errorHandler", {playerId:session.uid, msg:msg}, e.stack);
	if(!_.isEmpty(e.message) && e.message.indexOf("Illegal request!") === 0){
		app.get("sessionService").kickBySessionId(session.id, 'Illegal request!', null);
	}
});

process.on("uncaughtException", function(e){
	var logService = app.get('logService');
	if(!!logService){
		logService.onError('app.uncaughtException', null, e.stack);
	}else{
		console.error("app.uncaughtException")
		console.error(e)
	}
})

process.on("unhandledRejection", function(e){
	var logService = app.get('logService');
	if(!!logService){
		logService.onError('app.unhandledRejection', null, e.stack);
	}else{
		console.error("app.unhandledRejection")
		console.error(e)
	}
});
app.start();
