//游戏服务器
var gameconfig = require('./gameconfig');
var TableFrame = require('./TableFrame');
var ServerUserItem = require('./ServerUserItem');
var util = require('util');
var events = require('events');
var io = require('socket.io');
var loginCorresIO = require('socket.io-client');
var fs = require('fs');
var https = require('https');
var AndroidManager = require('./AndroidManager');
var Config = require('./Config').stockControl;
var logger = require('log4js').getLogger();
var define = require('./define');
var ttutil = require("./ttutil");
var gameCMD = define.gameCMD;
var gameEvent = define.gameEvent;
var gameConst = define.gameConst;
var corresCMD = define.corresCMD;

var socketMgr = require("./socketMgr")
/**
 * 服务器类
 * @constructor
 */
function GameServer() {
    this.tableFrame = [];
    this.PORT = null;
    this.serverUserArray = [];
    this.logCorresSock = null;
    this.roomInfo = null;
    this.androidManager = null;
    this.serverSocket = null;
    this.userMap = {}


    if (gameconfig["Single"] == true) {
        this.roomInfo = {};
        this.roomInfo.RoomID = 1;               //房间ID
        this.roomInfo.GameName = "游戏模板";                //游戏名
        this.roomInfo.RoomName = "游戏模板";                //房间名
        this.roomInfo.GameMode = 2;             //房间模式
        this.roomInfo.TableCount = 1;       //桌子数
        this.roomInfo.ChairCount = 100;     //一张桌子椅子数
        this.roomInfo.Revenue = 0;          //税收千分比
        this.roomInfo.MinSitScore = 1;              //最小进入分数
        this.roomInfo.Cheat = 0;            //是否是防作弊模式
        this.PORT = 1236;               //游戏端口

        this.init();
        var self = this;
        setTimeout(function () {
            var androidNum = gameconfig["AndroidNum"] || 0;
            for (var i = 0; i < androidNum; ++i) {

                if (i == (gameconfig["chairID"] == null ? 4 : gameconfig["chairID"]))
                    continue;
                setTimeout((function (i) {

                    return function () {
                        var info = {};
                        info.userID = i;
                        info.gameID = i;
                        info.faceID = i % 5 + 1;
                        info.tableID = 0;
                        info.chairID = i;
                        info.score = 300000000;
                        info.nickname = "大鱼" + i;
                        info.memberOrder = i;
                        info.gender = 0;
                        info.isAndroid = 1;
                        info.sex = i % 2;



                        self.onLCUserSitDown(null, info);
                    }

                })(i), 2000);
            }
        }, 1000);
    }

}
/**
 * 继承事件发射器
 */
util.inherits(GameServer, events.EventEmitter);


var p = GameServer.prototype;


/**
 * 初始化游戏服务器
 * @returns {boolean}
 */
p.init = function () {
    if (this.roomInfo == null) {
        return false;
    }
    var tableCount = this.roomInfo["TableCount"];
    //创建桌子
    for (var i = 0; i < tableCount; ++i) {
        this.tableFrame[i] = new TableFrame(i, this.roomInfo, this);
    }

    this.androidManager = new AndroidManager(this);

    return true;
};

/**
 * 连接登录协调服
 */
p.connectLogonCorres = function() {
    this.logCorresSock = loginCorresIO.connect(gameconfig["LoginAddr"]);
    var self = this;
    this.logCorresSock.on("connect", function (data) {
        logger.info("连接协调登录服成功");
        //请求房间信息
        self.sendLCData("RoomInfo", {roomID: gameconfig["RoomID"]});
    });

    this.logCorresSock.on("disconnect", function (reason) {
        logger.info("协调登录服断开",reason);
        self.stop();
    });

    //登录协调服事件
    this.onCorresEvent();
};

/**
 * 发送协调服消息
 * @param eventName
 * @param msg
 */
