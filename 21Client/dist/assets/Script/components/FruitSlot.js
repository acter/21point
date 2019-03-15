"use strict";

// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,
    onLoad: function onLoad() {
        this.isAlways = false; //是否常亮
        this.light = this.node.getChildByName("instance_light");
    },
    start: function start() {},


    //点亮
    bright: function bright(delayTime, fadeOutTime) {
        delayTime = delayTime || 0;
        fadeOutTime = fadeOutTime || 0.5;
        this.light.opacity = 255;
        this.light.active = true;
        this.light.stopAllActions();
        if (!this.isAlways) {
            this.light.runAction(cc.sequence(cc.delayTime(delayTime), cc.fadeOut(fadeOutTime)));
        }
    },

    //常高
    alwaysLight: function alwaysLight() {
        this.isAlways = true;

        this.light.stopAllActions();
        this.light.opacity = 255;
        this.light.active = true;
    },

    //关灯
    turnOff: function turnOff() {
        this.node.stopAllActions();
        this.light.stopAllActions();
        this.light.opacity = 255;
        this.light.active = false;
        this.isAlways = false;
    },

    //闪烁
    twinkle: function twinkle(slotTime, forever) {

        slotTime = slotTime || 2;
        this.light.stopAllActions();
        this.light.opacity = 255;

        var blinkAction = cc.blink(slotTime, Math.floor(slotTime / 0.2) + 1);
        if (forever) {
            blinkAction = blinkAction.repeatForever();
        }
        this.light.runAction(blinkAction);
    },
    //待机动画
    waitAni: function waitAni(waitTime) {

        this.node.stopAllActions();
        this.light.opacity = 255;
        this.light.active = true;
        var self = this;
        this.node.runAction(cc.sequence(cc.delayTime(waitTime), cc.callFunc(function () {
            self.node.runAction(cc.sequence(cc.callFunc(self.bright.bind(self, 0.5, 1)), cc.delayTime(4)).repeatForever());
        })));
    }

    // update (dt) {},
});
//# sourceMappingURL=FruitSlot.js.map