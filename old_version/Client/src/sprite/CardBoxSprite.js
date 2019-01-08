/**
 * 卡牌组合
 * Created by BiteLu on 2016/12/23.
 */
var CardBoxSprite = cc.Sprite.extend({
	_className: "CardBoxSprite",
	_classPath: "src/sprite/CardBoxSprite.js",

    // 常量
    POINT_IN: cc.p(950, 650),
    POINT_OUT: cc.p(350, 650),

    // 成员变量
    _rank: 0,           // 卡牌点数
    _rankLab: null,     // 点数标签
    _rankBgSpr: null,   // 点数背景
    _cardData: {},      // 卡牌数据
    _cards: [],         // 存储卡牌
    _arrowSpr: null,    // 箭头精灵
    _result: {},        //
    _armature: null,    // 骨骼动画

    // 构造函数
    ctor: function(){
        // 初始化成员变量
        this.initMembers();
        // 超类构造函数
        this._super();
        // 加载点数标签
        this.loadRankLabel();
        // 加载箭头
        this.loadArrowSpr();
    },

    // 初始化成员变量
    initMembers: function(){
        this._cardData = {};
        this._result = {};
        this._cards = [];
    },



    /*
    * 界面渲染
    * */
    // 加载卡牌
    loadCards: function(cardData, isDeal){
        this._cardData = cardData;
        var baseCards = cardData.baseCards;
        var result = cardData.result;

        for (var i = 0, len = baseCards.length; i < len; i++) {
            var cardData = baseCards[i];
            var cardSpr = this.cardMaker(cardData, 0.25 * i);

            if (i == len - 1) {
                if (baseCards[0].num >= 10 && isDeal) {
                    this.blackJackJudge(cardSpr);
                }
                
                setTimeout(function(){
                    this.orderCards();
                    // 更新点数等内容
                    this.updateContents(result);
                    // 调整点数标签的位置
                    this.updatePosition();
                }.bind(this), 250 * i + 900);
            }
        }
    },

    // 加载点数标签
    loadRankLabel: function(){
        var rankBgSpr = new ccui.ImageView("21dian/rankTipBg1.png", ccui.Widget.PLIST_TEXTURE)
            .to(this, 1).p(30, 45).hide().anchor(0.0, 0.5);
        var rankLab = Util.labelMaker({
            text: "" + this._rank
        }).to(rankBgSpr).p(34, 36);

        this._rankBgSpr = rankBgSpr;
        this._rankLab = rankLab;
    },

    // 加载箭头
    loadArrowSpr: function(){
        this._arrowSpr = new cc.Sprite("#21dian/arrowTip.png").to(this, 9).p(20, 70).hide();
        this._arrowSpr.runAction(new cc.RepeatForever(
            new cc.Sequence(
                new cc.MoveBy(0.5, cc.p(0, -15)),
                new cc.MoveBy(0.5, cc.p(0, 15))
            )
        ));
    },

    // 加载骨骼动画
    loadArmature: function(result){
        var scale = 1.0;
        var p = cc.p(0, -40);
        var armatureName = "";  // BaoPai, WuXiaoLong, HeiJieKe
        var animationName = "loop";
        var loop = 1;

        if (result.isBlackJack) {
            scale = 1.0;
            armatureName = "HeiJieKe";
        } else if (result.isFiveDragon) {
            scale = 0.5;
            armatureName = "WuXiaoLong";
        } else if (result.isBust) {
            loop = -1;
            p = cc.p(0, 0);
            armatureName = "BaoPai";
            animationName = "play";
        }

        // 播放牌型提示动画
        if (armatureName) {
            this._armature = Util.playAnimation(armatureName, animationName, null, loop, 0)
                .to(this).p(p).qscale(scale);
        }
    },

    // 卡牌构造器
    cardMaker: function(cardData, delayMove){
        var targetArr = this._cards;
        var p = this.convertToNodeSpace(this.POINT_IN);
        var targetP = cc.p(targetArr.length * 25, 0);
        var cardSpr = new CardSprite(cardData).to(this).p(p);

        cardSpr.setScale(0.1);
        // 卡片移动
        this.cardMove(cardSpr, targetP, delayMove, 1.0, 360);
        targetArr.push(cardSpr);

        return cardSpr;
    },



    /*
    * 逻辑处理
    * */
    // 更新卡牌信息
    updateCards: function(data) {
        // data: {selfKey: ,userID: ,card: ,canDouble: ,canSplit: ,isDouble: ,curCards: ,score:}
        var cardSpr = this.cardMaker(data.card, 0.0);

        this.runAction(new cc.Sequence(
            new cc.DelayTime(0.6),
            new cc.CallFunc(function(){
                data.isDouble && new cc.Sprite("#21dian/doubleTip.png").to(cardSpr).p(25, 45);
                // 更新点数等内容
                this.updateContents(data.curCards.result);
                // 排列卡牌
                this.orderCards();
                // 调整点数标签的位置
                this.updatePosition();
            }.bind(this))
        ));
        this._result = data.result;
    },

    // 更新点数等内容
    updateContents: function(result){
        var visible = true;
        var img = "21dian/rankTipBg1.png";
        var ranks = result.ranks;
        var rankStr = ranks[0];
        var snd = "";

        if (result.isBlackJack) {
            visible = false;
            snd = "card_hjk.mp3";
        } else if (result.isFiveDragon) {
            visible = false;
            snd = "card_wxl.mp3";
            this._arrowSpr.hide();
        } else if (result.isBust) {
            visible = true;
            rankStr = "爆牌";
            img = "21dian/bustTipBg.png";
            snd = "Bust.mp3";
            this._arrowSpr.hide();
        } else {
            if (ranks.length > 1) {
                rankStr += "/" + ranks[1];
                img = "21dian/rankTipBg2.png";
            }
            snd = (ranks[0] == RANK_21 || ranks[1] == RANK_21) ? "21.mp3" : snd;
        }
        // 加载骨骼动画
        this.loadArmature(result);
        this._rankLab && this._rankLab.setString(rankStr);
        this._rankBgSpr && this._rankBgSpr.setVisible(visible);
        this._rankBgSpr && this._rankBgSpr.loadTexture(img, ccui.Widget.PLIST_TEXTURE);

        var path = "res/21dian/sound/" + snd;

        if(snd != "")
            SoundEngine.playEffect(path);
    },

    // 更新箭头的位置
    updatePosition: function(){
        var size = this._rankBgSpr.getContentSize();
        var index = this._cards.length - 1;
        var lastCardSpr = this._cards[index];
        var x = lastCardSpr.getPositionX();

        this._rankLab.setPositionX(size.width * 0.5);
        this._rankBgSpr.setPositionX(x + 12);
        this._arrowSpr.setPositionX(x + 5);
    },

    // 显示唯一的点数
    showOnlyRank: function(curCards){
        var result = curCards.result;
        // 只有有两个点数的才需要最终显示一个点数
        if (result.ranks.length >= 2) {
            result.ranks = [result.ranks[0]];
            // 更新内容
            this.updateContents(result);
            // 更新位置
            this.updatePosition();
        }
    },

    // 亮牌
    showCard: function(data){
        var card = data.card;
        var cardSpr = this._cards.splice(1, 1)[0];

        cardSpr.runAction(new cc.Sequence(
            new cc.ScaleTo(0.25, 0, 1),
            new cc.CallFunc(function(){
                var p = cardSpr.getPosition();
                var newCardSpr = new CardSprite(card).to(this).p(p).qscale(0, 1);

                newCardSpr.runAction(new cc.Sequence(
                    new cc.ScaleTo(0.25, 1),
                    cc.callFunc(function(){
                        // 更新点数等内容
                        this.updateContents(data.curCards.result);
                        // 排列卡牌
                        this.orderCards();
                        // 调整点数标签的位置
                        this.updatePosition();
                    }.bind(this))
                ));

                cardSpr.removeFromParent();
                this._cards.push(newCardSpr);

            }.bind(this))
        ));
    },

    // 设置箭头的可见性
    setArrowVisible: function(visible){
        this._arrowSpr.setVisible(visible);
    },

    blackJackJudge: function(cardSpr){
        cardSpr.runAction(new cc.Sequence(
            new cc.DelayTime(1.5),
            new cc.MoveBy(0.1, cc.p(0, 20)),
            new cc.DelayTime(1.0),
            new cc.MoveBy(0.1, cc.p(0, -20))
        ));
    },

    // 卡牌移走
    deleteSelf: function(){
        for (var i = this._cards.length - 1; i >= 0; i--) {
            var p = this.convertToNodeSpace(this.POINT_OUT);
            var cardSpr = this._cards.splice(i, 1)[0];

            cardSpr.loadTexture("21dian/pkp_bm.png", ccui.Widget.PLIST_TEXTURE);
            this.cardMove(cardSpr, p, 0, 0, 0);

            this.runAction(new cc.Sequence(
                new cc.DelayTime(1.0),
                new cc.CallFunc(function(){
                    this.removeFromParent();
                }.bind(this))
            ))
        }
        this._armature && this._armature.removeFromParent();
        this._rankBgSpr && this._rankBgSpr.removeFromParent();
        this._arrowSpr && this._arrowSpr.removeFromParent();
    },

    // 卡牌移动.
    cardMove: function(cardSpr, targetP, delayMove, scale, rotate){
        cardSpr.runAction(new cc.Sequence(
            new cc.DelayTime(delayMove),
            new cc.CallFunc(function(){
                SoundEngine.playEffect("res/21dian/sound/DealPoker.mp3");
            }.bind(this)),
            new cc.Spawn(
                new cc.ScaleTo(0.5, scale),
                new cc.MoveTo(0.5, targetP),
                new cc.RotateBy(0.5, rotate)
            )
        ));
    },

    // 排列卡牌
    orderCards: function(){
        for (var i = 0, lenI = this._cards.length; i < lenI; i++) {
            var cardSpr = this._cards[i];
            var selfSize = this.getContentSize();
            var mult = lenI / 2 - 0.5;
            var intervalX = 28;

            var originX = selfSize.width * 0.5 - intervalX * mult;
            var p = cc.p(originX + i * intervalX, 0);

            cardSpr.setPosition(p);
        }
    },
});