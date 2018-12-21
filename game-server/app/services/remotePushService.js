"use strict"

/**
 * Created by modun on 15/3/19.
 */


var _ = require("underscore")
var Promise = require("bluebird")
var request = require('request')
var apn = require("apn")
var path = require("path")
var gcm = require('node-gcm');
var sprintf = require("sprintf")

var Consts = require("../consts/consts")
var Events = require("../consts/events")
var Utils = require("../utils/utils")
var LogicUtils = require("../utils/logicUtils")
var DataUtils = require("../utils/dataUtils")

var RemotePushService = function(app){
	this.app = app
	this.logService = app.get("logService")
	this.platform = app.get('serverConfig').platform;
	this.platformParams = app.get('serverConfig')[this.platform];
	this.iosPushService = null;
	this.wpPushService = null;
	this.androidPushService = null;
}
module.exports = RemotePushService
var pro = RemotePushService.prototype

var PushIosRemoteMessage = function(message, pushIds){
	var self = this
	if(!_.isObject(self.iosPushService)){
		var service = new apn.Connection({
			production:self.platformParams.apnProductionMode,
			pfx:self.app.getBase() + '/config/' + self.platformParams.apnPushCert,
			passphrase:self.platformParams.apnPassword,
			maxConnections:10
		});
		service.on("transmissionError", function(errCode, notification, device){
			self.logService.onError("PushIosRemoteMessage.transmissionError", {
				errCode:errCode,
				device:device,
				notification:notification
			});
		});
		self.iosPushService = service;
	}

	var note = new apn.Notification();
	note.alert = message;
	note.sound = "default";
	self.iosPushService.pushNotification(note, _.values(pushIds));
	return Promise.resolve();
}

var PushWpRemoteMessage = function(message, pushIds){
	var self = this;
	var getToken = function(clientId, clientSecret){
		return new Promise(function(resolve, reject){
			var url = self.platformParams.remotePushAccesstokenUrl;
			var body = {
				grant_type:'client_credentials',
				client_id:clientId,
				client_secret:clientSecret,
				scope:'notify.windows.com'
			};
			var options = {
				url:url,
				method:'post',
				form:body
			};
			request(options, function(e, resp, body){
				if(!!e){
					return reject(e);
				}
				if(resp.statusCode !== 200){
					return reject(new Error(resp.body));
				}
				resolve(JSON.parse(body));
			});
		});
	};
	var createService = function(tokenType, token, timeout){
		var service = {
			tokenType:tokenType,
			token:token,
			timeout:Date.now() + (timeout * (1000 - 1))
		};
		service.pushNotification = function(message, pushIds){
			var urls = Utils.clone(_.values(pushIds));
			(function push(){
				if(urls.length === 0){
					return;
				}
				var url = urls.pop();
				var body = '<toast><visual><binding template="ToastText01"><text id="1">' + message + '</text></binding></visual></toast>'
				var options = {
					url:url,
					method:'POST',
					headers:{
						'Content-Type':'text/xml',
						'X-WNS-Type':'wns/toast',
						'Authorization':service.tokenType + ' ' + token
					},
					body:body
				};
				request(options, function(e, resp){
					if(!!e){
						self.logService.onError("PushWpRemoteMessage.transmissionError", {message:message, url:url}, e.stack);
						return push();
					}
					if(resp.statusCode !== 200){
						if(resp.statusCode === 410){
							_.each(pushIds, function(pushId, playerId){
								if(pushId === url){
									self.app.get('dataService').removePlayerPushId(playerId);
								}
							});
							return push();
						}else if(resp.statusCode === 401){
							self.wpPushService = null;
							return setTimeout(function(){
								PushWpRemoteMessage.call(self, message, pushIds);
							}, 1000);
						}else{
							self.logService.onError('PushWpRemoteMessage.transmissionError', {
								message:message,
								url:url,
								statusCode:resp.statusCode,
								responseHeader:resp.headers
							});
							return push();
						}
					}
					return push();
				});
			})();
		};
		return Promise.resolve(service);
	};

	if(!self.wpPushService || self.wpPushService.timeout <= Date.now()){
		getToken(self.platformParams.clientId, self.platformParams.clientSecret).then(function(resp){
			return createService(resp.token_type, resp.access_token, resp.expires_in)
		}).then(function(service){
			self.wpPushService = service;
			self.wpPushService.pushNotification(message, pushIds)
		}).catch(function(e){
			self.logService.onError("PushWpRemoteMessage.createService", {}, e)
			self.wpPushService = null;
		})
	}else{
		self.wpPushService.pushNotification(message, pushIds)
	}
}

