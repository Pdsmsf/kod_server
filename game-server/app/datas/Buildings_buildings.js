"use strict"

var buildings = []
module.exports = buildings

buildings[1] = {
	location:1,
	name:"keep",
	hasHouse:false,
	preCondition:"building_wall_0",
	desc:"城堡"
}
buildings[2] = {
	location:2,
	name:"watchTower",
	hasHouse:false,
	preCondition:"building_watchTower_0",
	desc:"瞭望塔"
}
buildings[3] = {
	location:3,
	name:"warehouse",
	hasHouse:true,
	preCondition:"building_keep_1",
	desc:"资源仓库"
}
buildings[4] = {
	location:4,
	name:"dragonEyrie",
	hasHouse:false,
	preCondition:"building_dragonEyrie_0",
	desc:"龙巢"
}
buildings[5] = {
	location:5,
	name:"barracks",
	hasHouse:true,
	preCondition:"house_miner_1",
	desc:"兵营"
}
buildings[6] = {
	location:6,
	name:"hospital",
	hasHouse:true,
	preCondition:"house_farmer_1",
	desc:"医院"
}
buildings[7] = {
	location:7,
	name:"academy",
	hasHouse:true,
	preCondition:"building_keep_1",
	desc:"学院"
}
buildings[8] = {
	location:8,
	name:"materialDepot",
	hasHouse:true,
	preCondition:"building_warehouse_1",
	desc:"材料库房"
}
buildings[9] = {
	location:9,
	name:"blackSmith",
	hasHouse:true,
	preCondition:"house_miner_1",
	desc:"铁匠铺"
}
buildings[10] = {
	location:10,
	name:"foundry",
	hasHouse:true,
	preCondition:"house_miner_1",
	desc:"锻造工坊"
}
buildings[11] = {
	location:11,
	name:"stoneMason",
	hasHouse:true,
	preCondition:"house_quarrier_1",
	desc:"石匠工坊"
}
buildings[12] = {
	location:12,
	name:"lumbermill",
	hasHouse:true,
	preCondition:"house_woodcutter_1",
	desc:"锯木工房"
}
buildings[13] = {
	location:13,
	name:"mill",
	hasHouse:true,
	preCondition:"house_farmer_1",
	desc:"磨坊"
}
buildings[14] = {
	location:14,
	name:"tradeGuild",
	hasHouse:true,
	preCondition:"building_materialDepot_1",
	desc:"贸易行会"
}
buildings[15] = {
	location:15,
	name:"townHall",
	hasHouse:true,
	preCondition:"house_dwelling_1",
	desc:"市政厅"
}
buildings[16] = {
	location:16,
	name:"toolShop",
	hasHouse:true,
	preCondition:"house_woodcutter_1",
	desc:"工具作坊"
}
buildings[17] = {
	location:17,
	name:"trainingGround",
	hasHouse:true,
	preCondition:"building_academy_1",
	desc:"训练场"
}
buildings[18] = {
	location:18,
	name:"hunterHall",
	hasHouse:true,
	preCondition:"building_academy_1",
	desc:"猎手大厅"
}
buildings[19] = {
	location:19,
	name:"stable",
	hasHouse:true,
	preCondition:"building_academy_1",
	desc:"马厩"
}
buildings[20] = {
	location:20,
	name:"workshop",
	hasHouse:true,
	preCondition:"building_academy_1",
	desc:"车间"
}
buildings[21] = {
	location:21,
	name:"wall",
	hasHouse:false,
	preCondition:"house_quarrier_1",
	desc:"城墙"
}
buildings[22] = {
	location:22,
	name:"tower",
	hasHouse:false,
	preCondition:"building_wall_1",
	desc:"箭塔"
}
