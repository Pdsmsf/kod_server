"use strict"

/**
 * Created by modun on 14/10/29.
 */

var pomelo = require("./pomelo-client")
var Config = require("./config")
var _ = require("underscore")

var GameDatas = require("../game-server/app/datas/GameDatas")
var Errors = GameDatas.Errors.errors

var Api = module.exports

var Request = function(route, info, callback){
	(function request(route, info, innerCallback){
		pomelo.request(route, info, function(doc){
			if(!!doc && !!doc.code && doc.code === Errors.objectIsLocked.code) return request(route, info, innerCallback);
			if(!!innerCallback) innerCallback(doc);
		})
	})(route, info, callback)
}

Api.getGmChats = function(callback){
	var route = "http.httpHandler.getAll"
	Request(route, null, callback)
}

Api.sendGmChat = function(content, callback){
	var info = {text:content}
	var route = "http.httpHandler.send"
	Request(route, info, callback)
}

Api.loginPlayer = function(deviceId, callback){
	pomelo.disconnect()
	pomelo.init({
		host:Config.gateHost, port:Config.gatePort, log:true
	}, function(){
		var route = "gate.gateHandler.queryEntry"
		Request(route, {platform:Config.platform, deviceId:deviceId, tag:-1}, function(doc){
			pomelo.disconnect()
			pomelo.init({
				host:doc.data.host, port:doc.data.port, log:true
			}, function(){
				var route = "logic.entryHandler.login"
				Request(route, {deviceId:deviceId, needMapData:false, requestTime:Date.now()}, function(doc){
					callback(doc)
				})
			})
		})
	})
}

Api.sendChat = function(text, callback){
	var info = {
		text:text, channel:"global"
	}
	var route = "chat.chatHandler.send"
	Request(route, info, callback)
}

Api.modSend = function(text, callback){
	var info = {
		text:text
	}
	var route = "chat.chatHandler.modSend"
	Request(route, info, callback)
}

Api.sendAllianceChat = function(text, callback){
	var info = {
		text:text, channel:"alliance"
	}
	var route = "chat.chatHandler.send"
	Request(route, info, callback)
}

Api.sendAllianceFightChat = function(text, callback){
	var info = {
		text:text, channel:"allianceFight"
	}
	var route = "chat.chatHandler.send"
	Request(route, info, callback)
}

Api.getChats = function(channel, callback){
	var info = {
		channel:channel
	}
	var route = "chat.chatHandler.getAll"
	Request(route, info, callback)
}

Api.upgradeBuilding = function(location, finishNow, callback){
	var info = {
		location:location, finishNow:finishNow
	}
	var route = "logic.playerHandler.upgradeBuilding"
	Request(route, info, callback)
}

Api.switchBuilding = function(buildingLocation, newBuildingName, callback){
	var info = {
		buildingLocation:buildingLocation,
		newBuildingName:newBuildingName
	}
	var route = "logic.playerHandler.switchBuilding"
	Request(route, info, callback)
}

Api.createHouse = function(houseType, buildingLocation, houseLocation, finishNow, callback){
	var info = {
		buildingLocation:buildingLocation, houseType:houseType, houseLocation:houseLocation, finishNow:finishNow
	}
	var route = "logic.playerHandler.createHouse"
	Request(route, info, callback)
}

Api.upgradeHouse = function(buildingLocation, houseLocation, finishNow, callback){
	var info = {
		buildingLocation:buildingLocation, houseLocation:houseLocation, finishNow:finishNow
	}
	var route = "logic.playerHandler.upgradeHouse"
	Request(route, info, callback)
}

Api.freeSpeedUp = function(eventType, eventId, callback){
	var info = {
		eventType:eventType,
		eventId:eventId
	}
	var route = "logic.playerHandler.freeSpeedUp"
	Request(route, info, callback)
}

Api.speedUp = function(eventType, eventId, callback){
	var info = {
		eventType:eventType,
		eventId:eventId
	}
	var route = "logic.playerHandler.speedUp"
	Request(route, info, callback)
}

Api.makeMaterial = function(type, finishNow, callback){
	var info = {
		type:type,
		finishNow:finishNow
	}
	var route = "logic.playerHandler.makeMaterial"
	Request(route, info, callback)
}

Api.getMaterials = function(eventId, callback){
	var info = {
		eventId:eventId
	}
	var route = "logic.playerHandler.getMaterials"
	Request(route, info, callback)
}