p.sendLCData = function(eventName, msg) {
    if (!gameconfig["Single"]) {
        this.logCorresSock.emit("msg", eventName, {}, msg);
    }
};

/**
 * 监听登录协调服事件
 */
p.onCorresEvent = function() {


    this.logCorresSock.on("serverMsg", this.onServerMsg.bind(this));
};
//服务器消息
p.onServerMsg = function(eventName, session, data) {

    logger.info("onServerMsg", eventName, session, data)
    if (eventName == "RoomInfo") {
        //房间信息事件
        this.onLCRoomInfo(data)
    } else if (eventName == "UserSitDown") {
        //用户坐下
        this.onLCUserSitDown(session, data)
    } else if (eventName == "UserStandUp") {
        //用户起立
        this.onLCUserLeave(session, data)
    } else if (eventName == "UserLeave") {
        //用户离开
        this.onLCUserLeave(session, data)
    } else if (eventName == "WriteScore") {
        //用户写分
        this.onLCUserScore(data)
    } else if (eventName == "ModifyUserWeight") {
        //修改用户权重
        this.onLCModifyUserWeight(data)
    } else if (eventName == "GetRoomControl") {
        //获取房间控制配置
        this.onLCGetRoomControl(data)
    } else if (eventName == "ModifyRoomControl") {
        //修改房间控制配置
        this.onLCModifyRoomControl(data)
    } else if (eventName == "onUserOffline") {
        //玩家掉线
        this.onUserOffline(session, data)
    } else if (eventName == "onUserRelogin") {
        //玩家重新上线
        this.onUserRelogin(session, data)
    }
};

/**
 * 修改用户权重
 * @param data
 */
p.onLCModifyUserWeight = function (data) {
    logger.info("修改用户权重， userID: " + data.userID + " weight: " + data.weight);
    var userItem = this.getUserItemByUserID(data.userID);
    //有用户且 weight是数字
    if (userItem != null && !isNaN(parseFloat(data.weight))) {
        userItem.setWeight(data.weight);
    }
};

/**
 * 获取房间控制配置
 * @param data
 */
p.onLCGetRoomControl = function (data) {
    logger.info("获取房间控制配置");

    try {
        var config = Config.onGetContronlCofig();
        this.sendLCData(corresCMD.GET_ROOM_CONTROL, {msgIndex: data.msgIndex, config: config});
    }
    catch (e) {
        logger.error("-----------------------------------------------");
        logger.error("获取房间控制配置出错");
        logger.error(e);
        logger.error("-----------------------------------------------");
        this.sendLCData(corresCMD.GET_ROOM_CONTROL, {
            msgIndex: data.msgIndex,
            config: [{key: "errDesc", value: "子游戏获取房间控制配置出错", desc: "出错信息", attr: "r"}]
        });
    }

};

/**
 * 修改房间控制配置
 * @param data
 */
p.onLCModifyRoomControl = function (data) {
    logger.info("修改房间控制配置" + JSON.stringify(data));

    try {
        var ret = Config.onModifyControlConfig(data.config);
        var retData = {};
        if (!ret) retData.errMsg = "修改房间控制配置失败";
        else retData.success = true;
        this.sendLCData(corresCMD.MODIFY_ROOM_CONTROL, {msgIndex: data.msgIndex, data: retData});
    }
    catch (e) {
        logger.error("-----------------------------------------------");
        logger.error("保存房间控制配置出错");
        logger.error(e);
        logger.error("-----------------------------------------------");
        this.sendLCData(corresCMD.MODIFY_ROOM_CONTROL, {msgIndex: data.msgIndex, data: {errMsg: "子游戏出错,请联系该子游戏作者"}});
    }

};

