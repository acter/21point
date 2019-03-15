"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Connector = require("Connector");

var GD = require("GD");

var NetHelp = function () {
    function NetHelp() {
        _classCallCheck(this, NetHelp);

        this.connector = null;
        this.isConnect = false;
        this.isLogin = false;
        this.initialization();
    }
    /**
     * 初始化
     */


    _createClass(NetHelp, [{
        key: "initialization",
        value: function initialization() {
            //初始化网络链接
            this.connector = new Connector();
        }
    }, {
        key: "connect",
        value: function connect() {
            this.connector.connect(GD.serverURI);
        }

        // 断开连接

    }, {
        key: "disconnect",
        value: function disconnect() {
            this.connector.disconnect();
        }
    }, {
        key: "sendData",
        value: function sendData(event, data) {
            this.connector.emit(event, data);
        }
    }, {
        key: "sendGameMessage",
        value: function sendGameMessage(event, data) {
            console.log("game", event, data);
            this.connector.emit("game", event, data);
        }
    }, {
        key: "sendPlazaMessage",
        value: function sendPlazaMessage(event, data) {
            if (typeof data == "Object") {
                data = JSON.stringify(data);
            }
            this.connector.emit("plaza", event, data);
        }
    }, {
        key: "setLoginStatus",
        value: function setLoginStatus(isLogin) {
            this.isLogin = isLogin;
        }
    }, {
        key: "getLoginStatus",
        value: function getLoginStatus() {
            return this.isLogin;
        }

        /**
         * 心跳
         */

    }, {
        key: "pingServer",
        value: function pingServer() {}

        //认证

    }, {
        key: "auth",
        value: function auth(username, password) {
            var event = "login";
            var data = {
                username: username
            };
            this.sendData("plaza", {
                event: event, data: data
            });
        }
    }]);

    return NetHelp;
}();

;

module.exports = new NetHelp();
//# sourceMappingURL=NetHelp.js.map