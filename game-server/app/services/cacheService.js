"use strict";

/**
 * Created by modun on 15/3/6.
 */

var Promise = require("bluebird");
var _ = require("underscore");

var DataUtils = require("../utils/dataUtils");
var Consts = require("../consts/consts.js");
var Events = require('../consts/events.js');
var ErrorUtils = require("../utils/errorUtils.js");
var GameDatas = require('../datas/GameDatas.js');
var SortedArraySet = require("collections/sorted-array-set");
var AllianceMap = GameDatas.AllianceMap;

var DataService = function(app){
	this.app = app;
	this.logService = app.get("logService");
	this.timeEventService = app.get("timeEventService");
	this.cacheServerId = app.getServerId();
	this.pushService = app.get('pushService');
	this.Player = app.get("Player");
	this.Alliance = app.get("Alliance");
	this.Country = app.get('Country');
	this.channelService = app.get('channelService');
	this.players = {};
	this.playerLocks = {};
	this.alliances = {};
	this.allianceLocks = {};
	this.allianceNameMap = {};
	this.allianceTagMap = {};
	this.mapIndexMap = {};
	this.country = {
		doc:null,
		ops:0,
		lock:null
	};
	this.prestigeRank = new SortedArraySet([], function(objLeft, objRight){
		return objLeft.id === objRight.id;
	}, function(a, b){
		return a.score > b.score;
	});
	this.prestigeRankLength = 20;
	this.restigeRankCheckInterval = 10;
	this.flushOps = 5;
	this.timeoutInterval = 1000 * 59 * 5;
	this.mapViewers = {};
	this.mapIndexs = {};
	this.roundRefreshInterval = 1000 * 60 * 60 * 24;
	this.currentFreeRound = {
		bigRound:0,
		roundIndex:0
	};
	this.bigMapLength = DataUtils.getAllianceIntInit('bigMapLength');
	this.bigMap = function(self){
		var channelService = app.get('channelService');
		var mapIndexData = [];
		for(var i = 0; i < Math.pow(self.bigMapLength, 2); i++){
			mapIndexData[i] = {
				allianceData:null,
				mapData:{
					marchEvents:{
						strikeMarchEvents:{},
						strikeMarchReturnEvents:{},
						attackMarchEvents:{},
						attackMarchReturnEvents:{}
					},
					villageEvents:{}
				},
				channel:channelService.createChannel(Consts.BigMapChannelPrefix + '_' + i)
			};
		}
		return mapIndexData;
	}(this);
	setInterval(function(self){
		self.currentFreeRound.bigRound = 0;
		self.currentFreeRound.roundIndex = 0;
	}, this.roundRefreshInterval, this);
	setInterval(OnRestigeRankCheckInterval.bind(this), this.restigeRankCheckInterval);
};
module.exports = DataService;
var pro = DataService.prototype;


var OnRestigeRankCheckInterval = function(){

}

/**
 * 加入玩家请求队列
 * @param id
 */
var LockPlayer = function(id){
	if(!!this.playerLocks[id]) return false;
	this.playerLocks[id] = true;
	return true;
}

/**
 * 加入联盟请求队列
 * @param id
 */
var LockAlliance = function(id){
	if(!!this.allianceLocks[id]){
		var e = new Error("对象已被锁定")
		this.logService.onError("cache.cacheService.LockAlliance", {id:id}, e.stack)
		return false;
	}
	this.allianceLocks[id] = true
	return true;
}

/**
 * 加入国家请求队列
 */
var LockCountry = function(){
	if(!!this.country.lock) return false;
	this.country.lock = Date.now();
	return true;
}

/**
 * 从玩家请求队列移除
 * @param id
 */
var UnlockPlayer = function(id){
	if(!this.playerLocks[id]){
		var e = new Error("对象未被锁定")
		this.logService.onError("cache.cacheService.UnlockPlayer", {id:id}, e.stack)
	}else{
		this.playerLocks[id] = null;
	}
}

/**
 * 从联盟请求队列移除
 * @param id
 */
var UnlockAlliance = function(id){
	if(!this.allianceLocks[id]){
		var e = new Error("对象未被锁定")
		this.logService.onError("cache.cacheService.UnlockAlliance", {id:id}, e.stack)
	}else{
		this.allianceLocks[id] = null;
	}
}

/**
 * 从国家请求队列移除
 */
var UnlockCountry = function(){
	if(!this.country.lock){
		var e = new Error("对象未被锁定")
		this.logService.onError("cache.cacheService.UnlockCountry", null, e.stack)
	}else{
		this.country.lock = null;
	}
}

/**
 * 锁定所选数据
 * @param pairs
 * @param force
 * @param callback
 * @constructor
 */
var LockAll = function(pairs, force, callback){
	this.logService.onEvent('cache.cacheService.LockAll', pairs);
	var self = this;
	if(!callback){
		callback = force;
		force = false;
	}
	var maxTryLockTime = 10;
	var currentLockTime = 0;
	(function getLocks(){
		currentLockTime++;
		var lockPair = _.find(pairs, function(pair){
			if(pair.key === Consts.Pairs.Player){
				return !!IsPlayerLocked.call(self, pair.value) ? pair : null;
			}else if(pair.key === Consts.Pairs.Alliance){
				return !!IsAllianceLocked.call(self, pair.value) ? pair : null;
			}else if(pair.key === Consts.Pairs.Country){
				return !!IsCountryLocked.call(self) ? pair : null;
			}
		});
		if(!!lockPair){
			if(force && currentLockTime < maxTryLockTime){
				var nextTime = _.random(100, 500);
				return setTimeout(getLocks, nextTime);
			}else{
				return callback(ErrorUtils.objectIsLocked(lockPair));
			}
		}else{
			_.each(pairs, function(pair){
				if(pair.key === Consts.Pairs.Player){
					LockPlayer.call(self, pair.value);
				}else if(pair.key === Consts.Pairs.Alliance){
					LockAlliance.call(self, pair.value);
				}else if(pair.key === Consts.Pairs.Country){
					LockCountry.call(self);
				}
			});
			return callback();
		}
	})();
};