Api.recruitNormalSoldier = function(soldierName, count, finishNow, callback){
	var info = {
		soldierName:soldierName, count:count, finishNow:finishNow
	}
	var route = "logic.playerHandler.recruitNormalSoldier"
	Request(route, info, callback)
}

Api.recruitSpecialSoldier = function(soldierName, count, finishNow, callback){
	var info = {
		soldierName:soldierName, count:count, finishNow:finishNow
	}
	var route = "logic.playerHandler.recruitSpecialSoldier"
	Request(route, info, callback)
}

Api.makeDragonEquipment = function(equipmentName, finishNow, callback){
	var info = {
		equipmentName:equipmentName, finishNow:finishNow
	}
	var route = "logic.playerHandler.makeDragonEquipment"
	Request(route, info, callback)
}

Api.treatSoldier = function(soldiers, finishNow, callback){
	var info = {
		soldiers:soldiers, finishNow:finishNow
	}
	var route = "logic.playerHandler.treatSoldier"
	Request(route, info, callback)
}

Api.hatchDragon = function(dragonType, callback){
	var info = {
		dragonType:dragonType
	}
	var route = "logic.playerHandler.hatchDragon"
	Request(route, info, callback)
}

Api.setDragonEquipment = function(dragonType, equipmentCategory, equipmentName, callback){
	var info = {
		dragonType:dragonType, equipmentCategory:equipmentCategory, equipmentName:equipmentName
	}
	var route = "logic.playerHandler.setDragonEquipment"
	Request(route, info, callback)
}

Api.enhanceDragonEquipment = function(dragonType, equipmentCategory, equipments, callback){
	var info = {
		dragonType:dragonType, equipmentCategory:equipmentCategory, equipments:equipments
	}
	var route = "logic.playerHandler.enhanceDragonEquipment"
	Request(route, info, callback)
}

Api.resetDragonEquipment = function(dragonType, equipmentCategory, callback){
	var info = {
		dragonType:dragonType, equipmentCategory:equipmentCategory
	}
	var route = "logic.playerHandler.resetDragonEquipment"
	Request(route, info, callback)
}

Api.upgradeDragonDragonSkill = function(dragonType, skillKey, callback){
	var info = {
		dragonType:dragonType, skillKey:skillKey
	}
	var route = "logic.playerHandler.upgradeDragonSkill"
	Request(route, info, callback)
}

Api.upgradeDragonStar = function(dragonType, callback){
	var info = {
		dragonType:dragonType
	}
	var route = "logic.playerHandler.upgradeDragonStar"
	Request(route, info, callback)
}

Api.getDailyQuests = function(callback){
	var route = "logic.playerHandler.getDailyQuests"
	Request(route, null, callback)
}

Api.addDailyQuestStar = function(questId, callback){
	var info = {
		questId:questId
	}
	var route = "logic.playerHandler.addDailyQuestStar"
	Request(route, info, callback)
}

Api.startDailyQuest = function(questId, callback){
	var info = {
		questId:questId
	}
	var route = "logic.playerHandler.startDailyQuest"
	Request(route, info, callback)
}

Api.getDailyQeustReward = function(questEventId, callback){
	var info = {
		questEventId:questEventId
	}
	var route = "logic.playerHandler.getDailyQeustReward"
	Request(route, info, callback)
}

Api.getPlayerInfo = function(memberId, serverId, callback){
	var info = {
		memberId:memberId,
		serverId:serverId
	}
	var route = "logic.playerHandler.getPlayerInfo"
	Request(route, info, callback)
}

Api.setPlayerLanguage = function(language, callback){
	var info = {
		language:language
	}
	var route = "logic.playerHandler.setPlayerLanguage"
	Request(route, info, callback)
}

Api.sendMail = function(memberId, title, content, callback){
	var info = {
		memberId:memberId,
		title:title,
		content:content
	}
	var route = "logic.playerHandler.sendMail"
	Request(route, info, callback)
}

Api.readMails = function(mailIds, callback){
	var info = {
		mailIds:mailIds
	}
	var route = "logic.playerHandler.readMails"
	Request(route, info, callback)
}

Api.saveMail = function(mailId, callback){
	var info = {
		mailId:mailId
	}
	var route = "logic.playerHandler.saveMail"
	Request(route, info, callback)
}

Api.unSaveMail = function(mailId, callback){
	var info = {
		mailId:mailId
	}
	var route = "logic.playerHandler.unSaveMail"
	Request(route, info, callback)
}

Api.deleteMails = function(mailIds, callback){
	var info = {
		mailIds:mailIds
	}
	var route = "logic.playerHandler.deleteMails"
	Request(route, info, callback)
}

