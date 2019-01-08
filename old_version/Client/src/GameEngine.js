/**
 * Created by Administrator on 2015/7/3.
 */

//游戏逻辑引擎
var GameEngine = GameFrameEngine.extend({
	_className: "GameEngine",
	_classPath: "src/GameEngine.js",

    kickData: null,   //服务端发送的 KICK_TYPE 类型消息的暂存
    receivedSceneMessage: false,

    ctor: function () {
        this._super();

        this.initEx();
    },


    initEx: function () {

    },


    /**
     * 框架消息 太渣最终还是耦合了
     * @param data
     */
    onEventFrameMessage: function (subCMD, data) {
        this._super();

        if (!GD.mainScene && subCMD != gameCMD.SUB_GF_FORCE_CLOSE && subCMD != gameCMD.SUB_GF_REQUEST_FAILURE) {
            return true;
        }

        switch (subCMD) {
            case gameCMD.SUB_GF_ROOM_INFO:
                var gameName = data["gameName"];
                var roomName = data["roomName"];
                var tableID = data["tableID"] + 1;
                break;


            case gameCMD.SUB_GF_REQUEST_FAILURE:

                if (data.type == gameConst.KICK_TYPE) {
                    this.kickData = data;

                    this.onRequestFailure(this.kickData);
                } else {
                    this.onRequestFailure(data);
                }
                break;

            case gameCMD.SUB_GF_FORCE_CLOSE:            //强制关闭客户端
                this.closeWindow();
                break;


            case gameCMD.SUB_GF_TOAST_MSG:
                ToastSystemInstance.buildToast(data["message"]);
                break;
        }
        return true;
    },

    /**
     * 返回请求失败的弹出框， 如果是KICK_TYPE类型 （即分数不够服务端踢人的消息），则需要自行在游戏结束处理完后调用，this.onRequestFailure(this.kickData) 来弹出消息
     * @param data
     */
    onRequestFailure: function (data) {
        if (data == null) return;

        if (GD.mainScene && GD.mainScene.isRunning()) {
            app.buildMessageBoxLayer("通知", data["message"], 0, this.closeWindow.bind(this));
        }
        else {
            ToastSystemInstance.buildToast(data.message);
            cc.director.getRunningScene().runAction(cc.sequence(cc.delayTime(2), cc.callFunc(this.closeWindow.bind(this))));
        }
    },

    /**
     * 场景消息
     * @param gameStatus
     * @param data
     * @returns {boolean}
     */
    onEventSceneMessage: function (gameStatus, data) {
        this._super();

        //配置消息跟场景消息一起发下来
        //switch (gameStatus) {
        //    default :
        //        return true;
        //}

        cc.log("======onEventSceneMessage======");
        for (var key in data) {
            cc.log("====key, value", key, data[key]);
        }

        //可能你刚好请求场景消息时， 然后给换桌了， 结果服务端就发了两次场景消息？
        if (!GD.mainScene.isRunning()) {
            //加载完场景再显示出来
            cc.director.getRunningScene().runAction(cc.sequence(cc.delayTime(0.1), cc.callFunc(function () {
                cc.log("cc.director.runScene(GD.mainScene);");

                this.receivedSceneMessage = true;
                //cc.director.replaceScene(new cc.TransitionFadeBL(1, GD.mainScene));
                cc.director.runScene(GD.mainScene);
                GD.mainScene.showScene(data);
                GD.mainScene.release();         //因为前面有retain过， 所以要释放掉

            }.bind(this))));
        }

        return true;
    },
    /**
     * 游戏消息事件
     * @param subCMD 子游戏命令
     * @param data 数据
     * @returns {boolean}
     */
    onEventGameMessage: function (subCMD, data) {
        this._super();

        if (!GD.mainScene || !this.receivedSceneMessage) {
            return true;
        }

        cc.log("======华丽的分割线======", subCMD);
        for (var key in data) {
            cc.log("====key, value", key, data[key]);
        }

        switch (subCMD) {
            case subGameMSG.TYPE_WAGERING:
                this.onWageringHandler(data);
                break;

            case subGameMSG.TYPE_WAGER:
                this.onWagerHandler(data);
                break;

            case subGameMSG.TYPE_DEAL:
                this.onDealHandler(data);
                break;

            case subGameMSG.TYPE_NEXT_ACTION:
                this.onNextActionHandler(data);
                break;

            case subGameMSG.TYPE_HIT:
                this.onHitHandler(data);
                break;

            case subGameMSG.TYPE_STAND:
                this.onStandHandler(data);
                break;

            case subGameMSG.TYPE_BUST:
                this.onBustHandler(data);
                break;

            case subGameMSG.TYPE_SPLIT:
                this.onSplitHandler(data);
                break;

            case subGameMSG.TYPE_GAME_OVER:
                this.onGameOverHandler(data);
                break;

            case subGameMSG.TYPE_INSURANCE:
                this.onInsuranceHandler(data);
                break;

            case subGameMSG.TYPE_BUY_INSURANCE:
                this.onBuyInsuranceHandler(data);
                break;

            case subGameMSG.TYPE_IS_BLACK_JACK:
                this.onIsBlackJackHandler(data);
                break;

            case subGameMSG.TYPE_DEAL_TURN:
                this.onDealTurnHandler(data);
                break;

            case subGameMSG.NOT_ENOUGH_MONEY:
                this.onNotMoneyHandler(data);
                break;

            default :
                return true;
        }
    },

    // 正在下注的处理函数
    onWageringHandler: function(data){
        GD.mainScene.onWageringHandler(data);
    },

    // 下注的处理函数
    onWagerHandler: function(data){
        GD.mainScene.onWagerHandler(data);
    },

    // 发牌的处理函数
    onDealHandler: function(data){
        GD.mainScene.onDealHandler(data);
    },

    // 下一个玩家行动
    onNextActionHandler: function(data){
        GD.mainScene.onNextActionHandler(data);
    },

    // 要牌的处理函数
    onHitHandler: function(data){
        GD.mainScene.onHitHandler(data);
    },

    // 停牌的处理函数
    onStandHandler: function(data){
        GD.mainScene.onStandHandler(data);
    },

    // 爆牌的处理函数
    onBustHandler: function(data){

    },

    // 分牌的处理函数
    onSplitHandler: function(data){
        GD.mainScene.onSplitHandler(data);
    },

    // 游戏结束的处理函数
    onGameOverHandler: function(data){
        GD.mainScene.onGameOverHandler(data);
    },

    // 提示买保险的处理函数
    onInsuranceHandler: function(data){
        GD.mainScene.onInsuranceHandler(data);
    },

    // 买保险的处理函数
    onBuyInsuranceHandler: function(data){
        GD.mainScene.onBuyInsuranceHandler(data);
    },

    // 不是黑杰克的处理函数
    onIsBlackJackHandler: function(data){
        GD.mainScene.onIsBlackJackHandler(data);
    },

    // 庄家行动处理函数
    onDealTurnHandler: function(data){
        GD.mainScene.onDealTurnHandler(data);
    },

    // 金币不足的处理函数
    onNotMoneyHandler: function(data){
        GD.mainScene.onNotMoneyHandler(data);
    },

    // 发送下注信息
    sendWagerMessage: function(betNum){
        this.sendSocketData(subGameMSG.TYPE_WAGER, {
            baseBet: betNum
        });
    },

    // 发送操作命令
    sendOperateMessage: function(msg, data){
        this.sendSocketData(msg, data);
    },

    // 发送保险命令
    sendInsuranceMessage: function(msg, data){
        this.sendSocketData(msg, data);
    },

    /**
     * 玩家进入
     * @param userItem 玩家
     * @returns {boolean}
     */
    onEventUserEnter: function (userItem) {
        this._super(userItem);
        this.receivedSceneMessage && GD.mainScene.onPlayerInHandler(userItem);
        return true;
    },

    /**
     * 玩家离开
     * @param userItem 玩家
     * @returns {boolean}
     */
    onEventUserLeave: function (userItem) {
        this._super(userItem);
        GD.mainScene.onPlayerOutHandler(userItem);
        return true;
    },

    /**
     * 用户分数改变
     * @param userItem
     * @returns {boolean}
     */
    onEventUserScore: function (userItem) {
        this._super(userItem);


        return true;
    },

    /**
     * 用户状态改变
     * @param userItem
     * @returns {boolean}
     */
    onEventUserStatus: function (userItem) {
        this._super(userItem);


        return true;
    },

    /**
     * 自己先进入 switchViewID函数才有效
     * @param userItem
     * @returns {boolean}
     */
    onEventSelfEnter: function (userItem) {
        this._super(userItem);


        return true;
    },

    /**
     * 关闭窗口
     */
    closeWindow: function () {

        app.closeSubGame();
    },


    /**
     * 链接断开，只有链接成功后，断开才会触发
     */
    onEventDisconnect: function () {
        if(!this.kickData){
            var message = "与服务器连接断开,请关闭客户端!";
            app.buildMessageBoxLayer("通知", message, 0, this.closeWindow.bind(this));
        }

    }
});