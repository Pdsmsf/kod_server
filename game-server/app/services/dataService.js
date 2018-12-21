"use strict"

/**
 * Created by modun on 15/3/6.
 */
var _ = require("underscore")
var Promise = require("bluebird")
var ShortId = require('shortid')
var sprintf = require("sprintf")

var Utils = require('../utils/utils');
var LogicUtils = require("../utils/logicUtils")
var ErrorUtils = require("../utils/errorUtils")
var DataUtils = require("../utils/dataUtils")
var ReportUtils = require("../utils/reportUtils")
var Define = require("../consts/define")
var Consts = require("../consts/consts")
var TaskUtils = require("../utils/taskUtils")

var DataService = function(app){
	this.app = app
	this.logService = app.get("logService")
	this.cacheServerId = app.getServerId()
	this.chatServerId = app.get("chatServerId")
	this.cacheService = app.get('cacheService')
	this.GemChange = app.get('GemChange');
	this.pushService = app.get('pushService')
	this.timeEventService = app.get('timeEventService')
}
module.exports = DataService
var pro = DataService.prototype

/**
 * 将玩家添加到联盟频道
 * @param allianceId
 * @param playerDoc
 * @param callback
 */
pro.addPlayerToAllianceChannel = function(allianceId, playerDoc, callback){
	var self = this
	var addToChatAllianceChannelAsync = Promise.promisify(this.app.rpc.chat.chatRemote.addToAllianceChannel.toServer, {context:this})
	var funcs = []
	if(this.app.getServerById(this.chatServerId)){
		funcs.push(addToChatAllianceChannelAsync(this.chatServerId, allianceId, playerDoc._id, playerDoc.logicServerId))
	}
	funcs.push(this.cacheService.addToAllianceChannelAsync(allianceId, playerDoc._id, playerDoc.logicServerId));
	Promise.all(funcs).catch(function(e){
		self.logService.onError("cache.dataService.addPlayerToAllianceChannel", {
			allianceId:allianceId,
			playerId:playerDoc._id
		}, e.stack)
	}).finally(function(){
		callback();
	})
}

/**
 * 将玩家从联盟频道移除
 * @param allianceId
 * @param playerDoc
 * @param callback
 */
pro.removePlayerFromAllianceChannel = function(allianceId, playerDoc, callback){
	var self = this
	var removeFromChatAllianceChannelAsync = Promise.promisify(this.app.rpc.chat.chatRemote.removeFromAllianceChannel.toServer, {context:this})
	var funcs = []
	if(this.app.getServerById(this.chatServerId)){
		funcs.push(removeFromChatAllianceChannelAsync(this.chatServerId, allianceId, playerDoc._id, playerDoc.logicServerId))
	}
	funcs.push(this.cacheService.removeFromAllianceChannelAsync(allianceId, playerDoc._id, playerDoc.logicServerId));
	Promise.all(funcs).catch(function(e){
		self.logService.onError("cache.dataService.removePlayerFromAllianceChannel", {
			allianceId:allianceId,
			playerId:playerDoc._id
		}, e.stack)
	}).finally(function(){
		callback();
	})
}

/**
 * 删除联盟频道
 * @param allianceId
 * @param callback
 */
pro.destroyAllianceChannel = function(allianceId, callback){
	var self = this;
	var funcs = [];
	var distroyChatAllianceChannel = function(){
		return new Promise(function(resolve, reject){
			self.app.rpc.chat.chatRemote.destroyAllianceChannel.toServer(self.chatServerId, allianceId, function(e){
				if(!!e) return reject(e);
				resolve();
			})
		});
	}
	if(this.app.getServerById(this.cacheServerId)){
		funcs.push(distroyChatAllianceChannel);
	}
	funcs.push(self.cacheService.destroyAllianceChannelAsync(allianceId))
	Promise.all(funcs).catch(function(e){
		self.logService.onError("cache.dataService.destroyAllianceChannel", {
			allianceId:allianceId
		}, e.stack)
	}).finally(function(){
		callback();
	})
}

/**
 * 将玩家添加到所有频道中
 * @param playerDoc
 * @param callback
 */
