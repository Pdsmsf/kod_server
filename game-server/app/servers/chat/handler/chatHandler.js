"use strict"

/**
 * Created by modun on 14-7-29.
 */

var _ = require("underscore")
var Promise = require("bluebird")

var Consts = require("../../../consts/consts")
var Define = require("../../../consts/define")
var Events = require("../../../consts/events")
var ErrorUtils = require("../../../utils/errorUtils")
var LogicUtils = require("../../../utils/logicUtils")

module.exports = function(app){
	return new ChatHandler(app)
}

var ChatHandler = function(app){
	this.app = app
	this.channelService = app.get("channelService");
	this.globalChatChannel = this.channelService.getChannel(Consts.GlobalChatChannel, true)
	this.logService = app.get("logService");
	this.chats = app.get('chats');
	this.allianceFights = app.get('allianceFights');
	this.allianceChats = app.get('allianceChats');
	this.allianceFightChats = app.get('allianceFightChats')
	this.serverConfig = app.get('serverConfig');
	this.commands = [
		{
			command:"resources",
			desc:"修改玩家资源数量:resources wood 5",
			func:function(session, uid, text, callback){
				var self = this
				var params = text.split(" ")
				var name = params[1]
				var count = parseInt(params[2])
				if(_.isNumber(count)){
					self.app.rpc.cache.commandRemote.resources(session, uid, name, count, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"buildinglevel",
			desc:"修改建筑等级:buildinglevel 1 5",
			func:function(session, uid, text, callback){
				var self = this
				var params = text.split(" ")
				var location = parseInt(params[1])
				var level = parseInt(params[2])
				if(_.isNumber(level)){
					self.app.rpc.cache.commandRemote.buildinglevel(session, uid, location, level, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"rmevents",
			desc:"清除玩家事件:rmevents vipEvents",
			func:function(session, uid, text, callback){
				var self = this
				var eventType = text.split(" ")[1]
				self.app.rpc.cache.commandRemote.rmevents(session, uid, eventType, function(e){
					callback(e)
				})
			}
		},
		{
			command:"soldiermaterial",
			desc:"统一修改玩家招募特殊兵种材料数量:soldiermaterial 5",
			func:function(session, uid, text, callback){
				var self = this
				var count = text.split(" ")[1]
				count = parseInt(count)
				if(_.isNumber(count)){
					self.app.rpc.cache.commandRemote.soldiermaterial(session, uid, count, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"dragonmaterial",
			desc:"统一修改玩家制作龙装备的材料数量:dragonmaterial 5",
			func:function(session, uid, text, callback){
				var self = this
				var count = text.split(" ")[1]
				count = parseInt(count)
				if(_.isNumber(count)){
					self.app.rpc.cache.commandRemote.dragonmaterial(session, uid, count, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"dragonequipment",
			desc:"统一修改玩家龙装备的数量:dragonequipment 5",
			func:function(session, uid, text, callback){
				var self = this
				var count = text.split(" ")[1]
				count = parseInt(count)
				if(_.isNumber(count)){
					self.app.rpc.cache.commandRemote.dragonequipment(session, uid, count, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"soldiers",
			desc:"设置士兵数量:soldiers 5",
			func:function(session, uid, text, callback){
				var self = this
				var count = text.split(" ")[1]
				count = parseInt(count)
				if(_.isNumber(count)){
					self.app.rpc.cache.commandRemote.soldiers(session, uid, count, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"woundedsoldiers",
			desc:"设置伤兵数量:woundedsoldiers 5",
			func:function(session, uid, text, callback){
				var self = this
				var count = text.split(" ")[1]
				count = parseInt(count)
				if(_.isNumber(count)){
					self.app.rpc.cache.commandRemote.woundedsoldiers(session, uid, count, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"dragonhp",
			desc:"修改指定龙的Hp:dragonhp redDragon 5",
			func:function(session, uid, text, callback){
				var self = this
				var dragonType = text.split(" ")[1]
				var count = text.split(" ")[2]
				count = parseInt(count)
				if(_.isNumber(count)){
					self.app.rpc.cache.commandRemote.dragonhp(session, uid, dragonType, count, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"dragonskill",
			desc:"设置龙的技能的等级:dragonskill redDragon 5",
			func:function(session, uid, text, callback){
				var self = this
				var dragonType = text.split(" ")[1]
				var level = text.split(" ")[2]
				level = parseInt(level)
				if(_.isNumber(level)){
					self.app.rpc.cache.commandRemote.dragonskill(session, uid, dragonType, level, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"dragonequipmentstar",
			desc:"设置龙装备的星级:dragonequipmentstar redDragon 5",
			func:function(session, uid, text, callback){
				var self = this
				var dragonType = text.split(" ")[1]
				var star = text.split(" ")[2]
				star = parseInt(star)
				if(_.isNumber(star)){
					self.app.rpc.cache.commandRemote.dragonequipmentstar(session, uid, dragonType, star, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"dragonstar",
			desc:"设置龙的星级:dragonstar redDragon 5",
			func:function(session, uid, text, callback){
				var self = this
				var dragonType = text.split(" ")[1]
				var star = text.split(" ")[2]
				star = parseInt(star)
				if(_.isNumber(star)){
					self.app.rpc.cache.commandRemote.dragonstar(session, uid, dragonType, star, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"dragonlevel",
			desc:"设置龙的等级:dragonlevel redDragon 5",
			func:function(session, uid, text, callback){
				var self = this
				var dragonType = text.split(" ")[1]
				var level = text.split(" ")[2]
				level = parseInt(level)
				if(_.isNumber(level)){
					self.app.rpc.cache.commandRemote.dragonlevel(session, uid, dragonType, level, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"donatelevel",
			desc:"设置捐赠级别:donatelevel 1  (1 - 6)",
			func:function(session, uid, text, callback){
				var self = this
				var donatelevel = text.split(" ")[1]
				donatelevel = parseInt(donatelevel)
				if(_.isNumber(donatelevel) && donatelevel >= 1 && donatelevel <= 6){
					self.app.rpc.cache.commandRemote.donatelevel(session, uid, donatelevel, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"alliancehonour",
			desc:"设置联盟荣耀:alliancehonour 500",
			func:function(session, uid, text, callback){
				var self = this
				var honour = text.split(" ")[1]
				honour = parseInt(honour)
				if(_.isNumber(honour)){
					self.app.rpc.cache.commandRemote.alliancehonour(session, uid, honour, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"allianceperception",
			desc:"设置联盟感知力:allianceperception 500",
			func:function(session, uid, text, callback){
				var self = this
				var perception = text.split(" ")[1]
				perception = parseInt(perception)
				if(_.isNumber(perception)){
					self.app.rpc.cache.commandRemote.allianceperception(session, uid, perception, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"playerlevel",
			desc:"设置玩家等级:playerlevel 5",
			func:function(session, uid, text, callback){
				var self = this
				var level = text.split(" ")[1]
				level = parseInt(level)
				if(_.isNumber(level)){
					self.app.rpc.cache.commandRemote.playerlevel(session, uid, level, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"cleargc",
			desc:"清除所有玩家GCId",
			func:function(session, uid, text, callback){
				var self = this
				self.app.rpc.cache.commandRemote.cleargc(session, uid, function(e){
					callback(e)
				})
			}
		},
		{
			command:"online",
			desc:"显示在线玩家数量",
			func:function(session, uid, text, callback){
				var self = this
				self.app.rpc.cache.commandRemote.online(session, uid, function(e, onlineCount){
					callback(e, onlineCount)
				})
			}
		},
		{
			command:"vipevents",
			desc:"修改VipBuff时间:vipevents 60",
			func:function(session, uid, text, callback){
				var self = this
				var seconds = text.split(" ")[1]
				seconds = parseInt(seconds)
				if(_.isNumber(seconds) && seconds){
					self.app.rpc.cache.commandRemote.vipevents(session, uid, seconds, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"militarytech",
			desc:"修改军事科技等级:militarytech infantry_infantry 20",
			func:function(session, uid, text, callback){
				var self = this
				var techName = text.split(" ")[1]
				var techLevel = parseInt(text.split(" ")[2])
				if(_.isNumber(techLevel) && techLevel){
					self.app.rpc.cache.commandRemote.militarytech(session, uid, techName, techLevel, function(e){
						callback(e)
					})
				}
			}
		},
		{
			command:"productiontech",
			desc:"修改生产科技等级:productiontech crane 20",
			func:function(session, uid, text, callback){
				var self = this
				var techName = text.split(" ")[1]
				var techLevel = parseInt(text.split(" ")[2])
				if(_.isNumber(techLevel) && techLevel){
					self.app.rpc.cache.commandRemote.productiontech(session, uid, techName, techLevel, function(e){
						callback(e)
					})
				}
			}
		}
	]
}

var pro = ChatHandler.prototype

/**
 * 发送聊天信息
 * @param msg
 * @param session
 * @param next
 */
pro.send = function(msg, session, next){
	var self = this
	var text = msg.text
	var channel = msg.channel
	var allianceId = session.get("allianceId")
	var e = null
	if(!_.isString(text) || _.isEmpty(text.trim())){
		e = new Error("text 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(!_.contains(Consts.ChannelType, channel)){
		e = new Error("channel 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	if(session.get('muteTime') > Date.now() && channel === Consts.ChannelType.Global){
		e = ErrorUtils.playerIsForbiddenToSpeak(session.uid, session.get('muteTime'));
		return next(e, ErrorUtils.getError(e))
	}
	if(_.isEqual(Consts.ChannelType.AllianceFight, channel)){
		if(_.isEmpty(allianceId)){
			e = ErrorUtils.playerNotJoinAlliance(session.uid)
			return next(e, ErrorUtils.getError(e))
		}
		if(_.isEmpty(this.allianceFights[allianceId])){
			e = ErrorUtils.allianceNotInFightStatus(session.uid, allianceId)
			return next(e, ErrorUtils.getError(e))
		}
	}
	if(_.isEqual(Consts.ChannelType.Alliance, channel) && _.isEmpty(allianceId)){
		e = ErrorUtils.playerNotJoinAlliance(session.uid)
		return next(e, ErrorUtils.getError(e))
	}

	var filterCommand = Promise.promisify(FilterCommand, {context:this})
	var message = null
	filterCommand(text, session).then(function(data){
		if(!_.isUndefined(data)){
			message = LogicUtils.createSysChatMessage(data);
			PushToPlayer.call(self, Events.chat.onChat, session, message)
			return
		}
		message = {
			id:session.uid,
			icon:session.get("icon"),
			name:session.get("name"),
			vip:session.get("vipExp"),
			vipActive:session.get('isVipActive'),
			allianceId:session.get("allianceId"),
			allianceTag:session.get("allianceTag"),
			serverId:session.get('cacheServerId'),
			channel:channel,
			text:text,
			time:Date.now()
		}
		if(_.isEqual(Consts.ChannelType.AllianceFight, channel)){
			var allianceFightKey = self.allianceFights[allianceId]
			if(!_.isArray(self.allianceFightChats[allianceFightKey])) self.allianceFightChats[allianceFightKey] = []
			if(self.allianceFightChats[allianceFightKey].length > Define.MaxAllianceFightChatCount){
				self.allianceFightChats[allianceFightKey].shift()
			}
			self.allianceFightChats[allianceFightKey].push(message)
			var allianceIdKeys = allianceFightKey.split(':')
			var attackAllianceId = allianceIdKeys[0]
			var defenceAllianceId = allianceIdKeys[1]
			var attackAllianceChannel = self.channelService.getChannel(Consts.AllianceChannelPrefix + ":" + attackAllianceId, false)
			var defenceAllianceChannel = self.channelService.getChannel(Consts.AllianceChannelPrefix + ":" + defenceAllianceId, false)
			if(_.isObject(attackAllianceChannel))
				attackAllianceChannel.pushMessage(Events.chat.onChat, message, {}, null)
			if(_.isObject(defenceAllianceChannel))
				defenceAllianceChannel.pushMessage(Events.chat.onChat, message, {}, null)
		}else if(_.isEqual(Consts.ChannelType.Alliance, channel)){
			if(!_.isArray(self.allianceChats[allianceId])) self.allianceChats[allianceId] = []
			if(self.allianceChats[allianceId].length > Define.MaxAllianceChatCount){
				self.allianceChats[allianceId].shift()
			}
			self.allianceChats[allianceId].push(message)
			var allianceChannel = self.channelService.getChannel(Consts.AllianceChannelPrefix + ":" + allianceId, false)
			if(_.isObject(allianceChannel))
				allianceChannel.pushMessage(Events.chat.onChat, message, {}, null)
		}else{
			if(self.chats.length > Define.MaxChatCount){
				self.chats.shift()
			}
			self.chats.push(message)
			self.globalChatChannel.pushMessage(Events.chat.onChat, message, {}, null)
		}
	}).then(function(){
		next(null, {code:200})
	}).catch(function(e){
		self.logService.onWarning("chat.chatHandler.send", {playerId:session.uid, msg:message}, e.stack)
		next(e, ErrorUtils.getError(e))
	})
}

/**
 * 获取所有聊天信息
 * @param msg
 * @param session
 * @param next
 */
pro.getAll = function(msg, session, next){
	var self = this;
	var channel = msg.channel
	var e = null
	if(!_.contains(Consts.ChannelType, channel)){
		e = new Error("channel 不合法")
		return next(e, ErrorUtils.getError(e))
	}
	var allianceId = session.get("allianceId")
	if(_.isEqual(Consts.ChannelType.Alliance, channel) && _.isEmpty(allianceId)){
		e = ErrorUtils.playerNotJoinAlliance(session.uid)
		return next(e, ErrorUtils.getError(e))
	}
	if(_.isEqual(Consts.ChannelType.AllianceFight, channel)){
		if(_.isEmpty(allianceId)){
			e = ErrorUtils.playerNotJoinAlliance(session.uid)
			return next(e, ErrorUtils.getError(e))
		}
		if(_.isEmpty(self.allianceFights[allianceId])){
			e = ErrorUtils.allianceNotInFightStatus(session.uid, allianceId)
			return next(e, ErrorUtils.getError(e))
		}
	}

	var chats = null
	if(_.isEqual(Consts.ChannelType.AllianceFight, channel)){
		chats = self.allianceFightChats[self.allianceFights[allianceId]]
	}else if(_.isEqual(Consts.ChannelType.Alliance, channel)){
		chats = self.allianceChats[allianceId]
	}else{
		chats = self.chats
	}
	next(null, {code:200, chats:_.isEmpty(chats) ? [] : chats})
}

/**
 * 发送墨子聊天
 * @param msg
 * @param session
 * @param next
 */
pro.modSend = function(msg, session, next){
	var self = this;
	var text = msg.text;
	var e = null;
	var message = null;
	if(!_.isString(text) || _.isEmpty(text.trim())){
		e = new Error("text 不合法");
		return next(e, ErrorUtils.getError(e));
	}
	self.app.get('Mod').findById(session.uid).then(function(doc){
		if(!doc){
			return Promise.reject(ErrorUtils.youAreNotTheMod(session.uid));
		}
		message = {
			id:session.uid,
			icon:-1,
			name:doc.name,
			vip:0,
			vipActive:false,
			allianceId:'',
			allianceTag:'',
			serverId:'',
			channel:'global',
			text:text,
			time:Date.now()
		};
		if(self.chats.length > Define.MaxChatCount){
			self.chats.shift();
		}
		self.chats.push(message);
		self.globalChatChannel.pushMessage(Events.chat.onChat, message, {}, null);
		var modLog = {
			mod:{
				id:doc._id,
				name:doc.name
			},
			action:{
				type:Consts.ModActionType.Chat,
				value:text
			}
		}
		return self.app.get('ModLog').create(modLog);
	}).then(function(){
		next(null, {code:200})
	}).catch(function(e){
		self.logService.onWarning("chat.chatHandler.modSend", {playerId:session.uid, msg:message}, e.stack)
		next(e, ErrorUtils.getError(e))
	})
}


/**
 * 过滤秘技
 * @param chatText
 * @param session
 * @param callback
 */
var FilterCommand = function(chatText, session, callback){
	if(!this.serverConfig.cheatEnabled){
		callback()
		return
	}

	if(_.isEqual("help", chatText)){
		PushHelpMessageToPlayer.call(this, session)
		callback()
	}else{
		var func = GetPlayerCommand.call(this, chatText)
		if(_.isFunction(func)){
			func.call(this, session, session.uid, chatText, function(e, data){
				callback(e, data)
			})
		}else{
			callback()
		}
	}
}

var PushHelpMessageToPlayer = function(session){
	var commands = ""
	_.each(this.commands, function(value){
		commands += value.command + ":" + value.desc + "\n"
	})
	var message = LogicUtils.createSysChatMessage(commands);
	PushToPlayer.call(this, Events.chat.onChat, session, message)
}

var GetPlayerCommand = function(text){
	var command = text.split(" ")
	if(command.length > 0){
		command = command[0]
	}
	command = command.toLowerCase()
	for(var i = 0; i < this.commands.length; i++){
		var value = this.commands[i]
		if(_.isEqual(value.command, command)){
			return value.func
		}
	}

	return null
}

var PushToPlayer = function(event, session, msg){
	this.channelService.pushMessageByUids(event, msg, [
		{uid:session.uid, sid:session.get("logicServerId")}
	], {}, null)
}