/**
 * 解锁所选数据
 * @param pairs
 * @constructor
 */
var UnlockAll = function(pairs){
	this.logService.onEvent('cache.cacheService.UnlockAll', pairs);
	var self = this;
	_.each(pairs, function(pair){
		if(pair.key === Consts.Pairs.Player){
			UnlockPlayer.call(self, pair.value);
		}else if(pair.key === Consts.Pairs.Alliance){
			UnlockAlliance.call(self, pair.value);
		}else if(pair.key === Consts.Pairs.Country){
			UnlockCountry.call(self);
		}
	})
}

/**
 * 玩家是否被锁定
 * @param id
 * @returns {boolean}
 * @constructor
 */
var IsPlayerLocked = function(id){
	return !!this.playerLocks[id];
}

/**
 * 联盟是否被锁定
 * @param id
 * @returns {boolean}
 * @constructor
 */
var IsAllianceLocked = function(id){
	return !!this.allianceLocks[id];
}

/**
 * 国家是否被锁定
 * @returns {boolean}
 * @constructor
 */
var IsCountryLocked = function(){
	return !!this.country.lock;
}

/**
 * 玩家超时
 * @param id
 */
var OnPlayerTimeout = function(id){
	var self = this;
	var player = self.players[id];
	if(!player){
		return;
	}
	player.timeout = null;
	Promise.fromCallback(function(callback){
		if(player.ops > 0){
			player.ops = 0;
			return self.Player.update({_id:id}, _.omit(player.doc, "_id"), callback);
		}
		return callback();
	}).then(function(){
		if(!!player.timeout){
			return Promise.resolve();
		}
		if(player.ops > 0 || (player.visit >= Date.now() - self.timeoutInterval) || (!!player.doc.logicServerId && !!self.app.getServerById(player.doc.logicServerId))){
			player.timeout = setTimeout(OnPlayerTimeout.bind(self), self.timeoutInterval, id);
			return Promise.resolve();
		}
		self.logService.onEvent("cache.cacheService.OnPlayerTimeout", {id:id});
		delete self.players[id];
		return self.timeEventService.clearPlayerTimeEventsAsync(player.doc);
	}).catch(function(e){
		self.logService.onError("cache.cacheService.OnPlayerTimeout", {id:id, doc:player.doc}, e.stack);
	});
};

/**
 * 联盟超时
 * @param id
 */
var OnAllianceTimeout = function(id){
	var self = this;
	var alliance = self.alliances[id];
	if(!alliance){
		return;
	}
	alliance.timeout = null;
	Promise.fromCallback(function(callback){
		if(alliance.ops > 0){
			alliance.ops = 0;
			return self.Alliance.update({_id:id}, _.omit(alliance.doc, "_id"), callback);
		}
		return callback();
	}).then(function(){
		if(!!alliance.timeout){
			return Promise.resolve();
		}
		var channelName = Consts.AllianceChannelPrefix + ":" + alliance.doc._id
		var channel = self.channelService.getChannel(channelName, false);
		var mapIndexData = self.getMapDataAtIndex(alliance.doc.mapIndex);
		var hasMemberOnline = (!!channel && !_.isEmpty(channel.records)) || (!!mapIndexData.channel && !_.isEmpty(mapIndexData.channel.records));
		if(alliance.ops > 0 || (alliance.visit >= Date.now() - self.timeoutInterval) || hasMemberOnline){
			alliance.timeout = setTimeout(OnAllianceTimeout.bind(self), self.timeoutInterval, id);
			return Promise.resolve();
		}
		self.logService.onEvent("cache.cacheService.OnAllianceTimeout", {id:id});
		delete self.alliances[id];
		return self.timeEventService.removeAllianceTempTimeEventsAsync(alliance.doc);
	}).catch(function(e){
		self.logService.onError("cache.cacheService.OnAllianceTimeout", {id:id, doc:alliance.doc}, e.stack);
	});
};

/**
 * 锁定所需数据源
 * @param pairs
 * @param [force]
 * @param callback
 */
pro.lockAll = function(pairs, force, callback){
	return LockAll.call(this, pairs, force, callback);
}

/**
 * 解锁选定对象
 * @param pairs
 * @param [callback]
 */
pro.unlockAll = function(pairs, callback){
	UnlockAll.call(this, pairs);
	if(!!callback) callback();
}

/**
 * 触发更新操作
 * @param pairs
 * @param callback
 */
