"use strict"

/**
 * Created by modun on 15/1/8.
 */

var ShortId = require("shortid")
var mongoose = require("mongoose")
var Schema = mongoose.Schema

var CountrySchema = new Schema({
	_id:{type:String, required:true},
	status:{
		status:{type:String, required:true, default:'peace'},
		startTime:{type:Number, required:true, default:Date.now},
		finishTime:{type:Number, required:true, default:0}
	},
	monsters:{
		refreshTime:{type:Number, required:true},
		undeadsquads:[{
			_id:false,
			id:{type:String, required:true},
			index:{type:Number, required:true},
			location:{
				x:{type:Number, required:true},
				y:{type:Number, required:true}
			}
		}],
		necronators:[{
			_id:false,
			id:{type:String, required:true},
			index:{type:Number, required:true},
			location:{
				x:{type:Number, required:true},
				y:{type:Number, required:true}
			}
		}]
	},
	dominator:{
		type:{
			player:{
				id:{type:String, required:true},
				name:{type:String, required:true}
			},
			alliance:{
				id:{type:String, required:true},
				tag:{type:String, required:true},
				name:{type:String, required:true},
				flag:{type:String, required:true}
			},
			notice:{type:String, required:true},
			expelTime:{type:Number, required:true},
			globalMailTime:{type:Number, required:true},
			titles:{
				emperorsArmy:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				darkAngel:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				warMonk:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				greyKnight:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				ironFist:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				ultimateWarrior:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				watcher:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				agonyOfTerror:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				agonyOfDespair:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				seedOfCorruption:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				curseOfShadow :{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				curseOfBlood :{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				lossMind:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				},
				curseOfSlow:{
					type:{
						id:{type:String, required:true},
						allianceTag:{type:String, required:true},
						name:{type:String, required:true}
					},
					required:false
				}
			}
		},
		required:false
	},
	smallTowerTroops:[],
	bigTowerTroops:[]
})

module.exports = mongoose.model('country', CountrySchema)