/**
 * 玩家类
 * Created by BiteLu on 2016/12/9.
 */
var PlayerSprite = cc.Sprite.extend({
	_className: "PlayerSprite",
	_classPath: "src/sprite/PlayerSprite.js",

    // 常量
    POINT_IN: cc.p(950, 650),
    POINT_OUT: cc.p(350, 650),
    MAX_TIME: 10,   // 10秒倒计时

    // 成员变量
    _baseBet: 0,
    _betNum: 0,
    _data: null,
    _betNumSpr: null,
    _scoreLab: null,
    _buyInsuranceFlagSpr: null,
    _progressTimer: null,
    _cardBoxes: {},
    _betSprites: [],
    _insuranceBets: [],
    _isPlaying: false,

    // 构造函数
    ctor: function(data){
        // 初始化成员变量
        this.initMembers(data);
        // 超类构造函数
        this._super("#21dian/playerBg.png");
        if (data.type != PlayerTypes.TYPE_DEALER) {
            // 加载头像
            this.loadFace();
            // 加载玩家信息
            this.loadInfo();
            // 加载购买了保险的提示
            this.loadBuyInsuranceFlagSprite();
            // 加载时间进度条
            this.loadProgressTimer();
            // 加载筹码
            this.onWagerHandler(data);
        } else {
            this.setOpacity(0);
        }
    },

    // 初始化成员变量
    initMembers: function(data){
        this._data = data;
        this._betNum = 0;
        this._cardBoxes = {};
        this._betSprites = [];
    },



    /*
    * 界面渲染
    * */
    // 加载头像
    loadFace: function() {
        var img = "#res/common981/gui-icon-head-" + this._data.faceID + ".png";
        var faceSpr = new cc.Sprite(img).to(this).pp(0.5, 0.5).qscale(0.8);
        this.vipIcon = new cc.Sprite("#gui-vip-icon-0.png").to(this).pp(0.75, 0.2);
        this.vipIcon.num = new cc.Sprite("#gui-vip-num-0-hui.png").to(this.vipIcon).pp(0.5, 0.6);
        this.vipIcon.setScale(0.6);
    },

    // 加载玩家信息
    loadInfo: function(){
        var data = this._data;
        var nameLab = new cc.LabelTTF(data.nickname, GFontDef.fontName, GFontDef.fontSize).to(this).pp(0.5, 0.93);
        var scoreLab = new cc.LabelTTF(data.score, GFontDef.fontName, GFontDef.fontSize).to(this).pp(0.5, 0.06);

        this.setVIPLevel(data.memberOrder || 0);

        this._scoreLab = scoreLab;
    },

    setVIPLevel: function (level) {
        this.vipIcon.display("#gui-vip-icon-" + level + ".png");
        this.vipIcon.num.display("#gui-vip-num-" + level + ".png");
        if (level < 6) {
            this.vipIcon.pp(0.75, 0.23);
            this.vipIcon.num.pp(0.5, 0.6);
            if (level === 0) {
                this.vipIcon.num.display("#gui-vip-num-" + level + "-hui.png");
            }
        } else {
            this.vipIcon.pp(0.75, 0.25);
            this.vipIcon.num.pp(0.5, 0.4);
        }
    },

    // 加载筹码
    loadBet: function(betNum){
        if (betNum != 0) {
            // 移除下注的筹码精灵
            this.removeBetNumSpr();
            this._betNumSpr = Util.numberMakerWithConfig(
                "res/21dian/game/shuzi003.png", betNum, colorTextConfig, false, true, false
            ).to(this).pp(0.6, 1.1);
        } else {
            this.removeBetNumSpr();
        }
        this._betNum = betNum;
    },

    // 加载购买了保险的提示
    loadBuyInsuranceFlagSprite: function(){
        this._buyInsuranceFlagSpr = new cc.Sprite("#21dian/insuranceBuy.png")
            .to(this).p(65, 160).hide();
    },

    // 加载时间进度条
    loadProgressTimer: function(){
        var proTimer = new cc.ProgressTimer(new cc.Sprite("#21dian/ui_pk_bjdt.png"))
            .to(this).p(65, 86).hide();
        // 反向
        proTimer.setReverseDirection(true);
        // 扇形
        proTimer.setType(cc.ProgressTimer.TYPE_RADIAL);

        this._progressTimer = proTimer;
    },

    // 加载套牌
    loadCardBoxes: function(cardData, dealID){
        for (var i = 0, len = cardData.length; i < len; i++) {
            var selfSize = this.getContentSize();
            var p = cc.p(selfSize.width * 0.5, 330 + 60 * i);
            var data = cardData[i];
            var cardBoxSpr = new CardBoxSprite().to(this, 9 - i).p(p);
            var isDeal = dealID == this.getUserID();
            cardBoxSpr.loadCards(data, isDeal);
            this._cardBoxes[data.selfKey] = cardBoxSpr;
        }
    },



    /*
    * 逻辑处理
    * */
    // 下注的处理函数
    onWagerHandler: function(data, arr){
        var betNum = data.betNum;
        var score = data.score;
        arr = arr || this._betSprites;

        var iteration = function(betNum, arr){
            var left = 0;
            var intNum = 0;
            var base = 1;
            var bets = [10, 100, 1000, 10000, 100000, 1000000];

            for (var i = bets.length - 1; i >= 0; i--) {
                base = bets[i];
                if (betNum >= base) {
                    intNum = Math.floor(betNum / base);
                    left = betNum - intNum * base;
                    break;
                }
            }

            for (var j = 0; j < intNum; j++) {
                var img = "#21dian/coin_" + base + ".png";
                var betSpr = new cc.Sprite(img).to(this).p(65, 86).qscale(0.5);

                (function(betSpr, j){
                    var center = cc.p(65, 280);
                    var rad = Math.random() * 2 * Math.PI;
                    var x = center.x + 50 * Math.cos(rad) * Math.random();
                    var y = center.y + 50 * Math.sin(rad) * Math.random();
                    betSpr.runAction(new cc.Sequence(
                        new cc.DelayTime(0.2 * j),
                        new cc.CallFunc(function(){
                            SoundEngine.playEffect("res/21dian/sound/Bet.mp3");
                        }.bind(this)),
                        new cc.MoveTo(0.2, cc.p(x, y))
                    ));
                })(betSpr, j);

                arr.push(betSpr);
            }

            if (left > 10) return iteration(left, arr);
        }.bind(this);

        // 开始迭代下金币
        betNum && iteration(betNum - this._betNum, arr);
        // 更新筹码
        betNum && this.loadBet(betNum);
        // 更新分数
        this._scoreLab.setString("" + score);
    },

    // 要牌的处理函数
    onHitHandler: function(data, isDealer){
        // data: {selfKey: ,userID: ,card: ,canDouble: ,canSplit: ,isDouble: ,curCards: ,score:
        // cardLeftNum: ,baseBet: }
        var boxKey = data.selfKey;
        var result = data.curCards.result;
        var curCardBox = this._cardBoxes[boxKey];
        // 更新卡牌信息
        curCardBox.updateCards(data);

        // 加倍,要多下一份注
        if (data.isDouble) {
            this.setHitTipVisible(null, false);
            this.showOnlyRank(data.curCards);
            this.onWagerHandler({
                betNum: this._betNum + data.baseBet,
                score: data.score
            });
            this.hideProgressTimer();
        } else if (result.isBust && !isDealer) {
            // 庄家爆牌则不需要做这一步
            this.runAction(new cc.Sequence(
                new cc.DelayTime(0.5),
                new cc.CallFunc(function(){
                    var betNum = this._betNum - data.baseBet;
                    // 下注数更新
                    this.loadBet(betNum);
                    // 金币移动
                    this.coinMove(-data.baseBet);
                }.bind(this))
            ));
            this.hideProgressTimer();
        } else {
            this.showProgressTimer();
        }
    },

    // 分牌的处理函数
    onSplitHandler: function(data){
        // data: {userID: ,betNum: ,cardData: ,allCards: ,score: ,cardLeftNum:}
        // 重置数据
        this.reset();
        // 重新加载套牌
        this.loadCardBoxes(data.allCards);
        //
        this.onWagerHandler(data);
    },

    // 买保险的处理函数
    onBuyInsuranceHandler: function(data){
        this._insuranceBets = [];
        this.onWagerHandler({
            betNum: this._betNum + data.betNum,
            score: data.score
        }, this._insuranceBets);
        this._buyInsuranceFlagSpr.show();
    },

    // 是否是黑杰克的处理函数
    onIsBlackJackHandler: function(betNum){
        // 金币移动
        this.coinMove(betNum);
        // 更新筹码
        this.loadBet(this._betNum + betNum);
        // 移除保险筹码
        this.removeInsuranceBets();
        this._buyInsuranceFlagSpr.hide();
    },

    // 游戏结束的处理函数
    onGameOver: function(betNum, score){
        if (betNum != null) {
            // 金币移动
            this._betNumSpr && this.coinMove(betNum);
        }
        // 更新分数
        this._scoreLab.setString("" + score);
        // 移除保险筹码
        this.removeInsuranceBets();
        // 隐藏保险标志
        this._buyInsuranceFlagSpr.hide();
        // 移除下注的筹码精灵
        this.removeBetNumSpr();
    },

    // 显示进度条
    showProgressTimer: function(time){
        time = time || this.MAX_TIME;
        var percent = time / this.MAX_TIME * 100;
        var progress = new cc.ProgressFromTo(time, percent, 0);
        if (this._progressTimer) {
            this._progressTimer.show();
        } else {
            this.loadProgressTimer();
        }
        this._progressTimer.runAction(progress);
    },

    // 隐藏进度条
    hideProgressTimer: function(){
        this._progressTimer && this._progressTimer.hide();
    },

    // 金币移动
    coinMove: function(num){
        var img = num > 0 ? "#21dian/winCoinBg.png" : "#21dian/lostCoinBg.png";
        var numImg = num > 0 ? "res/21dian/game/shuzi003.png" : "res/21dian/game/shuzi004.png";
        var coinBgSpr = new cc.Sprite(img).to(this, 3).p(60, 180);
        var numSpr = Util.numberMakerWithConfig(
            numImg, num, colorTextConfig, false, true, false
        ).to(coinBgSpr).p(128.5, 28);

        coinBgSpr.setCascadeOpacityEnabled(true);
        coinBgSpr.runAction(new cc.Spawn(
            new cc.MoveBy(1.0, cc.p(0, 100)),
            new cc.Sequence(
                new cc.DelayTime(0.5),
                new cc.FadeOut(0.5),
                new cc.CallFunc(function(){
                    coinBgSpr.removeFromParent();
                }.bind(this))
            )
        ));
    },

    // 玩家位置提示
    showTip: function(){
        Util.playAnimation("RenWuSuoDing", "loop", null, 1, 2).to(this).p(65, 90);
    },

    // 显示唯一的点数
    showOnlyRank: function(curCards){
        var key = curCards.selfKey;
        var curBox = this._cardBoxes[key];
        
        curBox && curBox.showOnlyRank(curCards);
    },

    // 显示要牌的箭头提示
    setHitTipVisible: function(targetKey, visible){
        for (var key in this._cardBoxes) {
            this._cardBoxes[key].setArrowVisible(false);
        }

        if (visible) {
            this._cardBoxes[targetKey].setArrowVisible(visible);
            !this.isDealer() && this.showProgressTimer();
        }
    },

    // 亮牌
    showCard: function(data){
        this._cardBoxes['00'].showCard(data);
    },

    // 重新设置
    reset: function(){
        for (var key in this._cardBoxes) {
            var cardBox = this._cardBoxes[key];
            cardBox.deleteSelf();
            delete this._cardBoxes[key];
        }

        for (var j = this._betSprites.length - 1; j >= 0; j--) {
            var betSpr = this._betSprites.splice(j, 1)[0];
            betSpr.removeFromParent();
        }
        // 移除下注的筹码精灵
        this.removeBetNumSpr();
        this._betNum = 0;
        this._isPlaying = false;
        this._betSprites = [];
        this._cardBoxes = {};
    },

    // 设置底注
    setBaseBet: function(betNum){
        this._baseBet = betNum;
    },

    // 移除下注的筹码精灵
    removeBetNumSpr: function(){
        this._betNumSpr && this._betNumSpr.removeFromParent();
        this._betNumSpr = null;
    },

    // 移除保险筹码
    removeInsuranceBets: function(){
        for (var i = 0, lenI = this._insuranceBets.length; i < lenI; i++) {
            this._insuranceBets[i].removeFromParent();
        }
        this._insuranceBets = [];
    },

    // 获取用户ID
    getUserID: function(){
        return this._data.userID;
    },

    getCurScore: function(){
        return parseInt(this._scoreLab.getString());
    },

    // 是否是庄家
    isDealer: function(){
        return this._data.isDealer;
    },

    //
    setIsPlaying: function(flag){
        this._isPlaying = flag;
    },

    // 是否在游戏中
    isPlaying: function(){
        return this._isPlaying;
    }
});