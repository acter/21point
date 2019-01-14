////proto_buf
//var ProtoBuf = require("protobufjs");
//var YmCryto = require("./ymCrypto.js");
//
////protobuf Test
//var builder = ProtoBuf.loadProtoFile("./logon.proto");
//var RoomInfo = builder.build("RoomInfo");
//var roomInfo = new RoomInfo();
//
//var log = console.log;
//
//roomInfo.GameName = "四人牛牛";
//roomInfo.GameMode = 1;
//roomInfo.TableCount = 10;
//roomInfo.ChairCount = 4;
//roomInfo.Revenue = 5;
//roomInfo.Cheat = 0;
//
//var buffer = roomInfo.toBuffer();
//
//log(buffer);
//
//var test = YmCryto.aesCrypt(buffer);
//
//log(test);
//var deTest = YmCryto.aesDeCrypt(test);
//log(deTest);
//
//var roomTest = RoomInfo.decode(deTest);
//log(roomTest);
//
////https Test
//var https = require('https');
//var fs = require('fs');
//
//var options = {
//	key: fs.readFileSync('./key/ryans-key.pem'),
//	cert: fs.readFileSync('./key/ryans-cert.pem')
//};
//
//https.createServer(options, function (req, res) {
//  res.writeHead(200);
//  res.end("hello world\n");
//  console.log("Hello world");
//}).listen(8000);

