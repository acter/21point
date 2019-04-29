
//设计分辨率
var V = {
    w: 1334,
    h: 750
};

var GFontDef = {
    fontName: "宋体",
    fontSize: 22,
    fillStyle: cc.color(66, 209, 244, 255)
};

var RuleTxt = "一、基本玩法\n1.游戏8副牌，除去大小王，牌盒中的牌。玩家的目标是使手中牌的点数之和不超过21点，" +
    "且尽量最大。如果超过21点，称为爆牌，立即输掉游戏。\n2.在计算牌面点数时，10、J、Q、K均算作10点，A即可当做1点" +
    "或11点，由玩家决定。闲家只与庄家进行点数比较。\n3.开局只有2张牌时，可执行双倍操作，即再下一注，再获得一张牌后，" +
    "强制停牌。\n4.如最初2张牌是一对，可执行分牌操作，即再下一注，将牌分为2份，分别操作。\n5.如果玩家最初拿到一张A" +
    "和一张10点牌，就拥有黑杰克（Blackjack），本轮中自己不再进行操作。（分牌后的黑杰克只算普通21点）\n6.要牌满5张且" +
    "总点数小于21，称为五小龙。黑杰克与五小龙都按1.5倍赔付。\n7.所有闲家一次操作完成后，由庄家进行操作，庄家点数小于" +
    "17点是必须要牌，大于等于17点后，必须停牌。所有牌型中，黑杰克>五小龙>普通21点>其他点数。\n" +
    "二、关于保险\n1.如果庄家最开始的明牌是A，则玩家可以考虑买不买保险，金额是赌筹的一半。\n" +
    "2.购买保险后，如果庄家是blackjack，那么玩家拿回保险金，并从庄家处获得2倍保险金；如果庄家没有blackjack则玩家" +
    "失去保险金。\n三、算牌技巧\n“高低法（High-Low）”的算牌法。在游戏过程中，我们把每一张出现的" +
    "2，3，4，5，6都算+1点，7，8，9算0点，10，J，Q，K，A算－1点。$n比如前面出现的牌是：" +
    "4，9，10，5，J，A，8，10，Q，2，6，K，J，7那么点数就是4张小牌减7张大牌，是－3，点数越大，庄家越容易爆牌。";

// 白色数字
var whiteTextConfig = {
    '+': {x: 102, width: 23, height: 44},
    ',': {x: 414, width: 13, height: 44},
    '-': {x: 126, width: 23, height: 44},
    '.': {x: 428, width: 11, height: 44},
    '0': {x: 150, width: 23, height: 44},
    '1': {x: 174, width: 23, height: 44},
    '2': {x: 198, width: 23, height: 44},
    '3': {x: 222, width: 23, height: 44},
    '4': {x: 246, width: 23, height: 44},
    '5': {x: 270, width: 23, height: 44},
    '6': {x: 294, width: 23, height: 44},
    '7': {x: 318, width: 23, height: 44},
    '8': {x: 342, width: 23, height: 44},
    '9': {x: 366, width: 23, height: 44},
    'K': {x: 390, width: 23, height: 44},
    'M': {x: 68, width: 33, height: 44},
    '万': {x: 34, width: 33, height: 44},
    '亿': {x: 0, width: 33, height: 44}
};

// 黄色数字
var yellowTextConfig = {
    '+': {x: 19, width: 13, height: 18},
    ',': {x: 201, width: 6, height: 18},
    '-': {x: 33, width: 13, height: 18},
    '.': {x: 208, width: 5, height: 18},
    '0': {x: 47, width: 13, height: 18},
    '1': {x: 61, width: 13, height: 18},
    '2': {x: 75, width: 13, height: 18},
    '3': {x: 89, width: 13, height: 18},
    '4': {x: 103, width: 13, height: 18},
    '5': {x: 117, width: 13, height: 18},
    '6': {x: 131, width: 13, height: 18},
    '7': {x: 145, width: 13, height: 18},
    '8': {x: 159, width: 13, height: 18},
    '9': {x: 173, width: 13, height: 18},
    'K': {x: 187, width: 13, height: 18},
    'M': {x: 0, width: 18, height: 18},
};

// 彩色数字
var colorTextConfig = {
    '+': {x: 29, width: 21, height: 30},
    ',': {x: 315, width: 9, height: 30},
    '-': {x: 51, width: 21, height: 30},
    '.': {x: 325, width: 9, height: 30},
    '0': {x: 73, width: 21, height: 30},
    '1': {x: 95, width: 21, height: 30},
    '2': {x: 117, width: 21, height: 30},
    '3': {x: 139, width: 21, height: 30},
    '4': {x: 161, width: 21, height: 30},
    '5': {x: 183, width: 21, height: 30},
    '6': {x: 205, width: 21, height: 30},
    '7': {x: 227, width: 21, height: 30},
    '8': {x: 249, width: 21, height: 30},
    '9': {x: 271, width: 21, height: 30},
    'k': {x: 293, width: 21, height: 30},
    'm': {x: 0 , width: 28, height: 30},
};

var PlayerTypes = {
    TYPE_INVALID: -1,       // 无效的类型
    TYPE_DEALER: 0,         // 庄家
    TYPE_PLAYER: 1,         // 真人闲家
    TYPE_ANDROID: 2         // 机器人闲家
};

var RANK_21 = 21;           // 21点
module.exports.PlayerTypes = PlayerTypes
module.exports.RuleTxt = RuleTxt
module.exports.RANK_21 = RANK_21