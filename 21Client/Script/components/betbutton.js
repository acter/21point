var GD = require("GD");
var subGameMSG = require("SubGameMSG").subGameMSG
var define = require('define');
var gameCMD = define.gameCMD;
cc.Class({
    extends: cc.Component,
    properties: {


    },
    onLoad: function() {
        this._lastBetNum = 0
    },
    ctor:function(roomIndex){
        this.roomIndex = roomIndex;
        this.TYPE_BTN_MAX=0;
        this.TYPE_BTN_FIRST=1;
        this.TYPE_BTN_SECOND=2;
        this.TYPE_BTN_THIRD=3;
        this.TYPE_BTN_FOURTH=4;
        this.TYPE_BTN_FIFTH=5;
        this.TYPE_BTN_LAST=6;
        this.TYPE_BTN_SPLIT=7;
        this.TYPE_BTN_DOUBLE=8;
        this.TYPE_BTN_STAND=9;
        this.TYPE_BTN_HIT=10;
        this.TYPE_BTN_HELP=11;
        this.ALL_BETS={
            '0': [100, 200, 500, 1000, 2000],
            '1': [500, 2000, 5000, 10000, 200000],
            '2': [1000, 10000, 100000, 1000000, 5000000],
            '3': [10000, 100000, 1000000, 10000000, 20000000],
        }

    },


//点击最大下注数按钮的处理函数
    onMaxButtonHandler(btn){
        var myUserItem = GD.clientKernel.myUserItem;
        var maxBets = {'0': 2000, '1': 5000000, '2': 20000000};
        var maxBet = maxBets[0];

        var betNum = myUserItem.score >= maxBet ? maxBet : myUserItem.score;
        // 发送下注信息
        this.sendWagerMessage(betNum)
    },
    // 点击上局下注按钮的处理函数
    onLastButtonHandler: function(btn){
        // if (this._lastBetNum == 0) {
        //     // 吐丝提示,上局没有下注
        //     // ToastSystemInstance.buildToast("您上局没有下注!");
        //     console.log('您上局没有下注!')
        // } else {
            // 发送下注信息
            this.sendWagerMessage(2);
            // 隐藏下注层
            this.node.active = false;
            // GD.mainScene.setSelectPanal();
        // }
    },
    // 点击下注按钮的处理函数
    onBetButtonHandler: function(btn) {
        if (this._myScore == null) return;

        var types = [
            this.TYPE_BTN_FIRST, this.TYPE_BTN_SECOND, this.TYPE_BTN_THIRD,
            this.TYPE_BTN_FOURTH, this.TYPE_BTN_FIFTH
        ];

        var curBets = this.ALL_BETS[this.roomIndex];

        for (var i = 0, len = types.length; i < len; i++) {
            if (types[i] == btn.type) {
                this._betNum += curBets[i];
                break;
            }
        }
        // 发送下注信息
        this.sendWagerMessage(this._betNum)
    },
    // 发送下注信息
    sendWagerMessage: function(betNum){
        GD.clientKernel.sendSocketData(gameCMD.MDM_GF_GAME,subGameMSG.TYPE_WAGER, {
            baseBet: betNum
        });
    },
});
