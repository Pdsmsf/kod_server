"use strict"

/**
 * Created by modun on 14-8-9.
 */
var _ = require("underscore")
var Promise = require("bluebird")
var mongoose = require('mongoose')

var DataUtils = require('../../utils/dataUtils');
var LogicUtils = require("../../utils/logicUtils")
var LogService = require("../../services/logService")
var PushService = require("../../services/pushService")
var RemotePushService = require("../../services/remotePushService")
var CacheService = require("../../services/cacheService")
var DataService = require("../../services/dataService")
var ActivityService = require("../../services/activityService")
var TimeEventService = require("../../services/timeEventService")
var PlayerTimeEventService = require("../../services/playerTimeEventService")
var AllianceTimeEventService = require("../../services/allianceTimeEventService")
var CacheLifecycleService = require("../../services/cacheLifecycleService");
var PlayerApiService = require("../../services/playerApiService")
var PlayerApiService2 = require("../../services/playerApiService2")
var PlayerApiService3 = require("../../services/playerApiService3")
var PlayerApiService4 = require("../../services/playerApiService4")
var PlayerApiService5 = require("../../services/playerApiService5")
var PlayerApiService6 = require("../../services/playerApiService6")
var PlayerIAPService = require("../../services/playerIAPService")
var AllianceApiService = require("../../services/allianceApiService")
var AllianceApiService2 = require("../../services/allianceApiService2")
var AllianceApiService3 = require("../../services/allianceApiService3")
var AllianceApiService4 = require("../../services/allianceApiService4")
var AllianceApiService5 = require("../../services/allianceApiService5")
var Consts = require("../../consts/consts");

var ServerState = require("../../domains/serverState")
var Deal = require("../../domains/deal")
var Billing = require("../../domains/billing")
var GemChange = require("../../domains/gemChange")
var GemAdd = require("../../domains/gemAdd")
var Device = require("../../domains/device")
var Player = require("../../domains/player")
var Alliance = require("../../domains/alliance")
var Country = require("../../domains/country")
var Analyse = require("../../domains/analyse")
var DailyReport = require("../../domains/dailyReport")
var Mod = require("../../domains/mod");
var ModLog = require("../../domains/modLog");
var Muted = require("../../domains/muted");
var Baned = require("../../domains/baned");

var life = module.exports;

life.beforeStartup = function(app, callback){
	app.set('onlineCount', 0)
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

	app.set("ServerState", Promise.promisifyAll(ServerState))
	app.set("Deal", Promise.promisifyAll(Deal))
	app.set("Billing", Promise.promisifyAll(Billing))
	app.set("GemChange", Promise.promisifyAll(GemChange))
	app.set("GemAdd", Promise.promisifyAll(GemAdd))
	app.set("Device", Promise.promisifyAll(Device))
	app.set("Player", Promise.promisifyAll(Player))
	app.set("Alliance", Promise.promisifyAll(Alliance))
	app.set("Country", Promise.promisifyAll(Country))
	app.set("Analyse", Promise.promisifyAll(Analyse));
	app.set("DailyReport", Promise.promisifyAll(DailyReport));
	app.set("Mod", Mod);
	app.set("ModLog", ModLog);
	app.set("Muted", Muted);
	app.set("Baned", Baned);

	app.set("logService", new LogService(app))
	app.set("pushService", Promise.promisifyAll(new PushService(app)))
	app.set("remotePushService", new RemotePushService(app))
	app.set("timeEventService", Promise.promisifyAll(new TimeEventService(app)))
	app.set("cacheService", Promise.promisifyAll(new CacheService(app)))
	app.set("dataService", Promise.promisifyAll(new DataService(app)))
	app.set('activityService', Promise.promisifyAll(new ActivityService(app)));
	app.set("playerTimeEventService", Promise.promisifyAll(new PlayerTimeEventService(app)))
	app.set("allianceTimeEventService", Promise.promisifyAll(new AllianceTimeEventService(app)))
	app.set("cacheLifecycleService", Promise.promisifyAll(new CacheLifecycleService(app)))
	app.set("playerApiService", Promise.promisifyAll(new PlayerApiService(app)))
	app.set("playerApiService2", Promise.promisifyAll(new PlayerApiService2(app)))
	app.set("playerApiService3", Promise.promisifyAll(new PlayerApiService3(app)))
	app.set("playerApiService4", Promise.promisifyAll(new PlayerApiService4(app)))
	app.set("playerApiService5", Promise.promisifyAll(new PlayerApiService5(app)))
	app.set("playerApiService6", Promise.promisifyAll(new PlayerApiService6(app)))
	app.set("playerIAPService", Promise.promisifyAll(new PlayerIAPService(app)))
	app.set("allianceApiService", Promise.promisifyAll(new AllianceApiService(app)))
	app.set("allianceApiService2", Promise.promisifyAll(new AllianceApiService2(app)))
	app.set("allianceApiService3", Promise.promisifyAll(new AllianceApiService3(app)))
	app.set("allianceApiService4", Promise.promisifyAll(new AllianceApiService4(app)))
	app.set("allianceApiService5", Promise.promisifyAll(new AllianceApiService5(app)))

	callback()
}

