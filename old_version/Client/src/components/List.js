/**
 * 滚动列表组件
 *
 * Created by BiteLu on 16/7/29.
 */
var List = ccui.ListView.extend({
	_className: "List",
	_classPath: "src/components/List.js",

    // 定义成员变量
    _dir: null,
    _size: null,
    _selector: null,

    _list: null,

    // 构造函数
    ctor: function(params){
        // 初始化成员变量
        this.initMembers(params);
        // 超类构造函数
        this._super();
        // 初始化自身
        this.initSelf();
    },

    // 初始化成员变量
    initMembers: function(params){
        this._dir = params.dir || ccui.ScrollView.DIR_VERTICAL;
        this._size = params.size || cc.size(640, 960);
        this._selector = params.selector;
    },

    // 初始化自身
    initSelf: function(){
        this.setDirection(this._dir);
        this.setContentSize(this._size);
        this.setScrollBarEnabled(false);
        this.setTouchEnabled(true);
        this.setBounceEnabled(true);
        this.addEventListener(this.touchHandler, this);
    },



    /*
    * 点击处理
    * */
    // 点击时的处理函数
    touchHandler: function(sender, type){
        if(this._selector != null){
            this._selector(sender, type);
        }
    },



    /*
    * 逻辑处理
    * */
    // 添加项
    addItem: function(item, index){
        var size = item.getContentSize();
        var layout = new ccui.Layout();
        index = index == null ? this.getItems().length : index;
        layout.setContentSize(size);
        layout.setTouchEnabled(true);
        item.x = layout.width * 0.5;
        item.y = layout.height * 0.5;
        layout.addChild(item);

        this.insertCustomItem(layout, index);
    },

    getItemAt: function(index){
        var layout = this.getItem(index);
        var children = layout.getChildren();

        return children[0];
    },

    // 自定义滚动到底部函数
    scrollToBottomCustom: function(time, attenuated){
        this._startAutoScrollChildrenWithDestination(cc.p(this.getInnerContainer().getPositionX(), this.getInnerContainer().getContentSize().height), time, attenuated);
    }
});