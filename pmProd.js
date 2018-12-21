'use strict';

var Promise = require('bluebird');
var pm2 = require('pm2');
var _ = require('underscore');
var fs = require('fs');
var adminClient = require('pomelo/node_modules/pomelo-admin').adminClient;

require('shelljs/global');

var ServerTypes = ['cache', 'rank', 'chat', 'logic', 'http', 'gate'];
var ModuleId = '__console__';

function connectToMaster(env){
	var masterPath = __dirname + '/game-server/config/' + env + '/master.json';
	var masterConfig = require(masterPath);
	var config = {
		username:'admin',
		password:'admin',
		host:masterConfig.host,
		port:masterConfig.port
	};
	var client = new adminClient({username:config.username, password:config.password, md5:true});
	return Promise.fromCallback(function(callback){
		client.connect(ModuleId, config.host, config.port, function(e){
			if(!!e){
				return callback(new Error('connect to master server failed'));
			}
			return callback(null, client);
		});
	});
}

function connectToPm2(){
	return Promise.fromCallback(function(callback){
		pm2.connect(function(e){
			if(!!e){
				return callback(new Error('connect to pm2 server failed'));
			}
			return callback(null, pm2);
		});
	});
}

function isServerStarted(client, serverId){
	return Promise.fromCallback(function(callback){
		client.request(ModuleId, {signal:'list'}, callback);
	}).then(function(resp){
		if(!!resp.msg && resp.msg[serverId]){
			return Promise.resolve(true);
		}
		return Promise.resolve(false);
	}).catch(function(e){
		return Promise.reject(e);
	});
}

function stopServer(client, serverId){
	return Promise.fromCallback(function(callback){
		client.request(ModuleId, {signal:'stop', ids:[serverId]}, callback);
	}).then(function(){
		return Promise.resolve();
	}).catch(function(e){
		return Promise.reject(e);
	});
}

function getPmMasterServerConfig(env){
	var masterPath = __dirname + '/game-server/config/' + env + '/master.json';
	var masterConfig = require(masterPath);
	var pmMaster = {
		name:env + ':' + masterConfig.id,
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
	};
	return pmMaster;
}

function getPmServerConfig(env, serverId){
	var serversPath = __dirname + '/game-server/config/' + env + '/servers.json';
	var serverConfigs = require(serversPath);
	var serverConfig = {};
	_.each(serverConfigs, function(serverConfigs, serverType){
		_.each(serverConfigs, function(_serverConfig){
			if(_serverConfig.id === serverId){
				serverConfig.serverType = serverType;
				serverConfig.config = _serverConfig;
			}
		});
	});
	if(!serverConfig.config){
		return null;
	}
	var pmServer = {
		name:env + ':' + serverConfig.config.id,
		script:__dirname + '/game-server/app.js',
		args:[
			'env=' + env,
			'id=' + serverConfig.config.id,
			'host=' + serverConfig.config.host,
			'port=' + serverConfig.config.port,
			'serverType=' + serverConfig.serverType
		],
		merge_logs:true,
		autorestart:false,
		error_file:"/dev/null",
		out_file:"/dev/null"
	};
	if(serverConfig.config.frontend){
		pmServer.args.push('frontend=true');
		pmServer.args.push('clientPort=' + serverConfig.config.clientPort);
	}
	if(serverConfig.serverType === 'logic'){
		pmServer.args.push('clientHost=' + serverConfig.config.clientHost);
	}
	return pmServer;
}

function getServerIds(env){
	var serversPath = __dirname + '/game-server/config/' + env + '/servers.json';
	var serverConfigs = require(serversPath);
	var serverIds = [];
	_.each(ServerTypes, function(serverType){
		var servers = serverConfigs[serverType];
		_.each(servers, function(serverConfig){
			serverIds.push(serverConfig.id);
		});
	});
	return serverIds;
}

