"use strict"

/**
 * Created by modun on 14-7-23.
 */
var ShortId = require("shortid")
var Promise = require("bluebird")
var _ = require("underscore")
var sprintf = require("sprintf")

var Utils = require("../utils/utils")
var DataUtils = require("../utils/dataUtils")
var LogicUtils = require("../utils/logicUtils")
var TaskUtils = require("../utils/taskUtils")
var ErrorUtils = require("../utils/errorUtils")
var ItemUtils = require('../utils/itemUtils');
var Events = require("../consts/events")
var Consts = require("../consts/consts")
var Define = require("../consts/define")

var PlayerApiService5 = function(app){
	this.app = app
	this.env = app.get("env")
	this.logService = app.get("logService")
	this.dataService = app.get("dataService")
	this.cacheService = app.get('cacheService');
	this.activityService = app.get('activityService');
	this.GemChange = app.get("GemChange")
	this.ServerState = app.get('ServerState');
	this.cacheServerId = app.getServerId();
	this.rankServerId = app.get('rankServerId');
	this.pushService = app.get('pushService');
	this.timeEventService = app.get('timeEventService');
}
module.exports = PlayerApiService5
var pro = PlayerApiService5.prototype


/**
 * 获取每日登陆奖励
 * @param playerId
 * @param callback
 */
