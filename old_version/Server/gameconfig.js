module.exports = {
    "LoginAddr": "ws://192.168.1.234:8237/Servers",
    "SC_Addr": "ws://127.0.0.1:12722",         //保存配置文件的服务器
    "RoomID": "3",
    "EnableChat": true,
    "Single": true,
    "TempFileDir": "../Temp/",          //传给我个目录， 我把产生的临时文件丢这里， 文件名filename我自己命名， 命名会有 房间号， 如果是比赛则会带上Match，例：fishCoreConfig_Match_1.json  或  fishCoreConfig_1.json, 然后最终保存的 地址 为    TempFileDir + filename

    "AndroidNum": 4,
    "ChairID": 6,

    "roomIndex": 2,
    "FreeMode": true,              //是否是体验场
    "FreeModeMoney": 1000000,      //体验房初始金额
    "FreeModeMinScore": 500000      //体验房能坐下继续游戏的最小分数 根据游戏规则自己定义，比如 牛牛 底分*5倍
};