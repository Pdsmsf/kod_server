///**
// * Created by modun on 14-7-25.
// */
//
//var pomelo = require("../pomelo-client")
//var mongoose = require("mongoose")
//var Promise = require("bluebird")
//var should = require('should')
//var _ = require("underscore")
//
//var Consts = require("../../game-server/app/consts/consts")
//var Config = require("../config")
//var Api = require("../api")
//var MapUtils = require("../../game-server/app/utils/mapUtils")
//var Device = Promise.promisifyAll(require("../../game-server/app/domains/device"))
//var Player = Promise.promisifyAll(require("../../game-server/app/domains/player"))
//var Alliance = Promise.promisifyAll(require("../../game-server/app/domains/alliance"))
//var Billing = Promise.promisifyAll(require("../../game-server/app/domains/billing"))
//
//var GameDatas = require("../../game-server/app/datas/GameDatas")
//var Errors = GameDatas.Errors.errors
//
//describe("AllianceService", function(){
//	var m_user
//	var m_alliance_1;
//	var m_alliance_2;
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
//				done()
//			})
//		})
//	})
//
//
//	describe("entryHandler", function(){
//		it("login", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				m_user = doc.playerData
//				done()
//			})
//		})
//	})
//
//
//	describe("allianceHandler", function(){
//		it("initPlayerData 正常初始化1", function(done){
//			Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(doc){
//				doc.code.should.equal(200)
//				setTimeout(done, 500);
//			})
//		})
//
//		it("setPushId 正常设置", function(done){
//			//59e054ff452819e4458624b6e4368caccb7c4c9abcd3346602067c152c2a07b6
//			//https://hk2.notify.windows.com/?token=AwYAAAAFTXjl1D5aNsiB6HSU%2bHPadto5Wa4hWZUL1hxs077s%2f7lUJOzRwHJOd0hssUTLYZ0VGV2WukOYKrKxFSvcy%2bgnSG6afRf6DyvvO7r9tqgIcOiL9zuJ5pqsBmhYim4Prwg%3d
//			Api.setPushId("59e054ff452819e4458624b6e4368caccb7c4c9abcd3346602067c152c2a07b6", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("createAlliance 正常创建", function(done){
//			Api.createAlliance(Config.allianceName, Config.allianceTag, Consts.AllianceCountry.ALL, "grassLand", "e", function(doc){
//				doc.code.should.equal(200)
//				m_alliance_1 = doc.allianceData;
//				done()
//			})
//		})
//
//		it("createAlliance 联盟名称已经存在", function(done){
//			Api.loginPlayer(Config.deviceId2, function(doc){
//				doc.code.should.equal(200)
//				Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(doc){
//					doc.code.should.equal(200)
//					Api.createAlliance(Config.allianceName, Config.allianceTag, Consts.AllianceCountry.ALL, "grassLand", "e", function(doc){
//						doc.code.should.equal(Errors.allianceNameExist.code)
//						done()
//					})
//				})
//			})
//		})
//
//		it("createAlliance 联盟标签已经存在", function(done){
//			Api.createAlliance("Hello", Config.allianceTag, Consts.AllianceCountry.ALL, "grassLand", "e", function(doc){
//				doc.code.should.equal(Errors.allianceTagExist.code)
//				done()
//			})
//		})
//
//		it("sendAllianceMail 玩家未加入联盟", function(done){
//			Api.sendAllianceMail("alliance mail", "this is a alliance mail", function(doc){
//				doc.code.should.equal(Errors.playerNotJoinAlliance.code)
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					m_user = doc.playerData
//					done()
//				})
//			})
//		})
//
//		it("sendAllianceMail 此操作权限不足", function(done){
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(doc){
//					doc.code.should.equal(200)
//					Api.joinAllianceDirectly(m_user.allianceId, function(doc){
//						doc.code.should.equal(200)
//						Api.sendAllianceMail("alliance mail", "this is a alliance mail", function(doc){
//							doc.code.should.equal(Errors.allianceOperationRightsIllegal.code)
//							done()
//						})
//					})
//				})
//			})
//		})
//
//		it("sendAllianceMail 正常发送", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				Api.sendAllianceMail("alliance mail", "this is a alliance mail", function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("editAllianceBasicInfo 玩家未加入联盟", function(done){
//			Api.loginPlayer(Config.deviceId2, function(doc){
//				doc.code.should.equal(200)
//				Api.editAllianceBasicInfo(Config.allianceName, Config.allianceTag, Consts.AllianceCountry.ALL, "e", function(doc){
//					doc.code.should.equal(Errors.playerNotJoinAlliance.code)
//					done()
//				})
//			})
//		})
//
//		it("editAllianceBasicInfo 此操作权限不足", function(done){
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				Api.editAllianceBasicInfo(Config.allianceName, Config.allianceTag, Consts.AllianceCountry.ALL, "e", function(doc){
//					doc.code.should.equal(Errors.allianceOperationRightsIllegal.code)
//					done()
//				})
//			})
//		})
//
//		it('crateAlliance 正常创建2', function(done){
//			Api.loginPlayer(Config.deviceId4, function(doc){
//				doc.code.should.equal(200)
//				Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(doc){
//					doc.code.should.equal(200)
//					Api.sendChat('soldiers 50', function(doc){
//						doc.code.should.equal(200)
//						Api.createAlliance("31231", Config.allianceTag2, Consts.AllianceCountry.ALL, "grassLand", "e", function(doc){
//							doc.code.should.equal(200)
//							m_alliance_2 = doc.allianceData;
//							done();
//						})
//					})
//				})
//			})
//		})
//
//		it('enterMapIndex 正常观察', function(done){
//			Api.enterMapIndex(m_alliance_1.mapIndex, function(doc){
//				doc.code.should.equal(200);
//				done();
//			})
//		})
//
//		it('enterMapIndex 不能观察自己的联盟', function(done){
//			Api.enterMapIndex(m_alliance_2.mapIndex, function(doc){
//				doc.code.should.equal(Errors.canNotViewYourOwnAlliance.code);
//				done();
//			})
//		})
//
//		it('leaveMapIndex 正常离开', function(done){
//			Api.leaveMapIndex(m_alliance_1.mapIndex, function(doc){
//				doc.code.should.equal(200);
//				done();
//			})
//		})
//
//		it('getMapAllianceDatas 正常获取', function(done){
//			Api.getMapAllianceDatas([m_alliance_1.mapIndex], function(doc){
//				doc.code.should.equal(200);
//				done();
//			})
//		})
//
//		//it('moveAlliance 正常移动', function(done){
//		//	Api.moveAlliance(m_alliance_1.mapIndex + 10, function(doc){
//		//		doc.code.should.equal(200);
//		//		done();
//		//	})
//		//})
//
//		it("editAllianceBasicInfo 联盟名称已经存在", function(done){
//			Api.editAllianceBasicInfo(Config.allianceName, "adf", Consts.AllianceCountry.ALL, "e", function(doc){
//				doc.code.should.equal(Errors.allianceNameExist.code)
//				done()
//			})
//		})
//
//		it("editAllianceBasicInfo 联盟标签已经存在", function(done){
//			Api.editAllianceBasicInfo("adfad", Config.allianceTag, Consts.AllianceCountry.ALL, "e", function(doc){
//				doc.code.should.equal(Errors.allianceTagExist.code)
//				done()
//			})
//		})
//
//		it("editAllianceBasicInfo 正常修改", function(done){
//			Api.editAllianceBasicInfo(Config.allianceName2, Config.allianceTag2, Consts.AllianceCountry.ALL, "e", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("editAllianceTerrian 联盟荣耀值不足", function(done){
//			Api.editAllianceTerrian("grassLand", function(doc){
//				doc.code.should.equal(Errors.allianceHonourNotEnough.code)
//				done()
//			})
//		})
//
//		it("editAllianceTerrian 正常编辑", function(done){
//			Api.sendChat("alliancehonour 5000", function(doc){
//				doc.code.should.equal(200)
//				Api.editAllianceTerrian("grassLand", function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("editAllianceNotice 正常发布公告", function(done){
//			Api.editAllianceNotice("这是第一条公告", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("editAllianceDescription 正常修改联盟描述", function(done){
//			Api.editAllianceDescription("这是第一条描述", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("editAllianceJoinType 正常修改联盟描述", function(done){
//			Api.editAllianceJoinType("all", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("editAllianceMemberTitle 联盟没有此玩家", function(done){
//			Api.editAllianceMemberTitle("asdfasdf", "member", function(doc){
//				doc.code.should.equal(Errors.allianceDoNotHasThisMember.code)
//				done()
//			})
//		})
//
//		it("editAllianceMemberTitle 不能将玩家的职级调整到与自己平级或者比自己高", function(done){
//			var memberDoc = null
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				memberDoc = doc.playerData
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					Api.editAllianceMemberTitle(memberDoc._id, "archon", function(doc){
//						doc.code.should.equal(Errors.allianceOperationRightsIllegal.code)
//						done()
//					})
//				})
//			})
//		})
//
//		it("editAllianceMemberTitle 正常编辑", function(done){
//			var memberDoc = null
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				memberDoc = doc.playerData
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					Api.editAllianceMemberTitle(memberDoc._id, Consts.AllianceTitle.Elite, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("kickAllianceMemberOff 联盟没有此玩家", function(done){
//			Api.kickAllianceMemberOff("asdfasdf", function(doc){
//				doc.code.should.equal(Errors.allianceDoNotHasThisMember.code)
//				done()
//			})
//		})
//
//		it("kickAllianceMemberOff 正常踢出", function(done){
//			var memberDoc = null
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				memberDoc = doc.playerData
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					Api.kickAllianceMemberOff(memberDoc._id, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("handOverArchon 别逗了,你是不盟主好么", function(done){
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				Api.joinAllianceDirectly(m_user.allianceId, function(doc){
//					doc.code.should.equal(200)
//					Api.handOverAllianceArchon("asdfasdf", function(doc){
//						doc.code.should.equal(Errors.youAreNotTheAllianceArchon.code)
//						done()
//					})
//				})
//			})
//		})
//
//		it("handOverArchon 玩家不存在", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				Api.handOverAllianceArchon("asdfasdf", function(doc){
//					doc.code.should.equal(Errors.allianceDoNotHasThisMember.code)
//					done()
//				})
//			})
//		})
//
//		it("handOverArchon 正常移交", function(done){
//			var memberDoc = null
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				memberDoc = doc.playerData
//				Api.loginPlayer(Config.deviceId, function(doc){
//					doc.code.should.equal(200)
//					Api.handOverAllianceArchon(memberDoc._id, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("quitAlliance 正常退出", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				Api.quitAlliance(function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("joinAllianceDirectly 联盟不允许直接加入", function(done){
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				Api.editAllianceJoinType("audit", function(doc){
//					doc.code.should.equal(200)
//					Api.loginPlayer(Config.deviceId, function(doc){
//						doc.code.should.equal(200)
//						Api.joinAllianceDirectly(m_user.allianceId, function(doc){
//							doc.code.should.equal(Errors.allianceDoNotAllowJoinDirectly.code)
//							Api.loginPlayer(Config.deviceId3, function(doc){
//								doc.code.should.equal(200)
//								Api.editAllianceJoinType("all", function(doc){
//									doc.code.should.equal(200)
//									done()
//								})
//							})
//						})
//					})
//				})
//			})
//		})
//
//		it("joinAllianceDirectly 正常加入", function(done){
//			Api.loginPlayer(Config.deviceId, function(doc){
//				doc.code.should.equal(200)
//				Api.joinAllianceDirectly(m_user.allianceId, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("requestToJoinAlliance 玩家已加入联盟", function(done){
//			Api.requestToJoinAlliance(m_user.allianceId, function(doc){
//				doc.code.should.equal(Errors.playerAlreadyJoinAlliance.code)
//				done()
//			})
//		})
//
//		it("requestToJoinAlliance 对此联盟的申请已发出,请耐心等候审核", function(done){
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				Api.editAllianceJoinType("audit", function(doc){
//					doc.code.should.equal(200)
//					Api.loginPlayer(Config.deviceId5, function(doc){
//						doc.code.should.equal(200)
//						Api.initPlayerData(Consts.AllianceTerrain.Desert, Consts.PlayerLanguage.Cn, function(){
//							Api.requestToJoinAlliance(m_user.allianceId, function(doc){
//								doc.code.should.equal(200)
//								Api.requestToJoinAlliance(m_user.allianceId, function(doc){
//									doc.code.should.equal(Errors.joinTheAllianceRequestAlreadySend.code)
//									done()
//								})
//							})
//						})
//					})
//				})
//			})
//		})
//
//		it("cancelJoinAllianceRequest 正常取消", function(done){
//			Api.cancelJoinAllianceRequest(m_user.allianceId, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("removeJoinAllianceReqeusts 正常处理", function(done){
//			var memberDoc = null
//			Api.loginPlayer(Config.deviceId5, function(doc){
//				doc.code.should.equal(200)
//				memberDoc = doc.playerData
//				Api.requestToJoinAlliance(m_user.allianceId, function(doc){
//					doc.code.should.equal(200)
//					Api.loginPlayer(Config.deviceId3, function(doc){
//						doc.code.should.equal(200)
//						Api.removeJoinAllianceReqeusts([memberDoc._id], function(doc){
//							doc.code.should.equal(200)
//							done()
//						})
//					})
//				})
//			})
//		})
//
//		it("approveJoinAllianceRequest 正常处理", function(done){
//			var memberDoc = null
//			Api.loginPlayer(Config.deviceId5, function(doc){
//				doc.code.should.equal(200)
//				memberDoc = doc.playerData
//				Api.requestToJoinAlliance(m_user.allianceId, function(doc){
//					doc.code.should.equal(200)
//					Api.loginPlayer(Config.deviceId3, function(doc){
//						doc.code.should.equal(200)
//						Api.approveJoinAllianceRequest(memberDoc._id, function(doc){
//							doc.code.should.equal(200)
//							done()
//						})
//					})
//				})
//			})
//		})
//
//		it("inviteToJoinAlliance 正常邀请", function(done){
//			var memberDoc = null
//			Api.loginPlayer(Config.deviceId5, function(doc){
//				doc.code.should.equal(200)
//				memberDoc = doc.playerData
//				Api.quitAlliance(function(doc){
//					doc.code.should.equal(200)
//					Api.loginPlayer(Config.deviceId3, function(doc){
//						doc.code.should.equal(200)
//						Api.inviteToJoinAlliance(memberDoc._id, function(doc){
//							doc.code.should.equal(200)
//							done()
//						})
//					})
//				})
//			})
//		})
//
//		it("handleJoinAllianceInvite 正常处理 拒绝邀请", function(done){
//			Api.loginPlayer(Config.deviceId5, function(doc){
//				doc.code.should.equal(200)
//				Api.handleJoinAllianceInvite(m_user.allianceId, false, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("handleJoinAllianceInvite 正常处理 同意邀请", function(done){
//			var memberDoc = null
//			Api.loginPlayer(Config.deviceId5, function(doc){
//				doc.code.should.equal(200)
//				memberDoc = doc.playerData
//				Api.loginPlayer(Config.deviceId3, function(doc){
//					doc.code.should.equal(200)
//					Api.inviteToJoinAlliance(memberDoc._id, function(doc){
//						doc.code.should.equal(200)
//						Api.loginPlayer(Config.deviceId4, function(doc){
//							doc.code.should.equal(200)
//							Api.inviteToJoinAlliance(memberDoc._id, function(doc){
//								doc.code.should.equal(200)
//								Api.loginPlayer(Config.deviceId5, function(doc){
//									doc.code.should.equal(200)
//									Api.handleJoinAllianceInvite(m_user.allianceId, true, function(doc){
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
//		it("getAllianceRankList 获取Power排行", function(done){
//			Api.getMyAllianceData(function(doc){
//				doc.code.should.equal(200)
//				Api.getAllianceRankList(Consts.RankTypes.Power, 0, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("getAllianceRankList 获取Kill排行", function(done){
//			Api.getMyAllianceData(function(doc){
//				doc.code.should.equal(200)
//				Api.getAllianceRankList(Consts.RankTypes.Kill, 0, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("buyAllianceArchon 购买盟主职位,无法购买", function(done){
//			Api.buyAllianceArchon(function(doc){
//				doc.code.should.equal(Errors.onlyAllianceArchonMoreThanSevenDaysNotOnLinePlayerCanBuyArchonTitle.code)
//				done();
//			})
//		})
//
//		it("searchAllianceByTag 正常搜索", function(done){
//			Api.searchAllianceByTag("t", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getCanDirectJoinAlliances 正常获取", function(done){
//			Api.getCanDirectJoinAlliances(0, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeBuilding 加入联盟后", function(done){
//			var playerDoc = null
//			Api.sendChat('resources gem 100000', function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeBuilding(1, true, function(doc){
//					doc.code.should.equal(200)
//					Api.upgradeBuilding(3, false, function(doc){
//						doc.code.should.equal(200)
//						Api.loginPlayer(Config.deviceId5, function(doc){
//							doc.code.should.equal(200)
//							playerDoc = doc.playerData
//							var buildEvent = playerDoc.buildingEvents[0]
//							Api.requestAllianceToSpeedUp(Consts.AllianceHelpEventType.BuildingEvents, buildEvent.id, function(doc){
//								doc.code.should.equal(200)
//								done()
//							})
//						})
//					})
//				})
//			})
//		})
//
//		it("createHouse 加入联盟后", function(done){
//			var playerDoc = null
//			Api.createHouse("dwelling", 3, 2, false, function(doc){
//				doc.code.should.equal(200)
//				Api.loginPlayer(Config.deviceId5, function(doc){
//					doc.code.should.equal(200)
//					playerDoc = doc.playerData
//					var buildEvent = _.find(playerDoc.houseEvents, function(event){
//						return event.finishTime > Date.now()
//					})
//					Api.requestAllianceToSpeedUp(Consts.AllianceHelpEventType.HouseEvents, buildEvent.id, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("upgradeHouse 加入联盟后", function(done){
//			var playerDoc = null
//			Api.createHouse("dwelling", 3, 1, true, function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeHouse(3, 1, false, function(doc){
//					doc.code.should.equal(200)
//					Api.loginPlayer(Config.deviceId5, function(doc){
//						doc.code.should.equal(200)
//						playerDoc = doc.playerData
//						var buildEvent = _.find(playerDoc.houseEvents, function(event){
//							return event.finishTime > Date.now()
//						})
//						Api.requestAllianceToSpeedUp(Consts.AllianceHelpEventType.HouseEvents, buildEvent.id, function(doc){
//							doc.code.should.equal(200)
//							done()
//						})
//					})
//				})
//			})
//		})
//
//		it("helpAllianceMemberSpeedUp 正常帮助1", function(done){
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				Api.getMyAllianceData(function(doc){
//					doc.code.should.equal(200)
//					m_alliance_1 = doc.allianceData
//					var event = m_alliance_1.helpEvents[0]
//					Api.helpAllianceMemberSpeedUp(event.id, function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("helpAllAllianceMemberSpeedUp 正常帮助", function(done){
//			Api.helpAllAllianceMemberSpeedUp(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("donateToAlliance 资源不足", function(done){
//			Api.sendChat("resources wood 500", function(doc){
//				doc.code.should.equal(200)
//				Api.donateToAlliance("wood", function(doc){
//					doc.code.should.equal(Errors.resourceNotEnough.code)
//					done()
//				})
//			})
//		})
//
//		it("donateToAlliance 正常捐赠1", function(done){
//			Api.sendChat("resources wood 5000000", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("donatelevel 6", function(doc){
//					doc.code.should.equal(200)
//					Api.donateToAlliance("wood", function(doc){
//						doc.code.should.equal(200)
//						done()
//					})
//				})
//			})
//		})
//
//		it("donateToAlliance 正常捐赠2", function(done){
//			Api.donateToAlliance("wood", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("donateToAlliance 正常捐赠3", function(done){
//			Api.sendChat("donatelevel 1", function(doc){
//				doc.code.should.equal(200)
//				Api.donateToAlliance("gem", function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("upgradeAllianceBuilding 联盟荣耀值不足", function(done){
//			Api.sendChat("allianceHonour 10", function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeAllianceBuilding(Consts.AllianceBuildingNames.Palace, function(doc){
//					doc.code.should.equal(Errors.allianceHonourNotEnough.code)
//					done()
//				})
//			})
//		})
//
//		it("upgradeAllianceBuilding 正常升级1", function(done){
//			Api.sendChat("allianceHonour 50000000", function(doc){
//				doc.code.should.equal(200)
//				Api.upgradeAllianceBuilding(Consts.AllianceBuildingNames.Palace, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("upgradeAllianceBuilding 正常升级2", function(done){
//			Api.upgradeAllianceBuilding(Consts.AllianceBuildingNames.OrderHall, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeAllianceBuilding 正常升级3", function(done){
//			Api.upgradeAllianceBuilding(Consts.AllianceBuildingNames.OrderHall, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeAllianceBuilding 正常升级4", function(done){
//			Api.upgradeAllianceBuilding(Consts.AllianceBuildingNames.Shop, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("upgradeAllianceVillage 正常升级", function(done){
//			Api.upgradeAllianceVillage("woodVillage", function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getFirstJoinAllianceReward 正常领取", function(done){
//			Api.getFirstJoinAllianceReward(function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("addShopItem 普通道具不需要进货补充", function(done){
//			Api.addShopItem("woodClass_3", 1, function(doc){
//				doc.code.should.equal(Errors.normalItemsNotNeedToAdd.code)
//				done()
//			})
//		})
//
//		it("addAllianceItem 此道具未在联盟商店出售", function(done){
//			Api.sendChat("allianceHonour 500000", function(doc){
//				doc.code.should.equal(200)
//				Api.addShopItem("vipPoint_3", 1, function(doc){
//					doc.code.should.equal(Errors.theItemNotSellInAllianceShop.code)
//					done()
//				})
//			})
//		})
//
//		it("addAllianceItem 正常添加", function(done){
//			Api.sendChat("alliancehonour 500000", function(doc){
//				doc.code.should.equal(200)
//				Api.addShopItem("dragonChest_1", 1, function(doc){
//					doc.code.should.equal(200)
//					done()
//				})
//			})
//		})
//
//		it("buyShopItem 玩家忠诚值不足", function(done){
//			Api.buyShopItem("dragonChest_1", 1, function(doc){
//				doc.code.should.equal(Errors.playerLoyaltyNotEnough.code)
//				done()
//			})
//		})
//
//		it("buyShopItem 正常购买", function(done){
//			Api.sendChat("resources gem 5000000", function(doc){
//				doc.code.should.equal(200)
//				Api.sendChat("donatelevel 6", function(doc){
//					doc.code.should.equal(200)
//					Api.donateToAlliance("gem", function(doc){
//						doc.code.should.equal(200)
//						Api.donateToAlliance("gem", function(doc){
//							doc.code.should.equal(200)
//							Api.donateToAlliance("gem", function(doc){
//								doc.code.should.equal(200)
//								Api.buyShopItem("dragonChest_1", 1, function(doc){
//									doc.code.should.equal(200)
//									done()
//								})
//							})
//						})
//					})
//				})
//			})
//		})
//
//		//it("giveLoyaltyToAllianceMember 正常给予1", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData
//		//		Api.giveLoyaltyToAllianceMember(m_alliance_1.members[0].id, 10, function(doc){
//		//			doc.code.should.equal(200)
//		//			done()
//		//		})
//		//	})
//		//})
//		//
//		//it("giveLoyaltyToAllianceMember 正常给予2", function(done){
//		//	Api.giveLoyaltyToAllianceMember(m_alliance_1.members[1].id, 10, function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//
//		it("getAllianceInfo 正常查看", function(done){
//			Api.getAllianceInfo(m_alliance_1._id, m_alliance_1.serverId, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getShrineReports 正常查看", function(done){
//			Api.getShrineReports(m_alliance_1._id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getAllianceFightReports 正常查看", function(done){
//			Api.getAllianceFightReports(m_alliance_1._id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		it("getItemLogs 正常查看", function(done){
//			Api.getItemLogs(m_alliance_1._id, function(doc){
//				doc.code.should.equal(200)
//				done()
//			})
//		})
//
//		//it("activateAllianceShrineStage 联盟感知力不足", function(done){
//		//	Api.sendChat("allianceperception 0", function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.activateAllianceShrineStage("1_1", function(doc){
//		//			doc.code.should.equal(Errors.alliancePerceptionNotEnough.code)
//		//			done()
//		//		})
//		//	})
//		//})
//
//		//it("activateAllianceShrineStage 正常激活", function(done){
//		//	Api.sendChat("allianceperception 1000", function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.activateAllianceShrineStage("1_1", function(doc){
//		//			doc.code.should.equal(200)
//		//			done()
//		//		})
//		//	})
//		//})
//		//
//		//it("activateAllianceShrineStage 此联盟事件已经激活", function(done){
//		//	Api.activateAllianceShrineStage("1_1", function(doc){
//		//		doc.code.should.equal(Errors.theAllianceShrineEventAlreadyActived.code)
//		//		done()
//		//	})
//		//})
//
//		//it("attackAllianceShrine 正常行军1", function(done){
//		//	Api.sendChat("dragonstar blueDragon 1", function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("soldiers 1000", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.getMyAllianceData(function(doc){
//		//				doc.code.should.equal(200)
//		//				m_alliance_1 = doc.allianceData
//		//				Api.attackAllianceShrine(m_alliance_1.shrineEvents[0].id, "blueDragon", [
//		//					{
//		//						name:"swordsman_1",
//		//						count:50
//		//					},
//		//					{
//		//						name:"sentinel_1",
//		//						count:50
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:50
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:50
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:50
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:50
//		//					}
//		//				], function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				})
//		//			})
//		//		})
//		//	})
//		//})
//		//
//		//it("attackAllianceShrine 正常行军2", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar blueDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackAllianceShrine(m_alliance_1.shrineEvents[0].id, "blueDragon", [
//		//					{
//		//						name:"swordsman_1",
//		//						count:20
//		//					},
//		//					{
//		//						name:"sentinel_1",
//		//						count:20
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:20
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:50
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:50
//		//					}
//		//				], function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				})
//		//			})
//		//		})
//		//	})
//		//})
//		//
//		//it("attackAllianceShrine 正常行军3", function(done){
//		//	Api.loginPlayer(Config.deviceId5, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar blueDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackAllianceShrine(m_alliance_1.shrineEvents[0].id, "blueDragon", [
//		//					{
//		//						name:"swordsman_1",
//		//						count:20
//		//					},
//		//					{
//		//						name:"sentinel_1",
//		//						count:20
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:20
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:50
//		//					}
//		//				], function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				})
//		//			})
//		//		})
//		//	})
//		//})
//
//		it("attackAlliance 正常进攻", function(done){
//			Api.loginPlayer(Config.deviceId3, function(doc){
//				doc.code.should.equal(200)
//				Api.attackAlliance(m_alliance_2._id, function(doc){
//					doc.code.should.equal(200);
//					done()
//				})
//			})
//		})
//
//		//it("getAllianceViewData 正常获取", function(done){
//		//	var m_allianceData = null
//		//	Api.getMyAllianceData(function(doc){
//		//		doc.code.should.equal(200)
//		//		m_allianceData = doc.allianceData
//		//		Api.getAllianceViewData(m_allianceData._id, function(doc){
//		//			doc.code.should.equal(200)
//		//			done()
//		//		})
//		//	})
//		//})
//		//
//		//it("searchAllianceInfoByTag 正常搜索", function(done){
//		//	Api.searchAllianceInfoByTag("t", function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//
//		//it("helpAllianceMemberDefence 正常协助", function(done){
//		//	Api.sendChat("dragonstar blueDragon 1", function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("soldiers 1000", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.helpAllianceMemberDefence(
//		//				"blueDragon",
//		//				[
//		//					{
//		//						name:"swordsman_1",
//		//						count:5
//		//					},
//		//					{
//		//						name:"sentinel_1",
//		//						count:5
//		//					},
//		//					{
//		//						name:"ranger_1",
//		//						count:5
//		//					}
//		//				],
//		//				m_alliance_1.members[1].id,
//		//				function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				})
//		//		})
//		//	})
//		//})
//
//		//it("getHelpDefenceMarchEventDetail 正常获取", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.getHelpDefenceMarchEventDetail(m_alliance_1._id, m_alliance_1.marchEvents.attackMarchEvents[0].id, function(doc){
//		//			doc.code.should.equal(200)
//		//			done()
//		//		})
//		//	})
//		//})
//
//		//it("useItem retreatTroop", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.buyItem("retreatTroop", 1, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.useItem("retreatTroop", {
//		//				retreatTroop:{
//		//					eventType:"attackMarchEvents",
//		//					eventId:m_alliance_1.marchEvents.attackMarchEvents[0].id
//		//				}
//		//			}, function(doc){
//		//				doc.code.should.equal(200)
//		//				done()
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("useItem warSpeedupClass_2", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.buyItem("warSpeedupClass_2", 1, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.useItem("warSpeedupClass_2", {
//		//				warSpeedupClass_2:{
//		//					eventType:"attackMarchEvents",
//		//					eventId:m_alliance_1.marchEvents.attackMarchEvents[0].id
//		//				}
//		//			}, function(doc){
//		//				doc.code.should.equal(200)
//		//				done()
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("useItem moveTheCity", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.buyItem("moveTheCity", 1, function(doc){
//		//			doc.code.should.equal(200)
//		//			var map = MapUtils.buildMap(m_alliance_1.mapObjects)
//		//			var rect = MapUtils.getRect(map, 1, 1)
//		//			Api.useItem("moveTheCity", {
//		//				moveTheCity:{
//		//					locationX:rect.x,
//		//					locationY:rect.y
//		//				}
//		//			}, function(doc){
//		//				doc.code.should.equal(200)
//		//				done()
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("getHelpDefenceTroopDetail 正常获取", function(done){
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId, function(doc){
//		//			doc.code.should.equal(200)
//		//			m_user = doc.playerData
//		//			Api.getHelpDefenceTroopDetail(m_user._id, function(doc){
//		//				doc.code.should.equal(200)
//		//				done()
//		//			})
//		//		})
//		//	}, 5.5 * 1000)
//		//})
//
//		//it("retreatFromBeHelpedAllianceMember 玩家没有协防部队驻扎在目标玩家城市", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.retreatFromBeHelpedAllianceMember(m_alliance_1.members[1].id, function(doc){
//		//			doc.code.should.equal(Errors.noHelpDefenceTroopInTargetPlayerCity.code)
//		//			done()
//		//		})
//		//	})
//		//})
//		//
//		//it("retreatFromHelpedAllianceMember 正常撤回", function(done){
//		//	setTimeout(function(){
//		//		Api.retreatFromBeHelpedAllianceMember(m_alliance_1.members[1].id, function(doc){
//		//			doc.code.should.equal(200)
//		//			done()
//		//		})
//		//	}, 6 * 1000)
//		//})
//
//		//it("setDefenceTroop 正常设置", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 100", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.setDefenceTroop("greenDragon", [{
//		//					name:'swordsman_1',
//		//					count:10
//		//				}], function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				})
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("strikePlayerCity 有协防玩家", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.sendChat("dragonstar blueDragon 2", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.helpAllianceMemberDefence(
//		//					"blueDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:5
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:5
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:5
//		//						}
//		//					],
//		//					m_alliance_1.members[1].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//					})
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			m_alliance_2 = doc.allianceData;
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.strikePlayerCity("greenDragon", m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("strikePlayerCity 无协防玩家,防守玩家有龙", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 10", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.setDefenceTroop("greenDragon", [{
//		//					name:'swordsman_1',
//		//					count:10
//		//				}], function(doc){
//		//					doc.code.should.equal(200)
//		//				})
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 2", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.strikePlayerCity("greenDragon", m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("strikePlayerCity 无协防玩家,防守玩家无龙", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.cancelDefenceTroop(function(doc){
//		//			doc.code.should.equal(200)
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 2", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.strikePlayerCity("greenDragon", m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//		//
//		//it("getStrikeMarchEventDetail 正常获取", function(done){
//		//	Api.loginPlayer(Config.deviceId4, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_2 = doc.allianceData;
//		//		Api.loginPlayer(Config.deviceId, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.getStrikeMarchEventDetail(m_alliance_2._id, m_alliance_2.marchEvents.strikeMarchEvents[0].id, function(doc){
//		//				doc.code.should.equal(200)
//		//				done()
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("readReports 正常阅读", function(done){
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			m_user = doc.playerData
//		//			Api.readReports([m_user.reports[0].id], function(doc){
//		//				doc.code.should.equal(200)
//		//				done()
//		//			})
//		//		})
//		//	}, 5 * 1000)
//		//})
//		//
//		//it("saveReport 正常收藏", function(done){
//		//	Api.saveReport(m_user.reports[0].id, function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it("unSaveReport 正常取消收藏", function(done){
//		//	Api.unSaveReport(m_user.reports[0].id, function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it("getReports 获取战报", function(done){
//		//	Api.getReports(0, function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it("getSavedReports 获取已存战报", function(done){
//		//	Api.getSavedReports(0, function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it("deleteReports 正常删除收藏战报", function(done){
//		//	Api.deleteReports([m_user.reports[0].id], function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//
//		//it("attackPlayerCity 有协防玩家,且协防玩家胜利", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.sendChat("dragonstar blueDragon 2", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.helpAllianceMemberDefence(
//		//					"blueDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:30
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:30
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:30
//		//						}
//		//					],
//		//					m_alliance_1.members[1].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//					})
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackPlayerCity("greenDragon", [
//		//						{
//		//							name:"swordsman_1",
//		//							count:20
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:20
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:20
//		//						}
//		//					], m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					})
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("attackPlayerCity 无协防玩家,防守玩家无驻防", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.cancelDefenceTroop(function(doc){
//		//			doc.code.should.equal(200)
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 2", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackPlayerCity("greenDragon", [
//		//						{
//		//							name:"swordsman_1",
//		//							count:500
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:500
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:500
//		//						}
//		//					], m_alliance_2._id, m_alliance_2.members[0].id, function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					})
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("attackPlayerCity 无协防玩家,防守玩家有驻防,防守失败", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 10", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.cancelDefenceTroop(function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.setDefenceTroop("greenDragon", [{
//		//						name:'swordsman_1',
//		//						count:10
//		//					}], function(doc){
//		//						doc.code.should.equal(200)
//		//					})
//		//				})
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackPlayerCity("greenDragon", [
//		//						{
//		//							name:"swordsman_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:100
//		//						}
//		//					], m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					})
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("attackPlayerCity 无协防玩家,防守玩家有驻防,防守成功", function(done){
//		//	Api.loginPlayer(Config.deviceId, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 100", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.cancelDefenceTroop(function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.setDefenceTroop("greenDragon", [
//		//						{
//		//							name:"swordsman_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:100
//		//						}
//		//					], function(doc){
//		//						doc.code.should.equal(200)
//		//					})
//		//				})
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackPlayerCity("greenDragon", [
//		//						{
//		//							name:"swordsman_1",
//		//							count:50
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:50
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:50
//		//						}
//		//					], m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					})
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("attackPlayerCity 有协防玩家,协防玩家失败,防守玩家无驻防", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.sendChat("dragonstar blueDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.helpAllianceMemberDefence(
//		//					"blueDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:10
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:10
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:10
//		//						}
//		//					],
//		//					m_alliance_1.members[1].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//						Api.loginPlayer(Config.deviceId, function(doc){
//		//							doc.code.should.equal(200)
//		//							Api.cancelDefenceTroop(function(doc){
//		//								doc.code.should.equal(200)
//		//							})
//		//						})
//		//					})
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackPlayerCity("greenDragon", [
//		//						{
//		//							name:"swordsman_1",
//		//							count:50
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:50
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:50
//		//						}
//		//					], m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					})
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("attackPlayerCity 有协防玩家,协防玩家失败,防守玩家有驻防,防守失败", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.sendChat("dragonstar blueDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.helpAllianceMemberDefence(
//		//					"blueDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:10
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:10
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:10
//		//						}
//		//					],
//		//					m_alliance_1.members[1].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//						Api.loginPlayer(Config.deviceId, function(doc){
//		//							doc.code.should.equal(200)
//		//							Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//								doc.code.should.equal(200)
//		//								Api.sendChat("soldiers 10", function(doc){
//		//									doc.code.should.equal(200)
//		//									Api.setDefenceTroop("greenDragon", [{
//		//										name:'swordsman_1',
//		//										count:10
//		//									}], function(doc){
//		//										doc.code.should.equal(200)
//		//									})
//		//								})
//		//							})
//		//						})
//		//					})
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackPlayerCity("greenDragon", [
//		//						{
//		//							name:"swordsman_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:100
//		//						}
//		//					], m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					})
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("attackPlayerCity 有协防玩家,协防玩家失败,防守玩家驻防,防守成功", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.sendChat("dragonstar blueDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.helpAllianceMemberDefence(
//		//					"blueDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:10
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:10
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:10
//		//						}
//		//					],
//		//					m_alliance_1.members[1].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//						Api.loginPlayer(Config.deviceId, function(doc){
//		//							doc.code.should.equal(200)
//		//							Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//								doc.code.should.equal(200)
//		//								Api.sendChat("soldiers 200", function(doc){
//		//									doc.code.should.equal(200)
//		//									Api.setDefenceTroop("greenDragon", [
//		//										{
//		//											name:"swordsman_1",
//		//											count:200
//		//										},
//		//										{
//		//											name:"sentinel_1",
//		//											count:200
//		//										},
//		//										{
//		//											name:"ranger_1",
//		//											count:200
//		//										}
//		//									], function(doc){
//		//										doc.code.should.equal(200)
//		//									})
//		//								})
//		//							})
//		//						})
//		//					})
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackPlayerCity("greenDragon", [
//		//						{
//		//							name:"swordsman_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:100
//		//						}
//		//					], m_alliance_1._id, m_alliance_1.members[1].id, function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					})
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("getAttackMarchEventDetail 正常获取", function(done){
//		//	Api.loginPlayer(Config.deviceId4, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_2 = doc.allianceData;
//		//		Api.loginPlayer(Config.deviceId, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.getAttackMarchEventDetail(m_alliance_2._id, m_alliance_2.marchEvents.attackMarchEvents[0].id, function(doc){
//		//				doc.code.should.equal(200)
//		//				done()
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("strikeVillage 突袭我方联盟村落,直接回家", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.strikeVillage(
//		//				"greenDragon",
//		//				m_alliance_1._id,
//		//				m_alliance_1.villages[0].id,
//		//				function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				}
//		//			)
//		//		})
//		//	})
//		//})
//
//		//it("strikeVillage 突袭敌对联盟村落,直接回家", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.strikeVillage(
//		//				"greenDragon",
//		//				m_alliance_2._id,
//		//				m_alliance_2.villages[0].id,
//		//				function(doc){
//		//					doc.code.should.equal(200)
//		//					done()
//		//				}
//		//			)
//		//		})
//		//	})
//		//})
//
//		//it("strikeVillage 敌方采集敌方村落,我方突袭", function(done){
//		//	Api.loginPlayer(Config.deviceId4, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackVillage(
//		//					"greenDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:20
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:20
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:20
//		//						}
//		//					],
//		//					m_alliance_2._id,
//		//					m_alliance_2.villages[0].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//					}
//		//				)
//		//			})
//		//		})
//		//	})
//		//
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId3, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.strikeVillage(
//		//					"greenDragon",
//		//					m_alliance_2._id,
//		//					m_alliance_2.villages[0].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					}
//		//				)
//		//			})
//		//		})
//		//	}, 2000)
//		//})
//
//		//it("attackVillage 进攻本联盟村落 采集完成自动回家", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackVillage(
//		//					"greenDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:5
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:5
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:5
//		//						}
//		//					],
//		//					m_alliance_1._id,
//		//					m_alliance_1.villages[0].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					}
//		//				)
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("attackVillage 进攻敌对联盟村落 采集完成自动回家", function(done){
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId3, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackVillage(
//		//						"greenDragon",
//		//						[
//		//							{
//		//								name:"swordsman_1",
//		//								count:15
//		//							},
//		//							{
//		//								name:"sentinel_1",
//		//								count:15
//		//							},
//		//							{
//		//								name:"ranger_1",
//		//								count:15
//		//							}
//		//						],
//		//						m_alliance_2._id,
//		//						m_alliance_2.villages[0].id,
//		//						function(doc){
//		//							doc.code.should.equal(200)
//		//							done()
//		//						}
//		//					)
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("attackVillage 敌方采集敌方联盟村落 我方进攻且我方胜利", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackVillage(
//		//					"greenDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:20
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:20
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:20
//		//						}
//		//					],
//		//					m_alliance_1._id,
//		//					m_alliance_1.villages[0].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//					}
//		//				)
//		//			})
//		//		})
//		//	})
//		//
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackVillage(
//		//						"greenDragon",
//		//						[
//		//							{
//		//								name:"swordsman_1",
//		//								count:100
//		//							},
//		//							{
//		//								name:"sentinel_1",
//		//								count:100
//		//							},
//		//							{
//		//								name:"ranger_1",
//		//								count:100
//		//							}
//		//						],
//		//						m_alliance_1._id,
//		//						m_alliance_1.villages[0].id,
//		//						function(doc){
//		//							doc.code.should.equal(200)
//		//							done()
//		//						}
//		//					)
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("attackVillage 敌方采集敌方联盟村落 我方进攻且我方失败", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackVillage(
//		//					"greenDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:100
//		//						}
//		//					],
//		//					m_alliance_1._id,
//		//					m_alliance_1.villages[0].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//					}
//		//				)
//		//			})
//		//		})
//		//	})
//		//
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId4, function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.sendChat("soldiers 1000", function(doc){
//		//					doc.code.should.equal(200)
//		//					Api.attackVillage(
//		//						"greenDragon",
//		//						[
//		//							{
//		//								name:"swordsman_1",
//		//								count:20
//		//							},
//		//							{
//		//								name:"sentinel_1",
//		//								count:20
//		//							},
//		//							{
//		//								name:"ranger_1",
//		//								count:20
//		//							},
//		//							{
//		//								name:"ranger_1",
//		//								count:20
//		//							},
//		//							{
//		//								name:"sentinel_1",
//		//								count:20
//		//							}
//		//						],
//		//						m_alliance_1._id,
//		//						m_alliance_1.villages[0].id,
//		//						function(doc){
//		//							doc.code.should.equal(200)
//		//							done()
//		//						}
//		//					)
//		//				})
//		//			})
//		//		})
//		//	}, 2 * 1000)
//		//})
//
//		//it("retreatFromVillage 从我方村落中撤兵", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackVillage(
//		//					"greenDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:100
//		//						}
//		//					],
//		//					m_alliance_1._id,
//		//					m_alliance_1.villages[0].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//					}
//		//				)
//		//			})
//		//		})
//		//	})
//		//	setTimeout(function(){
//		//		Api.loginPlayer(Config.deviceId3, function(doc){
//		//			doc.code.should.equal(200)
//		//			m_alliance_1 = doc.allianceData;
//		//			Api.retreatFromVillage(m_alliance_1.villageEvents[0].id, function(doc){
//		//				doc.code.should.equal(200)
//		//				done()
//		//			})
//		//		})
//		//	}, 6 * 1000)
//		//})
//
//		//it("attackMonster 进攻本联盟野怪", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		m_alliance_1 = doc.allianceData;
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackMonster(
//		//					"greenDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:100
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:100
//		//						}
//		//					],
//		//					m_alliance_1._id,
//		//					m_alliance_1.monsters[0].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					}
//		//				)
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it("attackMonster 进攻其他联盟野怪", function(done){
//		//	Api.loginPlayer(Config.deviceId3, function(doc){
//		//		doc.code.should.equal(200)
//		//		Api.sendChat("dragonstar greenDragon 1", function(doc){
//		//			doc.code.should.equal(200)
//		//			Api.sendChat("soldiers 1000", function(doc){
//		//				doc.code.should.equal(200)
//		//				Api.attackMonster(
//		//					"greenDragon",
//		//					[
//		//						{
//		//							name:"swordsman_1",
//		//							count:150
//		//						},
//		//						{
//		//							name:"sentinel_1",
//		//							count:150
//		//						},
//		//						{
//		//							name:"ranger_1",
//		//							count:150
//		//						}
//		//					],
//		//					m_alliance_2._id,
//		//					m_alliance_2.monsters[0].id,
//		//					function(doc){
//		//						doc.code.should.equal(200)
//		//						done()
//		//					}
//		//				)
//		//			})
//		//		})
//		//	})
//		//})
//
//		//it('sendAllianceChat 正常发送', function(done){
//		//	Api.sendAllianceChat('test,test', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it('sendAllianceFightChat 正常发送', function(done){
//		//	Api.sendAllianceFightChat('test,test', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it('getAllianceChats 正常获取', function(done){
//		//	Api.getChats('alliance', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//		//
//		//it('getAllianceFightChats 正常获取', function(done){
//		//	Api.getChats('allianceFight', function(doc){
//		//		doc.code.should.equal(200)
//		//		done()
//		//	})
//		//})
//	})
//
//
//	after(function(){
//		pomelo.disconnect()
//	})
//})