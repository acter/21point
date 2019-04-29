"use strict";

cc.Class({
    extends: cc.Component,
    properties: {},
    onLoad: function onLoad() {},

    loadInfo: function loadInfo(data) {
        var max = ["2000", "20万", "500万", "2000万"];
        this.leftNum = cc.find('21dian-21d_diban_shengyu/shengyu', this.node).getComponent(cc.Label);
        var maxBet = cc.find('21dian-21d_diban_zuidaxiazhu/xiazhu-num', this.node).getComponent(cc.Label);
        this.leftNum.string = data.left + "/416";
        maxBet.string = max[data.roomIndex];
    },


    /*
    * 逻辑处理
    * */
    // 更新卡牌张数
    updateCardNum: function updateCardNum(cardNum) {
        var txt = cardNum + "/416";
        this.leftNum.string = txt;
    }
});
//# sourceMappingURL=roominfo.js.map