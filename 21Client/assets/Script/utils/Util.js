/**
 * 辅助工具
 *
 * Created by BiteLu on 16/7/29.
 */
var Util = (function(){
    var unique;
    unique = new _Util();
    return unique;
})();

//私有构造方法
function _Util () {

}

var U = Util;

/**
 * 图片数字
 * @param img   图片资源
 * @param num   数字
 * @param w
 * @param h
 * @param removeSignal
 * @returns {string}
 */
U.numberMaker = function(img, num, w, h, removeSignal){
    var numSprs = [];
    var layout = new ccui.Layout().anchor(0.6, 0.5);

    var maker = function(num){
        var mod = num % 10;
        var numSpr = new cc.Sprite(img).to(layout);

        num = Math.floor(num * 0.1);
        numSpr.setTextureRect(cc.rect(mod * w, 0, w, h));
        numSprs.push(numSpr);

        if(num > 0) return maker(num);
    };

    // 递归构造所有数字
    maker(num);
    // 插入符号
    if(!removeSignal){
        var numSpr = new cc.Sprite(img).to(layout);

        numSpr.setTextureRect(cc.rect(10 * w, 0, w, h));
        numSprs.push(numSpr);
    }
    // 调整节点大小
    layout.setContentSize(cc.size(w * numSprs.length, 0));

    layout.numCount = numSprs.length;
    // 排列数字
    for(var i = 0; i < layout.numCount; i++){
        var spr = numSprs[i];
        spr.p(w * (layout.numCount - i), 0);
    }

    return layout;
};

/**
 * 根据配置构造数字
 * @param img
 * @param num
 * @param config
 * @param isEnglish
 * @param isInt
 * @returns {*}
 */
U.numberMakerWithConfig = function(img, num, config, isEnglish, isInt, isShort){
    var layout = new ccui.Layout().anchor(cc.p(0.5, 0.5));

    var numberTextMaker = function(num, isEnglish, isInt){
        var s = "";
        var base = 1;

        if (isEnglish) {
            if (num >= 1000000) {
                s = "M";
                base = 1000000;
            } else if (num >= 1000) {
                s = "K";
                base = 1000;
            }
        } else {
            if (num >= 100000000) {
                s = "亿";
                base = 100000000;
            } else if (num >= 10000) {
                s = "万";
                base = 10000;
            }
        }

        num = (num / base).toFixed(isInt ? 0 : 2);
        return num + s;
    };

    var numWidth = 0;
    var numText = isShort ? numberTextMaker(num, isEnglish, isInt) : "" + num;

    for (var i = 0, len = numText.length; i < len; i++) {
        var data = config[numText[i]];
        var numSpr = new cc.Sprite(img).to(layout).p(numWidth, 0);

        numWidth += data.width;
        numSpr.setTextureRect(cc.rect(data.x, 0, data.width, data.height));
    }

    layout.setContentSize(cc.size(numWidth, 0));

    return layout;
};

U.playAnimation = function(armatureName, animationName, durationTo, loop, delayTime){
    var armature = new ccs.Armature(armatureName);
    if (animationName && animationName != "") {
        armature.getAnimation().play(animationName, durationTo, loop);
    }

    if (delayTime && delayTime > 0) {
        (function(){
            setTimeout(function(){
                armature.removeFromParent();
            }, delayTime * 1000);
        })(armature);
    }

    return armature;
};

/**
 * 标签构造器
 * @param config
 */
U.labelMaker =  function(config){
    var text = config.text || "";
    var fontName = config.fontName || GFontDef.fontName;
    var fontSize = config.fontSize || GFontDef.fontSize;
    var fontColor = config.fontColor || cc.color(255, 255, 255);
    var point = config.point || cc.p(0, 0);
    var anchor = config.anchor || cc.p(0.5, 0.5);

    var lab = new cc.LabelTTF(text, fontName, fontSize).p(point);
    lab.setAnchorPoint(anchor);
    lab.setFontFillColor(fontColor);

    return lab;
};

U.buttonMaker = function(normalImg, selectedImg, disabledImg, handler){
    var btn = new FocusButton(normalImg, selectedImg, disabledImg, ccui.Widget.PLIST_TEXTURE);

    btn.addClickEventListener(handler);
    return btn;
};

/**
 * 动画构造器
 * @param imgPre    图片资源前缀
 * @param num       动画帧数
 * @param interval  动画播放间隔
 * @returns {*}
 */
U.animMaker = function(imgPre, num, interval, fillZero){
    var animFrames = [];

    // 采用循环获得plist里面的内容并存入数组
    for(var i = 1; i < num; i++){
        var str = imgPre + (fillZero && i < 10 ? "0" : "") + i +".png";
        animFrames.push(cc.spriteFrameCache.getSpriteFrame(str));
    }

    var animation = cc.Animation.create(animFrames, interval);

    return new cc.Animate(animation);
};

/**
 * 产生指定范围的随机数[min, max)
 * @param min           最小值
 * @param max           最大值
 * @param isInt         是否取整
 * @returns {number}    返回随机数
 */
U.randNum = function(min, max, isInt){
    min = min || 0;
    max = max || 0;
    var offset = max - min;
    var num = min + Math.random() * offset;

    return isInt ? Math.floor(num) : num;
};

/**
 * 拷贝数组
 * @param sourceArr     要拷贝的对象
 * @param targetArr     拷贝后的对象
 */
U.copyArray = function(sourceArr, targetArr){
    targetArr = targetArr || [];
    var iteration = function(sourceArr, copyArr){
        copyArr = copyArr || [];
        if (sourceArr instanceof Array) {
            for (var i = 0, len = sourceArr.length; i < len; i++) {
                var rowArr = sourceArr[i];
                if (rowArr instanceof Array) {
                    var copy = iteration(rowArr, []);
                    copyArr.push(copy);
                } else {
                    copyArr.push(rowArr);
                }
            }
        }

        return copyArr;
    };

    // 开始拷贝迭代
    return iteration(sourceArr, targetArr);
};

// 算牌。hard即硬牌,A只算1点。开始算牌时A先当做软牌(11点)算,爆牌了再按硬牌(1点)算
U.countCard = function(cards, hard, canBlackJack){
    var CARD_ACE = 1;           // 卡牌A
    var RANK_21 = 21;           // 21点
    var RANK_16 = 16;           // 16点

    var sum = 0;
    var isAce = false;      // 是否是A
    var isAceExist = false; // 是否有A存在
    var cardNum = cards.length;

    // 计算牌的点数
    for (var i = 0; i < cardNum; i++) {
        var cardRank = cards[i].num;
        isAce = cardRank == CARD_ACE;
        // 判断牌里面有没有A
        if (isAce && !isAceExist) isAceExist = !isAceExist && isAce;

        // 如果是A且算是软牌,则算11
        cardRank = (isAce && !hard) ? 11 : cardRank;
        // 点数超过10都算10点
        sum += (cardRank > 10 && !isAce) ? 10 : cardRank;
    }

    // A当做软牌(11点)时爆牌,才需要重新计算。
    if (sum > RANK_21 && isAceExist && !hard) {
        return this.countCard(cards, true, canBlackJack);
    }

    var isBust = sum > RANK_21; // 是否爆牌

    var isBlackJack = canBlackJack && cardNum == 2 &&
        ((cards[0].num == 1 && cards[1].num >= 10) || (cards[0].num >= 10 && cards[1].num == 1));

    var isFiveDragon = !isBust && cardNum >= 5;

    return {
        sum: sum,
        isBust: isBust,
        isBlackJack: isBlackJack,
        isFiveDragon: isFiveDragon
    };
};