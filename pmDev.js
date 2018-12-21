'use strict';

var pm2 = require('pm2');
var _ = require('underscore');
var fs = require('fs');
var Promise = require('bluebird');
require('shelljs/global');

var LogicUtils = require('./game-server/app/utils/logicUtils')

var servers = require('./game-server/config/local-ios/servers')

var getMasterConfig = function(env){
	var masterPath = __dirname + '/game-server/config/' + env + '/master.json';
	var masterConfig = require(masterPath);
	return masterConfig;
}

function getServers(env){
	var pmServers = [];

	var masterConfig = getMasterConfig(env);
	var master = {
		name:env + ':master-server-1',
		script:__dirname + '/game-server/app.js',
		args:[
			'env=' + env,
			'type=master',
			'id=' + masterConfig.id,
			'host=' + masterConfig.host,
			'port=' + masterConfig.port
		],
		merge_logs:true,
		autorestart:true
	}
	pmServers.push(master);

	var serversPath = __dirname + '/game-server/config/' + env + '/servers.json';
	var serverConfigs = require(serversPath);
	_.each(serverConfigs, function(servers, serverType){
		_.each(servers, function(server){
			var pmServer = {
				name:env + ':' + server.id,
				script:__dirname + '/game-server/app.js',
				args:[
					'env=' + env,
					'id=' + server.id,
					'host=' + server.host,
					'port=' + server.port,
					'serverType=' + serverType
				],
				merge_logs:true,
				autorestart:false,
				error_file:"/dev/null",
				out_file:"/dev/null"
			}
			if(server.frontend){
				pmServer.args.push('frontend=true');
				pmServer.args.push('clientPort=' + server.clientPort);
			}
			if(serverType === 'logic'){
				pmServer.args.push('clientHost=' + server.clientHost);
			}
			if(serverType === 'cache'){
				pmServer.args.push('name=' + server.name);
			}
			pmServers.push(pmServer);
		})
	})
	return pmServers;
}

function startAll(env){
	console.log('starting servers');
	var filePath = __dirname + '/game-server/config/' + env + '/master.json';
	if(!fs.existsSync(filePath)){
		throw new Error('invalid params');
	}
	pm2.connect(function(){
		var servers = getServers(env);
		pm2.start(servers, function(){
			pm2.disconnect();
			exec('pm2 list');
		});
	});
}

function stopAll(env){
	console.log('stoping servers');
	var filePath = __dirname + '/game-server/config/' + env + '/master.json';
	if(!fs.existsSync(filePath)){
		throw new Error('invalid params');
	}
	var findOnlineServersByENV = function(env, servers, serverType){
		var onlineServers = [];
		_.each(servers, function(onlineServer){
			if(onlineServer.name.indexOf(env) === 0 && onlineServer.pm2_env.status === 'online'){
				if(!serverType){
					onlineServers.push(onlineServer);
				}else if(!!serverType && onlineServer.name.indexOf(env + ':' + serverType) === 0){
					onlineServers.push(onlineServer);
				}
			}
		})
		return onlineServers;
	}
	var stopCacheServers = function(env){
		return Promise.fromCallback(function(callback){
			pm2.list(function(e, servers){
				var onlineServers = findOnlineServersByENV(env, servers, 'cache');
				if(onlineServers.length === 0) return callback();
				var serverIds = [];
				_.each(onlineServers, function(server){
					serverIds.push(server.name.split(':')[1]);
				})
				var masterConfig = getMasterConfig(env);
				exec('pomelo stop -h ' + masterConfig.host + ' -P ' + masterConfig.port + ' ' + serverIds.join(' '));
				var tryCount = 120;
				var currentTryCount = 0;
				(function checkClose(){
					currentTryCount++;
					setTimeout(function(){
						pm2.list(function(e, servers){
							var onlineServers = findOnlineServersByENV(env, servers, 'cache');
							if(onlineServers.length > 0){
								if(currentTryCount >= tryCount){
									console.log('gracefully stop cache server group failed')
									return callback();
								}else{
									return checkClose();
								}
							}
							else return callback();
						})
					}, 1000)
				})();
			})
		});
	}
	var stopOtherServers = function(env){
		return Promise.fromCallback(function(callback){
			pm2.list(function(e, servers){
				var onlineServers = findOnlineServersByENV(env, servers);
				if(onlineServers.length === 0) return callback();
				var masterServer = _.find(onlineServers, function(server){
					return server.name.indexOf(env + ':master') === 0;
				})
				LogicUtils.removeItemInArray(onlineServers, masterServer);
				(function stopServer(){
					if(onlineServers.length === 0){
						if(!!masterServer){
							pm2.stop(masterServer.name, function(){
								return callback();
							})
						}else{
							return callback();
						}
					}else{
						var onlineServer = onlineServers.pop();
						pm2.stop(onlineServer.name, function(){
							return stopServer();
						})
					}
				})();
			})
		})
	}
	var deleteServers = function(env){
		return Promise.fromCallback(function(callback){
			servers = getServers(env);
			(function innerDeleteServers(){
				if(servers.length === 0){
					return callback();
				}
				var server = servers.pop();
				pm2.delete(server.name, function(){
					return innerDeleteServers();
				});
			})();
		})
	}

	pm2.connect(function(){
		stopCacheServers(env).then(function(){
			return stopOtherServers(env);
		}).then(function(){
			return deleteServers(env);
		}).then(function(){
			pm2.disconnect();
			exec('pm2 list');
		}).catch(function(e){
			console.log(e);
		});
	});
}

