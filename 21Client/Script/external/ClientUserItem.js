/*
 * 客户端用户文件类
 */
var define = require('define');
var gameCMD = define.gameCMD;
var gameConst = define.gameConst;

var ClientUserItem = cc.Class({

    properties: {

        userID: null,
        gameID: null,
        tableID: null,
        chairID: null,
        faceID: -1,
        nickname: null,
        sex: 0,
        score: 0,
        userStatus: gameConst.US_NULL,
        memberOrder: 0,
        otherInfo: null, //其它信息
        agreeDismiss: -1, //同意解散 -1 未投票， 0 不同意，1同意

    },

    ctor: function() {

    },

    init: function(userInfo) {
        this.userID = userInfo.userID;
        this.gameID = userInfo.gameID;
        this.tableID = userInfo.tableID;
        this.chairID = userInfo.chairID;
        this.faceID = userInfo.faceID;
        this.nickname = userInfo.nickname;
        this.sex = userInfo.sex;
        this.score = userInfo.score;
        this.userStatus = userInfo.userStatus;
        this.memberOrder = userInfo.memberOrder;
        this.otherInfo = userInfo.otherInfo; //其它信息
    },

    /*
     * 属性信息
     */

    //用户性别
    getGender: function() {
        return this.sex;
    },
    //用户ID
    getUserID: function() {
        return this.userID;
    },
    //游戏ID
    getGameID: function() {
        return this.gameID;
    },

    //头像ID
    getFaceID: function() {
        return this.faceID;
    },
    //用户昵称
    getNickname: function() {
        return this.nickname;
    },


    //用户桌子
    getTableID: function() {
        return this.tableID;
    },
    //用户椅子
    getChairID: function() {
        return this.chairID;
    },
    //用户状态
    getUserStatus: function() {
        return this.userStatus;
    },
    //积分信息
    getUserScore: function() {
        return this.score;
    },

    getMemberOrder: function() {
        return this.memberOrder;
    },
    //其它信息
    getOtherInfo: function() {
        return this.otherInfo;
    },

});