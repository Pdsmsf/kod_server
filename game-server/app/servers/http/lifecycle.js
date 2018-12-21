"use strict";

/**
 * Created by modun on 14-8-9.
 */
var _ = require("underscore");
var P = require("bluebird");
var mds = require('mongo-dump-stream');
var ALY = require('aliyun-sdk');

var Consts = require("../../consts/consts");
var LogService = require("../../services/logService");

var Player = require("../../domains/player");
var Alliance = require("../../domains/alliance");
var Billing = require("../../domains/billing");
var Device = require("../../domains/device");
var GemChange = require("../../domains/gemChange");
var GemAdd = require("../../domains/gemAdd");
var Analyse = require("../../domains/analyse");
var DailyReport = require("../../domains/dailyReport");
var Mod = require("../../domains/mod");
var ModLog = require("../../domains/modLog");
var Muted = require("../../domains/muted");
var Baned = require("../../domains/baned");
var LoginLog = require("../../domains/loginLog");

var life = module.exports;

life.beforeStartup = function(app, callback){
	var servers = app.getServersFromConfig();
	_.each(servers, function(server, id){
		if(_.isEqual(server.serverType, "gate")){
			app.set("getServerId", id);
		}else if(_.isEqual(server.serverType, "chat")){
			app.set("chatServerId", id);
		}else if(_.isEqual(server.serverType, "rank")){
			app.set("rankServerId", id);
		}else if(_.isEqual(server.serverType, "http")){
			app.set("httpServerId", id);
		}
	});

	app.set("Player", P.promisifyAll(Player));
	app.set("Alliance", P.promisifyAll(Alliance));
	app.set("Billing", P.promisifyAll(Billing));
	app.set("Device", P.promisifyAll(Device));
	app.set("GemChange", P.promisifyAll(GemChange));
	app.set("GemAdd", P.promisifyAll(GemAdd));
	app.set("Analyse", P.promisifyAll(Analyse));
	app.set("DailyReport", P.promisifyAll(DailyReport));
	app.set("Mod", Mod);
	app.set("ModLog", ModLog);
	app.set("Muted", Muted);
	app.set("Baned", Baned);
	app.set("LoginLog", LoginLog);


	app.set("logService", new LogService(app));
	app.set("gmChats", {});
	app.set("gmChatMaxLength", 20);

	callback();
};

life.afterStartup = function(app, callback){
	app.get("logService").onEvent("server started", {serverId:app.getServerId()});
	app.set("serverStatus", Consts.ServerStatus.On);
	callback();

	var serverConfig = app.get('serverConfig');
	if(!serverConfig.mongoBackup.isEnable){
		return;
	}
	var getArchiveName = function(){
		var date = new Date();
		var datestring = [
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds()
		];
		return datestring.join('_') + '.bson';
	};

	(function backupMongo(){
		setTimeout(function(){
			app.get("logService").onEvent('mongo backup start');
			var ossStream = require('aliyun-oss-upload-stream')(new ALY.OSS(serverConfig.mongoBackup.ossConfig));
			var upload = ossStream.upload({
				Bucket:serverConfig.mongoBackup.bucket,
				Key:serverConfig.dbName + '/' + getArchiveName()
			});
			upload.on('error', function(e){
				app.get("logService").onError('mongo backup error', serverConfig.mongoBackup.ossConfig, e.stack);
			});

			upload.on('part', function(part){
				app.get("logService").onEvent('mongo backup finish part', part);
			});

			upload.on('uploaded', function(details){
				app.get("logService").onEvent('mongo backup finished', details);
				backupMongo();
			});
			if(app.get('mongoose').connection.readyState !== 1){
				return;
			}
			mds.dump(app.get('mongoose').connection.db, upload, function(e){
				if(!!e){
					app.get("logService").onError('mongo backup error', serverConfig.mongoBackup.ossConfig, e.stack);
				}
				upload.end();
			});
		}, 1000 * 60 * 60 * 4);
	})();
};

life.beforeShutdown = function(app, callback){
	app.set("serverStatus", Consts.ServerStatus.Stoping);
	app.get("logService").onEvent("server stoped", {serverId:app.getServerId()});
	setTimeout(callback, 1000);
};

life.afterStartAll = function(app){

};