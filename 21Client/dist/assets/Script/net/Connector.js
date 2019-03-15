"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SocketIO = SocketIO || window.io;

var Connector = function () {
    function Connector() {
        _classCallCheck(this, Connector);

        this.sock = null;
        this.isConnecting = false;
        this.isConnect = false;
        this.activeDisConnect = false;
    }

    _createClass(Connector, [{
        key: "connect",
        value: function connect(uri) {
            this.serverURI = uri;
            this.sock = null;
            this.isConnecting = true;

            cc.log("正在连接中...", uri);
            this.sock = SocketIO.connect(uri, {
                reconnection: false
            });
            //链接事件
            this.sock.on("connect", this.onConnect.bind(this));
            this.sock.on("disconnect", this.onDisconnct.bind(this));
            this.sock.on("error", this.onError.bind(this));
            this.sock.on("msg", this.onMsg.bind(this));
        }
    }, {
        key: "onConnect",
        value: function onConnect(data) {
            cc.log("连接成功: " + this.serverURI);
            this.isConnect = true;
            this.isConnecting = false;
            onfire.fire("onConnect", data);
        }
    }, {
        key: "onDisconnct",
        value: function onDisconnct(data) {
            cc.log("断开连接----");
            this.isConnect = false;
            this.isConnecting = false;
            this.sock = null;
            onfire.fire("onDisconnct", data);
        }
    }, {
        key: "onError",
        value: function onError(data) {
            cc.log("onError----");
            this.isConnecting = false;
            this.isConnect = false;
            this.sock = null;
            onfire.fire("onError", data);
        }
    }, {
        key: "onMsg",
        value: function onMsg(eventName, data) {
            cc.log("onMsg----", eventName, data);
            onfire.fire(eventName, data);
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            this.sock && this.sock.close();
        }

        /**
         * 发送数据包
         * @param data
         */

    }, {
        key: "emit",
        value: function emit(route, eventName, data) {
            route = route || "plaza";
            eventName = eventName || "message";
            if (this.sock == null) return;

            console.error(eventName, data);
            this.sock.emit(route, eventName, data);
        }
    }]);

    return Connector;
}();

module.exports = Connector;
//# sourceMappingURL=Connector.js.map