//玩家掉线
p.onUserOffline = function(session, data) {
    logger.info("用户掉线 ", session, data);

    if (data == null) {
        return false;
    }
    var userID = data.userID
    var userItem = this.getUserItemByUserID(userID)

    if (!userItem) {
        logger.error("未找到玩家")
        return false
    }

    var tableID = userItem.tableID
    var table = this.tableFrame[tableID]
    if (!table) {
         logger.error("onUserOffline 未找到玩家桌子")
         return
    }

    table.onUserOffline(userItem)
    return true


};



//玩家重连
p.onUserRelogin = function(session, data) {
    logger.info("玩家重连 ", session, data);

    if (data == null) {
        return false;
    }
    var userID = data.userID
    var userItem = this.getUserItemByUserID(userID)

    if (!userItem) {
        logger.error("未找到玩家")
        return false
    }

    userItem.session = data.session
    
    this.sendUserInfoPacket(userItem)
    var tableID = userItem.tableID
    var table = this.tableFrame[tableID]
    if (table) {
        table.onUserRelogin(userItem)
    }
    return true
};


/**
 * 得到要下发到游戏的配置
 */
p.getGameConfig = function () {
    var config = {};

    //这边暂时没有需要配置的东西

    return config;
};


/**
 * 分数变更    LC --> S
 * @param data
 * @returns {boolean}
 */
p.onLCUserScore = function (data) {
    if (data == 0) return false;
    var score = data["score"];
    var userID = data["userID"];

    var userItem = this.getUserItemByUserID(userID);
    if (userItem == null || score == null) {
        //logger.info ("更变分数失败，用户分数或者用户分数为NULL");
        return false;
    }

    //userItem.setUserScore(score);

    return true;
};


/**
 * 用户坐下   LC --> S
 * @param data
 * @returns {boolean}
 */
p.onLCUserSitDown = function(session, data) {
    logger.info("用户请求坐下 ", session, data);

    if (data == null) {
        return false;
    }
    var userID = data.userID
    var userSession = data.session

    var userItem = this.getUserItemByUserID(userID)

    if (userItem) {
        logger.error("玩家已在座位上 ，请退出先")
        return false
    }

    if (data.isAndroid == true) {
        userItem = this.createAndroid(data);
    } else {
        userItem = new ServerUserItem(userSession, this)
        userItem.setInfo(data);        
    }

    //如果他了tableID为0xffff的话，自动寻位
    var tableID = data['tableID'];
    var chairID = data['chairID'];
    if (tableID == null || chairID == null) {
        logger.error("非法桌子椅子号", userItem.userID, data);
        return false
    }

    if (tableID < 0 || tableID >= this.roomInfo["TableCount"]) {
        logger.error("非法桌子号", userItem.userID, data);
        return false;
    }

    if (chairID < 0 || chairID >= this.roomInfo["ChairCount"]) {
        logger.error("非法椅子号", userItem.userID, data);
        return false;
    }

    if (this.tableFrame[tableID].getTableUserItem(chairID)) {
        logger.info("坐下失败， 这个位置上已经有人了");
        return false;
    }

    var table = this.tableFrame[tableID]
   
    //坐下处理
    var sitSuccess = table.performSitDownAction(chairID, userItem);
    if (data.tableSetting && !table.getTableConfig()) {

        table.setTableConfig(data.tableSetting) //第一个人来配置桌子
        logger.info("桌子配置", data.tableSetting)
    }
    if (sitSuccess) {
        //发送给用户这桌的玩家
        this.sendUserInfoPacket(userItem);
        //通知这桌其他用户
        this.sendUserEnter(userItem);
    } else {
        logger.error("非法椅子号", userItem.userID, data);
        return false
    }

    this.userMap[userID] = userItem //

    this.sendLCData("SitDownSuccess", {
        userID: userItem.userID,
        roomID: this.roomInfo.RoomID,
        tableID: userItem.tableID,
        chairID: userItem.chairID,
        tableSetting: table.getTableConfig()
    });
        //通知客户端成功
    this.sendData(userItem, gameCMD.MDM_GR_LOGON, gameCMD.SUB_GR_LOGON_SUCCESS, {
        userID: userItem.userID,
        gameConfig: this.getGameConfig()
    });
    logger.info("坐下成功");

    return true
};


