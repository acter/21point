/**
 * Created by 黄二杰 on 2016/5/28.
 */

var MainScene = FocusScene.extend({
	_className: "MainScene",
	_classPath: "src/scene/MainScene.js",

    // 常量
    PLAYER_POINTS: [
        cc.p(1170, 290), cc.p(925, 220), cc.p(667, 200),
        cc.p(408, 220), cc.p(156, 300), cc.p(667, 430)
    ],
    // 成员变量
    gameEngine: null,              //游戏逻辑引擎
    clientKernel: null,
    exitLayer: null,
    startSpr: null,
    uiLayer: null,
    helpLayer: null,
    roomInfoLayer: null,
    insuranceLayer: null,
    players: [],
    roomIndex: 0,
    isGameStarted: false,
    gameResultLayer:null,

    // 构造函数
    ctor: function () {
        // 超类构造函数
        this._super();
        GD.mainScene = this;
        // 初始化成员变量
        this.initMembers();
        // 预加载资源
        this.preloadResource();
        // 加载背景
        this.loadBg();
        // 加载退出层
        this.loadExitLayer();
        // 加载开始提示
        this.loadStartTip();
        // 播放背景音乐
        SoundEngine.playBackgroundMusic("res/21dian/sound/Back.mp3", true);

        // TV的按键提示手指
        this.setSelectPanal();

        this.gameResultLayer = new HistoricRecordButtonLayer(3, cc.p(0.86,0.93)).to(this,100);
    },

    // 初始化成员变量
    initMembers: function(){
        // 初始化出6个空位置。五个玩家、一个庄家
        for (var i = 0, num = 6; i < num; i++) {
            this.players[i] = null;
        }
    },



    /*
    * 界面渲染
    * */
    // 加载背景
    loadBg: function(){
        var size = cc.winSize;
        var point = cc.p(size.width * 0.5, size.height * 0.5);
        var bg = new cc.Sprite("res/21dian/game/bg.png").to(this).p(point);
    },

    // 加载UI层
    loadUILayer: function(){
        if (this.uiLayer == null) {
            this.uiLayer = new UILayer(this).to(this);
        }
    },

    // 加载帮助层
    loadHelpLayer: function(){
        if (this.helpLayer)
            this.helpLayer.removeFromParent();
        this.helpLayer = new HelpLayer(this).to(this, 9);
    },

    // 加载房间信息层
    loadRoomInfoLayer: function(data){
        if (this.roomInfoLayer == null) {
            this.roomInfoLayer = new RoomInfoLayer(this, {
                roomIndex: this.roomIndex,
                left: 416,
            }).to(this);
        }
    },

    // 加载开始提示
    loadStartTip: function(){
        var size  = cc.winSize;
        var x = size.width * 0.5;
        var y = size.height * 0.6;
        
        this.startSpr = new cc.Sprite("#21dian/start.png").to(this, 1).p(-x, y);
    },

    // 加载退出层
    loadExitLayer: function(){
        this.exitLayer = new ExitLayer().to(this, 10);
        this.exitLayer.setBackToHallCallback(this.loadExitTipLayer.bind(this));
    },

    // 强制退出扣分提示
    loadExitTipLayer: function(){
        if (this.isGameStarted) {
            if (this.exitTipLayer)
                this.exitTipLayer.removeFromParent();
            this.exitTipLayer = new ExitTipLayer().to(this, 10);
        } else {
            app.closeSubGame();
        }
    },

    // 加载消息滚动层
    loadScrollLayer: function(){
        this.scrollLayer = new ScrollMsgLayer().to(this, 101);
    },



    /*
    * 逻辑处理
    * */
    // 场景还原
    showScene: function(data){
        // data: {playerData: ,dealID: ,isGameOver: ,cardLeftNum: ,
        // timeLeft: ,isWagering: ,roomIndex:}

        var myUserItem = GD.clientKernel.myUserItem;
        var isGameOver = data.isGameOver;
        var playerData = data.playerData;
        this.roomIndex = data.roomIndex;
        // 加载房间信息层
        this.loadRoomInfoLayer();
        // 加载UI层
        this.loadUILayer();

        for (var i = 0, len = playerData.length; i < len; i++) {
            var curData = playerData[i];
            var chairID = curData.chairID;
            var point = this.PLAYER_POINTS[chairID];
            var playerSpr = new PlayerSprite(curData).to(this, 1).p(point);

            // 提示玩家所在位置
            if (curData.userID == myUserItem.userID) {
                playerSpr.showTip();
            }

            if (!isGameOver) {
                // 间隔发牌
                this.delayDeal(playerSpr, curData, i, data.dealID);
                if (data.isWagering) {
                    playerSpr.showProgressTimer(data.leftTime);
                }
            }

            // this.players.push(playerSpr);
            this.players[chairID] = playerSpr;
        }

        // 更新卡牌数量
        this.roomInfoLayer && this.roomInfoLayer.updateCardNum(data.cardLeftNum);
    },

    // 其他玩家进场的处理函数
    onPlayerInHandler: function(data){
        var myUserItem = GD.clientKernel.myUserItem;
        if (myUserItem.userID == data.userID) return;

        var chairID = data.chairID;
        var point = this.PLAYER_POINTS[chairID];
        var playerSpr = new PlayerSprite(data).to(this).p(point);

        this.players[chairID] = playerSpr;
    },

    // 其他玩家退出房间的处理函数
    onPlayerOutHandler: function(data){
        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            if (player && player.getUserID() == data.userID) {
                player.removeFromParent();
                this.players[i] = null;
            }
        }
    },

    // 正在下注的处理函数
    onWageringHandler: function(data){
        if (data.leftTime >= 5) {
            // 开始提示精灵进场
            this.startSprIn();
        }
        // 重新设置玩家
        this.resetPlayer();
        // 显示下注层
        if (this.uiLayer == null) {
            this.loadUILayer();
        }
        this.uiLayer.showBetLayer(data, this.getMyPlayerScore());
        SoundEngine.playEffect("res/21dian/sound/Chip.mp3");
    },

    // 下注的处理函数
    onWagerHandler: function(data){
        var myUserItem = GD.clientKernel.myUserItem;
        var wagerP = this.findPlayerByID(data.userID);

        if (wagerP) {
            // 设置底注
            wagerP.setBaseBet(data.betNum);
            // 下注的处理函数
            wagerP.onWagerHandler(data);
        }

        if (data.userID == myUserItem.userID) {
            this.isGameStarted = true;
        }
    },

    // 发牌的处理函数
    onDealHandler: function(data){
        var count = 0;
        var allPlayerCurCards = data.allPlayerCurCards;
        this.hideProgressTimer();
        for (var j = 0, lenJ = this.players.length; j < lenJ; j++) {
            var playerSpr = this.players[j];
            if (playerSpr == null) continue;

            count++;
            for (var i = 0, lenI = allPlayerCurCards.length; i < lenI; i++) {
                var cardData = allPlayerCurCards[i];
                if (cardData.id == playerSpr.getUserID()) {
                    // 间隔发牌
                    this.delayDeal(playerSpr, cardData, count, data.dealID);
                    playerSpr.setIsPlaying(true);
                    break;
                }
            }
        }
        //
        this.roomInfoLayer.updateCardNum(data.cardLeftNum);
        // 隐藏下注层
        this.uiLayer.setBetLayerVisible(false);
    },

    // 下一个玩家行动
    onNextActionHandler: function(data){
        // data: {userID:, doneCount:, canSplit:, canDouble:}
        var myUserItem = GD.clientKernel.myUserItem;
        if (data.userID == myUserItem.userID) {
            this.uiLayer.showOperateLayer();
            this.uiLayer.setSplitAndDouble(data.canSplit, data.canDouble);
        }

        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            player && player.setHitTipVisible(data.selfKey, player.getUserID() == data.userID);
        }
    },

    // 要牌的处理函数
    onHitHandler: function(data){
        // data: {selfKey: ,userID: ,card: ,canDouble: ,canSplit: ,isDouble: ,curCards: ,score:}
        var myUserItem = GD.clientKernel.myUserItem;
        var result = data.curCards.result;
        var curPlayer = this.findPlayerByID(data.userID);
        curPlayer.onHitHandler(data, false);
        //
        this.roomInfoLayer.updateCardNum(data.cardLeftNum);
        if (myUserItem.userID == data.userID) {
            // 恢复操作按钮
            if (!data.isDouble && !result.isBust && !result.isFiveDragon) {
                this.uiLayer.setOperateButtonsOpacity(255);
                this.uiLayer.setSplitAndDouble(data.canSplit, data.canDouble);
            } else {
                this.uiLayer.setOperateLayerVisible(false);
            }
        }
    },

    // 停牌的处理函数
    onStandHandler: function(data){
        // data: {userID: ,curCards: ,}
        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            if (player && player.getUserID() == data.userID) {
                var myUserItem = GD.clientKernel.myUserItem;
                // 如果是自己停牌,则隐藏操作层
                if (myUserItem.userID == data.userID) {
                    this.uiLayer.setOperateLayerVisible(false);
                }
                // 只显示一个点数
                player.showOnlyRank(data.curCards);
                // 隐藏补牌的箭头
                player.setHitTipVisible(null, false);
                player.hideProgressTimer();
            }
        }
        SoundEngine.playEffect("res/21dian/sound/Hit.mp3");
    },

    // 停牌的处理函数
    onSplitHandler: function(data){
        // data: {userID: ,betNum: ,cardData: ,allCards: ,score: ,cardLeftNum:}
        var curPlayer = this.findPlayerByID(data.userID);
        curPlayer.onSplitHandler(data);
        curPlayer.showProgressTimer();
        this.roomInfoLayer.updateCardNum(data.cardLeftNum);
        SoundEngine.playEffect("res/21dian/sound/Split.mp3");
    },

    // 游戏结束的处理函数
    onGameOverHandler: function(data){
        // data: {dealID: ,betData: ,scores : ,dealCards:}
        var dealP = this.findPlayerByID(data.dealID);
        var betData = data.betData;
        var scores = data.scores;

        for (var chairID in betData) {
            var betNum = betData[chairID];
            var score = scores[chairID];
            var curPlayer = this.players[chairID];

            curPlayer && curPlayer.onGameOver(betNum, score);
        }
        this.isGameStarted = false;
        // 充值uiLayer的betNum
        this.uiLayer.setBetNumToZero();
        var resultD = data.dealCards.result;
        // 显示唯一的点数
        if (!resultD.isBust && !resultD.isFiveDragon && !resultD.isBlackJack) {
            dealP.showOnlyRank(data.dealCards);
        }
        // 隐藏补牌提示
        dealP.setHitTipVisible(null, false);
    },

    // 提示保险的处理函数
    onInsuranceHandler: function(data){
        var myUserItem = GD.clientKernel.myUserItem;
        var betNum = data.betNum;

        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            if (player == null) continue;

            var isPlaying = player.isPlaying();
            if (isPlaying && !player.isDealer()) {
                if (myUserItem.userID == player.getUserID()) {
                    this.insuranceLayer = new InsuranceLayer(
                        this.onCloseInsuranceLayer.bind(this), betNum
                    ).to(this, 2);
                }
                player.showProgressTimer();
            }
        }
    },

    // 买保险的处理函数
    onBuyInsuranceHandler: function(data){
        var curPlayer = this.findPlayerByID(data.userID);
        curPlayer.onBuyInsuranceHandler(data);
        SoundEngine.playEffect("res/21dian/sound/Insurance.mp3");
    },

    // 关闭强制退出提示
    onCloseInsuranceLayer: function(type){
        if (this.insuranceLayer) {
            if (type == this.insuranceLayer.TYPE_YES) {
                GD.gameEngine.sendInsuranceMessage(subGameMSG.TYPE_INSURANCE, {flag: type});
            }
            this.insuranceLayer.removeFromParent();
            this.insuranceLayer = null;
        }
    },

    // 延迟发牌
    delayDeal: function(playerSpr, curData, i, dealID){
        if (curData.cards) {
            setTimeout(function(){
                playerSpr.loadCardBoxes(curData.cards, dealID);
            }, 600 * i);
        }
    },

    // 不是黑杰克的处理函数
    onIsBlackJackHandler: function(data){
        var mul = data.flag ? 1.5 : -1;
        var insuranceData = data.insurances;

        for (var chairID in insuranceData) {
            var curPlayer = this.players[chairID];
            var insurance = insuranceData[chairID] * mul;

            curPlayer.onIsBlackJackHandler(insurance);
        }
        //
        this.onCloseInsuranceLayer(null);
    },

    // 庄家行动处理函数
    onDealTurnHandler: function(data){
        // data: {dealID: ,curCards: ,card: ,isShowCard:}
        var dealP = this.findPlayerByID(data.dealID);

        // 庄家亮牌
        if (data.isShowCard) {
            dealP.showCard(data);
            SoundEngine.playEffect("res/21dian/sound/DealPoker.mp3");
        } else {
            dealP.onHitHandler({
                doneCount: 0,
                selfKey: '00',
                userID: data.dealID,
                card: data.card,
                isDouble: false,
                curCards: data.curCards,
            }, true);
            //
            this.roomInfoLayer.updateCardNum(data.cardLeftNum);
        }
        // 隐藏操作层
        this.uiLayer.setOperateLayerVisible(false);
        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            if (player) {
                player.setHitTipVisible(false);
                player.hideProgressTimer();
            }
        }
        dealP.setHitTipVisible("00", true);
    },

    // 金币不足的处理函数
    onNotMoneyHandler: function(data){
        if (data.isOperate){
            this.uiLayer.showOperateLayer();
            this.uiLayer.setSplitAndDouble(this.uiLayer._canSplit, this.uiLayer._canDouble);
        }
        ToastSystemInstance.buildToast("身上金币不足");
        this.uiLayer.setBetNumToZero();
    },

    // 隐藏进度条
    hideProgressTimer: function(){
        for (var i = 0, lenI = this.players.length; i < lenI; i++) {
            var player = this.players[i];
            player && player.hideProgressTimer();
        }
    },

    // 重新设置玩家
    resetPlayer: function(){
        for (var i = 0, len = this.players.length; i < len; i++) {
            var player = this.players[i];
            if (player) {
                if (player == null) return;
                // 重置数据
                player.reset();
                // 不是庄家才显示数秒框
                !player.isDealer() && player.showProgressTimer();
            }
        }
    },

    // 开始提示精灵进场
    startSprIn: function(){
        if (this.startSpr == null) return;
        var size  = cc.winSize;
        var x = size.width * 0.5;
        var y = size.height * 0.6;

        this.startSpr.runAction(new cc.Sequence(
            new cc.EaseBackOut(new cc.MoveTo(0.5, cc.p(x, y)), 0.5),
            cc.delayTime(0.5),
            new cc.EaseBackIn(new cc.MoveTo(0.5, cc.p(2.5 * x, y)), 0.5),
            new cc.CallFunc(function(){
                this.startSpr.p(-x, y);
            }.bind(this))
        ));
    },



    // 根据ID获取玩家对象
    findPlayerByID: function(userID){
        for (var i = 0, len = this.players.length; i < len; i++) {
            var playerSpr = this.players[i];
            if (playerSpr && playerSpr.getUserID() == userID) {
                return playerSpr;
            }
        }

        return null;
    },

    getMyPlayerScore: function(){
        var myUserItem = GD.clientKernel.myUserItem;
        if (myUserItem) {
            var player = this.findPlayerByID(myUserItem.userID);
            return player.getCurScore();
        }
        return null
    },

    // 预加载资源
    preloadResource: function(){
        var src = ["BaoPai", "HeiJieKe", "RenWuSuoDing", "WuXiaoLong"];
        for (var key in res) {
            cc.spriteFrameCache.addSpriteFrames(res[key]);
        }

        // 开发用
        // cc.spriteFrameCache.addSpriteFrames("res/21dian/game/common981.plist");

        for(var i = 0, len = src.length; i < len; i++){
            var path = "res/21dian/animation/" + src[i] +  "/" +src[i] + ".ExportJson";
            ccs.armatureDataManager.addArmatureFileInfo(path);
        }
    }
});