Api.deleteSendMails = function(mailIds, callback){
	var info = {
		mailIds:mailIds
	}
	var route = "logic.playerHandler.deleteSendMails"
	Request(route, info, callback)
}

Api.getMails = function(fromIndex, callback){
	var info = {
		fromIndex:fromIndex
	}
	var route = "logic.playerHandler.getMails"
	Request(route, info, callback)
}

Api.getSendMails = function(fromIndex, callback){
	var info = {
		fromIndex:fromIndex
	}
	var route = "logic.playerHandler.getSendMails"
	Request(route, info, callback)
}

Api.getSavedMails = function(fromIndex, callback){
	var info = {
		fromIndex:fromIndex
	}
	var route = "logic.playerHandler.getSavedMails"
	Request(route, info, callback)
}

Api.readReports = function(reportIds, callback){
	var info = {
		reportIds:reportIds
	}
	var route = "logic.playerHandler.readReports"
	Request(route, info, callback)
}

Api.saveReport = function(reportId, callback){
	var info = {
		reportId:reportId
	}
	var route = "logic.playerHandler.saveReport"
	Request(route, info, callback)
}

Api.unSaveReport = function(reportId, callback){
	var info = {
		reportId:reportId
	}
	var route = "logic.playerHandler.unSaveReport"
	Request(route, info, callback)
}

Api.deleteReports = function(reportIds, callback){
	var info = {
		reportIds:reportIds
	}
	var route = "logic.playerHandler.deleteReports"
	Request(route, info, callback)
}

Api.getReports = function(fromIndex, callback){
	var info = {
		fromIndex:fromIndex
	}
	var route = "logic.playerHandler.getReports"
	Request(route, info, callback)
}

Api.getSavedReports = function(fromIndex, callback){
	var info = {
		fromIndex:fromIndex
	}
	var route = "logic.playerHandler.getSavedReports"
	Request(route, info, callback)
}

Api.editPlayerName = function(name, callback){
	var info = {
		name:name
	}
	var route = "logic.playerHandler.editPlayerName"
	Request(route, info, callback)
}

Api.getPlayerViewData = function(targetPlayerId, callback){
	var info = {
		targetPlayerId:targetPlayerId
	}
	var route = "logic.playerHandler.getPlayerViewData"
	Request(route, info, callback)
}

Api.setDefenceTroop = function(dragonType, soldiers, callback){
	var info = {
		dragonType:dragonType,
		soldiers:soldiers
	}
	var route = "logic.playerHandler.setDefenceTroop"
	Request(route, info, callback)
}

Api.cancelDefenceTroop = function(callback){
	var route = "logic.playerHandler.cancelDefenceTroop"
	Request(route, null, callback)
}

Api.sellItem = function(type, name, count, price, callback){
	var info = {
		type:type,
		name:name,
		count:count,
		price:price
	}
	var route = "logic.playerHandler.sellItem"
	Request(route, info, callback)
}

Api.getSellItems = function(type, name, callback){
	var info = {
		type:type,
		name:name
	}
	var route = "logic.playerHandler.getSellItems"
	Request(route, info, callback)
}

Api.buySellItem = function(itemId, callback){
	var info = {
		itemId:itemId
	}
	var route = "logic.playerHandler.buySellItem"
	Request(route, info, callback)
}

Api.getMyItemSoldMoney = function(itemId, callback){
	var info = {
		itemId:itemId
	}
	var route = "logic.playerHandler.getMyItemSoldMoney"
	Request(route, info, callback)
}

Api.removeMySellItem = function(itemId, callback){
	var info = {
		itemId:itemId
	}
	var route = "logic.playerHandler.removeMySellItem"
	Request(route, info, callback)
}

Api.setPushId = function(pushId, callback){
	var info = {
		pushId:pushId
	}
	var route = "logic.playerHandler.setPushId"
	Request(route, info, callback)
}

Api.upgradeProductionTech = function(techName, finishNow, callback){
	var info = {
		techName:techName,
		finishNow:finishNow
	}
	var route = "logic.playerHandler.upgradeProductionTech"
	Request(route, info, callback)
}

Api.upgradeMilitaryTech = function(techName, finishNow, callback){
	var info = {
		techName:techName,
		finishNow:finishNow
	}
	var route = "logic.playerHandler.upgradeMilitaryTech"
	Request(route, info, callback)
}

