"use strict";

/**
 * Created by modun on 15/1/8.
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ModSchema = new Schema({
	_id:{type:String, required:true},
	name:{type:String, required:true},
	time:{type:Number, required:true, default:Date.now}
});

module.exports = mongoose.model('mod', ModSchema);