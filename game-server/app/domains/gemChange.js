"use strict"

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema

var GemChange = new Schema({
	_id:{type:String, required:true, default:ShortId.generate},
	serverId:{type:String, required:true},
	playerId:{type:String, required:true},
	playerName:{type:String, required:true},
	changed:{type:Number, required:true},
	left:{type:Number, required:true},
	api:{type:String, required:true},
	params:{type:Schema.Types.Mixed},
	time:{type:Number, required:true, default:Date.now},
	expires:{type:Date, required:true, default:Date.now, expires:60 * 60 * 24 * 15}
})

module.exports = mongoose.model('gemChange', GemChange)