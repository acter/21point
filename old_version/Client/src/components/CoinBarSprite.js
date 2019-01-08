/**
 * 金币条组件
 *
 * Created by BiteLu on 16/7/28.
 */
var CoinBarSprite = ccui.Scale9Sprite.extend({
	_className: "CoinBarSprite",
	_classPath: "src/components/CoinBarSprite.js",

    // 成员变量
    _img: "",
    _coinNum: 0,
    _fontName: "Arial",
    _fontSize: 30,
    _hideAddButton: false,
    _callback: null,
    _coinLab: null,
    _time: 0,
    _originNum: 0,
    _targetNum: 0,

    // 构造函数
    ctor: function(params){
        // 初始化成员变量
        this.initMembers(params);
        // 父类构造函数
        this._super(this._img);
        // 加载金币信息
        this.loadCoinInfo();
        // 加载充值按钮
        this.loadAddButton();
    },

    // 初始化成员变量
    initMembers: function(params){
        this._img = params.img || null;
        this._coinNum = params.coinNum || this._coinNum;
        this._fontName = params.fontName || this._fontName;
        this._fontSize = params.fontSize || this._fontSize;
        this._hideAddButton = params.hideAddButton || this._hideAddButton;
        this._callback = params.callback;
    },



    /*
    * 界面渲染
    * */
    // 加载金币信息
    loadCoinInfo: function(){
        var coinSpr = new cc.Sprite("res/jiuxianlawang/gui-gold-icon.png").to(this).p(-35, 0);
        this._coinLab = new cc.LabelTTF("" + this._coinNum, this._fontName, this._fontSize)
            .to(this).pp(0.13, 0.5).anchor(0.0, 0.5);
        this._coinLab.setFontFillColor(GFontDef.fillStyle);
    },

    // 加载充值按钮
    loadAddButton: function(){
        if(!this._hideAddButton){
            var addButton = new ccui.Button("res/gui/gui-tickets-button-recharge.png", "res/gui/gui-tickets-button-recharge.png", "", ccui.Widget.LOCAL_TEXTURE)
                .to(this).pp(1.0, 0.5);
            addButton.addClickEventListener(this.onAddButtonHandler.bind(this));
        }
    },



    /*
    * 逻辑处理
    * */
    // 点击充值按钮的处理函数
    onAddButtonHandler: function(sender){
        this._callback && this._callback(sender);
    },

    // 设置金币值
    setCoinNum: function(num, time){
        var count = 0;
        var interval = 0.05;

        var times = (time || 2) / interval;
        var originNum = parseInt(this._coinLab.getString()) || 0;
        var offset = (num - originNum) / times;

        this.schedule(function(){
            count++;
            originNum += Math.floor(Math.random() * offset);
            originNum = count >= times ? num : originNum;

            this._coinLab.setString(originNum);
        }, interval, times);
    },

    getCoinNum: function(){
        return parseInt(this._coinLab.getString()) || 0;
    }
 });