'use strict';

var playerTypes = require('define').playerType;
cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function onLoad() {
        this.isReadyEnd = false;
        this.MAX_TIME = 10;
        this.baseBet = 0;
        this.betNum = 0;
        this.buyInsuranceFlagSpr = null;
        this.progressTimer = null;
        this.data = null;
        this.betNumSpr = null;
        this.cardBoxes = {};
        this.betSprites = [];
        this.insuranceBets = [];
        this.isPlaying = false;
        this.leftTime = 10;
        this.coinX = [];
        this.coinY = [];
        this.getCoinXY();
        this.initNodes();
        this.loadProgressTimer();
    },
    //加载用户数据
    loadInfo: function loadInfo(data, allSprites) {
        this.data = data;
        this.spriteFrames = allSprites;
        if (data.type != playerTypes.TYPE_DEALER) {
            // 加载头像
            this.loadFace();
            // 加载玩家信息
            this.loadPlayInfo();
            // 加载购买了保险的提示
            // this.loadBuyInsuranceFlagSprite();
            // 加载时间进度条
            this.loadProgressTimer();
            // 加载筹码
            this.onWagerHandler(data);
        } else {}
        // this.setOpacity(0);


        // this.userID = data.userID;
        // var nickname = data.nickname;
        // var faceID = data.faceID;
        // var score = data.score;
        //
        // this.loadName(nickname);
        // this.loadScore(score);
    },

    //加载节点
    initNodes: function initNodes() {
        this.playerBgNode = this.node.getChildByName('21dian-playerBg');
        this.headImgNode = this.playerBgNode.getChildByName('head-image');
        this.headImageNode = this.headImgNode.getChildByName('headimg');
        this.bet_numNode = this.playerBgNode.getChildByName('bet_num');
        this.player_nameNode = this.playerBgNode.getChildByName('player-name');
        this.goldNode = this.playerBgNode.getChildByName('gold');
        this.tipNode = this.node.getChildByName('tip');
    },

    // 加载头像
    loadFace: function loadFace() {
        this.playerBg = this.node.getChildByName('21dian-playerBg');
        this.headImg = this.playerBg.getChildByName('head-image');
        this.headImage = this.headImg.getChildByName('headimg');
        // this.headImage.getComponent(cc.Sprite).spriteFrame = this.spriteFrames.getSpriteFrame('21dian-playerBg')
    },

    //加载玩家信息
    loadPlayInfo: function loadPlayInfo() {
        this.player_nameNode.getComponent(cc.Label).string = this.data.nickname;
        this.goldNode.getComponent(cc.Label).string = this.data.score;
        this.playerBg.getComponent(cc.Sprite).spriteFrame = this.spriteFrames.getSpriteFrame('21dian-playerBg');
        // var self = this;
        // cc.loader.loadRes("game", cc.SpriteAtlas, function (err, atlas) {
        //     self.playerBg.getComponent(cc.Sprite).spriteFrame = atlas.getSpriteFrame('21dian-playerBg');
        // });
        this._scoreLab = this.data.score;
    },


    //提示位置
    showTip: function showTip() {
        this.tipNode.active = true;
        var action1 = cc.scaleTo(0.2, 1.2, 1.2);
        var action2 = cc.scaleTo(0.2, 1, 1);

        var finished = cc.callFunc(function () {
            this.tipNode.active = false;this.isShowTip = true;
        }, this);
        var action3 = cc.sequence(cc.sequence(action1, action2).repeat(5), finished);
        // var callFunc = cc.callFunc(this.playertip.active,false)
        this.tipNode.runAction(action3); // right
    },

    //获取金币的x和y的坐标范围
    getCoinXY: function getCoinXY() {
        for (var i = -35; i <= 35; i++) {
            this.coinX.push(i);
            this.coinY.push(i);
        }
    },

    // 加载时间进度条
    loadProgressTimer: function loadProgressTimer() {
        this.progress = this.playerBgNode.getChildByName('21dian-ui_pk_bjdt');
        this.progress.active = false;
        var proTimer = this.progress.getComponent(cc.Sprite);
        this.progressTimer = proTimer;
    },

    _jindutiaotime: function _jindutiaotime(time) {
        var self = this;
        if (time > 0) {
            this.scheduleOnce(function () {
                // cc.log(time)
                this.progressTimer.fillRange = time / (this.MAX_TIME * 1000);
                time = time - 10;
                self._jindutiaotime(time);
            }, 0.01);
        } else {
            this.progress.active = false;
            onfire.fire('readyEnd', this.hideProgressTimer.bind(this));
        }
    },
    // 显示进度条
    showProgressTimer: function showProgressTimer(time) {
        time = time || this.MAX_TIME;
        var percent = time / this.MAX_TIME * 100;
        if (this.progressTimer) {
            this.progress.active = true;
        } else {
            this.loadProgressTimer();
        }
        this.progressTimer.fillRange = percent;
        this._jindutiaotime(time);
    },

    // 隐藏进度条
    hideProgressTimer: function hideProgressTimer() {
        this.progressTimer && (this.progress.active = false);
    },


    // 初始化成员变量
    initMembers: function initMembers(data) {
        this.data = data;
        this.betNum = 0;
        this.cardBoxes = {};
        this.betSprites = [];
        // this.leftTime = data.leftTime;
    },


    // 其他玩家进场的处理函数
    onPlayerInHandler: function onPlayerInHandler(data) {
        var myUserItem = GD.clientKernel.myUserItem;
        if (myUserItem.userID == data.userID) return;

        var chairID = data.chairID;
        var point = this.PLAYER_POINTS[chairID];
        var playerSpr = new PlayerSprite(data).to(this).p(point);

        this.players[chairID] = playerSpr;
    },

    //玩家下注
    playerBet: function playerBet(bet_num, coin, spriteFrame) {

        var arr = [];
        //如果大于最大下注数,就停止下注
        var betNum = bet_num;

        this.score.getComponent(cc.Label).string = Number(this.score.getComponent(cc.Label).string) - Number(bet_num);
        this.betLabel = this.playerBg.getChildByName('bet_num');
        this.betLabel.active = true;
        this.betLabel.getComponent(cc.Label).string = Number(this.betLabel.getComponent(cc.Label).string) + Number(bet_num);

        //记录下注数
        this.betNum = Number(this.betLabel.getComponent(cc.Label).string);
        this.gold = this.node.getChildByName('gold');

        var CoinXY = this.coinX;
        // 获取随机数
        var randx = Math.floor(Math.random() * CoinXY.length);
        var randy = Math.floor(Math.random() * CoinXY.length);
        // 随机从数组中取出某值
        var coin_x = CoinXY.slice(randx, randx + 1)[0];
        var coin_y = CoinXY.slice(randy, randy + 1)[0];
        coin.parent = this.gold;
        coin.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        var seq = cc.moveTo(0.3, cc.p(coin_x, coin_y));
        //金币移动
        coin.runAction(seq);
        return;
    },

    //下注的金币处理函数
    onWagerHandler: function onWagerHandler(betNum, arr) {
        if (betNum == 0) return;
        var arrItem = [];
        var left = 0;
        var intNum = 0;
        var base;
        var bets = [10, 100, 1000, 10000, 100000, 1000000];

        for (var i = 0; i < bets.length; i++) {

            if (betNum == bets[i]) {
                base = bets[i];
                intNum = Math.floor(betNum / base);
                arrItem.push(base);
                arrItem.push(intNum);
                left = 0;
                break;
            }
            if (betNum > bets[i] && betNum < bets[i + 1]) {
                base = bets[i];
                intNum = Math.floor(betNum / base);
                left = betNum - intNum * base;
                arrItem.push(base);
                arrItem.push(intNum);
                break;
            }
        }
        if (arrItem.length > 0) arr.push(arrItem);

        if (left > 10) this.onWagerHandler(left, arr);
        return arr; //例:500下注 返回[[100,5]] 1300  [[1000,1],[100,3]]
    },
    reset: function reset() {
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
    isDealer: function isDealer() {
        return this.data.isDealer;
    },

    // 获取用户ID
    getUserID: function getUserID() {
        return this.data.userID;
    },

    getCurScore: function getCurScore() {
        return parseInt(this._scoreLab);
    }
});
//# sourceMappingURL=player.js.map