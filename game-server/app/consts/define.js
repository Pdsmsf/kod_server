"use strict"

/**
 * Created by modun on 14-9-23.
 */

module.exports = {
	RequestJoinAllianceMessageMaxSize:5,//申请加入联盟消息申请最大数量
	InviteJoinAllianceMessageMaxSize:5,//邀请加入联盟消息最大数量
	PlayerMailsMaxSize:100,//玩家收件箱最大邮件数量
	PlayerSendMailsMaxSize:20,//玩家发件箱最大邮件数量,
	PlayerReportsMaxSize:100,//玩家战报最大数量
	PlayerMaxReturnMailSize:10,//单次请求返回的最大邮件数量
	PlayerMaxReturnReportSize:10,//单次请求返回的最大战报数量
	PlayerMaxReturnRankListSize:20,//单次请求返回的最大排名数量,
	PlayerIapGiftsMaxSize:20,//联盟玩家赠送的充值礼品最大数量
	SellItemsMaxSize:30,//
	MaxChatCount:50,//最大全服聊天数量
	MaxAllianceChatCount:50,//最大联盟聊天数量
	MaxAllianceFightChatCount:50,//最大对战聊天数量
	AllianceEventsMaxSize:20,//联盟事件最大数量
	AllianceRequestMessageMaxSize:50,//联盟中的入盟申请信息最大数量,
	AllianceShrineReportsMaxSize:10,//圣地事件报告最大数量
	AllianceFightReportsMaxSize:20,//联盟战日志
	AllianceItemLogsMaxSize:20,//联盟商店商品日志,
	ServerNoticeMaxSize:10,//服务器公告最大数量
	InputLength:{
		PlayerName:12,//玩家昵称长度
		CityName:12,//玩家城市名称长度
		DragonSkillKey:7,//龙技能Key长度
		AllianceName:20,//联盟名称长度
		AllianceTag:3,//联盟标签长度
		AllianceFlag:50,//联盟Flag长度
		MailTitle:140,//邮件标题长度
		MailContent:1000,//邮件正文长度
		Chat:140,//聊天内容长度
		AllianceNotice:600,//联盟公告长度
		AllianceDesc:600,//联盟描述长度,
		AllianceTitleName:20//联盟自定义职位名称长度
	}
}