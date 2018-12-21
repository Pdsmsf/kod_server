"use strict";

/**
 * Created by modun on 15/11/8.
 */

var Promise = require("bluebird");
var mongoose = require("mongoose");
mongoose.Promise = Promise;
var _ = require("underscore");

var DataUtils = require("../game-server/app/utils/dataUtils");
var LogicUtils = require("../game-server/app/utils/logicUtils");
var MapUtils = require("../game-server/app/utils/mapUtils");
var TaskUtils = require("../game-server/app/utils/taskUtils");
var CommonUtils = require("../game-server/app/utils/utils");
var Consts = require("../game-server/app/consts/consts");

var Config = require("./config");
var Player = Promise.promisifyAll(require("../game-server/app/domains/player"));
var Alliance = Promise.promisifyAll(require("../game-server/app/domains/alliance"));
var Billing = Promise.promisifyAll(require("../game-server/app/domains/billing"));
var ServerState = Promise.promisifyAll(require("../game-server/app/domains/serverState"));
var Deal = Promise.promisifyAll(require("../game-server/app/domains/deal"));
var GemChange = Promise.promisifyAll(require("../game-server/app/domains/gemChange"));

var GameDatas = require('../game-server/app/datas/GameDatas.js');
var PlayerInitData = GameDatas.PlayerInitData;
var ScheduleActivities = GameDatas.ScheduleActivities;

var fixPlayerGrowupTasks = function(){
	return new Promise(function(resolve){
		var cursor = Player.collection.find();
		(function updatePlayer(){
			cursor.next(function(e, doc){
				if(!doc){
					console.log('update player done!');
					return resolve();
				}

				doc.growUpTasks.dragonSkill = [];
				_.each(doc.dragons, function(dragon){
					_.each(dragon.skills, function(skill){
						for(var i = 2; i <= skill.level; i++){
							TaskUtils.finishDragonSkillTaskIfNeed(doc, [], dragon.type, skill.name, i);
						}
					})
				})

				doc.growUpTasks.cityBuild = [];
				_.each(doc.buildings, function(building){
					TaskUtils.finishCityBuildTaskIfNeed(doc, [], building.type, building.level);
					var hasBuildEvent = _.some(doc.buildingEvents, function(event){
						return event.location === building.location;
					})
					if(hasBuildEvent) TaskUtils.finishCityBuildTaskIfNeed(doc, [], building.type, building.level + 1);
					_.each(building.houses, function(house){
						TaskUtils.finishCityBuildTaskIfNeed(doc, [], house.type, house.level);
						var hasHouseEvent = _.some(doc.houseEvents, function(event){
							return event.buildingLocation === building.location && event.houseLocation === house.location;
						})
						if(hasHouseEvent) TaskUtils.finishCityBuildTaskIfNeed(doc, [], house.type, house.level + 1);
					})
				})

				doc.growUpTasks.productionTech = [];
				_.each(doc.productionTechs, function(tech, name){
					for(var i = 1; i <= tech.level; i++){
						TaskUtils.finishProductionTechTaskIfNeed(doc, [], name, i);
					}
					var hasTechEvent = _.some(doc.productionTechEvents, function(event){
						return event.name === name;
					})
					if(hasTechEvent) TaskUtils.finishProductionTechTaskIfNeed(doc, [], name, tech.level + 1);
				})

				doc.growUpTasks.pveCount = [];
				TaskUtils.finishPveCountTaskIfNeed(doc, []);

				doc.growUpTasks.soldierCount = [];
				_.each(doc.soldiers, function(count, name){
					TaskUtils.finishSoldierCountTaskIfNeed(doc, [], name);
				})

				Player.collection.save(doc, function(e){
					if(!!e) console.log(e);
					else console.log('player ' + doc._id + ' update success!');
					updatePlayer();
				})
			})
		})();
	})
};

var fixPlayerActivities = function(){
	return Promise.fromCallback(function(callback){
		var cursor = Player.collection.find({'activities.collectHeroBlood':{$exists:true}});
		(function updatePlayer(){
			cursor.next(function(e, doc){
				if(!doc){
					console.log('fix player done!');
					return callback();
				}
				doc.activities.collectHeroBlood.scoreRewardedIndex = 0;
				doc.activities.collectHeroBlood.rankRewardsGeted = false;
				Promise.fromCallback(function(callback){
					Player.collection.save(doc, callback);
				}).then(function(){
					console.log('player ' + doc._id + ' fix success!');
					updatePlayer();
				}).catch(function(e){
					console.log(e);
				});
			});
		})();
	});
};

