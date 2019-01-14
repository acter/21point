/**
 * 游戏逻辑
 * BlackJack(即黑杰克,也称为21点)
 * 该游戏由2到6个人玩，使用除大小王之外的52张牌，游戏者的目标是使手中的牌的点数之和不超过21点且尽量大。一般用到1-8副牌。
 *
 * 算牌(card counting)
 * 每张牌都有点数，2到10的牌的点数就是其牌面的数字；J、Q、K的点数算10点；A有两种算法，1或者11，如果A算为11时总和大于21，则A算为1。
 *
 * 特殊牌型
 * 黑杰克(Black Jack): 一张A,一张10点的牌。黑杰克高于一切牌型,如果庄、闲都是黑杰克,则打平。
 * 五小龙(five Dragon): 五张牌加起来总和不超过21点。五小龙高于21点。
 * 牌型大小: 黑杰克>五小龙>普通21点>其他点数
 *
 * 游戏术语
 * 爆牌(BUST): 玩家手中牌的总点数超过21点。
 * 要牌(HIT): 再拿一张牌。玩家(包括玩家和庄家)只要手上牌相加点数不超过21点都可要牌。庄家16点室必须要牌,12点时必须停牌
 * 停牌(STAND): 不再拿牌。在任何情况下，玩家可选择停止要牌。
 * 分牌(SPLIT): 玩家再下一注与原赌注相等的赌金，并将前两张牌分为两副单独的牌。这两张牌的点数必须相同。
 * 但分牌后的黑杰克，只能作普通21点计算，其赔率只是1赔1。
 * 双倍(DOUBLE): 玩家在拿到前两张牌之后，可以再下一注与原赌注相等的赌金，然后只能再拿一张牌。如果拿到黑杰克，则不许双倍下注。
 * 保险(INSURANCE): 如果庄家牌面朝上的牌是A，玩家可以买保险，也就是相当于原赌注一半的额外赌金。
 * 如果玩家确信庄家下一张是10点牌，则可以买保险。如果庄家确实有黑杰克，玩家将赢得2倍的保险赌金；
 * 如果庄家没有黑杰克，玩家将输掉保险赌金，游戏照常继续。
 * 软手(soft hand): 手上的A算11点的牌。
 * 硬手（hard hand）：就是手上没有A或者A只算1点的牌。
 * 花色(suit): 黑桃、红心、梅花、方片
 * dealer庄家,rank点数,shuffle洗牌,cut切牌,deal发牌,sort理牌,draw摸牌,play打出,fold弃牌,check看牌,
 * wager下注,call跟注,raise加注,trick出一轮牌
 *
 * Created by BiteLu on 2016/11/29.
 */

var Util = require("../Util");
var subGameMSG = require("../SubGameMSG").subGameMSG;
var config = require("../Config").controlConfig;
var Player = require("../game/Player");
var playerType = require("../define").playerType;
var playerState = require("../define").playerState;
var gameConst = require("../define").gameConst;
var winston = require('winston');

var SUIT_D = 0;       // 方片(Diamond)
var SUIT_C = 1;       // 梅花(Club)
var SUIT_H = 2;       // 红心(Heard)
var SUIT_S = 3;       // 黑桃(Spade)

var CARD_ACE = 1;           // 卡牌A
var RANK_21 = 21;           // 21点
var RANK_16 = 16;           // 16点
var MAX_CARD_NUM = 416;     // 8副牌,去掉大、小王牌共416张
var WAIT_TIME = 10;         // 等待时间10秒

var DEAL_ID = "981_981";    // 庄家特定id
var DEAL_CHAIR_ID = 5;      // 庄家坐在末位,椅子id为5

var MAX_BETS = [2000, 200000, 5000000, 20000000];      // 最大下注数

var GameLogic = function(tableFrame, roomIndex){
    this.SOURCE_CARDS = [];      // 8副扑克牌
    this.isGameStarted = false;                     // 游戏是否开始了
    this.isTimerStarted = false;                    // 定时器是否启动
    this.roomIndex = roomIndex;                     //
    this.cards = [];                                // 存储8副扑克牌
    this.players = [];                                // 存储当前桌子所有玩家。包括庄家、玩家、机器人
    this.playerCards = [];                          // 玩家的卡牌。包括庄家、玩家、机器人
    this.insurances = {};                           // 玩家保险{chairID1: bet1, chairID2:bet2}
    this.tableFrame = tableFrame;
    this.prePay = 0; //5 * MAX_BETS[roomIndex];          // 库存预付
    this.timerHandler = null;                       // 定时器的句柄
    this.leftTime = 0;                             // 定时器计数
    this.curChairId = -1;                          // 当前出手的玩家的椅子id
    this.cardLeftNum = MAX_CARD_NUM;
    this.isWagering = false;                        // 是否正在下注
    this.isGameOver = false;
    this.isInsuranceEnd = false;                    // 保险是否结束了
    // 初始化游戏
    this.initGame();
};

var p = GameLogic.prototype;

// 初始化游戏
p.initGame = function(){
    // 初始化位置
    this.initPlayers();
    // 刷新扑克牌
    this.refreshCards();
    // 庄家进场,位置的末尾,索引为5
    this.playerIn({
        nickname: "981", userID: DEAL_ID, chairID: DEAL_CHAIR_ID
    }, playerType.TYPE_DEALER);
};

// 初始化位置
p.initPlayers = function(){
    for (var i = 0, num = 6; i < num; i++) {
        this.players[i] = null;
    }
};