/**
 * 机器人人离开    LC --> S
 * @param data
 */
p.onLCUserLeave = function(session, data) {
    var userID = data["userID"];
    logger.error("onLCUserLeave:" + userID);
    var userItem = this.getUserItemByUserID(userID);
    if (!userItem) {
        logger.error("用户不在房间内 离开失败:" + data["userID"]);
    } else {
        logger.info("用户离开,ID:" + data["userID"] + "是否是机器人: " + userItem.isAndroid + " 昵称 " + userItem.getNickname());
        this.deleteUserItem(userItem);


    }
};

/**
 * 创建机器人
 * @param info
 * @returns {ServerUserItem|exports|module.exports}
 */
p.createAndroid = function (info) {
    var userItem = new ServerUserItem(null, this);
    userItem.setInfo(info);
    this.serverUserArray.push(userItem);
    this.androidManager.createAndroidItem(userItem);
    return userItem;
};

/**
 *  房间消息   LC --> S
 * @param data
 * @returns {*}
 */
p.onLCRoomInfo = function (data) {

    if (data.errMsg) {
        logger.error(data.errMsg);
        return false;
    }

    //登入消息
    var crtRoom = null;
    var roomID = "roomID";
    for (var i = 0; i < data.length; ++i) {
        if (parseInt(gameconfig["RoomID"]) == data[i][roomID]) {
            crtRoom = data[i];
        }
    }

    if (crtRoom == null) {
        return crtRoom
    }


    logger.info(crtRoom);

    this.roomInfo = {};
    this.roomInfo.RoomID = crtRoom["roomID"];				//房间ID
    this.roomInfo.GameName = crtRoom["moduleName"];				//游戏名
    this.roomInfo.RoomName = crtRoom["roomName"];				//房间名
    this.roomInfo.GameMode = crtRoom["roomMode"];				//房间模式
    this.roomInfo.TableCount = crtRoom["tableCount"];		//桌子数
    this.roomInfo.ChairCount = crtRoom["chairCount"];		//一张桌子椅子数
    this.roomInfo.Revenue = crtRoom["revenue"];			//税收千分比
    this.roomInfo.MinSitScore = crtRoom["minScore"];				//最小进入分数
    this.roomInfo.Cheat = crtRoom["cheatProof"];			//是否是防作弊模式
    this.PORT = crtRoom["port"];				//游戏端口

    if (gameconfig["FreeMode"]) {
        this.roomInfo.MinSitScore = gameconfig["FreeModeMinScore"];
    }

    this.init();
    this.start();
    logger.info("游戏服务器启动成功");
    //返回启动成功消息
    this.sendLCData(corresCMD.OPEN_OK, crtRoom);
};


/**
 * 开启服务器 消息格式 {mainCMD:x, subCMD:x, data:{xxx}}
 */
p.start = function() {

    this.serverSocket = io.listen(this.PORT);
    logger.info("端口号" + this.PORT);
    var that = this;
    //连接成功
    this.serverSocket.on("connection", this.onConnect.bind(this))

    //异步事件处理
    this.onAsynEvent();
};
//新连接
p.onConnect = function(socket) {

    var socketID = socketMgr.addSocket(this.namespace, socket)


    socket.on("msg", this.onMessage.bind(this, socketID))
    socket.on("game", this.onMessage.bind(this, socketID))
    socket.on("disconnect", this.onDisConnect.bind(this, socketID));
    socket.on("error", this.onError.bind(this, socketID));

    if (gameconfig["Single"]) { //单机模式 连接就是直接坐下了
        var tableFrame = this.tableFrame[0];
        var i = Object.keys(this.userMap).length;
        var info = {};

        var session = {
            sid: null,
            socketID
        }
        info.session = session
        info.userID = 123 + i;
        info.gameID = 123 + i;
        info.faceID = 1;
        info.tableID = 0;
        info.chairID = tableFrame.getFreeChairID();
        info.score = 2000012;
        info.nickname = "小鱼" + i;
        info.gender = 0;
        info.isAndroid = 0;
        info.memberOrder = 10;
        this.onLCUserSitDown(session, info);
        console.info("用户登录ID: " + info.userID + " \n主动请求");

    }

};