Api.upgradeSoldierStar = function(soldierName, finishNow, callback){
	var info = {
		soldierName:soldierName,
		finishNow:finishNow
	}
	var route = "logic.playerHandler.upgradeSoldierStar"
	Request(route, info, callback)
}

Api.setTerrain = function(terrain, callback){
	var info = {
		terrain:terrain
	}
	var route = "logic.playerHandler.setTerrain"
	Request(route, info, callback)
}

Api.buyItem = function(itemName, count, callback){
	var info = {
		itemName:itemName,
		count:count
	}
	var route = "logic.playerHandler.buyItem"
	Request(route, info, callback)
}

Api.useItem = function(itemName, params, callback){
	var info = {
		itemName:itemName,
		params:params
	}
	var route = "logic.playerHandler.useItem"
	Request(route, info, callback)
}

Api.buyAndUseItem = function(itemName, params, callback){
	var info = {
		itemName:itemName,
		params:params
	}
	var route = "logic.playerHandler.buyAndUseItem"
	Request(route, info, callback)
}

Api.gacha = function(type, callback){
	var info = {
		type:type
	}
	var route = "logic.playerHandler.gacha"
	Request(route, info, callback)
}

Api.bindGc = function(type, gcId, gcName, callback){
	var info = {
		type:type,
		gcId:gcId,
		gcName:gcName
	}
	var route = "logic.playerHandler.bindGc"
	Request(route, info, callback)
}

Api.updateGcName = function(gcName, callback){
	var info = {
		gcName:gcName
	}
	var route = "logic.playerHandler.updateGcName"
	Request(route, info, callback)
}

Api.switchGc = function(gcId, callback){
	var info = {
		gcId:gcId
	}
	var route = "logic.playerHandler.switchGc"
	Request(route, info, callback)
}

Api.getDay60Reward = function(callback){
	var route = "logic.playerHandler.getDay60Reward"
	Request(route, null, callback)
}

Api.getOnlineReward = function(timePoint, callback){
	var info = {
		timePoint:timePoint
	}
	var route = "logic.playerHandler.getOnlineReward"
	Request(route, info, callback)
}

Api.getDay14Reward = function(callback){
	var route = "logic.playerHandler.getDay14Reward"
	Request(route, null, callback)
}

Api.getLevelupReward = function(levelupIndex, callback){
	var info = {
		levelupIndex:levelupIndex
	}
	var route = "logic.playerHandler.getLevelupReward"
	Request(route, info, callback)
}

Api.addIosPlayerBillingData = function(receiptData, callback){
	var info = {
		receiptData:receiptData
	}
	var route = "logic.playerHandler.addIosPlayerBillingData"
	Request(route, info, callback)
}

Api.addWpOfficialPlayerBillingData = function(receiptData, callback){
	var info = {
		receiptData:receiptData
	}
	var route = "logic.playerHandler.addWpOfficialPlayerBillingData"
	Request(route, info, callback)
}

Api.addWpAdeasygoPlayerBillingData = function(uid, transactionId, callback){
	var info = {
		uid:uid,
		transactionId:transactionId
	}
	var route = "logic.playerHandler.addWpAdeasygoPlayerBillingData"
	Request(route, info, callback)
}

Api.addAndroidOfficialPlayerBillingData = function(receiptData, receiptSignature, callback){
	var info = {
		receiptData:receiptData,
		receiptSignature:receiptSignature
	}
	var route = "logic.playerHandler.addAndroidOfficialPlayerBillingData"
	Request(route, info, callback)
}

Api.getFirstIAPRewards = function(callback){
	var route = "logic.playerHandler.getFirstIAPRewards"
	Request(route, null, callback)
}

Api.getDailyTaskRewards = function(callback){
	var route = "logic.playerHandler.getDailyTaskRewards"
	Request(route, null, callback)
}

Api.getGrowUpTaskRewards = function(taskType, taskId, callback){
	var info = {
		taskType:taskType,
		taskId:taskId
	}
	var route = "logic.playerHandler.getGrowUpTaskRewards"
	Request(route, info, callback)
}

Api.getPlayerRankList = function(rankType, fromRank, callback){
	var info = {
		rankType:rankType,
		fromRank:fromRank
	}
	var route = "rank.rankHandler.getPlayerRankList"
	Request(route, info, callback)
}

Api.getAllianceRankList = function(rankType, fromRank, callback){
	var info = {
		rankType:rankType,
		fromRank:fromRank
	}
	var route = "rank.rankHandler.getAllianceRankList"
	Request(route, info, callback)
}