// 刷新扑克牌
p.refreshCards = function(){
    // 生成8副扑克牌
    this.produceSourceCards();
    // 拷贝一份卡牌
    var cardsCopy = Util.copyValues(this.SOURCE_CARDS);
    // 洗牌
    this.cards = this.shuffle(cardsCopy);
    this.cardLeftNum = MAX_CARD_NUM;
};

// 玩家进场
p.playerIn = function(userItem, type){
    var names = ["庄家", "闲家", "机器人"];
    var player = new Player(userItem, type);
    if (type == playerType.TYPE_ANDROID) {
        var android = this.tableFrame.gameServer.androidManager.searchAndroidByUserItem(userItem);
        android.androidUserSink.setAndroidPlayer(player);
    }

    winston.info("====%s:%s进入桌子", names[type], userItem.nickname);

    this.players[userItem.chairID] = player;

    // 如果游戏已经开始了,则将玩家设置为等待;否则,判断是否是庄家,如果不是,则可以发送下注指令,开始游戏
    if (this.isGameStarted) {
        player.setState(playerState.STATE_IDLE);
    } else {
        if (type == playerType.TYPE_DEALER) {
            player.setState(playerState.STATE_PLAYING);
        } else {
            // 发送下注指令
            setTimeout(function(){
                !this.isGameStarted && this.wagering(player);
            }.bind(this), 500);
        }
    }
};

// 玩家退出
p.playerOut = function(userItem, type){
    var chairID = userItem.chairID;
    var playerOut = this.players[chairID];

    if (playerOut) {
        var helpFun = function(num){
            var data = {};
            data[chairID] = -num;
            var resultDesc = {};
            resultDesc[chairID] = "退出扣分";
            this.changeStockAndScore(data, 0, resultDesc);
        }.bind(this);

        // 强退扣除下注数
        var betNum = playerOut.betNum;
        if (betNum != 0) {
            helpFun(betNum);
        }

        // 强退扣除保险
        var insuranceNum = playerOut.insuranceNum;
        if (insuranceNum != 0) {
            for (var key in this.insurances) {
                if (key == chairID) {
                    delete this.insurances[key];
                    break;
                }
            }
            helpFun(insuranceNum);
        }

        playerOut.betNum = 0;
        playerOut.insuranceNum = 0;
        this.players[chairID] = null;
    }
};

// 开始下注
p.wagering = function(player){
    if (player.getType() != playerType.TYPE_DEALER && !this.isGameStarted) {
        var userItem = player.getUserItem();

        // 在下注阶段,定时器和玩家卡牌只要执行一次就够了
        if (this.playerCards.length <= 0) {
            this.isWagering = true;
            // 生成玩家的卡牌
            this.producePlayerCards();
            // 开始计时
            this.startTimer(this.deal.bind(this), WAIT_TIME);
        }
        // 发送开始下注命令到客户端
        this.sendMessageWagering(userItem, {leftTime: this.leftTime});
    }
};

// 生成玩家的卡牌
p.producePlayerCards = function(){
    var iteration = function(cardData, canBlackJack){
        var rankResult = Util.countCard(cardData.baseCards, false, canBlackJack);

        // 判断构牌是否结束
        if (rankResult.isBust || rankResult.isBlackJack || rankResult.isFiveDragon) {
            // 记录每副牌的结果,不包括爆牌
            cardData.result = rankResult.isBust ? cardData.result : rankResult;

            return cardData;
        } else {
            var card = this.cards.splice(0, 1)[0];
            cardData.baseCards.push(card);
            cardData.result = rankResult;
            return iteration(cardData);
        }
    }.bind(this);

    // 生成6个玩家的卡牌数据
    for (var i = 0, playNum = 6; i < playNum; i++) {
        // 获得底牌,包括了分牌后的底牌
        var finalBaseCards = this.getBaseCards();
        // 将所有底牌补到五小龙或爆牌
        for (var j = 0, lenJ = finalBaseCards.length; j < lenJ; j++) {
            // 分牌后的底牌出现A和10点牌,不能算是BlackJack,只能算普通21点
            var canBlackJack = j == 0;
            finalBaseCards[j] = iteration(finalBaseCards[j], canBlackJack);
        }
        // id到发牌时才具体确定,谁的牌就填谁的id
        var data = {id: i, cardData: finalBaseCards};
        this.playerCards.push(data);
    }
    // winston.info("=====playerCards", this.playerCards);
};

