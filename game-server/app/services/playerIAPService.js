"use strict"

/**
 * Created by modun on 15/2/1.
 */

var ShortId = require("shortid")
var request = require('request')
var Promise = require("bluebird")
var _ = require("underscore")
var DOMParser = require('xmldom').DOMParser;
var SignedXml = require('xml-crypto').SignedXml
	, FileKeyInfo = require('xml-crypto').FileKeyInfo
	, select = require('xml-crypto').xpath
var IABVerifier = require('iab_verifier')

var LogicUtils = require("../utils/logicUtils")
var DataUtils = require("../utils/dataUtils");
var ErrorUtils = require("../utils/errorUtils")
var Consts = require("../consts/consts")
var Define = require("../consts/define")

var GameDatas = require("../datas/GameDatas")
var StoreItems = GameDatas.StoreItems

var PlayerIAPService = function(app){
	this.app = app
	this.env = app.get("env")
	this.logService = app.get("logService")
	this.pushService = app.get("pushService")
	this.cacheService = app.get('cacheService');
	this.dataService = app.get('dataService');
	this.Billing = app.get("Billing")
	this.GemChange = app.get("GemChange")
	this.platform = app.get('serverConfig').platform;
	this.platformParams = app.get('serverConfig')[this.platform];
	this.cacheServerId = app.getServerId();
}

module.exports = PlayerIAPService
var pro = PlayerIAPService.prototype


/**
 21000
 The App Store could not read the JSON object you provided.
 21002
 The data in the receipt-data property was malformed or missing.
 21003
 The receipt could not be authenticated.
 21004
 The shared secret you provided does not match the shared secret on file for your account.
 Only returned for iOS 6 style transaction receipts for auto-renewable subscriptions.
 21005
 The receipt server is not currently available.
 21006
 This receipt is valid but the subscription has expired. When this status code is returned to your server, the receipt data is also decoded and returned as part of the response.
 Only returned for iOS 6 style transaction receipts for auto-renewable subscriptions.
 21007
 This receipt is from the test environment, but it was sent to the production environment for verification. Send it to the test environment instead.
 21008
 This receipt is from the production environment, but it was sent to the test environment for verification. Send it to the production environment instead.
 */

/**
 * 去苹果商店验证
 * @param playerDoc
 * @param receiptData
 * @param callback
 */
var IosBillingValidate = function(playerDoc, receiptData, callback){
	var self = this;
	var body = {
		"receipt-data":new Buffer(receiptData).toString("base64")
	}
	request.post(this.platformParams.iapValidateUrl, {form:JSON.stringify(body)}, function(e, resp, body){
		if(!!e){
			e = new Error("请求苹果验证服务器网络错误,错误信息:" + e.message);
			self.logService.onError('cache.playerIAPService.IosBillingValidate', null, e.stack);
			return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
		}
		if(resp.statusCode !== 200){
			e = new Error("服务器未返回正确的状态码:" + resp.statusCode);
			self.logService.onError('cache.playerIAPService.IosBillingValidate', {statusCode:resp.statusCode}, e.stack);
			return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
		}
		try{
			var jsonObj = JSON.parse(body)
		}catch(e){
			e = new Error("解析苹果返回的json信息出错,错误信息:" + e.message);
			self.logService.onError('cache.playerIAPService.IosBillingValidate', {body:body}, e.stack);
			return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
		}
		if(jsonObj.status == 0){
			callback(null, jsonObj.receipt)
		}else if(jsonObj.status == 21005){
			e = new Error("苹果验证服务器不可用");
			self.logService.onError('cache.playerIAPService.IosBillingValidate', {jsonObj:jsonObj}, e.stack);
			callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message))
		}else{
			callback(ErrorUtils.iapValidateFaild(playerDoc._id, jsonObj))
		}
	})
}

/**
 * Wp官方商店验证
 * @param playerDoc
 * @param receiptData
 * @param callback
 */
var WpOfficialBillingValidate = function(playerDoc, receiptData, callback){
	var doc = new DOMParser().parseFromString(receiptData);
	var signature = select(doc, "/*/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']")[0];
	var e = null;
	if(!signature){
		e = new Error("错误的receiptData");
		this.logService.onError('cache.playerIAPService.WpOfficialBillingValidate', {receiptData:receiptData}, e.stack);
		return callback(ErrorUtils.iapValidateFaild(playerDoc._id));
	}
	var sig = new SignedXml();
	sig.keyInfoProvider = new FileKeyInfo(this.app.getBase() + '/config/' + this.platformParams.officialIapValidateCert);
	sig.loadSignature(signature.toString());
	var res = sig.checkSignature(receiptData);
	if(!res)return callback(ErrorUtils.iapValidateFaild(playerDoc._id, sig.validationErrors));
	var receipt = doc.getElementsByTagName('Receipt')[0];
	var productReceipt = receipt.getElementsByTagName('ProductReceipt')[0];
	var productId = productReceipt.getAttribute('ProductId');
	var transactionId = productReceipt.getAttribute('Id');
	callback(null, {
		transactionId:transactionId,
		productId:productId,
		quantity:1
	})
}

