var WebSocket = require('ws');
var Protocol = require('pomelo/node_modules/pomelo-protocol');
var Package = Protocol.Package;
var Message = Protocol.Message;
var EventEmitter = require('events').EventEmitter;
var protobuf = require('pomelo/node_modules/pomelo-protobuf');
var crypto = require('crypto')

var JS_WS_CLIENT_TYPE = 'js-websocket';
var JS_WS_CLIENT_VERSION = '0.0.1';

var RES_OK = 200;
var RES_OLD_CLIENT = 501;

var pomelo = Object.create(EventEmitter.prototype); // object extend from object
var socket = null;
var reqId = 0;
var callbacks = {};
var handlers = {};
var routeMap = {};

var heartbeatInterval = 5000;
var heartbeatTimeout = heartbeatInterval * 2;
var heartbeatId = null;
var heartbeatTimeoutId = null;

var useCrypto2 = false;
var clientDiff = crypto.getDiffieHellman('modp1');
clientDiff.generateKeys();
var clientKey = clientDiff.getPublicKey('base64');
var clientSecret = null;
var cipher = null;

var handshakeBuffer = {
	'sys':{
		type:JS_WS_CLIENT_TYPE,
		version:JS_WS_CLIENT_VERSION,
		clientKey:clientKey
	},
	'user':{}
};

var initCallback = null;

pomelo.init = function(params, cb){
	pomelo.params = params;
	params.debug = true;
	initCallback = cb;
	var host = params.host;
	var port = params.port;

	var url = 'ws://' + host;
	if(port){
		url += ':' + port;
	}
	this.initWebSocket(url, cb);
};

pomelo.initWebSocket = function(url, cb){
	var onopen = function(){
		var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
		send(obj);
	};
	var onmessage = function(event){
		processPackage(Package.decode(event.data), cb);
	};
	var onerror = function(event){
		pomelo.emit('io-error', event);
	};
	var onclose = function(event){
		pomelo.emit('close', event);
	};
	socket = new WebSocket(url);
	socket.binaryType = 'arraybuffer';
	socket.onopen = onopen;
	socket.onmessage = onmessage;
	socket.onerror = onerror;
	socket.onclose = onclose;
};

pomelo.disconnect = function(){
	if(socket){
		if(socket.disconnect) socket.disconnect();
		if(socket.close) socket.close();
		socket = null;
	}

	if(heartbeatId){
		clearTimeout(heartbeatId);
		heartbeatId = null;
	}
	if(heartbeatTimeoutId){
		clearTimeout(heartbeatTimeoutId);
		heartbeatTimeoutId = null;
	}

	useCrypto2 = false;
	clientSecret = null;
	cipher = null;
};

pomelo.request = function(route, msg, cb){
	msg = msg || {};
	route = route || msg.route;
	if(!route){
		return;
	}

	reqId++;
	sendMessage(reqId, route, msg);

	callbacks[reqId] = cb;
	routeMap[reqId] = route;
};

pomelo.notify = function(route, msg){
	msg = msg || {};
	sendMessage(0, route, msg);
};

var sendMessage = function(reqId, route, msg){
	var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

	msg = Protocol.strencode(JSON.stringify(msg));

	var compressRoute = 0;
	if(pomelo.dict && pomelo.dict[route]){
		route = pomelo.dict[route];
		compressRoute = 1;
	}

	msg = Message.encode(reqId, type, compressRoute, route, msg);
	if(useCrypto2){
		var cipher = crypto.createCipher('rc4', clientSecret);
		msg = cipher.update(msg);
	}
	var packet = Package.encode(Package.TYPE_DATA, msg);
	send(packet);
};

var send = function(packet){
	if(!!socket){
		socket.send(packet.buffer || packet, {binary:true});
	}
};

var heartbeat = function(){
	if(heartbeatId){
		// already in a heartbeat interval
		return;
	}

	heartbeatId = setTimeout(function(){
		var obj = Package.encode(Package.TYPE_HEARTBEAT);
		heartbeatId = null;
		send(obj);
	}, heartbeatInterval);

	if(heartbeatTimeoutId){
		clearTimeout(heartbeatTimeoutId);
	}
	heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
};

var heartbeatTimeoutCb = function(){
	pomelo.emit('heartbeat timeout');
	pomelo.disconnect();
};

var handshake = function(data){
	data = JSON.parse(Protocol.strdecode(data));
	if(data.code === RES_OLD_CLIENT){
		pomelo.emit('error', 'client version not fullfill');
		return;
	}

	if(data.code !== RES_OK){
		pomelo.emit('error', 'handshake fail');
		return;
	}

	handshakeInit(data);
	var obj = null;
	if(!!data.sys.crypto2){
		useCrypto2 = true;
		clientSecret = clientDiff.computeSecret(data.sys.serverKey, 'base64', 'base64');
		cipher = crypto.createCipher('rc4', clientSecret);
		var rc4 = cipher.update(data.sys.challenge, 'utf8', 'base64');
		obj = Package.encode(Package.TYPE_HANDSHAKE_ACK, Protocol.strencode(JSON.stringify({challenge:rc4})));
		send(obj);
	}else{
		obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
	}
	send(obj);

	if(initCallback){
		initCallback(socket);
		initCallback = null;
	}
};

var onData = function(data){
	//probuff decode
	if(useCrypto2){
		var decipher = crypto.createDecipher('rc4', clientSecret);
		data = decipher.update(data);
	}
	var msg = Message.decode(data);
	if(msg.id > 0){
		msg.route = routeMap[msg.id];
		delete routeMap[msg.id];
		if(!msg.route){
			return;
		}
	}
	msg.body = deCompose(msg);

	processMessage(pomelo, msg);
};

var onKick = function(){
	pomelo.emit('onKick');
};

handlers[Package.TYPE_HANDSHAKE] = handshake;
handlers[Package.TYPE_HEARTBEAT] = heartbeat;
handlers[Package.TYPE_DATA] = onData;
handlers[Package.TYPE_KICK] = onKick;

var processPackage = function(msg){
	handlers[msg.type](msg.body);
};

var processMessage = function(pomelo, msg){
	if(!msg || !msg.id){
		pomelo.emit(msg.route, msg.body);
		return;
	}

	//if have a id then find the callback function with the request
	var cb = callbacks[msg.id];

	delete callbacks[msg.id];
	if(typeof cb !== 'function'){
		return;
	}

	cb(msg.body);
	return;
};

var deCompose = function(msg){
	var abbrs = pomelo.data.abbrs;
	var route = msg.route;

	if(msg.compressRoute){
		if(!abbrs[route]){
			return {};
		}
		msg.route = abbrs[route];
	}
	return JSON.parse(Protocol.strdecode(msg.body));
};

var handshakeInit = function(data){
	if(data.sys && data.sys.heartbeat){
		heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
		heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
	}else{
		heartbeatInterval = 0;
		heartbeatTimeout = 0;
	}

	initData(data);
};

var initData = function(data){
	if(!data || !data.sys){
		return;
	}
	pomelo.data = pomelo.data || {};
	var dict = data.sys.dict;
	var protos = data.sys.protos;

	//Init compress dict
	if(!!dict){
		pomelo.data.dict = dict;
		pomelo.data.abbrs = {};

		for(var route in dict){
			pomelo.data.abbrs[dict[route]] = route;
		}
	}
};

module.exports = pomelo;