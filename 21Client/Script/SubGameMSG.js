//子游戏消息

// var gameConst = require('define').gameConst;

var subGameMSG = {
    TYPE_WAGER: "type_wager",                   // 下注
    TYPE_DEAL: "type_deal",                     // 发牌
    TYPE_HIT: "type_hit",                       // 要牌
    TYPE_STAND: "type_stand",                   // 停牌
    TYPE_DOUBLE: "type_double",                 // 双倍
    TYPE_SPLIT: "type_split",                   // 分牌
    TYPE_INSURANCE: "type_insurance",           // 保险
    TYPE_BUY_INSURANCE: "type_buy_insurance",   // 买保险
    TYPE_BUST: "type_bust",                     // 爆牌
    TYPE_BLACK_JACK: "type_black_jack",         // 黑杰克
    TYPE_FIVE_DRAGON: "type_five_dragon",       // 五小龙
    TYPE_PLAYING: "type_playing",               // 正在游戏中
    TYPE_WAGERING: "type_wagering",             // 正在下注
    TYPE_TIME_OUT: "type_time_out",             // 超时
    TYPE_NEXT_ACTION: "type_next_action",       // 下一个玩家行动
    TYPE_GAME_OVER: "type_game_over",           // 游戏结束
    TYPE_IS_BLACK_JACK: "type_is_black_jack",   // 是不是黑杰克
    TYPE_DEAL_TURN: "type_deal_turn",           // 庄家行动
    NOT_ENOUGH_MONEY: "not_enough_money",       // 没有足够的钱
    TESTING: "testing"
};


module.exports.subGameMSG = subGameMSG;


/**
 * 消息格式说明
 *
 */