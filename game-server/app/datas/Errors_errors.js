"use strict"

var errors = {}
module.exports = errors

errors["commonError"] = {
	key:"commonError",
	code:500,
	message:"通用错误"
}
errors["deviceNotExist"] = {
	key:"deviceNotExist",
	code:501,
	message:"设备不存在"
}
errors["userNotExist"] = {
	key:"userNotExist",
	code:502,
	message:"用户不存在"
}
errors["playerNotExist"] = {
	key:"playerNotExist",
	code:503,
	message:"玩家不存在"
}
errors["objectIsLocked"] = {
	key:"objectIsLocked",
	code:504,
	message:"对象被锁定"
}
errors["reLoginNeeded"] = {
	key:"reLoginNeeded",
	code:505,
	message:"需要重新登录"
}
errors["playerAlreadyLogin"] = {
	key:"playerAlreadyLogin",
	code:506,
	message:"玩家已经登录"
}
errors["allianceNotExist"] = {
	key:"allianceNotExist",
	code:507,
	message:"联盟不存在"
}
errors["serverUnderMaintain"] = {
	key:"serverUnderMaintain",
	code:508,
	message:"服务器维护中"
}
errors["buildingNotExist"] = {
	key:"buildingNotExist",
	code:509,
	message:"建筑不存在"
}
errors["buildingUpgradingNow"] = {
	key:"buildingUpgradingNow",
	code:510,
	message:"建筑正在升级"
}
errors["buildingLocationNotLegal"] = {
	key:"buildingLocationNotLegal",
	code:511,
	message:"建筑坑位不合法"
}
errors["buildingCountReachUpLimit"] = {
	key:"buildingCountReachUpLimit",
	code:512,
	message:"建造数量已达建造上限"
}
errors["buildingLevelReachUpLimit"] = {
	key:"buildingLevelReachUpLimit",
	code:513,
	message:"建筑已达到最高等级"
}
errors["buildingUpgradePreConditionNotMatch"] = {
	key:"buildingUpgradePreConditionNotMatch",
	code:514,
	message:"建筑升级前置条件未满足"
}
errors["gemNotEnough"] = {
	key:"gemNotEnough",
	code:515,
	message:"宝石不足"
}
errors["onlyProductionBuildingCanSwitch"] = {
	key:"onlyProductionBuildingCanSwitch",
	code:516,
	message:"只有生产建筑才能转换"
}
errors["houseTooMuchMore"] = {
	key:"houseTooMuchMore",
	code:517,
	message:"小屋数量过多"
}
errors["hostBuildingLevelMustBiggerThanOne"] = {
	key:"hostBuildingLevelMustBiggerThanOne",
	code:518,
	message:"主体建筑必须大于等于1级"
}
errors["houseTypeNotExist"] = {
	key:"houseTypeNotExist",
	code:519,
	message:"小屋类型不存在"
}
errors["houseCountTooMuchMore"] = {
	key:"houseCountTooMuchMore",
	code:520,
	message:"小屋数量超过限制"
}
errors["buildingNotAllowHouseCreate"] = {
	key:"buildingNotAllowHouseCreate",
	code:521,
	message:"建筑周围不允许建造小屋"
}
errors["houseLocationNotLegal"] = {
	key:"houseLocationNotLegal",
	code:522,
	message:"小屋坑位不合法"
}
errors["noEnoughCitizenToCreateHouse"] = {
	key:"noEnoughCitizenToCreateHouse",
	code:523,
	message:"建造小屋会造成可用城民小于0"
}
errors["houseUpgradePrefixNotMatch"] = {
	key:"houseUpgradePrefixNotMatch",
	code:524,
	message:"小屋升级前置条件未满足"
}
errors["houseNotExist"] = {
	key:"houseNotExist",
	code:525,
	message:"小屋不存在"
}
errors["houseUpgradingNow"] = {
	key:"houseUpgradingNow",
	code:526,
	message:"小屋正在升级"
}
errors["houseReachMaxLevel"] = {
	key:"houseReachMaxLevel",
	code:527,
	message:"小屋已达到最高等级"
}
errors["noEnoughCitizenToUpgradeHouse"] = {
	key:"noEnoughCitizenToUpgradeHouse",
	code:528,
	message:"升级小屋会造成可用城民小于0"
}
errors["playerEventNotExist"] = {
	key:"playerEventNotExist",
	code:529,
	message:"玩家事件不存在"
}
errors["canNotFreeSpeedupNow"] = {
	key:"canNotFreeSpeedupNow",
	code:530,
	message:"还不能进行免费加速"
}
errors["buildingNotBuild"] = {
	key:"buildingNotBuild",
	code:531,
	message:"建筑还未建造"
}
errors["materialAsSameTypeIsMakeNow"] = {
	key:"materialAsSameTypeIsMakeNow",
	code:532,
	message:"同类型的材料正在制造"
}
errors["materialMakeFinishedButNotTakeAway"] = {
	key:"materialMakeFinishedButNotTakeAway",
	code:533,
	message:"同类型的材料制作完成后还未领取"
}
errors["materialAsDifferentTypeIsMakeNow"] = {
	key:"materialAsDifferentTypeIsMakeNow",
	code:534,
	message:"不同类型的材料正在制造"
}
errors["materialEventNotExistOrIsMakeing"] = {
	key:"materialEventNotExistOrIsMakeing",
	code:535,
	message:"材料事件不存在或者正在制作"
}
errors["theSoldierIsLocked"] = {
	key:"theSoldierIsLocked",
	code:536,
	message:"此士兵还处于锁定状态"
}
errors["recruitTooMuchOnce"] = {
	key:"recruitTooMuchOnce",
	code:537,
	message:"招募数量超过单次招募上限"
}
errors["soldierRecruitMaterialsNotEnough"] = {
	key:"soldierRecruitMaterialsNotEnough",
	code:538,
	message:"士兵招募材料不足"
}
errors["dragonEquipmentEventsExist"] = {
	key:"dragonEquipmentEventsExist",
	code:539,
	message:"龙装备制造事件已存在"
}
errors["dragonEquipmentMaterialsNotEnough"] = {
	key:"dragonEquipmentMaterialsNotEnough",
	code:540,
	message:"制作龙装备材料不足"
}
errors["soldierNotExistOrCountNotLegal"] = {
	key:"soldierNotExistOrCountNotLegal",
	code:541,
	message:"士兵不存在或士兵数量不合法"
}
errors["dragonEggAlreadyHatched"] = {
	key:"dragonEggAlreadyHatched",
	code:542,
	message:"龙蛋早已成功孵化"
}
errors["dragonEggHatchEventExist"] = {
	key:"dragonEggHatchEventExist",
	code:543,
	message:"龙蛋孵化事件已存在"
}
errors["dragonNotHatched"] = {
	key:"dragonNotHatched",
	code:544,
	message:"龙还未孵化"
}
errors["dragonEquipmentNotMatchForTheDragon"] = {
	key:"dragonEquipmentNotMatchForTheDragon",
	code:545,
	message:"装备与龙的星级不匹配"
}
errors["dragonEquipmentNotEnough"] = {
	key:"dragonEquipmentNotEnough",
	code:546,
	message:"龙装备数量不足"
}
errors["dragonAlreadyHasTheSameCategory"] = {
	key:"dragonAlreadyHasTheSameCategory",
	code:547,
	message:"龙身上已经存在相同类型的装备"
}
errors["dragonDoNotHasThisEquipment"] = {
	key:"dragonDoNotHasThisEquipment",
	code:548,
	message:"此分类还没有配置装备"
}
errors["dragonEquipmentReachMaxStar"] = {
	key:"dragonEquipmentReachMaxStar",
	code:549,
	message:"装备已到最高星级"
}
errors["dragonEquipmentsNotExistOrNotEnough"] = {
	key:"dragonEquipmentsNotExistOrNotEnough",
	code:550,
	message:"被牺牲的装备不存在或数量不足"
}
errors["dragonSkillNotExist"] = {
	key:"dragonSkillNotExist",
	code:551,
	message:"龙技能不存在"
}
errors["dragonSkillIsLocked"] = {
	key:"dragonSkillIsLocked",
	code:552,
	message:"此龙技能还未解锁"
}
errors["dragonSkillReachMaxLevel"] = {
	key:"dragonSkillReachMaxLevel",
	code:553,
	message:"龙技能已达最高等级"
}
errors["heroBloodNotEnough"] = {
	key:"heroBloodNotEnough",
	code:554,
	message:"英雄之血不足"
}
errors["dragonReachMaxStar"] = {
	key:"dragonReachMaxStar",
	code:555,
	message:"龙的星级已达最高"
}
errors["dragonUpgradeStarFailedForLevelNotLegal"] = {
	key:"dragonUpgradeStarFailedForLevelNotLegal",
	code:556,
	message:"龙的等级未达到晋级要求"
}
errors["dragonUpgradeStarFailedForEquipmentNotLegal"] = {
	key:"dragonUpgradeStarFailedForEquipmentNotLegal",
	code:557,
	message:"龙的装备未达到晋级要求"
}
errors["dailyQuestNotExist"] = {
	key:"dailyQuestNotExist",
	code:558,
	message:"每日任务不存在"
}
errors["dailyQuestReachMaxStar"] = {
	key:"dailyQuestReachMaxStar",
	code:559,
	message:"每日任务已达最高星级"
}
errors["dailyQuestEventExist"] = {
	key:"dailyQuestEventExist",
	code:560,
	message:"每日任务事件已存在"
}
errors["dailyQuestEventNotExist"] = {
	key:"dailyQuestEventNotExist",
	code:561,
	message:"每日任务事件不存在"
}
errors["dailyQuestEventNotFinished"] = {
	key:"dailyQuestEventNotFinished",
	code:562,
	message:"每日任务事件还未完成"
}
errors["mailNotExist"] = {
	key:"mailNotExist",
	code:563,
	message:"邮件不存在"
}
errors["reportNotExist"] = {
	key:"reportNotExist",
	code:564,
	message:"战报不存在"
}
errors["dragonIsNotFree"] = {
	key:"dragonIsNotFree",
	code:565,
	message:"龙未处于空闲状态"
}
errors["dragonSelectedIsDead"] = {
	key:"dragonSelectedIsDead",
	code:566,
	message:"所选择的龙已经阵亡"
}
errors["noDragonInDefenceStatus"] = {
	key:"noDragonInDefenceStatus",
	code:567,
	message:"没有龙驻防在城墙"
}
errors["sellQueueNotEnough"] = {
	key:"sellQueueNotEnough",
	code:568,
	message:"没有足够的出售队列"
}
errors["resourceNotEnough"] = {
	key:"resourceNotEnough",
	code:569,
	message:"玩家资源不足"
}
errors["cartNotEnough"] = {
	key:"cartNotEnough",
	code:570,
	message:"马车数量不足"
}
errors["sellItemNotExist"] = {
	key:"sellItemNotExist",
	code:571,
	message:"商品不存在"
}
errors["sellItemNotSold"] = {
	key:"sellItemNotSold",
	code:572,
	message:"商品还未卖出"
}
errors["sellItemNotBelongsToYou"] = {
	key:"sellItemNotBelongsToYou",
	code:573,
	message:"您未出售此商品"
}
errors["sellItemAlreadySold"] = {
	key:"sellItemAlreadySold",
	code:574,
	message:"商品已经售出"
}
errors["techReachMaxLevel"] = {
	key:"techReachMaxLevel",
	code:575,
	message:"科技已达最高等级"
}
errors["techUpgradePreConditionNotMatch"] = {
	key:"techUpgradePreConditionNotMatch",
	code:576,
	message:"前置科技条件不满足"
}
errors["techIsUpgradingNow"] = {
	key:"techIsUpgradingNow",
	code:577,
	message:"所选择的科技正在升级"
}
errors["soldierReachMaxStar"] = {
	key:"soldierReachMaxStar",
	code:578,
	message:"士兵已达最高星级"
}
errors["techPointNotEnough"] = {
	key:"techPointNotEnough",
	code:579,
	message:"科技点不足"
}
errors["soldierIsUpgradingNow"] = {
	key:"soldierIsUpgradingNow",
	code:580,
	message:"此兵种正在升级中"
}
errors["itemNotSell"] = {
	key:"itemNotSell",
	code:581,
	message:"此道具未出售"
}
errors["itemNotExist"] = {
	key:"itemNotExist",
	code:582,
	message:"道具不存在"
}
errors["houseCanNotBeMovedNow"] = {
	key:"houseCanNotBeMovedNow",
	code:583,
	message:"小屋当前不能被移动"
}
errors["playerNameCanNotBeTheSame"] = {
	key:"playerNameCanNotBeTheSame",
	code:584,
	message:"不能修改为相同的玩家名称"
}
errors["playerNameAlreadyUsed"] = {
	key:"playerNameAlreadyUsed",
	code:585,
	message:"玩家名称已被其他玩家占用"
}
errors["playerNotJoinAlliance"] = {
	key:"playerNotJoinAlliance",
	code:586,
	message:"玩家未加入联盟"
}
errors["marchEventNotExist"] = {
	key:"marchEventNotExist",
	code:587,
	message:"行军事件不存在"
}
errors["allianceInFightStatus"] = {
	key:"allianceInFightStatus",
	code:588,
	message:"联盟正处于战争期"
}
errors["playerHasMarchEvent"] = {
	key:"playerHasMarchEvent",
	code:589,
	message:"玩家有部队正在行军中"
}
errors["canNotMoveToTargetPlace"] = {
	key:"canNotMoveToTargetPlace",
	code:590,
	message:"不能移动到目标点位"
}
errors["itemCanNotBeUsedDirectly"] = {
	key:"itemCanNotBeUsedDirectly",
	code:591,
	message:"此道具不允许直接使用"
}
errors["casinoTokenNotEnough"] = {
	key:"casinoTokenNotEnough",
	code:592,
	message:"赌币不足"
}
errors["loginRewardAlreadyGet"] = {
	key:"loginRewardAlreadyGet",
	code:593,
	message:"今日登陆奖励已领取"
}
errors["onlineTimeNotEough"] = {
	key:"onlineTimeNotEough",
	code:594,
	message:"在线时间不足,不能领取"
}
errors["onlineTimeRewardAlreadyGet"] = {
	key:"onlineTimeRewardAlreadyGet",
	code:595,
	message:"此时间节点的在线奖励已经领取"
}
errors["wonderAssistanceRewardAlreadyGet"] = {
	key:"wonderAssistanceRewardAlreadyGet",
	code:596,
	message:"今日王城援军奖励已领取"
}
errors["levelUpRewardExpired"] = {
	key:"levelUpRewardExpired",
	code:597,
	message:"冲级奖励时间已过"
}
errors["levelUpRewardAlreadyGet"] = {
	key:"levelUpRewardAlreadyGet",
	code:598,
	message:"当前等级的冲级奖励已经领取"
}
errors["levelUpRewardCanNotBeGetForCastleLevelNotMatch"] = {
	key:"levelUpRewardCanNotBeGetForCastleLevelNotMatch",
	code:599,
	message:"玩家城堡等级不足以领取当前冲级奖励"
}
errors["firstIAPNotHappen"] = {
	key:"firstIAPNotHappen",
	code:600,
	message:"玩家还未进行首次充值"
}
errors["firstIAPRewardAlreadyGet"] = {
	key:"firstIAPRewardAlreadyGet",
	code:601,
	message:"首次充值奖励已经领取"
}
errors["dailyTaskRewardAlreadyGet"] = {
	key:"dailyTaskRewardAlreadyGet",
	code:602,
	message:"日常任务奖励已经领取"
}
errors["dailyTaskNotFinished"] = {
	key:"dailyTaskNotFinished",
	code:603,
	message:"日常任务还未完成"
}
errors["growUpTaskNotExist"] = {
	key:"growUpTaskNotExist",
	code:604,
	message:"成长任务不存在"
}
errors["growUpTaskRewardAlreadyGet"] = {
	key:"growUpTaskRewardAlreadyGet",
	code:605,
	message:"成长任务奖励已经领取"
}
errors["growUpTaskRewardCanNotBeGetForPreTaskRewardNotGet"] = {
	key:"growUpTaskRewardCanNotBeGetForPreTaskRewardNotGet",
	code:606,
	message:"前置任务奖励未领取"
}
errors["duplicateIAPTransactionId"] = {
	key:"duplicateIAPTransactionId",
	code:607,
	message:"重复的订单号"
}
errors["iapProductNotExist"] = {
	key:"iapProductNotExist",
	code:608,
	message:"订单商品不存在"
}
errors["iapValidateFaild"] = {
	key:"iapValidateFaild",
	code:609,
	message:"订单验证失败"
}
errors["netErrorWithIapServer"] = {
	key:"netErrorWithIapServer",
	code:610,
	message:"IAP服务器通讯出错"
}
errors["playerAlreadyJoinAlliance"] = {
	key:"playerAlreadyJoinAlliance",
	code:612,
	message:"玩家已加入了联盟"
}
errors["allianceNameExist"] = {
	key:"allianceNameExist",
	code:613,
	message:"联盟名称已经存在"
}
errors["allianceTagExist"] = {
	key:"allianceTagExist",
	code:614,
	message:"联盟标签已经存在"
}
errors["allianceOperationRightsIllegal"] = {
	key:"allianceOperationRightsIllegal",
	code:615,
	message:"联盟操作权限不足"
}
errors["allianceHonourNotEnough"] = {
	key:"allianceHonourNotEnough",
	code:616,
	message:"联盟荣耀值不足"
}
errors["allianceDoNotHasThisMember"] = {
	key:"allianceDoNotHasThisMember",
	code:617,
	message:"联盟没有此玩家"
}
errors["allianceInFightStatusCanNotKickMemberOff"] = {
	key:"allianceInFightStatusCanNotKickMemberOff",
	code:618,
	message:"联盟正在战争准备期或战争期,不能将玩家踢出联盟"
}
errors["canNotKickAllianceMemberOffForTitleIsUpperThanMe"] = {
	key:"canNotKickAllianceMemberOffForTitleIsUpperThanMe",
	code:619,
	message:"不能将职级高于或等于自己的玩家踢出联盟"
}
errors["youAreNotTheAllianceArchon"] = {
	key:"youAreNotTheAllianceArchon",
	code:620,
	message:"别逗了,你是不盟主好么"
}
errors["allianceArchonCanNotQuitAlliance"] = {
	key:"allianceArchonCanNotQuitAlliance",
	code:621,
	message:"别逗了,仅当联盟成员为空时,盟主才能退出联盟"
}
errors["allianceInFightStatusCanNotQuitAlliance"] = {
	key:"allianceInFightStatusCanNotQuitAlliance",
	code:622,
	message:"联盟正在战争准备期或战争期,不能退出联盟"
}
errors["allianceDoNotAllowJoinDirectly"] = {
	key:"allianceDoNotAllowJoinDirectly",
	code:623,
	message:"联盟不允许直接加入"
}
errors["joinAllianceRequestIsFull"] = {
	key:"joinAllianceRequestIsFull",
	code:624,
	message:"联盟申请已满,请撤消部分申请后再来申请"
}
errors["joinTheAllianceRequestAlreadySend"] = {
	key:"joinTheAllianceRequestAlreadySend",
	code:625,
	message:"对此联盟的申请已发出,请耐心等候审核"
}
errors["allianceJoinRequestMessagesIsFull"] = {
	key:"allianceJoinRequestMessagesIsFull",
	code:626,
	message:"此联盟的申请信息已满,请等候其处理后再进行申请"
}
errors["joinAllianceRequestNotExist"] = {
	key:"joinAllianceRequestNotExist",
	code:627,
	message:"联盟申请事件不存在"
}
errors["playerCancelTheJoinRequestToTheAlliance"] = {
	key:"playerCancelTheJoinRequestToTheAlliance",
	code:628,
	message:"玩家已经取消对此联盟的申请"
}
errors["inviteRequestMessageIsFullForThisPlayer"] = {
	key:"inviteRequestMessageIsFullForThisPlayer",
	code:629,
	message:"此玩家的邀请信息已满,请等候其处理后再进行邀请"
}
errors["allianceInviteEventNotExist"] = {
	key:"allianceInviteEventNotExist",
	code:630,
	message:"联盟邀请事件不存在"
}
errors["playerAlreadyTheAllianceArchon"] = {
	key:"playerAlreadyTheAllianceArchon",
	code:631,
	message:"玩家已经是盟主了"
}
errors["onlyAllianceArchonMoreThanSevenDaysNotOnLinePlayerCanBuyArchonTitle"] = {
	key:"onlyAllianceArchonMoreThanSevenDaysNotOnLinePlayerCanBuyArchonTitle",
	code:632,
	message:"盟主连续7天不登陆时才能购买盟主职位"
}
errors["speedupRequestAlreadySendForThisEvent"] = {
	key:"speedupRequestAlreadySendForThisEvent",
	code:633,
	message:"此事件已经发送了加速请求"
}
errors["allianceHelpEventNotExist"] = {
	key:"allianceHelpEventNotExist",
	code:634,
	message:"帮助事件不存在"
}
errors["canNotHelpSelfSpeedup"] = {
	key:"canNotHelpSelfSpeedup",
	code:635,
	message:"不能帮助自己加速建造"
}
errors["youAlreadyHelpedTheEvent"] = {
	key:"youAlreadyHelpedTheEvent",
	code:636,
	message:"您已经帮助过此事件了"
}
errors["allianceBuildingReachMaxLevel"] = {
	key:"allianceBuildingReachMaxLevel",
	code:637,
	message:"联盟建筑已达到最高等级"
}
errors["theAllianceShrineEventAlreadyActived"] = {
	key:"theAllianceShrineEventAlreadyActived",
	code:638,
	message:"此联盟事件已经激活"
}
errors["alliancePerceptionNotEnough"] = {
	key:"alliancePerceptionNotEnough",
	code:639,
	message:"联盟感知力不足"
}
errors["dragonLeaderShipNotEnough"] = {
	key:"dragonLeaderShipNotEnough",
	code:640,
	message:"所选择的龙领导力不足"
}
errors["noFreeMarchQueue"] = {
	key:"noFreeMarchQueue",
	code:641,
	message:"没有空闲的行军队列"
}
errors["shrineStageEventNotFound"] = {
	key:"shrineStageEventNotFound",
	code:642,
	message:"关卡激活事件不存在"
}
errors["theShrineStageIsLocked"] = {
	key:"theShrineStageIsLocked",
	code:643,
	message:"此联盟圣地关卡还未解锁"
}
errors["youHadSendTroopToTheShrineStage"] = {
	key:"youHadSendTroopToTheShrineStage",
	code:644,
	message:"玩家已经对此关卡派出了部队"
}
errors["allianceInFightStatus"] = {
	key:"allianceInFightStatus",
	code:645,
	message:"联盟正处于战争准备期或战争期"
}
errors["alreadySendAllianceFightRequest"] = {
	key:"alreadySendAllianceFightRequest",
	code:646,
	message:"已经发送过开战请求"
}
errors["canNotFindAllianceToFight"] = {
	key:"canNotFindAllianceToFight",
	code:647,
	message:"未能找到战力相匹配的联盟"
}
errors["allianceFightReportNotExist"] = {
	key:"allianceFightReportNotExist",
	code:648,
	message:"联盟战报不存在"
}
errors["winnerOfAllianceFightCanNotRevenge"] = {
	key:"winnerOfAllianceFightCanNotRevenge",
	code:649,
	message:"联盟战胜利方不能发起复仇"
}
errors["allianceFightRevengeTimeExpired"] = {
	key:"allianceFightRevengeTimeExpired",
	code:650,
	message:"超过最长复仇期限"
}
errors["targetAllianceNotInPeaceStatus"] = {
	key:"targetAllianceNotInPeaceStatus",
	code:651,
	message:"目标联盟未处于和平期"
}
errors["playerAlreadySendHelpDefenceTroopToTargetPlayer"] = {
	key:"playerAlreadySendHelpDefenceTroopToTargetPlayer",
	code:652,
	message:"玩家已经对目标玩家派出了协防部队"
}
errors["targetPlayersHelpDefenceTroopsCountReachMax"] = {
	key:"targetPlayersHelpDefenceTroopsCountReachMax",
	code:653,
	message:"目标玩家协防部队数量已达最大"
}
errors["noHelpDefenceTroopInTargetPlayerCity"] = {
	key:"noHelpDefenceTroopInTargetPlayerCity",
	code:654,
	message:"玩家没有协防部队驻扎在目标玩家城市"
}
errors["allianceNotInFightStatus"] = {
	key:"allianceNotInFightStatus",
	code:655,
	message:"联盟未处于战争期"
}
errors["playerNotInEnemyAlliance"] = {
	key:"playerNotInEnemyAlliance",
	code:656,
	message:"玩家不在敌对联盟中"
}
errors["playerInProtectStatus"] = {
	key:"playerInProtectStatus",
	code:657,
	message:"玩家处于保护状态"
}
errors["targetAllianceNotTheEnemyAlliance"] = {
	key:"targetAllianceNotTheEnemyAlliance",
	code:658,
	message:"目标联盟非当前匹配的敌对联盟"
}
errors["villageNotExist"] = {
	key:"villageNotExist",
	code:659,
	message:"村落不存在"
}
errors["villageCollectEventNotExist"] = {
	key:"villageCollectEventNotExist",
	code:660,
	message:"村落采集事件不存在"
}
errors["noHelpDefenceTroopByThePlayer"] = {
	key:"noHelpDefenceTroopByThePlayer",
	code:661,
	message:"没有此玩家的协防部队"
}
errors["theItemNotSellInAllianceShop"] = {
	key:"theItemNotSellInAllianceShop",
	code:662,
	message:"此道具未在联盟商店出售"
}
errors["normalItemsNotNeedToAdd"] = {
	key:"normalItemsNotNeedToAdd",
	code:663,
	message:"普通道具不需要进货补充"
}
errors["playerLevelNotEoughCanNotBuyAdvancedItem"] = {
	key:"playerLevelNotEoughCanNotBuyAdvancedItem",
	code:664,
	message:"玩家级别不足,不能购买高级道具"
}
errors["itemCountNotEnough"] = {
	key:"itemCountNotEnough",
	code:665,
	message:"道具数量不足"
}
errors["playerLoyaltyNotEnough"] = {
	key:"playerLoyaltyNotEnough",
	code:666,
	message:"玩家忠诚值不足"
}
errors["allianceEventNotExist"] = {
	key:"allianceEventNotExist",
	code:667,
	message:"联盟事件不存在"
}
errors["illegalAllianceStatus"] = {
	key:"illegalAllianceStatus",
	code:668,
	message:"非法的联盟状态"
}
errors["playerAlreadyBindGC"] = {
	key:"playerAlreadyBindGC",
	code:669,
	message:"玩家GameCenter账号已经绑定"
}
errors["theGCAlreadyBindedByOtherPlayer"] = {
	key:"theGCAlreadyBindedByOtherPlayer",
	code:670,
	message:"此GameCenter账号已被其他玩家绑定"
}
errors["theGCAlreadyBindedByCurrentPlayer"] = {
	key:"theGCAlreadyBindedByCurrentPlayer",
	code:673,
	message:"此GameCenter账号已绑定当前玩家"
}
errors["pushIdAlreadySeted"] = {
	key:"pushIdAlreadySeted",
	code:674,
	message:"pushId已经设置"
}
errors["theAllianceBuildingNotAllowMove"] = {
	key:"theAllianceBuildingNotAllowMove",
	code:675,
	message:"此联盟建筑不允许移动"
}
errors["theAllianceBuildingCanNotMoveToTargetPoint"] = {
	key:"theAllianceBuildingCanNotMoveToTargetPoint",
	code:676,
	message:"不能移动到目标点位"
}
errors["giftNotExist"] = {
	key:"giftNotExist",
	code:677,
	message:"礼品不存在"
}
errors["serverNotExist"] = {
	key:"serverNotExist",
	code:678,
	message:"服务器不存在"
}
errors["canNotSwitchToTheSameServer"] = {
	key:"canNotSwitchToTheSameServer",
	code:679,
	message:"不能切换到相同的服务器"
}
errors["playerNotInCurrentServer"] = {
	key:"playerNotInCurrentServer",
	code:680,
	message:"玩家未在当前服务器"
}
errors["noEventsNeedTobeSpeedup"] = {
	key:"noEventsNeedTobeSpeedup",
	code:681,
	message:"没有事件需要协助加速"
}
errors["allianceMemberCountReachMax"] = {
	key:"allianceMemberCountReachMax",
	code:682,
	message:"联盟人数已达最大"
}
errors["serverTooBusy"] = {
	key:"serverTooBusy",
	code:683,
	message:"服务器繁忙"
}
errors["playerSecondMarchQueueAlreadyUnlocked"] = {
	key:"playerSecondMarchQueueAlreadyUnlocked",
	code:684,
	message:"玩家第二条队列已经解锁"
}
errors["illegalRequest"] = {
	key:"illegalRequest",
	code:685,
	message:"非法的请求"
}
errors["playerDataAlreadyInited"] = {
	key:"playerDataAlreadyInited",
	code:686,
	message:"玩家数据已经初始化"
}
errors["deviceLocked"] = {
	key:"deviceLocked",
	code:687,
	message:"设备禁止登陆"
}
errors["playerLocked"] = {
	key:"playerLocked",
	code:688,
	message:"玩家禁止登录"
}
errors["firstJoinAllianceRewardAlreadyGeted"] = {
	key:"firstJoinAllianceRewardAlreadyGeted",
	code:689,
	message:"首次加入联盟奖励已经领取"
}
errors["versionValidateFailed"] = {
	key:"versionValidateFailed",
	code:691,
	message:"版本验证失败"
}
errors["versionNotEqual"] = {
	key:"versionNotEqual",
	code:692,
	message:"版本不匹配"
}
errors["theAllianceDoNotNeedRequestToJoin"] = {
	key:"theAllianceDoNotNeedRequestToJoin",
	code:693,
	message:"此联盟不需要申请加入"
}
errors["monsterNotExist"] = {
	key:"monsterNotExist",
	code:694,
	message:"野怪不存在"
}
errors["canNotBuyYourOwnSellItem"] = {
	key:"canNotBuyYourOwnSellItem",
	code:695,
	message:"不能购买自己出售的商品"
}
errors["hatchConditionNotMatch"] = {
	key:"hatchConditionNotMatch",
	code:696,
	message:"孵化条件不满足"
}
errors["pveSecionIsLocked"] = {
	key:"pveSecionIsLocked",
	code:697,
	message:"关卡未解锁"
}
errors["canNotGetPvEStarRewardyet"] = {
	key:"canNotGetPvEStarRewardyet",
	code:698,
	message:"还不能领取PvE星级奖励"
}
errors["pveStarRewardAlreadyGet"] = {
	key:"pveStarRewardAlreadyGet",
	code:699,
	message:"Pve星级奖励已经领取"
}
errors["currentSectionReachMaxFightCount"] = {
	key:"currentSectionReachMaxFightCount",
	code:700,
	message:"当前关卡已达最大战斗次数"
}
errors["playerStaminaNotEnough"] = {
	key:"playerStaminaNotEnough",
	code:701,
	message:"玩家体力值不足"
}
errors["currentPvESectionCanNotBeSweepedYet"] = {
	key:"currentPvESectionCanNotBeSweepedYet",
	code:702,
	message:"当前PvE关卡还不能被扫荡"
}
errors["thisMailNotContainsRewards"] = {
	key:"thisMailNotContainsRewards",
	code:703,
	message:"此邮件未包含奖励信息"
}
errors["theRewardsAlreadyGetedFromThisMail"] = {
	key:"theRewardsAlreadyGetedFromThisMail",
	code:704,
	message:"此邮件的奖励已经领取"
}
errors["playerIsForbiddenToSpeak"] = {
	key:"playerIsForbiddenToSpeak",
	code:705,
	message:"玩家被禁言"
}
errors["canNotViewYourOwnAlliance"] = {
	key:"canNotViewYourOwnAlliance",
	code:706,
	message:"不能观察自己的联盟"
}
errors["noFreeMapArea"] = {
	key:"noFreeMapArea",
	code:707,
	message:"没有空闲的地图区域"
}
errors["canNotMoveAllianceRightNow"] = {
	key:"canNotMoveAllianceRightNow",
	code:709,
	message:"当前还不能移动联盟"
}
errors["canNotMoveToTargetMapIndex"] = {
	key:"canNotMoveToTargetMapIndex",
	code:710,
	message:"不能移动到目标地块"
}
errors["canNotQuitAllianceForPlayerWillBeAttacked"] = {
	key:"canNotQuitAllianceForPlayerWillBeAttacked",
	code:711,
	message:"玩家将被攻打,不能退出联盟"
}
errors["youHaveProductInSellCanNotSwitchServer"] = {
	key:"youHaveProductInSellCanNotSwitchServer",
	code:712,
	message:"您有商品正在出售,不能切换服务器"
}
errors["alliancePalaceLevelTooLowCanNotMoveAlliance"] = {
	key:"alliancePalaceLevelTooLowCanNotMoveAlliance",
	code:713,
	message:"联盟宫殿等级过低,不能移动联盟"
}
errors["playerNotBindGC"] = {
	key:"playerNotBindGC",
	code:714,
	message:"玩家还未绑定GC"
}
errors["canNotSwitchToTheSelectedServer"] = {
	key:"canNotSwitchToTheSelectedServer",
	code:715,
	message:"不能迁移到选定的服务器"
}
errors["alreadyHasDefenceDragon"] = {
	key:"alreadyHasDefenceDragon",
	code:716,
	message:"已有龙驻防在城墙"
}
errors["doNotNeedGemSpeedup"] = {
	key:"doNotNeedGemSpeedup",
	code:717,
	message:"不需要宝石加速"
}
errors["playerNameNotLegal"] = {
	key:"playerNameNotLegal",
	code:718,
	message:"玩家昵称不合法"
}
errors["allianceNameNotLegal"] = {
	key:"allianceNameNotLegal",
	code:719,
	message:"联盟昵称不合法"
}
errors["invalidActivity"] = {
	key:"invalidActivity",
	code:720,
	message:"无效的活动信息"
}
errors["noAvailableRewardsCanGet"] = {
	key:"noAvailableRewardsCanGet",
	code:721,
	message:"没有可领取的奖励"
}
errors["canNotQuitAllianceNow"] = {
	key:"canNotQuitAllianceNow",
	code:722,
	message:"还不能退出联盟"
}
errors["youAreNotTheMod"] = {
	key:"youAreNotTheMod",
	code:723,
	message:"你不是墨子"
}
errors["invalidAllianceActivity"] = {
	key:"invalidAllianceActivity",
	code:724,
	message:"无效的联盟活动信息"
}
errors["canNotHelpDefenceNow"] = {
	key:"canNotHelpDefenceNow",
	code:725,
	message:"现在还不能进行协防"
}
errors["beAttackedNowCanNotMoveCityNow"] = {
	key:"beAttackedNowCanNotMoveCityNow",
	code:726,
	message:"正遭受攻击,不能退出移动城市"
}
errors["targetNotModNowCanNotReply"] = {
	key:"targetNotModNowCanNotReply",
	code:727,
	message:"目标已不是墨子,不能回复"
}
errors["canNotGetTotalIAPRewardsNow"] = {
	key:"canNotGetTotalIAPRewardsNow",
	code:728,
	message:"还不能领取累计充值奖励"
}
errors["canNotGetMonthcardRewardsNow"] = {
	key:"canNotGetMonthcardRewardsNow",
	code:729,
	message:"还不能领取月卡每日奖励"
}
errors["canNotUseMasterOfDefenderNow"] = {
	key:"canNotUseMasterOfDefenderNow",
	code:730,
	message:"还不能使用城防大师"
}
errors["wallWasBrokenCanNotSendTroopsOut"] = {
	key:"wallWasBrokenCanNotSendTroopsOut",
	code:731,
	message:"城墙已被攻破,不能出兵"
}