//socket错误
p.onError = function(socketID, err) {
    this.onDisConnect(socketID)
    logger.error("onError", err)
};

//断开连接
p.onDisConnect = function(socketID, reason) {
    //this.onUserShut(data, socket);
    logger.error("断开连接", socketID, reason)
};

p.onMessage = function(socketID, eventName, data) {

    logger.info("onMessage", socketID, eventName,  data)
    try {
        var func = this[eventName]
        if (func) {
            logger.info(eventName, data)
            func.bind(this)(data)
        } else {
            logger.error("未找到句柄", socketID, eventName, session, data)
        }
    } catch (err) {
        logger.error("------------------------------------------------------------------");
        logger.error(data);
        logger.error(err);
        logger.error("------------------------------------------------------------------");
    }
};


p.auth = function(data, session) {
    logger.info("auth", session, data)
    var sid = data.sid
    socketMgr.authOK(sid, session.socketID)


};
/**
 * 通信主函数
 * @param data {mainCMD:x, subCMD:x, data:{xxx}}
 * @param session 机器人时为null
 * @param androidUserItem 真人时为null
 * @returns {boolean}
 */
p.onClientSocketEvent = function(data,  androidUserItem) {
    logger.error("11111 收到客户端消息", data)
    var ret = false;
    var userID = data.userID
    var userItem = this.getUserItemByUserID(userID)

    if (!userItem) {
        logger.error("错误,用户并未登录该子游戏")
        return
    }

    try {
        switch (data['mainCMD']) {
            //用户命令
            case gameCMD.MDM_GR_USER:
                ret = this.onClientUserEvent( data['subCMD'], data, userItem, androidUserItem);
                break;
                //游戏命令
            case gameCMD.MDM_GF_GAME:
                ret = this.onClientGameEvent( data['subCMD'], data, userItem, androidUserItem);
                break;
                //框架命令
            case gameCMD.MDM_GF_FRAME:
                ret = this.onClientFrameEvent( data['subCMD'], data, userItem, androidUserItem);
                break;
        }
    } catch (err) {
        //捕获异常错误处理
        try {
            this.deleteUserItem(userItem, androidUserItem, true);
            logger.error(err.stack);
        } catch (err2) {
            logger.error(err2.stack);
        }

    }

    //如果返回值错误断开链接
    if (!ret) {
        this.deleteUserItem(userItem, androidUserItem, true);
    }
};


/**
 * 停服
 */
p.stop = function() {
    logger.info("游戏服务器停止1");
    this.removeAllListeners();
    var i, userItem;
    //删除玩家
    for (i = 0; i < this.serverUserArray.length; ++i) {
        userItem = this.serverUserArray[i];
        if (!userItem.isAndroid) {
            //userItem.socket.disconnect();
        }
    }
    this.serverUserArray.length = 0;


    //可能还没连接上就断开了就是还没有执行init。所以要做此非空判断
    this.androidManager && this.androidManager.clearAll();


    //删除桌子
    this.tableFrame.length = 0;

    this.serverSocket && this.serverSocket.close();
};
/**
 * 用户关闭
 * @param data
 * @param session
 * @returns {boolean}
 */
p.onUserShut = function (data, socket) {
    var userItem = this.getUserItem(socket);
    //
    if (userItem == null) {
        logger.info("user shut user is null");
        //socket.disconnect();
        return true;
    }
    //断线

    logger.info("用户socket断开退出，用户ID：" + userItem.getUserID() + " 原因： " + data);
    this.deleteUserItem(socket, userItem, true);
    return true;
};
/**
 * 内部异步事件
 */