pro.touchAll = function(pairs, callback){
	this.logService.onEvent('cache.cacheService.touchAll', pairs);
	var self = this;
	var i = 0;
	var e = null;
	callback();
	(function touch(){
		if(i > pairs.length - 1) return;
		var pair = pairs[i];
		i++;
		if(pair.key === Consts.Pairs.Player){
			var player = self.players[pair.value];
			if(!player) {
				e = new Error('玩家缓存数据不存在');
				self.logService.onError("cache.cacheService.updatePlayer", {id:pair.value}, e.stack);
				return touch();
			}
			player.ops += 1
			if(player.ops < self.flushOps) return touch();
			player.ops = 0
			clearTimeout(player.timeout)
			player.timeout = setTimeout(OnPlayerTimeout.bind(self), self.timeoutInterval, pair.value)
			self.Player.updateAsync({_id:pair.value}, _.omit(player.doc, "_id")).then(function(){
				self.logService.onEvent("cache.cacheService.updatePlayer", {id:pair.value});
			}).catch(function(e){
				self.logService.onError("cache.cacheService.updatePlayer", {id:pair.value, doc:player.doc}, e.stack)
			}).finally(function(){
				touch();
			})
		}else if(pair.key === Consts.Pairs.Alliance){
			var alliance = self.alliances[pair.value];
			if(!alliance) {
				e = new Error('联盟缓存数据不存在');
				self.logService.onError("cache.cacheService.updateAlliance", {id:pair.value}, e.stack);
				return touch();
			}
			alliance.ops += 1
			if(alliance.ops < self.flushOps) return touch();
			alliance.ops = 0
			clearTimeout(alliance.timeout);
			alliance.timeout = setTimeout(OnAllianceTimeout.bind(self), self.timeoutInterval, pair.value);
			self.Alliance.updateAsync({_id:pair.value}, _.omit(alliance.doc, "_id")).then(function(){
				self.logService.onEvent("cache.cacheService.updateAlliance", {id:pair.value});
			}).catch(function(e){
				self.logService.onError("cache.cacheService.updateAlliance", {id:pair.value, doc:alliance.doc}, e.stack);
			}).finally(function(){
				touch();
			})
		}else if(pair.key === Consts.Pairs.Country){
			var country = self.country
			if(!country) return touch();
			country.ops += 1
			if(country.ops < self.flushOps) return touch();
			country.ops = 0
			Promise.fromCallback(function(_callback){
				country.doc.save(_callback)
			}).catch(function(e){
				self.logService.onError("cache.cacheService.updateCountry", {doc:country.doc}, e.stack)
			}).finally(function(){
				touch();
			})
		}else{
			touch();
		}
	})();
}

/**
 * 获取玩家模型
 * @returns {*|DataService.Player}
 */
pro.getPlayerModel = function(){
	return this.Player
}

/**
 * 获取联盟模型
 * @returns {*|DataService.Alliance}
 */
pro.getAllianceModel = function(){
	return this.Alliance
}

/**
 * 获取空闲的大地图区域
 * @returns {*}
 */
pro.getFreeMapIndex = function(){
	var self = this;
	var mapIndex = null;
	var hasFound = false;
	var currentBigRound = 0;
	var currentRoundIndex = 0;
	for(var i = this.currentFreeRound.bigRound; i < AllianceMap.bigRound.length; i++){
		currentBigRound = i;
		var round = AllianceMap.bigRound[i];
		var locationFrom = {x:round.locationFromX, y:round.locationFromY};
		for(var j = self.currentFreeRound.roundIndex; j < AllianceMap.roundIndex.length; j++){
			currentRoundIndex = j;
			var index = AllianceMap.roundIndex[j];
			var x = locationFrom.x + index.x;
			var y = locationFrom.y + index.y;
			mapIndex = x + (y * self.bigMapLength);
			if(!self.bigMap[mapIndex].allianceData && !self.mapIndexMap[mapIndex]){
				hasFound = true;
				break;
			}
		}
		if(hasFound){
			break;
		}else{
			self.currentFreeRound.roundIndex = 0;
		}
	}
	if(!hasFound){
		self.currentFreeRound.bigRound = 0;
		return null;
	}else{
		self.currentFreeRound.bigRound = currentBigRound;
		return mapIndex;
	}

}

/**
 * 创建联盟对象
 * @param allianceData
 * @param callback
 */
pro.createAlliance = function(allianceData, callback){
	this.logService.onEvent('cache.cacheService.createAlliance', {id:allianceData._id})
	var self = this
	var mapIndex = self.getFreeMapIndex();
	if(!mapIndex){
		return callback(ErrorUtils.noFreeMapArea());
	}
	if(self.allianceNameMap[allianceData.basicInfo.name]){
		e = ErrorUtils.allianceNameExist(null, allianceData.basicInfo.name);
		e.isLegal = true;
		return callback(e);
	}
	if(self.allianceTagMap[allianceData.basicInfo.tag]){
		e = ErrorUtils.allianceTagExist(null, allianceData.basicInfo.tag);
		e.isLegal = true;
		return callback(e);
	}
	self.allianceNameMap[allianceData.basicInfo.name] = true
	self.allianceTagMap[allianceData.basicInfo.tag] = true
	self.mapIndexMap[mapIndex] = true;
	allianceData.mapIndex = mapIndex;
	var promise = new Promise(function(resolve, reject){
		self.Alliance.collection.find({"basicInfo.name":allianceData.basicInfo.name}, {_id:true}).count(function(e, size){
			if(_.isObject(e)) reject(e)
			else if(size > 0){
				e = ErrorUtils.allianceNameExist(null, allianceData.basicInfo.name);
				e.isLegal = true;
				reject(e);
			}
			else resolve()
		})
	})
	promise.then(function(){
		return new Promise(function(resolve, reject){
			self.Alliance.collection.find({"basicInfo.tag":allianceData.basicInfo.tag}, {_id:true}).count(function(e, size){
				if(_.isObject(e)) reject(e)
				else if(size > 0){
					e = ErrorUtils.allianceTagExist(null, allianceData.basicInfo.tag);
					e.isLegal = true;
					reject(e)
				}
				else resolve()
			})
		})
	}).then(function(){
		return self.Alliance.createAsync(allianceData)
	}).then(function(doc){
		var allianceDoc = doc.toObject();
		var alliance = {}
		alliance.doc = allianceDoc
		alliance.ops = 0
		alliance.timeout = setTimeout(OnAllianceTimeout.bind(self), self.timeoutInterval, allianceData._id)
		alliance.visit = Date.now();
		self.alliances[allianceData._id] = alliance
		self.updateMapAlliance(allianceDoc.mapIndex, allianceDoc);
		delete self.allianceNameMap[allianceData.basicInfo.name]
		delete self.allianceTagMap[allianceData.basicInfo.tag]
		delete self.mapIndexMap[mapIndex];
		callback(null, allianceDoc)
	}).catch(function(e){
		delete self.allianceNameMap[allianceData.basicInfo.name];
		delete self.allianceTagMap[allianceData.basicInfo.tag];
		delete self.mapIndexMap[mapIndex];
		callback(e)
	})
}