Api.getIapGift = function(giftId, callback){
	var info = {
		giftId:giftId
	}
	var route = "logic.playerHandler.getIapGift"
	Request(route, info, callback)
}

Api.getServers = function(callback){
	var route = "logic.playerHandler.getServers"
	Request(route, null, callback)
}

Api.switchServer = function(serverId, callback){
	var info = {
		serverId:serverId
	}
	var route = "logic.playerHandler.switchServer"
	Request(route, info, callback)
}

Api.setPlayerIcon = function(icon, callback){
	var info = {
		icon:icon
	}
	var route = "logic.playerHandler.setPlayerIcon"
	Request(route, info, callback)
}

Api.unlockPlayerSecondMarchQueue = function(callback){
	var route = "logic.playerHandler.unlockPlayerSecondMarchQueue"
	Request(route, null, callback)
}

Api.initPlayerData = function(terrain, language, callback){
	var info = {
		terrain:terrain,
		language:language
	}
	var route = "logic.playerHandler.initPlayerData"
	Request(route, info, callback)
}

Api.getFirstJoinAllianceReward = function(callback){
	var route = "logic.playerHandler.getFirstJoinAllianceReward"
	Request(route, null, callback)
}

Api.getPlayerWallInfo = function(memberId, callback){
	var info = {
		memberId:memberId
	}
	var route = "logic.playerHandler.getPlayerWallInfo"
	Request(route, info, callback)
}

Api.attackPveSection = function(sectionName, dragonType, soldiers, callback){
	var info = {
		sectionName:sectionName,
		dragonType:dragonType,
		soldiers:soldiers
	}
	var route = "logic.playerHandler.attackPveSection"
	Request(route, info, callback)
}

Api.getPveStageReward = function(stageName, callback){
	var info = {
		stageName:stageName
	}
	var route = "logic.playerHandler.getPveStageReward"
	Request(route, info, callback)
}

Api.searchPlayerByName = function(name, fromIndex, callback){
	var info = {
		name:name,
		fromIndex:fromIndex
	}
	var route = "logic.playerHandler.searchPlayerByName"
	Request(route, info, callback)
}

Api.getServerNotices = function(callback){
	var route = "logic.playerHandler.getServerNotices"
	Request(route, null, callback)
}

Api.getActivities = function(callback){
	var route = "logic.playerHandler.getActivities"
	Request(route, null, callback)
}

Api.getPlayerActivityScoreRewards = function(rankType, callback){
	var info = {
		rankType:rankType
	}
	var route = "logic.playerHandler.getPlayerActivityScoreRewards"
	Request(route, info, callback)
}

Api.getPlayerActivityRankRewards = function(rankType, callback){
	var info = {
		rankType:rankType
	}
	var route = "logic.playerHandler.getPlayerActivityRankRewards"
	Request(route, info, callback)
}

Api.getPlayerActivityRankList = function(rankType, fromRank, callback){
	var info = {
		rankType:rankType,
		fromRank:fromRank
	}
	var route = "rank.rankHandler.getPlayerActivityRankList"
	Request(route, info, callback)
}

Api.getPlayerRank = function(rankType, callback){
	var info = {
		rankType:rankType
	}
	var route = "rank.rankHandler.getPlayerRank"
	Request(route, info, callback)
}

Api.getMyModData = function(callback){
	var route = "logic.playerHandler.getMyModData"
	Request(route, null, callback)
}

Api.getMutedPlayerList = function(callback){
	var route = "logic.playerHandler.getMutedPlayerList"
	Request(route, null, callback)
}

Api.mutePlayer = function(targetPlayerId, muteMinutes, muteReason, callback){
	var info = {
		targetPlayerId:targetPlayerId,
		muteMinutes:muteMinutes,
		muteReason:muteReason
	}
	var route = "logic.playerHandler.mutePlayer"
	Request(route, info, callback)
}

Api.unMutePlayer = function(targetPlayerId, callback){
	var info = {
		targetPlayerId:targetPlayerId
	}
	var route = "logic.playerHandler.unMutePlayer"
	Request(route, info, callback)
}

Api.addBlocked = function(memberId, memberName, memberIcon, callback){
	var info = {
		memberId:memberId,
		memberName:memberName,
		memberIcon:memberIcon
	}
	var route = "logic.playerHandler.addBlocked"
	Request(route, info, callback)
}

Api.removeBlocked = function(memberId, callback){
	var info = {
		memberId:memberId
	}
	var route = "logic.playerHandler.removeBlocked"
	Request(route, info, callback)
}