p.onAsynEvent = function () {
    //玩家状态
    this.on(gameEvent.EVENT_USER_STATUS, this.eventUserItemStatus);
    //分数状态
    this.on(gameEvent.EVENT_USER_SCORE, this.eventUserItemScore);
    //机器人消息处理
    this.on(gameEvent.EVENT_ANDROID, this.onClientSocketEvent);
};
/**
 * 用户分数变更
 * @param userItem 用户
 */
p.eventUserItemScore = function (userItem) {
    if (userItem instanceof ServerUserItem == false) return false;

    var table = this.tableFrame[userItem.getTableID()];

    if (table != null) {
        table.broadCastTableData(gameCMD.MDM_GR_USER, gameCMD.SUB_GR_USER_SCORE, null,
            {userID: userItem.userID, score: userItem.getUserScore()});
    }
};
/**
 * 用户状态变更
 * @param userItem 用户
 * @param oldTableID 旧桌子
 * @param oldChairID 旧椅子
 * @returns {boolean}
 */
p.eventUserItemStatus = function (userItem, oldTableID, oldChairID, oldStatus) {
    //暂时回送坐下消息 以及检测游戏开始
    if (userItem instanceof ServerUserItem == false) return false;

    if (userItem.userStatus != gameConst.US_FREE) { // 其他操作

        this.sendLCData(corresCMD.USER_STATUS, {userID: userItem.userID, status: userItem.userStatus});
        if (userItem.userStatus == gameConst.US_NULL) {
            logger.info("游戏服 -> 协调服, 用户状态： " + userItem.userStatus + " 游戏ID：" + userItem.getUserID());
        }

    }

    if (userItem.userStatus == gameConst.US_NULL && !userItem.isAndroid) {
        //如果状态为US_NULL关闭链接删除用户
        //userItem.socket.disconnect();
    }

    //群发状态本桌
    var table = this.tableFrame[userItem.tableID];
    if (table == null) {
        return false;
    }
    //群发给本桌
    table.broadCastTableData(gameCMD.MDM_GR_USER, gameCMD.SUB_GR_USER_STATUS, null,
        {
            userID: userItem.userID,
            tableID: userItem.tableID,
            chairID: userItem.chairID,
            userStatus: userItem.userStatus
        });

    if (userItem.userStatus == gameConst.US_READY) {
        //检测开始
        var table = this.tableFrame[userItem.tableID];

        if (table != null && table.efficacyStartGame()) {
            table.startGame();
        }
    }

    return true;
};



   
/**
 * 框架事件
 * @param subCMD
 * @param data
 * @param session
 * @param androidUserItem
 * @returns {boolean}
 */
p.onClientFrameEvent = function (subCMD, data, userItem, androidUserItem) {

    logger.info("onClientFrameEvent", data, userItem.nickname,userItem.userID)

    var tableID = userItem.getTableID();
    var chairID = userItem.getChairID();


    if (tableID == null || chairID == null) return false;

    var tableFrame = this.tableFrame[tableID];

    switch (subCMD) {

        default :
            return tableFrame.onEventSocketFrame(subCMD, data, userItem);
    }

    return true;
};
/**
 * 游戏事件
 * @param subCMD
 * @param data
 * @param session
 * @param androidUserItem
 * @returns {boolean}
 */
p.onClientGameEvent = function(subCMD, data, userItem, androidUserItem) {
    logger.info('onClientGameEvent',subCMD ,data);


    var tableUserItem = userItem
    if (tableUserItem == null) {
        logger.info('the client userItem is null');
        return false;
    }

    if (tableUserItem.tableID == null || tableUserItem.chairID == null) {
        return true;
    }

    var tableFrame = this.tableFrame[tableUserItem.tableID];

    if (tableFrame == null) return false;

    return tableFrame.onEventSocketGame(subCMD, data, tableUserItem);
};
/**
 * 通过socket获取用户
 * @param session
 * @returns {*}
 */
