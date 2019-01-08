/**
 * Created by coder on 2017/6/8.
 */

var jsListFramework = [
    "src/extend/Storage.js",
    "src/extend/CCNodeExtend.js",
    "src/extend/SoundEngine.js",
    "src/extend/ToastSystem.js",
    "src/extend/Util.js",
    "src/extend/Native.js",
    "src/extend/ClassPool.js",
    "src/extend/md5.js",
    "src/extend/sha1.js",
    "src/extend/FocusBase.js",
    "src/extend/FocusButton.js",
    "src/extend/FocusSprite.js",
    "src/extend/FocusScrollView.js",
    "src/extend/FocusSlider.js"
];

var jsListGame = [
    "src/resource.js",

    "src/core/define.js",
    "src/core/ClientUserItem.js",
    "src/core/GameFrameEngine.js",
    "src/core/GameUserManager.js",

    "src/app.js",

    "src/Config.js",

    "src/utils/Util.js",

    "src/components/CoinBarSprite.js",
    "src/components/List.js",
    "src/components/NotMoneyTipLayer.js",
    "src/components/SwitchButton.js",


    "src/layer/ExitLayer.js",
    "src/layer/UILayer.js",
    "src/layer/HelpLayer.js",
    "src/layer/RoomInfoLayer.js",
    "src/layer/BaseTipLayer.js",
    "src/layer/InsuranceLayer.js",
    "src/layer/ExitTipLayer.js",

    "src/scene/LoadingScene.js",
    "src/scene/FocusScene.js",
    "src/scene/MainScene.js",
    "src/scene/RoomScene.js",

    "src/sprite/PlayerSprite.js",
    "src/sprite/CardSprite.js",
    "src/sprite/CardBoxSprite.js",

    "src/SubGameMSG.js",
    "src/GameEngine.js",
];

if(typeof module != "undefined") {
    module.exports.jsListFramework = jsListFramework;
    module.exports.jsListGame = jsListGame;
}