Api.createAlliance = function(name, tag, country, terrain, flag, callback){
	var info = {
		name:name, tag:tag, country:country, terrain:terrain, flag:flag
	}
	var route = "logic.allianceHandler.createAlliance"
	Request(route, info, callback)
}

Api.sendAllianceMail = function(title, content, callback){
	var info = {
		title:title, content:content
	}
	var route = "logic.allianceHandler.sendAllianceMail"
	Request(route, info, callback)
}

Api.getMyAllianceData = function(callback){
	var route = "logic.allianceHandler.getMyAllianceData"
	Request(route, null, callback)
}

Api.searchAllianceByTag = function(tag, callback){
	var info = {
		tag:tag
	}
	var route = "logic.allianceHandler.searchAllianceByTag"
	Request(route, info, callback)
}

Api.getCanDirectJoinAlliances = function(fromIndex, callback){
	var info = {
		fromIndex:fromIndex
	}
	var route = "logic.allianceHandler.getCanDirectJoinAlliances"
	Request(route, info, callback)
}

Api.editAllianceBasicInfo = function(name, tag, country, flag, callback){
	var info = {
		name:name, tag:tag, country:country, flag:flag
	}
	var route = "logic.allianceHandler.editAllianceBasicInfo"
	Request(route, info, callback)
}

Api.editAllianceTerrian = function(terrain, callback){
	var info = {
		terrain:terrain
	}
	var route = "logic.allianceHandler.editAllianceTerrian"
	Request(route, info, callback)
}

Api.editAllianceNotice = function(notice, callback){
	var info = {
		notice:notice
	}
	var route = "logic.allianceHandler.editAllianceNotice"
	Request(route, info, callback)
}

Api.editAllianceDescription = function(description, callback){
	var info = {
		description:description
	}
	var route = "logic.allianceHandler.editAllianceDescription"
	Request(route, info, callback)
}

Api.editAllianceJoinType = function(joinType, callback){
	var info = {
		joinType:joinType
	}
	var route = "logic.allianceHandler.editAllianceJoinType"
	Request(route, info, callback)
}

Api.editAllianceMemberTitle = function(memberId, title, callback){
	var info = {
		memberId:memberId, title:title
	}
	var route = "logic.allianceHandler.editAllianceMemberTitle"
	Request(route, info, callback)
}

Api.kickAllianceMemberOff = function(memberId, callback){
	var info = {
		memberId:memberId
	}
	var route = "logic.allianceHandler.kickAllianceMemberOff"
	Request(route, info, callback)
}

Api.handOverAllianceArchon = function(memberId, callback){
	var info = {
		memberId:memberId
	}
	var route = "logic.allianceHandler.handOverAllianceArchon"
	Request(route, info, callback)
}

Api.quitAlliance = function(callback){
	var route = "logic.allianceHandler.quitAlliance"
	Request(route, null, callback)
}

Api.requestToJoinAlliance = function(allianceId, callback){
	var info = {
		allianceId:allianceId
	}
	var route = "logic.allianceHandler.requestToJoinAlliance"
	Request(route, info, callback)
}

Api.cancelJoinAllianceRequest = function(allianceId, callback){
	var info = {
		allianceId:allianceId
	}
	var route = "logic.allianceHandler.cancelJoinAllianceRequest"
	Request(route, info, callback)
}

Api.approveJoinAllianceRequest = function(requestEventId, callback){
	var info = {
		requestEventId:requestEventId
	}
	var route = "logic.allianceHandler.approveJoinAllianceRequest"
	Request(route, info, callback)
}

Api.removeJoinAllianceReqeusts = function(requestEventIds, callback){
	var info = {
		requestEventIds:requestEventIds
	}
	var route = "logic.allianceHandler.removeJoinAllianceReqeusts"
	Request(route, info, callback)
}

Api.inviteToJoinAlliance = function(memberId, callback){
	var info = {
		memberId:memberId
	}
	var route = "logic.allianceHandler.inviteToJoinAlliance"
	Request(route, info, callback)
}

Api.handleJoinAllianceInvite = function(allianceId, agree, callback){
	var info = {
		allianceId:allianceId, agree:agree
	}
	var route = "logic.allianceHandler.handleJoinAllianceInvite"
	Request(route, info, callback)
}

Api.buyAllianceArchon = function(callback){
	var route = "logic.allianceHandler.buyAllianceArchon"
	Request(route, null, callback)
}

