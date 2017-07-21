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

let GameRoom = function(param) {
    this.app = param.app;
    this.id = param.roomId;
    this.typeId = param.typeId;

    this.players = [];
    this.wolves = [];
    // this.roomGroup = [];    //用于组消息发送，全房间同时发送，消息不一定相同时。
    this.dayCount = 0;

    this.playersMap = {};
    this.isElectOver = false;

    this.channelService = this.app.get('channelService');
    this.roomChannel = this.channelService.getChannel(ChannelUtil.getRoomChannelName(this.id),true);
    this.wolfChannel = this.channelService.getChannel(ChannelUtil.getWolfChannelName(this.id),true);

    //自定义通道
    // this.wolvesChannel = [];
    // this.commonChannel = [];
    
    //等待5000毫秒，游戏开始。
    // let self = this;
    // setTimeout(function(){
    //     return self.gameLoop('Start');
    // },5000);

    //Start已经作为一个阶段写入游戏阶段配置，在此配置中设置延时。
    this.gameLoop('Start');
}

// require('util').inherits(GameRoom,EventEmitter);

module.exports = GameRoom;
let pro = GameRoom.prototype;
// EventEmitter(pro);


pro.sendRoomMsg = function(route,msg) {
    this.roomChannel.pushMessage({route:route,msg:JSON.stringify(msg)},null);
}

pro.sendWolfMsg = function(route,msg) {
    this.wolfChannel.pushMessage({route:route,msg:JSON.stringify(msg)},null);
    // this.channelService.pushMessageByUids({route:route,msg:msg},this.wolvesChannel,null);
}


// pro.sendGroupMsg = function(route,group) {
//     for (let i in group) {
//         let playerId = group[i];
//         let player = this.playersMap[playerId];
//         player.sendOwnMsg(route);
//     }
// }


pro.gameLoop = function(stepName) {
    console.log('===== the step name is: ',stepName);
    let curStep = StepManager(this,stepName);
    this.curStep = curStep;
    curStep.begin();
    
    let self = this;
    let interval = curStep.getInterval();
    this.timer = setTimeout(function(){
        curStep.end();
        let nextStep = curStep.getNext();
        if (nextStep) {
            return self.gameLoop(nextStep);
        }
    },interval);
    
}

pro.jumpTo = function(stepName) {
    clearTimeout(this.timer);
    this.gameLoop(stepName);
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
    player.setStepTarget(this.curStep.name, msg);

    cb(Code.OK);
}

pro.onElectJoin = function(playerId,cb) {
    let code;
    if (this.curStep.name === 'ElectA') {
        let player = this.playersMap[playerId];
        player.isJoin = true;
        code = Code.OK;
    } else {
        code = Code.AREA.FA_ROOM_OUTOFTIME;
    }
    cb(code);
}

pro.onElectAbstain = function(playerId,cb) {
    let player = this.playersMap[playerId];

    if (playerId === this.nextId) {             //处理下一个发言者退出竞选的情况
        this.nextId = this.findNextSpeaker(this.electsGroup,this.nextId);
        // if (this.curStep.name === 'SpeechB') {  //发言准备阶段,即将发言，不允许放弃，目前设定只1秒。
        //     console.log('================ 发言准备阶段不能放弃');
        //     cb(Code.AREA.FA_ROOM_OUTOFTIME);
        //     return;
        // } else {    // 其他情况，查找下一个发言者。
        //     this.nextId = this.findNextSpeaker(this.electsGroup,this.nextId);
        // }
    }

    player.isJoin = false;
    this.sendRoomMsg('onElectAbstain',{playerId:playerId});
    cb(Code.OK);

    console.log("==========abstain=========:",this.electsGroup,playerId);
    Utils.removeFromArray(this.electsGroup,playerId);
    
    if (this.electsGroup.length === 1) {
        this.resultId = this.electsGroup[0];
        this.isElectBreak = true;
        this.jumpTo('SpeechB');
    } 
}

