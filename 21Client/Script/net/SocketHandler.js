var SocketHandler = cc.Class({

    name: "SocketHandler",

    ctor: function() {},

	onConnect: function(data) {},

    onMsg: function(event, data) {

        if (this[event]) {
            this[event](event, data)
        } else {
            cc.error("未定义消息处理句柄:" + event)
        }
    },

})

module.exports = new SocketHandler()