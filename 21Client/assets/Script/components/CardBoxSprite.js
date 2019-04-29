// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
var CardSprite = require('CardSprite')
var RANK_21 = require('Config').RANK_21
cc.Class({
    extends: cc.Component,

    properties: {
        Allsprite:{
            default:null,
            type:cc.SpriteAtlas
        }
    },

    onLoad:function(){
// 成员变量
        this.POINT_IN = cc.p(950, 650),
        this.POINT_OUT= cc.p(350, 650),
        this._rank = 0           // 卡牌点数
        this._rankLa =  null     // 点数标签
        this._rankBgSpr = null   // 点数背景
        this._cardData = {}     // 卡牌数据
        this._cards = []         // 存储卡牌
        this._arrowSpr = null    // 箭头精灵
        this._result = {}       //
        this._armature = null    // 骨骼动画

    },
// 构造函数
    loadInfo: function(){
        // 初始化成员变量
        this.initMembers();
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
        var rankBgSpr = this.node.getChildByName('21dian-rankTipBg1');
        rankBgSpr.active = false;
        var rankLab = rankBgSpr.getChildByName('card_num').getComponent(cc.Label)
        this._rankBgSpr = rankBgSpr;
        this._rankLab = rankLab;
    },

    // 加载箭头
    loadArrowSpr: function(){
        this._arrowSpr = this.node.getChildByName('21dian-arrowTip');
        // this._arrowSpr = new cc.Sprite("#21dian/arrowTip.png").to(this, 9).p(20, 70).hide();
        this._arrowSpr.active = false;
        var positionA = this._arrowSpr.getPosition()
        var positionB = this._arrowSpr.getPosition()
        positionB.y +=15;
        this._arrowSpr.runAction(cc.repeatForever(
            cc.sequence(
                cc.moveTo(0.5, positionB),
                cc.moveTo(0.5, positionA)
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
        var targetP = cc.p(targetArr.length * 25, 0);
        var cardScript = new CardSprite(cardData);
        var cardImg = cardScript._img;
        var cardSpr = this.addCardNode(cardImg);
        this.node.addChild(cardSpr)
        // 卡片移动
        this.cardMove(cardSpr, targetP, delayMove, 1.0, 360);
        targetArr.push(cardSpr);
        return cardSpr;
    },
    //增加一个牌的节点
    addCardNode:function(img){
        var node = new cc.Node(img)
        node.setScale(0.1);
        //调用新建的node的addComponent函数，会返回一个sprite的对象
        var CardSpr = node.addComponent(cc.Sprite)
        CardSpr.spriteFrame = this.Allsprite.getSpriteFrame(img);
        //把新的节点追加到self.node节点去。self.node，就是脚本挂载的节点
        return node;
    },
    //增加一个节点
    addDoubleTip:function (img) {
        var node = new cc.Node(img)

        //调用新建的node的addComponent函数，会返回一个sprite的对象
        var CardSpr = node.addComponent(cc.Sprite)
        CardSpr.spriteFrame = this.Allsprite.getSpriteFrame(img);
        //把新的节点追加到self.node节点去。self.node，就是脚本挂载的节点
        return node;
    },
    /*
    * 逻辑处理
    * */
    // 更新卡牌信息
    updateCards: function(data) {
        // data: {selfKey: ,userID: ,card: ,canDouble: ,canSplit: ,isDouble: ,curCards: ,score:}
        var cardSpr = this.cardMaker(data.card, 0.0);

        this.runAction(cc.sequence(
            cc.delayTime(0.6),
            cc.callFunc(function(){
                data.isDouble && cardSpr.addChild(this.addDoubleTip('21dian-doubleTip'));
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
        var img = "21dian-rankTipBg1";
        var ranks = result.ranks;
        var rankStr = ranks[0];
        var snd = "";

        if (result.isBlackJack) {
            visible = false;
            snd = "card_hjk.mp3";
        } else if (result.isFiveDragon) {
            visible = false;
            snd = "card_wxl.mp3";
            this._arrowSpr.active = false;
        } else if (result.isBust) {
            visible = true;
            rankStr = "爆牌";
            img = "21dian/bustTipBg.png";
            snd = "Bust.mp3";
            this._arrowSpr.active = false;
        } else {
            if (ranks.length > 1) {
                rankStr += "/" + ranks[1];
                img = "21dian-rankTipBg2";
            }
            snd = (ranks[0] == RANK_21 || ranks[1] == RANK_21) ? "21.mp3" : snd;
        }
        // 加载骨骼动画
        // this.loadArmature(result);
        this._rankLab &&  this.setRankStr(rankStr);
        this._rankBgSpr && this.setSprVisible(this._rankBgSpr,visible);
        this._rankBgSpr && this.setRankSprSprite(img);

        // var path = "res/21dian/sound/" + snd;
        //
        // if(snd != "")
        //     SoundEngine.playEffect(path);
    },
    //设置点数内容
    setRankStr:function(rankStr){
        this._rankLab.string = rankStr;
        this._rankBgSpr.active = true
    },
    //设置可见性
    setSprVisible:function (spr,visible) {
        spr.active = visible
    },
    // 设置箭头的可见性
    setArrowVisible: function(visible){
        this._arrowSpr.active = visible;
    },

    //更新点数的背景图
    setRankSprSprite:function(img){
        var spriteImg = this._rankBgSpr.getComponent(cc.Sprite);
        spriteImg.spriteFrame = this.Allsprite.getSpriteFrame(img);
    },
    // 更新箭头的位置
    updatePosition: function(){
        var index = this._cards.length - 1;
        var lastCardSpr = this._cards[index];
        var x = lastCardSpr.getPositionX();

        this._rankBgSpr.x = x + 12
        this._arrowSpr.x = x + 5;

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

    // 亮牌x
    showCard: function(data){
        var card = data.card;
        var cardSpr = this._cards.splice(1, 1)[0];

        cardSpr.runAction(cc.sequence(
            cc.scaleTo(0.25, 0, 1),
            cc.callFunc(function(){
                var p = cardSpr.getPosition();
                var newCardSpr = new CardSprite(card).to(this).p(p).qscale(0, 1);

                newCardSpr.runAction(cc.sequence(
                    cc.scaleTo(0.25, 1),
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



    blackJackJudge: function(cardSpr){
        cardSpr.runAction(cc.sequence(
            cc.delayTime(1.5),
            cc.moveBy(0.1, cc.p(0, 20)),
            cc.delayTime(1.0),
            cc.moveBy(0.1, cc.p(0, -20))
        ));
    },

    // 卡牌移走
    deleteSelf: function(){
        for (var i = this._cards.length - 1; i >= 0; i--) {
            var p = this.convertToNodeSpace(this.POINT_OUT);
            var cardSpr = this._cards.splice(i, 1)[0];

            cardSpr.loadTexture("21dian/pkp_bm.png", ccui.Widget.PLIST_TEXTURE);
            this.cardMove(cardSpr, p, 0, 0, 0);

            this.runAction(cc.sequence(
                cc.delayTime(1.0),
                cc.callFunc(function(){
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
        cardSpr.runAction(cc.sequence(
            cc.delayTime(delayMove),
            // cc.callFunc(function(){
            //     SoundEngine.playEffect("res/21dian/sound/DealPoker.mp3");
            // }.bind(this)),
            cc.spawn(
                cc.scaleTo(0.5, scale),
                cc.moveTo(0.5, targetP),
                cc.rotateBy(0.5, rotate)
            )
        ));
    },

    // 排列卡牌
    orderCards: function(){
        for (var i = 0, lenI = this._cards.length; i < lenI; i++) {
            var cardSpr = this._cards[i];
            var selfSize = this.node.getContentSize();
            var mult = lenI / 2 - 0.5;
            var intervalX = 28;

            var originX = selfSize.width * 0.5 - intervalX * mult;
            var p = cc.p(originX + i * intervalX, 0);

            cardSpr.setPosition(p);
        }
    },
    // update (dt) {},
});
