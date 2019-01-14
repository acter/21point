var logger = require('log4js').getLogger();
var gameconfig = require('./gameconfig');

let gSocketID = 1
var socketMap = {}
var socktGroup = {}
var socktGroup = {}
var serverMap = {}

var exp = {}


exp.addSocket = function(namespace, socket) {
    gSocketID++
    socketMap[gSocketID] = socket
    logger.info("新连接", gSocketID, socket.id)
    socket.namespace = namespace //标识：gate，server等等
    if (!socktGroup.hasOwnProperty(namespace)) {
        socktGroup[namespace] = {}
    }
    socktGroup[namespace][gSocketID] = gSocketID

    return gSocketID
};

exp.authOK = function(sid, socketID) {
    var socket = socketMap[socketID]
    if (socket) {
        serverMap[sid] = socketID
        socket.sid = sid
    }
};


exp.delSocket = function(socketID) {
    var socket = socketMap[socketID]
    if (socket) {
        var namespace = socket.namespace
        delete socktGroup[namespace][socketID]
        delete socketMap[socketID]
    }


};


//发送消息给一组(//标识：gate，server等等 )
exp.serverMsg2Group = function(namespace, eventName, data) {
    var list = Object.values(socktGroup[namespace] || {})
    logger.info("serverMsg2Group", list)
    if (list) {
        for (var i = 0; i < list.length; i++) {
            var gate = list[i]
            var socket = socketMap[gate]
            if (socket) {
                logger.info("serverMsg2Group", gate, data)
                socket.emit(eventName, data)
            }
        }
    }
};

//发送服务器列表消息
exp.serverInfo = function(gate, data) {
    var socket = socketMap[gate]
    if (socket) {
        socket.emit("serverinfo", data)
    }
};

//发送消息
exp.serverMsg = function(gate, eventName, session, data) {
    var socket = socketMap[gate]
    if (socket) {
        socket.emit("serverMsg", eventName, session, data)
    }
};

//发送消息
exp.clientMsg = function(gate, eventName, session, data) {
    var socket = socketMap[gate]
    if (socket) {
        socket.emit("clientMsg", eventName, session, data)
    }
};
exp.tellUser = function(userItem, eventName, data) {
    var  single = false

    var socketID = 0
    if (sid != null) { //从gate过来的
        var sid = userItem.session.sid
        socketID = serverMap[sid]
        if (!socketID) {

            return
        }
    } else {
        socketID = userItem.session.socketID
        single = true
    }

    var socket = socketMap[socketID]
    if (socket) {
        
        if (single) {
            socket.emit("msg", eventName,  data)
        }
        else{
            socket.emit("clientMsg", eventName, userItem.session, data)
        }
    }
};


//获取ip
exp.getIP = function(socketID) {
    var socket = socketMap[socketID]
    var ip = "0.0.0.0"
    if (socket) {
        ip = socket.handshake.address.substr(7); //房间真实ip
    }
    return ip
};



module.exports = exp;