/**
 * 按Id查询玩家
 * @param id
 * @param callback
 */
pro.findPlayer = function(id, callback){
	this.logService.onEvent('cache.cacheService.findPlayer', {id:id})
	var self = this
	var player = self.players[id]
	if(_.isObject(player)){
		player.visit = Date.now();
		callback(null, player.doc)
	}else{
		var playerDoc = null
		self.Player.findOneAsync({_id:id, 'serverId':self.cacheServerId}).then(function(doc){
			if(!!self.players[id]){
				player = self.players[id];
				player.visit = Date.now();
				playerDoc = player.doc;
				return Promise.resolve();
			}
			if(_.isObject(doc)){
				playerDoc = doc.toObject();
				playerDoc.lastActiveTime = Date.now();
				player = {}
				player.doc = playerDoc
				player.ops = 0
				player.timeout = setTimeout(OnPlayerTimeout.bind(self), self.timeoutInterval, id)
				player.visit = Date.now();
				self.players[id] = player
				return self.timeEventService.restorePlayerTimeEventsAsync(playerDoc);
			}
		}).then(function(){
			callback(null, playerDoc)
		}).catch(function(e){
			callback(e)
		})
	}
}

/**
 * 按Id查询联盟
 * @param id
 * @param callback
 */
pro.findAlliance = function(id, callback){
	this.logService.onEvent('cache.cacheService.findAlliance', {id:id})
	var self = this
	var alliance = self.alliances[id]
	if(_.isObject(alliance)){
		alliance.visit = Date.now();
		callback(null, alliance.doc)
	}else{
		var allianceDoc = null
		self.Alliance.findOneAsync({_id:id, 'serverId':self.cacheServerId}).then(function(doc){
			if(!!self.alliances[id]){
				alliance = self.alliances[id];
				alliance.visit = Date.now();
				allianceDoc = self.alliances[id].doc;
				return Promise.resolve();
			}
			if(_.isObject(doc)){
				allianceDoc = doc.toObject();
				allianceDoc.lastActiveTime = Date.now();
				alliance = {}
				alliance.doc = allianceDoc
				alliance.ops = 0
				alliance.timeout = setTimeout(OnAllianceTimeout.bind(self), self.timeoutInterval, id)
				alliance.visit = Date.now();
				self.alliances[id] = alliance
				var monsterRefreshTime = allianceDoc.basicInfo.monsterRefreshTime - Date.now();
				var villageRefreshTime = allianceDoc.basicInfo.villageRefreshTime - Date.now();
				var minRefreshInterval = 1000 * 60;
				if(monsterRefreshTime < minRefreshInterval) monsterRefreshTime = _.random(1, 2) * 60 * 1000//_.random(1000, 2000) * 60;
				if(villageRefreshTime < minRefreshInterval) villageRefreshTime = _.random(1, 2) * 60 * 1000//_.random(1000, 2000) * 60;
				allianceDoc.basicInfo.monsterRefreshTime = Date.now() + monsterRefreshTime;
				allianceDoc.basicInfo.villageRefreshTime = Date.now() + villageRefreshTime;
				var funcs = [];
				funcs.push(self.timeEventService.addAllianceTimeEventAsync(allianceDoc, Consts.MonsterRefreshEvent, Consts.MonsterRefreshEvent, monsterRefreshTime))
				funcs.push(self.timeEventService.addAllianceTimeEventAsync(allianceDoc, Consts.VillageRefreshEvent, Consts.VillageRefreshEvent, villageRefreshTime))
				return Promise.all(funcs);
			}
		}).then(function(){
			callback(null, allianceDoc)
		}).catch(function(e){
			callback(e)
		})
	}
}

/**
 * 查询国家
 * @param callback
 */
pro.findCountry = function(callback){
	this.logService.onEvent('cache.cacheService.findCountry')
	callback(null, this.country.doc)
}

/**
 * 更新玩家对象并同步到Mongo
 * @param id
 * @param callback
 */
pro.flushPlayer = function(id, callback){
	this.logService.onEvent('cache.cacheService.flushPlayer', {id:id})
	var self = this
	var player = this.players[id]
	player.ops = 0
	clearTimeout(player.timeout)
	player.timeout = setTimeout(OnPlayerTimeout.bind(self), self.timeoutInterval, id);
	this.Player.updateAsync({_id:id}, _.omit(player.doc, "_id")).then(function(){
		callback()
	}).catch(function(e){
		self.logService.onError("cache.cacheService.flushPlayer", {id:id, doc:player.doc}, e.stack)
		callback()
	})
}

/**
 * 更新玩家对象并同步到Mongo
 * @param id
 * @param callback
 */
pro.flushAlliance = function(id, callback){
	this.logService.onEvent('cache.cacheService.flushAlliance', {id:id})
	var self = this
	var alliance = this.alliances[id]
	alliance.ops = 0
	clearTimeout(alliance.timeout);
	alliance.timeout = setTimeout(OnAllianceTimeout.bind(self), self.timeoutInterval, id);
	this.Alliance.updateAsync({_id:id}, _.omit(alliance.doc, "_id")).then(function(){
		callback()
	}).catch(function(e){
		self.logService.onError("cache.cacheService.flushAlliance", {id:id, doc:alliance.doc}, e.stack)
		callback()
	})
}

/**
 * 立即更新国家对象
 * @param callback
 */
pro.flushCountry = function(callback){
	this.logService.onEvent('cache.cacheService.flushCountry')
	var self = this
	var country = this.country;
	country.ops = 0
	Promise.fromCallback(function(callback){
		country.doc.save(callback);
	}).then(function(){
		callback()
	}).catch(function(e){
		self.logService.onError("cache.cacheService.flushCountry", {doc:country.doc}, e.stack)
		callback()
	})
}

/**
 * 更新玩家并同步到Mongo最后将玩家从内存移除
 * @param id
 * @param callback
 */