pro.addPlayerToChannels = function(playerDoc, callback){
	var self = this
	var addToChatChannelAsync = Promise.promisify(this.app.rpc.chat.chatRemote.addToChatChannel.toServer, {context:this})
	var addToChatAllianceChannelAsync = Promise.promisify(this.app.rpc.chat.chatRemote.addToAllianceChannel.toServer, {context:this})
	var funcs = []
	if(this.app.getServerById(this.chatServerId)){
		funcs.push(addToChatChannelAsync(this.chatServerId, playerDoc._id, playerDoc.logicServerId, this.cacheServerId));
	}
	if(_.isString(playerDoc.allianceId)){
		if(this.app.getServerById(this.chatServerId)){
			funcs.push(addToChatAllianceChannelAsync(this.chatServerId, playerDoc.allianceId, playerDoc._id, playerDoc.logicServerId))
		}
		funcs.push(this.cacheService.addToAllianceChannelAsync(playerDoc.allianceId, playerDoc._id, playerDoc.logicServerId));
	}
	Promise.all(funcs).catch(function(e){
		self.logService.onError("cache.dataService.addPlayerToChannels", {playerId:playerDoc._id}, e.stack)
	}).finally(function(){
		callback();
	})
}

/**
 * 将玩家从所有频道中移除
 * @param playerDoc
 * @param callback
 */
pro.removePlayerFromChannels = function(playerDoc, callback){
	var self = this
	var removeFromChatChannelAsync = Promise.promisify(this.app.rpc.chat.chatRemote.removeFromChatChannel.toServer, {context:this})
	var removeFromChatAllianceChannelAsync = Promise.promisify(this.app.rpc.chat.chatRemote.removeFromAllianceChannel.toServer, {context:this})
	var funcs = []
	if(this.app.getServerById(this.chatServerId)){
		funcs.push(removeFromChatChannelAsync(this.chatServerId, playerDoc._id, playerDoc.logicServerId, this.cacheServerId));
	}
	if(_.isString(playerDoc.allianceId)){
		if(this.app.getServerById(this.chatServerId)){
			funcs.push(removeFromChatAllianceChannelAsync(this.chatServerId, playerDoc.allianceId, playerDoc._id, playerDoc.logicServerId))
		}
		funcs.push(this.cacheService.removeFromAllianceChannelAsync(playerDoc.allianceId, playerDoc._id, playerDoc.logicServerId));
		funcs.push(this.cacheService.removeFromViewedMapIndexChannelAsync(playerDoc._id, playerDoc.logicServerId));
	}
	Promise.all(funcs).catch(function(e){
		self.logService.onError("cache.dataService.removePlayerFromChannels", {playerId:playerDoc._id}, e.stack)
	}).finally(function(){
		callback();
	})
}

/**
 * 创建联盟对战频道
 * @param attackAllianceId
 * @param defenceAllianceId
 * @param callback
 */
pro.createAllianceFightChannel = function(attackAllianceId, defenceAllianceId, callback){
	var self = this
	var createAllianceFightChannelAsync = Promise.promisify(this.app.rpc.chat.chatRemote.createAllianceFightChannel.toServer, {context:this})
	createAllianceFightChannelAsync(this.chatServerId, attackAllianceId, defenceAllianceId).catch(function(e){
		self.logService.onError("cache.dataService.createAllianceFightChannel", {
			attackAllianceId:attackAllianceId,
			defenceAllianceId:defenceAllianceId
		}, e.stack)
	})
	callback()
}

/**
 * 删除战频道移除
 * @param attackAllianceId
 * @param defenceAllianceId
 * @param callback
 */
pro.deleteAllianceFightChannel = function(attackAllianceId, defenceAllianceId, callback){
	var self = this
	var deleteAllianceFightChannelAsync = Promise.promisify(this.app.rpc.chat.chatRemote.deleteAllianceFightChannel.toServer, {context:this})
	deleteAllianceFightChannelAsync(this.chatServerId, attackAllianceId, defenceAllianceId).catch(function(e){
		self.logService.onError("cache.dataService.deleteAllianceFightChannel", {
			attackAllianceId:attackAllianceId,
			defenceAllianceId:defenceAllianceId
		}, e.stack)
	})
	callback()
}


/**
 * 更新玩家session信息
 * @param playerDoc
 * @param params
 * @param callback
 */
