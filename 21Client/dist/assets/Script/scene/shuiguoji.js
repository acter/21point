"use strict";

var NetHelp = require("NetHelp");
var subGameMSG = require("SubGameMSG").subGameMSG;
var ClientKernel = require("ClientKernel");
var GD = require("GD");
var define = require('define');
var gameCMD = define.gameCMD;
var gameEvent = define.gameEvent;
var gameConst = define.gameConst;
var ZZConfig = require("Config").ZZConfig;

cc.Class({
    extends: cc.Component,

    // use this for initialization
    onLoad: function onLoad() {
        this.fruitSlotArray = [];
        this.nowSlotIndex = 0; //当前光标所在的槽位置
        this.preSlotIndex = 0; //前一帧光标所在的槽位置
        this.slotIndexNode = null; //   //当前槽indexNode， 用来执行动作， 以node的Y坐标表示当前转动槽所在index, 方便控制， 方便利用cocos原有的动作函数
        this.winSlotArray = [];
        this.leftScore = 0;
        this.myScore = 0;
        this.lightPos = 0; //光标位置
        this.yazhu = [0, 0, 0, 0, 0, 0, 0, 0];
        this.initNodes();

        this.clearBet();
        this.initFruitSlots();
        this.clearSlot();
        this.doWaitAni();
        this.initData();
        this.slotIndexNode = new cc.Node();
        this.node.addChild(this.slotIndexNode);

        this.bindEvent();
        this.onEnterGame();
    },

    start: function start() {},


    update: function update(dt) {
        if (this.isStart) {
            this.nowSlotIndex = Math.floor(this.slotIndexNode.y % this.fruitSlotArray.length);
            this.setSlotBright(this.nowSlotIndex);
            this.preSlotIndex = this.nowSlotIndex;
        }
    },

    initNodes: function initNodes() {
        this.node_nums = this.node.getChildByName("node_nums");
        this.node_fruits = this.node.getChildByName("node_fruits");
        this.node_btns = this.node.getChildByName("node_btns");
        this.center = this.node.getChildByName("center");
        this.instance_light = this.node.getChildByName("instance_light");
        this.music = this.node.getChildByName("music").getComponent("music_play");
        this.panel_anim = this.node.getChildByName("panel_anim").getComponent("panel_anim");

        //中间的数字
        this.lbl_lucky = cc.find("node_lucky_num/lbl_lucky", this.node).getComponent(cc.Label);
        //我的总分
        this.lbl_myscore = this.node.getChildByName("lbl_myscore").getComponent(cc.Label);
        //该轮得分
        this.leftScoreLabel = this.node.getChildByName("lbl_gamescore").getComponent(cc.Label);
        this.btn_all = this.node_btns.getChildByName("btn_all");
        this.btn_begin = this.node_btns.getChildByName("btn_begin");

        this.btn_da = this.node_btns.getChildByName("btn_da");
        this.btn_xiao = this.node_btns.getChildByName("btn_xiao");

        this.btn_zuo = this.node_btns.getChildByName("btn_zuo");
        this.btn_you = this.node_btns.getChildByName("btn_you");
        //初始化最下面一排押注按钮
        for (var i = 0; i < this.node_fruits.children.length; i++) {
            var btn_fruit = this.node_fruits.children[i];
            btn_fruit.on("touchend", this.onFruitBtnClick.bind(this, i)); //每个按钮注册事件
            btn_fruit.on("touchstart", this.onFruitBtnStartClick.bind(this, i)); //每个按钮注册事件
        }

        this.btn_begin.on("touchend", this.onStartBtnClick.bind(this));
        this.btn_all.on("touchend", this.onBtnAllClick.bind(this));
        this.btn_all.on("touchstart", this.onBtnAllStartClick.bind(this));
        this.btn_da.on("touchend", this.onBtnDaClick.bind(this));
        this.btn_xiao.on("touchend", this.onBtnXiaoClick.bind(this));
        this.btn_zuo.on("touchend", this.onBtnZuoClick.bind(this));
        this.btn_you.on("touchend", this.onBtnYouClick.bind(this));
    },
    bindEvent: function bindEvent() {

        this.bindObj = [];
        this.bindObj.push(onfire.on("onEventGameMessage", this.onEventGameMessage.bind(this)));
        this.bindObj.push(onfire.on("onEventSceneMessage", this.onEventSceneMessage.bind(this)));
    },
    onDestroy: function onDestroy() {
        for (var i = 0; i < this.bindObj.length; i++) {
            onfire.un(this.bindObj[i]);
        }
    },
    onEnterGame: function onEnterGame() {

        GD.clientKernel.getRoomInfo(); //进入游戏请求房间信息
    },
    initData: function initData() {
        var clientKernel = GD.clientKernel;

        var userItem = clientKernel.myUserItem;
        if (userItem) {
            this.myScore = userItem.score;
            this.refreshMyScore();
        }
    },

    //播放音效
    playMusicEffect: function playMusicEffect(effectName, loop) {
        //onfire.fire("PLAY_MUSIC_EFFECT", effectName)
        return this.music.play_effect(effectName, loop);
    },
    stopEffect: function stopEffect(effectID) {
        //onfire.fire("PLAY_MUSIC_EFFECT", effectName)
        this.music.stop_effect(effectID);
    },


    /**
     * 发送子游戏事件
     * @param subCMD
     * @param data
     */
    sendGameData: function sendGameData(subCMD, data) {
        GD.clientKernel.sendSocketData(gameCMD.MDM_GF_GAME, subCMD, data);
    },

    /**
     * 游戏消息事件
     * @param subCMD 子游戏命令
     * @param data 数据
     * @returns {boolean}
     */
    onEventGameMessage: function onEventGameMessage(subCMD, data) {

        switch (subCMD) {
            case subGameMSG.S_BET_RESULT:
                this.onBetResult(data);
                break;
            case subGameMSG.S_START_RESULT:
                this.onStartResult(data);
                break;

            default:
                return true;
        }
    },

    /**
     * 场景消息
     * @param gameStatus
     * @param data
     * @returns {boolean}
     */
    onEventSceneMessage: function onEventSceneMessage(gameStatus, data) {

        GD.coreConfig = data.coreConfig;
        console.log("onEventSceneMessage", data);

        return true;
    },

    /**
     * 当启动后的结果
     */
    onStartResult: function onStartResult(data) {
        //转转的结果
        this.zhuanZhuanResult = data.zhuanZhuanResult;

        this.zhuanZhuan(this.zhuanZhuanResult.shift());
    },

    //设置左边分数
    refreshLeftScore: function refreshLeftScore() {
        console.error("refreshLeftScore", this.leftScore);
        this.leftScoreLabel.string = this.pad(this.leftScore, 9);
    },

    refreshMyScore: function refreshMyScore() {
        this.lbl_myscore.string = this.pad(this.myScore, 9);
    },

    //把数组指定的区域点亮
    setSlotBright: function setSlotBright(brightArray) {

        if (brightArray instanceof Array) {
            for (var i = 0; i < this.fruitSlotArray.length; ++i) {
                var isBright = false;
                for (var j = 0; j < brightArray.length; ++j) {
                    if (i == brightArray[j]) {
                        isBright = true;
                        break;
                    }
                }
                if (isBright) {
                    this.fruitSlotArray[i].bright();
                }
            }
        } else {
            this.nowSlotIndex = brightArray;
            for (var i = 0; i < this.fruitSlotArray.length; ++i) {
                if (brightArray == i) {
                    this.fruitSlotArray[i].bright();
                }
            }
        }
    },

    //设置槽闪烁
    setSlotTwinkle: function setSlotTwinkle(slotTime, slotIndexArray) {

        for (var i = 0; i < slotIndexArray.length; ++i) {
            var slotIndex = slotIndexArray[i];
            this.fruitSlotArray[slotIndex].twinkle(slotTime);
        }
    },

    /**
     * 加分什么的
     * @param winSlotIndex
     * @returns {boolean}
     */
    handleWinSlot: function handleWinSlot(winSlotIndex) {

        winSlotIndex %= this.fruitSlotArray.length;
        winSlotIndex = Math.floor(winSlotIndex);
        this.fruitSlotArray[winSlotIndex].alwaysLight();
        this.winSlotArray.push(winSlotIndex);

        var fruitsType = GD.coreConfig.SlotValueArray[winSlotIndex];

        var config = GD.coreConfig.SoundAndMulConfig[fruitsType];

        if (this.yazhu[config.type] > 0) {
            var self = this;
            //this.lockInput();
            this.panel_anim.playYBZJJBTX(function () {
                self.leftScore += self.yazhu[config.type] * config.mul;
                self.refreshLeftScore();
            });

            return true;
        }

        return false;
    },

    /**
     * 转转，
     * @param end  停在指定位置
     * @param finishCallback 停止旋转后的回调函数
     * @param start 开始位置， 未指定则为当前位置
     */
    zhuanZhuan: function zhuanZhuan(end, finishCallback, start) {

        finishCallback = finishCallback || this.onZhuanZhuanFinish.bind(this);

        start = start == null ? this.nowSlotIndex : start;

        var self = this;
        this.slotIndexNode.setPositionY(start);

        var accDy = ZZConfig.uniSpeed * ZZConfig.accTime / 2;
        var uniDy = ZZConfig.uniSpeed * ZZConfig.uniTime;
        var decDy = ZZConfig.uniSpeed * ZZConfig.decTime / 7;

        var allDy = start + accDy + uniDy + decDy;

        var uniDyEx = end - allDy % this.fruitSlotArray.length; // 在匀速期间 额外增加的位移, 控制结果用的
        var uniDtEx = uniDyEx / ZZConfig.uniSpeed; // 在匀速期间 额外增加的时间

        var uniSound = null; //匀速音效

        this.slotIndexNode.stopAllActions();
        var action = cc.sequence(cc.callFunc(function () {
            self.isStart = true;
            self.playMusicEffect("sound/go_start");
        }), cc.moveBy(ZZConfig.accTime, 0, accDy).easing(cc.easeSineIn()), cc.spawn(cc.callFunc(function () {
            uniSound = self.playMusicEffect("sound/go_ing", true);
        }), cc.moveBy(ZZConfig.uniTime + uniDtEx, 0, uniDy + uniDyEx)),

        //因为cc.easeExponentialOut 曲线后段部分实在是太平了， 导致y基本没变化， 但还要过很久才完全停下来， 所以这边提前1.5秒当他结束了。
        //也强制下  旋转的结果
        cc.spawn(cc.sequence(cc.callFunc(function () {
            self.stopEffect(uniSound);
            self.playMusicEffect("sound/go_ending");
        }), cc.delayTime(ZZConfig.decTime - 1.5), cc.callFunc(function () {
            self.isStart = false;
            self.fruitSlotArray[end].bright();
            self.playMusicEffect("sound/go_end");
        }), cc.delayTime(0.5), cc.callFunc(function () {
            if (finishCallback) {
                finishCallback(end);
            }
        })), cc.moveBy(ZZConfig.decTime, 0, decDy).easing(cc.easeExponentialOut())));
        this.slotIndexNode.runAction(action);
    },

    //初始化中间转盘灯
    initFruitSlots: function initFruitSlots() {
        for (var i = 0; i < this.center.children.length; i++) {
            var slot = this.center.children[i]; //每个灯的槽位
            var newNode = cc.instantiate(this.instance_light); // 加一个灯
            newNode.setPosition(0, 0);
            slot.addChild(newNode);
            var script = slot.addComponent("FruitSlot");
            this.fruitSlotArray[i] = script;
        }
    },

    //
    clearSlot: function clearSlot() {
        for (var i = 0; i < this.fruitSlotArray.length; ++i) {
            this.fruitSlotArray[i].turnOff();
        }
    },

    //把下注清零
    clearBet: function clearBet() {
        this.yazhu = [0, 0, 0, 0, 0, 0, 0, 0]; //重新设置押注
        //把下的注清0
        for (var i = 0; i < this.node_nums.children.length; ++i) {
            this.setFruitLabelValue(i, 0);
            this.node_nums.children[i].stopAllActions();
        }

        //清掉中奖提示光
        this.panel_anim.stopZJTSG();
    },

    /**
     * 设置水果按钮值
     * @param index
     * @param value
     */
    setFruitLabelValue: function setFruitLabelValue(index, value) {
        var lbl = this.node_nums.children[index].getComponent(cc.Label);
        lbl.string = this.pad(this.yazhu[index], 2); //显示灯
    },

    //待机动画
    doWaitAni: function doWaitAni() {

        if (!this.isStart) {
            //正在押注也不会开始待机动画
            for (var i = 0; i < this.yazhu.length; ++i) {
                if (this.yazhu[i] > 0) {
                    return;
                }
            }

            if (!this.isRunWaitAni) {
                this.clearSlot();
                this.isRunWaitAni = true;
                for (var i = 0; i < this.fruitSlotArray.length; ++i) {
                    this.fruitSlotArray[i].node.stopAllActions();
                    this.fruitSlotArray[i].waitAni(i % 6 * 4 / 6);
                }
            }
        }
    },

    //停止待机动画
    stopWaitAni: function stopWaitAni() {
        if (this.isRunWaitAni) {
            this.isRunWaitAni = false;
            for (var i = 0; i < this.fruitSlotArray.length; ++i) {
                this.fruitSlotArray[i].stopAllActions();
            }
        }
    },

    //开始游戏
    onStartBtnClick: function onStartBtnClick(event) {
        this.clearSlot();
        this.sendGameData(subGameMSG.C_START, {
            fruitsBetValueArray: this.yazhu
        });
    },
    onBtnAllClick: function onBtnAllClick(event) {
        this.unscheduleAllCallbacks(); //取消定时器
        this.addAllFruit();
    },
    onBtnAllStartClick: function onBtnAllStartClick(event) {
        console.log("onBtnAllStartClick");
        // 以秒为单位的时间间隔
        var interval = 0.05;
        // 重复次数
        var repeat = 99;
        // 开始延时
        var delay = 0.5;
        this.schedule(this.addAllFruit.bind(this), interval, repeat, delay);
    },
    onBtnDaClick: function onBtnDaClick(event) {},
    onBtnXiaoClick: function onBtnXiaoClick(event) {},
    onBtnZuoClick: function onBtnZuoClick(event) {},
    onBtnYouClick: function onBtnYouClick(event) {},


    //押注
    onFruitBtnClick: function onFruitBtnClick(fruitType, event) {
        this.unscheduleAllCallbacks(); //取消定时器
        this.addFruit(fruitType);
    },


    //%02d 补齐n位
    pad: function pad(num, str_len) {
        var y = "::::::::::::::::::::::::::" + num;
        return y.substr(y.length - str_len);
    },
    addAllFruit: function addAllFruit() {
        for (var i = 0; i < this.yazhu.length; i++) {
            this.addFruit(i);
        }
    },
    addFruit: function addFruit(fruitType) {

        var old_value = this.yazhu[fruitType];
        this.yazhu[fruitType] += 1;
        if (this.yazhu[fruitType] > 99) {
            this.yazhu[fruitType] = 99;
        }
        var lbl = this.node_nums.children[fruitType].getComponent(cc.Label);
        lbl.string = this.pad(this.yazhu[fruitType], 2); //显示灯
        this.myScore -= this.yazhu[fruitType] - old_value;
        this.refreshMyScore();
    },


    //押注
    onFruitBtnStartClick: function onFruitBtnStartClick(fruitType, event) {
        console.log("onFruitBtnStartClick", fruitType);
        // 以秒为单位的时间间隔
        var interval = 0.05;
        // 重复次数
        var repeat = 99;
        // 开始延时
        var delay = 0.5;
        this.schedule(this.addFruit.bind(this, fruitType), interval, repeat, delay);
    },


    /**
     * 当转完
     * @param endIndex
     */
    onZhuanZhuanFinish: function onZhuanZhuanFinish(preEnd) {
        //转完了
        var self = this;
        var fruitsType = GD.coreConfig.SlotValueArray[preEnd];

        var status = 0; //0表示没中， 1表示中了， 2表示还在判定

        switch (fruitsType) {

            case GD.coreConfig.Fruits.Lucky:
                //幸运
                status = 2;
                var config = GD.coreConfig.SoundAndMulConfig[fruitsType];
                var soundIndex = Math.floor(Math.random() * config.sound.length);
                var sound = config.sound[soundIndex];
                this.playMusicEffect(sound);
                var end = this.zhuanZhuanResult.shift();

                var dtArray = [2.2, 0.8, 1.2];
                var dt = dtArray[soundIndex];
                //console.log(dt);
                this.setSlotTwinkle(dt, [preEnd]);
                var callback = null;
                switch (end) {

                    case GD.coreConfig.LuckyType.DaSanYuan:
                        //大三元
                        callback = function callback() {
                            self.handleGroupAward(GD.coreConfig.Group.DaSanYuan, preEnd);
                        };
                        break;
                    case GD.coreConfig.LuckyType.XiaoSanYuan:
                        //小三元
                        callback = function callback() {
                            self.handleGroupAward(GD.coreConfig.Group.XiaoSanYuan, preEnd);
                        };
                        break;
                    case GD.coreConfig.LuckyType.DaSiXi:
                        //大四喜
                        callback = function callback() {
                            self.handleGroupAward(GD.coreConfig.Group.DaSiXi, preEnd);
                        };
                        break;
                    case GD.coreConfig.LuckyType.XiaoSiXi:
                        //小四喜
                        callback = function callback() {
                            self.handleGroupAward(GD.coreConfig.Group.XiaoSiXi, preEnd);
                        };
                        break;
                    case GD.coreConfig.LuckyType.ZHSH:
                        //纵横四海
                        callback = function callback() {
                            self.handleGroupAward(GD.coreConfig.Group.ZHSH, preEnd);
                        };

                        break;
                    case GD.coreConfig.LuckyType.JLBT:
                        //九莲宝灯
                        callback = function callback() {
                            self.handleGroupAward(GD.coreConfig.Group.JLBT, preEnd);
                        };
                        break;
                    case GD.coreConfig.LuckyType.DaManGuan:
                        //大满贯
                        callback = function callback() {
                            self.handleGroupAward(GD.coreConfig.Group.DaManGuan, preEnd);
                        };
                        break;
                    case GD.coreConfig.LuckyType.Continue:
                        //无它， 再转一次
                        var end = this.zhuanZhuanResult.shift();
                        callback = function callback() {
                            self.zhuanZhuan(end);
                        };
                        break;
                    case GD.coreConfig.LuckyType.Fail:
                        //失败， 没掉了
                        callback = function callback() {
                            self.playMusicEffect("sound/fail");
                            self.node.runAction(cc.sequence(cc.delayTime(1), cc.callFunc(function () {
                                self.onAllFinish();
                            })));
                        };
                        break;
                }

                this.node.runAction(cc.sequence(cc.delayTime(dt), cc.callFunc(callback)));

                break;
            default:
                {
                    var config = GD.coreConfig.SoundAndMulConfig[fruitsType];
                    if (config) {
                        var sound = config.sound[Math.floor(Math.random() * config.sound.length)];
                        this.playMusicEffect(sound);
                        if (this.handleWinSlot(preEnd)) {
                            status = 1;
                        }
                    }
                }
        }

        if (status == 0) {
            this.onAllFinish();
        } else if (status == 1) {
            this.onAllFinish();
        } else if (status == 2) {}
    },

    /**
     * 处理组合奖
     * @param endGroup 组合奖， 各个奖所在的下标
     */
    handleGroupAward: function handleGroupAward(groupAwardConfig, start) {

        var groupAward = groupAwardConfig.award;

        if (groupAward.length == 0) {
            groupAward = [];
            //如果是零， 则是大满贯
            for (var i = 0; i < this.zhuanZhuanResult.length; ++i) {
                var index = this.zhuanZhuanResult[i];
                groupAward.push({
                    type: GD.coreConfig.SlotValueArray[index],
                    index: index
                });
            }
        }

        var self = this;

        var indexSet = [];
        for (var i = 0; i < groupAward.length; ++i) {
            indexSet.push(groupAward[i].index);
        }

        this.recursiveHandleGroupAward(indexSet, start, function () {
            self.playMusicEffect(groupAwardConfig.sound);

            self.node.runAction(cc.sequence(cc.delayTime(1), cc.callFunc(function () {
                self.onAllFinish();
            })));
        }, true);
    },

    /**
     * 递归处理组合奖
     * @param groupAward
     * @param start
     */
    recursiveHandleGroupAward: function recursiveHandleGroupAward(groupAward, start, finishCallback, isPlayThen) {

        var self = this;
        if (groupAward.length > 0) {
            var end = groupAward.shift();
            this.connectTo(start, end, isPlayThen, function () {
                self.recursiveHandleGroupAward(groupAward, start, finishCallback, true);
            });
        } else {
            if (finishCallback) {
                finishCallback();
            }
        }
    },

    /**
     * 起点 出发， 点亮 终点 内部自动选择顺逆时针,
     * @param start 起始位置
     * @param end   结束位置
     */
    connectTo: function connectTo(start, end, isPlayThan, finishCallback) {

        var slotNum = this.fruitSlotArray.length;

        // var dir = -1;   //-1顺时针， 1逆时针
        // if (Math.abs(end - start) > slotNum / 2) {
        //     if (end > start) {
        //         start += slotNum;
        //     }
        //     else {
        //         end += slotNum;
        //     }
        // }
        // dir = end - start > 0 ? -1 : 1;
        //有bug，先全改成-1

        var dt = 1.2;
        var self = this;
        if (isPlayThan) {
            this.playMusicEffect("sound/than");
            this.setSlotTwinkle(dt, [start % slotNum]);
        } else {
            dt = 0;
        }

        var action = cc.sequence(cc.delayTime(dt), cc.callFunc(function () {

            self.nowSlotIndex = start;
            self.preSlotIndex = start;
            self.isStart = true;
            self.slotIndexNode.setPositionY(start);
            self.slotIndexNode.runAction(cc.sequence(
            //多加0.5， 防止向下取整时误差， 导致差一格
            cc.moveTo(Math.abs(end + 0.5 - start) / ZZConfig.paSpeed, 0, end + 0.5), cc.callFunc(function () {
                self.playMusicEffect("sound/pa");
                self.handleWinSlot(end);
            }), cc.delayTime(0.5), cc.callFunc(function () {

                self.isStart = false;
                if (finishCallback) {
                    finishCallback(end % slotNum);
                }
            })));
        }));
        this.node.runAction(action);
    },

    //播放中奖声音
    playWinningMusic: function playWinningMusic() {
        this.playMusicEffect("sound/C0" + (Math.floor(Math.random() * 11) + 1), false);
    },

    /**
     * 当全部转完， 且获得奖励
     */
    onAllFinishWithWin: function onAllFinishWithWin() {
        this.playWinningMusic();
        this.bigSmallBeat();

        var betArray = [];

        //是否中了大奖
        var isBig = false;
        //槽闪烁
        for (var i = 0; i < this.winSlotArray.length; ++i) {
            var slotIndex = this.winSlotArray[i];

            this.fruitSlotArray[slotIndex].twinkle(null, true);

            //betArray[GD.coreConfig.]
            var betType = GD.coreConfig.SoundAndMulConfig[GD.coreConfig.SlotValueArray[slotIndex]].type;
            if (this.yazhu[betType] > 0) {
                betArray[betType] = true;

                if (this.fruitSlotArray[slotIndex].big) {
                    isBig = true;
                }
            }
        }

        //筹码闪烁
        for (var i = 0; i < this.yazhu.length; ++i) {
            if (betArray[i]) {
                var betNumNode = this.node_nums.children[i];
                betNumNode.runAction(cc.blink(1, 4).repeatForever());
                this.panel_anim.playZJTSG(i + 1);
            } else {
                this.setFruitLabelValue(i, 0);
            }
        }

        if (isBig) {

            this.panel_anim.playDJTX();
        }
    },

    onAllFinishWithLose: function onAllFinishWithLose() {
        this.clearBet();
        this.node.runAction(cc.sequence(cc.delayTime(2), cc.callFunc(this.doWaitAni.bind(this))));
    },
    onAllFinish: function onAllFinish() {

        var temp = [];

        for (var i = 0; i < this.winSlotArray.length; ++i) {
            if (this.yazhu[GD.coreConfig.SoundAndMulConfig[GD.coreConfig.SlotValueArray[this.winSlotArray[i]]].type] > 0) {
                temp.push(this.winSlotArray[i]);
            } else {
                // this.fruitSlotArray[this.winSlotArray[i]].turnOff();
            }
        }

        this.winSlotArray = temp;
        if (this.winSlotArray.length > 0) {

            this.onAllFinishWithWin();
        } else {

            this.onAllFinishWithLose();
        }
    },

    /**
     * 停止大小跳动
     */
    stopBigSmallBeat: function stopBigSmallBeat() {
        this.isBigSmallBeat = false;
        this.lbl_lucky.node.stopAllActions();
    },

    /**
     * 大小跳动
     */
    bigSmallBeat: function bigSmallBeat() {

        if (!this.isBigSmallBeat) {
            this.stopBigSmallBeat();
            var delayTime = 0.1;
            var self = this;
            this.isBigSmallBeat = true;
            this.lbl_lucky.node.runAction(cc.sequence(cc.delayTime(delayTime), cc.callFunc(function () {

                var value = Math.floor(Math.random() * 14) + 1;
                self.setLuckyValue(value);
            })).repeatForever());
        }
    },

    /**
     * 设置大小跳动值label的值
     * @param value
     */
    setLuckyValue: function setLuckyValue(value) {
        this.lbl_lucky.string = value;
        if (value < 10) {
            this.lbl_lucky.string = "0" + value;
        }
    }

    // update (dt) {},
});
//# sourceMappingURL=scene.js.map