var fixPlayerData = function(){
	var serverState = null;
	return Promise.fromCallback(function(callback){
		ServerState.collection.find().toArray(callback);
	}).then(function(docs){
		serverState = docs[0];
	}).then(function(){
		return Promise.fromCallback(function(callback){
			//var cursor = Player.collection.find({serverId:'cache-server-2'});
			var cursor = Player.collection.find({});
			(function updatePlayer(){
				cursor.next(function(e, doc){
					if(!doc){
						console.log('fix player done!');
						return callback();
					}

					doc.defenceTroop = null;
					_.each(doc.troopsOut, function(troop){
						LogicUtils.addPlayerSoldiers(doc, [], troop.soldiers);
						doc.dragons[troop.dragonType].status = 'free';
					});
					doc.troopsOut = [];

					_.each(doc.deals, function(deal){
						if(deal.isSold){
							var totalPrice = deal.itemData.count * deal.itemData.price;
							doc.resources.coin += totalPrice;
						}else{
							var type = deal.itemData.type;
							var name = deal.itemData.name;
							var count = deal.itemData.count;
							var realCount = _.isEqual(type, "resources") ? count * 1000 : count;
							doc[type][name] += Number(realCount);
						}
					});
					doc.deals = [];

					//doc.reports = [];
					//
					//_.each(doc.activities, function(value, key){
					//	delete value.lastActive;
					//	var serverActivity = _.find(serverState.activities.on, function(_serverActivity){
					//		return _serverActivity.type === key;
					//	});
					//	if(!!serverActivity){
					//		value.finishTime = serverActivity.finishTime;
					//		return;
					//	}
					//	serverActivity = _.find(serverState.activities.expired, function(_serverActivity){
					//		return _serverActivity.type === key;
					//	});
					//	if(!!serverActivity){
					//		value.finishTime = serverActivity.removeTime - (ScheduleActivities.type[key].expireHours * 60 * 60 * 1000);
					//		return;
					//	}
					//	value.finishTime = 0;
					//});
					//doc.sendMails = [];
					//var mailsToRemove = [];
					//_.each(doc.mails, function(mail){
					//	if(mail.fromIcon === -1 || mail.fromIcon === '-1'){
					//		mailsToRemove.push(mail);
					//	}
					//});
					//LogicUtils.removeItemsInArray(doc.mails, mailsToRemove);

					//_.each(doc.mails, function(mail){
					//	mail.toIcon = 0;
					//});

					Promise.fromCallback(function(callback){
						Player.collection.save(doc, callback);
					}).then(function(){
						console.log('player ' + doc._id + ' fix success!');
						updatePlayer();
					}).catch(function(e){
						console.log(e);
					});
				});
			})();
		});
	}).then(function(){
		//return Deal.removeAsync({serverId:'cache-server-2'});
		return Deal.removeAsync({});
	});
};