pro.updatePlayerSession = function(playerDoc, params, callback){
	if(_.isEmpty(playerDoc.logicServerId)){
		callback()
		return
	}
	var self = this
	if(!this.app.getServerById(playerDoc.logicServerId)){
		return callback();
	}
	this.app.rpc.logic.logicRemote.updatePlayerSession.toServer(playerDoc.logicServerId, playerDoc._id, params, function(e){
		if(_.isObject(e)){
			self.logService.onError("cache.dataService.updatePlayerSession", {
				playerId:playerDoc._id,
				params:params
			}, e.stack)
		}
		callback();
	})
}

/**
 * 玩家是否在线
 * @param playerDoc
 * @param callback
 */
pro.kickPlayerIfOnline = function(playerDoc, callback){
	if(!playerDoc.logicServerId) return callback();
	var self = this;
	var logicServerId = playerDoc.logicServerId
	if(!this.app.getServerById(logicServerId)){
		return callback();
	}
	this.app.rpc.logic.logicRemote.kickPlayer.toServer(logicServerId, playerDoc._id, '重复登录', function(e){
		if(!!e){
			self.logService.onError("cache.dataService.kickPlayerIfOnline", {
				playerId:playerDoc._id
			}, e.stack)
			return callback(e);
		}
		//e = ErrorUtils.playerAlreadyLogin(playerDoc._id);
		//self.logService.onWarning("cache.dataService.kickPlayerIfOnline", {
		//	playerId:playerDoc._id
		//}, e.stack);
		(function isPlayerOnline(){
			setTimeout(function(){
				self.app.rpc.logic.logicRemote.isPlayerOnline.toServer(logicServerId, playerDoc._id, function(e, online){
					if(!!e){
						self.logService.onError("cache.dataService.kickPlayerIfOnline", {
							playerId:playerDoc._id
						}, e.stack)
						return callback(e);
					}
					if(online) return isPlayerOnline();
					callback();
				})
			}, 1000)
		})();
	})
}

/**
 * 为玩家添加系统邮件
 * @param id
 * @param titleKey
 * @param titleArgs
 * @param contentKey
 * @param contentArgs
 * @param rewards
 * @param callback
 */
pro.sendSysMail = function(id, titleKey, titleArgs, contentKey, contentArgs, rewards, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(id).then(function(doc){
		if(!doc){
			return Promise.reject(ErrorUtils.playerNotExist(id, id));
		}
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var language = playerDoc.basicInfo.language
		var title = titleKey[language]
		var content = contentKey[language]
		if(!_.isString(title)){
			title = titleKey.en
		}
		if(!_.isString(content)){
			content = contentKey.en
		}
		if(titleArgs.length > 0){
			title = sprintf.vsprintf(title, titleArgs)
		}
		if(contentArgs.length > 0){
			content = sprintf.vsprintf(content, contentArgs)
		}

		var mail = {
			id:ShortId.generate(),
			title:title,
			fromId:"__system",
			fromName:"__system",
			fromIcon:0,
			fromAllianceTag:"",
			toIcon:0,
			sendTime:Date.now(),
			content:content,
			rewards:rewards,
			rewardGetted:false,
			isRead:false,
			isSaved:false
		};

		while(playerDoc.mails.length >= Define.PlayerMailsMaxSize){
			(function(){
				var willRemovedMail = LogicUtils.getPlayerFirstUnSavedMail(playerDoc)
				playerData.push(["mails." + playerDoc.mails.indexOf(willRemovedMail), null])
				LogicUtils.removeItemInArray(playerDoc.mails, willRemovedMail)
			})();
		}
		playerDoc.mails.push(mail)
		playerData.push(["mails." + playerDoc.mails.indexOf(mail), mail])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		self.logService.onError("cache.dataService.sendSysMail", {
			playerId:id,
			titleKey:titleKey,
			titleArgs:titleArgs,
			contentKey:contentKey,
			contentArgs:contentArgs
		}, e.stack)
		callback();
	})
}

/**
 * 为玩家添加战报
 * @param id
 * @param report
 * @param callback
 */
