// //游戏服务器启动文件

var log4js = require('log4js');
log4js.configure('./config/log4js.json');
var logger = log4js.getLogger();

var gameconfig = require("./gameconfig.js");

//启动服务
(function () {

    //初始化

    if (process.argv.length >= 3) {
        logger.info("从" + process.argv[2] + "读取配置");

        var config = require(process.argv[2]);

        for (var key in gameconfig) {
            delete gameconfig[key];
        }

        for (var key in config) {
            gameconfig[key] = config[key];
        }
    }
    else {
        logger.info("没有外部配置文件， 读取默认的 gameconfig.js");
    }

    var GameServer = require('./GameServer');
    var gameServer = new GameServer();


    if (gameconfig["Single"] == true) {
        logger.info("使用单机模式中...");
        gameServer.start();
    }
    else {
        logger.info("连接协调登录服务器中...");
        gameServer.connectLogonCorres();
    }


    process.on('uncaughtException', function (e) {

        logger.error("error uncaughtException\t", e.stack);
    });


})();

