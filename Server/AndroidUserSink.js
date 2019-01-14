/**
 * Created by Administrator on 2015/7/26.
 * 机器人逻辑钩子
 */

var gameConst = require("./define").gameConst;
var subGameMSG = require("./SubGameMSG").subGameMSG;
var gameCMD = require("./define").gameCMD;
var gameConfig = require("./gameconfig");
var Util = require("./Util");
var logger = require('log4js').getLogger();

var allBets = {
    '0': [100, 200, 500, 1000, 2000],
    '1': [500, 2000, 5000, 10000, 200000],
    '2': [1000, 10000, 100000, 1000000, 5000000],
    '3': [10000, 100000, 1000000, 10000000, 20000000],
};
var DEAL_ID = "981_981";    // 庄家特定id
var TIMER_WAGER = 0;
var TIMER_NEXT_PLAYER = 1;
var TIMER_HIT = 2;
var TIMER_INSURANCE = 3;
var TIMER_WAGER_AGAIN = 4;
/**
 * 机器人逻辑对象
 * @param androidItem
 * @constructor
 */
function AndroidUserSink(androidItem) {
    this.timeMng = [];                              //计时器管理器
    this.androidUserItem = androidItem;
    this.cardData = {};                             // 机器人的卡牌
    this.dealOpenCard = {};                         // 庄家明着的卡牌
    this.androidPlayer = null;                      // 机器人自身
    this.isSmart = Math.random() > 0.6;             // 是否是聪明的机器人
    this.betNum = 0;                                // 下注数

    this.initBetNum();
}
var p = AndroidUserSink.prototype;

/**
 * 游戏框架消息
 * @param subCMD
 * @param data
 * @returns {boolean}
 */
p.onEventFrameMessage = function (subCMD, data) {
    return true;
};
/**
 * 场景消息
 * @param gameStatus 游戏状态
 * @param data
 * @returns {boolean}
 */
p.onEventSceneMessage = function (gameStatus, data) {
    switch (gameStatus) {
        default :
            return true;
    }
    return true;
};
/**
 * 游戏消息
 * @param subCMD
 * @param data
 * @returns {boolean}
 */
p.onEventGameMessage = function (subCMD, data) {
    switch (subCMD) {
        case subGameMSG.TYPE_WAGERING:
            this.onWageringHandler(data);
            break;

        case subGameMSG.TYPE_DEAL:
            this.onDealHandler(data);
            break;

        case subGameMSG.TYPE_NEXT_ACTION:
            this.onNextActionHandler(data);
            break;

        case subGameMSG.TYPE_HIT:
            this.onHitHandler(data);
            break;

        case subGameMSG.TYPE_SPLIT:
            this.onSplitHandler(data);
            break;

        case subGameMSG.TYPE_INSURANCE:
            this.onInsuranceHandler();
            break;

        default :
            return false;
    }
    return true;
};

// 初始化筹码
p.initBetNum = function(){
    var roomIndex = gameConfig.roomIndex;
    var curBets = allBets[roomIndex];

    this.betNum = curBets[Util.randNum(0, curBets.length, true)];
};

// 机器人下注处理函数
p.onWageringHandler = function(){
    this.betNum = 0;
    // 机器人下注
    this.setGameTimer(this.androidWager.bind(this), TIMER_WAGER, Util.randNum(1, 4, true));
};

// 发牌处理函数
p.onDealHandler = function(data){
    var allCards = data.allPlayerCurCards;
    for (var i = 0, len = allCards.length; i < len; i++) {
        var cardData = allCards[i];
        if (cardData.id == this.androidUserItem.serverUserItem.userID) {
            this.cardData = cardData.cards;
        } else if (cardData.id == DEAL_ID) {
            this.dealOpenCard = cardData.cards[0].baseCards[0];
        }
    }
};

// 轮到下一个玩家出手
p.onNextActionHandler = function(data){
    var userItem = this.androidUserItem.serverUserItem;

    if (data.userID == userItem.userID) {
        var thinkTime = Util.randNum(1, 8, true);
        var doneCount = this.androidPlayer.doneCount;
        var curCards = this.cardData[doneCount];
        logger.info("%s机器人行动,手牌为", userItem.nickname, curCards);
        this.setGameTimer(this.androidThink.bind(this), TIMER_NEXT_PLAYER, thinkTime);
    }
};

// 要牌的处理函数
p.onHitHandler = function(data){
    var result = data.curCards.result;
    var userItem = this.androidUserItem.serverUserItem;
    // 是当前玩家,且该玩家还没结束(五小龙、爆牌或加倍)才需要思考下一步
    if (data.userID == userItem.userID && !result.isFiveDragon &&
        !result.isBust && !this.androidPlayer.isDouble) {
        var thinkTime = Util.randNum(1, 4, true);
        this.setGameTimer(this.androidThink.bind(this), TIMER_HIT, thinkTime);
    }
};

// 分牌的处理函数
p.onSplitHandler = function(data){

};

// 保险的处理函数
p.onInsuranceHandler = function(){
    var thinkTime = Util.randNum(1, 8, true);
    this.setGameTimer(function(){
        // 机器人买保险的概率
        var flag = Math.random() > 0.5 ? 1 : 0;
        this.androidUserItem.sendSocketData(subGameMSG.TYPE_INSURANCE, {flag: flag});
    }.bind(this), TIMER_INSURANCE, thinkTime);
};