// 开始发牌
p.deal = function(){
    this.insurances = {};

    if (this.canDeal()) {
        this.isWagering = false;
        this.isGameStarted = true;
        var numToDeal = 0;
        var dealCard = null;
        var numPlaying = 0; // 在玩的人数
        // 库存控制
        this.stockControl();

        // 为已经下注的玩家构造底牌,没下注的玩家idleCount加1
        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            if (player == null) continue;

            var userItem = player.getUserItem();
            if (player.getState() != playerState.STATE_PLAYING) {
                player.idleCountIncrease();
                if (player.idleCount >= 3) {
                    this.kickOut(userItem.chairID, "您3局没下注,已被请出桌子!", gameConst.KICK_TYPE);
                }
                continue;
            }

            var tempCard = null;
            var allCards = player.getAllCards();
            var sourceCards = player.getSourceCards();
            var baseCards = sourceCards.baseCards.splice(0, 1);

            // 如果是庄家,则记录其明牌,并插入一张暗牌;否则就正常插入一张牌,并记录分数
            if (player.getType() == playerType.TYPE_DEALER) {
                dealCard = baseCards[0];
                tempCard = {type: -1, num: 0}; // 暗牌
            } else {
                tempCard = sourceCards.baseCards.splice(0, 1)[0];
            }

            baseCards.push(tempCard);
            allCards.push({
                selfKey: sourceCards.selfKey,
                parentKey: sourceCards.parentKey,
                baseCards: baseCards,
                result: Util.countCard(baseCards, false, true)
            });
            numPlaying++;
            numToDeal += 2; // 没人发两张牌
            // 重置玩家待机的计数
            player.resetIdleCount();
            // 设置玩家当前卡牌
            player.setCurCards(allCards);
        }

        var allPlayerCurCards = this.getAllPlayerCurCards();
        this.cardLeftNum -= numToDeal;
        this.sendMessageDeal({
            cardLeftNum: this.cardLeftNum,
            dealID: DEAL_ID,
            allPlayerCurCards: allPlayerCurCards
        });
        winston.info("====allPlayerCurCards", allPlayerCurCards);

        var delay = dealCard.num >= 10 ? numPlaying + 2 : numPlaying;
        this.startTimer(function(){
            this.hereWeGo(dealCard);
        }.bind(this), delay);
    } else {
        // 开始计时
        this.startTimer(this.deal.bind(this), WAIT_TIME);
        // 重新发下注命令
        for (var j = 0, lenJ = this.players.length; j < lenJ; j++) {
            var player = this.players[j];
            player && this.wagering(player);
        }
    }
};

// 库存控制
p.stockControl = function(){
    // 低水位时,玩家60%概率输
    if (config.nowWater < 0 && Math.random() < 0.6) {
        // 库存不足时调整数据
        this.changeDataWhenFewStock();
    }

    // 按正常库存时产生数据
    this.sourceCardsWhenNormal();
    // 只扣除预支付
    // this.changeStockAndScore({}, this.prePay);
};

// 库存不足时调整数据
p.changeDataWhenFewStock = function(){
    var rank = 0;
    var maxIndex = 0;

    // 找到最大的那副牌的索引
    for (var i = 0, len = this.playerCards.length; i < len; i++) {
        var result = this.playerCards[i].cardData[0].result;
        var tempRank = result.ranks[0];
        if (result.isBlackJack || result.isFiveDragon) {
            maxIndex = i;
            rank = tempRank;
            break;
        } else if (rank < tempRank) {
            maxIndex = i;
            rank = tempRank;
        }
    }

    var playerNum = this.players.length;
    // 抽出最大的那副牌
    var maxData = this.playerCards.splice(maxIndex, 1)[0];
    // 将最大的那副牌出入到庄家的位置
    this.playerCards.splice(playerNum - 1, 0, maxData);
};

// 库存正常时玩家的源卡牌数据
p.sourceCardsWhenNormal = function(){
    for (var i = 0, num = this.players.length; i < num; i++) {
        var player = this.players[i];
        if (player == null) continue;

        var userItem = player.getUserItem();
        var playerCard = this.playerCards[i];

        playerCard.id = userItem.userID;
        player.setSourceCards(playerCard.cardData);
    }
};

// 玩家开始游戏
p.hereWeGo = function(dealCard){
    var dealer = this.players[DEAL_CHAIR_ID];
    var sourceCards = dealer.getSourceCards();
    winston.info("游戏开始,庄家明牌为:", dealCard);

    // 庄家明牌是A,触发是否买保险。再判断庄家是否是黑杰克通吃;都结束后玩家才开始补牌
    if (dealCard.num == CARD_ACE) {
        winston.info("庄家明牌是A,发送是否购买保险提示");
        this.sendMessageInsurance({});
    } else if (sourceCards.result.isBlackJack) {
        winston.info("庄家是黑杰克,通吃!");
        this.turnOfDealer(dealer, true, true);
    } else {
        winston.info("第一个玩家行动");
        var nextPlayer = this.findNextPlayer();
        this.nextPlayerAction(nextPlayer);
    }
};

// 下注处理函数
p.onWagerHandler = function(userItem, data){
    if (this.isGameStarted) return;

    data = data || {};
    var baseBet = data.baseBet || 0;
    var userID = userItem.userID;
    var chairID = userItem.chairID;
    var player = this.players[userItem.chairID];

    // 玩家下注数大于0,且还没停牌
    if (!isNaN(baseBet) && baseBet > 0 && player && !player.isDone) {
        // 身上分数不足
        if ((player.score + player.baseBet) < baseBet) {
            this.tableFrame.sendTableUserItemData(userItem, subGameMSG.NOT_ENOUGH_MONEY, {});
        } else {
            var maxBet = MAX_BETS[this.roomIndex];
            baseBet = baseBet >= maxBet ? maxBet : baseBet; // 不能超过最大下注

            player.score -= (baseBet - player.baseBet);
            player.betNum = baseBet;
            player.baseBet = baseBet;

            // 设置状态为游戏状态
            player.setState(playerState.STATE_PLAYING);
            // 在发牌时才真正扣分,这里只是记录在player里面
            this.sendMessageToAll(subGameMSG.TYPE_WAGER, {
                userID: userID,
                chairID: chairID,
                betNum: baseBet,
                score: player.score
            })
        }

        if(userItem.state != gameConst.US_PLAYING) {
            userItem.setUserStatus(gameConst.US_PLAYING, userItem.tableID, chairID);
        }
    }
};

