"use strict";

var NetHelp = require("NetHelp");
var subGameMSG = require("SubGameMSG").subGameMSG;
var ClientKernel = require("ClientKernel");
var GD = require("GD");
var Player = require('player');
var define = require('define');
var gameCMD = define.gameCMD;
var gameEvent = define.gameEvent;
var gameConst = define.gameConst;
var ZZConfig = require("Config").ZZConfig;

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
        sprite: {
            default: null,
            type: cc.SpriteAtlas
        }
    },
    extends: cc.Component,
    onLoad: function onLoad() {

        this.players = [];
        this.isGameStarted = false;
        this.bindEvent();
        this.gameResultLayer = null;
        this.lastBetNum = 0; //上次下注数
        this.initNodes();
    },
    bindEvent: function bindEvent() {

        this.bindObj = [];
        this.bindObj.push(onfire.on("onEventGameMessage", this.onEventGameMessage.bind(this)));
        this.bindObj.push(onfire.on("onEventSceneMessage", this.onEventSceneMessage.bind(this)));
    },
    initNodes: function initNodes() {
        this.playerPos = this.node.getChildByName('21dian-player');
        this.bet_list = this.node.getChildByName('bet_btn_list');
        for (var i = 0; i < this.bet_list.children.length; i++) {
            var bet_btn = this.bet_list.children[i];

            //下注金币

            var bet_num = bet_btn.children[0].getComponent(cc.Label).string;

            bet_btn.on('touchend', this.bet.bind(this, bet_num));
        }
    },

    //下注
    bet: function bet(bet_num) {
        var myUserItem = GD.clientKernel.myUserItem;
        var coin = cc.instantiate(this.goldPreb);

        this.players[myUserItem.chairID].onWagerHandler(bet_num, coin);
    },

    // 加载开始提示
    // loadStartTip: function(){
    //     var size  = cc.winSize;
    //     var x = size.width * 0.5;
    //     var y = size.height * 0.6;
    //
    //     this.startSpr = new cc.Sprite("#21dian/start.png").to(this, 1).p(-x, y);
    // },
    //游戏内消息
    onEventGameMessage: function onEventGameMessage(data) {},
    //发送子游戏事件

    sendGameData: function sendGameData(subCMD, data) {
        GD.clientKernel.sendSocketData(gameCMD.MDM_GF_GAME, subCMD, data);
    },
    //场景还原
    onEventSceneMessage: function onEventSceneMessage(gameStatus, data) {

        var myUserItem = GD.clientKernel.myUserItem;
        var isGameOver = data.isGameOver;
        var playerData = data.playerData;

        for (var i = 0, len = playerData.length; i < len; i++) {
            var curData = playerData[i];
            var chairID = curData.chairID;
            //各个玩家坐下
            var player = this.playSit(chairID, curData);
            cc.log('playerData', playerData);
            // // 提示玩家所在位置
            if (curData.userID == myUserItem.userID) {

                player.showTip();
            }

            // if (!isGameOver) {
            //     // 间隔发牌
            //     this.delayDeal(playerSpr, curData, i, data.dealID);
            //     if (data.isWagering) {
            //         playerSpr.showProgressTimer(data.leftTime);
            //     }
            // }
            //
            // this.players.push(playerSpr);
            // this.players[chairID] = playerSpr;
        }

        // 更新卡牌数量
        // this.roomInfoLayer && this.roomInfoLayer.updateCardNum(data.cardLeftNum);
    },
    //玩家坐下
    playSit: function playSit(chairID, data) {

        this.playChair = this.playerPos.getChildByName('pos' + chairID);
        var newPlayer = cc.instantiate(this.userPreb);
        var templayer = newPlayer.addComponent(Player);

        var script = newPlayer.getComponent('player');
        script.loadInfo(data);
        this.playChair.addChild(newPlayer);
        this.playChair.active = true;
        this.players[chairID] = templayer;
        //
        return script;
    }
});
//# sourceMappingURL=scene.js.map