pro.getDay60Reward = function(playerId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(_.isEqual(playerDoc.countInfo.day60, playerDoc.countInfo.day60RewardsCount)) return Promise.reject(ErrorUtils.loginRewardAlreadyGet(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.countInfo.day60RewardsCount = playerDoc.countInfo.day60
		playerData.push(["countInfo.day60RewardsCount", playerDoc.countInfo.day60RewardsCount])

		var items = DataUtils.getDay60RewardItem(playerDoc.countInfo.day60)
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getDay60Reward', null, items]);
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取每日在线奖励
 * @param playerId
 * @param timePoint
 * @param callback
 */
pro.getOnlineReward = function(playerId, timePoint, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!DataUtils.isPlayerReachOnlineTimePoint(playerDoc, timePoint)) return Promise.reject(ErrorUtils.onlineTimeNotEough(playerId))
		var theTimePoint = _.find(playerDoc.countInfo.todayOnLineTimeRewards, function(reward){
			return _.isEqual(reward, timePoint)
		})
		if(_.isNumber(theTimePoint)) return Promise.reject(ErrorUtils.onlineTimeRewardAlreadyGet(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.countInfo.todayOnLineTimeRewards.push(timePoint)
		playerData.push(["countInfo.todayOnLineTimeRewards." + playerDoc.countInfo.todayOnLineTimeRewards.indexOf(timePoint), timePoint])

		var items = DataUtils.getOnlineRewardItem(timePoint)
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getOnlineReward', {timePoint:timePoint}, items])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取14日登陆奖励
 * @param playerId
 * @param callback
 */
pro.getDay14Reward = function(playerId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(_.isEqual(playerDoc.countInfo.day14, playerDoc.countInfo.day14RewardsCount)) return Promise.reject(ErrorUtils.wonderAssistanceRewardAlreadyGet(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.countInfo.day14RewardsCount = playerDoc.countInfo.day14
		playerData.push(["countInfo.day14RewardsCount", playerDoc.countInfo.day14RewardsCount])
		var rewards = DataUtils.getDay14Rewards(playerDoc.countInfo.day14)
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'getDay14Reward', {currentDay:playerDoc.countInfo.day14}, rewards, true])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取新玩家冲级奖励
 * @param playerId
 * @param levelupIndex
 * @param callback
 */
pro.getLevelupReward = function(playerId, levelupIndex, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		var theLevelupIndex = _.find(playerDoc.countInfo.levelupRewards, function(reward){
			return reward == levelupIndex
		})
		if(Date.now() > DataUtils.getPlayerLevelupExpireTime(playerDoc)) return Promise.reject(ErrorUtils.levelUpRewardExpired(playerId))
		if(_.isNumber(theLevelupIndex)) return Promise.reject(ErrorUtils.levelUpRewardAlreadyGet(playerId))
		if(!DataUtils.isPlayerKeepLevelLegalForLevelupIndex(playerDoc, levelupIndex)) return Promise.reject(ErrorUtils.levelUpRewardCanNotBeGetForCastleLevelNotMatch(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.countInfo.levelupRewards.push(levelupIndex)
		playerData.push(["countInfo.levelupRewards." + playerDoc.countInfo.levelupRewards.indexOf(levelupIndex), levelupIndex])

		var items = DataUtils.getLevelupRewards(levelupIndex)
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getLevelupReward', {levelupIndex:levelupIndex}, items])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取首冲奖励
 * @param playerId
 * @param callback
 */
pro.getFirstIAPRewards = function(playerId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(playerDoc.countInfo.iapCount <= 0) return Promise.reject(ErrorUtils.firstIAPNotHappen(playerId))
		if(playerDoc.countInfo.isFirstIAPRewardsGeted) return Promise.reject(ErrorUtils.firstIAPRewardAlreadyGet(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.countInfo.isFirstIAPRewardsGeted = true
		playerDoc.basicInfo.buildQueue = 2
		playerData.push(["countInfo.isFirstIAPRewardsGeted", playerDoc.countInfo.isFirstIAPRewardsGeted])
		playerData.push(["basicInfo.buildQueue", playerDoc.basicInfo.buildQueue])

		var items = DataUtils.getFirstIAPRewards()
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getFirstIAPRewards', null, items])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 领取日常任务奖励
 * @param playerId
 * @param callback
 */
pro.getDailyTaskRewards = function(playerId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	var dailyTaskRewardCount = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc

		dailyTaskRewardCount = playerDoc.countInfo.dailyTaskRewardCount
		if(dailyTaskRewardCount >= DataUtils.getDailyTasksMaxCount()) return Promise.reject(ErrorUtils.dailyTaskRewardAlreadyGet(playerId))
		if(!DataUtils.isPlayerDailyTaskScoreReachIndex(playerDoc, dailyTaskRewardCount)) return Promise.reject(ErrorUtils.dailyTaskNotFinished(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.countInfo.dailyTaskRewardCount += 1;
		playerData.push(["countInfo.dailyTaskRewardCount", playerDoc.countInfo.dailyTaskRewardCount])
		var items = DataUtils.getDailyTaskRewardsByIndex(dailyTaskRewardCount);
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getDailyTaskRewards', null, items])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 领取成就任务奖励
 * @param playerId
 * @param taskType
 * @param taskId
 * @param callback
 */
pro.getGrowUpTaskRewards = function(playerId, taskType, taskId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	var task = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		task = _.find(playerDoc.growUpTasks[taskType], function(task){
			return _.isEqual(task.id, taskId)
		})
		if(!_.isObject(task)) return Promise.reject(ErrorUtils.growUpTaskNotExist(playerId, taskType, taskId))
		if(task.rewarded) return Promise.reject(ErrorUtils.growUpTaskRewardAlreadyGet(playerId, taskType, taskId))
		if(TaskUtils.hasPreGrowUpTask(playerDoc, taskType, task)) return Promise.reject(ErrorUtils.growUpTaskRewardCanNotBeGetForPreTaskRewardNotGet(playerId, taskType, taskId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		DataUtils.refreshPlayerResources(playerDoc)
		playerData.push(["resources", playerDoc.resources])
		var rewards = DataUtils.getGrowUpTaskRewards(taskType, taskId)
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'getGrowUpTaskRewards', {
			taskType:taskType,
			taskId:taskId
		}, rewards.rewards, true])
		var currentLevel = DataUtils.getPlayerLevel(playerDoc)
		playerDoc.basicInfo.levelExp += rewards.exp
		playerData.push(["basicInfo.levelExp", playerDoc.basicInfo.levelExp])
		var afterLevel = DataUtils.getPlayerLevel(playerDoc)
		if(afterLevel > currentLevel){
			var levelupRewards = DataUtils.getLevelUpRewards(currentLevel);
			updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'playerLevelUpRewards', {level:currentLevel}, levelupRewards, true])
		}

		task.rewarded = true
		TaskUtils.updateGrowUpTaskData(playerDoc, playerData, taskType, task)
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取联盟其他玩家赠送的礼品
 * @param playerId
 * @param giftId
 * @param callback
 */
pro.getIapGift = function(playerId, giftId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	var gift = null;
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		gift = _.find(playerDoc.iapGifts, function(gift){
			return _.isEqual(gift.id, giftId)
		})
		if(!_.isObject(gift)) return Promise.reject(ErrorUtils.giftNotExist(playerId, giftId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerData.push(["iapGifts." + playerDoc.iapGifts.indexOf(gift), null])
		LogicUtils.removeItemInArray(playerDoc.iapGifts, gift)
		if(gift.time >= Date.now() - (DataUtils.getPlayerIntInit("giftExpireHours") * 60 * 60 * 1000)){
			updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getIapGift', null, [{
				name:gift.name,
				count:gift.count
			}]])
		}
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取服务器列表
 * @param playerId
 * @param callback
 */
pro.getServers = function(playerId, callback){
	var self = this
	var serverInfos = [];
	var cacheServers = this.app.getServersByType("cache");
	var getServerInfo = function(server){
		return Promise.fromCallback(function(callback){
			self.app.rpc.cache.cacheRemote.getServerInfo.toServer(server.id, callback)
		}).then(function(serverInfo){
			serverInfos.push(serverInfo);
		})
	}

	var funcs = []
	_.each(cacheServers, function(server){
		funcs.push(getServerInfo(server))
	})
	Promise.all(funcs).then(function(){
		callback(null, serverInfos)
	}).catch(function(e){
		callback(e);
	})
}

/**
 * 切换服务器
 * @param playerId
 * @param serverId
 * @param callback
 */
pro.switchServer = function(playerId, serverId, callback){
	var self = this
	var playerDoc = null
	var switchCondition = null;
	var lockPairs = [];
	var eventFuncs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		return self.ServerState.findByIdAsync(serverId, 'openAt')
	}).then(function(doc){
		if(!doc) return Promise.reject(ErrorUtils.serverNotExist(playerId, serverId));
		switchCondition = DataUtils.getSwitchServerCondition(playerDoc, doc);
		if(!switchCondition.canSwitch){
			return Promise.reject(ErrorUtils.canNotSwitchToTheSelectedServer(playerId, serverId));
		}
		if(!_.isEmpty(playerDoc.allianceId)) return Promise.reject(ErrorUtils.playerAlreadyJoinAlliance(playerId, playerId))
		if(_.isEqual(playerDoc.serverId, serverId)) return Promise.reject(ErrorUtils.canNotSwitchToTheSameServer(playerId, serverId))
		var hasSellItems = _.some(playerDoc.deals, function(deal){
			return !deal.isSold;
		})
		if(hasSellItems) return Promise.reject(ErrorUtils.youHaveProductInSellCanNotSwitchServer(playerId, playerId));
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = switchCondition.gemUsed;
		if(gemUsed > playerDoc.resources.gem) return Promise.reject(ErrorUtils.gemNotEnough(playerId, gemUsed, playerDoc.resources.gem))
		if(gemUsed > 0){
			playerDoc.resources.gem -= gemUsed
			var gemUse = {
				serverId:self.cacheServerId,
				playerId:playerId,
				playerName:playerDoc.basicInfo.name,
				changed:-gemUsed,
				left:playerDoc.resources.gem,
				api:"switchServer"
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		playerDoc.requestToAllianceEvents = [];
		playerDoc.inviteToAllianceEvents = [];
		playerDoc.serverId = serverId
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback()
	}).then(
		function(){
			if(self.app.getServerById(playerDoc.logicServerId)){
				self.app.rpc.logic.logicRemote.kickPlayer.toServer(playerDoc.logicServerId, playerDoc._id, "切换服务器")
			}
		},
		function(e){
			callback(e)
		}
	)
}

/**
 * 设置玩家头像
 * @param playerId
 * @param icon
 * @param callback
 */
pro.setPlayerIcon = function(playerId, icon, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.basicInfo.icon = icon
		playerData.push(["basicInfo.icon", playerDoc.basicInfo.icon])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 解锁玩家第二条队列
 * @param playerId
 * @param callback
 */
pro.unlockPlayerSecondMarchQueue = function(playerId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(playerDoc.basicInfo.marchQueue >= 2) return Promise.reject(ErrorUtils.playerSecondMarchQueueAlreadyUnlocked(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var gemUsed = DataUtils.getPlayerIntInit("unlockPlayerSecondMarchQueue") - (250 * (playerDoc.countInfo.day14 - 1));
		if(gemUsed > 0){
			if(gemUsed > playerDoc.resources.gem) return Promise.reject(ErrorUtils.gemNotEnough(playerId, gemUsed, playerDoc.resources.gem))
			playerDoc.resources.gem -= gemUsed
			playerData.push(["resources.gem", playerDoc.resources.gem])
			var gemUse = {
				serverId:self.cacheServerId,
				playerId:playerId,
				playerName:playerDoc.basicInfo.name,
				changed:-gemUsed,
				left:playerDoc.resources.gem,
				api:"unlockPlayerSecondMarchQueue"
			}
			eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemUse])
		}
		playerDoc.basicInfo.marchQueue = 2
		playerData.push(["basicInfo.marchQueue", playerDoc.basicInfo.marchQueue])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 初始化玩家数据
 * @param playerId
 * @param terrain
 * @param language
 * @param callback
 */
pro.initPlayerData = function(playerId, terrain, language, callback){
	var self = this
	var playerDoc = null
	var lockPairs = [];
	var playerData = [];
	var eventFuncs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(!_.isEqual(playerDoc.basicInfo.terrain, Consts.None)) return Promise.reject(ErrorUtils.playerDataAlreadyInited(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		LogicUtils.initPlayerData(playerDoc, playerData, terrain, language);
		ItemUtils.newbeeProtect('newbeeProtect_1', playerDoc, playerData, null, null, eventFuncs, self.timeEventService)
		eventFuncs.push([self.dataService, self.dataService.updatePlayerSessionAsync, playerDoc, {inited:playerDoc.basicInfo.terrain !== Consts.None}])
		var welcomeMailTitleKey = DataUtils.getLocalizationConfig("player", "welcomeMailTitle_" + self.app.get('serverConfig').platform);
		var welcomeMailContentKey = DataUtils.getLocalizationConfig("player", "welcomeMailContent_" + self.app.get('serverConfig').platform);
		eventFuncs.push([self.dataService, self.dataService.sendSysMailAsync, playerId, welcomeMailTitleKey, [], welcomeMailContentKey, [], []]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 领取首次加入联盟奖励
 * @param playerId
 * @param allianceId
 * @param callback
 */
pro.getFirstJoinAllianceReward = function(playerId, allianceId, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		if(playerDoc.countInfo.firstJoinAllianceRewardGeted) return Promise.reject(ErrorUtils.firstJoinAllianceRewardAlreadyGeted(playerId))
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.countInfo.firstJoinAllianceRewardGeted = true
		playerData.push(['countInfo.firstJoinAllianceRewardGeted', true])
		var rewards = DataUtils.getFirstJoinAllianceRewards();
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'getFirstJoinAllianceReward', null, rewards, true])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取玩家城墙血量
 * @param playerId
 * @param memberId
 * @param callback
 */
pro.getPlayerWallInfo = function(playerId, memberId, callback){
	this.cacheService.findPlayerAsync(memberId).then(function(doc){
		DataUtils.refreshPlayerResources(doc)
		var info = {
			wallLevel:doc.buildings.location_21.level,
			wallHp:doc.resources.wallHp
		}
		callback(null, info)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 设置远程推送状态
 * @param playerId
 * @param type
 * @param status
 * @param callback
 */
pro.setPushStatus = function(playerId, type, status, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		playerDoc.pushStatus[type] = status;
		playerData.push(['pushStatus.' + type, status]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 战报分享
 * @param playerId
 * @param memberId
 * @param reportId
 * @param callback
 */
pro.getReportDetail = function(playerId, memberId, reportId, callback){
	var memberDoc = null;
	this.cacheService.findPlayerAsync(memberId).then(function(doc){
		if(!_.isObject(doc)) return Promise.reject(ErrorUtils.playerNotExist(playerId, memberId));
		memberDoc = doc;
		var report = _.find(memberDoc.reports, function(report){
			return _.isEqual(report.id, reportId);
		})
		if(!_.isObject(report)){
			var e = ErrorUtils.reportNotExist(memberId, reportId);
			e.isLegal = true;
			return Promise.reject(e);
		}
		callback(null, report);
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 根据昵称搜索玩家
 * @param playerId
 * @param memberName
 * @param fromIndex
 * @param callback
 */
pro.searchPlayerByName = function(playerId, memberName, fromIndex, callback){
	var self = this
	var limit = 15;
	var playerDocs = []
	var findPlayerAsync = new Promise(function(resolve, reject){
		self.cacheService.getPlayerModel().collection.find({
			serverId:self.app.getServerId(),
			"basicInfo.name":{$regex:memberName + '.*'}
		}, {
			_id:true,
			basicInfo:true
		}).skip(fromIndex).limit(limit).toArray(function(e, docs){
			if(_.isObject(e)) reject(e)
			else resolve(docs)
		})
	})

	findPlayerAsync.then(function(docs){
		_.each(docs, function(doc){
			var shortDoc = {
				id:doc._id,
				icon:doc.basicInfo.icon,
				name:doc.basicInfo.name,
				power:doc.basicInfo.power
			}
			playerDocs.push(shortDoc)
		})
	}).then(function(){
		callback(null, [limit, playerDocs])
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取服务器公告列表
 * @param callback
 */
pro.getServerNotices = function(callback){
	callback(null, this.app.get('__serverNotices'))
}

/**
 * 获取活动信息
 * @param callback
 */
pro.getActivities = function(callback){
	callback(null, this.activityService.activities);
}

/**
 * 获取玩家活动积分奖励
 * @param playerId
 * @param activityType
 * @param callback
 */
pro.getPlayerActivityScoreRewards = function(playerId, activityType, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var updateFuncs = [];
	var lockPairs = [];
	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var activity = playerDoc.activities[activityType];
		if(!DataUtils.isPlayerActivityValid(activity, self.activityService.activities)){
			return Promise.reject(ErrorUtils.invalidActivity(playerId, activity));
		}
		var nextRewardIndex = activity.scoreRewardedIndex + 1;
		var scoreNeed = DataUtils.getActivityScoreByIndex(activityType, nextRewardIndex);
		if(_.isUndefined(scoreNeed) || activity.score < scoreNeed){
			return Promise.reject(ErrorUtils.noAvailableRewardsCanGet(playerId, activity));
		}
		var items = DataUtils.getActivityScoreRewards(activityType, nextRewardIndex);
		activity.scoreRewardedIndex = nextRewardIndex;
		playerData.push(["activities." + activityType + '.scoreRewardedIndex', nextRewardIndex]);
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getPlayerActivityScoreRewards', {activityType:activityType}, items])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取玩家活动排名奖励
 * @param playerId
 * @param activityType
 * @param callback
 */
pro.getPlayerActivityRankRewards = function(playerId, activityType, callback){
	var self = this
	var playerDoc = null
	var playerData = []
	var updateFuncs = [];
	var lockPairs = [];
	var myRank = null;
	Promise.fromCallback(function(_callback){
		self.app.rpc.rank.rankRemote.getPlayerRank.toServer(self.rankServerId, self.cacheServerId, playerId, activityType, _callback)
	}).then(function(resp){
		myRank = resp;
		return self.cacheService.findPlayerAsync(playerId)
	}).then(function(doc){
		playerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
	}).then(function(){
		var activity = playerDoc.activities[activityType];
		if(!DataUtils.isPlayerExpiredActivityValid(activity, self.activityService.activities)){
			return Promise.reject(ErrorUtils.invalidActivity(playerId, activity));
		}
		if(!myRank){
			return Promise.reject(ErrorUtils.noAvailableRewardsCanGet(playerId, activity));
		}
		if(activity.rankRewardsGeted){
			return Promise.reject(ErrorUtils.noAvailableRewardsCanGet(playerId, activity));
		}
		var items = DataUtils.getActivityRankRewards(activityType, myRank);
		activity.rankRewardsGeted = true;
		playerData.push(["activities." + activityType + '.rankRewardsGeted', true]);
		updateFuncs.push([self.dataService, self.dataService.addPlayerItemsAsync, playerDoc, playerData, 'getPlayerActivityRankRewards', {
			activityType:activityType,
			myRank:myRank
		}, items])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		callback(e)
	})
}

/**
 * 获取我的墨子信息
 * @param playerId
 * @param callback
 */
pro.getMyModData = function(playerId, callback){
	var self = this;
	self.app.get('Mod').findById(playerId).then(function(doc){
		callback(null, doc);
	}).catch(function(e){
		callback(e);
	});
}

/**
 * 获取被禁言列表
 * @param playerId
 * @param callback
 */
pro.getMutedPlayerList = function(playerId, callback){
	var self = this;
	self.app.get('Muted').find({
		finishTime:{$gt:Date.now()}
	}).then(function(docs){
		callback(null, docs);
	}).catch(function(e){
		callback(e);
	});
}

/**
 * 禁言玩家
 * @param playerId
 * @param targetPlayerId
 * @param muteMinutes
 * @param muteReason
 * @param callback
 */
pro.mutePlayer = function(playerId, targetPlayerId, muteMinutes, muteReason, callback){
	var self = this;
	var modDoc = null;
	var targetPlayerDoc = null;
	var targetPlayerData = [];
	var lockPairs = [];
	var muteFinishTime = Date.now() + (muteMinutes * 60 * 1000);
	self.cacheService.findPlayerAsync(targetPlayerId).then(function(doc){
		if(!doc){
			return Promise.reject(ErrorUtils.playerNotExist(playerId, targetPlayerId));
		}
		targetPlayerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:targetPlayerDoc._id});
		return self.app.get('Mod').findById(playerId)
	}).then(function(doc){
		if(!doc){
			return Promise.reject(ErrorUtils.youAreNotTheMod(playerId));
		}
		modDoc = doc;
		return self.app.get('Muted').findById(targetPlayerId)
	}).then(function(doc){
		if(!!doc){
			doc.name = targetPlayerDoc.basicInfo.name;
			doc.icon = targetPlayerDoc.basicInfo.icon;
			doc.serverId = targetPlayerDoc.serverId;
			doc.reason = muteReason;
			doc.by.id = modDoc._id;
			doc.by.name = modDoc.name;
			doc.finishTime = muteFinishTime;
			doc.time = Date.now();
			return doc.save();
		}else{
			var muted = {
				_id:targetPlayerDoc._id,
				name:targetPlayerDoc.basicInfo.name,
				icon:targetPlayerDoc.basicInfo.icon,
				serverId:targetPlayerDoc.serverId,
				reason:muteReason,
				by:{
					id:modDoc._id,
					name:modDoc.name
				},
				finishTime:muteFinishTime
			};
			return self.app.get('Muted').create(muted);
		}
	}).then(function(){
		var modLog = {
			mod:{
				id:modDoc._id,
				name:modDoc.name
			},
			action:{
				type:Consts.ModActionType.Mute,
				value:targetPlayerId + '::' + targetPlayerDoc.basicInfo.name
			}
		}
		return self.app.get('ModLog').create(modLog);
	}).then(function(){
		targetPlayerDoc.countInfo.muteTime = muteFinishTime;
		targetPlayerData.push(['countInfo.muteTime', muteFinishTime]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.dataService.updatePlayerSessionAsync(targetPlayerDoc, {muteTime:targetPlayerDoc.countInfo.muteTime});
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(targetPlayerDoc, targetPlayerData);
	}).then(function(){
		var titleKey = DataUtils.getLocalizationConfig("player", "MuteTitle")
		var contentKey = DataUtils.getLocalizationConfig("player", "MuteContent")
		return self.dataService.sendSysMailAsync(targetPlayerId, titleKey, [], contentKey, [modDoc.name, muteMinutes, muteReason], []);
	}).then(function(){
		var content = DataUtils.getLocalizationConfig("player", "ChatMuteNotice").en;
		var contentArgs = [targetPlayerDoc.basicInfo.name, modDoc.name, muteMinutes, muteReason];
		content = sprintf.vsprintf(content, contentArgs)
		return Promise.fromCallback(function(_callback){
			self.app.rpc.chat.gmApiRemote.sendSysChat.toServer(self.app.get('chatServerId'), content, _callback)
		});
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
}

/**
 * 提前解禁玩家
 * @param playerId
 * @param targetPlayerId
 * @param callback
 */
pro.unMutePlayer = function(playerId, targetPlayerId, callback){
	var self = this;
	var modDoc = null;
	var targetPlayerDoc = null;
	var targetPlayerData = [];
	var lockPairs = [];
	self.cacheService.findPlayerAsync(targetPlayerId).then(function(doc){
		if(!doc){
			return Promise.reject(ErrorUtils.playerNotExist(playerId, targetPlayerId));
		}
		targetPlayerDoc = doc;
		lockPairs.push({key:Consts.Pairs.Player, value:targetPlayerDoc._id});
		return self.app.get('Mod').findById(playerId)
	}).then(function(doc){
		if(!doc){
			return Promise.reject(ErrorUtils.youAreNotTheMod(playerId));
		}
		modDoc = doc;
		return self.app.get('Muted').findByIdAndRemove(targetPlayerId)
	}).then(function(){
		var modLog = {
			mod:{
				id:modDoc._id,
				name:modDoc.name
			},
			action:{
				type:Consts.ModActionType.UnMute,
				value:targetPlayerId + '::' + targetPlayerDoc.basicInfo.name
			}
		}
		return self.app.get('ModLog').create(modLog);
	}).then(function(){
		targetPlayerDoc.countInfo.muteTime = 0;
		targetPlayerData.push(['countInfo.muteTime', 0]);
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.dataService.updatePlayerSessionAsync(targetPlayerDoc, {muteTime:targetPlayerDoc.countInfo.muteTime});
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(targetPlayerDoc, targetPlayerData);
	}).then(function(){
		var titleKey = DataUtils.getLocalizationConfig("player", "UnMuteTitle")
		var contentKey = DataUtils.getLocalizationConfig("player", "UnMuteContent")
		return self.dataService.sendSysMailAsync(targetPlayerId, titleKey, [], contentKey, [], []);
	}).then(function(){
		callback();
	}).catch(function(e){
		callback(e);
	});
}
