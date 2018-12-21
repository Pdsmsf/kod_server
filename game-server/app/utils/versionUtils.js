/**
 * Created by modun on 14/12/9.
 */

require('shelljs/global')
var Utils = module.exports

var APP_VERSION = 0.1

Utils.getServerVersion = function(){
	var commitCount = exec("git rev-list HEAD | wc -l | tr -d ' \\n'", {silent:true}).output
	var logVersion = exec("git rev-parse --short HEAD | tr -d ' \\n'", {silent:true}).output
	return APP_VERSION + "." + commitCount + "." + logVersion
}





