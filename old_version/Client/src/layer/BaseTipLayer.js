/**
 * 提示层基础类
 * Created by BiteLu on 2017/1/12.
 */
var BaseTipLayer = cc.LayerColor.extend({
	_className: "BaseTipLayer",
	_classPath: "src/layer/BaseTipLayer.js",

    // 常量
    TYPE_NO: 0,
    TYPE_YES: 1,
    // 成员变量
    _bgSpr: null,
    _callback: null,

    // 构造函数
    ctor: function(callback){
        this._callback = callback;
        // 超类构造函数
        this._super(cc.color(0, 0, 0, 125));
        // 加载背景
        this.loadBg();
        // 加载按钮
        this.loadButtons();
        // 吞噬点击
        this.swallowTouch();
    },

    // 加载背景
    loadBg: function(){
        var size = cc.winSize;
        var bgSpr = new cc.Sprite("#21dian/popBg.png").to(this).p(size.width * 0.5, size.height * 0.5);
        var tipSpr = new cc.Sprite("#21dian/tip.png").to(bgSpr).p(333.5, 410);

        this._bgSpr = bgSpr;
    },

    // 加载按钮
    loadButtons: function(){
        var fn = this.onButtonHandler.bind(this);
        var yesBtn = Util.buttonMaker("21dian/sureBtn1.png", "21dian/sureBtn2.png", "", fn)
            .to(this._bgSpr).p(570, 60);
        var noBtn = Util.buttonMaker("21dian/cancelBtn1.png", "21dian/cancelBtn2.png", "", fn)
            .to(this._bgSpr).p(130, 60);

        yesBtn.type = this.TYPE_YES;
        noBtn.type = this.TYPE_NO;

        GD.mainScene.setFocusSelected(noBtn);
        yesBtn.setNextFocus(null, null, noBtn, null);
        noBtn.setNextFocus(null, null, null, yesBtn);
    },



    /*
     * 逻辑处理
     * */
    // 点击按钮的处理函数
    onButtonHandler: function(btn) {
        GD.mainScene.setSelectPanal();
        this._callback && this._callback(btn.type);
    }
});