//玩家主动跳过发言
pro.onSkipSpeech = function(playerId,cb) {
    if (playerId === this.currId && this.curStep.name === 'SpeechA') {
        this.jumpTo('SpeechB');
        cb(Code.OK);
    } else {
        cb(Code.AREA.FA_ROOM_OUTOFTIME);
    }
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

//创建选举分组，分为警上组和投票组
pro.createElectGroup = function() {
    let elects = [];    //选举组 （警上组），会因退水变化
    let votes = [];     //投票组 （警下组）
    let waits = [];     //不能投票的组，初始等同上警组，不受退水影响

    for (let i in this.players) {
        let player = this.players[i];
        player.hasDone = false;     //清除发言结束标记
        if (player.isJoin) {
            elects.push(player.id);
            waits.push(player.id);
            player.isJoin = false;  //清除标记
        } else {
            votes.push(player.id);
        }
    }

    this.electsGroup = elects;
    this.votingGroup = votes;
    this.waitingGroup = waits;
    console.log("============= 警上组：",elects);
    console.log("============= 警下组：",votes);
}

//创建即将发言的组，排除已出局玩家
pro.createIdGroup = function() {
    let group = [];
    for (let i in this.players) {
        let player = this.players[i];
        if (!player.isDead) {
            group.push(player.id);
        }
    }
    return group;
}

//查找下一个合格的发言者
pro.findNextSpeaker = function(idGroup,srcId,isAscent) {
    isAscent = isAscent || true;

    let findId;
    let len = idGroup.length;

    if (!srcId) {   //没有初始位置，随机产生一个开始位置
        let index = Utils.rand(len - 1);
        findId = idGroup[index];
    } else {
        if (len <= 1) {
            findId = null;
        } else {
            //找到srcId在群组中的位置
            let index = null;
            for (let i=0; i<len; ++i) {  
                if (idGroup[i] === srcId) {
                    index = i;
                    break;
                }
            }

            // 这里判断条件不能用（！index)，因为 ！0 = true;
            if (index === null) {   //异常情况，正常不应该出现，一定是程序逻辑有什么地方有问题。
                console.log('===================, cannot find the srcId !!!');
                console.log(idGroup,index,srcId);
                return null;
            }

            index += isAscent ? 1 : -1;
            if (index < 0) {
                index = len - 1;
            } else if (index === len) {
                index = 0;
            }

            let pId = idGroup[index];
            let player = this.playersMap[pId];
            findId = player.hasDone ? null : pId;
        }
    }

    return findId;
}

//获得投票结果以及后续Step
pro.getVoteResult =  function() {
    let targets = this.getMaxGroup(this.votingGroup);
    let resultId, nextStep;
    nextStep = 'Result';
    if (targets.length === 0) {
        resultId = -1;
        // nextStep = 'Result';
    } else if (targets.length === 1) {
        let index = targets[0] - 1;
        let player = this.players[index];
        resultId = player.id;
        // nextStep = 'Result';
    } else {  //两人以上平票
        if (this.isElectAgain) {    //已经是第二轮投票
            resultId =  -1;
            this.isElectAgain = false;  //清除标记，后续发言阶段还会用到。
            // nextStep = 'Result';
        } else {
            resultId = null;
            this.isElectAgain = true;
            console.log("=============== 平票 ",targets);
            for (let i in targets) {
                let index = targets[i];
                let player = this.players[index-1];
                player.isJoin = true;
            }
            this.createElectGroup();
            nextStep = 'ElectB';
        }
    }

    return {id:resultId,nextStep:nextStep};
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

        case 'SpeechA':
        case 'SpeechB':
            msg = {playerId: this.currId, isOver: stepName==='SpeechB'};
        break;

        case 'ElectB':
            msg = {elects:this.electsGroup};
        break;        

        case 'VotingB':
            let tickets = {};   //每个投票者的票型
            for (let i in this.votingGroup) {
                let playerId = this.votingGroup[i];
                let player = this.playersMap[playerId];
                tickets[player.index] = player.target;
            }
            msg = {tickets:tickets};
        break;

        case 'Result':
            let index;
            if (this.resultId > 0) {
                let player = this.playersMap[this.resultId];
                index = player.index;
            } 
            msg = {index: index, isElectOver: this.isElectOver};

        break;
    }
    
    return msg;
}

//获得指定Step结束时候，下一步的流程，并做一些相应处理。
//给采用“Step”类或者继承之后未重写end()函数的Step，做通用的阶段结束处理函数。
pro.getNextStep = function(stepName) {
    let nextStep;
    switch (stepName) {
        case 'Dawn':
            this.deadGroup = this.getDeadGroup();
            this.clearTarget(); //清除所有选择目标；
            nextStep = this.isElectOver ? 'ShowDead' : 'ElectA'   
        break;

        case 'NightA':
            this.getWolfKilled();
        break;

        case 'ElectA':
            this.createElectGroup();
            let elects = this.electsGroup;
            let count = elects.length;
            if (count === 0) {
                this.resultId = -1;
                nextStep = 'Result';
            } else if (count === 1) {
                this.resultId = elects[0];
                nextStep = 'Result';
            } else {
                nextStep = 'ElectB';
            }
        break;

        case 'ElectB':
            this.speechGroup = this.electsGroup;
            this.currId = this.findNextSpeaker(this.speechGroup);
            this.nextId = this.findNextSpeaker(this.speechGroup,this.currId);
            // nextStep = 'SpeechA';
        break;

        case 'SpeechB':
            let player = this.playersMap[this.currId];
            player.hasDone = true;
            if (this.isElectBreak) {        //竞选警长阶段，弃权后只有一个候选人
                nextStep = 'Result'
            } else if (this.nextId === null) {    //发言结束，要跳出循环，视情况跳到不同的入口。
                if (this.isElectOver || this.isElectAgain) {
                    nextStep = 'VotingA';   //投票阶段
                } else {
                    nextStep = 'ElectC';    //退水阶段
                }
            } else {
                //发言准备阶段，在发言前就必须准备好下一个发言的id; （防中途下一个发言者放弃退选）
                this.currId = this.nextId;
                this.nextId = this.findNextSpeaker(this.speechGroup,this.currId);
                nextStep = 'SpeechA';
            }
        break;

        case 'VotingB':
            let result = this.getVoteResult();
            this.resultId = result.id;
            nextStep = result.nextStep;
        break;

        case 'Result':
            if (!this.isElectOver) {
                this.isElectOver = true;
                this.sheriffId = this.resultId;
            }
            nextStep = 'Pause';
        break;
    }

    return nextStep;
}