/**
 * Wp Adeasygo 订单验证
 * @param playerDoc
 * @param uid
 * @param transactionId
 * @param callback
 */
var WpAdeasygoBillingValidate = function(playerDoc, uid, transactionId, callback){
	var self = this;
	var form = {
		uid:uid,
		trade_no:transactionId,
		show_detail:1
	}
	request.post(self.platformParams.adeasygoIapValidateUrl, {form:form}, function(e, resp, body){
		if(!!e){
			e = new Error("请求Adeasygo验证服务器网络错误,错误信息:" + e.message);
			self.logService.onError('cache.playerIAPService.WpAdeasygoBillingValidate', null, e.stack);
			return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
		}
		if(resp.statusCode !== 200){
			e = new Error("服务器未返回正确的状态码:" + resp.statusCode);
			self.logService.onError('cache.playerIAPService.WpAdeasygoBillingValidate', {statusCode:resp.statusCode}, e.stack);
			return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
		}
		try{
			var jsonObj = JSON.parse(body)
		}catch(e){
			e = new Error("解析Adeasygo返回的json信息出错,错误信息:" + e.message);
			self.logService.onError('cache.playerIAPService.WpAdeasygoBillingValidate', {body:body}, e.stack);
			return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
		}
		if(jsonObj.code !== 1 || !jsonObj.trade_detail || jsonObj.trade_detail.app_id !== self.platformParams.adeasygoAppId){
			return callback(ErrorUtils.iapValidateFaild(playerDoc._id, jsonObj))
		}
		var productId = jsonObj.trade_detail.out_goods_id;
		var itemConfig = DataUtils.getStoreProudctConfig(productId);
		if(!itemConfig){
			var e = ErrorUtils.iapProductNotExist(playerDoc._id, productId);
			e.isLegal = true;
			return callback(e);
		}


		var tryTimes = 0;
		var maxTryTimes = 5;
		(function finishTransaction(){
			tryTimes++;
			var form = {
				trade_no:transactionId
			}
			request.post(self.platformParams.adeasygoIapStatusUpdateUrl, {form:form}, function(e, resp, body){
				if(!!e){
					e = new Error("请求Adeasygo更新订单状态出错,错误信息:" + e.message);
					self.logService.onError('cache.playerIAPService.WpAdeasygoBillingValidate', null, e.stack);
					if(tryTimes < maxTryTimes){
						return setTimeout(finishTransaction, 500);
					}else{
						return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message))
					}
				}
				if(resp.statusCode !== 200){
					e = new Error("服务器未返回正确的状态码:" + resp.statusCode);
					self.logService.onError('cache.playerIAPService.WpAdeasygoBillingValidate', {statusCode:resp.statusCode}, e.stack);
					if(tryTimes < maxTryTimes){
						return setTimeout(finishTransaction, 500);
					}else{
						return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
					}
				}
				try{
					var jsonObj = JSON.parse(body)
				}catch(e){
					e = new Error("解析Adeasygo返回的json信息出错,错误信息:" + e.message);
					self.logService.onError('cache.playerIAPService.WpAdeasygoBillingValidate', {body:body}, e.stack);
					if(tryTimes < maxTryTimes){
						return setTimeout(finishTransaction, 500);
					}else{
						return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
					}
				}
				if(jsonObj.code !== 1){
					if(tryTimes < maxTryTimes){
						return setTimeout(finishTransaction, 500);
					}else{
						return callback(ErrorUtils.iapValidateFaild(playerDoc._id, jsonObj))
					}
				}else{
					callback(null, {
						transactionId:transactionId,
						productId:productId,
						quantity:1
					})
				}
			})
		})();
	})
}

/**
 * Android官方商店验证
 * @param playerDoc
 * @param receiptData
 * @param receiptSignature
 * @param callback
 */
var AndroidOfficialBillingValidate = function(playerDoc, receiptData, receiptSignature, callback){
	var googleplayVerifier = new IABVerifier(this.platformParams.pubkey);
	var isValid = googleplayVerifier.verifyReceipt(receiptData, receiptSignature);
	if(!isValid){
		var e = new Error("错误的receiptData或receiptSignature");
		this.logService.onError('cache.playerIAPService.AndroidOfficialBillingValidate', {
			receiptData:receiptData,
			receiptSignature:receiptSignature
		}, e.stack);
		return callback(ErrorUtils.iapValidateFaild(playerDoc._id));
	}

	var jsonObj = JSON.parse(receiptData);
	callback(null, {
		transactionId:jsonObj.orderId,
		productId:jsonObj.productId,
		quantity:1
	})
}