pro.sendSysReport = function(id, report, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(id).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		while(playerDoc.reports.length >= Define.PlayerReportsMaxSize){
			(function(){
				var willRemovedReport = LogicUtils.getPlayerFirstUnSavedReport(playerDoc)
				playerData.push(["reports." + playerDoc.reports.indexOf(willRemovedReport), null])
				LogicUtils.removeItemInArray(playerDoc.reports, willRemovedReport)
			})();
		}
		playerDoc.reports.push(report)
		playerData.push(["reports." + playerDoc.reports.indexOf(report), report])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback()
	}).catch(function(e){
		self.logService.onError("cache.dataService.sendSysReport", {
			playerId:id,
			titleKey:titleKey,
			titleArgs:titleArgs,
			contentKey:contentKey,
			contentArgs:contentArgs
		}, e.stack)
		callback();
	})
}

/**
 * 发送联盟邮件
 * @param id
 * @param allianceId
 * @param title
 * @param content
 * @param callback
 */
pro.sendAllianceMail = function(id, allianceId, title, content, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var allianceDoc = null
	var lockPairs = [];
	var memberIds = [];
	var mailToPlayer = null;
	var mailToMember = null;
	this.cacheService.findPlayerAsync(id).then(function(doc){
		playerDoc = doc
		return self.cacheService.findAllianceAsync(allianceId)
	}).then(function(doc){
		allianceDoc = doc
		if(!playerDoc.allianceId) return Promise.reject(ErrorUtils.playerNotJoinAlliance(playerId))
		var playerObject = LogicUtils.getObjectById(allianceDoc.members, id)
		if(!DataUtils.isAllianceOperationLegal(playerObject.title, "sendAllianceMail"))
			return Promise.reject(ErrorUtils.allianceOperationRightsIllegal(id, allianceId, "sendAllianceMail"));
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		_.each(allianceDoc.members, function(member){
			if(!_.isEqual(member.id, id)) memberIds.push(member.id);
		})

		mailToPlayer = {
			id:ShortId.generate(),
			title:title,
			fromName:playerDoc.basicInfo.name,
			fromIcon:playerDoc.basicInfo.icon,
			fromAllianceTag:allianceDoc.basicInfo.tag,
			toId:"__allianceMembers",
			toName:"__allianceMembers",
			toIcon:0,
			content:content,
			sendTime:Date.now()
		}
		mailToMember = {
			id:ShortId.generate(),
			title:title,
			fromId:playerDoc._id,
			fromName:playerDoc.basicInfo.name,
			fromIcon:playerDoc.basicInfo.icon,
			fromAllianceTag:allianceDoc.basicInfo.tag,
			toIcon:0,
			content:content,
			sendTime:Date.now(),
			rewards:[],
			rewardGetted:false,
			isRead:false,
			isSaved:false
		};
		while(playerDoc.sendMails.length >= Define.PlayerSendMailsMaxSize){
			(function(){
				playerDoc.sendMails.shift()
				playerData.push(["sendMails.0", null])
			})();
		}
		playerDoc.sendMails.push(mailToPlayer)
		playerData.push(["sendMails." + playerDoc.sendMails.indexOf(mailToPlayer), mailToPlayer])
		while(playerDoc.mails.length >= Define.PlayerMailsMaxSize){
			var mail = LogicUtils.getPlayerFirstUnSavedMail(playerDoc)
			playerData.push(["mails." + playerDoc.mails.indexOf(mail), null])
			LogicUtils.removeItemInArray(playerDoc.mails, mail)
		}
		playerDoc.mails.push(mailToMember)
		playerData.push(["mails." + playerDoc.mails.indexOf(mailToMember), mailToMember])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).then(function(){
		callback();
	}).then(
		function(){
			(function sendMailToMembers(){
				if(memberIds.length === 0) return;
				mailToMember = {
					id:ShortId.generate(),
					title:title,
					fromId:playerDoc._id,
					fromName:playerDoc.basicInfo.name,
					fromIcon:playerDoc.basicInfo.icon,
					fromAllianceTag:allianceDoc.basicInfo.tag,
					toIcon:0,
					content:content,
					sendTime:Date.now(),
					rewards:[],
					rewardGetted:false,
					isRead:false,
					isSaved:false
				};
				var memberId = memberIds.pop();
				var memberDoc = null;
				var memberData = [];
				lockPairs = [];
				self.cacheService.findPlayerAsync(memberId).then(function(doc){
					memberDoc = doc;
					lockPairs.push({key:Consts.Pairs.Player, value:memberDoc._id});
				}).then(function(){
					while(memberDoc.mails.length >= Define.PlayerMailsMaxSize){
						var mail = LogicUtils.getPlayerFirstUnSavedMail(memberDoc)
						playerData.push(["mails." + memberDoc.mails.indexOf(mail), null])
						LogicUtils.removeItemInArray(memberDoc.mails, mail)
					}
					memberDoc.mails.push(mailToMember)
					memberData.push(["mails." + memberDoc.mails.indexOf(mailToMember), mailToMember])
				}).then(function(){
					return self.cacheService.touchAllAsync(lockPairs);
				}).then(function(){
					return self.pushService.onPlayerDataChangedAsync(memberDoc, memberData);
				}).catch(function(e){
					self.logService.onError("cache.dataService.sendAllianceMail", {
						playerId:id,
						memberId:memberDoc._id,
						allianceId:allianceId,
						title:title,
						content:content
					}, e.stack)
				}).finally(function(){
					sendMailToMembers();
				})
			})();
		},
		function(e){
			callback(e);
		}
	)
}

/**
 * 为玩家添加道具
 * @param playerDoc
 * @param playerData
 * @param api
 * @param params
 * @param items
 * @param callback
 */
pro.addPlayerItems = function(playerDoc, playerData, api, params, items, callback){
	if(items.length === 0) return callback();
	var self = this;
	var gemItems = [];
	_.each(items, function(_item){
		var item = _.find(playerDoc.items, function(item){
			return _.isEqual(item.name, _item.name)
		})
		if(!item){
			item = {
				name:_item.name,
				count:0
			}
			playerDoc.items.push(item)
		}
		item.count += _item.count
		playerData.push(["items." + playerDoc.items.indexOf(item), item])
		if(_item.name.indexOf('gemClass_') === 0){
			gemItems.push(_item);
		}
	})

	if(gemItems.length === 0) return callback();
	var gemAdd = {
		serverId:self.cacheServerId,
		playerId:playerDoc._id,
		playerName:playerDoc.basicInfo.name,
		items:gemItems,
		api:api,
		params:params
	}
	this.app.get('GemAdd').createAsync(gemAdd).catch(function(e){
		self.logService.onError("cache.dataService.addPlayerItems", {
			api:api,
			params:params,
			items:items
		}, e.stack)
	})
	callback();
}

/**
 * 为玩家添加奖励
 * @param playerDoc
 * @param playerData
 * @param api
 * @param params
 * @param rewards
 * @param forceAdd
 * @param callback
 */
pro.addPlayerRewards = function(playerDoc, playerData, api, params, rewards, forceAdd, callback){
	var self = this;
	var items = [];
	var gems = 0;
	_.each(rewards, function(reward){
		var type = reward.type
		var name = reward.name
		var count = reward.count
		if(_.isEqual("items", type)){
			items.push({name:name, count:count});
		}else if(_.contains(Consts.MaterialDepotTypes, type)){
			LogicUtils.addPlayerMaterials(playerDoc, playerData, type, [{name:name, count:count}], forceAdd);
		}else if(_.isEqual('resources', type)){
			playerDoc[type][name] += count
			if(name === 'gem'){
				gems += count;
			}
		}else if(!!playerDoc[type] && _.isNumber(playerDoc[type][name])){
			playerDoc[type][name] += count
			playerData.push([type + "." + name, playerDoc[type][name]])
			if(type === 'soldiers'){
				TaskUtils.finishSoldierCountTaskIfNeed(playerDoc, playerData, name)
			}
		}
	})
	callback();

	this.addPlayerItemsAsync(playerDoc, playerData, api, params, items).then(function(){
		if(gems > 0){
			var gemAdd = {
				serverId:self.cacheServerId,
				playerId:playerDoc._id,
				playerName:playerDoc.basicInfo.name,
				changed:gems,
				left:playerDoc.resources.gem,
				api:api,
				params:params
			}
			return self.GemChange.createAsync(gemAdd);
		}
	}).catch(function(e){
		self.logService.onError("cache.dataService.addPlayerRewards", {
			api:api,
			params:params,
			rewards:rewards,
			forceAdd:forceAdd
		}, e.stack)
	})
}

/**
 * 更新我方联盟坐标信息
 * @param allianceId
 * @param callback
 */
pro.updateAllianceEventsLocation = function(allianceId, callback){
	var self = this
	var allianceDoc = null
	var allianceData = []
	var lockPairs = [];
	var pushFuncs = [];
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc;
		lockPairs.push({key:Consts.Pairs.Alliance, value:allianceDoc._id});
	}).then(function(){
		_.each(allianceDoc.marchEvents.strikeMarchEvents, function(event, index){
			self.cacheService.removeMarchEvent('strikeMarchEvents', event);
			event.fromAlliance.mapIndex = allianceDoc.mapIndex;
			if(event.fromAlliance.id === event.toAlliance.id){
				event.toAlliance.mapIndex = allianceDoc.mapIndex;
			}
			allianceData.push(['marchEvents.strikeMarchEvents.' + index + '.fromAlliance.mapIndex', allianceDoc.mapIndex]);
			self.cacheService.addMarchEvent('strikeMarchEvents', event);
		})
		_.each(allianceDoc.marchEvents.strikeMarchReturnEvents, function(event, index){
			self.cacheService.removeMarchEvent('strikeMarchReturnEvents', event);
			event.fromAlliance.mapIndex = allianceDoc.mapIndex;
			if(event.fromAlliance.id === event.toAlliance.id){
				event.toAlliance.mapIndex = allianceDoc.mapIndex;
			}
			allianceData.push(['marchEvents.strikeMarchReturnEvents.' + index + '.fromAlliance.mapIndex', allianceDoc.mapIndex]);
			self.cacheService.addMarchEvent('strikeMarchReturnEvents', event);
		})
		_.each(allianceDoc.marchEvents.attackMarchEvents, function(event, index){
			self.cacheService.removeMarchEvent('attackMarchEvents', event);
			event.fromAlliance.mapIndex = allianceDoc.mapIndex;
			if(event.fromAlliance.id === event.toAlliance.id){
				event.toAlliance.mapIndex = allianceDoc.mapIndex;
			}
			allianceData.push(['marchEvents.attackMarchEvents.' + index + '.fromAlliance.mapIndex', allianceDoc.mapIndex]);
			self.cacheService.addMarchEvent('attackMarchEvents', event);
		})
		_.each(allianceDoc.marchEvents.attackMarchReturnEvents, function(event, index){
			self.cacheService.removeMarchEvent('attackMarchReturnEvents', event);
			event.fromAlliance.mapIndex = allianceDoc.mapIndex;
			if(event.fromAlliance.id === event.toAlliance.id){
				event.toAlliance.mapIndex = allianceDoc.mapIndex;
			}
			allianceData.push(['marchEvents.attackMarchReturnEvents.' + index + '.fromAlliance.mapIndex', allianceDoc.mapIndex]);
			self.cacheService.addMarchEvent('attackMarchReturnEvents', event);
		})
		_.each(allianceDoc.villageEvents, function(event, index){
			self.cacheService.removeVillageEvent(event);
			event.fromAlliance.mapIndex = allianceDoc.mapIndex;
			allianceData.push(['villageEvents.' + index + '.fromAlliance.mapIndex', allianceDoc.mapIndex]);
			if(event.fromAlliance.id === event.toAlliance.id){
				event.toAlliance.mapIndex = allianceDoc.mapIndex;
			}
			self.cacheService.addVillageEvent(event);
		})
		pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, allianceDoc, allianceData]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(pushFuncs)
	}).then(function(){
		callback()
	}).catch(function(e){
		self.logService.onError("cache.dataService.updateAllianceEventsLocation", {
			allianceId:allianceId
		}, e.stack)
		callback();
	})
}

