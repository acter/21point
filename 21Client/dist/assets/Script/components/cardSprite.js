"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 卡牌精灵
 * Created by BiteLu on 2016/12/15.
 */
var CardSprite = function () {
    function CardSprite(data) {
        _classCallCheck(this, CardSprite);

        this.type = 0;
        this._num = 0;
        this._img = "";
        this.getImage(data);
    }
    // 初始化变量


    _createClass(CardSprite, [{
        key: "getImage",
        value: function getImage(data) {
            var types = ["a", "b", "c", "d"];
            this._type = data.type;
            this._num = data.num;

            if (this._num == 0) {
                this._img = "21dian-pkp_bm";
            } else {
                this._img = "21dian-" + types[this._type] + "_" + this._num;
            }
        }

        // 获得卡牌花色

    }, {
        key: "getType",
        value: function getType() {
            return this._type;
        }

        // 获得卡牌数字

    }, {
        key: "getNum",
        value: function getNum() {
            return this._num;
        }
    }]);

    return CardSprite;
}();

;
module.exports = CardSprite;
//# sourceMappingURL=CardSprite.js.map