/**
 * 创建订单记录
 * @param playerDoc
 * @param type
 * @param transactionId
 * @param productId
 * @param quantity
 * @param price
 * @returns {*}
 */
var CreateBillingItem = function(playerDoc, type, transactionId, productId, quantity, price){
	var billing = {
		type:type,
		playerId:playerDoc._id,
		playerName:playerDoc.basicInfo.name,
		serverId:playerDoc.serverId,
		transactionId:transactionId,
		productId:productId,
		quantity:quantity,
		price:quantity * price
	}
	return billing
}

/**
 * 发送宝箱给联盟玩家
 * @param senderId
 * @param senderName
 * @param memberId
 * @param reward
 * @param callback
 */
pro.sendAllianceMembersRewards = function(senderId, senderName, memberId, reward, callback){
	var self = this
	var memberDoc = null
	var memberData = []
	var lockPairs = [];
	this.cacheService.findPlayerAsync(memberId).then(function(doc){
		memberDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:memberDoc._id});
	}).then(function(){
		var iapGift = {
			id:ShortId.generate(),
			from:senderName,
			name:reward.name,
			count:reward.count,
			time:Date.now()
		}
		if(memberDoc.iapGifts.length >= Define.PlayerIapGiftsMaxSize){
			var giftToRemove = memberDoc.iapGifts[0]
			memberData.push(["iapGifts." + memberDoc.iapGifts.indexOf(giftToRemove), null])
			LogicUtils.removeItemInArray(memberDoc.iapGifts, giftToRemove)
		}
		memberDoc.iapGifts.push(iapGift)
		memberData.push(["iapGifts." + memberDoc.iapGifts.indexOf(iapGift), iapGift])
	}).then(function(){
		return self.cacheService.touchAllAsync(lockPairs);
	}).then(function(){
		return self.pushService.onPlayerDataChangedAsync(memberDoc, memberData)
	}).then(function(){
		callback();
	}).catch(function(e){
		self.logService.onError("logic.playerIAPService.sendAllianceMembersRewards", {
			senderId:senderId,
			memberId:memberId,
			reward:reward
		}, e.stack)
		callback();
	})
}

/**
 * 上传IosIAP信息
 * @param playerId
 * @param productId
 * @param transactionId
 * @param receiptData
 * @param callback
 */
pro.addIosPlayerBillingData = function(playerId, productId, transactionId, receiptData, callback){
	var self = this
	var playerDoc = null
	var allianceDoc = null
	var billing = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = [];
	var eventFuncs = [];
	var rewards = null

	var itemConfig = DataUtils.getStoreProudctConfig(productId);
	if(!_.isObject(itemConfig)){
		var e = ErrorUtils.iapProductNotExist(playerId, productId);
		e.isLegal = true;
		return callback(e);
	}

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		return self.cacheService.lockAllAsync(lockPairs, true)
	}).then(function(){
		return self.Billing.findOneAsync({transactionId:transactionId})
	}).then(function(doc){
		if(!!doc) return Promise.reject(ErrorUtils.duplicateIAPTransactionId(playerId, transactionId))
		var billingValidateAsync = Promise.promisify(IosBillingValidate, {context:self})
		return billingValidateAsync(playerDoc, receiptData)
	}).then(function(respData){
		billing = CreateBillingItem(playerDoc, Consts.BillingType.Ios, respData.transaction_id, respData.product_id, respData.quantity, itemConfig.price);
		return self.Billing.createAsync(billing)
	}).then(function(){
		var quantity = billing.quantity
		playerDoc.resources.gem += itemConfig.gem * quantity
		playerData.push(["resources.gem", playerDoc.resources.gem])
		playerDoc.countInfo.iapCount += 1
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount])
		playerDoc.countInfo.iapGemCount += itemConfig.gem * quantity;
		playerData.push(["countInfo.iapGemCount", playerDoc.countInfo.iapGemCount])

		var gameInfo = self.app.get('__gameInfo');
		if(gameInfo.iapGemEventFinishTime > Date.now()){
			if(playerDoc.iapGemEvent.finishTime !== gameInfo.iapGemEventFinishTime){
				playerDoc.iapGemEvent.finishTime = gameInfo.iapGemEventFinishTime;
				playerDoc.iapGemEvent.iapRewardedIndex = -1;
				playerDoc.iapGemEvent.iapGemCount = 0;
			}
			playerDoc.iapGemEvent.iapGemCount += itemConfig.gem * quantity;
			playerData.push(['iapGemEvent', playerDoc.iapGemEvent]);
		}

		rewards = DataUtils.getStoreProductRewardsFromConfig(itemConfig)
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'addIosPlayerBillingData', null, rewards.rewardsToMe, true]);
		var gemAdd = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:itemConfig.gem * quantity,
			left:playerDoc.resources.gem,
			api:"addIosPlayerBillingData",
			params:{
				productId:productId,
				transactionId:transactionId
			}
		}

		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemAdd])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.unlockAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		callback(null, playerData)
	}).then(
		function(){
			if(!rewards.rewardToAllianceMember || !playerDoc.allianceId) return;
			self.cacheService.findAllianceAsync(playerDoc.allianceId).then(function(doc){
				allianceDoc = doc
				var memberIds = [];
				_.each(allianceDoc.members, function(member){
					if(!_.isEqual(member.id, playerId)) memberIds.push(member.id);
				});
				(function sendRewards(){
					if(memberIds.length === 0) return;
					var memberId = memberIds.pop();
					self.sendAllianceMembersRewardsAsync(playerId, playerDoc.basicInfo.name, memberId, rewards.rewardToAllianceMember).finally(function(){
						sendRewards();
					})
				})();
			})
		},
		function(e){
			if(!ErrorUtils.isObjectLockedError(e) && lockPairs.length > 0) self.cacheService.unlockAll(lockPairs);
			callback(e)
		}
	)
}

