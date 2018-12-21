"use strict";
/**
 * Created by modun on 16/1/15.
 */

var fs = require('fs');
var apn = require("apn")
var crypto = require('crypto')
var path = require("path")
var pomelo = require("./pomelo-client")
var Promise = require("bluebird")
var Http = require('http')
var Https = require('https')
var request = require('request')
var _ = require("underscore")
var gcm = require('node-gcm');
var SortedArrayMap = require("collections/sorted-array-map");
var SortedMap = require("collections/sorted-map");
var SortedArraySet = require("collections/sorted-array-set");
var IABVerifier = require('iab_verifier')
var DOMParser = require('xmldom').DOMParser;
var SignedXml = require('xml-crypto').SignedXml
	, FileKeyInfo = require('xml-crypto').FileKeyInfo
	, select = require('xml-crypto').xpath;
var moment = require('moment');

var DataUtils = require('../game-server/app/utils/dataUtils')
var LogicUtils = require('../game-server/app/utils/logicUtils')
//
var GameData = require('../game-server/app/datas/GameDatas');


//var getToken = function(callback){
//	var url = 'https://login.live.com/accesstoken.srf';
//	var body = {
//		grant_type:'client_credentials',
//		client_id:'ms-app://s-1-15-2-1660332833-921522504-1106393704-573897398-3715077025-4286219832-184998983',
//		client_secret:'WDNnecImUGbLJp0KIexNPyhmfTI7czfn',
//		scope:'notify.windows.com'
//	};
//	var options = {
//		url:url,
//		method:'post',
//		form:body
//	};
//	request(options, function(e, resp, body){
//		if(!!e) return callback(e);
//		if(resp.statusCode !== 200) return callback(new Error(resp.body))
//		else{
//			callback(null, JSON.parse(body));
//		}
//	});
//};
//var wpPushToken = null;
//var sendNoticeAsync = function(url, message){
//	return Promise.fromCallback(function(callback){
//		if(!wpPushToken){
//			getToken(function(e, resp){
//				if(!!e){
//					return callback(e);
//				}
//				wpPushToken = resp.access_token;
//				callback(null, wpPushToken);
//			});
//		}else{
//			callback(null, wpPushToken);
//		}
//	}).then(function(token){
//		var body = '<toast><visual><binding template="ToastText01"><text id="1">' + message + '</text></binding></visual></toast>';
//		var options = {
//			url:url,
//			method:'POST',
//			headers:{
//				'Content-Type':'text/xml',
//				'X-WNS-Type':'wns/toast',
//				'Authorization':'bearer ' + token
//			},
//			body:body
//		};
//		return Promise.fromCallback(function(callback){
//			request(options, function(e, resp, body){
//				if(!!e){
//					return callback(e);
//				}
//				callback();
//			});
//		});
//	});
//};
//
//var url = 'https://bn2.notify.windows.com/?token=AwYAAAA4Y%2fgTcMrCmtgD%2f2zbY6HpmZtQOLtLD7zCqC7ZoBMw%2fhUspDtpnxzgu0heD%2f%2bbEgObGzLWu%2bAn825CaTaO88NsHlDcHQB4a9L0h%2bjCX55d69TyJ7YA2hur%2bw8lPs60giU%3d';
//sendNoticeAsync(url, '你妈叫你回家吃饭');


