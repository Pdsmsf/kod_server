"use strict";

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ServerStateSchema = new Schema({
	_id:{type:String, required:true},
	openAt:{type:Number, required:true, default:Date.now},
	lastStopTime:{type:Number, required:true, default:Date.now},
	gameInfo:{
		promotionProductEnabled:{type:Boolean, required:true, default:true},
		modApplyEnabled:{type:Boolean, required:true, default:true},
		iapGemEventFinishTime:{type:Number, required:true, default:0}
	},
	notices:[{
		_id:false,
		id:{type:String, required:true},
		title:{type:Schema.Types.Mixed, required:true},
		content:{type:Schema.Types.Mixed, required:true},
		time:{type:Number, required:true}
	}],
	activities:{
		next:[{
			_id:false,
			type:{type:String, required:true},
			startTime:{type:Number, required:true}
		}],
		on:[{
			_id:false,
			type:{type:String, required:true},
			finishTime:{type:Number, required:true}
		}],
		expired:[{
			_id:false,
			type:{type:String, required:true},
			removeTime:{type:Number, required:true}
		}]
	},
	allianceActivities:{
		next:[{
			_id:false,
			type:{type:String, required:true},
			startTime:{type:Number, required:true}
		}],
		on:[{
			_id:false,
			type:{type:String, required:true},
			finishTime:{type:Number, required:true}
		}],
		expired:[{
			_id:false,
			type:{type:String, required:true},
			removeTime:{type:Number, required:true}
		}]
	}
});

module.exports = mongoose.model('serverState', ServerStateSchema);