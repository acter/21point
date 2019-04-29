var GD = require("GD");
var subGameMSG = require("SubGameMSG").subGameMSG
var define = require('define');
var gameCMD = define.gameCMD;
var Util = require('Util');

cc.Class({
    extends: cc.Component,
    properties: {


    },
    onLoad: function() {
    },
    loadInfo(mainScene){
        this.mainScene = mainScene;
        this.roomIndex = this.mainScene.roomIndex;
        this._myScore = 0;
        this._betNum = 0
        this._betButtons = []
        this._otherButtons = []
        this._operateButtons =  [],
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
        this.initNodes();
        //加载下注按钮
        this.loadBetButtons();
        //加载其他按钮
        this.loadOtherButtons();
        // 加载操作层按钮
        this.loadOperateButtons();
    },
    //加载节点
    initNodes:function(){
        this.betbtn_list = this.node.getChildByName('bet_btn_list');
        this.operateContainer = this.node.getChildByName('card-handle');
    },
    // 显示下注层
    showBetLayer: function(data, myScore){
        this._myScore = myScore;
        this.betbtn_list.active = true;
        this.operateContainer.active = false;
        this.setBetLayerVisible(true);

    },
    // 显示操作层
    showOperateLayer: function(){
        this.operateContainer.active = true;
        this.betbtn_list.active = false;
        this.setOperateLayerVisible(true);
    },
    // 设置下注层的按钮可点击
    setBetLayerVisible: function(visible){
        // 如果可见,则恢复正常且可点击
        visible && this.setBetButtonsOpacity(255);
    },
    //设置操作按钮的可点击
    setOperateLayerVisible:function(visiable){
        visiable && this.setOperateButtonsOpacity(255);
    },
    // 设置按钮的透明度
    setButtonsOpacity: function(buttons, opacity){
        for (var i = 0, lenI = buttons.length; i < lenI; i++) {
            var btn = buttons[i];
            var button = btn.getComponent(cc.Button);
            btn.opacity = opacity;
            this.setButtonEnable(button,opacity==255);
        }
    },
    //设置按钮的可用性
    setButtonEnable:function(button,flag){
        button.interactable = flag;
    },
    // 设置下注按钮的透明度
    setBetButtonsOpacity: function(opacity){
        this.setButtonsOpacity(this._betButtons.concat(this._otherButtons), opacity);
    },
    //设置操作按钮的透明度
    setOperateButtonsOpacity: function(opacity){
        this.setButtonsOpacity(this._operateButtons, opacity);
    },
    /*
       * 界面渲染
       * */
    // 加载下注层按钮
    loadBetButtons: function(){
        var bets = this.ALL_BETS[this.mainScene.roomIndex];
        var types = [
            this.TYPE_BTN_FIRST, this.TYPE_BTN_SECOND, this.TYPE_BTN_THIRD,
            this.TYPE_BTN_FOURTH, this.TYPE_BTN_FIFTH
        ];
        for (var i = 0, len = bets.length; i < len; i++) {
            var betNum = bets[i];
            var btn = this.betbtn_list.children[i+1]
            //改变label的string值
            btn.children[0].getComponent(cc.Label).string = Util.numberTran(betNum)
            btn.type = types[i];
            btn.betNum = betNum;
            btn.on('touchend',this.onButtonHandler.bind(this))
            this._betButtons.push(btn);
        }
    },
    // 加载其他按钮
    loadOtherButtons: function(){
        var types = [this.TYPE_BTN_MAX, this.TYPE_BTN_LAST];
        var points = [0,6];
        for (var i = 0, len = types.length; i < len; i++) {
            var btn = this.betbtn_list.children[points[i]]
            btn.type = types[i];
            btn.on('touchend',this.onButtonHandler.bind(this))
            this._otherButtons.push(btn);
        }
    },
    // 加载操作层按钮
    loadOperateButtons: function(){
        var names = ["split", "double", "stand", "hit"];
        var types = [
            this.TYPE_BTN_SPLIT, this.TYPE_BTN_DOUBLE, this.TYPE_BTN_STAND, this.TYPE_BTN_HIT
        ];
        // this._operateContainerLayer = new cc.Layer().to(this).hide();
        for (var i = 0, len = names.length; i < len; i++) {
            var btn = this.operateContainer.children[i];
            btn.type = types[i];
            btn.on('touchend',this.onButtonHandler.bind(this));
            this._operateButtons.push(btn);
        }
    },
    // 点击最大下注数按钮的梳理函数
    onMaxButtonHandler: function(btn){
        var myUserItem = GD.clientKernel.myUserItem;
        var maxBets = {'0': 2000, '1': 5000000, '2': 20000000};
        var maxBet = maxBets[this.mainScene.roomIndex];

        var betNum = myUserItem.score >= maxBet ? maxBet : myUserItem.score;
        // 发送下注信息
        this.sendWagerMessage(betNum)
    },
    // 点击上局下注按钮的处理函数
    onLastButtonHandler: function(btn){
        if (this._lastBetNum == 0) {
            // 吐丝提示,上局没有下注
            // ToastSystemInstance.buildToast("您上局没有下注!");
            console.log('您上局没有下注!')
        } else {
            // 发送下注信息
            this.sendWagerMessage(this._lastBetNum);
            // 隐藏下注层
            this.hideBetButton()
        }
    },
    onBetButtonHandler: function(btn){
        if (this._myScore == null) return;

        var types = [
            this.TYPE_BTN_FIRST, this.TYPE_BTN_SECOND, this.TYPE_BTN_THIRD,
            this.TYPE_BTN_FOURTH, this.TYPE_BTN_FIFTH
        ];

        var curBets = this.ALL_BETS[this.mainScene.roomIndex];//[100, 200, 500, 1000, 2000]

        for (var i = 0, len = types.length; i < len; i++) {//[1,2,3,4,5]
            if (types[i] ==  btn.target.type) {
                this._betNum += curBets[i];
                break;
            }
        }
        // 设置下注按钮的可用性
        this.setBetButtonsDisabled();
        // 发送下注信息
        this.sendBetMessage(this._betNum)

    },
    // 发送下注信息
    sendBetMessage: function(betNum){
        var curBets = this.ALL_BETS[this.mainScene.roomIndex];
        var maxBet = curBets[curBets.length - 1];
        this._lastBetNum = betNum;
        // 发送下注信息
        this.sendWagerMessage(betNum);
        betNum >= maxBet && this.hideBetButton();
    },
    onButtonHandler: function(btn){
        switch (btn.target.type){
            case this.TYPE_BTN_MAX:
                this.onMaxButtonHandler(btn);
                break;
            case this.TYPE_BTN_LAST:
                this.onLastButtonHandler(btn);
                break;
            case this.TYPE_BTN_FIRST:
            case this.TYPE_BTN_SECOND:
            case this.TYPE_BTN_THIRD:
            case this.TYPE_BTN_FOURTH:
            case this.TYPE_BTN_FIFTH:
                this.onBetButtonHandler(btn);
                break;
            case this.TYPE_BTN_SPLIT:
            case this.TYPE_BTN_DOUBLE:
            case this.TYPE_BTN_STAND:
            case this.TYPE_BTN_HIT:
                this.onOperateButtonHandler(btn);
                break;
        }

    },
    // 点击分牌、加倍、停牌、要牌按钮的处理函数
    onOperateButtonHandler: function(btn){
        var msg = "";
        switch (btn.target.type) {
            case this.TYPE_BTN_SPLIT:
                msg = subGameMSG.TYPE_SPLIT;
                break;

            case this.TYPE_BTN_DOUBLE:
                msg = subGameMSG.TYPE_DOUBLE;
                break;

            case this.TYPE_BTN_STAND:
                msg = subGameMSG.TYPE_STAND;
                break;

            case this.TYPE_BTN_HIT:
                msg = subGameMSG.TYPE_HIT;
                break;
        }
        // 按钮设置为半透明,并且不能点击
        this.setOperateButtonsOpacity(200);
        // 发送操作的消息
        this.sendOperateMessage(msg, {});
    },

    //发送操作消息
    sendOperateMessage:function(msg,data){

        GD.clientKernel.sendSocketData(gameCMD.MDM_GF_GAME,msg,data);
    },
    // 发送下注信息
    sendWagerMessage: function(betNum){
        var curBets = this.ALL_BETS[this.mainScene.roomIndex];
        var maxBet = curBets[curBets.length - 1];
        betNum >= maxBet && this.hideBetButton();
        this._lastBetNum = betNum;
        GD.clientKernel.sendSocketData(gameCMD.MDM_GF_GAME,subGameMSG.TYPE_WAGER, {
            'data':{
                baseBet: betNum
            }
        });
    },
    //隐藏下注层
    hideBetButton:function(){
        this.betbtn_list.active = false
    },

    // 当前下注与按钮的值相加超过最大值的不能点
    setBetButtonsDisabled: function(){
        var curBets = this.ALL_BETS[this.mainScene.roomIndex];
        var maxBet = curBets[curBets.length - 1];
        maxBet = maxBet > this._myScore ? this._myScore : maxBet;

        // 当前下注与按钮的值相加超过最大值的不能点
        for (var j = 0, lenJ = this._betButtons.length; j < lenJ; j++) {
            var btn = this._betButtons[j];
            var curBetNum = this._betNum + btn.betNum;
            if (curBetNum > maxBet || curBetNum > this._myScore) {
                //移除点击事件并且改变透明度
                btn.opacity = 150;
                var button = btn.getComponent(cc.Button);
                this.setButtonEnable(button,false)
            }
        }
        // 下过注,上局下注就不能点击
        for (var i = 0, lenI = this._otherButtons.length; i < lenI; i++) {
            var btn = this._otherButtons[i];
            if (this._betNum > 0 && btn.type == this.TYPE_BTN_LAST) {
                //移除点击事件并且改变透明度
                btn.opacity = 150;
                var button = btn.getComponent(cc.Button);
                this.setButtonEnable(button,false)
            }
        }
    },
    setSplitAndDouble: function(canSplit, canDouble){
        var splitBtn = this.findButtonByType(this.TYPE_BTN_SPLIT);
        var doubleBtn = this.findButtonByType(this.TYPE_BTN_DOUBLE);

        if (canSplit) {
            splitBtn.opacity = 255;
        } else {
            splitBtn.opacity = 100;
        }

        if (canDouble) {
            doubleBtn.opacity = 255;
        } else {
            doubleBtn.opacity = 100;
        }

        this._canSplit = canSplit;
        this._canDouble = canDouble;
        var splitBtnButton = splitBtn.getComponent(cc.Button)
        var doubleBtnButton = doubleBtn.getComponent(cc.Button)
        this.setButtonEnable(splitBtnButton,canSplit)
        this.setButtonEnable(doubleBtnButton,canDouble)

        // splitBtn.setTouchEnabled(canSplit);
        // doubleBtn.setTouchEnabled(canDouble);

    },
    findButtonByType: function(type){
        for (var i = 0, lenI = this._operateButtons.length; i < lenI; i++) {
            var btn = this._operateButtons[i];
            if (btn.type == type) {
                return btn;
            }
        }

        for (var i = 0, lenI = this._betButtons.length; i < lenI; i++) {
            var btn = this._betButtons[i];
            if (btn.type == type) {
                return btn;
            }
        }

        for (var i = 0, lenI = this._otherButtons.length; i < lenI; i++) {
            var btn = this._otherButtons[i];
            if (btn.type == type) {
                return btn;
            }
        }
    }
});
