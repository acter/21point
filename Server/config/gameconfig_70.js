module.exports = {
    "nohttps" : true,
    "LoginAddr": "ws://plazaIP:12721/Servers",
	"SC_Addr": "ws://plazaIP:12722",         //保存配置文件的服务器
    "RoomID": "70",
    "chairID": 0,
    "EnableChat": true,
    "Single": false,
    "roomIndex": 1,
    "TempFileDir": "../Temp/",          //传给我个目录， 我把产生的临时文件丢这里， 文件名filename我自己命名， 命名会有 房间号， 如果是比赛则会带上Match，例：fishCoreConfig_Match_1.json  或  fishCoreConfig_1.json, 然后最终保存的 地址 为    TempFileDir + filename
};