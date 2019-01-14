/**
 * Created by BiteLu on 2016/10/28.
 */
var Util = function(){

};
var p = Util.prototype;

/**
 * 根据权重初始化targetData的各项概率
 * @param targetData 目标数据
 */
p.initItemRate = function(targetData){
    var copy = [];
    for (var i = 0, len = targetData.length; i < len; i++) {
        copy.push(targetData[i].weight);
    }

    // 求最大公约数、最小公倍数
    var numData = this.commonDivAndMul(copy, 2, 1);
    var minCommonMul = numData.minCommonMul;

    // 求权重总和
    var sum = 0;
    for (var i = 0, len = targetData.length; i < len; i++) {
        sum += minCommonMul / targetData[i].weight;
    }

    // 根据权重初始化每个物品的概率
    for (var i = 0, len = targetData.length; i < len; i++) {
        targetData[i].rate = (minCommonMul / targetData[i].weight) / sum;
    }
    // console.log(targetData);
};

/**
 * 求数组的最大公约数和最小公倍数
 * @param arr   目标数组
 * @param commonDiv 公约数,默认值为2
 * @param maxCommonDiv  公倍数,默认值为1
 * @returns {*}
 */
p.commonDivAndMul = function(arr, commonDiv, maxCommonDiv){
    var max = 0;        // 最大值
    var divCount = 0;   // 统计能整除的个数
    var len = arr.length;

    // 求最大值和统计能整除的个数
    for (var i = 0; i < len; i++) {
        var weight = arr[i];

        divCount += weight % commonDiv == 0 ? 1 : 0;
        max = weight > max ? weight : max;
    }

    // divCount大于1,说明commonDiv是公约数;否则,不是公约数,commonDiv继续+1
    if (divCount > 1) {
        for (var j = 0; j < len; j++) {
            var weight = arr[j];
            var mod = weight % commonDiv;

            arr[j] = mod == 0 ? weight / commonDiv : weight;
        }
        maxCommonDiv *= commonDiv;
    } else {
        commonDiv++;
    }

    // subNum大于最大值,说明求公约数已经结束;否则,继续求公约数
    if (commonDiv >= max) {
        var minCommonMul = maxCommonDiv;
        for (var j = 0, lenJ = arr.length; j < lenJ; j++) {
            minCommonMul *= arr[j];
        }

        return {
            minCommonMul: minCommonMul,
            maxCommonDiv: maxCommonDiv
        };
    } else {
        return this.commonDivAndMul(arr, commonDiv, maxCommonDiv);
    }
};

/**
 * 产生指定范围[min, max)的随机数
 * @param min   最小值
 * @param max   最大值
 * @param isInt 是否取整
 * @returns {number}
 */
p.randNum = function(min, max, isInt){
    min = min || 0;
    max = max || 0;
    var offset = max - min;
    var num = min + Math.random() * offset;

    return isInt ? Math.floor(num) : num;
};

/**
 * 移除掉数组中的特定元素
 * @param arr   目标数组
 * @param element   要移除的元素
 * @returns {*} 返回被移除的元素
 */
p.removeElement = function(arr, element){
    var temp;
    for (var i = 0, len = arr.length; i < len; i++) {
        if (element == arr[i]) {
            temp = arr.splice(i, 1)[0];
            break;
        }
    }
    return temp;
};

/**
 * 查找数组中的特定元素
 * @param arr   目标数组
 * @param element   要查找的元素
 * @returns {boolean}   找到了返回true,否则返回false
 */
p.findElement = function(arr, element){
    for (var i = 0, len = arr.length; i < len; i++) {
        if (arr[i] == element) {
            return true;
        }
    }
    return false;
};

/**
 * 拷贝Array或Object的值
 * @param arr   目标数组
 * @returns {Array}     拷贝的值数组
 */
p.copyValues = function(arr){
    var temp = [];
    for (var key in arr) {
        temp[key] = arr[key];
    }
    return temp;
};

// 延迟执行
p.delayCall = function(fn, delay, args){
    setTimeout(function(){
        console.log("delayCall args", args);
        fn && fn(args);
    }, delay * 1000);
};

var CARD_ACE = 1;           // 卡牌A
var RANK_21 = 21;           // 21点
var RANK_16 = 16;           // 16点

// 算牌。hard即硬牌,A只算1点。开始算牌时A先当做软牌(11点)算,爆牌了再按硬牌(1点)算
p.countCard = function(cards, hard, canBlackJack){
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
        // 点数超过10且不是A都算10点
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

    var canSplit = cardNum == 2 && cards[0].num == cards[1].num;

    var ranks = [sum];
    // 有A存在且还没爆牌,也不是特殊牌型(黑杰克、五小龙)时,才需要考虑软硬牌下的点数
    if (isAceExist && !isBust && !isBlackJack && !isFiveDragon) {
        // 没爆牌时,软牌A(11点)大于硬牌A(1点),所以软牌A时没爆牌,要计算硬牌时的点数
        if (!hard) {
            ranks.push(this.simpleCount(cards, true));
        }
    }

    return {
        ranks: ranks,
        isBust: isBust,
        isBlackJack: isBlackJack,
        isFiveDragon: isFiveDragon,
        canSplit: canSplit
    };
};

// 简单计算卡牌点数
p.simpleCount = function(cards, hard){
    var sum = 0;
    var isAce = false;
    var cardNum = cards.length;

    // 计算牌的点数
    for (var i = 0; i < cardNum; i++) {
        var cardRank = cards[i].num;
        isAce = cardRank == CARD_ACE;

        // 如果是A且算是软牌,则算11
        cardRank = (isAce && !hard) ? 11 : cardRank;
        // 点数超过10且不是A都算10点
        sum += (cardRank > 10 && !isAce) ? 10 : cardRank;
    }

    return sum;
};

module.exports = new Util();