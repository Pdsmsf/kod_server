"use strict"

/**
 * Created by modun on 14-7-22.
 */

var _ = require("underscore")
var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema

var Consts = require("../consts/consts")
var GameDatas = require("../datas/GameDatas")
var AllianceBuilding = GameDatas.AllianceBuilding

var createActivitySchema = function(type){
	var schema = {
		type:{type:String, required:true, default:type},
		score:{type:Number, required:true, default:0},
		finishTime:{type:Number, required:true, default:0}
	};
	return schema;
};

var AllianceSchema = new Schema({
	_id:{type:String, required:true},
	serverId:{type:String, required:true, index:true},
	lastActiveTime:{type:Number, required:true, default:Date.now, index:true},
	mapIndex:{type:Number, required:true},
	basicInfo:{
		name:{type:String, required:true, index:true},
		tag:{type:String, required:true, index:true},
		country:{type:String, required:true},
		terrain:{type:String, required:true},
		terrainStyle:{type:Number, required:true},
		flag:{type:String, required:true},
		power:{type:Number, required:true, default:0, index:true},
		kill:{type:Number, required:true, default:0, index:true},
		joinType:{type:String, required:true, default:Consts.AllianceJoinType.All, index:true},
		honour:{type:Number, required:true, default:0},
		perception:{type:Number, required:true, default:AllianceBuilding.shrine[1].perception},
		perceptionRefreshTime:{type:Number, required:true, default:Date.now},
		createTime:{type:Number, required:true, default:Date.now},
		status:{type:String, required:true, default:Consts.AllianceStatus.Peace, index:true},
		statusStartTime:{type:Number, required:true, default:Date.now},
		statusFinishTime:{type:Number, required:true, default:0},
		monsterRefreshTime:{type:Number, required:true, default:0},
		villageRefreshTime:{type:Number, required:true, default:0},
		allianceMoveTime:{type:Number, required:true, default:0}
	},
	countInfo:{
		kill:{type:Number, required:true, default:0},
		beKilled:{type:Number, required:true, default:0},
		routCount:{type:Number, required:true, default:0},
		winCount:{type:Number, required:true, default:0},
		failedCount:{type:Number, required:true, default:0}
	},
	notice:{type:String, required:false},
	desc:{type:String, required:false},
	events:[{
		_id:false,
		category:{type:String, required:true},
		type:{type:String, required:true},
		time:{type:Number, required:true},
		key:{type:String, required:true},
		params:[String]
	}],
	members:[{
		_id:false,
		id:{type:String, required:true},
		mapId:{type:String, required:true},
		pushId:{type:String},
		language:{type:String, required:true},
		name:{type:String, required:true},
		icon:{type:String, required:true},
		terrain:{type:String, required:true},
		levelExp:{type:Number, required:true},
		keepLevel:{type:Number, required:true},
		status:{type:String, required:true},
		power:{type:Number, required:true},
		kill:{type:Number, required:true},
		loyalty:{type:Number, required:true},
		lastLogoutTime:{type:Number, required:true},
		lastBeAttackedTime:{type:Number, required:true},
		title:{type:String, required:true},
		beHelped:{type:Boolean, required:true},
		protectStartTime:{type:Number, required:true, default:0},
		newbeeProtectFinishTime:{type:Number, required:true, default:0},
		joinAllianceTime:{type:Number, required:true, default:Date.now},
		helpDefenceDisableFinishTime:{type:Number, required:true, default:0},
		lastThreeDaysKillData:[{
			_id:false,
			kill:{type:Number, rquired:true},
			date:{type:String, required:true}
		}],
		lastThreeDaysDonateData:[{
			_id:false,
			kill:{type:Number, rquired:true},
			date:{type:String, required:true}
		}],
		lastGvGKillData:[{
			_id:false,
			kill:{type:Number, rquired:true},
			date:{type:String, required:true}
		}],
		lastRewardData:{
			type:{
				count:{type:Number, required:true},
				time:{type:Number, required:true}
			},
			required:false
		},
		pushStatus:{
			onAllianceFightPrepare:{type:Boolean, required:true, default:true},
			onAllianceFightStart:{type:Boolean, required:true, default:true},
			onAllianceShrineEventStart:{type:Boolean, required:true, default:true},
			onCityBeAttacked:{type:Boolean, required:true, default:true}
		}
	}],
	buildings:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		level:{type:Number, required:true}
	}],
	villageLevels:{
		woodVillage:{type:Number, required:true, default:1},
		stoneVillage:{type:Number, required:true, default:1},
		ironVillage:{type:Number, required:true, default:1},
		foodVillage:{type:Number, required:true, default:1},
		coinVillage:{type:Number, required:true, default:1}
	},
	villages:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		level:{type:Number, required:true},
		resource:{type:Number, required:true},
		villageEvent:{
			type:{
				eventId:{type:String, required:true},
				allianceId:{type:String, required:true}
			},
			required:false
		}
	}],
	monsters:[{
		_id:false,
		id:{type:String, required:true},
		level:{type:Number, required:true},
		index:{type:Number, required:true}
	}],
	mapObjects:[{
		_id:false,
		id:{type:String, require:true},
		name:{type:String, required:true},
		location:{
			x:{type:Number, required:true},
			y:{type:Number, required:true}
		}
	}],
	joinRequestEvents:[{
		_id:false,
		id:{type:String, required:true},
		name:{type:String, required:true},
		icon:{type:String, required:true},
		levelExp:{type:Number, required:true},
		power:{type:Number, required:true},
		requestTime:{type:Number, required:true}
	}],
	helpEvents:[{
		_id:false,
		id:{type:String, required:true},
		playerData:{
			id:{type:String, require:true},
			name:{type:String, required:true},
			vipExp:{type:Number, required:true}
		},
		eventData:{
			id:{type:String, required:true},
			type:{type:String, required:true},
			name:{type:String, required:true},
			level:{type:Number, required:true},
			maxHelpCount:{type:Number, required:true},
			helpedMembers:[String]
		}
	}],
	shrineDatas:[{
		_id:false,
		stageName:{type:String, required:true}
	}],
	shrineEvents:[{
		_id:false,
		id:{type:String, require:true},
		stageName:{type:String, required:true},
		createTime:{type:Number, required:true},
		startTime:{type:Number, required:true},
		playerTroops:[{
			_id:false,
			id:{type:String, required:true},
			name:{type:String, required:true},
			location:{
				x:{type:Number, required:true},
				y:{type:Number, required:true}
			},
			dragon:{
				type:{type:String, required:true}
			},
			soldiers:[
				{
					_id:false,
					name:{type:String, required:true},
					count:{type:Number, required:true}
				}
			]
		}]
	}],
	shrineReports:[{
		_id:false,
		id:{type:String, required:true},
		stageName:{type:String, required:true},
		isWin:{type:Boolean, required:true},
		time:{type:Number, required:true},
		playerCount:{type:Number, required:true},
		playerDatas:[{
			_id:false,
			id:{type:String, required:true},
			name:{type:String, required:true},
			icon:{type:Number, required:true},
			kill:{type:Number, required:true},
			rewards:[{
				_id:false,
				type:{type:String, required:true},
				name:{type:String, required:true},
				count:{type:Number, required:true}
			}],
			fightResult:{type:String, required:true}
		}]
	}],
	villageEvents:[{
		_id:false,
		id:{type:String, required:true},
		startTime:{type:Number, required:true},
		finishTime:{type:Number, required:true},
		fromAlliance:{
			id:{type:String, required:true},
			name:{type:String, required:true},
			tag:{type:String, required:true},
			location:{
				x:{type:Number, required:true},
				y:{type:Number, required:true}
			},
			mapIndex:{type:Number, required:true}
		},
		toAlliance:{
			id:{type:String, required:true},
			name:{type:String, required:true},
			tag:{type:String, required:true},
			location:{
				x:{type:Number, required:true},
				y:{type:Number, required:true}
			},
			mapIndex:{type:Number, required:true}
		},
		playerData:{
			id:{type:String, required:true},
			name:{type:String, required:true},
			dragon:{
				type:{type:String, required:true}
			},
			soldiers:[{
				_id:false,
				name:{type:String, required:true},
				count:{type:Number, required:true}
			}],
			woundedSoldiers:[{
				_id:false,
				name:{type:String, required:true},
				count:{type:Number, required:true}
			}],
			rewards:[{
				_id:false,
				type:{type:String, required:true},
				name:{type:String, required:true},
				count:{type:Number, required:true}
			}]
		},
		villageData:{
			id:{type:String, required:true},
			name:{type:String, required:true},
			level:{type:Number, required:true},
			collectTotal:{type:Number, required:true}
		}
	}],
	allianceFight:{
		type:{
			attacker:{
				alliance:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					tag:{type:String, required:true},
					flag:{type:String, required:true},
					mapIndex:{type:Number, required:true},
					memberCount:{type:Number, required:true}
				},
				playerKills:[{
					id:{type:Number, required:true},
					name:{type:String, required:true},
					kill:{type:Number, required:true}
				}],
				allianceCountData:{
					kill:{type:Number, required:true},
					routCount:{type:Number, required:true},
					strikeCount:{type:Number, required:true},
					strikeSuccessCount:{type:Number, required:true},
					attackCount:{type:Number, required:true},
					attackSuccessCount:{type:Number, required:true}
				}
			},
			defencer:{
				alliance:{
					id:{type:String, required:true},
					name:{type:String, required:true},
					tag:{type:String, required:true},
					flag:{type:String, required:true},
					mapIndex:{type:Number, required:true},
					memberCount:{type:Number, required:true}
				},
				playerKills:[{
					id:{type:Number, required:true},
					name:{type:String, required:true},
					kill:{type:Number, required:true}
				}],
				allianceCountData:{
					kill:{type:Number, required:true},
					routCount:{type:Number, required:true},
					strikeCount:{type:Number, required:true},
					strikeSuccessCount:{type:Number, required:true},
					attackCount:{type:Number, required:true},
					attackSuccessCount:{type:Number, required:true}
				}
			}
		},
		required:false
	},
	allianceFightReports:[{
		_id:false,
		id:{type:String, required:true},
		attackAllianceId:{type:String, required:true},
		defenceAllianceId:{type:String, required:true},
		fightResult:{type:String, required:true},
		fightTime:{type:Number, required:true},
		killMax:{
			allianceId:{type:String, required:true},
			playerId:{type:String, required:true},
			playerName:{type:String, required:true}
		},
		attackAlliance:{
			name:{type:String, required:true},
			tag:{type:String, required:true},
			flag:{type:String, required:true},
			mapIndex:{type:Number, required:true},
			memberCount:{type:Number, required:true},
			kill:{type:Number, required:true},
			honour:{type:Number, required:true},
			routCount:{type:Number, required:true},
			strikeCount:{type:Number, required:true},
			strikeSuccessCount:{type:Number, required:true},
			attackCount:{type:Number, required:true},
			attackSuccessCount:{type:Number, required:true}
		},
		defenceAlliance:{
			name:{type:String, required:true},
			tag:{type:String, required:true},
			flag:{type:String, required:true},
			mapIndex:{type:Number, required:true},
			memberCount:{type:Number, required:true},
			kill:{type:Number, required:true},
			honour:{type:Number, required:true},
			routCount:{type:Number, required:true},
			strikeCount:{type:Number, required:true},
			strikeSuccessCount:{type:Number, required:true},
			attackCount:{type:Number, required:true},
			attackSuccessCount:{type:Number, required:true}
		},
		playerDatas:[{
			_id:false,
			id:{type:String, required:true},
			name:{type:String, required:true},
			kill:{type:Number, required:true},
			loyalty:{type:Number, required:true}
		}]
	}],
	marchEvents:{
		strikeMarchEvents:[{
			_id:false,
			id:{type:String, required:true},
			marchType:{type:String, required:true},
			startTime:{type:Number, required:true},
			arriveTime:{type:Number, required:true},
			fromAlliance:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				tag:{type:String, required:true},
				location:{
					x:{type:Number, required:true},
					y:{type:Number, required:true}
				},
				mapIndex:{type:Number, required:true}
			},
			toAlliance:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				tag:{type:String, required:true},
				location:{
					x:{type:Number, required:true},
					y:{type:Number, required:true}
				},
				mapIndex:{type:Number, required:true}
			},
			attackPlayerData:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				dragon:{
					type:{type:String, required:true}
				}
			},
			defencePlayerData:{
				id:{type:String, required:true},
				name:{type:String, required:true}
			},
			defenceVillageData:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				level:{type:String, required:true}
			}
		}],
		strikeMarchReturnEvents:[{
			_id:false,
			id:{type:String, required:true},
			marchType:{type:String, required:true},
			startTime:{type:Number, required:true},
			arriveTime:{type:Number, required:true},
			fromAlliance:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				tag:{type:String, required:true},
				location:{
					x:{type:Number, required:true},
					y:{type:Number, required:true}
				},
				mapIndex:{type:Number, required:true}
			},
			toAlliance:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				tag:{type:String, required:true},
				location:{
					x:{type:Number, required:true},
					y:{type:Number, required:true}
				},
				mapIndex:{type:Number, required:true}
			},
			attackPlayerData:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				dragon:{
					type:{type:String, required:true}
				}
			},
			defencePlayerData:{
				id:{type:String, required:true},
				name:{type:String, required:true}
			},
			defenceVillageData:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				level:{type:String, required:true}
			}
		}],
		attackMarchEvents:[{
			_id:false,
			id:{type:String, required:true},
			marchType:{type:String, required:true},
			startTime:{type:Number, required:true},
			arriveTime:{type:Number, required:true},
			fromAlliance:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				tag:{type:String, required:true},
				location:{
					x:{type:Number, required:true},
					y:{type:Number, required:true}
				},
				mapIndex:{type:Number, required:true}
			},
			toAlliance:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				tag:{type:String, required:true},
				location:{
					x:{type:Number, required:true},
					y:{type:Number, required:true}
				},
				mapIndex:{type:Number, required:true}
			},
			attackPlayerData:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				dragon:{
					type:{type:String, required:true}
				},
				soldiers:[{
					_id:false,
					name:{type:String, required:true},
					star:{type:Number, required:true},
					count:{type:Number, required:true}
				}]
			},
			defencePlayerData:{
				id:{type:String, required:true},
				name:{type:String, required:true}
			},
			defenceVillageData:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				level:{type:Number, required:true}
			},
			defenceMonsterData:{
				id:{type:String, required:true},
				level:{type:Number, required:true},
				index:{type:Number, required:true}
			},
			defenceShrineData:{
				shrineEventId:{type:String, required:true}
			}
		}],
		attackMarchReturnEvents:[{
			_id:false,
			id:{type:String, required:true},
			marchType:{type:String, required:true},
			startTime:{type:Number, required:true},
			arriveTime:{type:Number, required:true},
			fromAlliance:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				tag:{type:String, required:true},
				location:{
					x:{type:Number, required:true},
					y:{type:Number, required:true}
				},
				mapIndex:{type:Number, required:true}
			},
			toAlliance:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				tag:{type:String, required:true},
				location:{
					x:{type:Number, required:true},
					y:{type:Number, required:true}
				},
				mapIndex:{type:Number, required:true}
			},
			attackPlayerData:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				dragon:{
					type:{type:String, required:true}
				},
				soldiers:[{
					_id:false,
					name:{type:String, required:true},
					star:{type:Number, required:true},
					count:{type:Number, required:true}
				}],
				woundedSoldiers:[{
					_id:false,
					name:{type:String, required:true},
					count:{type:Number, required:true}
				}],
				rewards:[{
					_id:false,
					type:{type:String, required:true},
					name:{type:String, required:true},
					count:{type:Number, required:true}
				}]
			},
			defencePlayerData:{
				id:{type:String, required:true},
				name:{type:String, required:true}
			},
			defenceVillageData:{
				id:{type:String, required:true},
				name:{type:String, required:true},
				level:{type:String, required:true}
			},
			defenceMonsterData:{
				id:{type:String, required:true},
				level:{type:String, required:true},
				index:{type:Number, required:true}
			}
		}]
	},
	items:[{
		_id:false,
		name:{type:String, required:true},
		count:{type:Number, required:true}
	}],
	itemLogs:[{
		_id:false,
		type:{type:String, required:true},
		playerName:{type:String, required:true},
		itemName:{type:String, required:true},
		itemCount:{type:Number, required:true},
		time:{type:Number, required:true}
	}],
	prestige:{
		score:{type:Number, required:true, default:0},
		startTime:{type:Number, required:true, default:0}
	},
	activities:{
		gacha:createActivitySchema('gacha'),
		collectResource:createActivitySchema('collectResource'),
		pveFight:createActivitySchema('pveFight'),
		attackMonster:createActivitySchema('attackMonster'),
		collectHeroBlood:createActivitySchema('collectHeroBlood'),
		recruitSoldiers:createActivitySchema('recruitSoldiers')
	}
});

module.exports = mongoose.model('alliance', AllianceSchema)