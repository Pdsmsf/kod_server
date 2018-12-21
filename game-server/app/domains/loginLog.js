"use strict";

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var LoginLogSchema = new Schema({
	_id:{type:String, required:true, default:ShortId.generate},
	playerId:{type:String, required:true},
	ip:{type:String, required:true},
	serverId:{type:String, required:true},
	loginTime:{type:Number, required:true, default:Date.now},
	expires:{type:Date, required:true, default:Date.now, expires:60 * 60 * 24 * 30}
});

module.exports = mongoose.model('loginLog', LoginLogSchema);