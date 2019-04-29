"use strict";

var NetHelp = require("NetHelp");
var subGameMSG = require("SubGameMSG").subGameMSG;
var ClientKernel = require("ClientKernel");
var GD = require("GD");
var Player = require('player');
var define = require('define');
var gameCMD = define.gameCMD;
var Betbutton = require('betbutton');
var gameEvent = define.gameEvent;
var gameConst = define.gameConst;
var ZZConfig = require("Config").ZZConfig;
var betButton = require('betbutton');

cc.Class({
    properties: {
        userPreb: {
            default: null,
            type: cc.Prefab
        },
        goldPreb: {
            default: null,
            type: cc.Prefab
        },
        Allsprite: {
            default: null,
            type: cc.SpriteAtlas
        }
    },
    extends: cc.Component,
    onLoad: function onLoad() {

        this.MAX_BET = 2000; //下注上限
        this.players = [];
        this.roomIndex = 0;
        this.isGameStarted = false;
        this.startSpr = null;
        // 加载开始提示
        this.loadStartTip();
        this.gameResultLayer = null;
        this.curBet = 0;
        this.bindEvent();
        this.initMembers();
        this.lastBetNum = 0; //上次下注数
        this.initNodes();
    },
    // 初始化成员变量
    initMembers: function initMembers() {
        // 初始化出6个空位置。五个玩家、一个庄家
        for (var i = 0, num = 6; i < num; i++) {
            this.players[i] = null;
        }
    },
    bindEvent: function bindEvent() {
        this.bindObj = [];
        this.bindObj.push(onfire.on("onEventSceneMessage", this.onEventSceneMessage.bind(this)));
        this.bindObj.push(onfire.on("onEventGameMessage", this.onEventGameMessage.bind(this)));
    },
    loadStartTip: function loadStartTip() {
        var size = cc.winSize;
        var x = size.width;
        // var y = size.height * 0.6;
        this.startSpr = new cc.Node('startBet');
        var sp = this.startSpr.addComponent(cc.Sprite);

        sp.spriteFrame = this.Allsprite._spriteFrames['21dian-start'];
        this.startSpr.parent = this.node;
        this.startSpr.setPosition(-x, 0);
    },

    startSprIn: function startSprIn() {
        // 开始提示精灵进场
        if (this.startSpr == null) return;
        var size = cc.winSize;
        var x = size.width * 0.5;

        this.startSpr.runAction(cc.sequence(cc.moveTo(0.5, cc.p(0, 0)).easing(cc.easeBackOut(0.5)), cc.delayTime(0.5), cc.moveTo(0.5, cc.p(2.5 * x, 0)).easing(cc.easeBackIn(0.5)), cc.callFunc(function () {
            this.startSpr.setPosition(-x, 0);
        }.bind(this))));
    },
    // 正在下注的处理函数
    onWageringHandler: function onWageringHandler(data) {
        if (data.leftTime >= 5000) {
            // 开始提示精灵进场
            this.startSprIn();
        }
        // 重新设置玩家
        // this.resetPlayer();
        //加载下注层
        this.loadUILayer();
    },

    //下注的处理函数
    onWagerHandler: function onWagerHandler(data) {
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

    // 重新设置玩家
    resetPlayer: function resetPlayer() {
        for (var i = 0, len = this.players.length; i < len; i++) {
            var player = this.players[i];
            if (player) {
                if (player == null) return;
                // 重置数据
                player.reset();
                // 不是庄家才显示数秒框
                !player.isDealer() && player.showProgressTimer();
            }
        }
    },
    //加载下注层,隐藏操作层
    loadUILayer: function loadUILayer() {
        this.bet_list.active = true;
        this.card_handle = this.node.getChildByName('card_handle');
        this.card_handle.active = false;
    },

    /*
    * 逻辑处理
    * */
    // 场景还原
    onEventSceneMessage: function onEventSceneMessage(gameStatus, data) {
        // data: {playerData: ,dealID: ,isGameOver: ,cardLeftNum: ,
        // timeLeft: ,isWagering: ,roomIndex:}

        var myUserItem = GD.clientKernel.myUserItem;
        var isGameOver = data.isGameOver;
        var playerData = data.playerData;
        this.roomIndex = data.roomIndex;

        for (var i = 0, len = playerData.length; i < len; i++) {
            var curData = playerData[i];
            var chairID = curData.chairID;
            //各个玩家坐下
            var player = this.playSit(chairID, curData);

            // // 提示玩家所在位置
            if (curData.userID == myUserItem.userID) {

                player.showTip();
            }
            if (!isGameOver) {
                // 间隔发牌
                // this.delayDeal(playerSpr, curData, i, data.dealID);
                if (data.isWagering) {
                    // this.delayDeal(player, curData, i, data.dealID);
                    cc.log('开始下注时间', data.timeLeft);
                    player.showProgressTimer(data.timeLeft);
                }
            }
            this.players[chairID] = player;
        }

        // 更新卡牌数量
        this.roomInfo(this.roomIndex);
        // && this.roomInfoLayer.updateCardNum(data.cardLeftNum);
    },
    roomInfo: function roomInfo(roomIndex) {
        this.betbutton = new betButton(roomIndex);
    },

    // 延迟发牌
    delayDeal: function delayDeal(playerSpr, curData, i, dealID) {
        if (curData.cards) {
            setTimeout(function () {
                playerSpr.loadCardBoxes(curData.cards, dealID);
            }, 600 * i);
        }
    },
    //玩家坐下
    playSit: function playSit(chairID, data) {
        if (data.isDealer) {
            this.playChair = this.playerPos.getChildByName('pos5');
        }
        this.playChair = this.playerPos.getChildByName('pos' + chairID);
        var newPlayer = cc.instantiate(this.userPreb);
        var templayer = newPlayer.addComponent(Player);
        var script = newPlayer.getComponent('player');
        this.playChair.addChild(newPlayer);
        this.playChair.active = true;
        script.loadInfo(data, this.Allsprite);

        //
        return script;
        // }
    },
    initNodes: function initNodes() {
        this.bet_btn = [];
        // 常量
        this.playerPos = this.node.getChildByName('21dian-player');
        this.bet_list = this.node.getChildByName('bet_btn_list');
        //监听是否下注时间结束
        // onfire.on('readyEnd',this.readyEnd.bind(this))
        for (var i = 0; i < this.bet_list.children.length; i++) {
            this.bet_btn[i] = this.bet_list.children[i];

            //下注金币

            var bet_num = this.bet_btn[i].children[0].getComponent(cc.Label).string;
            this.bet_btn[i].type = i;
            this.bet_btn[i].betNum = bet_num;
            this.bet_btn[i].on('touchend', this.onButtonHandler.bind(this));
        }
    },

    // 点击按钮的处理函数
    onButtonHandler: function onButtonHandler(btn) {
        var betButton = this.bet_list.getComponent('betbutton', 'aaaa');
        switch (btn.target.type) {
            case betButton.TYPE_BTN_MAX:
                betButton.onMaxButtonHandler(btn);
                break;

            case betButton.TYPE_BTN_LAST:
                betButton.onLastButtonHandler(btn);

                break;

            case this.TYPE_BTN_HELP:
                betButton.onHelpButtonHandler(btn);
                break;

            case this.TYPE_BTN_FIRST:
            case this.TYPE_BTN_SECOND:
            case this.TYPE_BTN_THIRD:
            case this.TYPE_BTN_FOURTH:
            case this.TYPE_BTN_FIFTH:
                betButton.onBetButtonHandler(btn);
                break;
            case this.TYPE_BTN_SPLIT:
            case this.TYPE_BTN_DOUBLE:
            case this.TYPE_BTN_STAND:
            case this.TYPE_BTN_HIT:
                betButton.onOperateButtonHandler(btn);
                break;
        }
    },

    //获取得分
    getMyPlayerScore: function getMyPlayerScore() {
        var myUserItem = GD.clientKernel.myUserItem;
        if (myUserItem) {
            var player = this.findPlayerByID(myUserItem.userID);
            return player.getCurScore();
        }
        return null;
    },
    // 根据ID获取玩家对象
    findPlayerByID: function findPlayerByID(userID) {
        for (var i = 0, len = this.players.length; i < len; i++) {
            var playerSpr = this.players[i];
            if (playerSpr && playerSpr.getUserID() == userID) {
                return playerSpr;
            }
        }

        return null;
    },

    /**
     * 游戏消息事件
     * @param subCMD 子游戏命令
     * @param data 数据
     * @returns {boolean}
     */
    onEventGameMessage: function onEventGameMessage(subCMD, data) {

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

            case subGameMSG.TYPE_BUST:
                this.onBustHandler(data);
                break;

            case subGameMSG.TYPE_SPLIT:
                this.onSplitHandler(data);
                break;

            case subGameMSG.TYPE_GAME_OVER:
                this.onGameOverHandler(data);
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

            case subGameMSG.TYPE_DEAL_TURN:
                this.onDealTurnHandler(data);
                break;

            case subGameMSG.NOT_ENOUGH_MONEY:
                this.onNotMoneyHandler(data);
                break;

            default:
                return true;
        }
    },

    //发送子游戏事件

    sendGameData: function sendGameData(subCMD, data) {
        GD.clientKernel.sendSocketData(gameCMD.MDM_GF_GAME, subCMD, data);
    }

});
//# sourceMappingURL=scene.js.map