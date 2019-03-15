'use strict';

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function onLoad() {
        this.MAX_TIME = 10;
        this.baseBet = 0;
        this.betNum = 0;
        this.data = null;
        this.betNumSpr = null;
        this.buyInsuranceFlagSpr = null;
        this.progressTimer = null;
        this.cardBoxes = {};
        this.betSprites = [];
        this.insuranceBets = [];
        this.isPlaying = false;
        this.leftTime = 10;
        this.coinX = [];
        this.coinY = [];
        this.getCoinXY();
        // this.showTip()
        this.playerBg = this.node.getChildByName("21dian-playerBg");
        this.prossNode = this.playerBg.getChildByName('21dian-ui_pk_bjdt');
    },
    //加载用户数据
    loadInfo: function loadInfo(data) {
        this.data = data;
        this.userID = data.userID;
        var nickname = data.nickname;
        var faceID = data.faceID;
        var score = data.score;
        this.loadHead(faceID);
        this.loadName(nickname);
        this.loadScore(score);
    },

    //加载头像
    loadHead: function loadHead(img) {
        this.playerBg = this.node.getChildByName('21dian-playerBg');
        this.headImg = this.playerBg.getChildByName('head-image');
        this.headImage = this.headImg.getChildByName('headimg');
    },

    //加载昵称
    loadName: function loadName(name) {
        console.log('name', name);
        this.player_name = this.playerBg.getChildByName('player-name');
        this.player_name.getComponent(cc.Label).string = name;
    },

    //加载余额
    loadScore: function loadScore(score) {
        this.score = this.playerBg.getChildByName('gold');
        this.score.getComponent(cc.Label).string = score;
    },

    //提示位置
    showTip: function showTip() {

        this.playertip = this.node.getChildByName("tip");
        this.playertip.active = true;
        var action1 = cc.scaleTo(0.2, 1.2, 1.2);
        var action2 = cc.scaleTo(0.2, 1, 1);

        var finished = cc.callFunc(function () {
            this.playertip.active = false;this.isShowTip = true;
        }, this);
        var action3 = cc.sequence(cc.sequence(action1, action2).repeat(5), finished);
        // var callFunc = cc.callFunc(this.playertip.active,false)
        this.playertip.runAction(action3); // right
    },

    //获取金币的x和y的坐标范围
    getCoinXY: function getCoinXY() {
        for (var i = -35; i <= 35; i++) {
            this.coinX.push(i);
            this.coinY.push(i);
        }
    },

    //

    // 初始化成员变量
    initMembers: function initMembers(data) {
        this.data = data;
        this.betNum = 0;
        this.cardBoxes = {};
        this.betSprites = [];
        // this.leftTime = data.leftTime;
    },

    update: function update(dt) {

        this.leftTime -= dt;
        var precent = this.leftTime / this.MAX_TIME;

        var temp = this.prossNode.getComponent(cc.Sprite);
        if (this.leftTime <= 0) {
            temp.fillRange = 0;
            return;
        }

        temp.fillRange = precent;
    },
    onWagerHandler: function onWagerHandler(bet_num, coin) {
        if (this.betNum < 20000000) {
            //如果大于最大下注数,就停止下注
            var betNum = bet_num;
            this.score.getComponent(cc.Label).string -= bet_num;
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
            var coinsp = coin.getComponent(cc.Sprite).sp;
            coinsp.s;
            coin.runAction(cc.moveTo(0.3, cc.p(coin_x, coin_y)));
            return;
        } else {
            return;
        }

        // var betNum = data.betNum;
        // var score = data.score;
        // arr = arr || this._betSprites;
        //
        // var iteration = function(betNum, arr){
        //     var left = 0;
        //     var intNum = 0;
        //     var base = 1;
        //     var bets = [10, 100, 1000, 10000, 100000, 1000000];
        //
        //     for (var i = bets.length - 1; i >= 0; i--) {
        //         base = bets[i];
        //         if (betNum >= base) {
        //             intNum = Math.floor(betNum / base);
        //             left = betNum - intNum * base;
        //             break;
        //         }
        //     }
        //
        //     for (var j = 0; j < intNum; j++) {
        //         var img = "#21dian/coin_" + base + ".png";
        //         var betSpr = new cc.Sprite(img).to(this).p(65, 86).qscale(0.5);
        //
        //         (function(betSpr, j){
        //             var center = cc.p(65, 280);
        //             var rad = Math.random() * 2 * Math.PI;
        //             var x = center.x + 50 * Math.cos(rad) * Math.random();
        //             var y = center.y + 50 * Math.sin(rad) * Math.random();
        //             betSpr.runAction(new cc.Sequence(
        //                 new cc.DelayTime(0.2 * j),
        //                 new cc.CallFunc(function(){
        //                     SoundEngine.playEffect("res/21dian/sound/Bet.mp3");
        //                 }.bind(this)),
        //                 new cc.MoveTo(0.2, cc.p(x, y))
        //             ));
        //         })(betSpr, j);
        //
        //         arr.push(betSpr);
        //     }
        //
        //     if (left > 10) return iteration(left, arr);
        // }.bind(this);
        //
        // // 开始迭代下金币
        // betNum && iteration(betNum - this._betNum, arr);
        // // 更新筹码
        // betNum && this.loadBet(betNum);
        // // 更新分数
        // this._scoreLab.setString("" + score);
    }
});
//# sourceMappingURL=player.js.map