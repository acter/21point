var GD = require("GD")

var Helper = {};

/**
 * 微信登录的回调，一个参数是openid
 * @type (openid)=>{}
 */
Helper.wxLoginCallBack = null;

/**
 * 微信分享的回调
 * @type  (errCode)=>{}
 */
Helper.wxShareCallBack = null;


Helper.formatStr = function (num, sep, chars) {
    var num = (num || 0).toString(),
        result = '';
    while (num.length > chars) {
        result = sep + num.slice(-chars) + result;
        num = num.slice(0, num.length - chars);
    }
    if (num) {
        result = num + result;
    }
    return result;
}

//一个数字字符串，从右到左每隔3位加入一个逗号(1234567890 --> 1,234,567,890)
Helper.toThousands = function (src) {
    return this.formatStr(src, ",", 3)
}
//转换为万字
Helper.to10Thousands = function (src) {
    return this.formatStr(src, " ", 4)
}

//数字转x.x(万)
Helper.toWan = function (src) {
    return Math.floor(src / 1000) / 10
}


Helper.md5 = function (src) {
    return SparkMD5.hash(src).toUpperCase(); // hex hash
}


//根据座位号椅子号获取玩家
Helper.getPlayer = function (wTableID, wChairID) {

    if (GD.Tables[wTableID]) {
        var userID = GD.Tables[wTableID][wChairID]
        var players = GD.AllUsers
        if (userID && players[userID]) {
            return players[userID]
        }
    }
}

/**
 * 金额小写转大写
 * @param n
 * @returns {*}
 */
Helper.convertMoneyToCapitals = function (n) {
    if (n == 0) {
        return "零"
    }
    if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(n))
        return "数据非法";
    var unit = "万千百拾亿千百拾万千百拾元",
        str = "";
    n += ""
    var p = n.indexOf('.');
    if (p >= 0)
        return "数据非法";
    unit = unit.substr(unit.length - n.length);
    for (var i = 0; i < n.length; i++)
        str += '零壹贰叁肆伍陆柒捌玖'.charAt(n.charAt(i)) + unit.charAt(i);
    return str.replace(/零(千|百|拾|角)/g, "零").replace(/(零)+/g, "零").replace(/零(万|亿|元)/g, "$1").replace(/(亿)万|壹(拾)/g, "$1$2").replace(/^元零?|零分/g, "").replace(/元$/g, "");
};


Helper.getGUid = function () {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}


//创建预设
Helper.creatNode = function (prefab_name, cb) {


    cc.loader.loadRes(prefab_name, function (err, prefab) {
        var newNode = cc.instantiate(prefab);
        cb(newNode)
    })
}


//弹框
/**
 * @style     (0,null)= 确定  1=确认 + 取消
 * @cb   点了确定之后回调，
 */
Helper.MessageBox = function (text, style, cb) {

    cc.loader.loadRes("prefab/panel_messagebox", function (err, prefab) {
        var newNode = cc.instantiate(prefab);
        cc.find("Canvas").addChild(newNode);
        var script = newNode.getComponent("panel_messagebox")
        script.MessageBox(text, style, cb)

    })
}

/**
 * 屏幕旋转
 * @isPortrait 是否竖屏
 */
Helper.JsBridge = function (isPortrait, callback) {
    var frameSize = cc.view.getFrameSize();
    if (Helper.isOrientationP() === isPortrait) {
        console.log("屏幕方向正确，不需要改变")
        callback && callback();
        return;
    }

    if (cc.sys.isBrowser) {
        cc.view.setFrameSize(frameSize.height, frameSize.width);

        if (isPortrait)
            cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
        else
            cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);

        callback && callback();
        return;
    }

    let num = isPortrait === true ? 2 : 1;

    console.log("开始调整屏幕方向");
    if (cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "setOrientation", "(I)V", num);
    }
    else if (cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("AppController", "changeOrientation:", isPortrait);
    }

    setTimeout(function () {
        console.log("回调");
        callback && callback();
    }, 100);

};

/**
 * 切换到游戏场景
 */
Helper.loadGameScene = function () {
    Helper.JsBridge(false, () => {
        cc.director.loadScene("sss");
    });
};

/**
 * 切换到大厅场景
 */
Helper.loadHallScene = function () {
    Helper.JsBridge(true, () => {
        cc.director.loadScene("ssshall");
    });
};

Helper.isOrientationP = function () {
    var frameSize = cc.view.getFrameSize();
    return frameSize.height > frameSize.width;
};

/**
 * 微信登录，非原生调用无效
 */
Helper.wxLogin = function () {
    if (!cc.sys.isNative) return;

    if (cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("cn/dapenggame/lxsss/SDKManager", "wxLogin", "()V");
    }
    else if (cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("PlatformSystem", "WxLogin");
    }
};

