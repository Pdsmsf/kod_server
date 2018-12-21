"use strict"

var utils = module.exports
var _ = require("underscore")

/**
 * 顺序随机
 * @param array
 * @returns {*}
 */
utils.shuffle = function(array){
	for(var tmp, cur, top = array.length; top--;){
		cur = (Math.random() * (top + 1)) << 0
		tmp = array[cur]
		array[cur] = array[top]
		array[top] = tmp
	}
	return array
}

utils.next = function(doc, code){
	var resp = {}
	resp.code = code
	if(!_.isEmpty(doc)){
		resp.data = doc
	}
	return resp
}

/**
 * 克隆一个json对象
 * @param js
 * @returns {*}
 */
utils.clone = function(js){
	return JSON.parse(JSON.stringify(js))
}