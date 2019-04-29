/**
 * 卡牌精灵
 * Created by BiteLu on 2016/12/15.
 */
class CardSprite{
    constructor(data) {
        this.type = 0
        this._num = 0
        this._img = ""
        this.getImage(data)
    }
    // 初始化变量
    getImage(data){
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
    getType(){
        return this._type;
    }

    // 获得卡牌数字
    getNum(){
        return this._num;
    }
};
module.exports = CardSprite