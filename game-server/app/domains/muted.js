"use strict";

/**
 * Created by modun on 15/1/8.
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var MutedSchema = new Schema({
	_id:{type:String, required:true},
	name:{type:String, required:true},
	icon:{type:Number, required:true},
	serverId:{type:String, required:true},
	reason:{type:String, required:true},
	by:{
		id:{type:String, required:true},
		name:{type:String, required:true}
	},
	finishTime:{type:Number, required:true},
	time:{type:Number, required:true, default:Date.now}
});

module.exports = mongoose.model('muted', MutedSchema);