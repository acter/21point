var playerTypes = require('define').playerType;
var Util = require('Util');
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        this.isReadyEnd = false;
        this.MAX_TIME = 10;
        this._baseBet = 0;
        this.betNum = 0;
        this.spriteFrames = null;//游戏所需的图片资源
        this.buyInsuranceFlagSpr = null;
        this.progressTimer = null;
        this.betNumSpr = null;
        this._cardBoxes = {};
        this._betSprites = [];
        this.insuranceBets = [];
        this.isPlaying = false;
        this.initNodes();
        this.loadProgressTimer()

    },
    //加载用户数据
    loadInfo(data,allSprites){
        this.initMembers(data)
        this.spriteFrames = allSprites;
        if (data.type != playerTypes.TYPE_DEALER) {
            // 加载头像
            this.loadFace();
            // 加载玩家信息
            this.loadPlayInfo()
            // 加载购买了保险的提示
            this.loadBuyInsuranceFlagSprite();
            // 加载时间进度条
            this.loadProgressTimer();
            // 加载筹码
            this.onWagerHandler(data);
        } else {
            this.playerBgNode.opacity = 0;
        }
    },
    //加载节点
    initNodes(){
        this.playerBgNode =  this.node.getChildByName('21dian-playerBg');
        this.headImgNode =  this.playerBgNode.getChildByName('head-image');
        this.headImageNode = this.headImgNode.getChildByName('headimg');
        this.bet_numNode = this.playerBgNode.getChildByName('bet_num');
        this.player_nameNode = this.playerBgNode.getChildByName('player-name');
        this.goldNode =  this.playerBgNode.getChildByName('gold');
        this.cardNode = this.node.getChildByName('card');
        this.coinNode = this.node.getChildByName('gold')
        this.tipNode = this.node.getChildByName('tip');
        this._buyInsuranceFlagSpr = this.playerBgNode.getChildByName('21dian-insuranceBuy');
    },
    // 加载头像
    loadFace() {
        this.playerBg = this.node.getChildByName('21dian-playerBg');
        this.headImg =  this.playerBg.getChildByName('head-image');
        this.headImage = this.headImg.getChildByName('headimg');
         // this.headImage.getComponent(cc.Sprite).spriteFrame = this.spriteFrames.getSpriteFrame('21dian-playerBg')
    },
    //加载玩家信息
    loadPlayInfo(){
        this.player_nameNode.getComponent(cc.Label).string = this._data.nickname;
        this.goldNode.getComponent(cc.Label).string = this._data.score;
        this.playerBg.getComponent(cc.Sprite).spriteFrame = this.spriteFrames.getSpriteFrame('21dian-playerBg');
        // var self = this;
        // cc.loader.loadRes("game", cc.SpriteAtlas, function (err, atlas) {
        //     self.playerBg.getComponent(cc.Sprite).spriteFrame = atlas.getSpriteFrame('21dian-playerBg');
        // });
        this._scoreLab = this.goldNode.getComponent(cc.Label);
    },

    //提示位置
    showTip(){
        this.tipNode.active = true;
        var action1 = cc.scaleTo(0.2, 1.2, 1.2);
        var  action2= cc.scaleTo(0.2, 1, 1);

        var finished = cc.callFunc(function () {
            this.tipNode.active = false; this.isShowTip = true;
        }, this)
        var action3 = cc.sequence(cc.sequence(action1, action2).repeat(5),finished)
        // var callFunc = cc.callFunc(this.playertip.active,false)
        this.tipNode.runAction(action3);// right

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

    // 加载时间进度条
    loadProgressTimer(){
        this.progress = this.playerBgNode.getChildByName('21dian-ui_pk_bjdt');
        this.progress.active = false;
        var proTimer = this.progress.getComponent(cc.Sprite)
        this.progressTimer = proTimer;
    },
    _jindutiaotime:function(time){
        var self = this
        if(time > 0){
            this.scheduleOnce(function() {
                // cc.log(time)
                this.progressTimer.fillRange = time / (this.MAX_TIME * 1000);
                time =  time - 10;
                self._jindutiaotime(time)
            }, 0.01);
        }
        else {
            this.progress.active = false
            onfire.fire('readyEnd',this.hideProgressTimer.bind(this));
        }
    },
// 显示进度条
    showProgressTimer(time){
        time = time || this.MAX_TIME;
        var percent = time / this.MAX_TIME * 100;
        if (this.progressTimer) {
            this.progress.active = true;
        } else {
            this.loadProgressTimer();
        }
        this.progressTimer.fillRange = percent;
        this._jindutiaotime(time)
    },
    // 隐藏进度条
    hideProgressTimer(){
        this.progressTimer && (this.progress.active = false);
    },
// 加载购买了保险的提示
    loadBuyInsuranceFlagSprite: function(){
        this._buyInsuranceFlagSpr.active = false;
    },
    // 初始化成员变量
    initMembers: function(data){
        this._data = data;
        this._betNum = 0;
        this._cardBoxes = {};
        this._betSprites = [];
    },
    // 设置底注
    setBaseBet: function(betNum){
        this._baseBet = betNum;
    },
    // 其他玩家进场的处理函数
    onPlayerInHandler(data){
        var myUserItem = GD.clientKernel.myUserItem;
        if (myUserItem.userID == data.userID) return;

        var chairID = data.chairID;
        var point = this.PLAYER_POINTS[chairID];
        var playerSpr = new PlayerSprite(data).to(this).p(point);

        this.players[chairID] = playerSpr;
    },
    // 下注的处理函数
    onWagerHandler: function(data, arr){
        var betNum = data.betNum;
        var score = data.score;
        arr = arr || this._betSprites;
        var self = this;
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
                    //创建一个新的节点，因为cc.Sprite是组件不能直接挂载到节点上，只能添加到为节点的一个组件
                    var node = new cc.Node('21dian-coin_'+base)
                    node.setScale(0.5,0.5);
                    //调用新建的node的addComponent函数，会返回一个sprite的对象
                    var betSpr = node.addComponent(cc.Sprite)

                    betSpr.spriteFrame = self.spriteFrames._spriteFrames['21dian-coin_'+base]
                    //把新的节点追加到self.node节点去。self.node，就是脚本挂载的节点
                    this.coinNode.addChild(node);
                    node.setPosition(0,-200);
                    (function(node, j){
                        var center = cc.p(0, 0);
                        var rad = Math.random() * 2 * Math.PI;
                        var x = center.x + 50 * Math.cos(rad) * Math.random();
                        var y = center.y + 50 * Math.sin(rad) * Math.random();
                        node.runAction(cc.sequence(
                            cc.delayTime(0.2 * j),
                            cc.moveTo(0.2, cc.p(x, y))
                        ));
                    })(node, j);

                    arr.push(node);
                }

            if (left > 10) return iteration(left, arr);
        }.bind(this);

        // 开始迭代下金币
        betNum && iteration(betNum - this._betNum, arr);
        // 更新筹码
        betNum && this.loadBet(betNum);
        // 更新分数
        this.setUserScore(score)
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
            curCardBox.runAction(cc.sequence(
                cc.delayTime(0.5),
                cc.callFunc(function(){
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
        this._buyInsuranceFlagSpr.active = true;
    },
    // 金币移动
    coinMove: function(num){
        var img = num > 0 ? "21dian-winCoinBg" : "21dian-lostCoinBg";
        var numImg = num > 0 ? "shuzi003" : "shuzi004";
        var coinNode = this.node.getChildByName('21dian-winCoinBg')
        var coinBgSpr = coinNode.getComponent(cc.Sprite);
        coinBgSpr.spriteFrame = this.spriteFrames.getSpriteFrame(img)
      //替换的label节点的字体
        var coinNum = coinNode.getChildByName('winGold')
//字体资源
        cc.loader.loadRes("game/"+numImg, cc.BitmapFont, function (err, bitmapFont) {
            coinNum.getComponent(cc.Label).font = bitmapFont;
        });
        coinNum.getComponent(cc.Label).string = Util.numberTran(num)
        // coinNum.getComponent(cc.Label).font =
        //节点的不透明度值是否影响其子节点
        coinNode.setCascadeOpacityEnabled(true);
        coinNode.runAction(cc.spawn(
            cc.moveBy(1.0, cc.p(0, 100)),
            cc.sequence(
                cc.delayTime(0.5),
                cc.fadeOut(0.5),
                cc.callFunc(function(){
                    coinNode.active = 0;
                }.bind(this))
            )
        ));
    },
    // 加载筹码
    loadBet: function(betNum){
        if (betNum != 0) {
            this.bet_numNode.active = true;
            this.bet_numNode.getComponent(cc.Label).string = Util.numberTran(betNum)
        } else {
            this.bet_numNode.active = false;
        }
        this._betNum = betNum;
    },
    // 加载套牌
    loadCardBoxes: function(cardData, dealID){
        for (var i = 0, len = cardData.length; i < len; i++) {
            var data = cardData[i];
            var cardBoxSpr = this.cardNode.getComponent('CardBoxSprite');
            cardBoxSpr.loadInfo();
            var isDeal = dealID == this.getUserID();
            cardBoxSpr.loadCards(data, isDeal);
            this._cardBoxes[data.selfKey] = cardBoxSpr;
        }
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
    // 移除保险筹码
    removeInsuranceBets: function(){
        for (var i = 0, lenI = this._insuranceBets.length; i < lenI; i++) {
            this._insuranceBets[i].removeFromParent();
        }
        this._insuranceBets = [];
    },
    //重置
    reset:function(){
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
    // 是否是庄家
    isDealer(){
        return this._data.isDealer;
    },
    // 获取用户ID
    getUserID(){
        return this._data.userID;
    },
    getCurScore: function(){
        return parseInt(this._scoreLab.string);
    },
    //更改玩家分数
    setUserScore(score){

        this._scoreLab.string = score;
        return
    },
    //设置玩家是否在玩状态
    setIsPlaying: function(flag){
        this._isPlaying = flag;
    },
});