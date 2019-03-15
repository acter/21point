var NetHelp = require("NetHelp")
var ClientKernel = require("ClientKernel")
var GD = require("GD")



cc.Class({
    extends: cc.Component,

    // use this for initialization
    onLoad: function() {

        this.enterRoomIng = false //
        GD.clientKernel = new ClientKernel()

        this.node_rooms = this.node.getChildByName("node_rooms")
        for (var i = 0; i < this.node_rooms.children.length; i++) {
            var btn_room = this.node_rooms.children[i]
            btn_room.on("touchend", this.onRoomBtnClick.bind(this, i)) //每个按钮注册事件
        }


        this.bindObj = []
        this.bindObj.push(onfire.on("onLogonSuccess", this.onLogonSuccess.bind(this)))

    },


    start() {

    },


    onDestroy() {
        for (var i = 0; i < this.bindObj.length; i++) {
            onfire.un(this.bindObj[i])
        }

    },


    onLogonSuccess(event,data) {
        cc.loader.onProgress = function(completedCount, totalCount, item) {
            var progress = (100 * completedCount / totalCount).toFixed(2);
            //cc.log(progress + '%');
            //这里显示loading进度
        }

        //预加载场景
        cc.director.preloadScene("game", function() {
            cc.director.loadScene("game");
            GD.clientKernel.onClientReady();
        });
    },


    onRoomBtnClick(roomID, event) {
        if (this.enterRoomIng) {
            return
        }
        this.enterRoomIng = true
        var btn_room = this.node_rooms.children[roomID]
        var anim_name = "Animation" + 2 * (roomID + 1)
        // var spine = btn_room.getComponentInChildren(sp.Skeleton)
        // spine.setAnimation(0, anim_name, false); //播放选择动画

        this.scheduleOnce(function() {
            this.enterRoom(roomID)
        }, 1);



    },


    enterRoom(roomID) {
        console.log("正在进入房间", roomID)
        this.enterRoom = false
        NetHelp.connect();

    },


});