// 要牌处理函数
p.onHitHandler = function(userItem){
    var player = this.players[userItem.chairID];
    var userID = userItem.userID;

    // 当前出手玩家且还没停牌
    if (player && player.chairID == this.curChairId && !player.isDone) {
        var allCards = player.getAllCards();
        var curCards = player.getCurCards();
        // 根据当前卡牌的selfKey,获得对应的源卡牌
        var sourceCards = player.getSourceCards(curCards.selfKey);

        var card = sourceCards.baseCards.splice(0, 1)[0];
        curCards.baseCards.push(card);

        winston.info("%s要牌后的手牌为:", userItem.nickname, curCards);

        var result = Util.countCard(curCards.baseCards, false, false);
        var canDouble = allCards.length == 1 && curCards.baseCards.length == 2;
        curCards.result = result;

        // 玩家要牌后爆牌或五小龙,要通知下一家出手
        if (result.isFiveDragon || result.isBust || player.isDouble) {
            // 停牌次数加1
            player.doneCountIncrease();
            this.stopTimer();
            this.startTimer(function(){
                this.nextPlayerAction(player);
            }.bind(this), 1);

            winston.info("%s五小龙、爆牌或加倍,下一个玩家行动", userItem.nickname);
        } else {
            // 重新计时
            this.startCountdown(player);
        }

        this.cardLeftNum -= 1;
        this.sendMessageToAll(subGameMSG.TYPE_HIT, {
            selfKey: curCards.selfKey,
            userID: userID,
            card: card,
            canDouble: canDouble,
            canSplit: result.canSplit,
            isDouble: player.isDouble,
            curCards: curCards,
            score: player.score,
            cardLeftNum: this.cardLeftNum,
            baseBet: player.baseBet
        });
    }
};

// 停牌处理函数。当前玩家结束要牌，通知下一个玩家补牌，直到庄家补牌结束，并进行结算
p.onStandHandler = function(userItem){
    var player = this.players[userItem.chairID];

    // 当前出手玩家且还没停牌
    if (player && player.chairID == this.curChairId && !player.isDone) {
        var curCards = player.getCurCards();
        //
        this.stopTimer();
        // 停牌次数加1
        player.doneCountIncrease();

        this.sendMessageToAll(subGameMSG.TYPE_STAND, {
            userID: userItem.userID,
            curCards: curCards,
        });
        Util.delayCall(function(){
            // 下一个玩家行动
            this.nextPlayerAction(player);
        }.bind(this), 1);
    }
};

// 下一个玩家行动
p.nextPlayerAction = function(player){
    var nextPlayer = player;

    if (player == null || player.isDone) nextPlayer = this.findNextPlayer();

    var userItem = nextPlayer.getUserItem();
    var isDealAct = nextPlayer.getType() == playerType.TYPE_DEALER;

    var names = ["庄家", "真人", "机器人"];
    winston.info("当前行动玩家%s:%s,id:%d", names[nextPlayer.type], userItem.nickname, userItem.userID);

    // 轮到庄家行动,则游戏结束
    if (isDealAct) {
        // 轮到玩家出手,游戏结束
        this.turnOfDealer(nextPlayer, false, true);
    } else {
        var allCards = nextPlayer.getAllCards();
        var curCards = nextPlayer.getCurCards();
        var result = Util.countCard(curCards.baseCards, false, true);// 分牌后,就不一定可以黑杰克

        if (result.isBlackJack || result.isFiveDragon || result.isBust) {
            // 停牌次数加1
            player.doneCountIncrease();
            winston.info("%s是黑杰克、五小龙或爆牌,下一家行动", userItem.nickname);
            return this.nextPlayerAction(nextPlayer);
        } else {
            // 只有一副牌且没补过牌才能双倍.
            var canDouble = allCards.length == 1 && curCards.baseCards.length == 2;
            // 开始倒计时
            this.startCountdown(nextPlayer);
            this.sendMessageToAll(subGameMSG.TYPE_NEXT_ACTION, {
                userID: userItem.userID,
                canSplit: result.canSplit,
                canDouble: canDouble,
                selfKey: curCards.selfKey
            });
        }
    }
};

// 开始倒计时
p.startCountdown = function(player){
    // 停止倒计时
    this.stopCountDown();

    this.startTimer(function(){
        if(player) player.isDone = true;
        this.nextPlayerAction(player);
    }.bind(this), WAIT_TIME);
};

// 停止倒计时
p.stopCountDown = function(){
    this.stopTimer();
};

// 庄家出手
p.turnOfDealer = function(dealer, isDealerBJ, firstIn){
    var curCards = dealer.getCurCards();
    var baseCards = curCards.baseCards;
    var result = Util.countCard(baseCards, false, true);
    var isAllBust = this.isAllBust();

    // 庄家黑杰克、五小龙、爆牌、点数大于16或所有玩家都爆牌
    if ((result.isBlackJack || result.isFiveDragon ||
        result.isBust || result.ranks[0] > RANK_16 || isAllBust) && !firstIn) {
        this.gameOver(dealer, result);
    } else {
        var sourceCards = dealer.getSourceCards().baseCards;
        var card = sourceCards.splice(0, 1)[0];
        if (firstIn) {
            baseCards[1] = card;
        } else {
            baseCards.push(card);
        }

        result = Util.countCard(baseCards, false, true);
        curCards.result = result;

        Util.delayCall(function(){
            this.turnOfDealer(dealer, false, false);
        }.bind(this), 2);

        !firstIn && this.cardLeftNum--;
        this.sendMessageToAll(subGameMSG.TYPE_DEAL_TURN, {
            dealID: dealer.getUserItem().userID,
            curCards: curCards,
            card: card,
            isShowCard: firstIn,
            cardLeftNum: this.cardLeftNum
        });
    }
};

