"use strict"
/**
 * Created by modun on 15/8/17.
 */

var _ = require('underscore');
var Promise = require('bluebird');

var ErrorUtils = require('../../../utils/errorUtils');
var LogicUtils = require('../../../utils/logicUtils');
var Events = require("../../../consts/events");
var GameDatas = require("../../../datas/GameDatas");
var Items = GameDatas.Items;
var ScheduleActivities = GameDatas.ScheduleActivities;

var MailRewardTypes = {
	items:(function(){
		var theItems = [];
		theItems = theItems.concat(_.keys(Items.special));
		theItems = theItems.concat(_.keys(Items.buff));
		theItems = theItems.concat(_.keys(Items.resource));
		theItems = theItems.concat(_.keys(Items.speedup));
		return theItems;
	})(),
	technologyMaterials:['trainingFigure', 'bowTarget', 'saddle', 'ironPart'],
	buildingMaterials:['blueprints', 'tools', 'tiles', 'pulley'],
	soldierMaterials:[
		'deathHand', 'heroBones', 'soulStone'
		, 'magicBox', 'confessionHood', 'brightRing'
		, 'holyBook', 'brightAlloy'
	],
	dragonEquipments:[
		'redCrown_s1', 'blueCrown_s1', 'greenCrown_s1',
		'redCrown_s2', 'blueCrown_s2', 'greenCrown_s2',
		'redCrown_s3', 'blueCrown_s3', 'greenCrown_s3',
		'redCrown_s4', 'blueCrown_s4', 'greenCrown_s4',
		'redCrown_s5', 'blueCrown_s5', 'greenCrown_s5',
		'redChest_s2', 'blueChest_s2', 'greenChest_s2',
		'redChest_s3', 'blueChest_s3', 'greenChest_s3',
		'redChest_s4', 'blueChest_s4', 'greenChest_s4',
		'redChest_s5', 'blueChest_s5', 'greenChest_s5',
		'redSting_s2', 'blueSting_s2', 'greenSting_s2',
		'redSting_s3', 'blueSting_s3', 'greenSting_s3',
		'redSting_s4', 'blueSting_s4', 'greenSting_s4',
		'redSting_s5', 'blueSting_s5', 'greenSting_s5',
		'redOrd_s2', 'blueOrd_s2', 'greenOrd_s2',
		'redOrd_s3', 'blueOrd_s3', 'greenOrd_s3',
		'redOrd_s4', 'blueOrd_s4', 'greenOrd_s4',
		'redOrd_s5', 'blueOrd_s5', 'greenOrd_s5',
		'redArmguard_s1', 'blueArmguard_s1', 'greenArmguard_s1',
		'redArmguard_s2', 'blueArmguard_s2', 'greenArmguard_s2',
		'redArmguard_s3', 'blueArmguard_s3', 'greenArmguard_s3',
		'redArmguard_s4', 'blueArmguard_s4', 'greenArmguard_s4',
		'redArmguard_s5', 'blueArmguard_s5', 'greenArmguard_s5'
	],
	dragonMaterials:[
		'ingo_1', 'ingo_2', 'ingo_3', 'ingo_4',
		'redSoul_2', 'redSoul_3', 'redSoul_4',
		'blueSoul_2', 'blueSoul_3', 'blueSoul_4',
		'greenSoul_2', 'greenSoul_3', 'greenSoul_4',
		'redCrystal_1', 'redCrystal_2', 'redCrystal_3', 'redCrystal_4',
		'blueCrystal_1', 'blueCrystal_2', 'blueCrystal_3', 'blueCrystal_4',
		'greenCrystal_1', 'greenCrystal_2', 'greenCrystal_3', 'greenCrystal_4',
		'runes_1', 'runes_2', 'runes_3', 'runes_4'
	],
	soldiers:[
		'swordsman_1', 'swordsman_2', 'swordsman_3',
		'sentinel_1', 'sentinel_2', 'sentinel_3',
		'ranger_1', 'ranger_2', 'ranger_3',
		'crossbowman_1', 'crossbowman_2', 'crossbowman_3',
		'lancer_1', 'lancer_2', 'lancer_3',
		'horseArcher_1', 'horseArcher_2', 'horseArcher_3',
		'catapult_1', 'catapult_2', 'catapult_3',
		'ballista_1', 'ballista_2', 'ballista_3',
		'skeletonWarrior', 'skeletonArcher', 'deathKnight', 'meatWagon'
	]
};