var PushAndroidRemoteMessage = function(message, pushIds){
	var self = this;
	if(!this.androidPushService){
		var service = new gcm.Sender(self.platformParams.apiKey)
		self.androidPushService = service;
	}

	var notice = new gcm.Message();
	notice.addData('message', message);
	self.androidPushService.sendNoRetry(notice, {registrationTokens:_.values(pushIds)}, function(e){
		if(!!e){
			self.logService.onError("PushAndroidRemoteMessage.transmissionError", {
				message:message,
				error:e.message
			})
		}
	})
	return Promise.resolve();
}

/**
 * 推送消息到离线玩家
 * @param pushIds
 * @param message
 */
pro.pushRemoteMessage = function(message, pushIds){
	if(pushIds.length === 0) return;
	if(this.platform === Consts.Platform.Ios){
		PushIosRemoteMessage.call(this, message, pushIds);
	}else if(this.platform === Consts.Platform.Wp){
		PushWpRemoteMessage.call(this, message, pushIds);
	}else if(this.platform === Consts.Platform.Android){
		PushAndroidRemoteMessage.call(this, message, pushIds);
	}
}

/**
 * 联盟战进入准备期推送通知
 * @param attackAllianceDoc
 * @param defenceAllianceDoc
 */
pro.onAllianceFightPrepare = function(attackAllianceDoc, defenceAllianceDoc){
	var self = this
	var messageKey = DataUtils.getLocalizationConfig("alliance", "AttackAlliancePrepare");
	var messageArgs = [];
	var members = {}

	_.each(attackAllianceDoc.members, function(member){
		if(!member.online && !_.isEmpty(member.pushId) && _.isObject(member.pushStatus) && !!member.pushStatus.onAllianceFightPrepare){
			if(!_.isArray(members[member.language])){
				members[member.language] = {};
			}
			members[member.language][member.id] = member.pushId;
		}
	})
	_.each(members, function(pushIds, language){
		var message = messageKey[language]
		if(!_.isString(message)) message = messageKey.en;
		if(messageArgs.length > 0){
			message = sprintf.vsprintf(message, messageArgs)
		}
		self.pushRemoteMessage(message, pushIds)
	})

	messageKey = DataUtils.getLocalizationConfig("alliance", "AllianceBeAttackedPrepare");
	messageArgs = [attackAllianceDoc.basicInfo.name];
	members = {}
	_.each(defenceAllianceDoc.members, function(member){
		if(!member.online && !_.isEmpty(member.pushId) && _.isObject(member.pushStatus) && !!member.pushStatus.onAllianceFightPrepare){
			if(!_.isArray(members[member.language])){
				members[member.language] = {};
			}
			members[member.language][member.id] = member.pushId;
		}
	})
	_.each(members, function(pushIds, language){
		var message = messageKey[language]
		if(!_.isString(message)) message = messageKey.en;
		if(messageArgs.length > 0){
			message = sprintf.vsprintf(message, messageArgs)
		}
		self.pushRemoteMessage(message, pushIds)
	})
}

/**
 * 联盟战进入战争期推送通知
 * @param attackAllianceDoc
 * @param defenceAllianceDoc
 */
