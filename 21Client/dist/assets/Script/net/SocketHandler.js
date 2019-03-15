"use strict";

var SocketHandler = cc.Class({

    name: "SocketHandler",

    ctor: function ctor() {},

    onConnect: function onConnect(data) {},

    onMsg: function onMsg(event, data) {

        if (this[event]) {
            this[event](event, data);
        } else {
            cc.error("未定义消息处理句柄:" + event);
        }
    }

});

module.exports = new SocketHandler();
//# sourceMappingURL=SocketHandler.js.map