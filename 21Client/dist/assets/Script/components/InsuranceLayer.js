"use strict";

cc.Class({
    extends: cc.Component,

    properties: {},

    // LIFE-CYCLE CALLBACKS:

    onLoad: function onLoad() {

        // 成员变量
        this._betNum = 0;
    },
    loadInfo: function loadInfo(callback, betNum) {
        this._betNum = betNum;
        // // 超类构造函数
        // this._super(callback);
        // 加载文字
        this.loadLabel();
    },
    /*
    * 界面渲染
    * */
    // 加载文字
    loadLabel: function loadLabel() {
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
    callback: function callback(btnType) {
        GD.gameEngine.sendInsuranceMessage(subGameMSG.TYPE_INSURANCE, { flag: btnType });
        this.removeFromParent();
    }

    // update (dt) {},
});
//# sourceMappingURL=InsuranceLayer.js.map