//var receptData = '<?xml version="1.0"?><Receipt Version="2.0" CertificateId="A656B9B1B3AA509EEA30222E6D5E7DBDA9822DCD" xmlns="http://schemas.microsoft.com/windows/2012/store/receipt"><ProductReceipt PurchasePrice="$0" PurchaseDate="2015-11-23T07:23:05.473Z" Id="16598a50-5c5b-42f5-b75b-f9aef548beeb" AppId="SugarcaneTechnologyGmbH.Dragonfall_vka414hek5xj8" ProductId="com.dragonfall.test" ProductType="Consumable" PublisherUserId="yQiVdk6Coi7RWvsx5RgEaA9VHzz/gdGdF7wUgZ/MGmE=" PublisherDeviceId="8puddmDDTnm4piSOrd0n8WOGBSh8MGNR6T2Crq0HLUI=" MicrosoftProductId="ed3dca70-266d-4dfc-8bf7-526f4df15f28" MicrosoftAppId="aa155f39-6b85-4c52-a388-4eacd55bbcb5" /><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" /><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" /><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><DigestValue>cyyJnYbBe3PQUY8RzlCnxb2wd4zgDQSBNQeIoT/Ygfg=</DigestValue></Reference></SignedInfo><SignatureValue>RuUwh1JQxTpd5EiwCeVR7436fquGI8dWdf7TMATAptGsu9dTWfDzOeDPSR0x+nDtC7qdS8YP52xiqFIm8GKcJ0cpMH6D4sU6ZyAwXJJ3F3fiSXNjzl9cFIbRU6NIb4MsF2lWebIPBYulZRLdTYr9aHbLR4kcRqWigY1oDFZL0ra5srJUqyFH03DhE5zywm+hG+b4fK3Oz8LjKCxU690HTC7B02uVlejRcWJVlROAlw6VlwgOmQRXCfrJF1v1BgXh4Do39RJ7UeLehQF0ntRy8R2s8P2aUPaYifTiWiJU7T62DSFIplS5LsAwJyNQCXOPlM7RLwpN3DwnNScnic7Rqw==</SignatureValue></Signature></Receipt>'
//var doc = new DOMParser().parseFromString(receptData);
//var receipt = doc.getElementsByTagName('Receipt')[0];
//var certificateId = receipt.getAttribute('CertificateId');
//var productReceipt = receipt.getElementsByTagName('ProductReceipt')[0];
//var purchasePrice = productReceipt.getAttribute('PurchasePrice');
//var purchaseDate = productReceipt.getAttribute('PurchaseDate');
//var id = productReceipt.getAttribute('Id');
//var signature = select(doc, "/*/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']")[0]
//var sig = new SignedXml()
//sig.keyInfoProvider = new FileKeyInfo(path.resolve('game-server/config/local-wp-iap.pem'));
//sig.loadSignature(signature.toString())
//var res = sig.checkSignature(receptData)
//console.log(res)
//if(!res) console.log(sig.validationErrors)

//var form = {
//	uid:'YTFkMTFhMTE5ZjM1Mjk2MjFiOTI4ZGJmNmU1ODM4YjI%3D',
//	trade_no:'2015112421001004310209890233',
//	show_detail:1
//}
//request.post('http://www.adeasygo.com/payment/sync_server', {form:form}, function(e, resp, body){
//	console.log(e);
//	console.log(resp.statusCode);
//	console.log(JSON.parse(body));
//})