/**
 * 更新在我方联盟采集村落的相关信息
 * @param allianceId
 * @param callback
 */
pro.updateEnemyVillageEvents = function(allianceId, callback){
	var self = this
	var allianceDoc = null
	var enemyAlliances = {};
	this.cacheService.findAllianceAsync(allianceId).then(function(doc){
		allianceDoc = doc;
		_.each(allianceDoc.villages, function(village){
			if(!!village.villageEvent && village.villageEvent.allianceId !== allianceDoc._id){
				if(!enemyAlliances[village.villageEvent.allianceId]){
					enemyAlliances[village.villageEvent.allianceId] = true
				}
			}
		})

		var updateEnemyVillageEventAsync = function(allianceId){
			var enemyAllianceDoc = null;
			var enemyAllianceData = [];
			var lockPairs = [];
			var pushFuncs = [];
			return self.cacheService.findAllianceAsync(allianceId).then(function(doc){
				enemyAllianceDoc = doc;
				lockPairs.push({key:Consts.Pairs.Alliance, value:enemyAllianceDoc._id});
			}).then(function(){
				_.each(enemyAllianceDoc.villageEvents, function(villageEvent){
					if(villageEvent.toAlliance.id !== allianceDoc._id) return;
					self.cacheService.removeVillageEvent(villageEvent);
					villageEvent.toAlliance.mapIndex = allianceDoc.mapIndex;
					enemyAllianceData.push(['villageEvents.' + enemyAllianceDoc.villageEvents.indexOf(villageEvent) + '.toAlliance.mapIndex', allianceDoc.mapIndex])
					self.cacheService.addVillageEvent(villageEvent);
				})
				pushFuncs.push([self.pushService, self.pushService.onAllianceDataChangedAsync, enemyAllianceDoc, enemyAllianceData]);
			}).then(function(){
				return self.cacheService.touchAllAsync(lockPairs);
			}).then(function(){
				return LogicUtils.excuteAll(pushFuncs)
			}).catch(function(e){
				self.logService.onError('cache.dataService.updateEnemyVillageEvents', {
					allianceId:allianceId
				}, e.stack);
			})
		};
		var funcs = [];
		_.each(_.keys(enemyAlliances), function(allianceId){
			funcs.push(updateEnemyVillageEventAsync(allianceId));
		})
		return Promise.all(funcs);
	}).then(function(){
		callback()
	}).catch(function(e){
		self.logService.onError("cache.dataService.updateEnemyVillageEvents", {
			allianceId:allianceId
		}, e.stack)
		callback();
	})
}

