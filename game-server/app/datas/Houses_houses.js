"use strict"

var houses = {}
module.exports = houses

houses["dwelling"] = {
	type:"dwelling",
	width:1,
	height:1,
	output:"citizen",
	preCondition:"building_keep_1",
	desc:"住宅"
}
houses["woodcutter"] = {
	type:"woodcutter",
	width:1,
	height:1,
	output:"wood",
	preCondition:"house_dwelling_1",
	desc:"木工小屋"
}
houses["quarrier"] = {
	type:"quarrier",
	width:1,
	height:1,
	output:"stone",
	preCondition:"house_dwelling_1",
	desc:"石匠小屋"
}
houses["miner"] = {
	type:"miner",
	width:1,
	height:1,
	output:"iron",
	preCondition:"house_dwelling_1",
	desc:"矿工小屋"
}
houses["farmer"] = {
	type:"farmer",
	width:1,
	height:1,
	output:"food",
	preCondition:"house_dwelling_1",
	desc:"农夫小屋"
}