// 游戏结束
p.gameOver = function(dealer, resultD){
    var betData = {};
    var scores = {};
    var curCards = dealer.getCurCards();
    var resultDesc = {};

    for (var j = 0, lenJ = this.players.length; j < lenJ; j++) {
        var player = this.players[j];
        if (player && player.getState() == playerState.STATE_PLAYING && !player.isDealer()) {
            var mul = 0;
            var baseBet = player.baseBet;
            var userItem = player.getUserItem();
            var isDouble = player.isDouble;
            var hadDone = false;    // 保险是否已经扣除了
            var chairID = userItem.chairID;
            var allCards = player.getAllCards();
            resultDesc[chairID] = [];
            for (var k = 0, lenK = allCards.length; k < lenK; k++) {
                var curCards = allCards[k];
                var resultP = curCards.result;
                var isInsurance = player.insuranceNum > 0;
                resultDesc[chairID] = resultDesc[chairID] == "undefined" ? "" : resultDesc[chairID];
                // resultDesc[chairID] +=  (resultP.isBust ? ",爆牌":("点数:" + curCards.ranks[k])) + (resultP.isBlackJack ? ",黑杰克" : "") + (resultP.isFiveDragon ? ",五小龙" :"") + ";";
                if (resultP.isBust)
                {
                    resultDesc[chairID] += "自己爆牌;"
                }
                else if (resultP.isBlackJack)
                {
                    resultDesc[chairID] += "自己黑杰克;"
                }
                else if (resultP.isFiveDragon)
                {
                    resultDesc[chairID] += "自己五小龙;"
                }
                else
                {
                    resultDesc[chairID] += "自己点数:" + resultP.ranks[0] + ";";
                }

                if (resultD.isBust)
                {
                    resultDesc[chairID] += "庄家爆牌;"
                }
                else if (resultD.isBlackJack)
                {
                    resultDesc[chairID] += "庄家黑杰克;"
                }
                else if (resultD.isFiveDragon)
                {
                    resultDesc[chairID] += "庄家五小龙;"
                }
                else
                {
                    resultDesc[chairID] += "庄家点数:" + resultP.ranks[0] + ";";
                }


                // 如果玩家没爆牌,则各种比牌;否则,直接扣本金一份
                if (!resultP.isBust) {
                    if (resultD.isBlackJack) {
                        if (isInsurance) {
                            mul += 0;
                            // 买了保险,则退还本金和保险
                            player.score += baseBet * (1 + 0.5);
                        } else {
                            if (resultP.isBlackJack) {
                                mul += 0;
                                // 没有买保险,则退还本金
                                player.score += baseBet * 1;
                            } else {
                                mul -= 1;
                            }
                        }
                    } else if (resultD.isFiveDragon) {
                        // 如果玩家是黑杰克,则赢得1.5倍
                        if (resultP.isBlackJack) {
                            mul += 1.5;
                            // 本金和1.5倍的奖金
                            player.score += baseBet * (1 + 1.5);
                        } else {
                            if (resultP.isFiveDragon) {
                                mul += 0;
                                // 退换本金
                                player.score += baseBet * 1;
                            } else {
                                // 如果玩家有double,则要扣2倍的底注
                                mul -= isDouble ? 2 : 1;
                            }
                        }
                    } else {
                        var playerRank = resultP.ranks[0];
                        var dealRank = resultD.ranks[0];
                        winston.info("====normal====", playerRank, dealRank);
                        // 如果玩家是黑杰克或五小龙,则赢1.5
                        if (resultP.isBlackJack || resultP.isFiveDragon) {
                            mul += 1.5;
                            player.score += baseBet * (1 + 1.5);
                        } else {
                            // 如果庄家爆牌,则玩家赢得本金
                            if (resultD.isBust) {
                                var curMul = isDouble ? 2 : 1;
                                mul += curMul;

                                player.score += baseBet * (curMul + curMul);
                            } else {
                                //
                                if (playerRank > dealRank) {
                                    var curMul = isDouble ? 2 : 1;
                                    mul += curMul;
                                    player.score += baseBet * (curMul + curMul);
                                } else if (playerRank == dealRank) {
                                    mul += 0;
                                    player.score += baseBet * (isDouble ? 2 : 1);
                                } else {
                                    mul -= isDouble ? 2 : 1;
                                }
                            }
                        }

                        if (isInsurance && !hadDone) {
                            hadDone = true;
                            mul -= 0.5;
                        }

                    }
                } else {
                    // 如果玩家double后爆牌了,则扣掉2倍成本
                    mul -= isDouble ? 2 : 1;
                    // 买保险,当庄家不是黑杰克时,保险只扣除一次
                    if (isInsurance && !hadDone) {
                        hadDone = true;
                        mul -= 0.5;
                    }
                }
            }

            if(userItem.state != gameConst.US_SIT) {
                userItem.setUserStatus(gameConst.US_SIT, userItem.tableID, chairID);
            }

            var winScore = baseBet * mul;
            betData[chairID] = winScore;
            scores[chairID] = player.score;
            player.betNum = 0;
            player.insuranceNum = 0;
            winston.info("====mul", chairID, mul, player.score);
        }
    }

    // 修改库存和玩家分数
    this.changeStockAndScore(betData, -this.prePay, resultDesc); // 游戏结束
    // 发送游戏结束命令到客户端
    this.sendMessageGameOver({
        dealID: DEAL_ID,
        betData: betData,
        scores : scores,
        dealCards: curCards,
    });

    this.insurances = {};
    this.playerCards = [];
    this.isGameOver = true;

    // 地摊场没有分数限制,所以要踢掉分数为0的玩家
    if (this.roomIndex == 0) {
        // 踢掉身上分数为0的玩家
        this.kickOutNoScorePlayer();
    } else {
        // 踢掉身上分数不足入场分的玩家
        this.tableFrame.checkTableUsersScore();
    }
    // 5秒后重新开始下注
    this.startTimer(this.restart.bind(this), 3);
    winston.info("=====game over======", this.cards.length);
};