//var form = {
//	trade_no:'2015111121001004310034680689'
//}
//
//request.post('http://www.adeasygo.com/payment/update_server', {form:form}, function(e, resp, body){
//	console.log(e);
//	console.log(resp.statusCode);
//	console.log(body);
//})
//
//var sendAndroidNotice = function(apiKey, token, message){
//	var sender = new gcm.Sender(apiKey);
//	var notice = new gcm.Message();
//	notice.addData('message', message);
//	sender.sendNoRetry(notice, {registrationTokens:[token]}, function(e, resp){
//		console.log(e, resp)
//	});
//}
//sendAndroidNotice('AIzaSyBgWSvfovLyEsJT1Al-vG-24reZOa6I5Jc', 'APA91bHFBb2hXfMmzmonJ0GvmbP7dBszZe82smX6w4oC8talVIDX3mMMxFzXIrGd3xpZzy0cSxN6tw8FcqAZcD5Hy4S2pftGy0cbVtQ6KFML-SefS1zO20KJRB7-Qn0cIqj6QhxF2Wr0', 'Hello Android!')
//
//(function androidIAPValidate(){
//	var googleplay_public_key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkmL61X0ltsdgO+r4UgmgdmceWYMV2Fbm+JYMBJoVQfWB4NUuyMCeScddycmIrrdvO3L7K7CPAkO9lZD3dC9ePC9iFDOhN4d2A3t8hlHHq0KodN0hGUqHPvB09Y8Zon1pmcbQTJDnSvX+s9nQTiff2auf5N2mRyBae5xYv83T228udHSUyb2E6n2g6CFoUhK8rR8eryY8QUyLxX4ylaEYlHlhjmakNfrFwNRaiLHUVs+2Qc7oLlvHnQpvo9/RldAxgJ7i7QhytSytP3x4Z26qy7V66fyV2jAYLh+28Lj7otWPS95RKIZeLtdGa2HgHCDC1HEpkKea0Gh/f/Jfk/zL0QIDAQAB";
//	var googleplayVerifier = new IABVerifier(googleplay_public_key);
//	var receiptData = {
//		"orderId":"GPA.1359-3108-9738-89718",
//		"packageName":"com.batcatstudio.dragonfall",
//		"productId":"com.dragonfall.2500dragoncoins",
//		"purchaseTime":1452563778770,
//		"purchaseState":0,
//		"purchaseToken":"ocejalgdkegdcjnnmfekjbcd.AO-J1OzjejJU4DtI5LUZQyFiMpFJs2YcJN7_0OqLUuXKd5koNkZJPqGe3qGST7FLUksLl6rbQR7I6pPd7c7m6V44Di8lxPraTyzfHBKq9tQLxZNggtTAvRd8lQ1RhpxPWnchwTli6zCxSxwzM7tNCgOjJDOXvKL9Jg"
//	}
//	var receiptSignature = "keGsBlU+LNSqCNlR4cKUyDvcQoe5+Q3Tj6dCnxHQCWq6j173Nkts0QMRiy4jteJznDDyxATYmfA6zJdPRbzb7J426LM0g3MdwEmD29aUVRlEJzoQrs7yBahRt6y7obCEXFns6Fb107OvYeFdEax7Bf7QfnHdRwUt2s8zl/FibrCk4m9VkOy+SXtva3IlE+Igv46lD7OwurxbVUYo+C8pvaBX1JnorDA2vvNpR54Kp7zAxj5HZ1QnuQjmL1RJcOd6lh0CkpY18OBMc+nQZygyotz1QQz+pZaTN1LHLh9Nm0QXhU2Ax5kOcR+nl0lXSMEwNljTLIVa2DnkaE7b8jN3+Q==";
//	receiptData = JSON.stringify(receiptData)
//	console.log(receiptData)
//	var isValid = googleplayVerifier.verifyReceipt(receiptData, receiptSignature);
//	console.log(isValid)
//})()
//

//var mongoBackup = require('mongodb_s3_backup')
//var config = {
//	"mongodb":{
//		"host":"52.193.86.12",
//		"port":27017,
//		"username":false,
//		"password":false,
//		"db":"dragonfall-tokyo-ios"
//	},
//	"s3":{
//		"key":"AKIAIP4DMAKM7VTWB73Q",
//		"secret":"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",
//		"bucket":"dragonfall-tokyo-ios",
//		"destination":"/",
//		"encrypt":true,
//		"region":"ap-northeast-1"
//	}
//}
//
//mongoBackup.sync(config.mongodb, config.s3, function(e){
//	console.log(e);
//})
//
//var prestigeRankList = new SortedArraySet([],function(objLeft, objRight){
//	return objLeft.id === objRight.id;
//}, function(a, b){
//	return a.score >= b.score;
//})
//
//prestigeRankList.add({id:'a' ,score:1})
//prestigeRankList.add({id:'b' ,score:3})
//prestigeRankList.add({id:'c' ,score:2})
//prestigeRankList.add({id:'d' ,score:5})
//prestigeRankList.add({id:'e' ,score:4})
//prestigeRankList.add({id:'f' ,score:6})
//
//
//
//console.log(prestigeRankList.toArray());
//var service = new apn.Connection({
//	production:false,
//	pfx:path.resolve('game-server/config/aps_development_final.p12'),
//	passphrase:"",
//	maxConnections:10
//});
//
//service.on("transmissionError", function(errCode, notification, device){
//	console.error("PushIosRemoteMessage.transmissionError", {
//		errCode:errCode,
//		device:device,
//		notification:notification
//	});
//});
//
//var note = new apn.Notification();
//note.alert = "hello from modun's macbook pro";
//note.sound = "default";
//service.pushNotification(note, ["2d129953eda8b78aad550f23c8ebf5fae3ddb72111fcd19f6e48ce2dda3afc0b"]);

var ErrorUtils = require("../game-server/app/utils/errorUtils");