pro.timeoutPlayer = function(id, callback){
	var self = this
	var player = this.players[id]
	clearTimeout(player.timeout)
	delete self.players[id]
	this.timeEventService.clearPlayerTimeEventsAsync(player.doc);
	self.Player.updateAsync({_id:id}, _.omit(player.doc, "_id")).then(function(){
		self.logService.onEvent("cache.cacheService.timeoutPlayer", {id:id})
		callback()
	}).catch(function(e){
		self.logService.onError("cache.cacheService.timeoutPlayer", {id:id, doc:player.doc}, e.stack)
		callback()
	})
}

/**
 * 更新联盟并同步到Mongo最后将联盟从内存移除
 * @param id
 * @param callback
 */
pro.timeoutAlliance = function(id, callback){
	var self = this
	var alliance = this.alliances[id]
	clearTimeout(alliance.timeout)
	delete self.alliances[id]
	this.timeEventService.removeAllianceTempTimeEventsAsync(alliance.doc)
	self.Alliance.updateAsync({_id:id}, _.omit(alliance.doc, "_id")).then(function(){
		self.logService.onEvent("cache.cacheService.timeoutAlliance", {id:id})
		callback()
	}).catch(function(e){
		self.logService.onError("cache.cacheService.timeoutAlliance", {id:id, doc:alliance.doc}, e.stack)
		callback()
	})
}

/**
 * 删除联盟
 * @param id
 * @param callback
 */
pro.deleteAlliance = function(id, callback){
	var self = this
	var alliance = this.alliances[id]
	clearTimeout(alliance.timeout)
	delete self.alliances[id]
	this.timeEventService.removeAllianceTempTimeEventsAsync(alliance.doc);
	self.Alliance.removeAsync({_id:id}).then(function(){
		self.logService.onEvent('cache.cacheService.deleteAlliance', {id:id})
		callback()
	}).catch(function(e){
		self.logService.onError("cache.cacheService.deleteAlliance", {id:id}, e.stack)
		callback();
	});
}

/**
 * 更新所有玩家并同步到Mongo最后将玩家从内存移除
 * @param callback
 */
pro.timeoutAllPlayers = function(callback){
	var self = this
	var timeoutPlayer = function(player, callback){
		if(player.ops > 0){
			player.ops = 0
			self.Player.updateAsync({_id:player.doc._id}, _.omit(player.doc, "_id")).then(function(){
				self.logService.onEvent("cache.cacheService.timeoutPlayer", {id:player.doc._id})
				callback()
			}).catch(function(e){
				self.logService.onError("cache.cacheService.timeoutPlayer", {id:player.doc._id, doc:player.doc}, e.stack)
				callback()
			})
		}else{
			self.logService.onEvent("cache.cacheService.timeoutPlayer", {id:player.doc._id})
			callback()
		}
	}
	var timeoutPlayerAsync = Promise.promisify(timeoutPlayer, {context:this})
	var players = _.values(this.players)
	_.each(players, function(player){
		clearTimeout(player.timeout)
	});

	(function excuteTimeout(){
		if(players.length > 0){
			timeoutPlayerAsync(players.shift()).then(function(){
				excuteTimeout()
			})
		}else{
			callback()
		}
	})()
}

/**
 * 更新所有联盟并同步到Mongo最后将联盟从内存移除
 * @param callback
 */
pro.timeoutAllAlliances = function(callback){
	var self = this
	var timeoutAlliance = function(alliance, callback){
		if(alliance.ops > 0){
			alliance.ops = 0
			self.Alliance.updateAsync({_id:alliance.doc._id}, _.omit(alliance.doc, "_id")).then(function(){
				self.logService.onEvent("cache.cacheService.timeoutAlliance", {id:alliance.doc._id})
				callback()
			}).catch(function(e){
				self.logService.onError("cache.cacheService.timeoutAlliance", {
					id:alliance.doc._id,
					doc:alliance.doc
				}, e.stack)
				callback()
			})
		}else{
			self.logService.onEvent("cache.cacheService.timeoutAlliance", {id:alliance.doc._id})
			callback()
		}
	}
	var timeoutAllianceAsync = Promise.promisify(timeoutAlliance, {context:this})
	var alliances = _.values(this.alliances)
	_.each(alliances, function(alliance){
		clearTimeout(alliance.timeout)
	});

	(function excuteTimeout(){
		if(alliances.length > 0){
			timeoutAllianceAsync(alliances.shift()).then(function(){
				excuteTimeout()
			})
		}else{
			callback()
		}
	})()
}

/**
 * 玩家是否在缓存
 * @param playerId
 */
pro.isPlayerInCache = function(playerId){
	return !!this.players[playerId];
}

/**
 * 联盟是否在缓存
 * @param allianceId
 */
pro.isAllianceInCache = function(allianceId){
	return !!this.alliances[allianceId];
}


/**
 * 获取大地图地形数据
 * @returns {{}|*}
 */
pro.getMapIndexs = function(){
	return this.mapIndexs;
}

/**
 * 获取地图Map
 * @param index
 * @returns {*}
 */
pro.getMapDataAtIndex = function(index){
	return this.bigMap[index];
}

/**
 * 更新地图联盟对象
 * @param index
 * @param allianceDoc
 * @param [callback]
 */