function startMaster(env){
	var pm2Client = null;
	var masterClient = null;
	var pmMasterConfig = getPmMasterServerConfig(env);
	return connectToPm2().then(function(_client){
		pm2Client = _client;
		return Promise.fromCallback(function(_callback){
			pm2Client.delete(pmMasterConfig.name, function(){
				_callback();
			});
		});
	}).then(function(){
		console.log('------------starting master-server-1 server....');
		return Promise.fromCallback(function(_callback){
			pm2Client.start(pmMasterConfig, function(){
				_callback();
			});
		});
	}).then(function(){
		return Promise.fromCallback(function(_callback){
			var tryTimes = 5;
			var currentTimes = 0;
			(function checkServerStarted(){
				currentTimes++;
				if(currentTimes >= tryTimes){
					return _callback(new Error('server ' + 'master-server-1' + ' start failed'));
				}
				setTimeout(function(){
					connectToMaster(env).then(function(_client){
						masterClient = _client;
						_callback();
					}).catch(function(){
						checkServerStarted();
					});
				}, 2000);
			})();
		});
	}).then(function(){
		console.log('------------master server start success....');
		if(!!masterClient && masterClient.socket){
			masterClient.socket.disconnect();
		}
		if(!!pm2Client){
			pm2.disconnect();
		}
	}).catch(function(e){
		if(!!masterClient && masterClient.socket){
			masterClient.socket.disconnect();
		}
		if(!!pm2Client){
			pm2.disconnect();
		}
		return Promise.reject(e);
	});
}

function stopMaster(env){
	var pm2Client = null;
	var pmMasterConfig = getPmMasterServerConfig(env);
	console.log('------------stoping master server....');
	return connectToPm2().then(function(_client){
		pm2Client = _client;
		return Promise.fromCallback(function(_callback){
			pm2.stop(pmMasterConfig.name, function(){
				_callback();
			});
		});
	}).then(function(){
		console.log('------------master server stop success....');
		if(!!pm2Client){
			pm2.disconnect();
		}
	}).catch(function(e){
		if(!!pm2Client){
			pm2.disconnect();
		}
		return Promise.reject(e);
	});
}

function start(env, serverId){
	var masterClient = null;
	var pmServerConfig = null;
	var pm2Client = null;
	return connectToMaster(env).then(function(_client){
		masterClient = _client;
		return isServerStarted(masterClient, serverId);
	}).then(function(isStarted){
		if(isStarted){
			return Promise.reject(new Error('server ' + serverId + ' already started'));
		}
		pmServerConfig = getPmServerConfig(env, serverId);
		if(!pmServerConfig){
			return Promise.reject(new Error('server ' + serverId + ' not exist'));
		}
		return connectToPm2();
	}).then(function(_client){
		pm2Client = _client;
		return Promise.fromCallback(function(_callback){
			pm2Client.delete(pmServerConfig.name, function(){
				_callback();
			});
		});
	}).then(function(){
		console.log('------------starting ' + serverId + ' server....');
		return Promise.fromCallback(function(_callback){
			pm2Client.start(pmServerConfig, _callback);
		});
	}).then(function(){
		return Promise.fromCallback(function(_callback){
			var tryTimes = 5;
			var currentTimes = 0;
			(function checkServerStarted(){
				currentTimes++;
				if(currentTimes >= tryTimes){
					return _callback(new Error('server ' + serverId + ' start failed'));
				}
				setTimeout(function(){
					isServerStarted(masterClient, serverId).then(function(isStarted){
						if(isStarted){
							return _callback();
						}
						return checkServerStarted();
					}).catch(function(e){
						_callback(e);
					});
				}, 2000);
			})();
		});
	}).then(function(){
		console.log('------------server ' + serverId + ' start success');
		if(!!masterClient && masterClient.socket){
			masterClient.socket.disconnect();
		}
		if(!!pm2Client){
			pm2.disconnect();
		}
	}).catch(function(e){
		if(!!masterClient && masterClient.socket){
			masterClient.socket.disconnect();
		}
		if(!!pm2Client){
			pm2.disconnect();
		}
		console.error(e);
		return Promise.reject(e);
	});
}

