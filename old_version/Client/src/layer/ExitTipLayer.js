/**
 * 退出扣分提示
 * Created by BiteLu on 2017/1/12.
 */
var ExitTipLayer = BaseTipLayer.extend({
	_className: "ExitTipLayer",
	_classPath: "src/layer/ExitTipLayer.js",

    // 构造函数
    ctor: function(){
        // 超类构造函数
        this._super(this.callback.bind(this));
        // 加载文字
        this.loadLabel();
    },



    /*
     * 界面渲染
     * */
    // 加载文字
    loadLabel: function(){
        var size = this._bgSpr.getContentSize();
        var txt = "现在退出游戏不会返还已下注的筹码,\n是否强制退出?";
        var lab = Util.labelMaker({
            text: txt,
            fontSize: 32
        }).to(this._bgSpr).p(size.width * 0.5, size.height * 0.5);
        lab.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
    },



    /*
     * 逻辑处理
     * */
    // 点击按钮的处理函数
    callback: function(type){
        this.removeFromParent();
        GD.mainScene.exitTipLayer = null;
        GD.mainScene.setSelectPanal();
        if (type == this.TYPE_YES) {
            app.closeSubGame();
        }
    }
});