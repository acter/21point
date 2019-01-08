//桌子逻辑操作类


var gameConst = require("./define").gameConst;
var subGameMSG = require("./SubGameMSG").subGameMSG;
var gameCMD = require("./define").gameCMD;
var winston = require("winston");
var Util = require("./Util");
var GameLogic = require("./game/GameLogic");
var Player = require("./game/Player");
var gameConfig = require("./gameconfig");
var playerType = require("./define").playerType;

var log = console.log;
var err = console.error;

var DEAL_ID = "981_981";    // 庄家特定id

/**
 * 桌子逻辑处理类
 * @param tableFrame
 * @param roomInfo
 * @constructor
 */
function TableFrameSink(tableFrame, roomInfo) {
    this.roomInfo = roomInfo;						//房间信息
    this.chairCount = roomInfo["ChairCount"];		//椅子数
    this.tableFrame = tableFrame;					//桌子框架类
    this.timeMng = [];								//计时器管理器

    this.coolTime = 500;                           // 冷却时间
    this.isCooling = false;                         // 是否冷却中
    this.roomIndex = gameConfig.roomIndex;          // 房间索引
    this.gameLogic = new GameLogic(tableFrame, this.roomIndex);
}

var p = TableFrameSink.prototype;

/**
 * 记录定时器启动的那一时刻  场景还原你可能需要用到
 */
p.recordTimeTick = function () {
    var date = new Date();
    this.tableTime = parseInt(date.getTime() / 1000);
};

/**
 * 获取剩余时间
 * @param totalTime 定时器的时间
 * @returns {number}
 */
p.getLeftTimeTick = function (totalTime) {
    var date = new Date();
    var passTime = parseInt(date.getTime() / 1000) - this.tableTime;
    return totalTime - passTime;
};

/**
 * 复位桌子
 */
p.repositionSink = function () {

};

/**
 * 游戏开始，上层回调此函数
 */
p.onEventStartGame = function () {

};

/**
 * 游戏结束 处理完显示调用 this.tableFrame.concludeGame函数
 */
p.onEventConcludeGame = function (chair, userItem, concludeReason) {

};
/**
 * 游戏解散
 */
p.onDismiss = function () {
};

/**
 * 场景消息
 * @param chairID 椅子号
 * @param userItem 用户
 * @param gameStatus 游戏状态
 * @returns {boolean}
 */
p.onEventSendGameScene = function (chairID, userItem, gameStatus) {
    //switch (gameStatus) {
    //    default :
    //        return true;
    //}
    console.log("发送场景消息");
    var gameLogic = this.gameLogic;
    var data = gameLogic.getPlayersData();
    this.tableFrame.sendGameScene(userItem, {
        playerData: data,
        dealID: DEAL_ID,
        isGameOver: gameLogic.isGameOver,
        cardLeftNum: gameLogic.cardLeftNum,
        timeLeft: gameLogic.leftTime,
        isWagering: gameLogic.isWagering,
        roomIndex: gameConfig.roomIndex
    });
};

/**
 * 游戏消息事件
 * @param subCMD 子游戏消息
 * @param data 数据
 * @param userItem 用户
 * @returns {boolean}
 */
p.onGameMessageEvent = function (subCMD, data, userItem) {
    try {
        winston.info("====", userItem.nickname, subCMD, data);
        if(this.isCooling) return true;
        switch (subCMD) {
            case subGameMSG.TYPE_WAGER:
                // 下注
                this.gameLogic.onWagerHandler(userItem, data);
                break;

            case subGameMSG.TYPE_HIT:
                // 要牌
                this.gameLogic.onHitHandler(userItem);
                break;

            case subGameMSG.TYPE_STAND:
                // 停牌
                this.gameLogic.onStandHandler(userItem);
                break;

            case subGameMSG.TYPE_SPLIT:
                // 分牌
                this.gameLogic.onSplitHandler(userItem);
                break;

            case subGameMSG.TYPE_DOUBLE:
                // 双倍
                this.gameLogic.onDoubleHandler(userItem);
                break;

            case subGameMSG.TYPE_INSURANCE:
                // 保险
                return this.gameLogic.onInsuranceHandler(userItem, data);
                break;

            default :
                return false;
        }
    } catch (err) {
        winston.info("%s游戏时触发bug:%s", userItem.nickname, err);
    }
    return true;
};

// 开始冷却
p.startCooling = function(){
    this.isCooling = true;
    setTimeout(function(){
        this.isCooling = false;
    }.bind(this), this.coolTime);
};

/**
 * 玩家起立
 * @param chair
 * @param userItem
 */
p.onActionUserStandUp = function (chair, userItem) {
    var type = userItem.isAndroid ? playerType.TYPE_ANDROID : playerType.TYPE_PLAYER;
    // 玩家退出
    this.gameLogic.playerOut(userItem, type);
};

/**
 * 玩家坐下
 * @param chair
 * @param userItem
 */
p.onActionUserSitDown = function (chair, userItem) {
    var type = userItem.isAndroid ? playerType.TYPE_ANDROID : playerType.TYPE_PLAYER;
    // 玩家进场
    this.gameLogic.playerIn(userItem, type);
};

/**
 * 游戏定时器
 * @param func 回调函数
 * @param timerID 计时器ID
 * @param time 时间
 */
p.setGameTimer = function (func, timerID, time) {
    var that = this;
    var args = null;
    if (arguments.length > 3)
        args = Array.prototype.slice.call(arguments, 3);	//貌似性能不好？

    this.killGameTimer(timerID);
    var timer = setTimeout(function () {

        for (var i = 0; i < that.timeMng.length; ++i) {
            if (that.timeMng[i].value == timer) {
                that.timeMng.splice(i, 1);
                break;
            }
        }
        func.apply(that, args);
    }, time * 1000);

    that.timeMng.push({key: timerID, value: timer});
};

/**
 * 删除定时器
 * @param timerID
 */
p.killGameTimer = function (timerID) {
    for (var i = 0; i < this.timeMng.length; ++i) {
        if (this.timeMng[i].key == timerID) {
            clearTimeout(this.timeMng[i].value);
            this.timeMng.splice(i, 1);
            break;
        }
    }
};
module.exports = TableFrameSink; 