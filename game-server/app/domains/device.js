"use strict"

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema

var DeviceSchema = new Schema({
	_id:{type:String, required:true},
	playerId:{type:String, required:true},
	registerData:{
		fromIp:{type:String},
		identity:{type:String}
	},
	registerTime:{type:Number, required:true, default:Date.now}
})

module.exports = mongoose.model('device', DeviceSchema)