/**
 * 上传Wp官方IAP信息
 * @param playerId
 * @param productId
 * @param transactionId
 * @param receiptData
 * @param callback
 */
pro.addWpOfficialPlayerBillingData = function(playerId, productId, transactionId, receiptData, callback){
	var self = this
	var playerDoc = null
	var allianceDoc = null
	var billing = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var updateFuncs = []
	var rewards = null

	var itemConfig = DataUtils.getStoreProudctConfig(productId);
	if(!_.isObject(itemConfig)){
		var e = ErrorUtils.iapProductNotExist(playerId, productId);
		e.isLegal = true;
		return callback(e);
	}

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		return self.cacheService.lockAllAsync(lockPairs, true)
	}).then(function(){
		return self.Billing.findOneAsync({transactionId:transactionId})
	}).then(function(doc){
		if(_.isObject(doc)) return Promise.reject(ErrorUtils.duplicateIAPTransactionId(playerId, transactionId))
		var billingValidateAsync = Promise.promisify(WpOfficialBillingValidate, {context:self})
		return billingValidateAsync(playerDoc, receiptData)
	}).then(function(respData){
		billing = CreateBillingItem(playerDoc, Consts.BillingType.WpOfficial, respData.transactionId, respData.productId, respData.quantity, itemConfig.price);
		return self.Billing.createAsync(billing)
	}).then(function(){
		var quantity = billing.quantity
		playerDoc.resources.gem += itemConfig.gem * quantity
		playerData.push(["resources.gem", playerDoc.resources.gem])
		playerDoc.countInfo.iapCount += 1
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount])
		playerDoc.countInfo.iapGemCount += itemConfig.gem * quantity;
		playerData.push(["countInfo.iapGemCount", playerDoc.countInfo.iapGemCount])

		var gameInfo = self.app.get('__gameInfo');
		if(gameInfo.iapGemEventFinishTime > Date.now()){
			if(playerDoc.iapGemEvent.finishTime !== gameInfo.iapGemEventFinishTime){
				playerDoc.iapGemEvent.finishTime = gameInfo.iapGemEventFinishTime;
				playerDoc.iapGemEvent.iapRewardedIndex = -1;
				playerDoc.iapGemEvent.iapGemCount = 0;
			}
			playerDoc.iapGemEvent.iapGemCount += itemConfig.gem * quantity;
			playerData.push(['iapGemEvent', playerDoc.iapGemEvent]);
		}

		rewards = DataUtils.getStoreProductRewardsFromConfig(itemConfig)
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'addWpOfficialPlayerBillingData', null, rewards.rewardsToMe, true]);
		var gemAdd = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:itemConfig.gem * quantity,
			left:playerDoc.resources.gem,
			api:"addWpOfficialPlayerBillingData",
			params:{
				productId:productId,
				transactionId:transactionId
			}
		}
		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemAdd])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.unlockAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).then(
		function(){
			if(!rewards.rewardToAllianceMember || !playerDoc.allianceId) return;
			self.cacheService.findAllianceAsync(playerDoc.allianceId).then(function(doc){
				allianceDoc = doc
				var memberIds = [];
				_.each(allianceDoc.members, function(member){
					if(!_.isEqual(member.id, playerId)) memberIds.push(member.id);
				});
				(function sendRewards(){
					if(memberIds.length === 0) return;
					var memberId = memberIds.pop();
					self.sendAllianceMembersRewardsAsync(playerId, playerDoc.basicInfo.name, memberId, rewards.rewardToAllianceMember).finally(function(){
						sendRewards();
					})
				})();
			})
		},
		function(e){
			if(!ErrorUtils.isObjectLockedError(e) && lockPairs.length > 0) self.cacheService.unlockAll(lockPairs);
			callback(e)
		}
	)
}