function stop(env, serverId){
	var masterClient = null;
	return connectToMaster(env).then(function(_client){
		masterClient = _client;
		return isServerStarted(masterClient, serverId);
	}).then(function(isStarted){
		console.log('------------stoping ' + serverId + ' server....');
		if(isStarted){
			return stopServer(masterClient, serverId);
		}else{
			return Promise.resolve();
		}
	}).then(function(){
		return Promise.fromCallback(function(_callback){
			var tryTimes = 120;
			var currentTimes = 0;
			(function checkServerStarted(){
				currentTimes++;
				if(currentTimes >= tryTimes){
					return _callback(new Error('server ' + serverId + ' stop failed'));
				}
				setTimeout(function(){
					isServerStarted(masterClient, serverId).then(function(isStarted){
						if(!isStarted){
							return _callback();
						}
						return checkServerStarted();
					}).catch(function(e){
						_callback(e);
					});
				}, 2000);
			})();
		});
	}).then(function(){
		console.log('------------server ' + serverId + ' stop success');
		if(!!masterClient && masterClient.socket){
			masterClient.socket.disconnect();
		}
	}).catch(function(e){
		if(!!masterClient && masterClient.socket){
			masterClient.socket.disconnect();
		}
		return Promise.reject(e);
	});
}

function startAll(env){
	var serverIds = getServerIds(env);
	return startMaster(env).then(function(){
		return Promise.fromCallback(function(_callback){
			(function startServers(){
				if(serverIds.length === 0){
					return _callback();
				}
				var serverId = serverIds.pop();
				start(env, serverId).then(function(){
					startServers();
				}).catch(function(e){
					_callback(e);
				});
			})();
		});
	}).then(function(){
		console.log('\n------------all server start success');
	}).catch(function(e){
		return Promise.reject(e);
	});
}

function stopAll(env){
	var serverIds = getServerIds(env);
	return Promise.fromCallback(function(_callback){
		(function stopServers(){
			if(serverIds.length === 0){
				return _callback();
			}
			var serverId = serverIds.shift();
			stop(env, serverId).then(function(){
				stopServers();
			}).catch(function(e){
				_callback(e);
			});
		})();
	}).then(function(){
		return stopMaster(env);
	}).then(function(){
		console.log('\n------------all server stop success');
	}).catch(function(e){
		return Promise.reject(e);
	});
}

function restartAll(env){
	return stopAll(env).then(function(){
		return startAll(env);
	}).catch(function(e){
		return Promise.reject(e);
	});
}

var commands = ['startAll', 'stopAll', 'restartAll', 'startMaster', 'stopMaster', 'start', 'stop', 'add'];

(function(){
	if(!which('pm2')){
		throw new Error('please install pm2 first');
	}
	if(!which('pomelo')){
		throw new Error('please install pomelo first');
	}

	var args = process.argv;
	if(args.length < 4) throw new Error('invalid params');
	var command = args[2];
	var env = args[3];
	var masterPath = __dirname + '/game-server/config/' + env + '/master.json';
	if(!fs.existsSync(masterPath)){
		throw new Error('invalid params');
	}

	if(!_.contains(commands, command)){
		throw new Error('invalid params');
	}

	if(command === 'startAll'){
		return startAll(args[3]).catch(function(e){
			console.error(e);
		});
	}else if(command === 'stopAll'){
		return stopAll(args[3]).catch(function(e){
			console.error(e);
		});
	}else if(command === 'restartAll'){
		return restartAll(args[3]).catch(function(e){
			console.error(e);
		});
	}else if(command === 'startMaster'){
		return startMaster(args[3]).catch(function(e){
			console.error(e);
		});
	}else if(command === 'stopMaster'){
		return stopMaster(args[3]).catch(function(e){
			console.error(e);
		});
	}else if(command === 'start'){
		return start(args[3], args[4]).catch(function(e){
			console.error(e);
		});
	}else if(command === 'stop'){
		return stop(args[3], args[4]).catch(function(e){
			console.error(e);
		});
	}
})();