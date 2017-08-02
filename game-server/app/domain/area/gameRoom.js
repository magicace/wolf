//运行在gameServer上
const ChannelUtil = require('../../util/channelUtil');
const Code = require('../../../../shared/code');
const UserDao = require('../../dao/userDao');
const AreaType = require('../../consts/areaType');
const Consts = require('../../consts/consts');
const Utils = require('../../util/utils');

// const EventEmitter = require ('./emitter');
const PlayerMaker = require('./playerMaker');
const StepManager = require('./stepManager');

const Controller = require('./controller');

let GameRoom = function(param) {
    this.app = param.app;
    this.id = param.roomId;
    this.typeId = param.typeId;  

    this.players = [];
    this.wolves = [];
    // this.roomGroup = [];    //用于组消息发送，全房间同时发送，消息不一定相同时。
    this.dayCount = 0;
    this.isAscent = true;       //默认发言顺序为升序。
    this.playersMap = {};
    this.isElectOver = false;

    this.channelService = this.app.get('channelService');
    this.roomChannel = this.channelService.getChannel(ChannelUtil.getRoomChannelName(this.id),true);
    this.wolfChannel = this.channelService.getChannel(ChannelUtil.getWolfChannelName(this.id),true);
;
    this.pGame = this;
    let self = this;
    setTimeout(()=>{    //GameRoom初始化完毕之后再启动控制器。
        let attr = {pEvent: self, name: 'Main'};
        self.controller = new Controller(attr);
        self.controller.init('Start');
    },100);
 
}
// require('util').inherits(GameRoom,EventEmitter);

module.exports = GameRoom;
let pro = GameRoom.prototype;

pro.changeGameController = function(pController) {
    this.curController = pController;
},

pro.sendRoomMsg = function(route,msg) {
    this.roomChannel.pushMessage({route:route,msg:JSON.stringify(msg)},null);
}

pro.sendWolfMsg = function(route,msg) {
    this.wolfChannel.pushMessage({route:route,msg:JSON.stringify(msg)},null);
    // this.channelService.pushMessageByUids({route:route,msg:msg},this.wolvesChannel,null);
}


/**
 * Add player group into the room.
 * @param {Object} players add players' group.
 * @return {Boolean} return if success or fail
 */
pro.addGroup = function(players) {  
    for (let i in players) {
        //记录roomId，用于断线重连。
        let player = players[i];
        UserDao.setRoomId(this.id, player.id, function(err,res) {
            if (err) {
                console.log('update roomId of player %j failed!',player.id);
            }
        });
    }

    this.createRole(players);
    return true;
}

pro.createRole = function(players) {
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
    Utils.shuffle(t);   //打乱职业顺序，按玩家在匹配房间的顺序依次认领职业

    for (let i in players) {
        let player = players[i];
        player.role = t[i];
        player.pGame = this;

        //下面创建了一个新的带职业定义的对象，它的地址是新的地址。
        player = PlayerMaker(player);
        this.players.push(player);
        this.playersMap[player.id] = player;
        if (player.role === Consts.RoleType.WOLF) {
            this.wolves.push(player.id);
        }
    }

    Utils.shuffle(this.players);
    Utils.shuffle(this.players);    //打乱玩家座位顺序

    for (let i=0; i < this.players.length; ++i) {
        this.players[i].index = i + 1;      //给每个玩家设置序号（座位号）
        // this.roomGroup[i] = player[i].id;   //保存一个全房间的消息组；
    }

    //预先计算好，后续onPlayerEnterRoom的时候就不需要进来一个算一次了。空间换时间。
    this.outPlayers = this.getOutPlayers(); 
}

pro.onPlayerEnterRoom = function(playerId,uid,sid) {
    let outMsg = {
        players : this.outPlayers
    };

    let player = this.playersMap[playerId];
    player.init(uid,sid);

    outMsg.role = player.role;
    if (player.role === Consts.RoleType.WOLF) {
        this.wolfChannel.add(uid,sid);
        outMsg.wolves = this.wolves;
    }

    this.roomChannel.add(uid,sid);

    return outMsg;
}

