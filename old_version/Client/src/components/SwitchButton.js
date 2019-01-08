/**
 * 开关按钮组件
 *
 * Created by BiteLu on 16/7/28.
 */
var SwitchButton = ccui.Button.extend({
	_className: "SwitchButton",
	_classPath: "src/components/SwitchButton.js",

    // 成员变量
    _imgNormal: "",
    _imgSelected: "",
    _imgDisable: "",
    _type: null,
    _callback: null,
    _isChanged: false,

    // 构造函数
    ctor: function(params){
        // 初始化成员变量
        this.initMembers(params);
        // 超类构造函数
        this._super(this._imgNormal, this._imgSelected, this._imgDisable, ccui.Widget.LOCAL_TEXTURE);
        // 添加点击事件监听函数
        this.addTouchEventListener(this.onClickHandler.bind(this));
    },

    // 初始化成员变量
    initMembers: function(params){
        this._imgNormal = params.imgNormal || "";
        this._imgSelected = params.imgSelected || this._imgNormal;
        this._imgDisable = params.imgDisable || "";
        this._type = params.type;
        this._callback = params.callback;
    },



    /*
    * 逻辑处理
    * */
    // 点击按钮的处理函数
    onClickHandler: function(sender, type){
        if(ccui.Widget.TOUCH_BEGAN == type)
        {
            this.setScale(1.1);
        }
        else if(ccui.Widget.TOUCH_ENDED == type)
        {
            this._isChange = !this._isChange;
            var imgShow = this._isChange ? this._imgSelected: this._imgNormal ;

            this.setScale(1.0);
            this.loadTextureNormal(imgShow);
            this._callback && this._callback(sender);
        }else if(ccui.Widget.TOUCH_CANCELED == type){
            this.setScale(1.0);
        }
    },

    // 获取按钮类型
    getType: function(){
        return this._type;
    },

    // 是否是选中状态
    isChange: function(){
        return this._isChange;
    }
 });