Api.joinAllianceDirectly = function(allianceId, callback){
	var info = {
		allianceId:allianceId
	}
	var route = "logic.allianceHandler.joinAllianceDirectly"
	Request(route, info, callback)
}

Api.requestAllianceToSpeedUp = function(eventType, eventId, callback){
	var info = {
		eventType:eventType, eventId:eventId
	}
	var route = "logic.allianceHandler.requestAllianceToSpeedUp"
	Request(route, info, callback)
}

Api.helpAllianceMemberSpeedUp = function(eventId, callback){
	var info = {
		eventId:eventId
	}
	var route = "logic.allianceHandler.helpAllianceMemberSpeedUp"
	Request(route, info, callback)
}

Api.helpAllAllianceMemberSpeedUp = function(callback){
	var route = "logic.allianceHandler.helpAllAllianceMemberSpeedUp"
	Request(route, null, callback)
}

Api.donateToAlliance = function(donateType, callback){
	var info = {
		donateType:donateType
	}
	var route = "logic.allianceHandler.donateToAlliance"
	Request(route, info, callback)
}

Api.upgradeAllianceBuilding = function(buildingName, callback){
	var info = {
		buildingName:buildingName
	}
	var route = "logic.allianceHandler.upgradeAllianceBuilding"
	Request(route, info, callback)
}

Api.upgradeAllianceVillage = function(villageType, callback){
	var info = {
		villageType:villageType
	}
	var route = "logic.allianceHandler.upgradeAllianceVillage"
	Request(route, info, callback)
}

Api.activateAllianceShrineStage = function(stageName, callback){
	var info = {
		stageName:stageName
	}
	var route = "logic.allianceHandler.activateAllianceShrineStage"
	Request(route, info, callback)
}

Api.attackAllianceShrine = function(shrineEventId, dragonType, soldiers, callback){
	var info = {
		shrineEventId:shrineEventId,
		dragonType:dragonType,
		soldiers:soldiers
	}
	var route = "logic.allianceHandler.attackAllianceShrine"
	Request(route, info, callback)
}

Api.attackAlliance = function(targetAllianceId, callback){
	var route = "logic.allianceHandler.attackAlliance"
	var info = {
		targetAllianceId:targetAllianceId
	}
	Request(route, info, callback)
}

Api.getAllianceViewData = function(targetAllianceId, callback){
	var info = {
		targetAllianceId:targetAllianceId
	}
	var route = "logic.allianceHandler.getAllianceViewData"
	Request(route, info, callback)
}

Api.searchAllianceInfoByTag = function(tag, callback){
	var info = {
		tag:tag
	}
	var route = "logic.allianceHandler.searchAllianceInfoByTag"
	Request(route, info, callback)
}

Api.helpAllianceMemberDefence = function(dragonType, soldiers, targetPlayerId, callback){
	var info = {
		dragonType:dragonType,
		soldiers:soldiers,
		targetPlayerId:targetPlayerId
	}
	var route = "logic.allianceHandler.helpAllianceMemberDefence"
	Request(route, info, callback)
}

Api.retreatFromBeHelpedAllianceMember = function(beHelpedPlayerId, callback){
	var info = {
		beHelpedPlayerId:beHelpedPlayerId
	}
	var route = "logic.allianceHandler.retreatFromBeHelpedAllianceMember"
	Request(route, info, callback)
}

Api.strikePlayerCity = function(dragonType, defenceAllianceId, defencePlayerId, callback){
	var info = {
		dragonType:dragonType,
		defenceAllianceId:defenceAllianceId,
		defencePlayerId:defencePlayerId
	}
	var route = "logic.allianceHandler.strikePlayerCity"
	Request(route, info, callback)
}

Api.attackPlayerCity = function(dragonType, soldiers, defenceAllianceId, defencePlayerId, callback){
	var info = {
		dragonType:dragonType,
		soldiers:soldiers,
		defenceAllianceId:defenceAllianceId,
		defencePlayerId:defencePlayerId
	}
	var route = "logic.allianceHandler.attackPlayerCity"
	Request(route, info, callback)
}

Api.attackVillage = function(dragonType, soldiers, defenceAllianceId, defenceVillageId, callback){
	var info = {
		dragonType:dragonType,
		soldiers:soldiers,
		defenceAllianceId:defenceAllianceId,
		defenceVillageId:defenceVillageId
	}
	var route = "logic.allianceHandler.attackVillage"
	Request(route, info, callback)
}