// 重新开始
p.restart = function(){
    this.curChairId = -1;
    this.isGameStarted = false;
    this.isGameOver = false;

    // 卡牌不足100张,重新洗牌
    if (this.cards.length < 100) {
        this.refreshCards();
    }

    for (var i = 0, lenI = this.players.length; i < lenI; i++) {
        var player = this.players[i];
        if (player != null) {
            // 重置玩家状态
            player.reset();
            // 重新开始下注
            this.wagering(player);
        }
    }
};

// 分牌处理函数
p.onSplitHandler = function(userItem){
    var player = this.players[userItem.chairID];

    // 当前出手的玩家且还没停牌
    if (player && player.chairID == this.curChairId && !player.isDone) {
        // 身上钱不够再下一注
        if (player.score < player.baseBet) {
            // 发送金币不足提示
            this.tableFrame.sendTableUserItemData(userItem, subGameMSG.NOT_ENOUGH_MONEY, {
                isOperate: true
            });
        } else {
            var curCards = player.getCurCards();
            var result = curCards.result;
            var cards = curCards.baseCards;

            // 底牌点数一样且还没补过牌的才能的分牌
            if (result.canSplit && cards.length <= 2) {
                // 下注加一份
                this.betNumIncrease(userItem);
                // 分牌
                player.splitCards(curCards);
                //
                this.split(userItem, player);
            }
        }
    }
};

// 双倍处理函数。多加一份底注,只补一张牌,强制结束
p.onDoubleHandler = function(userItem){
    var player = this.players[userItem.chairID];
    var allCards = player.getAllCards();
    var curCards = player.getCurCards();

    var canDouble = allCards.length == 1 && curCards.baseCards.length == 2;

    if (player && player.chairID == this.curChairId && canDouble && !player.isDone) {
        // 身上钱不够再下一注
        if (player.score < player.baseBet) {
            // 发送金币不足提示
            this.tableFrame.sendTableUserItemData(userItem, subGameMSG.NOT_ENOUGH_MONEY, {
                isOperate: true
            });
        } else {
            // 当前出手的玩家且还没停牌
            player.isDouble = true;
            winston.info("%s加倍,下注加倍,补一张牌后强制停牌,下一个玩家出手", userItem.nickname);
            // 下注加一份
            this.betNumIncrease(userItem);
            // 要牌一张
            this.onHitHandler(userItem);
        }
    }
};

// 保险处理函数
p.onInsuranceHandler = function(userItem, data){
    // 游戏还没开始或保险已过了结算,不能买保险
    if (!this.isGameStarted || this.isInsuranceEnd) return false;

    var dealer = this.players[DEAL_CHAIR_ID];
    var dealCards = dealer.getCurCards();

    // 庄家的明牌是A才能买保险
    if (dealCards.baseCards[0].num != 1) return false;

    data = data || {flag: 0};
    var flag = isNaN(data.flag) ? 0 : data.flag;
    var userID = userItem.userID;
    var chairID = userItem.chairID;
    var player = this.players[userItem.chairID];
    // 玩家还没停牌且是游戏状态
    if (player && !player.isDone && player.getState() == playerState.STATE_PLAYING && flag > 0) {
        var insuranceNum = player.baseBet * 0.5;
        // 身上分数不够买保险
        if (insuranceNum > player.score) {
            // 发送金币不足提示
            this.tableFrame.sendTableUserItemData(userItem, subGameMSG.NOT_ENOUGH_MONEY, {});
        } else {
            this.insurances[chairID] = insuranceNum;
            player.score -= insuranceNum;
            player.insuranceNum = insuranceNum;

            // 通知所有玩家
            this.sendMessageToAll(subGameMSG.TYPE_BUY_INSURANCE, {
                userID: userID,
                chairID: chairID,
                betNum: insuranceNum,
                score: player.score
            })
        }
    }
    return true;
};

// 保险结算
p.insuranceEnd = function(){
    var dealer = this.players[DEAL_CHAIR_ID];
    var sourceCards = dealer.getSourceCards();
    this.isInsuranceEnd = true;

    if (sourceCards.result.isBlackJack) {
        winston.info("庄家是黑杰克,通吃!");
        this.turnOfDealer(dealer, true, true);
    } else {
        winston.info("庄家不是黑杰克,吃掉保险。第一个玩家行动");
        this.sendMessageToAll(subGameMSG.TYPE_IS_BLACK_JACK, {
            flag: 0,
            insurances: this.insurances
        });
        Util.delayCall(function(){
            var nextPlayer = this.findNextPlayer();
            this.nextPlayerAction(nextPlayer);
        }.bind(this), 2);
    }
};

