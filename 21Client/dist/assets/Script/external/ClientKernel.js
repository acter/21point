"use strict";

var NetHelp = require("NetHelp");

var GD = require("GD");
var define = require('define');
var GameUserManager = require('GameUserManager');

var gameCMD = define.gameCMD;
var gameConst = define.gameConst;

var ClientKernel = cc.Class({

    properties: {
        gameUserManager: null,
        gameStatus: null,
        myUserItem: null,
        myUserID: null,
        serverReady: false, //服务端是否准备好, 当成功触发onReady后， 就会重置为false， 防止重复触发
        clientReady: false, //客户端是否准备好，当成功触发onReady后， 就会重置为false， 防止重复触发
        tableSetting: null //桌子信息

    },

    ctor: function ctor() {
        this.gameUserManager = new GameUserManager();
        this.gameUserManager.init(this);
        this.myUserID = GD.userID;
        onfire.on("gamemsg", this.onEventMessage.bind(this));
    },

    getUserMgr: function getUserMgr() {
        return this.gameUserManager;
    },

    getTableSetting: function getTableSetting() {
        return this.tableSetting;
    },

    webSocketSend: function webSocketSend(data) {
        var roomID = 130;
        data.roomID = roomID;
        data.userID = this.myUserID;
        NetHelp.sendGameMessage("onClientSocketEvent", data);
    },

    /**
     * 消息事件
     * @param data
     * @returns {boolean}
     */
    onEventMessage: function onEventMessage(data) {

        switch (data["mainCMD"]) {

            case gameCMD.MDM_GR_LOGON:
                this.onSocketMainLogon(data["subCMD"], data["data"]);
                break;
            case gameCMD.MDM_GR_USER:
                this.onSocketMainUser(data["subCMD"], data["data"]);
                return true;

            case gameCMD.MDM_GF_GAME:
                this.onSocketMainGame(data["subCMD"], data["data"]);
                return true;

            case gameCMD.MDM_GF_FRAME:
                this.onSocketMainFrame(data["subCMD"], data["data"]);
                return true;
        }
    },

    /**
        * 登录处理函数
        * @param subCMD
        * @param data
        * @returns {boolean}
        */
    onSocketMainLogon: function onSocketMainLogon(subCMD, data) {
        switch (subCMD) {
            //登录成功
            case gameCMD.SUB_GR_LOGON_SUCCESS:
                //登录成功就获取自己
                this.myUserID = data["userID"];
                this.gameConfig = data["gameConfig"];
                this.myUserItem = this.gameUserManager.getUserByUserID(this.myUserID);
                console.log('用户信息', this.myUserItem); //this.onEventSelfEnter(this.myUserItem);
                //获取游戏信息
                //this.webSocket.send({mainCMD:gameCMD.MDM_GF_FRAME, subCMD:gameCMD.SUB_GF_GAME_OPTION});
                this.serverReady = true;
                this.loginSuccess = true;
                if (this.clientReady) {
                    this.onReady();
                    this.serverReady = false;
                }
                console.log("登录成功吗吗吗吗吗", data);
                onfire.fire("onLogonSuccess", this.myUserID, data);
                return true;

            default:
                return true;
        }
    },

    onClientReady: function onClientReady() {
        this.clientReady = true;
        if (this.serverReady) {
            this.onReady();
            this.clientReady = false;
        }
    },

    onReady: function onReady() {
        this.onEventSelfEnter(this.myUserItem);
        //获取场景游戏信息
        this.webSocketSend({
            mainCMD: gameCMD.MDM_GF_FRAME,
            subCMD: gameCMD.SUB_GF_GAME_OPTION
        });

        //自己先进
        this.onUserItemActive(this.myUserItem);

        var userItem = null;
        for (var i = 0; i < this.gameUserManager.tableUserItem.length; ++i) {
            userItem = this.gameUserManager.tableUserItem[i];
            if (!userItem || userItem == this.myUserItem) continue;
            this.onUserItemActive(userItem);
        }
    },

    getRoomInfo: function getRoomInfo() {

        //获取场景游戏信息
        this.webSocketSend({
            mainCMD: gameCMD.MDM_GF_FRAME,
            subCMD: gameCMD.SUB_GF_GAME_OPTION
        });
    },

    chat: function chat(text) {

        this.webSocketSend({
            mainCMD: gameCMD.MDM_GF_FRAME,
            subCMD: gameCMD.SUB_GF_USER_CHAT,
            text: text

        });
    },

    //解散游戏
    dismissGame: function dismissGame() {
        //获取场景游戏信息
        this.webSocketSend({
            mainCMD: gameCMD.MDM_GF_FRAME,
            subCMD: gameCMD.SUB_GF_USER_DISMISS_REQ

        });
    },

    agreeDismiss: function agreeDismiss(agree) {
        agree = agree || 0;
        //获取场景游戏信息
        this.webSocketSend({
            mainCMD: gameCMD.MDM_GF_FRAME,
            subCMD: gameCMD.SUB_GF_USER_DISMISS_AGREE,
            agree: agree

        });
    },

    /**
     * 用户命令函数
     * @param subCMD
     * @param data
     * @returns {boolean}
     */
    onSocketMainUser: function onSocketMainUser(subCMD, data) {
        console.log("onSocketMainUser", subCMD, data);
        switch (subCMD) {
            case gameCMD.SUB_GR_USER_ENTER:
                this.onUserEnter(data);
                return true;
            case gameCMD.SUB_GR_USER_STATUS:
                this.onSubUserStatus(data);
                return true;
            case gameCMD.SUB_GR_USER_SCORE:
                this.onSubUserScore(data);
            default:
                return true;
        }
    },

    /**
     * 游戏命令函数
     * @param subCMD
     * @param data
     */
    onSocketMainGame: function onSocketMainGame(subCMD, data) {

        console.log("onEventGameMessage", subCMD, data);
        onfire.fire("onEventGameMessage", subCMD, data);
    },

    /**
     * 框架命令函数
     * @param subCMD
     * @param data
     * @returns {boolean}
     */
    onSocketMainFrame: function onSocketMainFrame(subCMD, data) {
        switch (subCMD) {
            case gameCMD.SUB_GF_GAME_SCENE:
                console.log('data', data);
                console.error("onEventSceneMessage", this.gameStatus, data);
                onfire.fire("onEventSceneMessage", this.gameStatus, data);
                return true;

            case gameCMD.SUB_GF_GAME_STATUS:
                this.gameStatus = data["gameStatus"];
                return true;

            case gameCMD.SUB_GF_ROOM_INFO:
                if (data.tableSetting) {
                    this.tableSetting = data.tableSetting;
                }
                onfire.fire("onGotRoomInfo", subCMD, data);
                return true;

            case gameCMD.SUB_GF_USER_CHAT:
                onfire.fire("onNewChatMsg", data);
                return true;

            case gameCMD.SUB_GF_USER_DISMISS_REQ:
                //用户发起解散 
                onfire.fire("onUserStartDismiss", subCMD, data);
                return true;
            case gameCMD.SUB_GF_USER_DISMISS_AGREE:
                //用户同意解散 
                this.onUserAgreeDismiss(data);
                onfire.fire("onUserAgreeDismiss", subCMD, data);
                return true;
            case gameCMD.SUB_GF_DO_DISMISS_GAME:
                //房间已解散消息 
                this.resetDismissState(data);
                onfire.fire("onDismissGame", subCMD, data);
                return true;
            case gameCMD.SUB_GF_DISMISS_GAME_FAILED:
                //房间j解散失败 
                this.resetDismissState(data);
                onfire.fire("onDismissGameFailed", subCMD, data);
                return true;
            default:
                console.log("onEventFrameMessage", subCMD, data);
                onfire.fire("onEventFrameMessage", subCMD, data);
                return true;
        }
    },

    /**
     * 发送消息
     * @param mainCMD
     * @param subCMD
     * @param data
     */
    sendSocketData: function sendSocketData(mainCMD, subCMD, data) {

        data.mainCMD = mainCMD;
        data.subCMD = subCMD;

        this.webSocketSend(data);
    },

    /**
     * 用户状态
     * @param data 数据
     * @returns {boolean}
     */
    onSubUserStatus: function onSubUserStatus(data) {
        var userID = data["userID"];
        var tableID = data["tableID"];
        var chairID = data["chairID"];
        var userStatus = data["userStatus"];

        console.log("onSubUserStatus 0", data);
        var userItem = this.gameUserManager.getUserByUserID(userID);
        if (userItem == null) return true;

        if (userStatus <= gameConst.US_FREE) {
            this.gameUserManager.deleteUserItem(userItem);
        } else {
            this.gameUserManager.updateUserItemStatus(userItem, {
                tableID: tableID,
                chairID: chairID,
                userStatus: userStatus
            });
        }

        console.log("UserStatusChanged", data);
        onfire.fire("UserStatusChanged", data);

        return true;
    },
    /**
     * 用户分数变更
     * @param data
     */
    onSubUserScore: function onSubUserScore(data) {
        var userID = data["userID"];
        var score = data["score"];

        var userItem = this.gameUserManager.getUserByUserID(userID);
        if (userItem == null) return true;

        this.gameUserManager.updateUserItemScore(userItem, score);
    },

    /**
     * 用户进入
     * @param data
     * @returns {boolean}
     */
    onUserEnter: function onUserEnter(data) {
        var infoArray = data;
        console.log("onUserEnter", infoArray);
        for (var i = 0; i < infoArray.length; ++i) {
            //创建玩家
            console.log(infoArray[i]);
            this.gameUserManager.createNewUserItem(infoArray[i]);
        }
    },

    /**
     * 切换视图椅子
     * @param chairID
     */
    switchViewChairID: function switchViewChairID(chairID) {

        var chairCount = gameConst.GAME_PLAYER_NUM;
        var viewChairID = Math.floor((chairID + chairCount * 3 / 2 - this.myUserItem.getChairID()) % chairCount);
        return viewChairID;
    },

    /**
     * 获取自己椅子ID
     * @returns {*}
     */
    getMeChairID: function getMeChairID() {
        return this.myUserItem.getChairID();
    },

    /**
     * 获取自己
     * @returns {null}
     */
    getMeUserItem: function getMeUserItem() {
        return this.myUserItem;
    },

    /**
     * 获取座位玩家
     * @param chairID
     * @returns {*}
     */
    getTableUserItem: function getTableUserItem(chairID) {
        return this.gameUserManager.getTableUserItem(chairID);
    },

    /**
     * 通过UserID获取用户
     * @param userID
     * @returns {*}
     */
    getUserByUserID: function getUserByUserID(userID) {

        return this.gameUserManager.getUserByUserID(userID);
    },

    /**
     * 通过游戏ID获取用户
     */
    getUserByGameID: function getUserByGameID(gameID) {

        return this.gameUserManager.getUserByGameID(gameID);
    },

    /**
     * 发送准备
     * @returns {boolean}
     */
    sendUserReady: function sendUserReady() {
        this.webSocketSend({
            mainCMD: gameCMD.MDM_GF_FRAME,
            subCMD: gameCMD.SUB_GF_USER_READY
        });
        return true;
    },

    /**
     *用户信息变化处理
     */

    /**
     * 玩家激活
     * @param userItem
     * @returns {boolean}
     */
    onUserItemActive: function onUserItemActive(userItem) {

        cc.log("onEventUserEnter", userItem.nickname, userItem.userID);
        onfire.fire("onEventUserEnter", userItem);
    },

    /**
     * 玩家删除
     * @param userItem
     * @returns {boolean}
     */
    onUserItemDelete: function onUserItemDelete(userItem) {
        if (userItem == null) {
            return false;
        }

        cc.log("onUserItem Delete");
        cc.log("onEventUserLeave", userItem);
        onfire.fire("onEventUserLeave", userItem);
    },

    /**
     * 分数更新
     * @param userItem
     * @param scoreInfo
     * @returns {boolean}
     */
    onUserItemUpdateScore: function onUserItemUpdateScore(userItem, scoreInfo) {
        if (userItem == null) {
            return false;
        }
        cc.log("onEventUserScore", userItem.nickname, userItem.userID);
        onfire.fire("onEventUserScore", userItem);
    },

    /**
     * 状态更新
     * @param userItem
     * @param statusInfo
     * @returns {boolean}
     */
    onUserItemUpdateStatus: function onUserItemUpdateStatus(userItem, statusInfo) {
        cc.log("onEventUserStatus", userItem.nickname, userItem.userID);
        onfire.fire("onEventUserStatus", userItem);
    },

    /**
     * 自己进入
     * @param userItem
     * @returns {boolean}
     */
    onEventSelfEnter: function onEventSelfEnter(userItem) {

        cc.log("onEventSelfEnter", userItem.nickname, userItem.userID);
        onfire.fire("onEventSelfEnter", userItem);
    },

    /**
     * 获取游戏配置
     * @returns {null}
     */
    getGameConfig: function getGameConfig() {
        return this.gameConfig;
    },

    /**
     * 玩家同意解散
     * @param userItem
     * @returns {boolean}
     */
    onUserAgreeDismiss: function onUserAgreeDismiss(data) {
        var chairID = data["chairID"];

        var userItem = this.gameUserManager.getTableUserItem(chairID);
        if (userItem == null) return true;
        userItem.agreeDismiss = data.agree || 0;
        return true;
    },

    resetDismissState: function resetDismissState(data) {
        var tableSetting = this.getTableSetting();
        for (var i = 0; i < tableSetting.playerCount; i++) {
            var chairID = i;
            var userItem = this.gameUserManager.getTableUserItem(chairID);
            if (userItem) {
                userItem.agreeDismiss = -1;
            }
        }
    }

});
//# sourceMappingURL=ClientKernel.js.map