p.getUserItem = function (socket) {

    if (!socket) {
        return null;
    }

    for (var i = 0; i < this.serverUserArray.length; ++i) {
        if (this.serverUserArray[i].socket == socket) {
            return this.serverUserArray[i];
        }
    }
    return null;
};
/**
 * 通过游戏ID获取用户
 * @param userID
 * @returns {*}
 */
p.getUserItemByUserID = function (userID) {
    return this.userMap[userID]
};


/**
 * 通过游戏ID获取用户 , 判重
 * @param userID
 */
p.getUserItemArrayByUserID = function (userID) {
    var userArray = [];
    for (var i = 0; i < this.serverUserArray.length; ++i) {
        if (this.serverUserArray[i].userID = userID) {
            userArray.push(this.serverUserArray[i]);
        }
    }

    return userArray;
};



/**
 * 删除用户 (通知协调服务器)

 * @param userItem
 */
p.deleteUserItem = function(userItem, jiesan) {


    if (userItem == null) {
        logger.info("deleteUserItem userItem is null");
        return;
    }
    var table = this.tableFrame[userItem.tableID];

    if (!jiesan) {
        if (table != null) {
            table.onUserDismissReq(userItem)
        }
        this.sendLCData("UserStandUpSuccess", {
            userID: userItem.userID,
            success: 0
        });
        return
    }
    //如果已经被标志要删除了， 就不重入了， 比如玩家逃跑时， 可能会触发结算， 结算就会触发 分数踢人， 导致玩家重入
    if (userItem.markDelete) {
        return;
    }
    userItem.markDelete = true;
    //若在位置先让其起立

    if (table != null) {
        table.performStandUpActionNotNotifyPlaza(userItem);

        if (table.getCurPlayerNum() == 0 && table.tableSetting) { //没玩家了
            table.tableSetting = null //清掉这个桌子的配置
            logger.info("tableSetting set null")
        }

        table.broadCastTableData(gameCMD.MDM_GR_USER, gameCMD.SUB_GR_USER_STATUS, null, {
            userID: userItem.userID,
            tableID: userItem.tableID,
            chairID: userItem.chairID,
            userStatus: gameConst.US_NULL
        });
    }


    this.userMap[userItem.userID] = null

    ttutil.arrayRemove(this.serverUserArray, userItem);
    if (userItem.isAndroid) {
        this.androidManager.deleteAndroidUserItem(userItem);
    }

    this.sendLCData("UserStandUpSuccess", {
        userID: userItem.userID,
        success:1
    });



};



/**
 * 检测函数，如果userItem不为null直接返回，如果为null，通过sock查找用户
 * @param sock
 * @param userItem
 * @returns {*}
 */
p.checkUserItem = function (sock, userItem) {
    if (userItem != null) {
        return userItem;
    }
    return this.getUserItem(sock);
};


/**
 * 发送玩家消息
 * @param userItem 用户
 * @param mainCMD 主命令
 * @param subCMD 子命令
 * @param data 数据
 * @param messageType消息类型， 默认message
 * @returns {boolean}
 */
p.sendData = function(userItem, mainCMD, subCMD, data, messageType) {

    logger.info("发送消息给玩家11 0", userItem.nickname, mainCMD, subCMD, data);
    if (userItem instanceof ServerUserItem == false) {
        logger.info("消息发送错误, userItem不是ServerUserItem");
        //logger.info("消息发送错误, userItem不是ServerUserItem")
        return false;
    }

    messageType = messageType || "message";

    var o = {};
    o.mainCMD = mainCMD;
    o.subCMD = subCMD;
    o.data = data;

    if (userItem.isAndroid == true) {
         logger.info("机器人发送消息11111", mainCMD, subCMD, data);
        //机器人发送消息
        //this.androidManager.sendDataToClient(userItem, mainCMD, subCMD, data);
    } else {

        logger.info("发送消息给玩家11111", mainCMD, subCMD, data);
        //直接发o
        socketMgr.tellUser(userItem, "gamemsg", o)

    }
};

