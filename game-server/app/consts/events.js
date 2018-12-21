"use strict"

/**
 * Created by modun on 14-8-7.
 */

module.exports = {
	player:{
		onPlayerDataChanged:"onPlayerDataChanged",
		onJoinAllianceSuccess:"onJoinAllianceSuccess",
		onServerNoticeChanged:"onServerNoticeChanged",
		onGameInfoChanged:"onGameInfoChanged"
	},
	alliance:{
		onAllianceDataChanged:"onAllianceDataChanged",
		onMapDataChanged:'onMapDataChanged'
	},
	chat:{
		onChat:"onChat",
		onAllChat:"onAllChat",
		onNotice:'onNotice',
		onAllianceNotice:'onAllianceNotice',
		onSysChat:'onSysChat'
	}
}