/**
 * 微信分享文本
 * @param text 文字内容
 * @param isTimeLine true表示朋友圈，false好友
 */
Helper.wxShareText = function (text, isTimeLine) {
    if (!cc.sys.isNative) return;

    if (cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("cn/dapenggame/lxsss/SDKManager", "wxLogin", "()V");
    }
    else if (cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("PlatformSystem", "wxShareTextWithText:shareScene", text, isTimeLine ? 1 : 0);
    }
};

/**
 * 截图整个屏幕并分享给好友
 */
Helper.wxShareCurrentScreen = function () {
    var rootNode = cc.find("Canvas");
    Helper.shareScreenShoot(rootNode, null, true, 0);
};

/**
 * 微信截图分享分享给好友
 * @param shareNode 截屏节点
 * @param hideNodes 隐藏节点
 * @param hasMask 是否有mask
 * @param isTimeLine 1表示朋友圈，0好友
 */
Helper.shareScreenShoot = function (shareNode, hideNodes, hasMask, isTimeLine) {
    if (!cc.sys.isNative) {
        return;
    }
    //如果待截图的场景中含有 mask，请使用下面注释的语句来创建 renderTexture
    var renderTexture;
    if (!hasMask) {
        renderTexture = cc.RenderTexture.create(shareNode.width, shareNode.height);
    } else {
        renderTexture = cc.RenderTexture.create(shareNode.width, shareNode.height, cc.Texture2D.PIXEL_FORMAT_RGBA8888, gl.DEPTH24_STENCIL8_OES);
    }
    //实际截屏的代码
    var position = shareNode.position;
    renderTexture.begin();
    shareNode.position = cc.p(shareNode.width / 2, shareNode.height / 2);

    if (hideNodes) {
        Helper.setChildVisible(hideNodes, false);
        hideNodes.active = false;
    }

    shareNode._sgNode.visit();
    renderTexture.end();
    let fileName = "share_lxsss.jpg";
    var imagePath = jsb.fileUtils.getWritablePath() + fileName;
    //saveToFile 默认是放在jsb.fileUtils.getWritablePath()的路径中，只能传入文件名
    renderTexture.saveToFile(fileName, cc.ImageFormat.PNG, true, function () {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            console.log("调用接口");
            jsb.reflection.callStaticMethod("cn/dapenggame/lxsss/SDKManager", "WxShareImage", "(Ljava/lang/String;I)V", imagePath, isTimeLine);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            return jsb.reflection.callStaticMethod("PlatformSystem", "wxShareImage:scene:", imagePath, isTimeLine);
        }

        shareNode.position = position;
        GameTools.setChildVisible(hideNodes, true);

    });
}

/**
 * 微信分享图片
 * @param imgFilePath 图片路径
 * @param isTimeLine true表示朋友圈，false好友
 */
Helper.wxShareImage = function (imgFilePath, isTimeLine) {
    if (!cc.sys.isNative) return;

    if (cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("cn/dapenggame/lxsss/SDKManager", "WxShareImage", "(Ljava/lang/String;I)V", imgFilePath, isTimeLine);
    }
    else if (cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("PlatformSystem", "wxShareImage:scene：", imgFilePath, isTimeLine ? 1 : 0);
    }
};

/**
 * 微信分享网页链接
 * @param url 网页URL
 * @param title 标题
 * @param content 内容
 * @param isTimeLine true表示朋友圈，false好友
 */
Helper.wxShareWebUrl = function (url, title, content, isTimeLine) {
    if (!cc.sys.isNative) return;

    if (cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("cn/dapenggame/lxsss/SDKManager", "shareWebUrl", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Z)V"
            , url, title, content, isTimeLine);
    }
    else if (cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("PlatformSystem", "WxShareWebUrl:title:description:scene:", url, title, content, isTimeLine ? 1 : 0);
    }
};

/**
 * 隐藏或显示子节点
 * @param node 父节点
 * @param active 显示或隐藏
 */
Helper.setChildVisible = function (node, active) {
    if (!node) {
        return;
    }

    for (var index in node) {
        node[index].active = active;
    }
};

Helper.getGameVersion = function () {
    if (!cc.sys.isNative) return;

    let version;
    if (cc.sys.os === cc.sys.OS_ANDROID) {
        version = jsb.reflection.callStaticMethod("cn/dapenggame/lxsss/SDKManager", "getGameVersion", "()Ljava/lang/String;");
    }
    else if (cc.sys.os === cc.sys.OS_IOS) {
        version = jsb.reflection.callStaticMethod("PlatformSystem", "getIOSGameVersion");
    }

    console.log("version==" + version);

    return version;
};

module.exports = Helper;