var fixAllianceData = function(){
	return Promise.fromCallback(function(callback){
		//var cursor = Alliance.collection.find({serverId:'cache-server-2'});
		var cursor = Alliance.collection.find({});
		(function updateAlliance(){
			cursor.next(function(e, doc){
				if(!doc){
					console.log('fix alliance done!');
					return callback();
				}

				if(doc.basicInfo.status === 'fight'){
					var allianceFight = doc.allianceFight;
					var allianceFightInitHonour = DataUtils.getAllianceIntInit('allianceFightRewardHonour');
					var attackAllianceKill = allianceFight.attacker.allianceCountData.kill;
					var defenceAllianceKill = allianceFight.defencer.allianceCountData.kill;
					var allianceFightResult = attackAllianceKill >= defenceAllianceKill ? Consts.FightResult.AttackWin : Consts.FightResult.DefenceWin;
					var allianceFightHonourTotal = allianceFightInitHonour + ((attackAllianceKill + defenceAllianceKill) * 2);
					var attackAllianceHonourGetPercent = _.isEqual(allianceFightResult, Consts.FightResult.AttackWin) ? 0.7 : 0.3;
					var attackAllianceHonourGet = Math.floor(allianceFightHonourTotal * attackAllianceHonourGetPercent);
					var defenceAllianceHonourGet = allianceFightHonourTotal - attackAllianceHonourGet;
					if(doc._id === allianceFight.attacker.alliance.id){
						doc.basicInfo.honour += attackAllianceHonourGet;
					}else{
						doc.basicInfo.honour += defenceAllianceHonourGet;
					}
				}
				doc.basicInfo.status = 'peace';
				doc.basicInfo.statusStartTime = Date.now();
				doc.basicInfo.statusFinishTime = 0;
				doc.allianceFight = null;

				//_.each(doc.members, function(member){
				//	member.protectStartTime = 0;
				//});

				//doc.shrineReports = [];
				//doc.allianceFightReports = [];
				//doc.events = [];

				//Promise.fromCallback(function(callback){
				//	Alliance.collection.save(doc, callback);
				//}).then(function(){
				//	console.log('alliance ' + doc._id + ' fix success!');
				//	updateAlliance();
				//}).catch(function(e){
				//	console.log(e);
				//});

				//Promise.fromCallback(function(_callback){
				//	var members = CommonUtils.clone(doc.members);
				//	(function fixNewbeeProtectEvent(){
				//		if(members.length === 0){
				//			return _callback();
				//		}
				//		var member = members.pop();
				//		if(member.newbeeProtectFinishTime <= Date.now()){
				//			return fixNewbeeProtectEvent();
				//		}
				//
				//		return Promise.fromCallback(function(__callback){
				//			Player.collection.findOne({_id:member.id}, __callback);
				//		}).then(function(_doc){
				//			var newbeeProtectItemEvent = LogicUtils.getPlayerNewbeeProtectItemEvent(_doc);
				//			if(!newbeeProtectItemEvent){
				//				var memberInDoc = LogicUtils.getObjectById(doc.members, member.id);
				//				memberInDoc.newbeeProtectFinishTime = 0;
				//			}
				//		}).then(function(){
				//			fixNewbeeProtectEvent();
				//		}).catch(function(e){
				//			_callback(e);
				//		});
				//	})();
				//}).then(function(){
				//	return Promise.fromCallback(function(callback){
				//		Alliance.collection.save(doc, callback);
				//	});
				//}).then(function(){
				//	console.log('alliance ' + doc._id + ' fix success!');
				//	updateAlliance();
				//}).catch(function(e){
				//	console.log(e);
				//});

				_.each(doc.villages, function(village){
					village.villageEvent = null;
				});
				doc.shrineEvents = [];
				doc.marchEvents.strikeMarchEvents = [];
				doc.marchEvents.strikeMarchReturnEvents = [];
				doc.marchEvents.attackMarchEvents = [];
				Promise.fromCallback(function(callback){
					(function returnVillageResource(){
						if(doc.villageEvents.length === 0){
							return callback();
						}
						var villageEvent = doc.villageEvents.pop();
						var playerId = villageEvent.playerData.id;
						var resourceName = villageEvent.villageData.name.slice(0, -7);
						var resourceCollected = villageEvent.villageData.collectTotal;
						return Promise.fromCallback(function(_callback){
							Player.collection.findOne({_id:playerId}, _callback);
						}).then(function(_doc){
							_doc.resources[resourceName] += resourceCollected;
							return Promise.fromCallback(function(_callback){
								Player.collection.save(_doc, _callback);
							});
						}).then(function(){
							returnVillageResource();
						}).catch(function(e){
							callback(e);
						});
					})();
				}).then(function(){
					return Promise.fromCallback(function(callback){
						(function returnMarchResource(){
							if(doc.marchEvents.attackMarchReturnEvents.length === 0){
								return callback();
							}
							var marchReturnEvent = doc.marchEvents.attackMarchReturnEvents.pop();
							var playerId = marchReturnEvent.attackPlayerData.id;
							return Promise.fromCallback(function(_callback){
								Player.collection.findOne({_id:playerId}, _callback);
							}).then(function(_doc){
								var rewards = marchReturnEvent.attackPlayerData.rewards;
								_.each(rewards, function(reward){
									var type = reward.type;
									var name = reward.name;
									var count = reward.count;
									if(_.contains(Consts.MaterialDepotTypes, type)){
										LogicUtils.addPlayerMaterials(_doc, [], type, [{name:name, count:count}], false);
									}else{
										_doc[type][name] += count;
									}
								});
								return Promise.fromCallback(function(_callback){
									Player.collection.save(_doc, _callback);
								});
							}).then(function(){
								returnMarchResource();
							}).catch(function(e){
								callback(e);
							});
						})();
					});
				}).then(function(){
					return Promise.fromCallback(function(callback){
						Alliance.collection.save(doc, callback);
					});
				}).then(function(){
					console.log('alliance ' + doc._id + ' fix success!');
					updateAlliance();
				}).catch(function(e){
					console.log(e);
				});
			});
		})();
	});
};

var printPlayerBuildingAndTechPower = function(){
	var powers = [];
	return Promise.fromCallback(function(callback){
		var cursor = Player.collection.find({}, {
			"buildings":true,
			"productionTechs":true,
			"militaryTechs":true
		}).sort({'basicInfo.power':-1}).limit(400);
		(function printPlayer(){
			cursor.next(function(e, doc){
				if(!doc){
					powers = _.sortBy(powers, function(power){
						return -power;
					});
					_.each(powers, function(power){
						console.log(power);
					});
					return callback();
				}
				powers.push(DataUtils.getPlayerBuildingAndTechPower(doc));
				printPlayer();
			});
		})();
	});
};