pro.onAllianceFightStart = function(attackAllianceDoc, defenceAllianceDoc){
	var self = this
	var messageKey = DataUtils.getLocalizationConfig("alliance", "AttackAllianceStart");
	var messageArgs = [defenceAllianceDoc.basicInfo.name];
	var members = {}
	_.each(attackAllianceDoc.members, function(member){
		if(!member.online && !_.isEmpty(member.pushId) && _.isObject(member.pushStatus) && !!member.pushStatus.onAllianceFightStart){
			if(!_.isArray(members[member.language])){
				members[member.language] = {};
			}
			members[member.language][member.id] = member.pushId;
		}
	})
	_.each(members, function(pushIds, language){
		var message = messageKey[language]
		if(!_.isString(message)) message = messageKey.en;
		if(messageArgs.length > 0){
			message = sprintf.vsprintf(message, messageArgs)
		}
		self.pushRemoteMessage(message, pushIds)
	})

	messageKey = DataUtils.getLocalizationConfig("alliance", "AllianceBeAttackedStart");
	messageArgs = [attackAllianceDoc.basicInfo.name];
	members = {}
	_.each(defenceAllianceDoc.members, function(member){
		if(!member.online && !_.isEmpty(member.pushId) && _.isObject(member.pushStatus) && !!member.pushStatus.onAllianceFightStart){
			if(!_.isArray(members[member.language])){
				members[member.language] = {};
			}
			members[member.language][member.id] = member.pushId;
		}
	})
	_.each(members, function(pushIds, language){
		var message = messageKey[language]
		if(!_.isString(message)) message = messageKey.en;
		if(messageArgs.length > 0){
			message = sprintf.vsprintf(message, messageArgs)
		}
		self.pushRemoteMessage(message, pushIds)
	})
}

/**
 * 圣地战激活推送通知
 * @param allianceDoc
 */
pro.onAllianceShrineEventStart = function(allianceDoc){
	var self = this
	var messageKey = DataUtils.getLocalizationConfig("alliance", "AllianceShrineEventStart");
	var messageArgs = [];
	var members = {}
	_.each(allianceDoc.members, function(member){
		if(!member.online && !_.isEmpty(member.pushId) && _.isObject(member.pushStatus) && !!member.pushStatus.onAllianceShrineEventStart){
			if(!_.isArray(members[member.language])){
				members[member.language] = {};
			}
			members[member.language][member.id] = member.pushId;
		}
	})
	_.each(members, function(pushIds, language){
		var message = messageKey[language]
		if(!_.isString(message)) message = messageKey.en;
		if(messageArgs.length > 0){
			message = sprintf.vsprintf(message, messageArgs)
		}
		self.pushRemoteMessage(message, pushIds)
	})
}

/**
 * 玩家城市即将被攻打推送通知
 * @param playerDoc
 */
pro.onCityBeAttacked = function(playerDoc){
	var self = this
	var messageKey = DataUtils.getLocalizationConfig("alliance", "CityBeAttacked");
	var messageArgs = [];
	if(_.isEmpty(playerDoc.logicServerId) && !_.isEmpty(playerDoc.pushId) && !!playerDoc.pushStatus.onCityBeAttacked){
		var message = messageKey[playerDoc.basicInfo.language];
		if(!_.isString(message)) message = messageKey.en;
		if(messageArgs.length > 0){
			message = sprintf.vsprintf(message, messageArgs);
		}
		var pushIds = {};
		pushIds[playerDoc._id] = playerDoc.pushId;
		self.pushRemoteMessage(message, pushIds);
	}
}

/**
 * 村落正在遭受攻击
 * @param playerDoc
 */
pro.onVillageBeAttacked = function(playerDoc){
	var self = this
	var messageKey = DataUtils.getLocalizationConfig("alliance", "VillageBeAttacked");
	var messageArgs = [];
	if(_.isEmpty(playerDoc.logicServerId) && !_.isEmpty(playerDoc.pushId) && !!playerDoc.pushStatus.onCityBeAttacked){
		var message = messageKey[playerDoc.basicInfo.language];
		if(!_.isString(message)) message = messageKey.en;
		if(messageArgs.length > 0){
			message = sprintf.vsprintf(message, messageArgs);
		}
		var pushIds = {};
		pushIds[playerDoc._id] = playerDoc.pushId;
		self.pushRemoteMessage(message, pushIds);
	}
}