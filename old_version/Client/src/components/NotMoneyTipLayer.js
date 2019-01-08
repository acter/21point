/**
 * 金币不足提示层
 * Created by BiteLu on 16/8/2.
 */
var NotMoneyTipLayer = cc.Layer.extend({
	_className: "NotMoneyTipLayer",
	_classPath: "src/components/NotMoneyTipLayer.js",

    // 成员变量
    _count: 10,
    _fontColor: cc.color(217, 157, 25),
    _imgBg: "#21dian/gui-ts-box.png",
    _imgCloseNormal: "21dian/gui-ts-button-close.png",
    _imgCloseSelected: "21dian/gui-ts-button-close-dj.png",
    _imgSureNormal: "21dian/gui-ts-button-sure.png",
    _imgSureSelected: "21dian/gui-ts-button-sure-dj.png",
    _txtTip: "筹码不足，确定立即跳转充值吗？",
    _bg: null,
    _countLab: null,
    _callback: null,
    _hadClose: false,

    // 构造函数
    ctor: function(params){
        // 初始化成员变量
        this.initMembers(params);
        // 超类构造函数
        this._super();
        // 加载背景
        this.loadBg();
        // 加载关闭按钮
        this.loadCloseButton();
        // 加载确定按钮
        this.loadSureButton();
        // 加载提示标签
        this.loadTipLabel();
        // 加载倒计时标签
        this.loadCountLabel();
        // 开始计时
        this.startCount();
        // 吞噬点击
        this.swallowTouch();
    },

    // 初始化成员变量
    initMembers: function(params){
        this._count = params.count || this._count;
        this._fontColor = params.fontColor || this._fontColor;
        this._imgBg = params.imgBg || this._imgBg;
        this._imgCloseNormal = params.imgCloseNormal || this._imgCloseNormal;
        this._imgCloseSelected = params.imgCloseSelected || this._imgCloseSelected;
        this._imgSureNormal = params.imgSureNormal || this._imgSureNormal;
        this._imgSureSelected = params.imgSureSelected || this._imgSureSelected;
        this._txtTip = params.txtTip || this._txtTip;
        this._callback = params.callback;
    },



    /*
    * 界面渲染
    * */
    // 加载背景
    loadBg: function(){
        var size = cc.winSize;
        this._bg = new cc.Sprite(this._imgBg).to(this).p(size.width * 0.5, size.height * 0.5);
    },

    // 加载关闭按钮
    loadCloseButton: function(){
        var bgSize = this._bg.getContentSize();
        var closeBtn = new ccui.Button(this._imgCloseNormal, this._imgCloseSelected, "", ccui.Widget.PLIST_TEXTURE);
        var btnSize = closeBtn.getContentSize();

        closeBtn.to(this._bg).p(bgSize.width - btnSize.width * 0.5, bgSize.height - btnSize.height * 0.5);
        closeBtn.addClickEventListener(this.onCloseButtonHandler.bind(this));
    },

    // 加载确定按钮
    loadSureButton: function(){
        var sureBtn = new FocusButton(this._imgSureNormal, this._imgSureSelected, "", ccui.Widget.PLIST_TEXTURE)
            .to(this._bg).pp(0.5, 0.2);
        sureBtn.addClickEventListener(this.onSureButtonHandler.bind(this));
        GD.mainScene.setFocusSelected(sureBtn);
    },

    // 加载提示标签
    loadTipLabel: function(){
        var tipLab = new cc.LabelTTF(this._txtTip, GFontDef.fontName, 26).to(this._bg).pp(0.5, 0.7);
        tipLab.setFontFillColor(this._fontColor);
    },

    // 加载倒计时标签
    loadCountLabel: function(){
        var txt = this.countTxtMaker(this._count);
        this._countLab = new cc.LabelTTF(txt, GFontDef.fontName, 24).to(this._bg).pp(0.5, 0.45);
        this._countLab.setFontFillColor(this._fontColor);
    },



    /*
    * 逻辑处理
    * */
    startCount: function(){
        var count = 0;
        this.schedule(function(){
            count++;

            if(count >= this._count){
                this._closeSelf();
            }else{
                var txt = this.countTxtMaker(this._count - count);
                this._countLab.setString(txt);
            }
        }, 1, 10, 1);
    },

    // 点击关闭按钮处理函数
    onCloseButtonHandler: function(closeBtn){
        this._closeSelf();
    },

    // 点击确定按钮的处理函数
    onSureButtonHandler: function(sureBtn){
        this._closeSelf();
    },

    // 关闭界面
    _closeSelf: function(){
        if(!this._hadClose){
            this._hadClose = true;
            this._callback && this._callback();
            this.unscheduleAllCallbacks();
            this.removeFromParent();
            GD.mainScene.setSelectPanal();
        }
    },

    //
    countTxtMaker: function(num){
        return "（" + num + "秒后关闭页面）";
    }
});