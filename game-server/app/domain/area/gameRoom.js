//运行在gameServer上
const ChannelUtil = require('../../util/channelUtil');
const Code = require('../../../../shared/code');
const UserDao = require('../../dao/userDao');
const AreaType = require('../../consts/areaType');
const Consts = require('../../consts/consts');
const Utils = require('../../util/utils');

const GameArray = [
    {step:'NightA',sec:30},
    {step:'NightB',sec:30},
    {step:'ElectA',sec:15},
    {step:'ElectB',sec:60},
    {step:'Speech',sec:60},
]


let GameRoom = function(param) {
    this.app = param.app;
    this.id = param.roomId;
    this.typeId = param.typeId;

    this.step = 0;
    this.players = [];
    this.wolves = [];

    
    this.channelService = this.app.get('channelService');
    let roomChannelName = ChannelUtil.getRoomChannelName(this.id);
    this.roomChannel = this.channelService.getChannel(roomChannelName,true);
    // this.wolfChannel = channelService.getChannel(wolfChannel,true);

    //自定义通道
    this.wolvesChannel = [];
    this.commonChannel = [];
    
    //等待6000毫秒，游戏开始。
    let self = this;
    setTimeout(function(){
        self.gameLoop();
    },6000);
}

module.exports = GameRoom;

let pro = GameRoom.prototype;

/**
 * Add player group into the room.
 * @param {Object} players add players' group.
 * @return {Boolean} return if success or fail
 */
pro.addGroup = function(players) {
    let bRtn = true;
    for (let i in players) {
        let player = players[i];
        if (!this.add(player)) {
            bRtn = false;
            break;
        }
    }
    return bRtn;
}

/**
 * Add one player into the room.
 * @param {Object} player single player info.
 * @return {Boolean} return if success or fail
 */
pro.add = function(player) {
    for (let i in this.players) {
        if (player.id == this.players[i].id) {
            // find duplicate player, do not add again.
            console.log("Find duplicate playerId %s in Room ...",player.id);
            return false;
        }
    }


    this.players.push(player);

    //记录roomId，用于断线重连。
    UserDao.setRoomId(this.id, player.id, function(err,res) {
        if (err) {
            console.log('update roomId of player %j failed!',player.id);
        }
    });
    return true;
}

pro.createRole = function() {
    let roles = AreaType[this.typeId].roles; 
    let types = Consts.RoleType;

    let t = [];
    for (let key in roles) {
        let num = roles[key];
        let val = types[key];
        for (let i=0; i<num; ++i) {
            t.push(val);
        }
    }

    Utils.shuffle(t);
    Utils.shuffle(t);

    for (let i in this.players) {
        let player = this.players[i];
        player.role = t[i];
        if (player.role == Consts.RoleType.WOLF) {
            this.wolves.push(player.id);
        }
    }

    Utils.shuffle(this.players);
    Utils.shuffle(this.players);
}

pro.onPlayerEnterRoom = function(playerId,uid,sid) {
    let outMsg = {
        players : this.getOutPlayers()
    }
    for (let i in this.players) {
        let player = this.players[i];
        if (player.id == playerId) {
            player.uid = uid;
            player.sid = sid;
            player.isOnline = true;

            // console.log("========playerId:",playerId,player.role);

            outMsg.role = player.role;
            if (player.role == Consts.RoleType.WOLF) {
                this.wolvesChannel.push({uid:uid,sid:sid});
                outMsg.wolves = this.wolves;
            } else {
                this.commonChannel.push({uid:uid,sid:sid});
            }

            this.roomChannel.add(uid,sid);
            break;
        }  
    }

    return outMsg;
}

pro.onTargetSelected = function(playerId,msg,cb) {

}

pro.getPlayerById = function(playerId) {
    for (let i in this.players) {
        let player = this.players[i];
        if (player.id == playerId) {
            return player;
        }
    }
    return null;
}

/**
 * @param players 输入指定的玩家组，默认为本房间所有玩家。
 * @return 返回一个提供给客户端的房间所有玩家的简单资料，需要什么提供什么。
 */
pro.getOutPlayers = function(players) {
    players = players || this.players;
    let outGroup = [];
    for (let i in players) {
        let player = players[i];
        let out = {
            id: player.id,
            name: player.name,
            icon: player.icon,
        }
        if (player.isOut) {
            out.isOut = true;
        }
        outGroup.push(out);
    }
    return outGroup;
},


pro.sendRoomMsg = function(route,msg,cb) {
    this.roomChannel.pushMessage({route:route,msg:msg},cb);
}

pro.sendWolvesMsg = function(route,msg,cb) {
    this.channelService.pushMessageByUids({route:route,msg:msg},this.wolvesChannel,cb)
}

pro.sendCommonMsg = function(route,msg,cb) {
    this.channelService.pushMessageByUids({route:route,msg:msg},this.commonChannel,cb)
}

pro.gameLoop = function() {
    // if (this.step == GameArray.length) {
    //     return;
    // }

    // let op = GameArray[this.step];
    // let sec = op.sec;
    // let self = this;
    // ++this.step;
    this.roomSerive('NightA');
}

pro.roomSerive = function(stepName) {
    if (stepName = 'NightA') {
        this.sendWolvesMsg("onWolvesAct",null,function() {
            console.log("======== wolves action ========");
        });

        this.sendCommonMsg("onNightA",null,function() {
            console.log("======== night begin ========");
        })
    }
}

pro.wolfSerivce = function(stepName) {
    // if (stepName = 'NightA') {
    //     let route = 'on' + stepName;
    //     this.wolfChannel.pushMessage({route:route,msg:null},function(){

    //     })
    // }
}

pro.wolfSelect = function(playerId,msg) {
    let outMsg = {
        playerId : playerId,
        target : msg.target,
        isOk : msg.isOk
    }
    this.sendWolvesMsg('onWolfSelect',JSON.stringify(outMsg),function(){
        console.log('wolf %j select %j, isOk = ',playerId,msg.target,msg.isOk);
    })
}