// 发送分牌后的结果
p.split = function(userItem, player){
    this.stopTimer();
    this.startTimer(function(){
        this.nextPlayerAction(player);
    }.bind(this), 3);

    var cardData = [];
    var allCards = player.getAllCards();
    for (var i = 0, lenI = allCards.length; i < lenI; i++) {
        var baseCards = allCards[i].baseCards;
        // 分牌后黑杰克只当做普通的21点
        var result = Util.countCard(baseCards, false, false);
        allCards[i].result = result;
        cardData.push({
            baseCards: baseCards,
            result: result,
        });
    }
    
    // 分牌要去掉两张牌
    this.cardLeftNum -= 2;
    this.sendMessageToAll(subGameMSG.TYPE_SPLIT, {
        userID: userItem.userID,
        betNum: player.betNum,
        cardData: cardData,
        allCards: allCards,
        score: player.score,
        cardLeftNum: this.cardLeftNum
    });
};

// 发送开始下注命令到客户端
p.sendMessageWagering = function(userItem, data){
    this.tableFrame.sendTableUserItemData(userItem, subGameMSG.TYPE_WAGERING, data);
};

// 发送发牌命令到客户端
p.sendMessageDeal = function(data){
    this.sendMessageToAll(subGameMSG.TYPE_DEAL, data);
};

// 发送游戏结束命令到客户端
p.sendMessageGameOver = function(data){
    this.sendMessageToAll(subGameMSG.TYPE_GAME_OVER, data);
};

// 发送购买保险命令到客户端
p.sendMessageInsurance = function(data){
    this.isInsuranceEnd = false;

    for (var i = 0, lenI = this.players.length; i < lenI; i++) {
        var player = this.players[i];
        // 给除了庄家外的所有玩家发送购买保险提示信息
        if (player && player.getType() != playerType.TYPE_DEALER) {
            var userItem = player.getUserItem();
            this.tableFrame.sendTableUserItemData(userItem, subGameMSG.TYPE_INSURANCE, {
                betNum: player.betNum
            });
        }
    }

    // 10秒后结算
    this.startTimer(this.insuranceEnd.bind(this), WAIT_TIME);
};

// 踢掉身上分数为0的玩家
p.kickOutNoScorePlayer = function(){
    // 将对应的椅子标记为空
    for (var i = 0, lenI = this.players.length; i < lenI; i++) {
        var player = this.players[i];
        if (player && player.score == 0) {
            var userItem = player.getUserItem();

            this.kickOut(userItem.chairID, "您分数不足房间的最低分,已被请出桌子!", gameConst.KICK_TYPE);
            break;
        }
    }
};

// 根据userID踢掉玩家,并通知所有玩家
p.kickOut = function(chairID, msg, type){
    // 踢人
    this.tableFrame.kickOutUserItem(chairID, msg, type);
    // 将对应的椅子标记为空
    this.players[chairID] = null;
};

// 发送消息
p.sendMessageToAll = function(msgType, data){
    for (var i = 0, len = this.players.length; i < len; i++) {
        var player = this.players[i];
        if (player && player.getType() != playerType.TYPE_DEALER) {
            var userItem = player.getUserItem();
            this.tableFrame.sendTableUserItemData(userItem, msgType, data);
        }
    }
};

// 修改库存和玩家分数。只统计真实玩家的数据
p.changeStockAndScore = function(bets, prePay, resultDesc){
    var buyIn = 0;
    var checkOut = 0;

    for (var chairID in bets) {
        var bet = bets[chairID];
        var player = this.players[chairID];

        var type = player.getType();
        var userItem = player.getUserItem();

        // 只有真实玩家下的注才统计进去
        if (type == playerType.TYPE_PLAYER) {
            if (bet >= 0) {
                checkOut += bet;
            } else {
                buyIn -= bet;
            }
            // 玩家写分
            this.writeUserScore(userItem, bet, resultDesc[chairID]);
        }
    }

    // 修改库存
    this.saveToStock(buyIn, prePay + checkOut);
};

// 库存发生变化
p.saveToStock = function(buyIn, checkOut){
    var delta = buyIn - checkOut;
    var tax = buyIn * config.taxRate;
    var deltaLeft = delta - tax;

    config.nowTax += tax;
    config.nowStock += deltaLeft;
    winston.info("库存变化:%d,抽水:%d,库存剩余:%d", deltaLeft, tax, config.nowStock);

    // 保存库存
    config.saveConfig();
};

// 玩家写分
p.writeUserScore = function(userItem, delta, resultDesc){
    if (delta == 0) return;
    var chairID = userItem.chairID;
    var player = this.players[chairID];
    // 计算税收
    var tax = this.tableFrame.calculateRevenue(chairID, delta);

    winston.info(userItem.nickname + "写分数:玩家剩余%d, 输赢%d, 税收%d",
        player.score, delta - tax, tax);

    // 真正写分到数据库
    this.tableFrame.writeUserScore({
        Chair: chairID,
        Score: delta - tax,
        Tax: tax,
        resultDesc:resultDesc
    });
};

// 是否所有玩家都爆牌了
p.isAllBust = function(){
    for (var i = 0, lenI = this.players.length; i < lenI; i++) {
        var player = this.players[i];

        if (player == null || player.isDealer()) continue;

        var allCards = player.getAllCards();
        for (var j = 0, lenJ = allCards.length; j < lenJ; j++) {
            var curCards = allCards[j];
            if (!curCards.result.isBust) {
                return false;
            }
        }
    }
    return true;
};