/**
 * 上传Wp Adeasygo IAP信息
 * @param playerId
 * @param uid
 * @param transactionId
 * @param callback
 * @returns {*}
 */
pro.addWpAdeasygoPlayerBillingData = function(playerId, uid, transactionId, callback){
	var self = this
	var playerDoc = null
	var allianceDoc = null
	var billing = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = [];
	var updateFuncs = []
	var rewards = null
	var itemConfig = null;

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		return self.cacheService.lockAllAsync(lockPairs, true)
	}).then(function(){
		return self.Billing.findOneAsync({transactionId:transactionId})
	}).then(function(doc){
		if(_.isObject(doc)) return Promise.reject(ErrorUtils.duplicateIAPTransactionId(playerId, transactionId))
		var billingValidateAsync = Promise.promisify(WpAdeasygoBillingValidate, {context:self})
		return billingValidateAsync(playerDoc, uid, transactionId)
	}).then(function(respData){
		itemConfig = DataUtils.getStoreProudctConfig(respData.productId);
		if(!itemConfig){
			var e = ErrorUtils.iapProductNotExist(playerId, respData.productId);
			e.isLegal = true;
			return Promise.reject(e);
		}
		billing = CreateBillingItem(playerDoc, Consts.BillingType.WpAdeasygo, respData.transactionId, respData.productId, respData.quantity, itemConfig.price);
		return self.Billing.createAsync(billing)
	}).then(function(){
		var quantity = billing.quantity
		playerDoc.resources.gem += itemConfig.gem * quantity
		playerData.push(["resources.gem", playerDoc.resources.gem])
		playerDoc.countInfo.iapCount += 1
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount])
		playerDoc.countInfo.iapGemCount += itemConfig.gem * quantity;
		playerData.push(["countInfo.iapGemCount", playerDoc.countInfo.iapGemCount])

		var gameInfo = self.app.get('__gameInfo');
		if(gameInfo.iapGemEventFinishTime > Date.now()){
			if(playerDoc.iapGemEvent.finishTime !== gameInfo.iapGemEventFinishTime){
				playerDoc.iapGemEvent.finishTime = gameInfo.iapGemEventFinishTime;
				playerDoc.iapGemEvent.iapRewardedIndex = -1;
				playerDoc.iapGemEvent.iapGemCount = 0;
			}
			playerDoc.iapGemEvent.iapGemCount += itemConfig.gem * quantity;
			playerData.push(['iapGemEvent', playerDoc.iapGemEvent]);
		}

		rewards = DataUtils.getStoreProductRewardsFromConfig(itemConfig)
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'addWpAdeasygoPlayerBillingData', null, rewards.rewardsToMe, true]);
		var gemAdd = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:itemConfig.gem * quantity,
			left:playerDoc.resources.gem,
			api:"addWpAdeasygoPlayerBillingData",
			params:{
				productId:billing.productId,
				transactionId:transactionId
			}
		}
		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemAdd])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.unlockAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, [playerData, billing.productId])
	}).then(
		function(){
			if(!rewards.rewardToAllianceMember || !playerDoc.allianceId) return;
			self.cacheService.findAllianceAsync(playerDoc.allianceId).then(function(doc){
				allianceDoc = doc
				var memberIds = [];
				_.each(allianceDoc.members, function(member){
					if(!_.isEqual(member.id, playerId)) memberIds.push(member.id);
				});
				(function sendRewards(){
					if(memberIds.length === 0) return;
					var memberId = memberIds.pop();
					self.sendAllianceMembersRewardsAsync(playerId, playerDoc.basicInfo.name, memberId, rewards.rewardToAllianceMember).finally(function(){
						sendRewards();
					})
				})();
			})
		},
		function(e){
			if(!ErrorUtils.isObjectLockedError(e) && lockPairs.length > 0) self.cacheService.unlockAll(lockPairs);
			callback(e)
		}
	)
}

/**
 * 上传Android官方IAP信息
 * @param playerId
 * @param productId
 * @param transactionId
 * @param receiptData
 * @param receiptSignature
 * @param callback
 */
