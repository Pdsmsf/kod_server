"use strict"

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema

var BillingSchema = new Schema({
	_id:{type:String, required:true, default:ShortId.generate},
	type:{type:String, rquired:true, index:true},
	playerId:{type:String, required:true},
	playerName:{type:String, require:true},
	serverId:{type:String, required:true},
	productId:{type:String, required:true},
	transactionId:{type:String, require:true, unique:true, index:true},
	quantity:{type:Number, required:true},
	price:{type:Number, required:true},
	time:{type:Number, require:true, default:Date.now}
})

module.exports = mongoose.model('billing', BillingSchema)