var fixPlayerItems = function(){
	return Promise.fromCallback(function(callback){
		var cursor = Player.collection.find({
			'items':{
				$elemMatch:{
					name:{$regex:'masterOfDefender_', $options:"i"},
					count:{$gt:0}
				}
			}
		});
		(function updatePlayer(){
			cursor.next(function(e, doc){
				if(!doc){
					console.log('fix player done!');
					return callback();
				}
				var masterOfDefender1 = _.find(doc.items, function(item){
					return item.name === 'masterOfDefender_1';
				});
				var masterOfDefender2 = _.find(doc.items, function(item){
					return item.name === 'masterOfDefender_2';
				});
				var masterOfDefender3 = _.find(doc.items, function(item){
					return item.name === 'masterOfDefender_3';
				});
				var masterOfDefender4 = _.find(doc.items, function(item){
					return item.name === 'masterOfDefender_4';
				});
				if(!!masterOfDefender3){
					if(!masterOfDefender4){
						masterOfDefender4 = {
							name:'masterOfDefender_4',
							count:0
						};
						doc.items.push(masterOfDefender4);
					}
					masterOfDefender4.count += masterOfDefender3.count;
					LogicUtils.removeItemInArray(doc.items, masterOfDefender3);
					masterOfDefender3 = undefined;
				}
				if(!!masterOfDefender2){
					if(!masterOfDefender3){
						masterOfDefender3 = {
							name:'masterOfDefender_3',
							count:0
						};
						doc.items.push(masterOfDefender3);
					}
					masterOfDefender3.count += masterOfDefender2.count;
					LogicUtils.removeItemInArray(doc.items, masterOfDefender2);
					masterOfDefender2 = undefined;
				}
				if(!!masterOfDefender1){
					if(!masterOfDefender2){
						masterOfDefender2 = {
							name:'masterOfDefender_2',
							count:0
						};
						doc.items.push(masterOfDefender2);
					}
					masterOfDefender2.count += masterOfDefender1.count;
					LogicUtils.removeItemInArray(doc.items, masterOfDefender1);
					masterOfDefender1 = undefined;
				}

				console.log(masterOfDefender1, masterOfDefender2, masterOfDefender3)

				Promise.fromCallback(function(callback){
					Player.collection.save(doc, callback);
				}).then(function(){
					console.log('player ' + doc._id + ' fix success!');
					updatePlayer();
				}).catch(function(e){
					console.log(e);
				});
			});
		})();
	});
};

var dbLocal = 'mongodb://127.0.0.1:27017/dragonfall-local-ios';
var dbDevIos = 'mongodb://modun:Zxm75504109@114.55.60.126:27017/dragonfall-develop-ios?authSource=admin';
var dbDevWp = 'mongodb://modun:Zxm75504109@114.55.60.126:27017/dragonfall-develop-wp?authSource=admin';
var dbBatcatIos = 'mongodb://modun:Zxm75504109@47.88.35.31:27017/dragonfall-batcat-ios?authSource=admin';
var dbScmobileWp = 'mongodb://modun:Zxm75504109@47.88.35.31:27017/dragonfall-scmobile-wp?authSource=admin';

mongoose.connect(dbBatcatIos, function(){
	fixPlayerData().then(function(){
		return fixAllianceData();
	}).then(function(){
		mongoose.disconnect();
	});

	//fixPlayerData().then(function(){
	//	mongoose.disconnect();
	//});

	//fixAllianceData().then(function(){
	//	mongoose.disconnect();
	//});
});

//mongoose.connect(dbScmobileWp, function(){
//	Player.aggregateAsync([
//		{$project:{'countInfo.loginCount':1, 'countInfo.registerTime':1, 'countInfo.lastLogoutTime':1, activeTime:{$subtract:['$countInfo.lastLogoutTime', '$countInfo.registerTime']}}},
//		{$match:{
//			'countInfo.lastLogoutTime':{$lt:Date.now() - (24 * 60 * 60 * 1000)},
//			'countInfo.loginCount':{$gt:30},
//			'countInfo.registerTime':{$lt:Date.now() - 30 * 24 * 60 * 60 * 1000},
//			$and:[{activeTime:{$gt:30 * 24 * 60 * 60 * 1000}}, {activeTime:{$lt:70 * 24 * 60 * 60 * 1000}}]}
//		},
//		{$sort:{'countInfo.loginCount':-1}}
//	]).then(function(docs){
//		console.log(docs);
//		mongoose.disconnect();
//	}).catch(function(e){
//		console.error(e);
//	});
//});