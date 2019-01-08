/**
 * Created by Changwei on 2017/8/07
 */
var FocusScene = cc.Scene.extend(FocusBase).extend({

	ctor:function (){
		this._super();
	},

    // 如果出现特殊情况按钮不见了 最简单就是手指移动到下拉按钮
    setSelectPanal: function () {
        // 按钮:下拉
        var showPanelBtn = this.exitLayer.showPanelBtn.isVisible() ? this.exitLayer.showPanelBtn : null;
        // 按钮:上拉
        var hidePanelBtn = this.exitLayer.hidePanelBtn.isVisible() ? this.exitLayer.hidePanelBtn : null;
        var nextFocus = showPanelBtn || hidePanelBtn;
        this.setFocusSelected(nextFocus);
    },

    refreshFingerFocus: function () {
        console.log("refreshFingerFocus");
        if (!this.useKeyboard)
            return;
        // 下拉按钮
        var showPanelBtn = this.exitLayer.showPanelBtn.isVisible() ? this.exitLayer.showPanelBtn : null;
        // 上拉按钮
        var hidePanelBtn = this.exitLayer.hidePanelBtn.isVisible() ? this.exitLayer.hidePanelBtn : null;
        // 帮助按钮
        var helpBtn = this.uiLayer.helpBtn;

        // 五个下注按钮
        var btn1 = this.uiLayer._betContainerLayer.isVisible() ? this.uiLayer._betButtons[0] : null;
        var btn2 = this.uiLayer._betContainerLayer.isVisible() ? this.uiLayer._betButtons[1] : null;
        var btn3 = this.uiLayer._betContainerLayer.isVisible() ? this.uiLayer._betButtons[2] : null;
        var btn4 = this.uiLayer._betContainerLayer.isVisible() ? this.uiLayer._betButtons[3] : null;
        var btn5 = this.uiLayer._betContainerLayer.isVisible() ? this.uiLayer._betButtons[4] : null;
        // 最大下注
        var maxBet = this.uiLayer._betContainerLayer.isVisible() ? this.uiLayer._otherButtons[0] : null;
        // 上局下注
        var lastBet = this.uiLayer._betContainerLayer.isVisible() ? this.uiLayer._otherButtons[1] : null;

        // 操作层 _operateButtons ["split", "double", "stand", "hit"];
        var btn_split = this.uiLayer._operateContainerLayer.isVisible() ? this.uiLayer._operateButtons[0] : null;
        var btn_double = this.uiLayer._operateContainerLayer.isVisible() ? this.uiLayer._operateButtons[1] : null;
        var btn_stand = this.uiLayer._operateContainerLayer.isVisible() ? this.uiLayer._operateButtons[2] : null;
        var btn_hit = this.uiLayer._operateContainerLayer.isVisible() ? this.uiLayer._operateButtons[3] : null;

        // ### 开始分层级
        var first_layer = showPanelBtn || hidePanelBtn;
        var second_layer = maxBet || btn_split;
        // ### 开始绑定规则
        if (showPanelBtn)
            showPanelBtn.setNextFocus(null, second_layer, null, helpBtn);
        if (hidePanelBtn) {
            this.exitLayer.refreshFingerFocus();
            this.exitLayer.layer1.setNextFocus(null, this.exitLayer.layer2, null, helpBtn);
            this.exitLayer.layer2.setNextFocus(this.exitLayer.layer1, this.exitLayer.layer3, null, null);
            this.exitLayer.layer3.setNextFocus(this.exitLayer.layer2, this.exitLayer.layer4, null, null);
            this.exitLayer.layer4.setNextFocus(this.exitLayer.layer3, null, null, null);
        }
        helpBtn.setNextFocus(null, second_layer, first_layer, null);
        if (maxBet) {
            maxBet.setNextFocus(first_layer, null, null, btn1);
            btn1.setNextFocus(first_layer, null, maxBet, btn2);
            btn2.setNextFocus(first_layer, null, btn1, btn3);
            btn3.setNextFocus(first_layer, null, btn2, btn4);
            btn4.setNextFocus(first_layer, null, btn3, btn5);
            btn5.setNextFocus(first_layer, null, btn4, lastBet);
            lastBet.setNextFocus(first_layer, null, btn5, null);
        }
        if (btn_split) {
            btn_split.setNextFocus(first_layer, null, null, btn_double);
            btn_double.setNextFocus(first_layer, null, btn_split, btn_stand);
            btn_stand.setNextFocus(first_layer, null, btn_double, btn_hit);
            btn_hit.setNextFocus(first_layer, null, btn_stand, null);
        }

    },

    onEnterTransitionDidFinish: function () {

        this._super();
        // if (!this.useKeyboard)
        //     return


        this.keyboardListener = cc.EventListener.create({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (code, event) {

                switch (code) {
                    case cc.KEY.up:
                    case cc.KEY.down:
                    case cc.KEY.left:
                    case cc.KEY.right:
                    case cc.KEY.dpadUp:
                    case cc.KEY.dpadDown:
                    case cc.KEY.dpadLeft:
                    case cc.KEY.dpadRight:
                        if (!this.useKeyboard)
                            break;
                        console.log('onKeyPressed')
                        // 上下左右 按下状态
                        this.refreshFingerFocus();
                        var nextFocus = this.shared.selected.getNextFocus(code);

                        if (nextFocus && nextFocus.isVisible())
                            this.setFocusSelected(nextFocus);
                        // 因为这里的listView不通用 比较特殊 强烈建议规则这种下拉的用ScrollView
                        if (GD.mainScene.helpLayer && GD.mainScene.helpLayer.listView.isVisible()) {
                            this.helpLayer.listView.tvOnScroll(code);
                        }
                        break;
                    case cc.KEY.enter:
                    case cc.KEY.dpadCenter:
                        break;
                    case cc.KEY.back:
                    case cc.KEY.escape:
                        if (GD.mainScene.helpLayer)
                            event.stopPropagation();
                        break;
                }
                
            }.bind(this),
            onKeyReleased: function (code, event) {

                switch (code) {

                    case cc.KEY.enter: 
                    case cc.KEY.dpadCenter:
                        if (!this.useKeyboard)
                            break;
                        this.shared.selected.onClick && this.shared.selected.onClick();
                        // 操作后如果不可见
                        if(!this.shared.selected.isVisible())
                        {
                            this.setSelectPanal();
                        }
                        break;
                    case cc.KEY.back:
                    case cc.KEY.escape:
                        if (GD.mainScene.helpLayer) {
                            GD.mainScene.helpLayer.onButtonHandler();
                            event.stopPropagation();
                        }
                        break;
                }
            }.bind(this),
        });
        cc.eventManager.addListener(this.keyboardListener, -1);
    },
    onExit: function () {
        this._super();
        if (this.keyboardListener)
            cc.eventManager.removeListener(this.keyboardListener); 
    }
});




