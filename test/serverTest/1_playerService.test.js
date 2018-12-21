///**
// * Created by modun on 14-7-25.
// */
//
//var Promise = require("bluebird")
//var pomelo = require("../pomelo-client")
//var mongoose = require("mongoose")
//var should = require('should')
//var _ = require("underscore")
//
//var Consts = require("../../game-server/app/consts/consts")
//var Config = require("../config")
//var Device = Promise.promisifyAll(require("../../game-server/app/domains/device"))
//var Player = Promise.promisifyAll(require("../../game-server/app/domains/player"))
//var Alliance = Promise.promisifyAll(require("../../game-server/app/domains/alliance"))
//var Billing = Promise.promisifyAll(require("../../game-server/app/domains/billing"))
//var Deal = Promise.promisifyAll(require("../../game-server/app/domains/deal"))
//var Api = require("../api")
//
//var GameDatas = require("../../game-server/app/datas/GameDatas")
//var Errors = GameDatas.Errors.errors
//
//describe("PlayerService", function(){
//	var m_user
//
//	before(function(done){
//		mongoose.connect(Config.mongoAddr, function(){
//			Device.removeAsync().then(function(){
//				return Player.removeAsync()
//			}).then(function(){
//				return Alliance.removeAsync()
//			}).then(function(){
//				return Billing.removeAsync()
//			}).then(function(){
//				return Deal.removeAsync()
//			}).then(function(){
//				done()
//			})
//		})
//	})
//
//
//	describe("entryHandler", function(){
//		it("login", function(done){
//			var tryTimes = 1;
//			var currentTime = 0;
//			(function login(){
//				currentTime++;
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					m_user = doc.playerData
//					if(currentTime < tryTimes) return login();
//					done();
//				})
//			})();
//		})
//	})
//
//
//	describe("playerHandler", function(){
//		//it('modSend 发送墨子聊天', function(done){
//		//	Api.modSend('哈哈哈哈哈哈哈', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it('getMyModData 获取我的墨子信息', function(done){
//		//	Api.getMyModData(function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it('mutePlayer 禁止某人聊天', function(done){
//		//	Api.mutePlayer('By1t8xhV', 30, '骂脏话', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it('getMutedPlayerList 获取玩家屏蔽列表', function(done){
//		//	Api.getMutedPlayerList(function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it('unMutePlayer 禁止某人聊天', function(done){
//		//	Api.unMutePlayer('By1t8xhV', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//
//		it("initPlayerData 正常初始化", function(done){
//			Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("initPlayerData 玩家数据已经初始化", function(done){
//			Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(doc){
//				doc.code.should.equal(Errors.playerDataAlreadyInited.code)
//				setTimeout(done, 500);
//			})
//		})
//
//		it("getGmChats", function(done){
//			Api.getGmChats(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("sendGmChat", function(done){
//			Api.sendGmChat('hello gm', function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeBuilding 建筑正在升级", function(done){
//			Api.upgradeBuilding(1, false, function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeBuilding(1, false, function(doc){
//					doc.code.should.equal(Errors.buildingUpgradingNow.code)
//					done()
//				})
//			})
//		})
//
//		it("upgradeBuilding 建筑坑位不合法", function(done){
//			Api.upgradeBuilding(17, false, function(doc){
//				doc.code.should.equal(Errors.buildingLocationNotLegal.code)
//				done()
//			})
//		})
//
//		it("upgradeBuilding 建造数量已达建造上限", function(done){
//			Api.upgradeBuilding(9, false, function(doc){
//				doc.code.should.equal(Errors.buildingCountReachUpLimit.code)
//				done()
//			})
//		})
//
//		it("speedup", function(done){
//			Api.sendChat("buildinglevel 1 40", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("buildinglevel 3 39", function(doc){
//					doc.code.should.equal(200)
//					Api.sendChat("resources gem 5000000", function(doc){
//						doc.code.should.equal(200)
//						Api.upgradeBuilding(3, false, function(doc){
//							doc.code.should.equal(200)
//							Api.loginPlayer(Config.deviceId, function(doc){
//								doc.code.should.equal(200)
//								m_user = doc.playerData
//								Api.speedUp("buildingEvents", m_user.buildingEvents[0].id, function(doc){
//									doc.code.should.equal(200)
//									Api.freeSpeedUp("buildingEvents", m_user.buildingEvents[0].id, function(doc){
//										doc.code.should.equal(200)
//										done()
//									})
//								})
//							})
//						})
//					})
//				})
//			})
//		})
//
//
//		it("upgradeBuilding 建筑已达到最高等级", function(done){
//			var func = function(){
//				Api.upgradeBuilding(3, true, function(doc){
//					if(doc.code == 200){
//						func()
//					}else{
//						doc.code.should.equal(Errors.buildingLevelReachUpLimit.code)
//						done()
//					}
//				})
//			}
//			func();
//		})
//
//		it("upgradeBuilding 正常普通升级", function(done){
//			Api.upgradeBuilding(4, false, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("freeSpeedUp 正常免费加速", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				m_user = doc.playerData
//				Api.freeSpeedUp("buildingEvents", m_user.buildingEvents[0].id, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("upgradeBuilding 正常升级立即完成", function(done){
//			setTimeout(function(){
//				Api.upgradeBuilding(4, true, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			}, 100)
//		})
//
//		it("createHouse 主体建筑不存在", function(done){
//			Api.createHouse("dwelling", 20, 1, false, function(doc){
//				doc.code.should.equal(Errors.hostBuildingLevelMustBiggerThanOne.code)
//				done()
//			})
//		})
//
//		it("createHouse 主体建筑必须大于等于1级", function(done){
//			Api.createHouse("dwelling", 9, 1, false, function(doc){
//				doc.code.should.equal(Errors.hostBuildingLevelMustBiggerThanOne.code)
//				done()
//			})
//		})
//
//		it("createHouse 小屋类型不存在", function(done){
//			Api.createHouse("dwellinga", 3, 1, false, function(doc){
//				doc.code.should.equal(Errors.houseTypeNotExist.code)
//				done()
//			})
//		})
//
//		it("createHouse 建筑周围不允许建造小屋", function(done){
//			Api.createHouse("dwelling", 1, 1, false, function(doc){
//				doc.code.should.equal(Errors.buildingNotAllowHouseCreate.code)
//				done()
//			})
//		})
//
//		it("createHouse 创建小屋时,小屋坑位不合法", function(done){
//			Api.createHouse("dwelling", 3, 1, false, function(doc){
//				doc.code.should.equal(200)
//				Api.createHouse("dwelling", 3, 1, false, function(doc){
//					doc.code.should.equal(Errors.houseLocationNotLegal.code)
//					done()
//				})
//			})
//		})
//
//		it("createHouse 正常加速创建", function(done){
//			Api.createHouse("dwelling", 3, 2, true, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("createHouse 正常普通创建", function(done){
//			Api.createHouse("farmer", 3, 3, false, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeHouse 主体建筑必须大于等于1级", function(done){
//			Api.upgradeHouse(9, 1, false, function(doc){
//				doc.code.should.equal(Errors.hostBuildingLevelMustBiggerThanOne.code)
//				done()
//			})
//		})
//
//		it("upgradeHouse 小屋不存在", function(done){
//			Api.upgradeHouse(4, 1, false, function(doc){
//				doc.code.should.equal(Errors.houseNotExist.code)
//				done()
//			})
//		})
//
//		it("upgradeHouse 小屋正在升级", function(done){
//			Api.upgradeHouse(3, 1, false, function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeHouse(3, 1, false, function(doc){
//					doc.code.should.equal(Errors.houseUpgradingNow.code)
//					done()
//				})
//			})
//		})
//
//		it("upgradeHouse 小屋已达到最高等级", function(done){
//			var func = function(){
//				Api.upgradeHouse(3, 2, true, function(doc){
//					if(doc.code == 200){
//						func()
//					}else{
//						doc.code.should.equal(Errors.houseReachMaxLevel.code)
//						done()
//					}
//				})
//			}
//			func()
//		})
//
//		it("upgradeHouse 正常升级1", function(done){
//			Api.upgradeHouse(3, 3, true, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("switchBuilding 正常转换", function(done){
//			Api.sendChat("buildinglevel 10 1", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("buildinglevel 5 1", function(doc){
//					doc.code.should.equal(200)
//					Api.createHouse("quarrier", 5, 1, true, function(doc){
//						doc.code.should.equal(200)
//						Api.upgradeHouse(5, 1, true, function(doc){
//							doc.code.should.equal(200)
//							Api.switchBuilding(10, "stoneMason", function(doc){
//								doc.code.should.equal(200)
//								done()
//							})
//						})
//					})
//				})
//			})
//		})
//
//		it("makeMaterial 工具作坊还未建造", function(done){
//			Api.makeMaterial(Consts.MaterialType.BuildingMaterials, true, function(doc){
//				doc.code.should.equal(Errors.buildingNotBuild.code)
//				done()
//			})
//		})
//
//		it("makeMaterial 同类型的材料正在制造", function(done){
//			Api.sendChat("buildinglevel 16 10", function(doc){
//				doc.code.should.equal(200)
//				Api.makeMaterial(Consts.MaterialType.BuildingMaterials, false, function(doc){
//					doc.code.should.equal(200)
//					Api.makeMaterial(Consts.MaterialType.BuildingMaterials, false, function(doc){
//						doc.code.should.equal(Errors.materialAsSameTypeIsMakeNow.code)
//						done()
//					})
//				})
//			})
//		})
//
//		it("makeMaterial 不同类型的材料正在制造", function(done){
//			Api.makeMaterial(Consts.MaterialType.TechnologyMaterials, false, function(doc){
//				doc.code.should.equal(Errors.materialAsDifferentTypeIsMakeNow.code)
//				done()
//			})
//		})
//
//		it("makeMaterial 同类型的材料制作完成后还未领取", function(done){
//			Api.sendChat("rmevents materialEvents", function(doc){
//				doc.code.should.equal(200)
//				Api.makeMaterial(Consts.MaterialType.TechnologyMaterials, true, function(doc){
//					doc.code.should.equal(200)
//					Api.makeMaterial(Consts.MaterialType.TechnologyMaterials, true, function(doc){
//						doc.code.should.equal(Errors.materialMakeFinishedButNotTakeAway.code)
//						done()
//					})
//				})
//			})
//		})
//
//		it("makeMaterials 正常制造", function(done){
//			Api.sendChat("rmevents materialEvents", function(doc){
//				doc.code.should.equal(200)
//				Api.makeMaterial(Consts.MaterialType.BuildingMaterials, false, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("getMaterials 没有材料建造事件存在", function(done){
//			Api.getMaterials("asdfas", function(doc){
//				doc.code.should.equal(Errors.materialEventNotExistOrIsMakeing.code)
//				done()
//			})
//		})
//
//		it("getMaterials 正常领取", function(done){
//			Api.makeMaterial(Consts.MaterialType.TechnologyMaterials, true, function(doc){
//				doc.code.should.equal(200)
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					m_user = doc.playerData
//					Api.getMaterials(m_user.materialEvents[1].id, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("recruitNormalSoldier soldierName 普通兵种不存在", function(done){
//			Api.recruitNormalSoldier("adf", 12, true, function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("recruitNormalSoldier 招募数量超过单次招募上限", function(done){
//			Api.sendChat("buildinglevel 5 1", function(doc){
//				doc.code.should.equal(200)
//				Api.recruitNormalSoldier("swordsman_1", 50, true, function(doc){
//					doc.code.should.equal(Errors.recruitTooMuchOnce.code)
//					done()
//				})
//			})
//		})
//
//		it("recruitNormalSoldier 正常普通招募", function(done){
//			Api.recruitNormalSoldier("swordsman_1", 5, false, function(doc){
//				doc.code.should.equal(200)
//				Api.recruitNormalSoldier("swordsman_1", 5, false, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("recruitNormalSoldier 正常立即招募", function(done){
//			Api.recruitNormalSoldier("swordsman_1", 5, true, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("recruitSpecialSoldier soldierName 特殊兵种不存在", function(done){
//			Api.recruitSpecialSoldier("adf", 12, false, function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("recruitSpecialSoldier 招募数量超过单次招募上限", function(done){
//			Api.recruitSpecialSoldier("steamTank", 100, false, function(doc){
//				doc.code.should.equal(Errors.recruitTooMuchOnce.code)
//				done()
//			})
//		})
//
//		it("recruitSpecialSoldier 正常普通招募", function(done){
//			Api.sendChat("soldiermaterial 1000", function(doc){
//				doc.code.should.equal(200)
//				Api.recruitSpecialSoldier("skeletonWarrior", 5, false, function(doc){
//					doc.code.should.equal(200)
//					Api.recruitSpecialSoldier("skeletonWarrior", 5, false, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("recruitSpecialSoldier 材料不足", function(done){
//			Api.sendChat("soldiermaterial 0", function(doc){
//				doc.code.should.equal(200)
//				Api.recruitSpecialSoldier("skeletonWarrior", 5, true, function(doc){
//					doc.code.should.equal(Errors.soldierRecruitMaterialsNotEnough.code)
//					Api.sendChat("soldiermaterial 1000", function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("recruitSpecialSoldier 正常立即招募", function(done){
//			Api.recruitSpecialSoldier("skeletonWarrior", 5, true, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("makeDragonEquipment equipmentName 装备不存在", function(done){
//			Api.makeDragonEquipment("adf", true, function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("makeDragonEquipment 材料不足", function(done){
//			Api.sendChat("dragonmaterial 0", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("buildinglevel 9 1", function(doc){
//					doc.code.should.equal(200)
//					Api.makeDragonEquipment("redCrown_s1", true, function(doc){
//						doc.code.should.equal(Errors.dragonEquipmentMaterialsNotEnough.code)
//						Api.sendChat("dragonmaterial 1000", function(doc){
//							doc.code.should.equal(200)
//							done()
//						})
//					})
//				})
//			})
//		})
//
//		it("makeDragonEquipment 正常普通制造", function(done){
//			Api.sendChat("rmevents dragonEquipmentEvents", function(doc){
//				doc.code.should.equal(200)
//				Api.makeDragonEquipment("redCrown_s1", false, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("makeDragonEquipment 正常立即制造", function(done){
//			Api.makeDragonEquipment("redCrown_s1", true, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("treatSoldier soldiers 不合法", function(done){
//			Api.treatSoldier("ad", true, function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("treatSoldier 士兵不存在或士兵数量不合法1", function(done){
//			Api.sendChat("buildinglevel 6 1", function(doc){
//				doc.code.should.equal(200)
//				Api.treatSoldier([], true, function(doc){
//					doc.code.should.equal(Errors.soldierNotExistOrCountNotLegal.code)
//					done()
//				})
//			})
//		})
//
//		it("treatSoldier 士兵不存在或士兵数量不合法2", function(done){
//			Api.treatSoldier([{name:"add", count:12}], true, function(doc){
//				doc.code.should.equal(Errors.soldierNotExistOrCountNotLegal.code)
//				done()
//			})
//		})
//
//		it("treatSoldier 士兵不存在或士兵数量不合法3", function(done){
//			Api.treatSoldier([{name:"swordsman_1", count:1}], true, function(doc){
//				doc.code.should.equal(Errors.soldierNotExistOrCountNotLegal.code)
//				done()
//			})
//		})
//
//		it("treatSoldier 士兵不存在或士兵数量不合法4", function(done){
//			Api.sendChat("woundedsoldiers 5", function(doc){
//				doc.code.should.equal(200)
//				Api.treatSoldier([{name:"swordsman_1", count:6}], true, function(doc){
//					doc.code.should.equal(Errors.soldierNotExistOrCountNotLegal.code)
//					done()
//				})
//			})
//		})
//
//		it("treatSoldier 士兵不存在或士兵数量不合法5", function(done){
//			Api.treatSoldier([{name:"swordsman_1", count:5}], true, function(doc){
//				doc.code.should.equal(200)
//				Api.treatSoldier([{name:"swordsman_1", count:5}], true, function(doc){
//					doc.code.should.equal(Errors.soldierNotExistOrCountNotLegal.code)
//					done()
//				})
//			})
//		})
//
//		it("treatSoldier 正常普通治疗", function(done){
//			Api.sendChat("woundedsoldiers 5", function(doc){
//				doc.code.should.equal(200)
//				Api.treatSoldier([{name:"sentinel_1", count:5}, {name:"ranger_1", count:5}], false, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("treatSoldier 正常加速治疗", function(done){
//			Api.treatSoldier([{name:"catapult_1", count:5}], true, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("hatchDragon 龙蛋早已成功孵化", function(done){
//			Api.hatchDragon("redDragon", function(doc){
//				doc.code.should.equal(200);
//				Api.hatchDragon("redDragon", function(doc){
//					doc.code.should.equal(Errors.dragonEggAlreadyHatched.code)
//					done()
//				})
//			})
//		})
//
//		it("hatchDragon 孵化条件不满足", function(done){
//			Api.hatchDragon("blueDragon", function(doc){
//				doc.code.should.equal(Errors.hatchConditionNotMatch.code);
//				done()
//			})
//		})
//
//		it("hatchDragon 正常孵化", function(done){
//			Api.sendChat('buildinglevel 4 8', function(doc){
//				doc.code.should.equal(200);
//				Api.hatchDragon("blueDragon", function(doc){
//					doc.code.should.equal(200);
//					done()
//				})
//			})
//		})
//
//		it("setDragonEquipment dragonType 不合法", function(done){
//			Api.setDragonEquipment("redDragona", "crown", "moltenCrown", function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("setDragonEquipment equipmentCategory 不合法", function(done){
//			Api.setDragonEquipment("redDragon", "crowna", "moltenCrown", function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("setDragonEquipment equipmentName 不合法", function(done){
//			Api.setDragonEquipment("redDragon", "crown", "moltenCrowna", function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("setDragonEquipment equipmentName 不能装备到equipmentCategory", function(done){
//			Api.setDragonEquipment("redDragon", "crown", "blueChest_s2", function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("setDragonEquipment equipmentName 不能装备到dragonType", function(done){
//			Api.setDragonEquipment("redDragon", "crown", "blueCrown_s1", function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("setDragonEquipment 龙还未孵化", function(done){
//			Api.setDragonEquipment("greenDragon", "crown", "greenCrown_s1", function(doc){
//				doc.code.should.equal(Errors.dragonNotHatched.code)
//				done()
//			})
//		})
//
//		it("setDragonEquipment 装备与龙的星级不匹配", function(done){
//			Api.setDragonEquipment("redDragon", "crown", "redCrown_s2", function(doc){
//				doc.code.should.equal(Errors.dragonEquipmentNotMatchForTheDragon.code)
//				done()
//			})
//		})
//
//		it("setDragonEquipment 仓库中没有此装备", function(done){
//			Api.sendChat("dragonequipment 0", function(doc){
//				doc.code.should.equal(200)
//				Api.setDragonEquipment("redDragon", "crown", "redCrown_s1", function(doc){
//					doc.code.should.equal(Errors.dragonEquipmentNotEnough.code)
//					done()
//				})
//			})
//		})
//
//		it("setDragonEquipment 龙身上已经存在相同类型的装备", function(done){
//			Api.sendChat("dragonequipment 10", function(doc){
//				doc.code.should.equal(200)
//				Api.setDragonEquipment("redDragon", "crown", "redCrown_s1", function(doc){
//					doc.code.should.equal(200)
//					Api.setDragonEquipment("redDragon", "crown", "redCrown_s1", function(doc){
//						doc.code.should.equal(Errors.dragonAlreadyHasTheSameCategory.code)
//						done()
//					})
//				})
//			})
//		})
//
//		it("enhanceDragonEquipment 此分类还没有配置装备", function(done){
//			Api.enhanceDragonEquipment("redDragon", "chest", [], function(doc){
//				doc.code.should.equal(Errors.dragonDoNotHasThisEquipment.code)
//				done()
//			})
//		})
//
//		it("enhanceDragonEquipment 装备已到最高星级", function(done){
//			Api.sendChat("dragonequipmentstar redDragon 10", function(doc){
//				doc.code.should.equal(200)
//				Api.enhanceDragonEquipment("redDragon", "crown", [{name:"redCrown_s1", count:5}], function(doc){
//					doc.code.should.equal(Errors.dragonEquipmentReachMaxStar.code)
//					done()
//				})
//			})
//		})
//
//		it("enhanceDragonEquipment 被牺牲的装备不存在或数量不足1", function(done){
//			Api.setDragonEquipment("redDragon", "armguardLeft", "redArmguard_s1", function(doc){
//				doc.code.should.equal(200)
//				Api.enhanceDragonEquipment("redDragon", "armguardLeft", [], function(doc){
//					doc.code.should.equal(Errors.dragonEquipmentsNotExistOrNotEnough.code)
//					done()
//				})
//			})
//		})
//
//		it("enhanceDragonEquipment 被牺牲的装备不存在或数量不足2", function(done){
//			Api.enhanceDragonEquipment("redDragon", "armguardLeft", [{name:"redCrown_s2", count:30}], function(doc){
//				doc.code.should.equal(Errors.dragonEquipmentsNotExistOrNotEnough.code)
//				done()
//			})
//		})
//
//		it("enhanceDragonEquipment 被牺牲的装备不存在或数量不足3", function(done){
//			Api.enhanceDragonEquipment("redDragon", "armguardLeft", [{name:"redCrown_s6", count:5}], function(doc){
//				doc.code.should.equal(Errors.dragonEquipmentsNotExistOrNotEnough.code)
//				done()
//			})
//		})
//
//		it("enhanceDragonEquipment 正常强化", function(done){
//			Api.enhanceDragonEquipment("redDragon", "armguardLeft", [{name:"redArmguard_s1", count:5}], function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("resetDragonEquipment 此分类还没有配置装备", function(done){
//			Api.resetDragonEquipment("redDragon", "chest", function(doc){
//				doc.code.should.equal(Errors.dragonDoNotHasThisEquipment.code)
//				done()
//			})
//		})
//
//		it("resetDragonEquipment 仓库中没有此装备", function(done){
//			Api.sendChat("dragonequipment 0", function(doc){
//				doc.code.should.equal(200)
//				Api.resetDragonEquipment("redDragon", "crown", function(doc){
//					doc.code.should.equal(Errors.dragonEquipmentNotEnough.code)
//					Api.sendChat("dragonequipment 10", function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("resetDragonEquipment 正常重置", function(done){
//			Api.resetDragonEquipment("redDragon", "crown", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeDragonSkill 龙还未孵化", function(done){
//			Api.upgradeDragonDragonSkill("greenDragon", "skill_1", function(doc){
//				doc.code.should.equal(Errors.dragonNotHatched.code)
//				done()
//			})
//		})
//
//		it("upgradeDragonSkill 此技能还未解锁", function(done){
//			Api.upgradeDragonDragonSkill("redDragon", "skill_4", function(doc){
//				doc.code.should.equal(Errors.dragonSkillIsLocked.code)
//				done()
//			})
//		})
//
//		it("upgradeDragonSkill 技能已达最高等级", function(done){
//			Api.sendChat("dragonskill redDragon 60", function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeDragonDragonSkill("redDragon", "skill_1", function(doc){
//					doc.code.should.equal(Errors.dragonSkillReachMaxLevel.code)
//					Api.sendChat("dragonskill redDragon 0", function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("upgradeDragonSkill 英雄之血不足", function(done){
//			Api.sendChat("resources blood 0", function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeDragonDragonSkill("redDragon", "skill_1", function(doc){
//					doc.code.should.equal(Errors.heroBloodNotEnough.code)
//					Api.sendChat("resources blood 1000", function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("upgradeDragonSkill 正常升级1", function(done){
//			Api.sendChat("dragonstar redDragon 4", function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeDragonDragonSkill("redDragon", "skill_9", function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("upgradeDragonSkill 正常升级2", function(done){
//			Api.upgradeDragonDragonSkill("redDragon", "skill_9", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeDragonStar 龙还未孵化", function(done){
//			Api.upgradeDragonStar("greenDragon", function(doc){
//				doc.code.should.equal(Errors.dragonNotHatched.code)
//				done()
//			})
//		})
//
//		it("upgradeDragonStar 龙的星级已达最高", function(done){
//			Api.sendChat("dragonstar redDragon 5", function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeDragonStar("redDragon", function(doc){
//					doc.code.should.equal(Errors.dragonReachMaxStar.code)
//					done()
//				})
//			})
//		})
//
//		it("upgradeDragonStar 龙的等级未达到晋级要求", function(done){
//			Api.sendChat("dragonstar redDragon 1", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("dragonstar redDragon 2", function(doc){
//					doc.code.should.equal(200)
//					Api.upgradeDragonStar("redDragon", function(doc){
//						doc.code.should.equal(Errors.dragonUpgradeStarFailedForLevelNotLegal.code)
//						done()
//					})
//				})
//			})
//		})
//
//		it("upgradeDragonStar 龙的装备未达到晋级要求", function(done){
//			Api.sendChat("dragonstar redDragon 1", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("dragonlevel redDragon 10", function(doc){
//					doc.code.should.equal(200)
//					Api.upgradeDragonStar("redDragon", function(doc){
//						doc.code.should.equal(Errors.dragonUpgradeStarFailedForEquipmentNotLegal.code)
//						done()
//					})
//				})
//			})
//		})
//
//		it("upgradeDragonStar 正常晋级", function(done){
//			Api.setDragonEquipment("redDragon", "crown", "redCrown_s1", function(doc){
//				doc.code.should.equal(200)
//				Api.setDragonEquipment("redDragon", "armguardLeft", "redArmguard_s1", function(doc){
//					doc.code.should.equal(200)
//					Api.setDragonEquipment("redDragon", "armguardRight", "redArmguard_s1", function(doc){
//						doc.code.should.equal(200)
//						Api.sendChat("dragonequipmentstar redDragon 5", function(doc){
//							doc.code.should.equal(200)
//							Api.upgradeDragonStar("redDragon", function(doc){
//								doc.code.should.equal(200)
//								done()
//							})
//						})
//					})
//				})
//			})
//		})
//
//		it("getDailyQuests 成功获取", function(done){
//			Api.sendChat("gem 500000", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("buildinglevel 15 1", function(doc){
//					doc.code.should.equal(200)
//					Api.getDailyQuests(function(doc){
//						doc.code.should.equal(200)
//						Api.getDailyQuests(function(doc){
//							doc.code.should.equal(200)
//							done()
//						})
//					})
//				})
//			})
//		})
//
//		it("addDailyQuestStar 成功升星", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				m_user = doc.playerData
//				Api.addDailyQuestStar(m_user.dailyQuests.quests[0].id, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("startDailyQuest 成功开始", function(done){
//			Api.startDailyQuest(m_user.dailyQuests.quests[0].id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("startDailyQuest 任务不存在", function(done){
//			Api.startDailyQuest(m_user.dailyQuests.quests[0].id, function(doc){
//				doc.code.should.equal(Errors.dailyQuestNotExist.code)
//				done()
//			})
//		})
//
//		it("startDailyQuest 已经有任务正在进行中", function(done){
//			Api.startDailyQuest(m_user.dailyQuests.quests[1].id, function(doc){
//				doc.code.should.equal(Errors.dailyQuestEventExist.code)
//				done()
//			})
//		})
//
//		//it("getDailyQeustReward 正常领取", function(done){
//		//	setTimeout(function(){
//		//		Api.getDailyQeustReward(m_user.dailyQuestEvents[0].id, function(doc){
//		//			doc.code.should.equal(200)
//		//			done()
//		//		})
//		//	}, 2000)
//		//})
//
//		it("setPlayerLanguage", function(done){
//			Api.setPlayerLanguage("cn", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getPlayerInfo", function(done){
//			Api.getPlayerInfo(m_user._id, m_user.serverId, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("sendMail 不能给自己发邮件", function(done){
//			Api.sendMail(m_user._id, "testMail", "this is a testMail", function(doc){
//				doc.code.should.equal(500)
//				done()
//			})
//		})
//
//		it("sendMail 玩家不存在", function(done){
//			Api.sendMail("adfadf", "testMail", "this is a testMail", function(doc){
//				doc.code.should.equal(Errors.playerNotExist.code)
//				done()
//			})
//		})
//
//		it("sendMail 正常发送", function(done){
//			Api.loginPlayer(Config.deviceId2, function(doc){
//				doc.code.should.equal(200)
//				Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(doc){
//					doc.code.should.equal(200)
//					Api.sendMail(m_user._id, "testMail", "this is a testMail", function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("deleteSendMails 正常删除", function(done){
//			Api.getSendMails(0, function(doc){
//				m_user.sendMails = doc.mails
//				doc.code.should.equal(200)
//				Api.deleteSendMails([m_user.sendMails[0].id], function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it('addBlocked 正常屏蔽', function(done){
//			Api.addBlocked(m_user._id, m_user.basicInfo.name, m_user.basicInfo.icon, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it('removeBlocked 正常移除', function(done){
//			Api.removeBlocked(m_user._id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("readMails 正常阅读", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				m_user = doc.playerData
//				Api.getMails(0, function(doc){
//					m_user.mails = doc.mails
//					doc.code.should.equal(200)
//					Api.readMails([m_user.mails[0].id], function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("saveMail 正常收藏", function(done){
//			Api.saveMail(m_user.mails[0].id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("unSaveMail 正常取消收藏", function(done){
//			Api.unSaveMail(m_user.mails[0].id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getSendMails 获取已发邮件", function(done){
//			Api.getSendMails(0, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getSavedMails 获取已存邮件", function(done){
//			Api.getSavedMails(0, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("deleteMails 正常删除收藏", function(done){
//			Api.deleteMails([m_user.mails[0].id], function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getPlayerViewData 正常查看", function(done){
//			var m_userData = null
//			Api.loginPlayer(Config.deviceId2, function(doc){
//				doc.code.should.equal(200)
//				m_userData = doc.playerData
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					Api.getPlayerViewData(m_userData._id, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("setDefenceTroop 正常设置", function(done){
//			Api.sendChat("dragonlevel redDragon 10", function(doc){
//				doc.code.should.equal(200)
//				Api.setDefenceTroop("redDragon", [{
//					name:"swordsman_1",
//					count:50
//				}], function(doc){
//					doc.code.should.equal(200)
//					done();
//				})
//			})
//		})
//
//		it("cancelDefenceTroop 正常取消", function(done){
//			Api.cancelDefenceTroop(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("sellItem 没有足够的出售队列", function(done){
//			Api.sellItem("resources", "wood", 1000, 1, function(doc){
//				doc.code.should.equal(Errors.sellQueueNotEnough.code)
//				done()
//			})
//		})
//
//		it("sellItem 马车数量不足", function(done){
//			Api.sendChat("buildinglevel 14 1", function(doc){
//				doc.code.should.equal(200)
//				Api.sellItem("resources", "wood", 1000, 1000, function(doc){
//					doc.code.should.equal(Errors.cartNotEnough.code)
//					done()
//				})
//			})
//		})
//
//		it("sellItem 正常出售", function(done){
//			Api.sendChat("resources cart 100", function(doc){
//				doc.code.should.equal(200)
//				Api.sellItem("resources", "wood", 2, 1, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		var sellItems = null
//		it("getSellItems 正常获取", function(done){
//			Api.loginPlayer(Config.deviceId2, function(doc){
//				doc.code.should.equal(200)
//				Api.getSellItems("resources", "wood", function(doc){
//					doc.code.should.equal(200)
//					sellItems = doc.itemDocs
//					done()
//				})
//			})
//		})
//
//		it("buySellItem 正常购买", function(done){
//			Api.buySellItem(sellItems[0]._id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getMyItemSoldMoney 正常获取", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				Api.getMyItemSoldMoney(sellItems[0]._id, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("removeMySellItem 正常下架", function(done){
//			var deal = null
//			Api.sellItem("resources", "wood", 1, 1, function(doc){
//				doc.code.should.equal(200)
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					deal = doc.playerData.deals[0]
//					Api.removeMySellItem(deal.id, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("setPushId 正常设置", function(done){
//			Api.setPushId("test", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("setPushId 重复设置", function(done){
//			Api.setPushId("test", function(doc){
//				doc.code.should.equal(Errors.pushIdAlreadySeted.code)
//				done()
//			})
//		})
//
//		it("setPushId 更换ApnId", function(done){
//			Api.setPushId("test2", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeProductionTech 前置科技条件不满足", function(done){
//			Api.sendChat("buildinglevel 7 1", function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeProductionTech("fastFix", true, function(doc){
//					doc.code.should.equal(Errors.techUpgradePreConditionNotMatch.code)
//					done()
//				})
//			})
//		})
//
//		it("upgradeProductionTech 正常升级", function(done){
//			Api.upgradeBuilding(7, true, function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeProductionTech("crane", false, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("upgradeProductionTech 正常升级", function(done){
//			Api.upgradeProductionTech("crane", false, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeMilitaryTech 建筑还未建造", function(done){
//			Api.upgradeMilitaryTech("infantry_infantry", false, function(doc){
//				doc.code.should.equal(Errors.buildingNotBuild.code)
//				done()
//			})
//		})
//
//		it("upgradeMilitaryTech 正常升级1", function(done){
//			Api.sendChat("keep 15", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("buildinglevel 17 1", function(doc){
//					doc.code.should.equal(200)
//					Api.upgradeMilitaryTech("infantry_infantry", true, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("upgradeMilitaryTech 正常升级2", function(done){
//			Api.upgradeMilitaryTech("infantry_infantry", false, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeMilitaryTech 正常升级3", function(done){
//			Api.upgradeMilitaryTech("infantry_hpAdd", false, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeSoldierStar 科技点不足", function(done){
//			Api.sendChat("buildinglevel 18 1", function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeSoldierStar("ranger_1", true, function(doc){
//					doc.code.should.equal(Errors.techPointNotEnough.code)
//					done()
//				})
//			})
//		})
//
//		it("upgradeSoldierStar 正常升级", function(done){
//			Api.sendChat("militarytech infantry_cavalry 60", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("militarytech infantry_archer 60", function(doc){
//					doc.code.should.equal(200)
//					Api.upgradeSoldierStar("swordsman_1", true, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("setTerrain 正常设置", function(done){
//			Api.setTerrain(Consts.AllianceTerrain.IceField, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("buyAndUseItem changePlayerName", function(done){
//			Api.buyAndUseItem("changePlayerName", {
//				changePlayerName:{
//					playerName:"modunzhang"
//				}
//			}, function(doc){
//				doc.code.should.equal(200)
//				Api.loginPlayer(Config.deviceId2, function(doc){
//					doc.code.should.equal(200)
//					Api.buyAndUseItem("changePlayerName", {
//						changePlayerName:{
//							playerName:"modunzhang"
//						}
//					}, function(doc){
//						doc.code.should.equal(Errors.playerNameAlreadyUsed.code);
//						Api.loginPlayer(Config.deviceId, function(doc){
//							doc.code.should.equal(200)
//							done();
//						})
//					})
//				})
//			})
//		})
//
//		it("buyAndUseItem masterOfDefender_2", function(done){
//			Api.buyAndUseItem("masterOfDefender_2", {
//				masterOfDefender_2:{}
//			}, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("buyAndUseItem quarterMaster_2", function(done){
//			Api.buyAndUseItem("quarterMaster_2", {
//				quarterMaster_2:{}
//			}, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("buyAndUseItem fogOfTrick_2", function(done){
//			Api.buyAndUseItem("fogOfTrick_2", {
//				fogOfTrick_2:{}
//			}, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("buyAndUseItem woodBonus_2", function(done){
//			Api.buyAndUseItem("woodBonus_2", {
//				woodBonus_2:{}
//			}, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("buyAndUseItem stoneBonus_2", function(done){
//			Api.buyAndUseItem("stoneBonus_2", {
//				stoneBonus_2:{}
//			}, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("useItem movingConstruction", function(done){
//			Api.buyItem("movingConstruction", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("movingConstruction", {
//					movingConstruction:{
//						fromBuildingLocation:3,
//						fromHouseLocation:2,
//						toBuildingLocation:3,
//						toHouseLocation:3
//					}
//				}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem torch", function(done){
//			Api.buyItem("torch", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("torch", {
//					torch:{
//						buildingLocation:3,
//						houseLocation:3
//					}
//				}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem changePlayerName", function(done){
//			Api.useItem("changePlayerName", {
//				changePlayerName:{
//					playerName:"modunzhang1"
//				}
//			}, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("useItem dragonExp_2", function(done){
//			Api.buyItem("dragonExp_2", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("dragonExp_2", {
//					dragonExp_2:{
//						dragonType:"redDragon"
//					}
//				}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem dragonHp_2", function(done){
//			Api.buyItem("dragonHp_2", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("dragonHp_2", {
//					dragonHp_2:{
//						dragonType:"redDragon"
//					}
//				}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem heroBlood_2", function(done){
//			Api.buyItem("heroBlood_2", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("heroBlood_2", {}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem stamina_2", function(done){
//			Api.buyItem("stamina_2", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("stamina_2", {}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem restoreWall_2", function(done){
//			Api.buyItem("restoreWall_2", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("restoreWall_2", {}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem dragonChest_2", function(done){
//			Api.buyItem("dragonChest_2", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("dragonChest_2", {}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem vipActive_3", function(done){
//			Api.buyItem("vipActive_3", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("vipActive_3", {}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("vipevent 修改玩家Buff时间", function(done){
//			Api.sendChat('vipevent 60', function(doc){
//				doc.code.should.equal(200);
//				done();
//			})
//		})
//
//		it("useItem vipPoint_3", function(done){
//			Api.buyItem("vipPoint_3", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("vipPoint_3", {}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem masterOfDefender_2", function(done){
//			Api.buyItem("masterOfDefender_2", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("masterOfDefender_2", {}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem stoneBonus_2", function(done){
//			Api.buyItem("stoneBonus_2", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("stoneBonus_2", {}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem woodClass_3", function(done){
//			Api.buyItem("woodClass_3", 1, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("woodClass_3", {woodClass_3:{count:1}}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem citizenClass_2", function(done){
//			Api.buyItem("citizenClass_2", 2, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("citizenClass_2", {citizenClass_2:{count:2}}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem casinoTokenClass_2", function(done){
//			Api.buyItem("casinoTokenClass_2", 5, function(doc){
//				doc.code.should.equal(200)
//				Api.useItem("casinoTokenClass_2", {casinoTokenClass_2:{count:5}}, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("useItem speedup_3", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				m_user = doc.playerData
//				Api.buyItem("speedup_3", 1, function(doc){
//					doc.code.should.equal(200)
//					Api.useItem("speedup_3", {
//						speedup_3:{
//							eventType:"productionTechEvents",
//							eventId:m_user.productionTechEvents[0].id,
//							count:1
//						}
//					}, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("gacha 正常Gacha1", function(done){
//			Api.gacha(Consts.GachaType.Normal, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("gacha 正常Gacha2", function(done){
//			Api.sendChat("resources casinoToken 1000000", function(doc){
//				doc.code.should.equal(200)
//				Api.gacha(Consts.GachaType.Advanced, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("bindGc 正常绑定", function(done){
//			Api.bindGc('gamecenter', Config.gcId, 'modunzhang', function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("bindGc 玩家GameCenter账号已经绑定", function(done){
//			Api.bindGc('gamecenter', Config.gcId, 'modunzhang', function(doc){
//				doc.code.should.equal(Errors.playerAlreadyBindGC.code)
//				done()
//			})
//		})
//
//		it("updateGcName 正常更新", function(done){
//			Api.updateGcName('modunzhang', function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("bindGc 此GameCenter账号已被其他玩家绑定", function(done){
//			Api.loginPlayer(Config.deviceId2, function(doc){
//				doc.code.should.equal(200)
//				Api.bindGc('gamecenter', Config.gcId, 'modunzhang', function(doc){
//					doc.code.should.equal(Errors.theGCAlreadyBindedByOtherPlayer.code)
//					done()
//				})
//			})
//		})
//
//		it("updateGcName 玩家还未绑定GC", function(done){
//			Api.updateGcName('modunzhang', function(doc){
//				doc.code.should.equal(Errors.playerNotBindGC.code)
//				done()
//			})
//		})
//
//		it("switchGc 切换到新建账号", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				Api.switchGc(Config.gcId3, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("switchGc 切换到老账号", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(doc){
//					doc.code.should.equal(200)
//					Api.switchGc(Config.gcId, function(doc){
//						doc.code.should.equal(200)
//						Api.loginPlayer(Config.deviceId, function(doc){
//							doc.code.should.equal(200)
//							done()
//						})
//					})
//				})
//			})
//		})
//
//		it("getDay60Reward 正常领取", function(done){
//			Api.getDay60Reward(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getDay60Reward 今日登陆奖励已领取", function(done){
//			Api.getDay60Reward(function(doc){
//				doc.code.should.equal(Errors.loginRewardAlreadyGet.code)
//				done()
//			})
//		})
//
//		it("getOnlineReward 在线时间不足,不能领取", function(done){
//			Api.getOnlineReward(1, function(doc){
//				doc.code.should.equal(Errors.onlineTimeNotEough.code)
//				done()
//			})
//		})
//
//		it("getDay14Reward 正常领取", function(done){
//			Api.getDay14Reward(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getDay14Reward 今日王城援军奖励已领取", function(done){
//			Api.getDay14Reward(function(doc){
//				doc.code.should.equal(Errors.wonderAssistanceRewardAlreadyGet.code)
//				done()
//			})
//		})
//
//		it("getLevelupReward 玩家城堡等级不足以领取当前冲级奖励", function(done){
//			Api.sendChat("buildinglevel 1 1", function(doc){
//				doc.code.should.equal(200)
//				Api.getLevelupReward(1, function(doc){
//					doc.code.should.equal(Errors.levelUpRewardCanNotBeGetForCastleLevelNotMatch.code)
//					done()
//				})
//			})
//		})
//
//		it("getLevelupReward 正常领取", function(done){
//			Api.sendChat("buildinglevel 1 6", function(doc){
//				doc.code.should.equal(200)
//				Api.getLevelupReward(1, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("getLevelupReward 当前等级的冲级奖励已经领取", function(done){
//			Api.getLevelupReward(1, function(doc){
//				doc.code.should.equal(Errors.levelUpRewardAlreadyGet.code)
//				done()
//			})
//		})
//
//		//it("addIosPlayerBillingData 正常添加", function(done){
//		//	Api.addIosPlayerBillingData("{\"signature\" = \"AsVqZoRMgVIyAcFfRE2OcKTPc9s0OZeRd5ga7UP++j3EhET8O6KddNPiC6WNb/OqZxiWxBt+KnPoebJ14mBGttDWcuS3WbO7Dl8eX0fOqwargH7wePMN8wl+soSjTMTHw1xJLBVOPIc+rCOdT8H9PXxf+9cIwNpsnzFmYvMlxOA3AAADVzCCA1MwggI7oAMCAQICCBup4+PAhm/LMA0GCSqGSIb3DQEBBQUAMH8xCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEzMDEGA1UEAwwqQXBwbGUgaVR1bmVzIFN0b3JlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MB4XDTE0MDYwNzAwMDIyMVoXDTE2MDUxODE4MzEzMFowZDEjMCEGA1UEAwwaUHVyY2hhc2VSZWNlaXB0Q2VydGlmaWNhdGUxGzAZBgNVBAsMEkFwcGxlIGlUdW5lcyBTdG9yZTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAMmTEuLgjimLwRJxy1oEf0esUNDVEIe6wDsnnal14hNBt1v195X6n93YO7gi3orPSux9D554SkMp+Sayg84lTc362UtmYLpWnb34nqyGx9KBVTy5OGV4ljE1OwC+oTnRM+QLRCmeNxMbPZhS47T+eZtDEhVB9usk3+JM2Cogfwo7AgMBAAGjcjBwMB0GA1UdDgQWBBSJaEeNuq9Df6ZfN68Fe+I2u22ssDAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFDYd6OKdgtIBGLUyaw7XQwuRWEM6MA4GA1UdDwEB/wQEAwIHgDAQBgoqhkiG92NkBgUBBAIFADANBgkqhkiG9w0BAQUFAAOCAQEAeaJV2U51rxfcqAAe5C2/fEW8KUl4iO4lMuta7N6XzP1pZIz1NkkCtIIweyNj5URYHK+HjRKSU9RLguNl0nkfxqObiMckwRudKSq69NInrZyCD66R4K77nb9lMTABSSYlsKt8oNtlhgR/1kjSSRQcHktsDcSiQGKMdkSlp4AyXf7vnHPBe4yCwYV2PpSN04kboiJ3pBlxsGwV/ZlL26M2ueYHKYCuXhdqFwxVgm52h3oeJOOt/vY4EcQq7eqHm6m03Z9b7PRzYM2KGXHDmOMk7vDpeMVlLDPSGYz1+U3sDxJzebSpbaJmT7imzUKfggEY7xxf4czfH0yj5wNzSGTOvQ==\";\"purchase-info\" = \"ewoJIm9yaWdpbmFsLXB1cmNoYXNlLWRhdGUtcHN0IiA9ICIyMDE2LTAxLTA0IDA2OjMzOjI0IEFtZXJpY2EvTG9zX0FuZ2VsZXMiOwoJInVuaXF1ZS1pZGVudGlmaWVyIiA9ICI3YjIwN2FhMTY4OWQwY2Y5NzQ3ZTRhNGFlOGM5ODM5MDQ0MTNjM2RjIjsKCSJvcmlnaW5hbC10cmFuc2FjdGlvbi1pZCIgPSAiMTAwMDAwMDE4NzMyMTg4OCI7CgkiYnZycyIgPSAiMS4xLjEiOwoJInRyYW5zYWN0aW9uLWlkIiA9ICIxMDAwMDAwMTg3MzIxODg4IjsKCSJxdWFudGl0eSIgPSAiMSI7Cgkib3JpZ2luYWwtcHVyY2hhc2UtZGF0ZS1tcyIgPSAiMTQ1MTkxODAwNDc5MCI7CgkidW5pcXVlLXZlbmRvci1pZGVudGlmaWVyIiA9ICJBOUMyMzZBQi00MDI0LTRFMTItODk4Ri02M0JGQjY4RDA4QzQiOwoJInByb2R1Y3QtaWQiID0gImNvbS5kcmFnb25mYWxsLjI1MDBkcmFnb25jb2lucyI7CgkiaXRlbS1pZCIgPSAiOTk0NTMzNzYyIjsKCSJiaWQiID0gImNvbS5iYXRjYXRzdHVkaW8uZHJhZ29uZmFsbCI7CgkicHVyY2hhc2UtZGF0ZS1tcyIgPSAiMTQ1MTkxODAwNDc5MCI7CgkicHVyY2hhc2UtZGF0ZSIgPSAiMjAxNi0wMS0wNCAxNDozMzoyNCBFdGMvR01UIjsKCSJwdXJjaGFzZS1kYXRlLXBzdCIgPSAiMjAxNi0wMS0wNCAwNjozMzoyNCBBbWVyaWNhL0xvc19BbmdlbGVzIjsKCSJvcmlnaW5hbC1wdXJjaGFzZS1kYXRlIiA9ICIyMDE2LTAxLTA0IDE0OjMzOjI0IEV0Yy9HTVQiOwp9\";\"environment\" = \"Sandbox\";\"pod\" = \"100\";\"signing-status\" = \"0\";}", function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it("addIosPlayerBillingData 重复的订单号", function(done){
//		//	Api.addIosPlayerBillingData("{\"signature\" = \"AsVqZoRMgVIyAcFfRE2OcKTPc9s0OZeRd5ga7UP++j3EhET8O6KddNPiC6WNb/OqZxiWxBt+KnPoebJ14mBGttDWcuS3WbO7Dl8eX0fOqwargH7wePMN8wl+soSjTMTHw1xJLBVOPIc+rCOdT8H9PXxf+9cIwNpsnzFmYvMlxOA3AAADVzCCA1MwggI7oAMCAQICCBup4+PAhm/LMA0GCSqGSIb3DQEBBQUAMH8xCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEzMDEGA1UEAwwqQXBwbGUgaVR1bmVzIFN0b3JlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MB4XDTE0MDYwNzAwMDIyMVoXDTE2MDUxODE4MzEzMFowZDEjMCEGA1UEAwwaUHVyY2hhc2VSZWNlaXB0Q2VydGlmaWNhdGUxGzAZBgNVBAsMEkFwcGxlIGlUdW5lcyBTdG9yZTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAMmTEuLgjimLwRJxy1oEf0esUNDVEIe6wDsnnal14hNBt1v195X6n93YO7gi3orPSux9D554SkMp+Sayg84lTc362UtmYLpWnb34nqyGx9KBVTy5OGV4ljE1OwC+oTnRM+QLRCmeNxMbPZhS47T+eZtDEhVB9usk3+JM2Cogfwo7AgMBAAGjcjBwMB0GA1UdDgQWBBSJaEeNuq9Df6ZfN68Fe+I2u22ssDAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFDYd6OKdgtIBGLUyaw7XQwuRWEM6MA4GA1UdDwEB/wQEAwIHgDAQBgoqhkiG92NkBgUBBAIFADANBgkqhkiG9w0BAQUFAAOCAQEAeaJV2U51rxfcqAAe5C2/fEW8KUl4iO4lMuta7N6XzP1pZIz1NkkCtIIweyNj5URYHK+HjRKSU9RLguNl0nkfxqObiMckwRudKSq69NInrZyCD66R4K77nb9lMTABSSYlsKt8oNtlhgR/1kjSSRQcHktsDcSiQGKMdkSlp4AyXf7vnHPBe4yCwYV2PpSN04kboiJ3pBlxsGwV/ZlL26M2ueYHKYCuXhdqFwxVgm52h3oeJOOt/vY4EcQq7eqHm6m03Z9b7PRzYM2KGXHDmOMk7vDpeMVlLDPSGYz1+U3sDxJzebSpbaJmT7imzUKfggEY7xxf4czfH0yj5wNzSGTOvQ==\";\"purchase-info\" = \"ewoJIm9yaWdpbmFsLXB1cmNoYXNlLWRhdGUtcHN0IiA9ICIyMDE2LTAxLTA0IDA2OjMzOjI0IEFtZXJpY2EvTG9zX0FuZ2VsZXMiOwoJInVuaXF1ZS1pZGVudGlmaWVyIiA9ICI3YjIwN2FhMTY4OWQwY2Y5NzQ3ZTRhNGFlOGM5ODM5MDQ0MTNjM2RjIjsKCSJvcmlnaW5hbC10cmFuc2FjdGlvbi1pZCIgPSAiMTAwMDAwMDE4NzMyMTg4OCI7CgkiYnZycyIgPSAiMS4xLjEiOwoJInRyYW5zYWN0aW9uLWlkIiA9ICIxMDAwMDAwMTg3MzIxODg4IjsKCSJxdWFudGl0eSIgPSAiMSI7Cgkib3JpZ2luYWwtcHVyY2hhc2UtZGF0ZS1tcyIgPSAiMTQ1MTkxODAwNDc5MCI7CgkidW5pcXVlLXZlbmRvci1pZGVudGlmaWVyIiA9ICJBOUMyMzZBQi00MDI0LTRFMTItODk4Ri02M0JGQjY4RDA4QzQiOwoJInByb2R1Y3QtaWQiID0gImNvbS5kcmFnb25mYWxsLjI1MDBkcmFnb25jb2lucyI7CgkiaXRlbS1pZCIgPSAiOTk0NTMzNzYyIjsKCSJiaWQiID0gImNvbS5iYXRjYXRzdHVkaW8uZHJhZ29uZmFsbCI7CgkicHVyY2hhc2UtZGF0ZS1tcyIgPSAiMTQ1MTkxODAwNDc5MCI7CgkicHVyY2hhc2UtZGF0ZSIgPSAiMjAxNi0wMS0wNCAxNDozMzoyNCBFdGMvR01UIjsKCSJwdXJjaGFzZS1kYXRlLXBzdCIgPSAiMjAxNi0wMS0wNCAwNjozMzoyNCBBbWVyaWNhL0xvc19BbmdlbGVzIjsKCSJvcmlnaW5hbC1wdXJjaGFzZS1kYXRlIiA9ICIyMDE2LTAxLTA0IDE0OjMzOjI0IEV0Yy9HTVQiOwp9\";\"environment\" = \"Sandbox\";\"pod\" = \"100\";\"signing-status\" = \"0\";}", function(doc){
//		//		doc.code.should.equal(Errors.duplicateIAPTransactionId.code)
//		//		done()
//		//	})
//		//})
//
//		//it("addWpOfficialPlayerBillingData 正常添加", function(done){
//		//	Api.addWpOfficialPlayerBillingData('<?xml version="1.0"?><Receipt Version="2.0" CertificateId="A656B9B1B3AA509EEA30222E6D5E7DBDA9822DCD" xmlns="http://schemas.microsoft.com/windows/2012/store/receipt"><ProductReceipt PurchasePrice="$0" PurchaseDate="2015-11-24T11:08:10.505Z" Id="467904e3-151d-4615-80fa-2799fa7e285e" AppId="SugarcaneTechnologyGmbH.Dragonfall_vka414hek5xj8" ProductId="com.dragonfall.2500dragoncoins" ProductType="Consumable" PublisherUserId="yQiVdk6Coi7RWvsx5RgEaA9VHzz/gdGdF7wUgZ/MGmE=" PublisherDeviceId="8puddmDDTnm4piSOrd0n8WOGBSh8MGNR6T2Crq0HLUI=" MicrosoftProductId="46abddc7-0227-4eb4-945f-31094395a4e5" MicrosoftAppId="aa155f39-6b85-4c52-a388-4eacd55bbcb5" /><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" /><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" /><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><DigestValue>ywGHea6Vr7LedbjbnSA+4CCZpCKJDSqkAIYWV/NhrcM=</DigestValue></Reference></SignedInfo><SignatureValue>nHh8ojiQeMJ7HZuaWEidJgJWZMv3IdZeEg8rZ/uA6isJ/Qyowzxxv0NrmvxcL+IxYC+/XE3V0rMjfOtdf9NmHj71G/kY6WZfe8yVzDRFXSxhFyiMcOsup/914iWz7kbp23A6qHqCFo2TCK67NgHcyXfYmiIVTzw2VFTWPcLvFz35pEBeczNsLlloPam0liDDaZYS3nn0ajwZvoetqvPo8nJkj3flcqUTi0jOTCDKZIF9cc0OVIN9dQGzQLDi8egwEAwxCyRSJjiFfbzbKf6WuCO66AszxApeZ7lDTx6kXP2j1JccpB8TS+4WeTQXLHJWI1dUvxqr200Zx10bfgh6vQ==</SignatureValue></Signature></Receipt>', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it("addWpOfficialPlayerBillingData 重复添加", function(done){
//		//	Api.addWpOfficialPlayerBillingData('<?xml version="1.0"?><Receipt Version="2.0" CertificateId="A656B9B1B3AA509EEA30222E6D5E7DBDA9822DCD" xmlns="http://schemas.microsoft.com/windows/2012/store/receipt"><ProductReceipt PurchasePrice="$0" PurchaseDate="2015-11-24T11:08:10.505Z" Id="467904e3-151d-4615-80fa-2799fa7e285e" AppId="SugarcaneTechnologyGmbH.Dragonfall_vka414hek5xj8" ProductId="com.dragonfall.2500dragoncoins" ProductType="Consumable" PublisherUserId="yQiVdk6Coi7RWvsx5RgEaA9VHzz/gdGdF7wUgZ/MGmE=" PublisherDeviceId="8puddmDDTnm4piSOrd0n8WOGBSh8MGNR6T2Crq0HLUI=" MicrosoftProductId="46abddc7-0227-4eb4-945f-31094395a4e5" MicrosoftAppId="aa155f39-6b85-4c52-a388-4eacd55bbcb5" /><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" /><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" /><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><DigestValue>ywGHea6Vr7LedbjbnSA+4CCZpCKJDSqkAIYWV/NhrcM=</DigestValue></Reference></SignedInfo><SignatureValue>nHh8ojiQeMJ7HZuaWEidJgJWZMv3IdZeEg8rZ/uA6isJ/Qyowzxxv0NrmvxcL+IxYC+/XE3V0rMjfOtdf9NmHj71G/kY6WZfe8yVzDRFXSxhFyiMcOsup/914iWz7kbp23A6qHqCFo2TCK67NgHcyXfYmiIVTzw2VFTWPcLvFz35pEBeczNsLlloPam0liDDaZYS3nn0ajwZvoetqvPo8nJkj3flcqUTi0jOTCDKZIF9cc0OVIN9dQGzQLDi8egwEAwxCyRSJjiFfbzbKf6WuCO66AszxApeZ7lDTx6kXP2j1JccpB8TS+4WeTQXLHJWI1dUvxqr200Zx10bfgh6vQ==</SignatureValue></Signature></Receipt>', function(doc){
//		//		doc.code.should.equal(Errors.duplicateIAPTransactionId.code)
//		//		done()
//		//	})
//		//})
//
//		//it("addWpAdeasygoPlayerBillingData 正常添加", function(done){
//		//	Api.addWpAdeasygoPlayerBillingData('YTFkMTFhMTE5ZjM1Mjk2MjFiOTI4ZGJmNmU1ODM4YjI%3D', '2015112521001004310210904808', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it("addWpAdeasygoPlayerBillingData 重复添加", function(done){
//		//	Api.addWpAdeasygoPlayerBillingData('YTFkMTFhMTE5ZjM1Mjk2MjFiOTI4ZGJmNmU1ODM4YjI%3D', '2015112521001004310210904808', function(doc){
//		//		doc.code.should.equal(Errors.duplicateIAPTransactionId.code)
//		//		done()
//		//	})
//		//})
//
//		//it("addAndroidOfficialPlayerBillingData 正常添加", function(done){
//		//	Api.addAndroidOfficialPlayerBillingData(
//		//		'{"orderId":"GPA.1359-3108-9738-89718","packageName":"com.batcatstudio.dragonfall","productId":"com.dragonfall.2500dragoncoins","purchaseTime":1452563778770,"purchaseState":0,"purchaseToken":"ocejalgdkegdcjnnmfekjbcd.AO-J1OzjejJU4DtI5LUZQyFiMpFJs2YcJN7_0OqLUuXKd5koNkZJPqGe3qGST7FLUksLl6rbQR7I6pPd7c7m6V44Di8lxPraTyzfHBKq9tQLxZNggtTAvRd8lQ1RhpxPWnchwTli6zCxSxwzM7tNCgOjJDOXvKL9Jg"}',
//		//		'keGsBlU+LNSqCNlR4cKUyDvcQoe5+Q3Tj6dCnxHQCWq6j173Nkts0QMRiy4jteJznDDyxATYmfA6zJdPRbzb7J426LM0g3MdwEmD29aUVRlEJzoQrs7yBahRt6y7obCEXFns6Fb107OvYeFdEax7Bf7QfnHdRwUt2s8zl/FibrCk4m9VkOy+SXtva3IlE+Igv46lD7OwurxbVUYo+C8pvaBX1JnorDA2vvNpR54Kp7zAxj5HZ1QnuQjmL1RJcOd6lh0CkpY18OBMc+nQZygyotz1QQz+pZaTN1LHLh9Nm0QXhU2Ax5kOcR+nl0lXSMEwNljTLIVa2DnkaE7b8jN3+Q==',
//		//		function(doc){
//		//			doc.code.should.equal(200)
//		//			done()
//		//		})
//		//})
//		//
//		//it("addAndroidOfficialPlayerBillingData 重复添加", function(done){
//		//	Api.addAndroidOfficialPlayerBillingData(
//		//		'{"orderId":"GPA.1359-3108-9738-89718","packageName":"com.batcatstudio.dragonfall","productId":"com.dragonfall.2500dragoncoins","purchaseTime":1452563778770,"purchaseState":0,"purchaseToken":"ocejalgdkegdcjnnmfekjbcd.AO-J1OzjejJU4DtI5LUZQyFiMpFJs2YcJN7_0OqLUuXKd5koNkZJPqGe3qGST7FLUksLl6rbQR7I6pPd7c7m6V44Di8lxPraTyzfHBKq9tQLxZNggtTAvRd8lQ1RhpxPWnchwTli6zCxSxwzM7tNCgOjJDOXvKL9Jg"}',
//		//		'keGsBlU+LNSqCNlR4cKUyDvcQoe5+Q3Tj6dCnxHQCWq6j173Nkts0QMRiy4jteJznDDyxATYmfA6zJdPRbzb7J426LM0g3MdwEmD29aUVRlEJzoQrs7yBahRt6y7obCEXFns6Fb107OvYeFdEax7Bf7QfnHdRwUt2s8zl/FibrCk4m9VkOy+SXtva3IlE+Igv46lD7OwurxbVUYo+C8pvaBX1JnorDA2vvNpR54Kp7zAxj5HZ1QnuQjmL1RJcOd6lh0CkpY18OBMc+nQZygyotz1QQz+pZaTN1LHLh9Nm0QXhU2Ax5kOcR+nl0lXSMEwNljTLIVa2DnkaE7b8jN3+Q==',
//		//		function(doc){
//		//			doc.code.should.equal(Errors.duplicateIAPTransactionId.code)
//		//			done()
//		//		})
//		//})
//		//
//		//it("getFirstIAPRewards 正常获取", function(done){
//		//	Api.getFirstIAPRewards(function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it("getFirstIAPRewards 奖励已经领取", function(done){
//		//	Api.getFirstIAPRewards(function(doc){
//		//		doc.code.should.equal(Errors.firstIAPRewardAlreadyGet.code)
//		//		done()
//		//	})
//		//})
//
//		it("getDailyTaskRewards 正常领取1", function(done){
//			Api.getDailyTaskRewards(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getDailyTaskRewards 正常领取2", function(done){
//			Api.getDailyTaskRewards(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getDailyTaskRewards 正常领取3", function(done){
//			Api.getDailyTaskRewards(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getDailyTaskRewards 正常领取4", function(done){
//			Api.getDailyTaskRewards(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getDailyTaskRewards 日常任务还未完成", function(done){
//			Api.getDailyTaskRewards(function(doc){
//				doc.code.should.equal(Errors.dailyTaskNotFinished.code)
//				done()
//			})
//		})
//
//		it("getGrowUpTaskRewards 任务未完成或奖励已领取", function(done){
//			Api.getGrowUpTaskRewards(Consts.GrowUpTaskTypes.CityBuild, 123, function(doc){
//				doc.code.should.equal(Errors.growUpTaskNotExist.code)
//				done()
//			})
//		})
//
//		it("getGrowUpTaskRewards 还有前置任务奖励未领取", function(done){
//			Api.getGrowUpTaskRewards(Consts.GrowUpTaskTypes.CityBuild, 717, function(doc){
//				doc.code.should.equal(Errors.growUpTaskRewardCanNotBeGetForPreTaskRewardNotGet.code)
//				done()
//			})
//		})
//
//		it("getGrowUpTaskRewards 正常领取", function(done){
//			Api.getGrowUpTaskRewards(Consts.GrowUpTaskTypes.CityBuild, 716, function(doc){
//				doc.code.should.equal(200)
//				Api.getGrowUpTaskRewards(Consts.GrowUpTaskTypes.CityBuild, 717, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("getPlayerRankList 获取Power排行", function(done){
//			Api.getPlayerRankList(Consts.RankTypes.Power, 0, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getPlayerRankList 获取Kill排行", function(done){
//			Api.getPlayerRankList(Consts.RankTypes.Kill, 0, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getAllianceRankList 获取Power排行", function(done){
//			Api.getAllianceRankList(Consts.RankTypes.Power, 0, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getAllianceRankList 获取Kill排行", function(done){
//			Api.getAllianceRankList(Consts.RankTypes.Kill, 0, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getServers", function(done){
//			Api.getServers(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("switchServer 服务器不存在", function(done){
//			Api.switchServer("Worlda", function(doc){
//				doc.code.should.equal(Errors.serverNotExist.code)
//				done()
//			})
//		})
//
//		it("switchServer 不能切换到相同的服务器", function(done){
//			Api.switchServer("cache-server-2", function(doc){
//				doc.code.should.equal(Errors.canNotSwitchToTheSameServer.code)
//				done()
//			})
//		})
//
//		it("switchServer 正常切换", function(done){
//			Api.switchServer("cache-server-1", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("setPlayerIcon 正常设置", function(done){
//			setTimeout(function(){
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					Api.setPlayerIcon(2, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			}, 100)
//		})
//
//		it("unlockPlayerSecondMarchQueue 正常解锁", function(done){
//			Api.unlockPlayerSecondMarchQueue(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getPlayerWallInfo 正常完成", function(done){
//			Api.getPlayerWallInfo(m_user._id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("buyAndUseItem sweepScroll 当前PvE关卡还不能被扫荡", function(done){
//			Api.buyAndUseItem("sweepScroll", {
//				sweepScroll:{
//					sectionName:'1_4',
//					count:10
//				}
//			}, function(doc){
//				doc.code.should.equal(Errors.currentPvESectionCanNotBeSweepedYet.code)
//				done()
//			})
//		})
//
//		it("attackPveSection 关卡未解锁", function(done){
//			Api.sendChat("soldiers 1000", function(doc){
//				doc.code.should.equal(200)
//				Api.attackPveSection('1_5', 'blueDragon', [
//					{name:'swordsman_1', count:200},
//					{name:'sentinel_1', count:200},
//					{name:'ranger_1', count:200}
//				], function(doc){
//					doc.code.should.equal(Errors.pveSecionIsLocked.code);
//					done()
//				})
//			})
//		})
//
//		it("attackPveSection 正常进攻", function(done){
//			Api.attackPveSection('1_1', 'blueDragon', [
//				{name:'swordsman_1', count:50},
//				{name:'sentinel_1', count:50},
//				{name:'ranger_1', count:50},
//				{name:'ranger_1', count:50},
//				{name:'ranger_1', count:50},
//				{name:'swordsman_1', count:50}
//			], function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("buyAndUseItem sweepScroll 当前关卡已达最大战斗次数", function(done){
//			Api.buyAndUseItem("sweepScroll", {
//				sweepScroll:{
//					sectionName:'1_1',
//					count:10
//				}
//			}, function(doc){
//				doc.code.should.equal(Errors.currentSectionReachMaxFightCount.code)
//				done()
//			})
//		})
//
//		it("buyAndUseItem sweepScroll 正常扫荡", function(done){
//			Api.buyAndUseItem("sweepScroll", {
//				sweepScroll:{
//					sectionName:'1_1',
//					count:9
//				}
//			}, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("attackPveSection 当前关卡已达最大战斗次数", function(done){
//			Api.attackPveSection('1_1', 'blueDragon', [
//				{name:'swordsman_1', count:200},
//				{name:'sentinel_1', count:200},
//				{name:'ranger_1', count:200}
//			], function(doc){
//				doc.code.should.equal(Errors.currentSectionReachMaxFightCount.code);
//				done()
//			})
//		})
//
//		it("searchPlayerByName 正常搜索", function(done){
//			Api.searchPlayerByName('林', 0, function(doc){
//				doc.code.should.equal(200);
//				done()
//			})
//		})
//
//		it("getServerNotices 正常获取", function(done){
//			Api.getServerNotices(function(doc){
//				doc.code.should.equal(200);
//				done()
//			})
//		})
//
//		it("getActivities 正常查看", function(done){
//			Api.getActivities(function(doc){
//				doc.code.should.equal(200);
//				done()
//			})
//		})
//
//		it("getPlayerActivityRankList 正常查看", function(done){
//			Api.getPlayerActivityRankList('gacha', 0, function(doc){
//				doc.code.should.equal(200);
//				done()
//			})
//		})
//
//		it("getPlayerRank 正常查看", function(done){
//			Api.getPlayerRank('gacha', function(doc){
//				doc.code.should.equal(200);
//				done()
//			})
//		})
//
//		//it("getPlayerActivityScoreRewards 没有可领取的奖励", function(done){
//		//	Api.getPlayerActivityScoreRewards('gacha', function(doc){
//		//		doc.code.should.equal(Errors.noAvailableRewardsCanGet.code);
//		//		done()
//		//	})
//		//})
//
//		//it("getPlayerActivityScoreRewards 正常领取", function(done){
//		//	Api.sendChat("resources casinoToken 1000000", function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.gacha(Consts.GachaType.Advanced, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.getPlayerActivityScoreRewards('gacha', function(doc){
//		//				doc.code.should.equal(200);
//		//				done()
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("getPlayerActivityRankRewards 无效的活动信息", function(done){
//		//	Api.getPlayerActivityRankRewards('gacha', function(doc){
//		//		doc.code.should.equal(Errors.invalidActivity.code);
//		//		done()
//		//	})
//		//})
//
//		//it("getPlayerActivityRankRewards 正常领取", function(done){
//		//	Api.getPlayerActivityRankRewards('gacha', function(doc){
//		//		doc.code.should.equal(200);
//		//		done()
//		//	})
//		//})
//	})
//
//	after(function(){
//		pomelo.disconnect()
//	})
//})