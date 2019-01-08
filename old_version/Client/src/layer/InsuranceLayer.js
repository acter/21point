/**
 * 保险层
 * Created by BiteLu on 2016/12/30.
 */
var InsuranceLayer = BaseTipLayer.extend({
	_className: "InsuranceLayer",
	_classPath: "src/layer/InsuranceLayer.js",

    // 成员变量
    _betNum: 0,
    // 构造函数
    ctor: function(callback, betNum){
        this._betNum = betNum;
        // 超类构造函数
        this._super(callback);
        // 加载文字
        this.loadLabel();
    },



    /*
    * 界面渲染
    * */
    // 加载文字
    loadLabel: function(){
        var size = this._bgSpr.getContentSize();
        var txt = "是否购买保险?\n\n花费筹码" + this._betNum * 0.5;
        var lab = Util.labelMaker({
            text: txt,
            fontSize: 32
        }).to(this._bgSpr).p(size.width * 0.5, size.height * 0.5);
    },



    /*
    * 逻辑处理
    * */
    // 点击按钮的处理函数
    callback: function(btnType){
        GD.gameEngine.sendInsuranceMessage(subGameMSG.TYPE_INSURANCE, {flag: btnType});
        this.removeFromParent();
    }
});