/**
 * 卡牌精灵
 * Created by BiteLu on 2016/12/15.
 */
var CardSprite = ccui.ImageView.extend({
	_className: "CardSprite",
	_classPath: "src/sprite/CardSprite.js",

    // 成员变量
    _type: 0,
    _num: 0,
    _img: "",

    // 构造函数
    ctor: function(data){
        // 初始化变量
        this.initMembers(data);
        // 超类构造函数
        this._super(this._img, ccui.Widget.PLIST_TEXTURE);
    },

    // 初始化变量
    initMembers: function(data){
        var types = ["a", "b", "c", "d"];
        this._type = data.type;
        this._num = data.num;

        if (this._num == 0) {
            this._img = "21dian/pkp_bm.png";
        } else {
            this._img = "21dian/" + types[this._type] + "_" + this._num + ".png";
        }
    },

    // 获得卡牌花色
    getType: function(){
        return this._type;
    },

    // 获得卡牌数字
    getNum: function(){
        return this._num;
    }
});