pro.updateMapAlliance = function(index, allianceDoc, callback){
	var self = this;
	var mapIndexData = this.bigMap[index];
	if(!!allianceDoc){
		var status = (function(){
			if(allianceDoc.basicInfo.status === Consts.AllianceStatus.Prepare || allianceDoc.basicInfo.status === Consts.AllianceStatus.Fight){
				return allianceDoc._id === allianceDoc.allianceFight.attacker.alliance.id
					? allianceDoc.basicInfo.status + '__' + allianceDoc.allianceFight.defencer.alliance.mapIndex
					: allianceDoc.basicInfo.status + '__' + allianceDoc.allianceFight.attacker.alliance.mapIndex;
			}
			return allianceDoc.basicInfo.status;
		})();
		mapIndexData.allianceData = {
			id:allianceDoc._id,
			name:allianceDoc.basicInfo.name,
			tag:allianceDoc.basicInfo.tag,
			flag:allianceDoc.basicInfo.flag,
			country:allianceDoc.basicInfo.country,
			terrain:allianceDoc.basicInfo.terrain,
			status:status
		};
		this.mapIndexs[index] = AllianceMap.terrainStyle[allianceDoc.basicInfo.terrain + '_' + allianceDoc.basicInfo.terrainStyle].index
	}else{
		var eventName = Events.alliance.onAllianceDataChanged;
		if(!!mapIndexData.allianceData){
			var uids = _.values(mapIndexData.channel.records);
			if(uids.length > 0){
				self.channelService.pushMessageByUids(eventName, {
					targetAllianceId:mapIndexData.allianceData.id,
					data:[['', null]]
				}, uids, {}, function(e){
					if(_.isObject(e)) self.logService.onError("cache.cacheService.updateMapAlliance", {mapIndex:mapIndex}, e.stack)
				})
			}
		}
		mapIndexData.allianceData = null;
		delete this.mapIndexs[index];
	}
	if(!!callback) callback();
}

var GetLocationFromEvent = function(event){
	var bigMapLength = DataUtils.getAllianceIntInit('bigMapLength');
	var from = {
		x:event.fromAlliance.mapIndex % bigMapLength,
		y:Math.floor(event.fromAlliance.mapIndex / bigMapLength)
	};
	var to = {
		x:event.toAlliance.mapIndex % bigMapLength,
		y:Math.floor(event.toAlliance.mapIndex / bigMapLength)
	}
	if(from.x > to.x){
		var tmp = from;
		from = to;
		to = tmp;
	}
	return {from:from, to:to};
}

/**
 * 添加新的地图事件
 * @param eventType
 * @param event
 * @param callback
 */
pro.addMarchEvent = function(eventType, event, callback){
	this.logService.onEvent('cache.cacheService.addMarchEvent', {eventType:eventType, event:event});
	var self = this;
	var locations = GetLocationFromEvent(event);
	var from = locations.from;
	var to = locations.to;
	var AddEvent = function(mapIndex){
		if(mapIndex === event.fromAlliance.mapIndex) return;
		var mapIndexData = self.bigMap[mapIndex];
		mapIndexData.mapData.marchEvents[eventType][event.id] = event;
		var uids = []
		if(!!mapIndexData.allianceData){
			var channelName = Consts.AllianceChannelPrefix + ":" + mapIndexData.allianceData.id;
			var channel = self.channelService.getChannel(channelName, false)
			if(!!channel){
				uids = uids.concat(_.values(channel.records))
			}
		}
		uids = uids.concat(_.values(mapIndexData.channel.records))
		if(uids.length > 0){
			self.channelService.pushMessageByUids(Events.alliance.onMapDataChanged, {
				targetMapIndex:mapIndex,
				data:[['marchEvents.' + eventType + '.' + event.id, event]]
			}, uids, {}, function(e){
				if(_.isObject(e)){
					self.logService.onError("cache.cacheService.addMarchEvent", {
						mapIndex:mapIndex,
						eventType:eventType,
						event:event
					}, e.stack)
				}
			})
		}
	}

	var j = null;
	for(var i = from.x; i <= to.x; i++){
		if(from.y <= to.y){
			for(j = from.y; j <= to.y; j++){
				AddEvent(i + (j * self.bigMapLength));
			}
		}else{
			for(j = from.y; j >= to.y; j--){
				AddEvent(i + (j * self.bigMapLength));
			}
		}
	}
	return !!callback ? callback() : null;
}

/**
 * 更新地图事件
 * @param eventType
 * @param event
 * @param callback
 */
pro.updateMarchEvent = function(eventType, event, callback){
	this.logService.onEvent('cache.cacheService.updateMarchEvent', {eventType:eventType, event:event});
	var self = this;
	var locations = GetLocationFromEvent(event);
	var from = locations.from;
	var to = locations.to;

	var UpdateEvent = function(mapIndex){
		if(mapIndex === event.fromAlliance.mapIndex) return;
		var mapIndexData = self.bigMap[mapIndex];
		mapIndexData.mapData.marchEvents[eventType][event.id] = event;
		var uids = []
		if(!!mapIndexData.allianceData){
			var channelName = Consts.AllianceChannelPrefix + ":" + mapIndexData.allianceData.id;
			var channel = self.channelService.getChannel(channelName, false)
			if(!!channel){
				uids = uids.concat(_.values(channel.records))
			}
		}
		uids = uids.concat(_.values(mapIndexData.channel.records))
		if(uids.length > 0){
			self.channelService.pushMessageByUids(Events.alliance.onMapDataChanged, {
				targetMapIndex:mapIndex,
				data:[['marchEvents.' + eventType + '.' + event.id + '.arriveTime', event.arriveTime]]
			}, uids, {}, function(e){
				if(_.isObject(e)){
					self.logService.onError("cache.cacheService.updateMarchEvent", {
						mapIndex:mapIndex,
						eventType:eventType,
						event:event
					}, e.stack)
				}
			})
		}
	}

	var j = null;
	for(var i = from.x; i <= to.x; i++){
		if(from.y <= to.y){
			for(j = from.y; j <= to.y; j++){
				UpdateEvent(i + (j * self.bigMapLength));
			}
		}else{
			for(j = from.y; j >= to.y; j--){
				UpdateEvent(i + (j * self.bigMapLength));
			}
		}
	}

	return !!callback ? callback() : null;
}

/**
 * 移除地图事件
 * @param eventType
 * @param event
 * @param callback
 */
