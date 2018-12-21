"use strict"

var switchServerLimit = []
module.exports = switchServerLimit

switchServerLimit[0] = {
	index:0,
	keepLevelMin:0,
	keepLevelMax:10,
	limitDays:0,
	needGem:0
}
switchServerLimit[1] = {
	index:1,
	keepLevelMin:10,
	keepLevelMax:20,
	limitDays:10,
	needGem:500
}
switchServerLimit[2] = {
	index:2,
	keepLevelMin:20,
	keepLevelMax:28,
	limitDays:20,
	needGem:1000
}
switchServerLimit[3] = {
	index:3,
	keepLevelMin:28,
	keepLevelMax:35,
	limitDays:30,
	needGem:2000
}
switchServerLimit[4] = {
	index:4,
	keepLevelMin:35,
	keepLevelMax:40,
	limitDays:50,
	needGem:4000
}
