/**
 * Created by Apple on 2016/7/5.
 */

var ParentScene = typeof MPBaseRoomScene == "undefined" ? cc.Scene : MPBaseRoomScene;
var RoomScene = ParentScene.extend({
	_className: "RoomScene",
	_classPath: "src/scene/RoomScene.js",


    moduleID: null,
    roomInfoArray: null,

    listView: null,

    bgSprite: null,

    /**
     * 构造函数
     * @param moduleID  游戏模块ID
     * @param roomInfoArray 房间信息数组 已经按照房间ID排序好了
     */
    ctor: function (moduleID, roomInfoArray) {
        this._super(moduleID, roomInfoArray);

        this.roomInfoArray = roomInfoArray;
        this.moduleID = moduleID;

        this.size(V.w, V.h);
        this.loadBg();
        this.initEx();
    },

    // 加载背景
    loadBg: function(){
        // var spr = new cc.Sprite("res/21dian/game/box.png").to(this).pp(0.5, 0.5);
        // new cc.Sprite("res/21dian/game/chooseBg.png").to(this, -1).pp(0.5, 0.5);
        this.bgSprite = new cc.Sprite("res/21dian/room/bg1.png").to(this).pp();
        new cc.Sprite("res/21dian/room/bg2.png").to(this).pp();
    },

    initEx: function () {
        var minScores = {
            '69': 0, '70': 1000, '71': 10000, '72': 100000,
        };
        // this.bgSprite = new cc.Sprite("res/effect/ROOM-BG.jpg").to(this).pp();
        this.listView = new FocusListView().to(this).anchor(0.5, 0.5).pp(0.5, 0.46);


        this.listView.setDirection(ccui.ScrollView.DIR_HORIZONTAL);
        this.listView.setTouchEnabled(true);
        this.listView.setBounceEnabled(true);
        this.listView.setClippingEnabled(true);
        this.listView.setContentSize(980, 500);
        this.listView.setItemsMargin(10);
        // this.listView.addEventListener(this.onRoomEvent.bind(this));

        var minScore = ["无限制","入场:1000","入场:1万","入场:10万"];
        for (var i = 0; i < this.roomInfoArray.length; i++) {
            var info = this.roomInfoArray[i];
            var widget = new FocusWidget().size(240, 408);
            var img = "res/21dian/room/roomitem_" + i + ".png";
            new cc.Sprite(img).to(widget).pp();
            new ccui.Text(minScore[i], "res/font/fzcy_s.TTF", 20).to(widget).pp(0.49,0.22);

            this.listView.pushBackCustomItem(widget);
            widget.roomInfo = this.roomInfoArray[i];

            widget.setTouchEnabled(true);
            widget.addTouchEventListener(this.touchEventListener);
        }

        // this.qscale(0.5);
    },

    //进入时每次都设置一下分辨率
    onEnter: function () {
        this._super();
        if (typeof mpApp != "undefined") {
            mpApp.switchScreen(native.SCREEN_ORIENTATION_LANDSCAPE, cc.size(V.w, V.h), cc.ResolutionPolicy.SHOW_ALL);
        }
        else {
            cc.view.setFrameSize(V.w, V.h);
            cc.view.setDesignResolutionSize(V.w, V.h, cc.ResolutionPolicy.SHOW_ALL);
        }
    },

    touchEventListener: function (sender, type) {

        if (type == ccui.Widget.TOUCH_BEGAN) {
            sender.setScale(1.05);
        }
        else if (type == ccui.Widget.TOUCH_ENDED) {

            if (typeof mpEvent != "undefined") {
                cc.eventManager.dispatchCustomEvent(mpEvent.EnterGameRoom, sender.roomInfo);
            }
            sender.setScale(1.0);
        }
        else if (type == ccui.Widget.TOUCH_CANCELED) {
            sender.setScale(1.0);
        }

    },

    buildItem: function (index) {
        var roomArmature = new ccs.Armature("fangjianxuanzhe_buyu");
        roomArmature.getAnimation().play("Animation" + index);
        roomArmature.size(200, 400);

        return roomArmature;
    }

});