pro.removeMarchEvent = function(eventType, event, callback){
	this.logService.onEvent('cache.cacheService.removeMarchEvent', {eventType:eventType, event:event});
	var self = this;
	var locations = GetLocationFromEvent(event);
	var from = locations.from;
	var to = locations.to;

	var RemoveEvent = function(mapIndex){
		if(mapIndex === event.fromAlliance.mapIndex) return;
		var mapIndexData = self.bigMap[mapIndex];
		delete mapIndexData.mapData.marchEvents[eventType][event.id];
		var uids = []
		if(!!mapIndexData.allianceData){
			var channelName = Consts.AllianceChannelPrefix + ":" + mapIndexData.allianceData.id;
			var channel = self.channelService.getChannel(channelName, false)
			if(!!channel){
				uids = uids.concat(_.values(channel.records))
			}
		}
		uids = uids.concat(_.values(mapIndexData.channel.records))
		if(uids.length > 0){
			self.channelService.pushMessageByUids(Events.alliance.onMapDataChanged, {
				targetMapIndex:mapIndex,
				data:[['marchEvents.' + eventType + '.' + event.id, null]]
			}, uids, {}, function(e){
				if(_.isObject(e)){
					self.logService.onError("cache.cacheService.removeMarchEvent", {
						mapIndex:mapIndex,
						eventType:eventType,
						event:event
					}, e.stack)
				}
			})
		}
	}

	var j = null;
	for(var i = from.x; i <= to.x; i++){
		if(from.y <= to.y){
			for(j = from.y; j <= to.y; j++){
				RemoveEvent(i + (j * self.bigMapLength));
			}
		}else{
			for(j = from.y; j >= to.y; j--){
				RemoveEvent(i + (j * self.bigMapLength));
			}
		}
	}

	return !!callback ? callback() : null;
}

/**
 * 添加新的采集事件
 * @param event
 * @param callback
 */
pro.addVillageEvent = function(event, callback){
	this.logService.onEvent('cache.cacheService.addVillageEvent', {event:event});
	var self = this;
	var mapIndex = event.toAlliance.mapIndex;
	if(mapIndex === event.fromAlliance.mapIndex) return !!callback ? callback() : null;
	var mapIndexData = self.bigMap[mapIndex];
	mapIndexData.mapData.villageEvents[event.id] = event;
	var uids = []
	if(!!mapIndexData.allianceData){
		var channelName = Consts.AllianceChannelPrefix + ":" + mapIndexData.allianceData.id;
		var channel = self.channelService.getChannel(channelName, false)
		if(!!channel){
			uids = uids.concat(_.values(channel.records))
		}
	}
	uids = uids.concat(_.values(mapIndexData.channel.records))
	if(uids.length > 0){
		self.channelService.pushMessageByUids(Events.alliance.onMapDataChanged, {
			targetMapIndex:mapIndex,
			data:[['villageEvents.' + event.id, event]]
		}, uids, {}, function(e){
			if(_.isObject(e)){
				self.logService.onError("cache.cacheService.addVillageEvent", {
					mapIndex:mapIndex,
					event:event
				}, e.stack)
			}
		})
	}
	return !!callback ? callback() : null;
}

/**
 * 更新采集事件
 * @param event
 * @param callback
 */
pro.updateVillageEvent = function(event, callback){
	this.logService.onEvent('cache.cacheService.updateVillageEvent', {event:event});
	var self = this;
	var channelName = null;
	var channel = null;
	var uids = []
	var mapIndex = event.toAlliance.mapIndex;
	if(mapIndex === event.fromAlliance.mapIndex) return !!callback ? callback() : null;
	var mapIndexData = self.bigMap[mapIndex];
	mapIndexData.mapData.villageEvents[event.id] = event;
	if(!!mapIndexData.allianceData){
		channelName = Consts.AllianceChannelPrefix + ":" + mapIndexData.allianceData.id;
		channel = self.channelService.getChannel(channelName, false)
		if(!!channel){
			uids = uids.concat(_.values(channel.records))
		}
	}
	uids = uids.concat(_.values(mapIndexData.channel.records))
	if(uids.length > 0){
		self.channelService.pushMessageByUids(Events.alliance.onMapDataChanged, {
			targetMapIndex:mapIndex,
			data:[['villageEvents.' + event.id, event]]
		}, uids, {}, function(e){
			if(_.isObject(e)){
				self.logService.onError("cache.cacheService.updateVillageEvent", {
					mapIndex:mapIndex,
					event:event
				}, e.stack)
			}
		})
	}
	return !!callback ? callback() : null;
}

/**
 * 移除采集事件
 * @param event
 * @param callback
 */
pro.removeVillageEvent = function(event, callback){
	this.logService.onEvent('cache.cacheService.removeVillageEvent', {event:event});
	var self = this;
	var mapIndex = event.toAlliance.mapIndex;
	if(mapIndex === event.fromAlliance.mapIndex)  return !!callback ? callback() : null;
	var mapIndexData = self.bigMap[mapIndex];
	delete mapIndexData.mapData.villageEvents[event.id];
	var uids = []
	if(!!mapIndexData.allianceData){
		var channelName = Consts.AllianceChannelPrefix + ":" + mapIndexData.allianceData.id;
		var channel = self.channelService.getChannel(channelName, false)
		if(!!channel){
			uids = uids.concat(_.values(channel.records))
		}
	}
	uids = uids.concat(_.values(mapIndexData.channel.records))
	if(uids.length > 0){
		self.channelService.pushMessageByUids(Events.alliance.onMapDataChanged, {
			targetMapIndex:mapIndex,
			data:[['villageEvents.' + event.id, null]]
		}, uids, {}, function(e){
			if(_.isObject(e)){
				self.logService.onError("cache.cacheService.removeVillageEvent", {
					mapIndex:mapIndex,
					event:event
				}, e.stack)
			}
		})
	}
	return !!callback ? callback() : null;
}


