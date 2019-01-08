/**
 * UI控制层
 * Created by BiteLu on 2016/12/9.
 */
var UILayer = cc.Layer.extend({
	_className: "UILayer",
	_classPath: "src/layer/UILayer.js",

    // 常量
    TYPE_BTN_MAX: 0,
    TYPE_BTN_FIRST: 1,
    TYPE_BTN_SECOND: 2,
    TYPE_BTN_THIRD: 3,
    TYPE_BTN_FOURTH: 4,
    TYPE_BTN_FIFTH: 5,
    TYPE_BTN_LAST: 6,
    TYPE_BTN_SPLIT: 7,
    TYPE_BTN_DOUBLE: 8,
    TYPE_BTN_STAND: 9,
    TYPE_BTN_HIT: 10,
    TYPE_BTN_HELP: 11,
    ALL_BETS: {
        '0': [100, 200, 500, 1000, 2000],
        '1': [500, 2000, 5000, 10000, 200000],
        '2': [1000, 10000, 100000, 1000000, 5000000],
        '3': [10000, 100000, 1000000, 10000000, 20000000],
    },
    // 成员变量
    mainScene: null,
    _betContainerLayer: null,
    _operateContainerLayer: null,
    _betNum: 0,
    _lastBetNum: 0,
    _myScore: 0,
    _canSplit: false,
    _canDouble: true,
    _betButtons: [],
    _operateButtons: [],
    _otherButtons: [],

    // 构造函数
    ctor: function(mainScene){
        // 初始化成员变量
        this.initMembers(mainScene);
        // 超类构造函数
        this._super();
        // 加载下注层按钮
        this.loadBetButtons();
        // 加载操作层按钮
        this.loadOperateButtons();
        // 加载帮助按钮
        this.loadHelpButton();
        // 加载其他按钮
        this.loadOtherButtons();
    },

    // 初始化成员变量
    initMembers: function(mainScene){
        this.mainScene = mainScene;
        this._betButtons = [];
        this._operateButtons = [];
        this._otherButtons =[];
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

        this._betContainerLayer = new cc.Layer().to(this).hide();
        for (var i = 0, len = bets.length; i < len; i++) {
            var betNum = bets[i];
            var btn = new FocusButton("21dian/betBtn1.png", "21dian/betBtn2.png", "",
                ccui.Widget.PLIST_TEXTURE).to(this._betContainerLayer).p(345 + 160 * i, 60);
            Util.numberMakerWithConfig(
                "res/21dian/game/shuzi001.png", betNum, whiteTextConfig, false, true, true
            ).to(btn).pp(0.58, 0.5);
            btn.type = types[i];
            btn.betNum = betNum;
            btn.addClickEventListener(this.onButtonHandler.bind(this));
            this._betButtons.push(btn);
        }
    },

    // 加载操作层按钮
    loadOperateButtons: function(){
        var names = ["split", "double", "stand", "hit"];
        var types = [
            this.TYPE_BTN_SPLIT, this.TYPE_BTN_DOUBLE, this.TYPE_BTN_STAND, this.TYPE_BTN_HIT
        ];
        this._operateContainerLayer = new cc.Layer().to(this).hide();

        for (var i = 0, len = names.length; i < len; i++) {
            var img = "#21dian/" + names[i] + ".png";
            var btn = new FocusButton("21dian/operatBtn1.png", "21dian/operatBtn2.png", "",
                ccui.Widget.PLIST_TEXTURE).to(this._operateContainerLayer).p(340 + 200 * i, 60);
            var textSpr = new cc.Sprite(img).to(btn).pp(0.5, 0.5);

            btn.type = types[i];
            btn.addClickEventListener(this.onButtonHandler.bind(this));
            this._operateButtons.push(btn);
        }
    },

    // 加载其他按钮
    loadOtherButtons: function(){
        var names = ["21dian/maxBet", "21dian/lastBet"];
        var types = [this.TYPE_BTN_MAX, this.TYPE_BTN_LAST];
        var points = [cc.p(130, 60), cc.p(1200, 60)];

        for (var i = 0, len = types.length; i < len; i++) {
            var imgNormal = names[i] + "1.png";
            var imgSelected = names[i] + "2.png";
            var btn = new FocusButton(imgNormal, imgSelected, "", ccui.Widget.PLIST_TEXTURE)
                .to(this._betContainerLayer).p(points[i]);

            btn.type = types[i];
            btn.addClickEventListener(this.onButtonHandler.bind(this));
            this._otherButtons.push(btn);
        }
    },

    // 加载帮助按钮
    loadHelpButton: function(){
        var size = cc.winSize;

        var btn = new FocusButton("21dian/helpBtn1.png", "21dian/helpBtn2.png", "", ccui.Widget.PLIST_TEXTURE)
            .to(this).p(cc.p(size.width - 50, size.height - 50));

        btn.type = this.TYPE_BTN_HELP;
        btn.addClickEventListener(this.onButtonHandler.bind(this));
        this.helpBtn = btn;
    },



    /*
    * 逻辑处理
    * */
    // 点击按钮的处理函数
    onButtonHandler: function(btn){
        switch (btn.type){
            case this.TYPE_BTN_MAX:
                this.onMaxButtonHandler(btn);
                break;

            case this.TYPE_BTN_LAST:
                this.onLastButtonHandler(btn);
                break;

            case this.TYPE_BTN_HELP:
                this.onHelpButtonHandler(btn);
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
        SoundEngine.playEffect("res/21dian/sound/com_buttonClick.wav");
    },

    // 点击最大下注数按钮的梳理函数
    onMaxButtonHandler: function(btn){
        var myUserItem = GD.clientKernel.myUserItem;
        var maxBets = {'0': 2000, '1': 5000000, '2': 20000000};
        var maxBet = maxBets[this.mainScene.roomIndex];

        var betNum = myUserItem.score >= maxBet ? maxBet : myUserItem.score;
        // 发送下注信息
        this.sendWagerMessage(betNum)
        GD.mainScene.setSelectPanal();
    },

    // 点击上局下注按钮的处理函数
    onLastButtonHandler: function(btn){
        if (this._lastBetNum == 0) {
            // 吐丝提示,上局没有下注
            ToastSystemInstance.buildToast("您上局没有下注!");
        } else {
            // 发送下注信息
            this.sendWagerMessage(this._lastBetNum);
            // 隐藏下注层
            this._betContainerLayer.hide();
            GD.mainScene.setSelectPanal();
        }
    },

    // 点击帮助按钮的处理函数
    onHelpButtonHandler: function(btn){
        this.mainScene.loadHelpLayer();
    },

    // 点击下注按钮的处理函数
    onBetButtonHandler: function(btn){
        if (this._myScore == null) return;

        var types = [
            this.TYPE_BTN_FIRST, this.TYPE_BTN_SECOND, this.TYPE_BTN_THIRD,
            this.TYPE_BTN_FOURTH, this.TYPE_BTN_FIFTH
        ];

        var curBets = this.ALL_BETS[this.mainScene.roomIndex];

        for (var i = 0, len = types.length; i < len; i++) {
            if (types[i] ==  btn.type) {
                this._betNum += curBets[i];
                break;
            }
        }

        // 设置下注按钮的可用性
        this.setBetButtonsDisabled();
        // 发送下注信息
        this.sendWagerMessage(this._betNum)
        if (i == 4)
            GD.mainScene.setSelectPanal();
    },

    // 点击分牌、加倍、停牌、要牌按钮的处理函数
    onOperateButtonHandler: function(btn){
        var msg = "";
        switch (btn.type) {
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
        GD.gameEngine.sendOperateMessage(msg, {});
    },

    // 发送下注信息
    sendWagerMessage: function(betNum){
        var curBets = this.ALL_BETS[this.mainScene.roomIndex];
        var maxBet = curBets[curBets.length - 1];

        this._lastBetNum = betNum;
        // 发送下注信息
        GD.gameEngine.sendWagerMessage(betNum);
        betNum >= maxBet && this._betContainerLayer.hide();
    },

    // betNum设置为0
    setBetNumToZero: function(){
        this._betNum = 0;
    },

    // 显示下注层
    showBetLayer: function(data, myScore){
        this._myScore = myScore;
        this._betContainerLayer.show();
        this._operateContainerLayer.hide();
        this.setBetLayerVisible(true);
        // 设置下注按钮的可用性
        this.setBetButtonsDisabled();
    },

    // 显示操作层
    showOperateLayer: function(){
        this._operateContainerLayer.show();
        this._betContainerLayer.hide();
        this.setOperateLayerVisible(true);
    },

    // 设置操作层的按钮可以点击
    setOperateLayerVisible: function(visible){
        this._operateContainerLayer.setVisible(visible);
        // 如果可见,则恢复正常且可点击
        visible && this.setOperateButtonsOpacity(255);
        if (visible == false)
            GD.mainScene.setSelectPanal();
    },

    // 设置下注层的按钮可点击
    setBetLayerVisible: function(visible){
        this._betContainerLayer.setVisible(visible);
        // 如果可见,则恢复正常且可点击
        visible && this.setBetButtonsOpacity(255);
        if (visible == false)
            GD.mainScene.setSelectPanal();
    },

    // 设置操作按钮的透明度
    setOperateButtonsOpacity: function(opacity){
        this.setButtonsOpacity(this._operateButtons, opacity);
    },

    // 设置下注按钮的透明度
    setBetButtonsOpacity: function(opacity){
        this.setButtonsOpacity(this._betButtons.concat(this._otherButtons), opacity);
    },

    setSplitAndDouble: function(canSplit, canDouble){
        var splitBtn = this.findButtonByType(this.TYPE_BTN_SPLIT);
        var doubleBtn = this.findButtonByType(this.TYPE_BTN_DOUBLE);

        if (canSplit) {
            splitBtn.setOpacity(255);
        } else {
            splitBtn.setOpacity(100);
        }

        if (canDouble) {
            doubleBtn.setOpacity(255);
        } else {
            doubleBtn.setOpacity(100);
        }

        this._canSplit = canSplit;
        this._canDouble = canDouble;
        splitBtn.setTouchEnabled(canSplit);
        doubleBtn.setTouchEnabled(canDouble);
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
                btn.setOpacity(150);
                btn.setTouchEnabled(false);
            }
        }

        // 下过注,上局下注就不能点击
        for (var i = 0, lenI = this._otherButtons.length; i < lenI; i++) {
            var btn = this._otherButtons[i];
            if (this._betNum > 0 && btn.type == this.TYPE_BTN_LAST) {
                btn.setOpacity(150);
                btn.setTouchEnabled(false);
            }
        }
    },

    // 设置按钮的透明度
    setButtonsOpacity: function(buttons, opacity){
        for (var i = 0, lenI = buttons.length; i < lenI; i++) {
            var btn = buttons[i];

            btn.setOpacity(opacity);
            btn.setTouchEnabled(opacity == 255);
        }
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