pro.onTargetSelected = function(playerId,msg,cb) {
    let player = this.playersMap[playerId];
    let curStepName = this.curController.curStep.name;
    if (curStepName === 'MoveBadge') {
        let targetPlayer = this.players[targetPlayer];
        if (!targetPlayer.isDead) {
            targetPlayer.isSheriff = true;
            this.sheriffId = targetPlayer.id;
            this.noticeSheriff(targetPlayer.id);
            this.curController.skip();
        }
    } else {
        player.setStepTarget(curStepName, msg);
    }
    
    cb(Code.OK);
}

pro.onSheriffOrder = function(playerId,msg,cb) {
    if (playerId === this.sheriffId) {
        // if (msg.isLeft) {
        //     this.currId = this.findNextSpeaker(this.sheriffId,false);
        //     this.nextId = this.findNextSpeaker(this.currId,false);
        //     this.isAscent = false;
        // }
        // cb(Code.OK);
        // // this.jumpTo('SpeechA');
        // this.curController.jumpTo('SpeechA');

        if (this.controller.curStep === 'EventDay') {
            this.controller.curStep.onSheriffOrder(msg);
            cb(Code.OK);
        }
    } else {
        cb(Code.AREA.FA_PLAYER_NOT_FIT);
    }
}

pro.onElectJoin = function(playerId,cb) {
    let code;
    if (this.curController.curStep.name === 'ElectA') {
        let player = this.playersMap[playerId];
        player.isJoin = true;
        code = Code.OK;
    } else {
        code = Code.AREA.FA_ROOM_OUTOFTIME;
    }
    cb(code);
}

pro.onElectAbstain = function(playerId,cb) {   
    if (this.controller.curStep.name === 'EventElect') {    //当前主线进程到选举事件      
        this.controller.curStep.onElectAbstain(playerId);
    } else {
        console.log("========================= !!!!!!!!!!!!!!!!!!!!")
    }

    cb(Code.OK);
}

//玩家主动跳过发言
pro.onSkipSpeech = function(playerId,cb) {
    if (playerId === this.curController.pEvent.currId && this.curController.curStep.name === 'SpeechA') {
        cb(Code.OK);
        this.curController.jumpTo('SpeechB');
    } else {
        cb(Code.AREA.FA_ROOM_OUTOFTIME);
    }
}

pro.noticeDeath = function(playerId,reasonId) {
    this.sendRoomMsg('onPlayerDied',{playerId:playerId, reasonId: reasonId});
}

pro.noticeSheriff = function(playerId) {
    this.sendRoomMsg('onBeSheriff', {playerId:playerId});
}

/**
 * 提供给客户端房间所有玩家的简单资料，需要什么提供什么。
 * 主要用于断线重连。
 * @param players 输入指定的玩家组，默认为本房间所有玩家。
 * @return 返回信息
 *  */
pro.getOutPlayers = function(players) {
    players = players || this.players;
    let outGroup = [];
    for (let i in players) {
        let player = players[i];
        let out = {
            id: player.id,
            // name: player.name,
            icon: player.icon,
        }
        // if (player.isOut) {
        //     out.isOut = true;
        // }
        outGroup.push(out);
    }
    return outGroup;
},

//清除所有玩家选择的目标
pro.clearTarget = function() {
    for (let i in this.players) {
        let player = this.players[i];
        player.target = 0;
    }
},


//获取狼人夜间刀人的结果
pro.getWolfKilled = function() {
    let group = this.getMaxGroup(this.wolves);
    // console.log("=========被杀==========：",group);
    let num = group.length;
    if (num > 0) {
        let idx = num > 1 ? Math.floor(Math.random()*num) : 0;
        let player = this.players[group[idx] - 1];
        player.isKilled = true;
        this.killIndex = player.index;
    } else {
        this.killIndex = null;
    }

}