pro.addAndroidOfficialPlayerBillingData = function(playerId, productId, transactionId, receiptData, receiptSignature, callback){
	var self = this
	var playerDoc = null
	var allianceDoc = null
	var billing = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	var eventFuncs = [];
	var rewards = null

	var itemConfig = DataUtils.getStoreProudctConfig(productId);
	if(!_.isObject(itemConfig)){
		var e = ErrorUtils.iapProductNotExist(playerId, productId);
		e.isLegal = true;
		return callback(e);
	}

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		return self.cacheService.lockAllAsync(lockPairs, true)
	}).then(function(){
		return self.Billing.findOneAsync({transactionId:transactionId})
	}).then(function(doc){
		if(_.isObject(doc)) return Promise.reject(ErrorUtils.duplicateIAPTransactionId(playerId, transactionId))
		var billingValidateAsync = Promise.promisify(AndroidOfficialBillingValidate, {context:self})
		return billingValidateAsync(playerDoc, receiptData, receiptSignature)
	}).then(function(respData){
		billing = CreateBillingItem(playerDoc, Consts.BillingType.AndroidOffical, respData.transactionId, respData.productId, respData.quantity, itemConfig.price);
		return self.Billing.createAsync(billing)
	}).then(function(){
		var quantity = billing.quantity
		playerDoc.resources.gem += itemConfig.gem * quantity
		playerData.push(["resources.gem", playerDoc.resources.gem])
		playerDoc.countInfo.iapCount += 1
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount])
		playerDoc.countInfo.iapGemCount += itemConfig.gem * quantity;
		playerData.push(["countInfo.iapGemCount", playerDoc.countInfo.iapGemCount])

		var gameInfo = self.app.get('__gameInfo');
		if(gameInfo.iapGemEventFinishTime > Date.now()){
			if(playerDoc.iapGemEvent.finishTime !== gameInfo.iapGemEventFinishTime){
				playerDoc.iapGemEvent.finishTime = gameInfo.iapGemEventFinishTime;
				playerDoc.iapGemEvent.iapRewardedIndex = -1;
				playerDoc.iapGemEvent.iapGemCount = 0;
			}
			playerDoc.iapGemEvent.iapGemCount += itemConfig.gem * quantity;
			playerData.push(['iapGemEvent', playerDoc.iapGemEvent]);
		}

		rewards = DataUtils.getStoreProductRewardsFromConfig(itemConfig)
		updateFuncs.push([self.dataService, self.dataService.addPlayerRewardsAsync, playerDoc, playerData, 'addAndroidOfficialPlayerBillingData', null, rewards.rewardsToMe, true]);
		var gemAdd = {
			serverId:self.cacheServerId,
			playerId:playerId,
			playerName:playerDoc.basicInfo.name,
			changed:itemConfig.gem * quantity,
			left:playerDoc.resources.gem,
			api:"addAndroidOfficialPlayerBillingData",
			params:{
				productId:productId,
				transactionId:transactionId
			}
		}

		eventFuncs.push([self.GemChange, self.GemChange.createAsync, gemAdd])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
		return Promise.resolve()
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.unlockAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs)
	}).then(function(){
		callback(null, playerData)
	}).then(
		function(){
			if(!rewards.rewardToAllianceMember || !playerDoc.allianceId) return;
			self.cacheService.findAllianceAsync(playerDoc.allianceId).then(function(doc){
				allianceDoc = doc
				var memberIds = [];
				_.each(allianceDoc.members, function(member){
					if(!_.isEqual(member.id, playerId)) memberIds.push(member.id);
				});
				(function sendRewards(){
					if(memberIds.length === 0) return;
					var memberId = memberIds.pop();
					self.sendAllianceMembersRewardsAsync(playerId, playerDoc.basicInfo.name, memberId, rewards.rewardToAllianceMember).finally(function(){
						sendRewards();
					})
				})();
			})
		},
		function(e){
			if(!ErrorUtils.isObjectLockedError(e) && lockPairs.length > 0) self.cacheService.unlockAll(lockPairs);
			callback(e)
		}
	)
}

/**
 * 上传Ios月卡IAP信息
 * @param playerId
 * @param productId
 * @param transactionId
 * @param receiptData
 * @param callback
 */
