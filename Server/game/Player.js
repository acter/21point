/**
 * 玩家类
 * Created by BiteLu on 2016/11/28.
 */
var playerType = require("../define").playerType;
var playerState = require("../define").playerState;
var Util = require("../Util");

var Player = function(userItem, type){
    this.userItem = userItem;
    this.type = type;                               // 玩家类型:庄家、闲家、机器人
    this.score = userItem.score;                    // 当前玩家身上分数
    this.chairID = userItem.chairID;

    this.sourceCards = [];                          // 玩家的源卡牌
    this.allCards = [];                             // 玩家当前卡牌。没分牌就一副,每分牌一次增加一副
    this.state = playerState.STATE_INVALID;         // 玩家状态
    this.isDouble = false;                          // 是否加倍
    this.isDone = false;                            // 是否已经结束
    this.doneCount = 0;                             // 停牌次数。每停牌一次,计数加一
    this.baseBet = 0;                               // 玩家基础下注数。游戏开始时下的注
    this.betNum = 0;                                // 玩家真实下注数。游戏中可能加倍,或分牌要额外加注
    this.insuranceNum = 0;                          // 玩家购买的保险
    this.idleCount = 0;                             // 连续两局没开始,则踢出桌子
};

var p = Player.prototype;

// 分牌。将要分牌的底牌删除,同时插入分牌后的两副牌
p.splitCards = function(cards){
    var targetIndex = -1;
    // 找到要分牌的底牌,并删除,记录其位置
    for (var i = 0, len = this.allCards.length; i < len; i++) {
        var tempCards = this.allCards[i];
        if (cards.selfKey == tempCards.selfKey) {
            targetIndex = i;
            this.allCards.splice(i, 1);
            break;
        }
    }


    // 插入两副新底牌
    for (var j = 0, lenJ = this.sourceCards.length; j < lenJ; j++) {
        var tempCards = this.sourceCards[j];

        if (cards.selfKey == tempCards.selfKey) {
            console.log("====要分牌的牌", this.sourceCards[0]);
        }

        if (cards.selfKey == tempCards.parentKey) {
            console.log("====分牌后的牌", tempCards);
            var baseCards = tempCards.baseCards.splice(0, 2);

            this.allCards.splice(targetIndex, 0, {
                selfKey: tempCards.selfKey,
                parentKey: tempCards.parentKey,
                baseCards: baseCards,
                result: Util.countCard(baseCards, false, false)
            });
        }
    }
};

// 重新设置
p.reset = function(){
    var isDeal = this.isDealer();
    this.isDone = false;
    this.isDouble = false;
    this.state = isDeal ? playerState.STATE_PLAYING : playerState.STATE_IDLE;       // 玩家状态

    this.doneCount = 0;
    this.baseBet = 0;                               // 玩家基础下注数。游戏开始时下的注
    this.betNum = 0;                                // 玩家真实下注数。游戏中可能加倍,或分牌要额外加注
    this.insuranceNum = 0;                          // 玩家购买的保险

    this.sourceCards = [];                          // 玩家的源卡牌
    this.allCards = [];                             // 玩家当前卡牌。每分牌就一副,每分牌一次增加一副
};

// 设置源卡牌
p.setSourceCards = function(cards){
    this.sourceCards = cards;
};

// 获得源卡牌
p.getSourceCards = function(selfKey){
    // 有指定key的就返回特定key对应的源卡牌;否则,就返回第一个
    if (selfKey) {
        for (var i = 0, lenI = this.sourceCards.length; i < lenI; i++) {
            var sourceCard = this.sourceCards[i];
            if (sourceCard.selfKey == selfKey) {
                return this.sourceCards[i];
            }
        }
    } else {
        return this.sourceCards[0];
    }
};

// 设置当前卡牌
p.setCurCards = function(cards){
    this.allCards = cards;
};

// 获得当前卡牌
p.getCurCards = function(){
    return this.allCards[this.doneCount];
};

// 获得全部手牌
p.getAllCards = function(){
    return this.allCards;
};

// 设置玩家当前状态
p.setState = function(state){
    this.state = state;
};

// 获取玩家当前状态
p.getState = function(){
    return this.state;
};

// 获取玩家类型
p.getType = function(){
    return this.type;
};

// doneCount递加
p.doneCountIncrease = function(){
    this.doneCount++;
    // 停牌次数大于等于手牌数,即要牌结束
    if (this.doneCount >= this.allCards.length) {
        this.isDone = true;
    }
};

// idleCount递加
p.idleCountIncrease = function(){
    this.idleCount++;
};

// idleCount重置为0
p.resetIdleCount = function(){
    this.idleCount = 0;
};

// 获取用户数据
p.getUserItem = function(){
    return this.userItem;
};

p.isDealer = function(){
    return this.type == playerType.TYPE_DEALER;
};

//
p.getUserBaseData = function(){
    var userItem = this.userItem;
    return {
        userID: userItem.userID,
        isDealer: this.type == playerType.TYPE_DEALER,
        nickname: userItem.nickname,
        tableID: userItem.tableID,
        chairID: userItem.chairID,
        faceID: userItem.faceID,
        memberOrder: userItem.memberOrder,
        score: this.score,
        sex: userItem.sex,
        betNum: this.betNum,
        type: this.type,
        cards: this.allCards,
    };
};

module.exports = Player;