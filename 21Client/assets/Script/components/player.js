
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        this.MAX_TIME = 10;
        this.baseBet = 0;
        this.betNum = 0;
        this.data = null;
        this.betNumSpr = null;
        this.buyInsuranceFlagSpr = null;
        this.progressTimer = null;
        this.cardBoxes = {};
        this.betSprites = [];
        this.insuranceBets = [];
        this.isPlaying = false;
        this.leftTime = 10;
        this.coinX = [];
        this.coinY = [];
        this.getCoinXY();
        // this.showTip()
        this.playerBg = this.node.getChildByName("21dian-playerBg")
        this.prossNode = this.playerBg.getChildByName('21dian-ui_pk_bjdt')
    },
    //加载用户数据
    loadInfo(data){
        this.data = data;
        this.userID = data.userID;
        var nickname = data.nickname;
        var faceID = data.faceID;
        var score = data.score;
        this.loadHead(faceID);
        this.loadName(nickname);
        this.loadScore(score);
    },
    //加载头像
    loadHead(img) {
        this.playerBg = this.node.getChildByName('21dian-playerBg');
        this.headImg =  this.playerBg.getChildByName('head-image');
        this.headImage = this.headImg.getChildByName('headimg');

    },
    //加载昵称
    loadName(name){
        console.log('name',name)
        this.player_name = this.playerBg.getChildByName('player-name');
        this.player_name.getComponent(cc.Label).string = name;
    },
    //加载余额
    loadScore(score){
        this.score = this.playerBg.getChildByName('gold');
        this.score.getComponent(cc.Label).string = score;
    },
    //提示位置
    showTip(){

        this.playertip = this.node.getChildByName("tip");
        this.playertip.active = true;
        var action1 = cc.scaleTo(0.2, 1.2, 1.2);
        var  action2= cc.scaleTo(0.2, 1, 1);

        var finished = cc.callFunc(function () {
           this.playertip.active = false; this.isShowTip = true;
        }, this)
        var action3 = cc.sequence(cc.sequence(action1, action2).repeat(5),finished)
        // var callFunc = cc.callFunc(this.playertip.active,false)
        this.playertip.runAction(action3);// right

    },
    //获取金币的x和y的坐标范围
    getCoinXY(){
        for(var i = -35;i<=35;i++){
            this.coinX.push(i);
            this.coinY.push(i);
        }

    },
    //

    // 初始化成员变量
    initMembers: function(data){
        this.data = data;
        this.betNum = 0;
        this.cardBoxes = {};
        this.betSprites = [];
        // this.leftTime = data.leftTime;
    },

    update:function(dt){

        this.leftTime -=dt ;
        let precent = this.leftTime /this.MAX_TIME;

        let temp =this.prossNode.getComponent(cc.Sprite);
        if(this.leftTime <= 0){
            temp.fillRange =0;
            return;
        }

        temp.fillRange = precent;
    },
    //玩家下注
    playerBet: function(bet_num,coin,spriteFrame){
        var arr = []
        if(this.betNum <20000000){//如果大于最大下注数,就停止下注
            var betNum = bet_num;
            this.score.getComponent(cc.Label).string -= bet_num;
            this.betLabel = this.playerBg.getChildByName('bet_num');
            this.betLabel.active  = true;
            this.betLabel.getComponent(cc.Label).string = Number(this.betLabel.getComponent(cc.Label).string) + Number(bet_num);
            //记录下注数
            this.betNum = Number(this.betLabel.getComponent(cc.Label).string);
            this.gold = this.node.getChildByName('gold');

            var CoinXY = this.coinX;
            // 获取随机数
            var randx = Math.floor( Math.random() * CoinXY.length );
            var randy = Math.floor( Math.random() * CoinXY.length );
            // 随机从数组中取出某值

            var coin_x = CoinXY.slice(randx, randx+1)[0];
            var coin_y = CoinXY.slice(randy, randy+1)[0];


        // [[100,5]]
            var bet_arr = this.onWagerHandler(bet_num,arr);

            coin.parent = this.gold;
            coin.getComponent(cc.Sprite).spriteFrame = spriteFrame ;
            var seq = cc.moveTo(0.3,cc.p(coin_x,coin_y))
            //金币移动
            coin.runAction(seq)


            return;
        }else{
            return;
        }
   
    },
    //下注的金币处理函数
    onWagerHandler:function(betNum,arr){
        if(betNum == 0) return;
        var arrItem = [];
        var left = 0;
        var intNum = 0;
        var base;
        var bets = [10, 100, 1000, 10000, 100000, 1000000];

        for(var i = 0;i<bets.length;i++){

            if(betNum == bets[i]){
                base = bets[i];
                intNum = Math.floor(betNum/base);
                arrItem.push(base)
                arrItem.push(intNum)
                left = 0;
                break;
            }
            if(betNum>bets[i]&&betNum<bets[i+1]){
                base = bets[i]
                intNum = Math.floor(betNum/base)
                left = betNum-intNum*base;
                arrItem.push(base)
                arrItem.push(intNum)
                break;
            }
        }
        if(arrItem.length>0) arr.push(arrItem);

        if(left>10) this.onWagerHandler(left,arr)
        return arr;//例:500下注 返回[[100,5]] 1300  [[1000,1],[100,3]]
    },
});