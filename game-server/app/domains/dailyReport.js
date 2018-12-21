"use strict"

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema

var DailyReportSchema = new Schema({
	_id:{type:String, required:true, default:ShortId.generate},
	serverId:{type:String, required:true},
	dau:{type:Number, required:true, default:0},
	dnu:{type:Number, required:true, default:0},
	keepLevels:[{
		_id:false,
		level:{type:Number, required:true},
		count:{type:Number, required:true}
	}],
	ftePassed:{type:Number, required:true, default:0},
	gemUsed:{type:Number, required:true, default:0},
	gemLeft:{type:Number, required:true, default:0},
	dateTime:{type:Number, required:true}
})

module.exports = mongoose.model('dailyReport', DailyReportSchema)