pro.addIosMonthcardBillingData = function(playerId, productId, transactionId, receiptData, callback){
	var self = this
	var playerDoc = null
	var billing = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = [];
	var eventFuncs = [];

	var itemConfig = DataUtils.getStoreMonthcardProductConfig(productId);
	if(!_.isObject(itemConfig)){
		var e = ErrorUtils.iapProductNotExist(playerId, productId);
		e.isLegal = true;
		return callback(e);
	}

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		return self.cacheService.lockAllAsync(lockPairs, true)
	}).then(function(){
		return self.Billing.findOneAsync({transactionId:transactionId})
	}).then(function(doc){
		if(!!doc) return Promise.reject(ErrorUtils.duplicateIAPTransactionId(playerId, transactionId))
		var billingValidateAsync = Promise.promisify(IosBillingValidate, {context:self})
		return billingValidateAsync(playerDoc, receiptData)
	}).then(function(respData){
		billing = CreateBillingItem(playerDoc, Consts.BillingType.Ios, respData.transaction_id, respData.product_id, respData.quantity, itemConfig.price);
		return self.Billing.createAsync(billing)
	}).then(function(){
		var quantity = billing.quantity
		if(playerDoc.monthCard.index !== itemConfig.index){
			playerDoc.monthCard.index = itemConfig.index;
			playerDoc.monthCard.finishTime = 0;
		}
		var finishTime = playerDoc.monthCard.finishTime > Date.now() ?
		playerDoc.monthCard.finishTime + (DataUtils.getPlayerIntInit('monthCardTotalDays') * 24 * 60 * 60 * 1000 * quantity) :
			LogicUtils.getNextDateTime(LogicUtils.getTodayDateTime(), DataUtils.getPlayerIntInit('monthCardTotalDays') * quantity);
		playerDoc.monthCard.finishTime = finishTime;
		playerDoc.monthCard.todayRewardsGet = false;
		playerData.push(['monthCard', playerDoc.monthCard]);
		playerDoc.countInfo.iapCount += 1
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.unlockAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		if(!ErrorUtils.isObjectLockedError(e) && lockPairs.length > 0){
			self.cacheService.unlockAll(lockPairs);
		}
		callback(e)
	})
}

/**
 * 上传Wp月卡官方IAP信息
 * @param playerId
 * @param productId
 * @param transactionId
 * @param receiptData
 * @param callback
 */
pro.addWpOfficialMonthcardBillingData = function(playerId, productId, transactionId, receiptData, callback){
	var self = this
	var playerDoc = null
	var billing = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = []
	var updateFuncs = []

	var itemConfig = DataUtils.getStoreMonthcardProductConfig(productId);
	if(!_.isObject(itemConfig)){
		var e = ErrorUtils.iapProductNotExist(playerId, productId);
		e.isLegal = true;
		return callback(e);
	}

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		return self.cacheService.lockAllAsync(lockPairs, true)
	}).then(function(){
		return self.Billing.findOneAsync({transactionId:transactionId})
	}).then(function(doc){
		if(_.isObject(doc)) return Promise.reject(ErrorUtils.duplicateIAPTransactionId(playerId, transactionId))
		var billingValidateAsync = Promise.promisify(WpOfficialBillingValidate, {context:self})
		return billingValidateAsync(playerDoc, receiptData)
	}).then(function(respData){
		billing = CreateBillingItem(playerDoc, Consts.BillingType.WpOfficial, respData.transactionId, respData.productId, respData.quantity, itemConfig.price);
		return self.Billing.createAsync(billing)
	}).then(function(){
		var quantity = billing.quantity
		if(playerDoc.monthCard.index !== itemConfig.index){
			playerDoc.monthCard.index = itemConfig.index;
			playerDoc.monthCard.finishTime = 0;
		}
		var finishTime = playerDoc.monthCard.finishTime > Date.now() ?
		playerDoc.monthCard.finishTime + (DataUtils.getPlayerIntInit('monthCardTotalDays') * 24 * 60 * 60 * 1000 * quantity) :
			LogicUtils.getNextDateTime(LogicUtils.getTodayDateTime(), DataUtils.getPlayerIntInit('monthCardTotalDays') * quantity);
		playerDoc.monthCard.finishTime = finishTime;
		playerDoc.monthCard.todayRewardsGet = false;
		playerData.push(['monthCard', playerDoc.monthCard]);
		playerDoc.countInfo.iapCount += 1
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.unlockAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		if(!ErrorUtils.isObjectLockedError(e) && lockPairs.length > 0){
			self.cacheService.unlockAll(lockPairs);
		}
		callback(e)
	})
}

/**
 * 上传Wp月卡Adeasygo IAP信息
 * @param playerId
 * @param uid
 * @param transactionId
 * @param callback
 * @returns {*}
 */