module.exports = function(app, http){
	var Player = app.get('Player');
	var Alliance = app.get('Alliance');
	var Device = app.get('Device');
	var GemChange = app.get('GemChange');
	var GemAdd = app.get('GemAdd');
	var Billing = app.get('Billing');
	var Analyse = app.get('Analyse');
	var DailyReport = app.get('DailyReport');
	var LoginLog = app.get('LoginLog');

	http.all('*', function(req, res, next){
		req.logService = app.get('logService');
		req.chatServerId = app.getServerFromConfig('chat-server-1').id;
		next();
	});

	http.post('/send-global-notice', function(req, res){
		req.logService.onEvent('/send-global-notice', req.body);
		var servers = req.body.servers;
		var type = req.body.type;
		var content = req.body.content;
		var maintainServerId = _.find(servers, function(serverId){
			return !app.getServerById(serverId);
		})
		if(!!maintainServerId){
			var e = ErrorUtils.serverUnderMaintain(maintainServerId);
			return res.json({code:500, data:e.message})
		}

		app.rpc.chat.gmApiRemote.sendGlobalNotice.toServer(req.chatServerId, servers, type, content, function(e, resp){
			if(!!e){
				req.logService.onError('/send-global-notice', req.body, e.stack);
				res.json({code:500, data:e.message});
			}else
				res.json(resp);
		})
	})

	http.get('/get-global-chats', function(req, res){
		req.logService.onEvent('/get-global-chats', req.query);
		var time = Number(req.query.time);
		if(!app.getServerById(req.chatServerId)){
			var e = ErrorUtils.serverUnderMaintain(req.chatServerId);
			return res.json({code:500, data:e.message})
		}
		app.rpc.chat.gmApiRemote.getGlobalChats.toServer(req.chatServerId, time, function(e, resp){
			if(!!e){
				req.logService.onError('/get-global-chats', req.query, e.stack);
				res.json({code:500, data:e.message});
			}else
				res.json(resp);
		})
	})

	http.post('/send-system-chat', function(req, res){
		req.logService.onEvent('/send-system-chat', req.body);
		var content = req.body.content;
		if(!app.getServerById(req.chatServerId)){
			var e = ErrorUtils.serverUnderMaintain(req.chatServerId);
			return res.json({code:500, data:e.message})
		}
		app.rpc.chat.gmApiRemote.sendSysChat.toServer(req.chatServerId, content, function(e, resp){
			if(!!e){
				req.logService.onError('/send-system-chat', req.body, e.stack);
				res.json({code:500, data:e.message});
			}else
				res.json(resp);
		})
	})

	http.get('/get-alliance-chats', function(req, res){
		req.logService.onEvent('/get-alliance-chats', req.query);
		var allianceId = req.query.allianceId;
		var time = Number(req.query.time);
		if(!app.getServerById(req.chatServerId)){
			var e = ErrorUtils.serverUnderMaintain(req.chatServerId);
			return res.json({code:500, data:e.message})
		}
		app.rpc.chat.gmApiRemote.getAllianceChats.toServer(req.chatServerId, allianceId, time, function(e, resp){
			if(!!e){
				req.logService.onError('/get-alliance-chats', req.query, e.stack);
				res.json({code:500, data:e.message});
			}else
				res.json(resp);
		})
	})

	http.post('/send-global-mail', function(req, res){
		req.logService.onEvent('/send-global-mail', req.body);
		var servers = req.body.servers;
		var title = req.body.title;
		var content = req.body.content;
		var rewards = req.body.rewards;
		var maintainServerId = _.find(servers, function(serverId){
			return !app.getServerById(serverId);
		})
		if(!!maintainServerId){
			var e = ErrorUtils.serverUnderMaintain(maintainServerId);
			return res.json({code:500, data:e.message})
		}
		if(_.isString(rewards) && rewards.trim().length > 0){
			var rewardStrings = rewards.split(',');
			rewards = [];
			_.each(rewardStrings, function(rewardString){
				var rewardParams = rewardString.split(':');
				var reward = {
					type:rewardParams[0],
					name:rewardParams[1],
					count:parseInt(rewardParams[2])
				}
				rewards.push(reward);
			})
			var hasError = _.some(rewards, function(reward){
				if(!_.contains(_.keys(MailRewardTypes), reward.type)) return true;
				if(!_.contains(MailRewardTypes[reward.type], reward.name)) return true;
				if(_.isNaN(reward.count) || reward.count <= 0) return true;
			})
			if(hasError) return res.json({code:500, data:'rewards数据结构不合法'})
		}else{
			rewards = [];
		}

		_.each(servers, function(serverId){
			app.rpc.cache.gmApiRemote.sendGlobalMail.toServer(serverId, title, content, rewards, function(){
			})
		})
		return res.json({code:200, data:null});
	})

	http.post('/send-mail-to-players', function(req, res){
		req.logService.onEvent('/send-mail-to-players', req.body);
		var players = req.body.players;
		var title = req.body.title;
		var content = req.body.content;
		var rewards = req.body.rewards;
		if(_.isString(rewards) && rewards.trim().length > 0){
			var rewardStrings = rewards.split(',');
			rewards = [];
			_.each(rewardStrings, function(rewardString){
				var rewardParams = rewardString.split(':');
				var reward = {
					type:rewardParams[0],
					name:rewardParams[1],
					count:parseInt(rewardParams[2])
				}
				rewards.push(reward);
			})

			var hasError = _.some(rewards, function(reward){
				if(!_.contains(_.keys(MailRewardTypes), reward.type)) return true;
				if(!_.contains(MailRewardTypes[reward.type], reward.name)) return true;
				if(_.isNaN(reward.count) || reward.count <= 0) return true;
			})
			if(hasError) return res.json({code:500, data:'rewards数据结构不合法'})
		}else{
			rewards = [];
		}


		var serverIds = {};
		Promise.fromCallback(function(callback){
			Player.collection.find({_id:{$in:players}}, {serverId:true}).toArray(function(e, docs){
				callback(e, docs);
			})
		}).then(function(docs){
			_.each(docs, function(doc){
				if(!serverIds[doc.serverId]) serverIds[doc.serverId] = [];
				serverIds[doc.serverId].push(doc._id);
			})
			var maintainServerId = _.find(_.keys(serverIds), function(serverId){
				return !app.getServerById(serverId);
			})
			if(!!maintainServerId){
				var e = ErrorUtils.serverUnderMaintain(maintainServerId);
				return res.json({code:500, data:e.message})
			}else{
				_.each(serverIds, function(ids, serverId){
					if(!!app.getServerById(serverId)) app.rpc.cache.gmApiRemote.sendMailToPlayers.toServer(serverId, ids, title, content, rewards, function(){
					})
				})
				res.json({code:200, data:null});
			}
		}, function(e){
			req.logService.onError('/send-mail-to-players', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/alliance/find-by-id', function(req, res){
		req.logService.onEvent('/alliance/find-by-id', req.query);
		var allianceId = req.query.allianceId;
		Alliance.findByIdAsync(allianceId, 'serverId').then(function(doc){
			if(!doc) return Promise.resolve({code:500, data:ErrorUtils.allianceNotExist(allianceId).message});
			if(!app.getServerById(doc.serverId)) return Promise.reject(ErrorUtils.serverUnderMaintain(doc.serverId));
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.findAllianceById.toServer(doc.serverId, doc._id, function(e, resp){
					callback(e, resp);
				})
			})
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/alliance/find-by-id', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.get('/alliance/find-by-tag', function(req, res){
		req.logService.onEvent('/alliance/find-by-tag', req.query);
		var allianceTag = req.query.allianceTag;
		Alliance.findOneAsync({'basicInfo.tag':allianceTag}, 'serverId').then(function(doc){
			if(!doc) return Promise.resolve({code:500, data:ErrorUtils.allianceNotExist(allianceTag).message});
			if(!app.getServerById(doc.serverId)) return Promise.reject(ErrorUtils.serverUnderMaintain(doc.serverId));
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.findAllianceById.toServer(doc.serverId, doc._id, function(e, resp){
					callback(e, resp);
				})
			})
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/alliance/find-by-tag', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.get('/player/find-by-id', function(req, res){
		req.logService.onEvent('/player/find-by-id', req.query);
		var playerId = req.query.playerId;
		Player.findByIdAsync(playerId, 'serverId').then(function(doc){
			if(!doc) return Promise.resolve({code:500, data:ErrorUtils.playerNotExist(playerId).message});
			if(!app.getServerById(doc.serverId)) return Promise.reject(ErrorUtils.serverUnderMaintain(doc.serverId));
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.findPlayerById.toServer(doc.serverId, doc._id, function(e, resp){
					callback(e, resp);
				})
			})
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/player/find-by-id', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.get('/player/find-by-name', function(req, res){
		req.logService.onEvent('/player/find-by-name', req.query);
		var playerName = req.query.playerName;
		Player.findOneAsync({'basicInfo.name':playerName}, 'serverId').then(function(doc){
			if(!doc) return Promise.resolve({code:500, data:ErrorUtils.playerNotExist(playerName).message});
			if(!app.getServerById(doc.serverId)) return Promise.reject(ErrorUtils.serverUnderMaintain(doc.serverId));
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.findPlayerById.toServer(doc.serverId, doc._id, function(e, resp){
					callback(e, resp);
				})
			})
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/player/find-by-name', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.get('/player/find-by-device-id', function(req, res){
		req.logService.onEvent('/player/find-by-device-id', req.query);
		var deviceId = req.query.deviceId;
		Device.findByIdAsync(deviceId).then(function(doc){
			if(!doc) return Promise.resolve();
			else return Player.findByIdAsync(doc.playerId);
		}).then(function(doc){
			if(!doc) return Promise.resolve({code:500, data:ErrorUtils.playerNotExist(deviceId).message});
			if(!app.getServerById(doc.serverId)) return Promise.reject(ErrorUtils.serverUnderMaintain(doc.serverId));
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.findPlayerById.toServer(doc.serverId, doc._id, function(e, resp){
					callback(e, resp);
				})
			})
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/player/find-by-device-id', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.get('/player/get-baned-list', function(req, res){
		req.logService.onEvent('/player/get-baned-list', req.query);
		app.get('Baned').find({finishTime:{$gt:Date.now()}}).sort({finishTime:-1}).then(function(docs){
			res.json({code:200, data:docs});
		}).catch(function(e){
			req.logService.onError('/player/get-baned-list', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.post('/player/ban', function(req, res){
		req.logService.onEvent('/player/ban', req.body);
		var playerId = req.body.playerId;
		var serverId = null;
		var minutes = Number(req.body.minutes);
		var reason = req.body.reason;
		app.get('Player').findById(playerId, {serverId:true}).then(function(doc){
			if(!doc){
				var e = ErrorUtils.playerNotExist(playerId, playerId);
				e.isLegal = true;
				return Promise.reject(e);
			}
			serverId = doc.serverId;
		}).then(function(){
			if(!app.getServerById(serverId)){
				var e = ErrorUtils.serverUnderMaintain(serverId);
				e.isLegal = true;
				return Promise.reject(e);
			}
		}).then(function(){
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.banPlayer.toServer(serverId, playerId, minutes, reason, callback);
			});
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/player/ban', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.post('/player/unBan', function(req, res){
		req.logService.onEvent('/player/unBan', req.body);
		var playerId = req.body.playerId;
		var serverId = null;
		app.get('Player').findById(playerId, {serverId:true}).then(function(doc){
			if(!doc){
				var e = ErrorUtils.playerNotExist(playerId, playerId);
				e.isLegal = true;
				return Promise.reject(e);
			}
			serverId = doc.serverId;
		}).then(function(){
			if(!app.getServerById(serverId)){
				var e = ErrorUtils.serverUnderMaintain(serverId);
				e.isLegal = true;
				return Promise.reject(e);
			}
		}).then(function(){
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.unBanPlayer.toServer(serverId, playerId, callback);
			});
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/player/unBan', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/player/get-muted-list', function(req, res){
		req.logService.onEvent('/player/get-muted-list', req.query);
		app.get('Muted').find({finishTime:{$gt:Date.now()}}).sort({finishTime:-1}).then(function(docs){
			res.json({code:200, data:docs});
		}).catch(function(e){
			req.logService.onError('/player/get-muted-list', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.post('/player/mute', function(req, res){
		req.logService.onEvent('/player/mute', req.body);
		var playerId = req.body.playerId;
		var serverId = null;
		var minutes = Number(req.body.minutes);
		var reason = req.body.reason;
		app.get('Player').findById(playerId, {serverId:true}).then(function(doc){
			if(!doc){
				var e = ErrorUtils.playerNotExist(playerId, playerId);
				return Promise.reject(e);
			}
			serverId = doc.serverId;
		}).then(function(){
			if(!app.getServerById(serverId)){
				var e = ErrorUtils.serverUnderMaintain(serverId);
				return Promise.reject(e);
			}
		}).then(function(){
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.mutePlayer.toServer(serverId, playerId, minutes, reason, callback);
			});
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/player/mute', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.post('/player/unMute', function(req, res){
		req.logService.onEvent('/player/unMute', req.body);
		var playerId = req.body.playerId;
		var serverId = null;
		app.get('Player').findById(playerId, {serverId:true}).then(function(doc){
			if(!doc){
				var e = ErrorUtils.playerNotExist(playerId, playerId);
				return res.json({code:500, data:e.message});
			}
			serverId = doc.serverId;
		}).then(function(){
			if(!app.getServerById(serverId)){
				var e = ErrorUtils.serverUnderMaintain(serverId);
				return res.json({code:500, data:e.message})
			}
		}).then(function(){
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.unMutePlayer.toServer(serverId, playerId, callback);
			});
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/player/unMute', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.post('/player/add-shop-product', function(req, res){
		req.logService.onEvent('/player/add-shop-product', req.body);
		var playerId = req.body.playerId;
		var productId = req.body.productId;
		var serverId = null;
		app.get('Player').findById(playerId, {serverId:true}).then(function(doc){
			if(!doc){
				var e = ErrorUtils.playerNotExist(playerId, playerId);
				e.isLegal = true;
				return Promise.reject(e);
			}
			serverId = doc.serverId;
		}).then(function(){
			if(!app.getServerById(serverId)){
				var e = ErrorUtils.serverUnderMaintain(serverId);
				e.isLegal = true;
				return Promise.reject(e);
			}
		}).then(function(){
			return Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.addShopProduct.toServer(serverId, playerId, productId, callback);
			});
		}).then(function(resp){
			res.json(resp);
		}).catch(function(e){
			req.logService.onError('/player/add-shop-product', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-mail-reward-types', function(req, res){
		req.logService.onEvent('/get-mail-reward-types', req.query);
		res.json({code:200, data:MailRewardTypes})
	})

	http.get('/get-servers-info', function(req, res){
		req.logService.onEvent('/get-cache-server-info', req.query);
		var servers = req.query.servers;
		var infos = {};
		var funcs = [];
		var onlineServers = app.getServersByType('cache');
		_.each(servers, function(serverId){
			var onlineServer = _.find(onlineServers, function(server){
				return server.id === serverId;
			})
			if(!onlineServer){
				var e = ErrorUtils.serverUnderMaintain(serverId);
				infos[serverId] = {code:500, data:e.message};
			}
		})
		_.each(app.getServersByType('cache'), function(server){
			funcs.push(Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.getServerInfo.toServer(server.id, function(e, resp){
					if(!!e){
						req.logService.onError('/get-servers-info', req.query, e.stack);
						infos[server.id] = {code:500, data:e.message};
					}else{
						infos[server.id] = resp;
					}
					callback()
				})
			}))
		})

		Promise.all(funcs).then(function(){
			res.json({code:200, data:infos});
		}).catch(function(e){
			req.logService.onError('/get-servers-info', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-revenue-data', function(req, res){
		req.logService.onEvent('/get-revenue-data', req.query);
		var limit = 15;
		var serverId = req.query.serverId;
		var playerId = !!req.query.playerId ? req.query.playerId : null;
		var transactionId = !!req.query.transactionId ? req.query.transactionId : null;
		var dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);
		var skip = parseInt(req.query.skip);
		if(!_.isNumber(skip) || skip % 1 !== 0){
			skip = 0;
		}

		var result = {}
		result.query = {
			serverId:serverId,
			playerId:playerId,
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1),
			skip:skip,
			limit:limit
		}
		var sql = {
			serverId:serverId,
			time:{$gte:dateFrom, $lte:dateTo}
		}
		if(!!playerId){
			sql.playerId = playerId;
		}
		if(transactionId){
			sql.transactionId = transactionId;
		}

		Billing.aggregateAsync([
			{$match:sql},
			{
				$group:{
					_id:null,
					totalPrice:{$sum:{$multiply:['$price', '$quantity']}}
				}
			}
		]).then(function(docs){
			result.totalRevenue = docs.length > 0 ? docs[0].totalPrice : 0;
			return Billing.countAsync(sql)
		}).then(function(count){
			result.totalCount = count;
			return Billing.findAsync(sql, 'type playerId playerName transactionId productId price quantity time', {
				skip:skip,
				limit:limit,
				sort:{time:-1}
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/revenue/get-revenue-data', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-revenue-data-csv', function(req, res){
		req.logService.onEvent('/get-revenue-data-csv', req.query);
		var serverId = req.query.serverId;
		var playerId = !!req.query.playerId ? req.query.playerId : null;
		var transactionId = !!req.query.transactionId ? req.query.transactionId : null;
		var dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);

		var result = {}
		result.query = {
			serverId:serverId,
			playerId:playerId,
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1)
		}
		var sql = {
			serverId:serverId,
			time:{$gte:dateFrom, $lte:dateTo}
		}
		if(!!playerId){
			sql.playerId = playerId;
		}
		if(transactionId){
			sql.transactionId = transactionId;
		}

		Billing.aggregateAsync([
			{$match:sql},
			{
				$group:{
					_id:null,
					totalPrice:{$sum:{$multiply:['$price', '$quantity']}}
				}
			}
		]).then(function(docs){
			result.totalRevenue = docs.length > 0 ? docs[0].totalPrice : 0;
			return Billing.countAsync(sql)
		}).then(function(count){
			result.totalCount = count;
			return Billing.findAsync(sql, 'type playerId playerName transactionId productId price quantity time', {
				sort:{time:-1}
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/revenue/get-revenue-data-csv', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-gemchange-data', function(req, res){
		req.logService.onEvent('/get-gemchange-data', req.query);
		var limit = 15;
		var playerId = !!req.query.playerId ? req.query.playerId : null;
		var dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);
		var skip = parseInt(req.query.skip);
		if(!_.isNumber(skip) || skip % 1 !== 0){
			skip = 0;
		}

		var result = {}
		result.query = {
			playerId:playerId,
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1),
			skip:skip,
			limit:limit
		}
		var sql = {
			playerId:!!playerId ? playerId : {$exists:true},
			time:{$gte:dateFrom, $lte:dateTo}
		}
		GemChange.countAsync(sql).then(function(count){
			result.totalCount = count;
			return GemChange.findAsync(sql, 'playerId playerName changed left api params time', {
				skip:skip,
				limit:limit,
				sort:{time:-1}
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/gemuse/get-gemchange-data', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-gemchange-data-csv', function(req, res){
		req.logService.onEvent('/get-gemchange-data-csv', req.query);
		var playerId = !!req.query.playerId ? req.query.playerId : null;
		var dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);

		var result = {}
		result.query = {
			playerId:playerId,
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1)
		}
		var sql = {
			playerId:!!playerId ? playerId : {$exists:true},
			time:{$gte:dateFrom, $lte:dateTo}
		}
		GemChange.countAsync(sql).then(function(count){
			result.totalCount = count;
			return GemChange.findAsync(sql, 'playerId playerName changed left api params time', {
				sort:{time:-1}
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/gemuse/get-gemchange-data-csv', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-loginlog-data', function(req, res){
		req.logService.onEvent('/get-loginlog-data', req.query);
		var limit = 15;
		var dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);
		var skip = parseInt(req.query.skip);
		if(!_.isNumber(skip) || skip % 1 !== 0){
			skip = 0;
		}

		var result = {}
		result.query = {
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1),
			skip:skip,
			limit:limit
		}
		var sql = {
			loginTime:{$gte:dateFrom, $lte:dateTo}
		}
		LoginLog.count(sql).then(function(count){
			result.totalCount = count;
			return LoginLog.find(sql).sort({loginTime:-1}).skip(skip).limit(limit);
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/gemuse/get-loginlog-data', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-loginlog-data-csv', function(req, res){
		req.logService.onEvent('/get-loginlog-data-csv', req.query);
		var dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);

		var result = {}
		result.query = {
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1)
		}
		var sql = {
			loginTime:{$gte:dateFrom, $lte:dateTo}
		}
		LoginLog.count(sql).then(function(count){
			result.totalCount = count;
			return LoginLog.find(sql).sort({loginTime:-1})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/gemuse/get-loginlog-data-csv', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-player-snapshot-data', function(req, res){
		req.logService.onEvent('/get-player-snapshot-data', req.query);
		var limit = 16;
		var serverId = req.query.serverId;
		var skip = parseInt(req.query.skip);
		var activePlayerLastLoginTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
		if(!_.isNumber(skip) || skip % 1 !== 0){
			skip = 0;
		}

		var result = {}
		result.query = {
			serverId:serverId,
			skip:skip,
			limit:limit
		}
		var sql = {
			serverId:serverId,
			'countInfo.lastLogoutTime':{$gte:activePlayerLastLoginTime}
		}

		Player.count(sql).then(function(count){
			result.totalCount = count;
			return Player.find(sql, {
				'resources.gem':true,
				'countInfo.lastLogoutTime':true,
				'basicInfo.power':true
			}).skip(skip).limit(limit).sort({'basicInfo.power':-1})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/get-player-snapshot-data', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-player-snapshot-data-csv', function(req, res){
		req.logService.onEvent('/get-player-snapshot-data-csv', req.query);
		var serverId = req.query.serverId;
		var activePlayerLastLoginTime = Date.now() - (30 * 24 * 60 * 60 * 1000);

		var result = {}
		result.query = {
			serverId:serverId
		}
		var sql = {
			serverId:serverId,
			'countInfo.lastLogoutTime':{$gte:activePlayerLastLoginTime}
		}

		Promise.fromCallback(function(callback){
			Player.collection.find(sql, {
				'resources.gem':true,
				'countInfo.lastLogoutTime':true,
				'basicInfo.power':true
			}).sort({'basicInfo.power':-1}).toArray(function(e, datas){
				callback(e, datas);
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/get-player-snapshot-data-csv', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-gemadd-data', function(req, res){
		req.logService.onEvent('/get-gemadd-data', req.query);
		var limit = 15;
		var playerId = !!req.query.playerId ? req.query.playerId : null;
		var dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);
		var skip = parseInt(req.query.skip);
		if(!_.isNumber(skip) || skip % 1 !== 0){
			skip = 0;
		}

		var result = {}
		result.query = {
			playerId:playerId,
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1),
			skip:skip,
			limit:limit
		}
		var sql = {
			playerId:!!playerId ? playerId : {$exists:true},
			time:{$gte:dateFrom, $lte:dateTo}
		}
		GemAdd.countAsync(sql).then(function(count){
			result.totalCount = count;
			return GemAdd.findAsync(sql, 'playerId playerName items api params time', {
				skip:skip,
				limit:limit,
				sort:{time:-1}
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/gemuse/get-gemadd-data', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/server-notice/list', function(req, res){
		req.logService.onEvent('/server-notice/list', req.query);
		var serverId = req.query.serverId;
		if(!app.getServerById(serverId)){
			var e = ErrorUtils.serverUnderMaintain(serverId);
			return res.json({code:500, data:e.message})
		}
		app.rpc.cache.gmApiRemote.getServerNotices.toServer(serverId, function(e, resp){
			if(!!e){
				req.logService.onError('/server-notice/list', req.query, e.stack);
				res.json({code:500, data:e.message});
			}else
				res.json(resp);
		})
	})

	http.post('/server-notice/create', function(req, res){
		req.logService.onEvent('/server-notice/create', req.body);
		var serverIds = req.body.servers;
		var title = req.body.title;
		var content = req.body.content;
		var maintainServerId = _.find(serverIds, function(serverId){
			return !app.getServerById(serverId);
		})
		if(!!maintainServerId){
			var e = ErrorUtils.serverUnderMaintain(maintainServerId);
			return res.json({code:500, data:e.message})
		}
		var funcs = [];
		_.each(serverIds, function(serverId){
			funcs.push(Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.addServerNotice.toServer(serverId, title, content, callback)
			}))
		})
		Promise.all(funcs).then(function(datas){
			res.json({code:200, data:datas});
		}).catch(function(e){
			req.logService.onError('/server-notice/create', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.post('/server-notice/delete', function(req, res){
		req.logService.onEvent('/server-notice/delete', req.body);
		var serverId = req.body.serverId;
		var noticeId = req.body.noticeId;
		if(!app.getServerById(serverId)){
			var e = ErrorUtils.serverUnderMaintain(serverId);
			return res.json({code:500, data:e.message})
		}
		app.rpc.cache.gmApiRemote.deleteServerNotice.toServer(serverId, noticeId, function(e, resp){
			if(!!e){
				req.logService.onError('/server-notice/delete', req.body, e.stack);
				res.json({code:500, data:e.message});
			}else{
				res.json(resp);
			}
		})
	})

	http.get('/get-analyse-data', function(req, res){
		req.logService.onEvent('/get-analyse-data', req.query);
		var limit = 16;
		var serverId = req.query.serverId;
		var skip = parseInt(req.query.skip);
		var dateFrom = null;
		if(!req.query.dateFrom){
			dateFrom = LogicUtils.getPreviousDateTime(Date.now(), 15);
		}else{
			dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		}
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);
		if(!_.isNumber(skip) || skip % 1 !== 0){
			skip = 0;
		}

		var result = {}
		result.query = {
			serverId:serverId,
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1),
			skip:skip,
			limit:limit
		}
		var sql = {
			serverId:serverId,
			dateTime:{$gte:dateFrom, $lt:dateTo}
		}

		Analyse.countAsync(sql).then(function(count){
			result.totalCount = count;
			return Analyse.findAsync(sql, null, {
				skip:skip,
				limit:limit,
				sort:{dateTime:-1}
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/get-analyse-data', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-analyse-data-csv', function(req, res){
		req.logService.onEvent('/get-analyse-data-csv', req.query);
		var serverId = req.query.serverId;
		var dateFrom = null;
		if(!req.query.dateFrom){
			dateFrom = LogicUtils.getPreviousDateTime(Date.now(), 15);
		}else{
			dateFrom = LogicUtils.getDateTimeFromString(req.query.dateFrom);
		}
		var dateTo = LogicUtils.getDateTimeFromString(req.query.dateTo);
		dateTo = LogicUtils.getNextDateTime(dateTo, 1);

		var result = {}
		result.query = {
			serverId:serverId,
			dateFrom:dateFrom,
			dateTo:LogicUtils.getPreviousDateTime(dateTo, 1)
		}
		var sql = {
			serverId:serverId,
			dateTime:{$gte:dateFrom, $lt:dateTo}
		}

		Analyse.countAsync(sql).then(function(count){
			result.totalCount = count;
			return Analyse.findAsync(sql, null, {
				sort:{dateTime:-1}
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/get-analyse-data-csv', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-gm-chats', function(req, res){
		req.logService.onEvent('/get-gm-chats', req.query);
		var time = Number(req.query.time);
		var playerId = req.query.playerId;
		var logicServerId = req.query.logicServerId;
		if(!playerId) return res.json({code:500, data:'playerId不合法'});
		if(!app.getServerById(logicServerId)) return res.json({code:500, data:'logicServerId不合法'});
		Promise.fromCallback(function(callback){
			app.rpc.logic.logicRemote.isPlayerOnline.toServer(logicServerId, playerId, callback)
		}).then(function(online){
			if(!online) return res.json({code:500, data:'玩家已离线'});
			var chats = app.get('gmChats')[playerId];
			if(!chats) chats = app.get('gmChats')[playerId] = [];
			if(time === 0) return res.json({code:200, data:chats});

			var sliceFrom = null;
			for(var i = chats.length - 1; i >= 0; i--){
				var chat = chats[i];
				if(chat.time <= time){
					sliceFrom = i + 1;
					break;
				}
			}
			if(sliceFrom >= 0) return res.json({code:200, data:chats.slice(sliceFrom)});
			res.json({code:200, data:[]});
		})
	})

	http.post('/send-gm-chat', function(req, res){
		req.logService.onEvent('/send-gm-chat', req.body);
		var playerId = req.body.playerId;
		var logicServerId = req.body.logicServerId;
		if(!playerId) return res.json({code:500, data:'playerId不合法'});
		if(!app.getServerById(logicServerId)) return res.json({code:500, data:'logicServerId不合法'});
		Promise.fromCallback(function(callback){
			app.rpc.logic.logicRemote.isPlayerOnline.toServer(logicServerId, playerId, callback)
		}).then(function(online){
			if(!online) return res.json({code:500, data:'玩家已离线'});
			var content = req.body.content;
			var chats = app.get('gmChats')[playerId];
			var message = LogicUtils.createSysChatMessage(content);
			if(chats.length > app.get('gmChatMaxLength')){
				chats.shift()
			}
			chats.push(message)
			res.json({code:200, data:null});
			app.get("channelService").pushMessageByUids(Events.chat.onSysChat, message, [{
				uid:playerId,
				sid:logicServerId
			}], {}, null)
		})
	})

	http.get('/get-daily-reports', function(req, res){
		req.logService.onEvent('/get-daily-reports', req.query);
		var limit = 15;
		var serverId = req.query.serverId;
		var skip = parseInt(req.query.skip);
		if(!_.isNumber(skip) || skip % 1 !== 0){
			skip = 0;
		}

		var result = {}
		result.query = {
			serverId:serverId,
			skip:skip,
			limit:limit
		}
		var sql = {
			serverId:serverId
		}

		DailyReport.countAsync(sql).then(function(count){
			result.totalCount = count;
			return DailyReport.findAsync(sql, null, {
				skip:skip,
				limit:limit,
				sort:{dateTime:-1}
			})
		}).then(function(datas){
			result.datas = datas
			res.json({code:200, data:result});
		}).catch(function(e){
			req.logService.onError('/get-daily-reports', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-activity-types', function(req, res){
		req.logService.onEvent('/get-activity-types', req.query);
		var types = {};
		_.each(ScheduleActivities.type, function(activity){
			types[activity.type] = activity.desc;
		})
		res.json({code:200, data:types});
	})

	http.get('/get-activities', function(req, res){
		req.logService.onEvent('/get-activities', req.query);
		var cacheServerId = req.query.cacheServerId;
		if(!app.getServerById(cacheServerId)) return res.json({code:500, data:'cacheServerId不合法'});
		app.rpc.cache.gmApiRemote.getActivities.toServer(cacheServerId, function(e, resp){
			if(!!e){
				req.logService.onError('/get-activities', req.body, e.stack);
				res.json({code:500, data:e.message});
			}else{
				res.json(resp);
			}
		});
	});

	http.post('/create-activity', function(req, res){
		req.logService.onEvent('/create-activity', req.body);
		var serverIds = req.body.servers;
		var type = req.body.type;
		var dateStart = req.body.dateStart;
		var maintainServerId = _.find(serverIds, function(serverId){
			return !app.getServerById(serverId);
		})
		if(!!maintainServerId){
			var e = ErrorUtils.serverUnderMaintain(maintainServerId);
			return res.json({code:500, data:e.message})
		}
		var funcs = [];
		_.each(serverIds, function(serverId){
			funcs.push(Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.createActivity.toServer(serverId, type, dateStart, callback)
			}))
		})
		Promise.all(funcs).then(function(datas){
			res.json({code:200, data:datas});
		}).catch(function(e){
			req.logService.onError('/create-activity', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.post('/delete-activity', function(req, res){
		req.logService.onEvent('/delete-activity', req.body);
		var cacheServerId = req.body.cacheServerId;
		var type = req.body.type;
		if(!app.getServerById(cacheServerId)) return res.json({code:500, data:'cacheServerId不合法'});
		app.rpc.cache.gmApiRemote.deleteActivity.toServer(cacheServerId, type, function(e, resp){
			if(!!e){
				req.logService.onError('/delete-activity', req.body, e.stack);
				res.json({code:500, data:e.message});
			}else{
				res.json(resp);
			}
		});
	});

	http.get('/get-alliance-activity-types', function(req, res){
		req.logService.onEvent('/get-alliance-activity-types', req.query);
		var types = {};
		_.each(ScheduleActivities.allianceType, function(activity){
			types[activity.type] = activity.desc;
		})
		res.json({code:200, data:types});
	})

	http.get('/get-alliance-activities', function(req, res){
		req.logService.onEvent('/get-alliance-activities', req.query);
		var cacheServerId = req.query.cacheServerId;
		if(!app.getServerById(cacheServerId)) return res.json({code:500, data:'cacheServerId不合法'});
		app.rpc.cache.gmApiRemote.getAllianceActivities.toServer(cacheServerId, function(e, resp){
			if(!!e){
				req.logService.onError('/get-alliance-activities', req.body, e.stack);
				res.json({code:500, data:e.message});
			}else{
				res.json(resp);
			}
		});
	});

	http.post('/create-alliance-activity', function(req, res){
		req.logService.onEvent('/create-alliance-activity', req.body);
		var serverIds = req.body.servers;
		var type = req.body.type;
		var dateStart = req.body.dateStart;
		var maintainServerId = _.find(serverIds, function(serverId){
			return !app.getServerById(serverId);
		})
		if(!!maintainServerId){
			var e = ErrorUtils.serverUnderMaintain(maintainServerId);
			return res.json({code:500, data:e.message})
		}
		var funcs = [];
		_.each(serverIds, function(serverId){
			funcs.push(Promise.fromCallback(function(callback){
				app.rpc.cache.gmApiRemote.createAllianceActivity.toServer(serverId, type, dateStart, callback)
			}))
		})
		Promise.all(funcs).then(function(datas){
			res.json({code:200, data:datas});
		}).catch(function(e){
			req.logService.onError('/create-alliance-activity', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	});

	http.post('/delete-alliance-activity', function(req, res){
		req.logService.onEvent('/delete-alliance-activity', req.body);
		var cacheServerId = req.body.cacheServerId;
		var type = req.body.type;
		if(!app.getServerById(cacheServerId)) return res.json({code:500, data:'cacheServerId不合法'});
		app.rpc.cache.gmApiRemote.deleteAllianceActivity.toServer(cacheServerId, type, function(e, resp){
			if(!!e){
				req.logService.onError('/delete-alliance-activity', req.body, e.stack);
				res.json({code:500, data:e.message});
			}else{
				res.json(resp);
			}
		});
	});

	http.get('/mod/list', function(req, res){
		req.logService.onEvent('/mod/list', req.query);
		app.get('Mod').find().then(function(docs){
			res.json({code:200, data:docs});
		}).catch(function(e){
			req.logService.onError('/mod/list', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.post('/mod/create', function(req, res){
		req.logService.onEvent('/mod/create', req.body);
		var mod = {
			_id:req.body.id,
			name:req.body.name
		};
		app.get('Mod').create(mod).then(function(){
			res.json({code:200, data:null});
		}).catch(function(e){
			req.logService.onError('/mod/create', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.post('/mod/delete', function(req, res){
		req.logService.onEvent('/mod/delete', req.body);
		app.get('Mod').findByIdAndRemove(req.body.id).then(function(){
			res.json({code:200, data:null});
		}).catch(function(e){
			req.logService.onError('/mod/delete', req.body, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/get-mod-logs', function(req, res){
		req.logService.onEvent('/get-mod-logs', req.query);
		var modId = req.query.modId;
		var actionType = req.query.actionType;
		var sql = {};
		if(!!modId){
			sql['mod.id'] = modId;
		}
		if(!!actionType){
			sql['action.type'] = actionType;
		}
		app.get('ModLog').find(sql).sort({time:-1}).limit(60).then(function(docs){
			res.json({code:200, data:docs});
		}).catch(function(e){
			req.logService.onError('/get-mod-logs', req.query, e.stack);
			res.json({code:500, data:e.message});
		})
	})

	http.get('/game-info', function(req, res){
		req.logService.onEvent('/game-info', req.query);
		var serverId = req.query.serverId;
		if(!app.getServerById(serverId)){
			var e = ErrorUtils.serverUnderMaintain(serverId);
			return res.json({code:500, data:e.message})
		}
		app.rpc.cache.gmApiRemote.getGameInfo.toServer(serverId, function(e, resp){
			if(!!e){
				req.logService.onError('/game-info', req.query, e.stack);
				res.json({code:500, data:e.message});
			}else
				res.json(resp);
		})
	})

	http.post('/game-info', function(req, res){
		req.logService.onEvent('/game-info', req.body);
		var serverId = req.body.serverId;
		var gameInfo = req.body.gameInfo;
		if(!app.getServerById(serverId)){
			var e = ErrorUtils.serverUnderMaintain(serverId);
			return res.json({code:500, data:e.message})
		}
		gameInfo.promotionProductEnabled = gameInfo.promotionProductEnabled === "true"
		gameInfo.modApplyEnabled = gameInfo.modApplyEnabled === "true"
		gameInfo.iapGemEventEnabled = gameInfo.iapGemEventEnabled === "true"
		app.rpc.cache.gmApiRemote.editGameInfo.toServer(serverId, gameInfo, function(e, resp){
			if(!!e){
				req.logService.onError('/game-info', req.body, e.stack);
				res.json({code:500, data:e.message});
			}else
				res.json(resp);
		})
	})
};
