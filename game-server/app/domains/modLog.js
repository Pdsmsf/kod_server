"use strict";

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ModLogSchema = new Schema({
	_id:{type:String, required:true, default:ShortId.generate},
	mod:{
		id:{type:String, required:true},
		name:{type:String, required:true}
	},
	action:{
		type:{type:String, required:true},
		value:{type:String, required:true}
	},
	time:{type:Number, required:true, default:Date.now},
	expires:{type:Date, required:true, default:Date.now, expires:60 * 60 * 24 * 15}
});

module.exports = mongoose.model('modLog', ModLogSchema);