/**
 * 给玩家发送联盟战击杀奖励
 * @param playerId
 * @param callback
 */
pro.sendAllianceFightKillMaxRewards = function(playerId, callback){
	var allianceFightGemClass2Get = DataUtils.getAllianceIntInit('allianceFightGemClass2Get');
	var rewards = [{
		type:'items',
		name:'gemClass_1',
		count:allianceFightGemClass2Get
	}]
	var titleKey = DataUtils.getLocalizationConfig("alliance", "AllianceFightKillFirstRewardTitle")
	var contentKey = DataUtils.getLocalizationConfig("alliance", "AllianceFightKillFirstRewardContent")
	this.sendSysMail(playerId, titleKey, [], contentKey, [], rewards, callback);
}

/**
 * 移除玩家PushId
 * @param playerId
 */
pro.removePlayerPushId = function(playerId){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.pushId = null;
		playerData.push(["pushId", null]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
	}).catch(function(e){
		self.logService.onError("cache.dataService.removePlayerPushId", {
			playerId:id
		}, e.stack)
	})
}

/**
 * 将由联盟战结束带来的忠诚值添加到玩家数据中
 * @param playerKillDatas
 * @param callback
 */
pro.addPlayerLoyaltyByAllianceFightData = function(playerKillDatas, callback){
	var self = this;
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	playerKillDatas = Utils.clone(playerKillDatas);
	(function addLoyalty(){
		if(playerKillDatas.length <= 0){
			return callback();
		}
		var playerKill = playerKillDatas.pop();
		self.cacheService.findPlayerAsync(playerKill.id).then(function(doc){
			playerDoc = doc
			lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		}).then(function(){
			playerDoc.allianceData.loyalty += playerKill.loyalty;
			playerData.push(['allianceData.loyalty', playerDoc.allianceData.loyalty])
		}).then(function(){
			return self.cacheService.touchAllAsync(lockPairs);
		}).then(function(){
			return self.pushService.onPlayerDataChangedAsync(playerDoc, playerData)
		}).then(function(){
			addLoyalty();
		}).catch(function(e){
			self.logService.onError("cache.dataService.addPlayerLoyaltyByAllianceFightData", {
				playerKill:playerKill
			}, e.stack)
			addLoyalty();
		})
	})()
};