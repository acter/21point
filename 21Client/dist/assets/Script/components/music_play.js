"use strict";

cc.Class({
    extends: cc.Component,

    onLoad: function onLoad() {
        this.mp3Array = []; //文件夹下的资源
        this.bgmUrl = "sound/sgj_bg1"; //背景音乐
        this.bgm_on = (cc.sys.localStorage.getItem("bgm_on") || "true") == "true";
        this.effect_on = (cc.sys.localStorage.getItem("effect_on") || "true") == "true";

        //Notification.on("MUSIC_ON_OFF", this.MUSIC_ON_OFF.bind(this), this)
        this.loadAllMp3(this.onLoadMp3Finish.bind(this));
        this.bindEvent();
    },

    bindEvent: function bindEvent() {
        this.bindObj = [];
        this.bindObj.push(onfire.on("MUSIC_ON_OFF", this.MUSIC_ON_OFF.bind(this)));
        this.bindObj.push(onfire.on("PLAY_MUSIC_EFFECT", this.play_effect.bind(this)));
    },


    onDestroy: function onDestroy() {
        cc.audioEngine.stopMusic();
        for (var i = 0; i < this.bindObj.length; i++) {
            onfire.un(this.bindObj[i]);
        }
    },

    onLoadMp3Finish: function onLoadMp3Finish() {
        this.bgm_on_off(this.bgm_on);
        this.effect_on_off(this.effect_on);
    },

    //加载音频
    loadAllMp3: function loadAllMp3(callback) {

        var self = this;
        // 加载 sound 目录下所有 AudioClip，并且获取它们的路径
        cc.loader.loadResDir("sound", cc.AudioClip, function (err, assets, urls) {
            if (err) {
                console.error("加载错误");
                return;
            }
            for (var i = 0; i < urls.length; i++) {
                var url = urls[i];
                self.mp3Array[url] = assets[i];
            }
            callback();
        });
    },


    //当系统音效开关点击时候触发
    MUSIC_ON_OFF: function MUSIC_ON_OFF(effectType, msg) {

        if (effectType == "bgm") {
            //bgm
            var bgm_on = msg;
            this.bgm_on_off(msg);
        }
        if (effectType == "effect") {
            // 音效
            var effect_on = msg;
            this.effect_on_off(effect_on);
        }
    },

    //bgm开关
    bgm_on_off: function bgm_on_off(on) {
        if (on) {
            var bgm = this.mp3Array[this.bgmUrl];
            if (bgm) {
                cc.audioEngine.playMusic(bgm, true);
            }
        } else {
            cc.audioEngine.stopMusic();
        }
    },

    //音效开关
    effect_on_off: function effect_on_off(effect_on) {
        this.effect_on = effect_on;
    },

    //播放音效 返回effectID
    play_effect: function play_effect(effect_name, loop) {

        if (!this.effect_on) {
            //音效静音
            return;
        }

        if (this.mp3Array[effect_name]) {
            loop = loop || false;
            return cc.audioEngine.playEffect(this.mp3Array[effect_name], loop);
        } else {
            console.error("你要播放的音效不存在：", effect_name);
        }
    },
    stop_effect: function stop_effect(effectID) {
        cc.audioEngine.stopEffect(effectID);
    }

});
//# sourceMappingURL=music_play.js.map