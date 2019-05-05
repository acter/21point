var NetHelp = require("NetHelp")
var subGameMSG = require("SubGameMSG").subGameMSG
var ClientKernel = require("ClientKernel")
var GD = require("GD")
var Player = require('player')
var define = require('define');
var gameCMD = define.gameCMD;

var gameEvent = define.gameEvent;
var gameConst = define.gameConst;


cc.Class({
    properties:{
        userPreb:{
            default:null,
            type:cc.Prefab
        },
        goldPreb:{
            default:null,
            type:cc.Prefab
        },
        Allsprite:{
            default:null,
            type:cc.SpriteAtlas
        }
    },
    extends: cc.Component,
    onLoad:function(){
        this.players = [];
        this.roomIndex = 0;
        this.buttonLayer = null;
        this.isGameStarted = false;
        this.startSpr = null;
        // 加载开始提示
        this.loadStartTip()
        this.gameResultLayer = null;
        this.curBet = 0;
        this.bindEvent();
        this.initMembers()
        this.lastBetNum = 0;//上次下注数
        this.initNodes()
    },
    //初始化节点
    initNodes(){
        // 常量
        this.playerPos = this.node.getChildByName('21dian-player');
        //按钮节点
        this.button_list = this.node.getChildByName('button')
    },
    // 初始化成员变量
    initMembers: function(){
        // 初始化出6个空位置。五个玩家、一个庄家
        for (var i = 0, num = 6; i < num; i++) {
            this.players[i] = null;
        }
    },
    bindEvent() {
        this.bindObj = []
        this.bindObj.push(onfire.on("onEventGameMessage", this.onEventGameMessage.bind(this)))
        this.bindObj.push(onfire.on("onEventSceneMessage", this.onEventSceneMessage.bind(this)))

    },
    //加载开始提示
    loadStartTip(){
        this.startSpr = this.node.getChildByName('21dian-start');
    },
    startSprIn: function(){
        // 开始提示精灵进场
        if (this.startSpr == null) return;
        var sizeA  = cc.winSize;
        var sizeB = this.startSpr.getContentSize()
        var x = (sizeA.width+sizeB.width)*0.5;
        this.startSpr.runAction(cc.sequence(
            cc.moveTo(0.5, cc.p(0, 0)).easing(cc.easeBackOut(0.5)),
            cc.delayTime(0.5),
            cc.moveTo(0.5,cc.p(x, 0)).easing(cc.easeBackIn(0.5)),
            cc.callFunc(function(){
                this.startSpr.setPosition(-x,0);
            }.bind(this))
        ));
    },
    /*
  * 逻辑处理
  * */
    // 场景还原
    onEventSceneMessage(gameStatus,data){
        // data: {playerData: ,dealID: ,isGameOver: ,cardLeftNum: ,
        // timeLeft: ,isWagering: ,roomIndex:}
        var myUserItem = GD.clientKernel.myUserItem;
        var isGameOver = data.isGameOver;
        var playerData = data.playerData;
        this.roomIndex = data.roomIndex;
        // 加载房间信息层
        this.loadRoomInfoLayer();
        //加载下注层
        this.loadUILayer()
        for (var i = 0, len = playerData.length; i < len; i++) {
            var curData = playerData[i];
            var chairID = curData.chairID;
            var playerSpr = this.playerSit(chairID,curData);

            // 提示玩家所在位置
            if (curData.userID == myUserItem.userID) {
                playerSpr.showTip();
            }
            if (!isGameOver) {
                // 间隔发牌
                this.delayDeal(playerSpr, curData, i, data.dealID);
                if (data.isWagering) {
                    playerSpr.showProgressTimer(data.timeLeft);
                }
            }
            // // this.players.push(playerSpr);
            this.players[chairID] = playerSpr;
        }
        // 更新卡牌数量
        this.roomInfoLayer && this.roomInfoLayer.updateCardNum(data.cardLeftNum);
    },
    //延迟发牌
    delayDeal: function(playerSpr, curData, i, dealID){
        if (curData.cards) {
            setTimeout(function(){
                playerSpr.loadCardBoxes(curData.cards, dealID);
            }, 600 * i);
        }
    },
    //加载玩家座位
    playerSit(chairID,data){
        var playChair = this.playerPos.getChildByName('pos'+chairID)
        if(data.isDealer){
            var playChair = this.playerPos.getChildByName('pos5')
        }
        var newPlayer = cc.instantiate(this.userPreb);
        // let templayer= newPlayer.addComponent(Player);
        playChair.addChild(newPlayer);
        var playerSpr = newPlayer.getComponent('player')

        playChair.active = true;
        playerSpr.loadInfo(data,this.Allsprite)

        //
        return playerSpr;
    },
    // 加载房间信息层
    loadRoomInfoLayer(data){
        if (this.roomInfoLayer == null) {
            this.roomInfoLayer =this.node.getChildByName('21dian-box').getComponent('roominfo');
            this.roomInfoLayer.loadInfo({
                roomIndex: this.roomIndex,
                left: 416,
            })
        }

    },
    // 显示下注层信息
    loadUILayer: function(){

        this.buttonLayer= this.button_list.getComponent('betbutton')
        this.buttonLayer.loadInfo(this)
    },


    /**
     * 游戏消息事件
     * @param subCMD 子游戏命令
     * @param data 数据
     * @returns {boolean}
     */
    //正在下注的处理函数
    onWageringHandler(data){
        if (data.leftTime >= 5000) {
            // 开始提示精灵进场
            this.startSprIn();
        }
        // 重新设置玩家
        // this.resetPlayer();
        // 显示下注层
        if (this.buttonLayer == null) {
            this.loadUILayer();
        }
        this.buttonLayer.showBetLayer(data, this.getMyPlayerScore());
    },
    // 下注的处理函数
    onWagerHandler: function(data){

        var myUserItem = GD.clientKernel.myUserItem;
        var wagerP = this.findPlayerByID(data.userID);

        if (wagerP) {
            // 设置底注
            wagerP.setBaseBet(data.betNum);
            // 下注的处理函数

            wagerP.onWagerHandler(data);

        }

        if (data.userID == myUserItem.userID) {
            this.isGameStarted = true;
        }
    },
    // 发牌的处理函数
    onDealHandler: function(data){
        var count = 0;
        var allPlayerCurCards = data.allPlayerCurCards;
        this.hideProgressTimer();
        for (var j = 0, lenJ = this.players.length; j < lenJ; j++) {
            var playerSpr = this.players[j];
            if (playerSpr == null) continue;

            count++;
            for (var i = 0, lenI = allPlayerCurCards.length; i < lenI; i++) {
                var cardData = allPlayerCurCards[i];
                if (cardData.id == playerSpr.getUserID()) {
                    // 间隔发牌
                    this.delayDeal(playerSpr, cardData, count, data.dealID);
                    playerSpr.setIsPlaying(true);
                    break;
                }
            }
        }
        //
        this.roomInfoLayer.updateCardNum(data.cardLeftNum);
        // 隐藏下注层
        this.buttonLayer.setBetLayerVisible(false);
    },
    // 下一个玩家行动
    onNextActionHandler:function(data){
        // data: {userID:, doneCount:, canSplit:, canDouble:}
        var myUserItem = GD.clientKernel.myUserItem;
        if (data.userID == myUserItem.userID) {
            this.buttonLayer.showOperateLayer();
            this.buttonLayer.setSplitAndDouble(data.canSplit, data.canDouble);
        }

        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            player && player.setHitTipVisible(data.selfKey, player.getUserID() == data.userID);
        }
    },
    // 提示保险的处理函数
    onInsuranceHandler: function(data){
        var myUserItem = GD.clientKernel.myUserItem;
        var betNum = data.betNum;

        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            if (player == null) continue;

            var isPlaying = player.isPlaying();
            if (isPlaying && !player.isDealer()) {
                if (myUserItem.userID == player.getUserID()) {
                    this.popBg = this.node.getChildByName('21dian-popBg')
                    this.insuranceLayer = this.popBg.getComponent('InsuranceLayer');
                    this.insuranceLayer.loadInfo(this.onCloseInsuranceLayer.bind(this), betNum);
                }
                player.showProgressTimer();
            }
        }
    },
    // 买保险的处理函数
    onBuyInsuranceHandler: function(data){
        var curPlayer = this.findPlayerByID(data.userID);
        curPlayer.onBuyInsuranceHandler(data);
        // SoundEngine.playEffect("res/21dian/sound/Insurance.mp3");
    },
    // 关闭强制退出提示
    onCloseInsuranceLayer: function(type){
        if (this.insuranceLayer) {
            if (type == this.insuranceLayer.TYPE_YES) {
                // GD.gameEngine.sendInsuranceMessage(subGameMSG.TYPE_INSURANCE, {flag: type});
                GD.clientKernel.sendSocketData(gameCMD.MDM_GF_GAME,subGameMSG.TYPE_INSURANCE,{flag: type})
            }
            this.popBg.active = false;
            this.insuranceLayer = null;
        }
    },
    // 要牌的处理函数
    onHitHandler: function(data){
        // data: {selfKey: ,userID: ,card: ,canDouble: ,canSplit: ,isDouble: ,curCards: ,score:}
        var myUserItem = GD.clientKernel.myUserItem;
        var result = data.curCards.result;
        var curPlayer = this.findPlayerByID(data.userID);
        curPlayer.onHitHandler(data, false);
        //
        this.roomInfoLayer.updateCardNum(data.cardLeftNum);
        if (myUserItem.userID == data.userID) {
            // 恢复操作按钮
            if (!data.isDouble && !result.isBust && !result.isFiveDragon) {
                this.buttonLayer.setOperateButtonsOpacity(255);
                this.buttonLayer.setSplitAndDouble(data.canSplit, data.canDouble);
            } else {
                this.buttonLayer.setOperateLayerVisible(false);
            }
        }
    },
    // 停牌的处理函数
    onStandHandler: function(data){
        // data: {userID: ,curCards: ,}
        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            if (player && player.getUserID() == data.userID) {
                var myUserItem = GD.clientKernel.myUserItem;
                // 如果是自己停牌,则隐藏操作层
                if (myUserItem.userID == data.userID) {
                    this.buttonLayer.setOperateLayerVisible(false);
                }
                // 只显示一个点数
                player.showOnlyRank(data.curCards);
                // 隐藏补牌的箭头
                player.setHitTipVisible(null, false);
                player.hideProgressTimer();
            }
        }
        // SoundEngine.playEffect("res/21dian/sound/Hit.mp3");
    },
    // 分牌的处理函数
    onSplitHandler: function(data){
        // data: {userID: ,betNum: ,cardData: ,allCards: ,score: ,cardLeftNum:}
        var curPlayer = this.findPlayerByID(data.userID);
        curPlayer.onSplitHandler(data);
        curPlayer.showProgressTimer();
        this.roomInfoLayer.updateCardNum(data.cardLeftNum);
        // SoundEngine.playEffect("res/21dian/sound/Split.mp3");
    },
    // 不是黑杰克的处理函数
    onIsBlackJackHandler: function(data){
        var mul = data.flag ? 1.5 : -1;
        var insuranceData = data.insurances;

        for (var chairID in insuranceData) {
            var curPlayer = this.players[chairID];
            var insurance = insuranceData[chairID] * mul;

            curPlayer.onIsBlackJackHandler(insurance);
        }
        //
        this.onCloseInsuranceLayer(null);
    },
    // 隐藏进度条
    hideProgressTimer: function(){
        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            player && player.hideProgressTimer();
        }
    },
    //获取我的分数
    getMyPlayerScore: function(){
        var myUserItem = GD.clientKernel.myUserItem;
        if (myUserItem) {
            var player = this.findPlayerByID(myUserItem.userID);
            return player.getCurScore();
        }
        return null
    },
    // 根据ID获取玩家对象
    findPlayerByID(userID){
        for (var i = 0, len = this.players.length; i < len; i++) {
            var playerSpr = this.players[i];
            if (playerSpr && playerSpr.getUserID() == userID) {
                return playerSpr;
            }
        }

        return null;
    },
    onEventGameMessage(subCMD, data) {

        switch (subCMD) {
            case subGameMSG.TYPE_WAGERING:
                this.onWageringHandler(data);
                break;
            case subGameMSG.TYPE_WAGER:
                this.onWagerHandler(data);
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
            case subGameMSG.TYPE_STAND:
                this.onStandHandler(data);
                break;
            // case subGameMSG.TYPE_BUST:
            //     this.onBustHandler(data);
            //     break;
            //
            case subGameMSG.TYPE_SPLIT:
                this.onSplitHandler(data);
                break;
            case subGameMSG.TYPE_INSURANCE:
                this.onInsuranceHandler(data);
                break;
            case subGameMSG.TYPE_BUY_INSURANCE:
                this.onBuyInsuranceHandler(data);
                break;
            case subGameMSG.TYPE_IS_BLACK_JACK:
                this.onIsBlackJackHandler(data);
                break;

            // case subGameMSG.TYPE_DEAL_TURN:
            //     this.onDealTurnHandler(data);
            //     break;
            //
            // case subGameMSG.NOT_ENOUGH_MONEY:
            //     this.onNotMoneyHandler(data);
            //     break;
            //
            // default :
            //     return true;
        }
    },




});