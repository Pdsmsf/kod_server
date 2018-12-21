"use strict"

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema

var DealSchema = new Schema({
	_id:{type:String, required:true, default:ShortId.generate},
	playerId:{type:String, required:true},
	serverId:{type:String, required:true},
	addedTime:{type:Number, required:true, default:Date.now},
	itemData:{
		type:{type:String, required:true},
		name:{type:String, required:true},
		count:{type:Number, required:true},
		price:{type:Number, required:true}
	}
})

module.exports = mongoose.model('deal', DealSchema)