//获得夜间死亡玩家组。
pro.getDeadGroup = function() {
    let group = [];
    for (let i in this.players) {
        let player = this.players[i];
        if (player.isKilled) {
            if (player.isCure && player.isProtected) {
                //奶穿了
                player.isDead = true;
                group.push(player.index)

            } else if (player.isCure || player.isProtected) {
                //女巫开药或者守卫守护了
                player.isKilled = false;

            } else {
                player.isDead = true;
                group.push(player.index);
            }
        }

        if (player.isPoison) {
            //女巫开毒
            if (!player.isDead) {  //防止同刀同毒
                player.isDead = true;
                group.push(player.index);
            }
        }
    }

    Utils.shuffle(group);   //死亡次序不分先后。
    return group;
}

//获得当前投票组内，票数最多的目标组（可能多个平票）。
//包括夜间狼人选择目标、警长选举以及白天公投等所有投票情况。
pro.getMaxGroup = function(group) {
    let result = {};
     
    for (let i in group) {
        let playerId = group[i];
        let player = this.playersMap[playerId];
        let target = player.target;
        if (target > 0 ) {
            if (result[target] === undefined) {
                result[target] = 1
            } else {
                ++result[target];
            }
        }

        player.target = 0;  //清除选择项
    }

    //找到最大值
    let max = 0;
    for (let key in result) {
        if (result[key] > max) {
            max = result[key];
        }
    }

    let targets = [];
    for (let key in result) {
        if (result[key] === max) {
            targets.push(key);
        }
    }
    return targets;
}

// //确实选举结果
// pro.setVoteResult =  function(votingGroup) {
//     let targets = this.getMaxGroup(votingGroup);
//     let resultId
//     if (targets.length === 0) {
//         resultId = -1;
//     } else if (targets.length === 1) {
//         let index = targets[0];
//         let player = this.players[index-1];
//         resultId = player.id;
//     } else {  //两人以上平票
//         resultId =  null;
//         //重新设置要pk的竞选组(如果还需要pk的话，会使用到)
//         for (let i in targets) {
//             let index = targets[i];
//             let player = this.players[index-1];
//             player.isJoin = true;
//         } 
//     }
    
//     this.resultId = resultId;
// }

//获得指定Id组的下一个可用的Id(未发言)
pro.findNextId = function(group,srcId,isAscent) {
    isAscent = isAscent || this.isAscent;
    let nextId = Utils.findNextId(group,srcId,isAscent);
    if (nextId) {
        let player = this.playersMap[nextId];
        if (player.hasDone) {
            nextId = null;
        }
    }
    return nextId;
}

//获得指定Step下，发送给客户端的消息。这里的消息都是房间消息。
//给采用“Step”类或继承之后未重写begin()函数的所有Step，做通用阶段开始处理函数。
//需要单独发消息的，应通过继承Step类，在begin()函数内自行设定。
pro.getStepMsg = function(stepName) {
    let msg = {};

    switch (stepName) {
        case 'Dark':
            ++this.dayCount;
            msg = {dayCount: this.dayCount};
        break;

        case 'DeathNews':   //发布死讯
            msg = {group: this.deadGroup};
        break; 
    }
    
    return msg;
}

//获得指定Step结束时候，下一步的流程，并做一些相应处理。
//给采用“Step”类或者继承之后未重写end()函数的Step，做通用的阶段结束处理函数。
pro.getNextStep = function(stepName) {
    let nextStep;
    switch (stepName) {
        case 'NightA':
            this.getWolfKilled();
        break;

        case 'Dawn':
            this.deadGroup = this.getDeadGroup();
            this.clearTarget();
            if (this.dayCount > 2 && !this.isElectOver) {
                this.isElectOver = true;
            }
            nextStep = this.isElectOver ? 'DeathNews' : 'EventElect'; 
        break;

        case 'EventElect':
            nextStep = 'DeathNews';
        break;

        case 'DeathNews':   //夜间的死讯
            if (this.dayCount === 1) {
                for (let i in this.deadGroup) {
                    let index = this.deadGroup[i];
                    let player = this.players[index-1];
                    player.hasLastWords = true;
                }
            }
            nextStep = 'EventDeath';
        break;
        
        case 'EventDeath':
            nextStep = 'EventDay';
        break;

        case 'EventDay':
            nextStep = 'Dark';
        break;
    }

    this.preStep = stepName;
    return nextStep;
}