life.afterStartup = function(app, callback){
	app.get("logService").onEvent("server started", {serverId:app.getServerId()})
	callback();

	var logService = app.get("logService");
	var cacheService = app.get("cacheService");
	var timeEventService = app.get("timeEventService");
	var activityService = app.get('activityService');
	var cacheLifecycleService = app.get('cacheLifecycleService');

	Promise.fromCallback(function(callback){
		(function checkConnection(){
			if(mongoose.connection.readyState === 1) return callback();
			return setTimeout(checkConnection, 1000);
		})();
	}).then(function(){
		return cacheLifecycleService.setServerStateDataAsync();
	}).then(function(){
		return cacheLifecycleService.updateAnalyseDatasAsync(LogicUtils.getTodayDateTime())
	}).then(function(){
		return cacheLifecycleService.updateDailyReportAsync()
	}).then(function(){
		//return cacheLifecycleService.kickZombiePlayersFromAllianceAsync();
	}).then(function(){
		return cacheLifecycleService.deleteZombiePlayersAsync();
	}).then(function(){
		return cacheLifecycleService.deleteEmptyAlliancesAsync();
	}).then(function(){
		return Muted.remove({finishTime:{$lte:Date.now()}});
	}).then(function(){
		return Baned.remove({finishTime:{$lte:Date.now()}});
	}).then(function(){
		return activityService.initAsync();
	}).then(function(){
		return cacheLifecycleService.updateBigMapDataAsync();
	}).then(function(){
		return cacheLifecycleService.updateCountryDataAsync();
	}).then(function(){
		return cacheLifecycleService.restoreAllianceEventsAsync();
	}).then(function(){
		var analyseInterval = 1000 * 60 * 10;
		(function analyseAtTime(){
			setTimeout(function(){
				cacheLifecycleService.updateAnalyseDatasAsync(LogicUtils.getTodayDateTime()).then(function(){
					return cacheLifecycleService.updateDailyReportAsync();
				}).then(function(){
					analyseAtTime();
				}).catch(function(e){
					logService.onError("cache.lifecycle.afterStartup.analyseAtTime", null, e.stack)
				})
			}, analyseInterval)
		})();
		return Promise.resolve();
	}).then(function(){
		app.set("serverStatus", Consts.ServerStatus.On);
	}).then(function(){
		logService.onEvent("restore data finished", {serverId:app.getServerId()})
	}).catch(function(e){
		logService.onError("restore data finished with error", {serverId:app.getServerId()}, e.stack)
	})
}

life.beforeShutdown = function(app, callback, cancelShutDownTimer){
	app.set("serverStatus", Consts.ServerStatus.Stoping);
	cancelShutDownTimer();
	var cacheService = app.get('cacheService');
	var playerApiService = app.get('playerApiService');
	app.get("timeEventService").clearAllTimeEventsAsync().then(function(){
		var onlineUsers = _.filter(cacheService.players, function(player){
			return !!player.doc.logicServerId;
		})
		return Promise.fromCallback(function(callback){
			(function logoutPlayer(){
				if(onlineUsers.length === 0) return callback();
				var playerDoc = onlineUsers.pop().doc;
				var logicServerId = playerDoc.logicServerId
				playerApiService.logoutAsync(playerDoc._id, playerDoc.logicServerId, 'serverClose').then(function(){
					if(!!app.getServerById(logicServerId)){
						app.rpc.logic.logicRemote.kickPlayer.toServer(logicServerId, playerDoc._id, "serverClose", null)
					}
					return logoutPlayer();
				}).catch(function(e){
					app.get("logService").onError('cache.lifecycle.beforeShutdown.logoutPlayer', {playerId:playerDoc._id}, e.stack);
					return logoutPlayer();
				})
			})();
		})
	}).then(function(){
		return app.get("ServerState").findByIdAndUpdateAsync(app.getServerId(), {lastStopTime:Date.now()});
	}).then(function(){
		return cacheService.timeoutAllAlliancesAsync()
	}).then(function(){
		return cacheService.timeoutAllPlayersAsync()
	}).then(function(){
		app.get("logService").onEvent("server stoped", {serverId:app.getServerId()})
		setTimeout(callback, 1000)
	}).catch(function(e){
		app.get("logService").onError("server stoped", {serverId:app.getServerId()}, e.stack)
		setTimeout(callback, 1000)
	});
}

life.afterStartAll = function(app){

}