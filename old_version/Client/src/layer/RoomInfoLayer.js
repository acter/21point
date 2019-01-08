/**
 * 房间信息精灵
 * Created by BiteLu on 2016/12/19.
 */
var RoomInfoLayer = cc.Layer.extend({
	_className: "RoomInfoLayer",
	_classPath: "src/layer/RoomInfoLayer.js",

    _mainScene: null,
    _cardNumLab: null,
    _roomIndex: 0,
    _data: null,
    _cardLeftNum: 0,

    // 构造函数
    ctor: function(mainScene, data){
        // 超类构造函数
        this._super();
        // 初始化成员变量
        this.initMembers(mainScene, data);
        // 加载牌盒
        this.loadBoxes();
        // 加载房间信息
        this.loadInfo();
    },

    // 初始化成员变量
    initMembers: function(mainScene, data){
        this._data = data;
        this._mainScene = mainScene;
        this._roomIndex = data.roomIndex;
        this._cardLeftNum = 0;
    },



    /*
    * 界面渲染
    * */
    // 加载牌盒
    loadBoxes: function(){
        var boxLeft = new cc.Sprite("#21dian/boxLeft.png").to(this).p(240, 740);
        var boxRight = new cc.Sprite("#21dian/boxRight.png").to(this).p(1080, 750);
    },

    // 加载房间信息
    loadInfo: function(){
        new cc.Sprite("#21dian/21d_diban_shenyu.png").to(this).p(470, 720);
        new cc.Sprite("#21dian/21d_diban_zuidaxiazhu.png").to(this).p(870, 720);

        var max = ["2000", "20万", "500万", "2000万"];

        Util.labelMaker({
            text: "最大下注数:",
            point: cc.p(430, 720)
        }).to(this);

        Util.labelMaker({
            text: max[this._roomIndex],
            point: cc.p(490, 720),
            anchor: cc.p(0.0, 0.5),
            fontColor: cc.color(255, 255, 131)
        }).to(this);

        this._cardNumLab = Util.labelMaker({
            text: "416/416",
            point: cc.p(910, 720),
            anchor: cc.p(1.0, 0.5),
        }).to(this);
    },



    /*
    * 逻辑处理
    * */
    // 更新卡牌张数
    updateCardNum: function(cardNum){
        var txt = cardNum + "/416";
        this._cardNumLab.setString(txt);
    }
});