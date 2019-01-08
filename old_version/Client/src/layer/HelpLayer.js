/**
 * 帮助层
 * Created by BiteLu on 2016/12/9.
 */
var HelpLayer = cc.Layer.extend({
	_className: "HelpLayer",
	_classPath: "src/layer/HelpLayer.js",

    // 成员变量
    mainScene: null,

    // 构造函数
    ctor: function(mainScene){
        // 超类构造函数
        this._super();
        // 初始化自身
        this.initSelf(mainScene);
        // 加载背景
        this.loadBg();
        // 加载确定按钮
        this.loadSureButton();
        // 加载clippingNode
        this.loadClippingNode();
    },

    // 初始化自身
    initSelf: function(mainScene){
        this.mainScene = mainScene;
        this.setLocalZOrder(9);
        this.swallowTouch();
    },



    /*
    * 界面渲染
    * */
    // 加载背景
    loadBg: function(){
        var size = cc.winSize;
        var grayLayer = new cc.LayerColor(cc.color(0, 0, 0, 128)).to(this);
        var bg = new cc.Sprite("#21dian/helpBg.png").to(this).p(size.width * 0.5, size.height * 0.5);
    },

    // 加载确定按钮
    loadSureButton: function(){
        var size = cc.winSize;
        var btn = new FocusButton("21dian/okBtn1.png", "21dian/okBtn2.png", "", ccui.Widget.PLIST_TEXTURE)
            .to(this).p(size.width * 0.5, 120);
        // 添加点击处理函数
        btn.addClickEventListener(this.onButtonHandler.bind(this));
        GD.mainScene.setFocusSelected(btn);
    },

    // 加载clippingNode
    loadClippingNode: function(){
        var size = cc.winSize;
        var pos = cc.p(size.width * 0.5 + 30, size.height * 0.5);
        var list = new List({
            size: cc.size(1000, 415)
        }).to(this).p(pos).anchor(cc.p(0.5, 0.5));

        var ruleLab = new cc.LabelTTF(RuleTxt, GFontDef.fontName, GFontDef.fontSize, cc.size(950, 0));
        list.addItem(ruleLab);
        this.listView = list;
        // 由于这个listView的写法比较特殊 特殊处理 tv键盘
        var self = this;
        this.listView.tvOnScroll = function (code) {
            switch (code) {
                case cc.KEY.up:
                case cc.KEY.dpadUp:
                    self.listView.scrollToPercentVertical(0, 0.15, false);
                    break;
                case cc.KEY.down:
                case cc.KEY.dpadDown:
                    self.listView.scrollToPercentVertical(100, 0.15, false);
                    break;
            }
        }
    },



    /*
    * 逻辑处理
    * */
    // 点击按钮的处理函数
    onButtonHandler: function(btn){
        this.removeFromParent();
        GD.mainScene.helpLayer = null;
        GD.mainScene.setFocusSelected(GD.mainScene.uiLayer.helpBtn);
    }
});