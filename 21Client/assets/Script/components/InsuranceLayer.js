var GD = require("GD");
var subGameMSG = require("SubGameMSG").subGameMSG
var define = require('define');
var gameCMD = define.gameCMD;
// var Util = require('Util');
cc.Class({
    extends: cc.Component,

    properties: {
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad:function() {
        this._betNum = 0
        this.TYPE_NO = 0
        this.TYPE_YES = 1
        this. _bgSpr = null
        this._callback = null
    },
    loadInfo:function(callback, betNum){
        this._callback = callback;
        this._betNum = betNum;
        this.loadBg();
        // 加载按钮
        this.loadButtons();
        // 加载文字
        this.loadLabel();
    },
    /*
   * 界面渲染
   * */
    // 加载文字
    loadLabel: function(){
        var txt = "是否购买保险?\n\n花费筹码" + this._betNum * 0.5;
        var content = this.node.getChildByName('content')getComponent(cc.Label);
        content.string = txt;
    },
    // 加载背景
    loadBg: function(){
        this.node.active = true;
        this._bgSpr = this.node;
    },

    // 加载按钮
    loadButtons: function(){
        var fn = this.onButtonHandler.bind(this);
        var yesBtn = this.node.getChildByName('21dian-sureBtn1');
        var noBtn = this.node.getChildByName('21dian-cancelBtn1');
        yesBtn.type = this.TYPE_YES;
        noBtn.type = this.TYPE_NO;
        yesBtn.on('touchend',fn);
        noBtn.on('touchend',fn);
        // GD.mainScene.setFocusSelected(noBtn);
        // yesBtn.setNextFocus(null, null, noBtn, null);
        // noBtn.setNextFocus(null, null, null, yesBtn);
    },
    // 点击按钮的处理函数
    onButtonHandler: function(btn) {
        GD.mainScene.setSelectPanal();
        this._callback && this._callback(btn.type);
    },
    /*
    * 逻辑处理
    * */
    // 点击按钮的处理函数
    callback: function(btnType){
        GD.clientKernel.sendSocketData(gameCMD.MDM_GF_GAME,subGameMSG.TYPE_INSURANCE, {
            'data':{
                flag: btnType
            }
        });
        this.node.active = false;
    }

    // update (dt) {},
});
