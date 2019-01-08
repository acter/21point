var res = {
    EXIT_PLIST: "res/21dian/exit.plist",
    NOT_MONEY_PLIST: "res/21dian/notMoney.plist",
    GAME_PLIST: "res/21dian/game.plist",
};

var musicRes = {};


var loadingRes = {
    LOADING_PLIST: "res/21dian/loading.plist"
};

//加载场景资源， 过后会被释放掉
var g_loading_resources = [];

var web_resources = [
    "res/21dian/exit.plist",
    "res/21dian/exit.png",
    "res/21dian/game.plist",
    "res/21dian/game.png",
    "res/21dian/loading.plist",
    "res/21dian/loading.png",
    "res/21dian/notMoney.plist",
    "res/21dian/notMoney.png",
    "res/21dian/animation/BaoPai/BaoPai.ExportJson",
    "res/21dian/animation/BaoPai/BaoPai0.plist",
    "res/21dian/animation/BaoPai/BaoPai0.png",
    "res/21dian/animation/Game_iconAni_21/Game_iconAni_21.ExportJson",
    "res/21dian/animation/Game_iconAni_21/Game_iconAni_210.plist",
    "res/21dian/animation/Game_iconAni_21/Game_iconAni_210.png",
    "res/21dian/animation/HeiJieKe/HeiJieKe.ExportJson",
    "res/21dian/animation/HeiJieKe/HeiJieKe0.plist",
    "res/21dian/animation/HeiJieKe/HeiJieKe0.png",
    "res/21dian/animation/RenWuSuoDing/RenWuSuoDing.ExportJson",
    "res/21dian/animation/RenWuSuoDing/RenWuSuoDing0.plist",
    "res/21dian/animation/RenWuSuoDing/RenWuSuoDing0.png",
    "res/21dian/animation/WuXiaoLong/WuXiaoLong.ExportJson",
    "res/21dian/animation/WuXiaoLong/WuXiaoLong0.plist",
    "res/21dian/animation/WuXiaoLong/WuXiaoLong0.png",
    "res/21dian/game/bg.png",
    "res/21dian/game/bjeffect0.plist",
    "res/21dian/game/bjeffect0.png",
    "res/21dian/game/blackjackdesk.json",
    "res/21dian/game/BlackJackGameHelp.xml",
    "res/21dian/game/box.png",
    "res/21dian/game/chooseBg.png",
    "res/21dian/game/common981.plist",
    "res/21dian/game/icon_0.png",
    "res/21dian/game/icon_1000.png",
    "res/21dian/game/icon_10000.png",
    "res/21dian/game/icon_100000.png",
    "res/21dian/game/shuzi001.fnt",
    "res/21dian/game/shuzi001.png",
    "res/21dian/game/shuzi002.fnt",
    "res/21dian/game/shuzi002.png",
    "res/21dian/game/shuzi003.fnt",
    "res/21dian/game/shuzi003.png",
    "res/21dian/game/shuzi004.fnt",
    "res/21dian/game/shuzi004.png",
    "res/21dian/sound/21.mp3",
    "res/21dian/sound/Back.mp3",
    "res/21dian/sound/Bet.mp3",
    "res/21dian/sound/Bust.mp3",
    "res/21dian/sound/card_hjk.mp3",
    "res/21dian/sound/card_wxl.mp3",
    "res/21dian/sound/Chip.mp3",
    "res/21dian/sound/com_buttonClick.wav",
    "res/21dian/sound/DealPoker.mp3",
    "res/21dian/sound/Hit.mp3",
    "res/21dian/sound/Insurance.mp3",
    "res/21dian/sound/Lose.mp3",
    "res/21dian/sound/Split.mp3",
    "res/21dian/sound/Stand.mp3",
    "res/21dian/sound/Surrender.mp3",
    "res/21dian/sound/Time.mp3",
    "res/21dian/sound/Win.mp3"
];
var g_resources = [];

if (!cc.sys.isNative) {
    for (var i in web_resources) {
        g_resources.push(web_resources[i]);
    }
}

//图片资源
for (var i in res) {
    g_resources.push(res[i]);
}
//音乐资源
for (var i in musicRes) {
    g_resources.push(musicRes[i]);
}


for (var i in loadingRes) {
    g_loading_resources.push(loadingRes[i]);
}