pro.addWpAdeasygoMonthcardBillingData = function(playerId, uid, transactionId, callback){
	var self = this
	var playerDoc = null
	var billing = null
	var playerData = []
	var lockPairs = [];
	var eventFuncs = [];
	var updateFuncs = []
	var itemConfig = null;

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		return self.cacheService.lockAllAsync(lockPairs, true)
	}).then(function(){
		return self.Billing.findOneAsync({transactionId:transactionId})
	}).then(function(doc){
		if(_.isObject(doc)) return Promise.reject(ErrorUtils.duplicateIAPTransactionId(playerId, transactionId))
		var billingValidateAsync = Promise.promisify(WpAdeasygoBillingValidate, {context:self})
		return billingValidateAsync(playerDoc, uid, transactionId)
	}).then(function(respData){
		itemConfig = DataUtils.getStoreMonthcardProductConfig(respData.productId);
		if(!itemConfig){
			var e = ErrorUtils.iapProductNotExist(playerId, respData.productId);
			return Promise.reject(e);
		}
		billing = CreateBillingItem(playerDoc, Consts.BillingType.WpAdeasygo, respData.transactionId, respData.productId, respData.quantity, itemConfig.price);
		return self.Billing.createAsync(billing)
	}).then(function(){
		var quantity = billing.quantity
		if(playerDoc.monthCard.index !== itemConfig.index){
			playerDoc.monthCard.index = itemConfig.index;
			playerDoc.monthCard.finishTime = 0;
		}
		var finishTime = playerDoc.monthCard.finishTime > Date.now() ?
		playerDoc.monthCard.finishTime + (DataUtils.getPlayerIntInit('monthCardTotalDays') * 24 * 60 * 60 * 1000 * quantity) :
			LogicUtils.getNextDateTime(LogicUtils.getTodayDateTime(), DataUtils.getPlayerIntInit('monthCardTotalDays') * quantity);
		playerDoc.monthCard.finishTime = finishTime;
		playerDoc.monthCard.todayRewardsGet = false;
		playerData.push(['monthCard', playerDoc.monthCard]);
		playerDoc.countInfo.iapCount += 1
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.unlockAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		callback(null, [playerData, billing.productId])
	}).catch(function(e){
		if(!ErrorUtils.isObjectLockedError(e) && lockPairs.length > 0){
			self.cacheService.unlockAll(lockPairs);
		}
		callback(e)
	})
}

/**
 * 上传Android月卡官方IAP信息
 * @param playerId
 * @param productId
 * @param transactionId
 * @param receiptData
 * @param receiptSignature
 * @param callback
 */
pro.addAndroidOfficialMonthcardBillingData = function(playerId, productId, transactionId, receiptData, receiptSignature, callback){
	var self = this
	var playerDoc = null
	var billing = null
	var playerData = []
	var lockPairs = [];
	var updateFuncs = []
	var eventFuncs = [];

	var itemConfig = DataUtils.getStoreMonthcardProductConfig(productId);
	if(!_.isObject(itemConfig)){
		var e = ErrorUtils.iapProductNotExist(playerId, productId);
		e.isLegal = true;
		return callback(e);
	}

	this.cacheService.findPlayerAsync(playerId).then(function(doc){
		playerDoc = doc
		lockPairs.push({key:Consts.Pairs.Player, value:playerDoc._id});
		return self.cacheService.lockAllAsync(lockPairs, true)
	}).then(function(){
		return self.Billing.findOneAsync({transactionId:transactionId})
	}).then(function(doc){
		if(_.isObject(doc)) return Promise.reject(ErrorUtils.duplicateIAPTransactionId(playerId, transactionId))
		var billingValidateAsync = Promise.promisify(AndroidOfficialBillingValidate, {context:self})
		return billingValidateAsync(playerDoc, receiptData, receiptSignature)
	}).then(function(respData){
		billing = CreateBillingItem(playerDoc, Consts.BillingType.AndroidOffical, respData.transactionId, respData.productId, respData.quantity, itemConfig.price);
		return self.Billing.createAsync(billing)
	}).then(function(){
		var quantity = billing.quantity
		if(playerDoc.monthCard.index !== itemConfig.index){
			playerDoc.monthCard.index = itemConfig.index;
			playerDoc.monthCard.finishTime = 0;
		}
		var finishTime = playerDoc.monthCard.finishTime > Date.now() ?
		playerDoc.monthCard.finishTime + (DataUtils.getPlayerIntInit('monthCardTotalDays') * 24 * 60 * 60 * 1000 * quantity) :
			LogicUtils.getNextDateTime(LogicUtils.getTodayDateTime(), DataUtils.getPlayerIntInit('monthCardTotalDays') * quantity);
		playerDoc.monthCard.finishTime = finishTime;
		playerDoc.monthCard.todayRewardsGet = false;
		playerData.push(['monthCard', playerDoc.monthCard]);
		playerDoc.countInfo.iapCount += 1
		playerData.push(["countInfo.iapCount", playerDoc.countInfo.iapCount])
		updateFuncs.push([self.cacheService, self.cacheService.flushPlayerAsync, playerDoc._id])
	}).then(function(){
		return LogicUtils.excuteAll(updateFuncs)
	}).then(function(){
		return self.cacheService.unlockAllAsync(lockPairs);
	}).then(function(){
		return LogicUtils.excuteAll(eventFuncs);
	}).then(function(){
		callback(null, playerData)
	}).catch(function(e){
		if(!ErrorUtils.isObjectLockedError(e) && lockPairs.length > 0){
			self.cacheService.unlockAll(lockPairs);
		}
		callback(e)
	})
}