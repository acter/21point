"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        atlas: {
            type: cc.SpriteAtlas,
            default: null
        }
    },

    onLoad: function onLoad() {
        this.btn_open_close = this.node.getChildByName("btn_open_close");
        this.node_menu = this.node.getChildByName("node_menu");
        this.btn_exit = this.node_menu.getChildByName("btn_exit");
        this.btn_bgm = this.node_menu.getChildByName("btn_bgm");
        this.btn_effect = this.node_menu.getChildByName("btn_effect");

        this.btn_open_close.on("touchend", this.onOpenCloseBtnClick.bind(this)); //每个按钮注册事件
        this.btn_exit.on("touchend", this.onExitBtnClick.bind(this)); //每个按钮注册事件
        this.btn_bgm.on("touchend", this.onBgmBtnClick.bind(this)); //每个按钮注册事件
        this.btn_effect.on("touchend", this.onEffectBtnClick.bind(this)); //每个按钮注册事件

        //读取存储
        this.bgm_on = (cc.sys.localStorage.getItem("bgm_on") || "true") == "true";
        this.effect_on = (cc.sys.localStorage.getItem("effect_on") || "true") == "true";
        this.show_menu = false;
    },

    onDestroy: function onDestroy() {},

    showSpriteFrame: function showSpriteFrame(node, spriteName) {
        var frame = this.atlas.getSpriteFrame(spriteName);
        var sprite = node.getComponentInChildren(cc.Sprite);
        if (sprite && frame) {
            sprite.spriteFrame = frame;
        } else {
            cc.error("showSpriteFrame 错误:" + spriteName);
        }
    },


    //打开关闭
    onOpenCloseBtnClick: function onOpenCloseBtnClick(event) {
        this.show_menu = !this.show_menu;
        this.node_menu.active = this.show_menu;
        var spriteName = this.show_menu ? "res-shuiguoji-exit-hide_n" : "res-shuiguoji-exit-show_n";
        this.showSpriteFrame(this.btn_open_close, spriteName);
    },

    //退出房间
    onExitBtnClick: function onExitBtnClick(event) {},
    //音乐开关
    onBgmBtnClick: function onBgmBtnClick(event) {

        this.bgm_on = !this.bgm_on;
        var spriteName = this.bgm_on ? "res-shuiguoji-exit-music_e" : "res-shuiguoji-exit-music_d";
        this.showSpriteFrame(this.btn_bgm, spriteName);
        cc.sys.localStorage.setItem("bgm_on", this.bgm_on);
        onfire.fire("MUSIC_ON_OFF", "bgm", this.bgm_on);
    },

    //音效开关
    onEffectBtnClick: function onEffectBtnClick(event) {
        this.effect_on = !this.effect_on;
        var spriteName = this.effect_on ? "res-shuiguoji-exit-effect_e" : "res-shuiguoji-exit-effect_d";
        this.showSpriteFrame(this.btn_effect, spriteName);
        cc.sys.localStorage.setItem("effect_on", this.effect_on);
        onfire.fire("MUSIC_ON_OFF", "effect", this.effect_on);
    }

});
//# sourceMappingURL=panel_menu.js.map