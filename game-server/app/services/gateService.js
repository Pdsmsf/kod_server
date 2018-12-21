"use strict"

/**
 * Created by modun on 15/3/19.
 */

var _ = require("underscore")
var Promise = require("bluebird")

var GateService = function(app){
	this.app = app
	this.serverId = app.getServerId()
	this.logService = app.get("logService")
}
module.exports = GateService
var pro = GateService.prototype

/**
 * 获取推荐的逻辑服务器
 * @returns {*}
 */
pro.getLogicServer = function(cacheServerId){
	var cacheServer = _.find(this.app.getServersByType("cache"), function(server){
		return server.id === cacheServerId;
	})
	if(!cacheServer) return null;

	var logicServers = _.filter(this.app.getServersByType("logic"), function(server){
		return server.host === cacheServer.host;
	})
	return logicServers.length > 0 ? logicServers[_.random(0, logicServers.length - 1)] : null;
}

/**
 * 获取推荐的服务器
 * @returns {*}
 */
pro.getPromotedServer = function(){
	var SortFunc = function(objects){
		var totalWeight = 0;
		_.each(objects, function(object){
			totalWeight += object.weight + 1;
		});

		_.each(objects, function(object){
			var weight = object.weight + 1 + (Math.random() * totalWeight << 0)
			object.weight = weight;
		});

		return _.sortBy(objects, function(object){
			return -object.weight;
		});
	};

	var servers = this.app.getServersByType("cache");
	servers = _.sortBy(servers, function(server){
		return -server.port;
	});
	var _servers = null;
	if(servers.length > 1){
		_servers = [servers[0], servers[1]];
		_servers[0].weight = 3;
		_servers[1].weight = 7;
		_servers = SortFunc(_servers);
	}else{
		_servers = servers;
	}

	return _servers.length > 0 ? _servers[0] : null;
};