// 生成底牌
p.getBaseCards = function(){
    var baseCards = [];
    var finalBaseCards = [];

    // 生成一副底牌
    for (var j = 0, numJ = 2; j < numJ; j++) {
        var card = this.cards.splice(0, 1)[0];
        baseCards.push(card);
    }

    // baseCards = [{type: 0, num: 8}, {type: 1, num: 8}];///////测试

    // 底牌分牌
    this.splitBaseCards(baseCards, finalBaseCards, 0, 0, null);

    return finalBaseCards;
};

// 底牌分牌。如果底牌是一对,则可以执行分牌操作。
p.splitBaseCards = function(baseCards, finalBaseCards, left, right, parentKey){
    // 是否能分牌
    var canSplit = baseCards[0].num == baseCards[1].num;
    var selfKey = "" + left + right;

    finalBaseCards.push({
        selfKey: selfKey,
        parentKey: parentKey,
        baseCards: baseCards
    });

    if (canSplit) {
        for (var i = 0, len = baseCards.length; i < len; i++) {
            var index = Util.randNum(0, this.cards.length, true);
            var newCards = this.cards.splice(index, 1)[0];
            var newBaseCards = [baseCards[i], newCards];

            this.splitBaseCards(newBaseCards, finalBaseCards, left + 1, i, selfKey);
        }
    }
};

// 生成8副扑克牌
p.produceSourceCards = function(){
    if (this.SOURCE_CARDS.length <= 0) {
        this.SOURCE_CARDS = this.cardMaker();
    }
};

// 扑克牌构造器
p.cardMaker = function(){
    var types = [SUIT_D, SUIT_C, SUIT_H, SUIT_S];
    var cards = [];

    // 8副扑克牌
    for (var i = 0, pokerNum = 8; i < pokerNum; i++) {
        // 四种花色:方片、梅花、红心、黑桃
        for (var z = 0, typeNum = types.length; z < typeNum; z++) {
            // 扑克牌A到K
            for (var j = 1, num = 13; j <= num; j++) {
                var cardData = {type: types[z], num: j};
                cards.push(cardData);
            }
        }
    }

    // winston.info("生成8副扑克牌", this.cards);
    return cards;
};

// 洗牌
p.shuffle = function(cards){
    for (var i = 0, lenI = cards.length; i < lenI; i++) {
        var randIndex = Util.randNum(0, i, true);
        var temp = cards[randIndex];

        cards[randIndex] = cards[i];
        cards[i] = temp;
    }

    // winston.info("洗牌", cards);
    return cards;
};

// 开始计时
p.startTimer = function(callback, time){
    // 定时器已经开启就不重新开启了
    if (!this.isTimerStarted) {
        var interval = 100;
        this.leftTime = time * 1000;
        this.isTimerStarted = true;

        this.timerHandler = setInterval(function(){
            this.leftTime -= interval;
            if (this.leftTime <= 0) {
                this.stopTimer();
                callback && callback();
            }
        }.bind(this), interval);
    }
};

// 停止定时器
p.stopTimer = function(){
    this.isTimerStarted = false;
    this.timerHandler && clearInterval(this.timerHandler);
    this.timerHandler = null;
};

// 能否开始发牌。庄家和至少一个闲家
p.canDeal = function(){
    var count = 0;
    for (var i = 0, len = this.players.length; i < len; i++) {
        var player = this.players[i];

        if (player && player.getState() == playerState.STATE_PLAYING) {
            count++;
        }
    }

    return count >= 2;
};

// 下注加一份
p.betNumIncrease = function(userItem){
    var chairID = userItem.chairID;
    var player = this.players[chairID];
    var baseBet = player.baseBet;

    player.score -= baseBet;
    player.betNum += baseBet;
};

// 获得所有玩家当前卡牌
p.getAllPlayerCurCards = function(){
    var playerCurCards = [];
    for (var i = 0, len = this.players.length; i < len; i++) {
        var player = this.players[i];
        if (player == null) continue;

        var userItem = player.getUserItem();
        if (player.getState() == playerState.STATE_PLAYING) {
            var data = {id: userItem.userID, cards: player.getAllCards()};
            playerCurCards.push(data);
        }
    }

    return playerCurCards;
};

// 查找空位置
p.findEmptyPos = function(player){
    if (player.getType() == playerType.TYPE_DEALER) {
        return this.players.length - 1;
    } else {
        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            if (this.players[i] == null){
                return i;
            }
        }
    }

    return -1;
};

// 查找下一个出手的玩家
p.findNextPlayer = function(){
    for (var i = 0, len = this.players.length; i < len; i++) {
        var player = this.players[i];
        if (player == null) continue;

        var playerChairId = player.getUserItem().chairID;

        if (playerChairId >= this.curChairId && !player.isDone &&
            player.getState() == playerState.STATE_PLAYING) {
            this.curChairId = playerChairId;
            return player;
        }
    }

    return null;
};

// 获取当前桌子上所有玩家数据
p.getPlayersData = function(){
    var arr = [];

    for (var i = 0, len = this.players.length; i < len; i++) {
        var player = this.players[i];
        if (player == null) continue;

        var data = player.getUserBaseData();
        arr.push(data);
    }

    return arr;
};



module.exports = GameLogic;