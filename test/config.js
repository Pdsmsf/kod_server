var mongoAddr = {
	'local-ios':'mongodb://127.0.0.1:27017/dragonfall-local-ios',
	'local-wp':'mongodb://127.0.0.1:27017/dragonfall-local-wp',
	'local-android':'mongodb://127.0.0.1:27017/dragonfall-local-android'
}

var platform = {
	'local-ios':'ios',
	'local-wp':'wp',
	'local-android':'android'
}

module.exports = {
	platform:platform[process.env.platform],
	gateHost:"127.0.0.1",
	gatePort:13100,
	mongoAddr:mongoAddr[process.env.platform],
	gcId:"gc_id",
	gcId2:"gc_id_2",
	gcId3:"gc_id_3",
	gcId4:"gc_id_4",
	deviceId:"_testDeviceId",
	deviceId2:"_testDeviceId2",
	deviceId3:"_testDeviceId3",
	deviceId4:"_testDeviceId4",
	deviceId5:"_testDeviceId5",
	deviceId6:"_testDeviceId6",
	deviceId7:"_testDeviceId7",
	deviceId8:"_testDeviceId8",
	deviceId9:"_testDeviceId9",
	deviceId10:"_testDeviceId10",
	deviceId11:"_testDeviceId11",
	deviceId12:"_testDeviceId12",
	allianceName:"_testAllianceName",
	allianceTag:"_t1",
	allianceName2:"_testAllianceName2",
	allianceTag2:"_t2",
	allianceName3:"_testAllianceName3",
	allianceTag3:"_t3",
	allianceName4:"_testAllianceName4",
	allianceTag4:"_t4",
	allianceName5:"_testAllianceName5",
	allianceTag5:"_t5",
	allianceName6:"_testAllianceName6",
	allianceTag6:"_t6"
}
