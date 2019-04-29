var SocketIO = SocketIO || window.io;


class Connector {
    constructor() {
        this.sock = null
        this.isConnecting = false;
        this.isConnect = false
        this.activeDisConnect = false;
    }
    connect(uri) {
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

    onConnect(data) {
        cc.log("连接成功: " + this.serverURI);
        this.isConnect = true;
        this.isConnecting = false;
        onfire.fire("onConnect", data)
    }
    onDisconnct(data) {
        cc.log("断开连接----");
        this.isConnect = false;
        this.isConnecting = false;
        this.sock = null;
        onfire.fire("onDisconnct", data)
    }

    onError(data) {
        cc.log("onError----");
        this.isConnecting = false;
        this.isConnect = false;
        this.sock = null;
        onfire.fire("onError", data)
    }

    onMsg(eventName, data) {
        cc.log("onMsg----", eventName, data);
        onfire.fire(eventName, data)
    }

    disconnect() {
        this.sock && this.sock.close()
    }

    /**
     * 发送数据包
     * @param data
     */
    emit(route, eventName, data) {
        route = route || "plaza"
        eventName = eventName || "message";
        if (this.sock == null)
            return;

        console.error(eventName, data)
        this.sock.emit(route, eventName, data);
    }

}

module.exports = Connector