"use strict"

/**
 * Created by modun on 14-7-29.
 */

var _ = require("underscore")
var ShortId = require('shortid');
var Promise = require('bluebird');

var DataUtils = require("../../../utils/dataUtils")
var ErrorUtils = require("../../../utils/errorUtils")
var Consts = require("../../../consts/consts")
var Define = require("../../../consts/define")

module.exports = function(app){
	return new CacheRemote(app)
}

var CacheRemote = function(app){
	this.app = app
	this.logService = app.get('logService');
	this.channelService = app.get('channelService')
	this.cacheService = app.get('cacheService');
	this.pushService = app.get('pushService');
	this.Player = app.get('Player');
	this.ServerState = app.get('ServerState');

	this.timeEventService = app.get('timeEventService');
	this.playerApiService = app.get("playerApiService")
	this.playerApiService2 = app.get("playerApiService2")
	this.playerApiService3 = app.get("playerApiService3")
	this.playerApiService4 = app.get("playerApiService4")
	this.playerApiService5 = app.get("playerApiService5")
	this.playerApiService6 = app.get("playerApiService6")
	this.playerIAPService = app.get("playerIAPService")
	this.allianceApiService = app.get("allianceApiService")
	this.allianceApiService2 = app.get("allianceApiService2")
	this.allianceApiService3 = app.get("allianceApiService3")
	this.allianceApiService4 = app.get("allianceApiService4")
	this.allianceApiService5 = app.get("allianceApiService5")
	this.cacheServerId = app.getServerId();
	this.apiMap = {}
	var self = this
	var services = [this.playerApiService, this.playerApiService2, this.playerApiService3, this.playerApiService4, this.playerApiService5, this.playerApiService6,
		this.playerIAPService, this.allianceApiService, this.allianceApiService2, this.allianceApiService3, this.allianceApiService4, this.allianceApiService5
	]
	_.each(services, function(service){
		if(!_.isObject(service)) return
		var properties = Object.getPrototypeOf(service)
		_.each(properties, function(value, key){
			if(_.isFunction(value)){
				if(_.isObject(self.apiMap[key])){
					throw new Error("api名称重复:" + key)
				}else
					self.apiMap[key] = service;
			}
		})
	})
}

var pro = CacheRemote.prototype

/**
 * 获取当前服务器信息
 * @param callback
 */
pro.getServerInfo = function(callback){
	this.logService.onEvent('cache.cacheRemote.getServerInfo');

	var self = this;
	var bigMapLength = DataUtils.getAllianceIntInit('bigMapLength');
	var centerLocation = {x:Math.floor(bigMapLength / 2), y:Math.floor(bigMapLength / 2)};
	var mapIndex = centerLocation.x + (centerLocation.y * bigMapLength);
	var allianceData = this.cacheService.getMapDataAtIndex(mapIndex).allianceData;
	var info = {}
	info.serverId = this.cacheServerId;
	this.cacheService.getPlayerModel().countAsync({
		serverId:self.cacheServerId,
		lastActiveTime:{$gt:Date.now() - (24 * 60 * 60 * 1000)}
	}).then(function(count){
		info.activeCount = count;
		if(!!allianceData){
			return self.cacheService.findAllianceAsync(allianceData.id).then(function(doc){
				info.alliance = {
					id:doc.basicInfo._id,
					name:doc.basicInfo.name,
					tag:doc.basicInfo.tag,
					country:doc.basicInfo.country
				}
			})
		}else{
			info.alliance = null;
		}
	}).then(function(){
		return self.ServerState.findByIdAsync(self.cacheServerId, 'openAt');
	}).then(function(doc){
		info.openAt = doc.openAt;
	}).catch(function(e){
		self.logService.onError('cache.cacheRemote.getServerInfo', {}, e.stack);
	}).finally(function(){
		callback(null, info);
	})
}

/**
 * 处理前端服务器发来的请求
 * @param api
 * @param params
 * @param callback
 */
pro.request = function(api, params, callback){
	var self = this;
	var service = self.apiMap[api];
	var e = null;
	setImmediate(function(){
		if(self.app.get("serverStatus") !== Consts.ServerStatus.On){
			e = ErrorUtils.serverUnderMaintain();
			self.logService.onWarning('cache.cacheRemote.request', {api:api, params:params}, e.stack);
			return callback(null, {code:e.code, data:e.message});
		}
		if(!_.isObject(service)){
			e = new Error('后端Api 不存在');
			self.logService.onError('cache.cacheRemote.request', {api:api, params:params}, e.stack);
			return callback(null, {code:500, data:e.message});
		}
		service[api + 'Async'].apply(service, Array.prototype.slice.call(params, 0)).then(function(data){
			callback(null, {code:200, data:data});
		}).catch({isLegal:true}, function(e){
			callback(null, {code:e.code, data:e.message});
		}).catch(function(e){
			if(!!e.code){
				self.logService.onWarning('cache.cacheRemote.request', {api:api, params:params}, e.stack);
				callback(null, {code:e.code, data:e.message});
			}else{
				self.logService.onError('cache.cacheRemote.request', {api:api, params:params}, e.stack);
				callback(null, {code:500, data:e.message});
			}
		});
	});
};