// 机器人下注
p.androidWager = function(){
    var androidScore = this.androidPlayer.score;

    var roomIndex = gameConfig.roomIndex;
    var curBets = allBets[roomIndex];
    var tempBets = [];
    for (var i = 0, lenI = curBets.length; i < lenI; i++) {
        var bet = curBets[i];

        if (this.betNum + bet < androidScore) {
            tempBets.push(bet);
        }
    }

    if (tempBets.length > 0) {
        this.betNum += tempBets[Util.randNum(0, tempBets.length, true)];
        this.androidUserItem.sendSocketData(subGameMSG.TYPE_WAGER, {baseBet: this.betNum});

        this.setGameTimer(function(){
            if (Math.random() > 0.4) {
                this.androidWager();
            }
        }.bind(this), TIMER_WAGER_AGAIN, Math.random() * 1.5);
    }
};

// 机器人思考下一步怎么行动
p.androidThink = function(){
    if (this.isSmart) {
        this.smartThink();
    } else {
        this.simpleThink();
    }
};

// 聪明思考
p.smartThink = function(){
    var userItem = this.androidUserItem.serverUserItem;

    var curCards = this.androidPlayer.getCurCards();
    var baseCards = curCards.baseCards;
    // 分牌后的黑杰克只算普通的21点。只有一手手牌,且手牌张数为2
    var canBlackJack = this.cardData.length == 1 && baseCards.length == 2;
    var result = Util.countCard(baseCards, false, canBlackJack);
    var ranks = result.ranks;       // 点数集合(软硬牌A)
    // var rankP = result.sum;         // 玩家的总点数
    var rankP = ranks[0];         // 玩家的总点数。软牌A的点数会排在前面,所以直接取第一个
    var rankD = this.dealOpenCard.num;  // 庄家明牌的点数
    var actType = "";

    if (!result.isBlackJack && !result.isFiveDragon && !result.isBust) {
        if (baseCards.length == 2 && rankP < 18 && baseCards[0].num == baseCards[1].num) {
            actType = subGameMSG.TYPE_SPLIT;
            logger.info("%s机器人%d点,分牌,庄家明牌为:", userItem.nickname, rankP, this.dealOpenCard);
        } else if (rankP >= 17 || (rankP >= 13 && rankP <= 16 && rankD >= 2 && rankD <= 6) ||
            (rankP == 12 && rankD >= 4 && rankD <= 6)) {
            // 停牌
            actType = subGameMSG.TYPE_STAND;
            logger.info("%s机器人%d点,停牌,庄家明牌为:", userItem.nickname, rankP, this.dealOpenCard);
        } else if (baseCards.length == 2 &&
            (rankP == 11 && rankD != 1) || (rankP == 10 && rankD >= 2 && rankD < 10) ||
            (rankP == 9 && rankD >= 3 && rankD <= 6)) {
            // 加倍
            actType = subGameMSG.TYPE_DOUBLE;
            logger.info("%s机器人%d点,加倍,庄家明牌为:", userItem.nickname, rankP, this.dealOpenCard);
        } else {
            // 要牌
            actType = subGameMSG.TYPE_HIT;
            logger.info("%s机器人%d点,要牌,庄家明牌为:", userItem.nickname, rankP, this.dealOpenCard);
        }

        this.androidUserItem.sendSocketData(actType, {});
    }
};

// 简单思考
p.simpleThink = function(){
    var userItem = this.androidUserItem.serverUserItem;

    var curCards = this.androidPlayer.getCurCards();
    var baseCards = curCards.baseCards;
    // 分牌后的黑杰克只算普通的21点。只有一手手牌,且手牌张数为2
    var canBlackJack = this.cardData.length == 1 && baseCards.length == 2;
    var result = Util.countCard(baseCards, false, canBlackJack);
    var ranks = result.ranks;       // 点数集合(软硬牌A)
    // var rankP = result.sum;         // 玩家的总点数
    var rankP = ranks[0];         // 玩家的总点数。软牌A的点数会排在前面,所以直接取第一个
    var rankD = this.dealOpenCard.num;  // 庄家明牌的点数
    var actType = "";

    if (!result.isBlackJack && !result.isFiveDragon && !result.isBust) {
        // 小于16点就一直补牌
        if (rankP <= 16) {
            actType = subGameMSG.TYPE_HIT;
            logger.info("%s机器人%d点,要牌,庄家明牌为:", userItem.nickname, rankP, this.dealOpenCard);
        } else {
            // 停牌
            actType = subGameMSG.TYPE_STAND;
            logger.info("%s机器人%d点,停牌,庄家明牌为:", userItem.nickname, rankP, this.dealOpenCard);
        }
        this.androidUserItem.sendSocketData(actType, {});
    }
};

p.setAndroidPlayer = function(player){
    this.androidPlayer = player;
};

/**
 * 定时器功能
 * @param func  定时器回调函数
 * @param timerID 定时器标识
 * @param time 定时器时间  1s
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

    this.timeMng.push({key: timerID, value: timer});
};

/**
 * 删除定时器
 * @param timerNum 定时器标识
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

/**
 *清除所有定时器
 */
p.clearAllTimer = function () {
    for (var i = 0; i < this.timeMng.length; ++i) {
        clearTimeout(this.timeMng[i].value);
    }
    this.timeMng.length = 0;
};

/**
 * 用户进入 上层未实现接口 保留
 */

p.onEventUserEnter = function (userItem) {
    return true;
};
/**
 * 用户离开 上层未实现接口 保留
 */
p.onEventUserLeave = function (userItem) {
    return true;
};
/**
 * 用户分数变更 上层未实现接口 保留
 */
p.onEventUserScore = function (userItem) {
    return true;
};
/**
 * 用户状态变更 上层未实现接口 保留
 */
p.onEventUserStatus = function (userItem) {
    return true;
};
/**
 * 用户自己进入 上层未实现接口 保留
 */
p.onEventSelfEnter = function (userItem) {
    return true;
};


module.exports = AndroidUserSink;