/**
 * 发送给坐下玩家此桌玩家的消息
 * @param serverUserItem
 * @returns {boolean}
 */
p.sendUserInfoPacket = function (serverUserItem) {
    var table = this.tableFrame[serverUserItem.tableID];

    if (table == null) {
        return false;
    }

    var msg = [];

    var copyAttr = function (userItem) {
        return {
            userID: userItem.userID,
            gameID: userItem.gameID,
            tableID: userItem.tableID,
            chairID: userItem.chairID,
            faceID: userItem.faceID,
            nickname: userItem.nickname,
            sex: userItem.sex,
            score: userItem.score,
            userStatus: userItem.userStatus,
            memberOrder: userItem.memberOrder,
            otherInfo: userItem.otherInfo,
        };
    };

    //自己第一个进入
    msg.push(copyAttr(serverUserItem));

    for (var i = 0; i < this.roomInfo["ChairCount"]; ++i) {
        var userItem = table.getTableUserItem(i);
        if (userItem == null || userItem == serverUserItem) continue;
        msg.push(copyAttr(userItem));
    }


    this.sendData(serverUserItem, gameCMD.MDM_GR_USER, gameCMD.SUB_GR_USER_ENTER, msg);


    return true;
};
/**
 * 发送玩家进入
 * @param enterUserItem
 * @returns {boolean}
 */
p.sendUserEnter = function (enterUserItem) {
    var table = this.tableFrame[enterUserItem.tableID];

    if (table == null || enterUserItem == null) {
        return false;
    }

    var msg = [];
    var sendUser = {
        userID: enterUserItem.userID,
        gameID: enterUserItem.gameID,
        tableID: enterUserItem.tableID,
        chairID: enterUserItem.chairID,
        faceID: enterUserItem.faceID,
        nickname: enterUserItem.nickname,
        sex: enterUserItem.sex,
        score: enterUserItem.score,
        userStatus: enterUserItem.userStatus,
        memberOrder: enterUserItem.memberOrder,
        otherInfo: enterUserItem.otherInfo,
    };
    msg.push(sendUser);

    for (var i = 0; i < this.roomInfo["ChairCount"]; ++i) {
        var userItem = table.getTableUserItem(i);
        if (userItem == null || userItem == enterUserItem) continue;

        this.sendData(userItem, gameCMD.MDM_GR_USER, gameCMD.SUB_GR_USER_ENTER, msg);
    }

    return true;
};

/**
 * 发送tip消息
 * @param userItem
 * @param message
 * @returns {boolean}
 */
p.sendToastMsg = function (userItem, message) {
    if (userItem == null) {
        return false;
    }
    var o = {};
    o.message = message;
    this.sendData(userItem, gameCMD.MDM_GF_FRAME, gameCMD.SUB_GF_TOAST_MSG, o);
};

/**
 * 发送请求失败
 * @param userItem 用户
 * @param message 消息
 * @returns {boolean}
 * @constructor
 */
p.sendRequestFailure = function (userItem, message, type) {
    if (userItem == null) {
        return false;
    }
    var o = {};
    o.message = message;
    o.type = type;
    this.sendData(userItem, gameCMD.MDM_GF_FRAME, gameCMD.SUB_GF_REQUEST_FAILURE, o);
};


/**
 * 记录错误日记到数据库中
 * @param type
 * @param content
 */
p.recordError = function (type, content) {
    this.sendLCData(corresCMD.RECORD_ERROR, {type: type, content: content});
};

module.exports = GameServer;