Api.attackMonster = function(dragonType, soldiers, defenceAllianceId, defenceMonsterId, callback){
	var info = {
		dragonType:dragonType,
		soldiers:soldiers,
		defenceAllianceId:defenceAllianceId,
		defenceMonsterId:defenceMonsterId
	}
	var route = "logic.allianceHandler.attackMonster"
	Request(route, info, callback)
}

Api.retreatFromVillage = function(villageEventId, callback){
	var info = {
		villageEventId:villageEventId
	}
	var route = "logic.allianceHandler.retreatFromVillage"
	Request(route, info, callback)
}

Api.strikeVillage = function(dragonType, defenceAllianceId, defenceVillageId, callback){
	var info = {
		dragonType:dragonType,
		defenceAllianceId:defenceAllianceId,
		defenceVillageId:defenceVillageId
	}
	var route = "logic.allianceHandler.strikeVillage"
	Request(route, info, callback)
}

Api.getAttackMarchEventDetail = function(enemyAllianceId, eventId, callback){
	var info = {
		enemyAllianceId:enemyAllianceId,
		eventId:eventId
	}
	var route = "logic.allianceHandler.getAttackMarchEventDetail"
	Request(route, info, callback)
}

Api.getStrikeMarchEventDetail = function(enemyAllianceId, eventId, callback){
	var info = {
		enemyAllianceId:enemyAllianceId,
		eventId:eventId
	}
	var route = "logic.allianceHandler.getStrikeMarchEventDetail"
	Request(route, info, callback)
}

Api.getHelpDefenceMarchEventDetail = function(allianceId, eventId, callback){
	var info = {
		allianceId:allianceId,
		eventId:eventId
	}
	var route = "logic.allianceHandler.getHelpDefenceMarchEventDetail"
	Request(route, info, callback)
}

Api.getHelpDefenceTroopDetail = function(playerId, callback){
	var info = {
		playerId:playerId
	}
	var route = "logic.allianceHandler.getHelpDefenceTroopDetail"
	Request(route, info, callback)
}

Api.addShopItem = function(itemName, count, callback){
	var info = {
		itemName:itemName,
		count:count
	}
	var route = "logic.allianceHandler.addShopItem"
	Request(route, info, callback)
}

Api.buyShopItem = function(itemName, count, callback){
	var info = {
		itemName:itemName,
		count:count
	}
	var route = "logic.allianceHandler.buyShopItem"
	Request(route, info, callback)
}

Api.giveLoyaltyToAllianceMember = function(memberId, count, callback){
	var info = {
		memberId:memberId,
		count:count
	}
	var route = "logic.allianceHandler.giveLoyaltyToAllianceMember"
	Request(route, info, callback)
}

Api.getAllianceInfo = function(allianceId, serverId, callback){
	var info = {
		allianceId:allianceId,
		serverId:serverId
	}
	var route = "logic.allianceHandler.getAllianceInfo"
	Request(route, info, callback)
}

Api.getJoinRequestEvents = function(allianceId, callback){
	var info = {
		allianceId:allianceId
	}
	var route = "logic.allianceHandler.getJoinRequestEvents"
	Request(route, info, callback)
}

Api.getShrineReports = function(allianceId, callback){
	var info = {
		allianceId:allianceId
	}
	var route = "logic.allianceHandler.getShrineReports"
	Request(route, info, callback)
}

Api.getAllianceFightReports = function(allianceId, callback){
	var info = {
		allianceId:allianceId
	}
	var route = "logic.allianceHandler.getAllianceFightReports"
	Request(route, info, callback)
}

Api.getItemLogs = function(allianceId, callback){
	var info = {
		allianceId:allianceId
	}
	var route = "logic.allianceHandler.getItemLogs"
	Request(route, info, callback)
}

Api.enterMapIndex = function(mapIndex, callback){
	var info = {
		mapIndex:mapIndex
	}
	var route = "logic.allianceHandler.enterMapIndex"
	Request(route, info, callback)
}

Api.leaveMapIndex = function(mapIndex, callback){
	var info = {
		mapIndex:mapIndex
	}
	var route = "logic.allianceHandler.leaveMapIndex"
	Request(route, info, callback)
}

Api.getMapAllianceDatas = function(mapIndexs, callback){
	var info = {
		mapIndexs:mapIndexs
	}
	var route = 'logic.allianceHandler.getMapAllianceDatas';
	Request(route, info, callback);
}

Api.moveAlliance = function(targetMapIndex, callback){
	var info = {
		targetMapIndex:targetMapIndex
	}
	var route = 'logic.allianceHandler.moveAlliance';
	Request(route, info, callback);
}