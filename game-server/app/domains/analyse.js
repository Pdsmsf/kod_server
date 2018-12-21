"use strict"

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema
var LogicUtils = require("../utils/logicUtils")

var AnalyseSchema = new Schema({
	_id:{type:String, required:true, default:ShortId.generate},
	serverId:{type:String, required:true},
	revenue:{type:Number, required:true, default:0},
	dau:{type:Number, required:true, default:0},
	dnu:{type:Number, required:true, default:0},
	day1:{type:Number, required:true, default:-1},
	day3:{type:Number, required:true, default:-1},
	day7:{type:Number, required:true, default:-1},
	day15:{type:Number, required:true, default:-1},
	day30:{type:Number, required:true, default:-1},
	payCount:{type:Number, required:true, default:0},
	payTimes:{type:Number, required:true, default:0},
	dateTime:{type:Number, required:true},
	finished:{type:Boolean, required:true, default:false}
})

module.exports = mongoose.model('analyse', AnalyseSchema)