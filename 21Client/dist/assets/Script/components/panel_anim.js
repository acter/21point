"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        /*        atlas: {
                    type: cc.SpriteAtlas,
                    default: null
                },*/
    },

    onLoad: function onLoad() {
        this.zjtsgArray = [];
        this.anim_fruit = this.node.getChildByName("anim_fruit");
        this.anim_dajiang = this.node.getChildByName("anim_dajiang");
        this.anim_zhongjiang = this.node.getChildByName("anim_zhongjiang");
        this.anim_gold = this.node.getChildByName("anim_gold");
    },

    onDestroy: function onDestroy() {},

    /**
     * 播放大奖特效
     */
    playDJTX: function playDJTX(callback) {

        var node = this.anim_zhongjiang;
        if (Math.random() < 0.5) {
            onfire.fire("PLAY_MUSIC_EFFECT", "sound/mega_win");
        } else {
            onfire.fire("PLAY_MUSIC_EFFECT", "sound/mega_win_cheer");
            node = this.anim_dajiang;
        }

        var spine = node.getComponent(sp.Skeleton);
        spine.active = true;
        spine.setAnimation(0, "Animation1", false); //播放选择动画
        spine.setCompleteListener(function () {
            node.active = false;
            callback && callback();
        });
    },

    /**
     * 一般中奖金币特效
     */
    playYBZJJBTX: function playYBZJJBTX(callback) {

        var node = this.anim_gold;
        var spine = node.getComponent(sp.Skeleton);
        node.active = true;
        spine.setAnimation(0, "Animation" + (Math.floor(Math.random() * 3) + 1), false); //播放选择动画
        spine.setCompleteListener(function () {
            node.active = false;
            callback && callback();
        });
    },

    /**
     * 中奖提示光
     * @param index
     */
    playZJTSG: function playZJTSG(index) {

        if (!this.zjtsgArray[index]) {
            var newNode = cc.instantiate(this.anim_fruit);
            this.node.addChild(newNode);

            this.zjtsgArray[index] = newNode;
        }
        var node = this.zjtsgArray[index];
        node.active = true;
        var spine = node.getComponent(sp.Skeleton);
        spine.setAnimation(0, "Animation1" + index, false); //播放选择动画
    },
    /**
     * 停止中奖提示光
     */
    stopZJTSG: function stopZJTSG() {
        if (!this.zjtsgArray) {
            return;
        }

        for (var i = 0; i < this.zjtsgArray.length; ++i) {
            if (this.zjtsgArray[i]) {
                this.zjtsgArray[i].active = false;
            }
        }
    }

});
//# sourceMappingURL=panel_anim.js.map