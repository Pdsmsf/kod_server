"use strict"

/**
 * Created by modun on 14-10-24.
 */

var _ = require("underscore")
var ShortId = require("shortid")

var Consts = require("../consts/consts")
var GameDatas = require("../datas/GameDatas")
var DataUtils = require("./dataUtils")
var AllianceInitData = GameDatas.AllianceInitData
var AllianceMap = GameDatas.AllianceMap;

var Utils = module.exports

var MapSize = {
	width:AllianceInitData.intInit.allianceRegionMapWidth.value,
	height:AllianceInitData.intInit.allianceRegionMapHeight.value
}

/**
 * 创建联盟时,生成联盟地图
 * @returns {Array}
 */
Utils.create = function(){
	var map = []
	var mapObjects = []
	this.initMap(map)
	return mapObjects
}

/**
 * 初始化地图
 * @param map
 */
Utils.initMap = function(map){
	for(var i = 0; i < MapSize.width; i++){
		map[i] = []
		for(var j = 0; j < MapSize.height; j++){
			map[i][j] = false
		}
	}
}

/**
 * 打印地图
 * @param map
 */
Utils.outputMap = function(map){
	for(var i = 0; i < MapSize.width; i++){
		var str = ""
		for(var j = 0; j < MapSize.height; j++){
			if(!!map[j][i]){
				str += "* "
			}else{
				str += ". "
			}
		}
		console.log(str)
	}
}

/**
 * 根据Rect信息标记地图
 * @param map
 * @param rect
 */
var markMapWithRect = function(map, rect){
	for(var i = rect.x; i > rect.x - rect.width; i--){
		for(var j = rect.y; j > rect.y - rect.height; j--){
			map[i][j] = true
		}
	}
}

/**
 * 取消对地图的标记
 * @param map
 * @param rect
 */
var unMarkMapWithRect = function(map, rect) {
	for (var i = rect.x; i > rect.x - rect.width; i--) {
		for (var j = rect.y; j > rect.y - rect.height; j--) {
			map[i][j] = false
		}
	}
}

/**
 * 添加地图对象
 * @param map
 * @param mapObjects
 * @param rect
 * @param name
 */
Utils.addMapObject = function(map, mapObjects, rect, name){
	markMapWithRect(map, rect)
	var object = {
		id:ShortId.generate(),
		name:name,
		location:{
			x:rect.x,
			y:rect.y
		}
	}
	mapObjects.push(object)
	return object
}

/**
 * 获取可用的地图点位
 * @param map
 * @returns {Array}
 */
Utils.getFreePoints = function(map){
	var points = []
	for(var i = 1; i < MapSize.width - 1; i++){
		for(var j = 1; j < MapSize.height - 1; j++){
			if(!map[i][j]){
				points.push({
					x:i,
					y:j
				})
			}
		}
	}
	return points
}

/**
 * 根据width,height获取地图某个可用点位
 * @param map
 * @param width
 * @param height
 * @returns {{x: *, y: *, width: *, height: *}}
 */
Utils.getRect = function(map, width, height){
	var freePoints = this.getFreePoints(map)
	while(freePoints.length > 0){
		var location = 0
		if(freePoints.length > 1){
			location = (Math.random() * freePoints.length) << 0
		}
		var point = freePoints[location]
		if(point.x - width < 0 || point.y - height < 0){
			freePoints.splice(location, 1)
			continue
		}
		var hasFound = true
		for(var i = point.x; i > point.x - width; i--){
			for(var j = point.y; j > point.y - height; j--){
				if(!!map[i][j]){
					freePoints.splice(location, 1)
					hasFound = false
					break
				}
			}
			if(!hasFound) break
		}
		if(hasFound){
			return {
				x:point.x,
				y:point.y,
				width:width,
				height:height
			}
		}
	}
}

/**
 *
 * @param map
 * @param newRect
 * @param oldRect
 * @returns {boolean}
 */
Utils.isRectLegal = function(map, newRect, oldRect){
	var start_x = newRect.x
	var start_y = newRect.y
	var end_x = newRect.x - newRect.width + 1
	var end_y = newRect.y - newRect.height + 1
	var is_in_map = start_x > 0 && start_x < MapSize.width - 1 &&
		start_y > 0 && start_y < MapSize.height - 1 &&
		end_x > 0 && end_x < MapSize.width - 1 &&
		end_y > 0 && end_y < MapSize.height - 1
	if (!is_in_map) {
		return false
	}
	if(_.isObject(oldRect)) unMarkMapWithRect(map, oldRect)
	for (var i = newRect.x; i > newRect.x - newRect.width; i--) {
		for (var j = newRect.y; j > newRect.y - newRect.height; j--) {
			if (map[i][j]) {
				return false
			}
		}
	}
	return true
}

/**
 * 生成地图结构
 * @param terrainStyle
 * @param mapObjects
 * @returns {Array}
 */
Utils.buildMap = function(terrainStyle, mapObjects){
	var map = []
	this.initMap(map)
	_.each(AllianceMap['allianceMap_' + terrainStyle], function(mapObject){
		var config = AllianceMap.buildingName[mapObject.name];
		var rect = {
			x:mapObject.x,
			y:mapObject.y,
			width:config.width,
			height:config.height
		}
		markMapWithRect(map, rect)
	})

	_.each(mapObjects, function(mapObject){
		var config = AllianceMap.buildingName[mapObject.name];
		var rect = {
			x:mapObject.location.x,
			y:mapObject.location.y,
			width:config.width,
			height:config.height
		}
		markMapWithRect(map, rect)
	})
	return map
}