function start(env, serverId){
	var filePath = __dirname + '/game-server/config/' + env + '/master.json';
	if(!fs.existsSync(filePath)){
		throw new Error('invalid params');
	}
	exec('pm2 start ' + env + ':' + serverId);
}

function stop(env, serverId){
	var filePath = __dirname + '/game-server/config/' + env + '/master.json';
	if(!fs.existsSync(filePath)){
		throw new Error('invalid params');
	}
	var masterConfig = getMasterConfig(env);
	exec('pomelo stop -h ' + masterConfig.host + ' -P ' + masterConfig.port + ' ' + serverId);
}

function add(env, serverId){
	var filePath = __dirname + '/game-server/config/' + env + '/master.json';
	if(!fs.existsSync(filePath)){
		throw new Error('invalid params');
	}
	var servers = getServers(env);
	var pmServer = _.find(servers, function(server){
		return server.name === serverId;
	})
	if(!pmServer){
		throw  new Error('server not exist')
	}

	pm2.connect(function(){
		pm2.list(function(e, servers){
			var alreadyAdd = _.some(servers, function(server){
				return server.name === pmServer.name
			})
			if(alreadyAdd){
				return pm2.disconnect(function(){
					throw new Error('server already added');
				})
			}
			pm2.start(pmServer, function(){
				pm2.disconnect();
				exec('pm2 list');
			})
		})
	});
}

function list(env){
	var filePath = __dirname + '/game-server/config/' + env + '/master.json';
	if(!fs.existsSync(filePath)){
		throw new Error('invalid params');
	}
	var masterConfig = getMasterConfig(env);
	exec('pomelo list -h ' + masterConfig.host + ' -P ' + masterConfig.port);
}

var commands = ['startAll', 'stopAll', 'start', 'stop', 'add', 'list'];

(function(){
	if(!which('pm2')){
		throw new Error('please install pm2 first');
	}
	if(!which('pomelo')){
		throw new Error('please install pomelo first');
	}

	var args = process.argv;
	if(args.length < 3) throw new Error('invalid params');
	var command = args[2];
	if(!_.contains(commands, command)) throw new Error('invalid params');
	if(command === 'startAll') return startAll(args[3]);
	if(command === 'stopAll') return stopAll(args[3]);
	if(command === 'start') return start(args[3], args[4]);
	if(command === 'stop') return stop(args[3], args[4]);
	if(command === 'add') return add(args[3], args[4]);
	if(command === 'list') return list(args[3]);
})();