var WpAdeasygoBillingValidate = function(uid, transactionId, callback){
	var playerDoc = {_id:uid};
	var form = {
		uid:uid,
		trade_no:transactionId,
		show_detail:1
	};
	request.post("http://www.adeasygo.com/payment/sync_server", {form:form}, function(e, resp, body){
		if(!!e){
			e = new Error("请求Adeasygo验证服务器网络错误,错误信息:" + e.message);
			console.log('cache.playerIAPService.WpAdeasygoBillingValidate', null, e.stack);
			return callback(e);
		}
		if(resp.statusCode !== 200){
			e = new Error("服务器未返回正确的状态码:" + resp.statusCode);
			console.log('cache.playerIAPService.WpAdeasygoBillingValidate', {statusCode:resp.statusCode}, e.stack);
			return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
		}
		var jsonObj = null;
		try{
			jsonObj = JSON.parse(body);
		}catch(e){
			var newE = new Error("解析Adeasygo返回的json信息出错,错误信息:" + e.message);
			console.log('cache.playerIAPService.WpAdeasygoBillingValidate', {body:body}, newE.stack);
			return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, newE.message));
		}
		if(jsonObj.code !== 1 || !jsonObj.trade_detail || jsonObj.trade_detail.app_id !== "ea9d6d3a7d050b8b"){
			return callback(ErrorUtils.iapValidateFaild(playerDoc._id, jsonObj));
		}
		var productId = jsonObj.trade_detail.out_goods_id;
		var itemConfig = DataUtils.getStoreProudctConfig(productId);
		if(!itemConfig){
			e = ErrorUtils.iapProductNotExist(playerDoc._id, productId);
			e.isLegal = true;
			return callback(e);
		}

		var tryTimes = 0;
		var maxTryTimes = 5;
		(function finishTransaction(){
			tryTimes++;
			var form = {
				trade_no:transactionId
			};
			request.post("http://www.adeasygo.com/payment/update_server", {form:form}, function(e, resp, body){
				if(!!e){
					e = new Error("请求Adeasygo更新订单状态出错,错误信息:" + e.message);
					console.log('cache.playerIAPService.WpAdeasygoBillingValidate', null, e.stack);
					if(tryTimes < maxTryTimes){
						return setTimeout(finishTransaction, 500);
					}else{
						return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
					}
				}
				if(resp.statusCode !== 200){
					e = new Error("服务器未返回正确的状态码:" + resp.statusCode);
					console.log('cache.playerIAPService.WpAdeasygoBillingValidate', {statusCode:resp.statusCode}, e.stack);
					if(tryTimes < maxTryTimes){
						return setTimeout(finishTransaction, 500);
					}else{
						return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
					}
				}
				var jsonObj = null;
				try{
					jsonObj = JSON.parse(body);
				}catch(e){
					e = new Error("解析Adeasygo返回的json信息出错,错误信息:" + e.message);
					console.log('cache.playerIAPService.WpAdeasygoBillingValidate', {body:body}, e.stack);
					if(tryTimes < maxTryTimes){
						return setTimeout(finishTransaction, 500);
					}else{
						return callback(ErrorUtils.netErrorWithIapServer(playerDoc._id, e.message));
					}
				}
				if(jsonObj.code !== 1){
					if(tryTimes < maxTryTimes){
						return setTimeout(finishTransaction, 500);
					}else{
						return callback(ErrorUtils.iapValidateFaild(playerDoc._id, jsonObj));
					}
				}else{
					callback(null, {
						transactionId:transactionId,
						productId:productId,
						quantity:1
					});
				}
			});
		})();
	});
};

var uid="ZTY5YzJiNzZmY2YyZWRlOWZjNzM2MWQxOTExNGE1NWU%3D";
var transactionIds = [
	"5T409277JX608245W",
];

(function billingFix(){
	if(transactionIds.length > 0){
		var id = transactionIds.pop();
		WpAdeasygoBillingValidate(uid, id, function(e){
			if(!!e){
				console.log(id, e);
				billingFix();
			}else{
				console.log('订单：' + id + ' 修复完成!');
				billingFix();
			}
		});
	}else{
		console.log("所有订单修复完成！");
	}
})();