/**
 * 将玩家添加到联盟频道
 * @param allianceId
 * @param playerId
 * @param logicServerId
 * @param callback
 */
pro.addToAllianceChannel = function(allianceId, playerId, logicServerId, callback){
	this.logService.onEvent('cache.cacheService.addToAllianceChannel', {
		allianceId:allianceId,
		playerId:playerId,
		logicServerId:logicServerId
	});
	this.channelService.getChannel(Consts.AllianceChannelPrefix + ":" + allianceId, true).add(playerId, logicServerId)
	callback()
}

/**
 * 将玩家从联盟频道移除
 * @param allianceId
 * @param playerId
 * @param logicServerId
 * @param callback
 */
pro.removeFromAllianceChannel = function(allianceId, playerId, logicServerId, callback){
	this.logService.onEvent('cache.cacheService.removeFromAllianceChannel', {
		allianceId:allianceId,
		playerId:playerId,
		logicServerId:logicServerId
	});
	var channel = this.channelService.getChannel(Consts.AllianceChannelPrefix + ":" + allianceId, false)
	if(!_.isObject(channel)){
		this.logService.onError('cache.cacheService.removeFromAllianceChannel', {
			allianceId:allianceId,
			playerId:playerId,
			logicServerId:logicServerId
		}, new Error('channel 不存在').stack)
		callback()
		return
	}
	channel.leave(playerId, logicServerId)
	callback()
}

/**
 * 删除联盟频道
 * @param allianceId
 * @param callback
 */
pro.destroyAllianceChannel = function(allianceId, callback){
	this.logService.onEvent('cache.cacheService.destroyAllianceChannel', {allianceId:allianceId});
	var channel = this.channelService.getChannel(Consts.AllianceChannelPrefix + ":" + allianceId, false)
	if(!_.isObject(channel)){
		this.logService.onError('cache.cacheService.destroyAllianceChannel', {
			allianceId:allianceId
		}, new Error('channel 不存在').stack)
		return callback()
	}
	channel.destroy()
	callback()
}

/**
 * 离开被观察的地块
 * @param viewer
 */
var LeaveChannel = function(viewer){
	var playerId = viewer.playerId;
	var logicServerId = viewer.logicServerId;
	var mapIndex = viewer.mapIndex;
	var mapIndexData = this.bigMap[mapIndex];
	var channel = mapIndexData.channel;
	channel.leave(playerId, logicServerId);
	delete this.mapViewers[playerId];
}

/**
 * 进入被观察地块
 * @param playerId
 * @param logicServerId
 * @param mapIndex
 * @param callback
 */
pro.enterMapIndexChannel = function(playerId, logicServerId, mapIndex, callback){
	var viewer = this.mapViewers[playerId];
	if(!!viewer) LeaveChannel.call(this, viewer);

	var mapIndexData = this.bigMap[mapIndex];
	var channel = mapIndexData.channel;
	channel.add(playerId, logicServerId)
	viewer = {
		playerId:playerId,
		logicServerId:logicServerId,
		mapIndex:mapIndex
	};
	this.mapViewers[playerId] = viewer;

	if(!this.bigMap[mapIndex].allianceData){
		return callback(null, {allianceData:null, mapData:mapIndexData.mapData});
	}

	var allianceId = this.bigMap[mapIndex].allianceData.id;
	this.findAllianceAsync(allianceId).then(function(doc){
		callback(null, {allianceData:_.pick(doc, Consts.AllianceViewDataKeys), mapData:mapIndexData.mapData});
	})
}

/**
 * 玩家离开被观察的地块
 * @param playerId
 * @param logicServerId
 * @param callback
 * @returns {*}
 */
pro.leaveMapIndexChannel = function(playerId, logicServerId, callback){
	var viewer = this.mapViewers[playerId];
	if(!viewer || !viewer.mapIndex) return callback();
	LeaveChannel.call(this, viewer);
	callback();
}

/**
 * 从玩家正在观察的地块移除
 * @param playerId
 * @param logicServerId
 * @param callback
 */
pro.removeFromViewedMapIndexChannel = function(playerId, logicServerId, callback){
	this.logService.onEvent('cache.cacheRemote.removeFromViewedAllianceChannel', {
		playerId:playerId,
		logicServerId:logicServerId
	});
	var viewer = this.mapViewers[playerId];
	if(!viewer) return callback();
	LeaveChannel.call(this, viewer, false);
	callback();
}

/**
 * 添加联盟国战积分
 * @param allianceDoc
 * @param scoreAdd
 */
pro.addAllianceGvGScore = function(allianceDoc, scoreAdd){
	if(!this.country.doc || this.country.doc.status.status !== Consts.AllianceStatus.Fight) return;
	var score = null;
	if(allianceDoc.prestige.startTime !== this.country.doc.status.startTime) score = 0;
	else score = allianceDoc.prestige.score;
	var rankObj = this.prestigeRank.get({id:allianceDoc._id, score:score});
	if(!!rankObj) this.prestigeRank.remove(rankObj);
	else rankObj = {id:allianceDoc.id}
	rankObj.score = score + scoreAdd;
	rankObj.tag = allianceDoc.basicInfo.tag;
	rankObj.name = allianceDoc.basicInfo.name;
	rankObj.flag = allianceDoc.basicInfo.flag;
	if(this.prestigeRank.length < this.prestigeRankLength) this.prestigeRank.add(rankObj);
	else{
		var minObj = this.prestigeRank.min();
		if(rankObj.score >= minObj.score){
			this.prestigeRank.remove(minObj);
			this.prestigeRank.add(rankObj);
		}
	}
	if(scoreAdd > 0){
		allianceDoc.prestige.score = rankObj.score;
		allianceDoc.prestige.startTime = this.country.doc.status.startTime;
		var allianceData = []
		allianceData.push(['prestige', allianceDoc.prestige]);
		this.pushService.onAllianceDataChangedAsync(allianceDoc, allianceData);
	}
}