const EventBase = require('./EventBase');
const Inherits = require ('../inherits');
const Utils = require('../../../util/utils');

//只包括演讲阶段以及后续接投票事件。
function EventFight(param) {
    EventBase.call(this,param);
}

module.exports = EventFight;
Inherits(EventFight,EventBase);

let pro = EventFight.prototype;

pro.begin = function() {
    this.isElectOver = this.pGame.isElectOver;
    this.isElectAgain = false;

    this.speechGroup = this.pSuper.speechGroup;
    this.electsGroup = this.pSuper.electsGroup;
    this.votingGroup = this.pSuper.votingGroup;
    this.waitingGroup = this.pSuper.waitingGroup;

    this.currId = this.pSuper.currId;
    this.nextId = this.pSuper.nextId;
    this.isDescent = this.pSuper.isDescent;
    
    this.startEvent('EventSpeech');
}

pro.getStepMsg = function(stepName) {
    let msg = {};

    switch (stepName) {
        case 'ElectB':  //PK，客户端显示举手
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
    }

    return msg;
}

pro.getNextStep = function(stepName) {
    let nextStep;

    switch(stepName) {       
        case 'EventSpeech':
            if (this.isBreakElect) {
                this.stopEvent();
            } else {
                nextStep = (this.isElectOver || this.isElectAgain) ? 'VotingA' : 'ElectC';
            }
        break;

        case 'ElectB':
            this.currId = this.findNextId();
            this.nextId = this.findNextId(this.currId);
             nextStep = 'EventSpeech';
        break;

        case 'ElectC':
            if (this.isBreakElect) {
                this.stopEvent();
            } else {
                nextStep = 'VotingA';
            }

        break;

        case 'VotingB':
            this.resultId = this.getVoteResult();
            if (!this.resultId) { //平票
                if (this.isElectAgain) {
                    this.pGame.resultId = -1;
                    this.stopEvent();
                } else {
                    this.isElectAgain = true;
                    this.createElectGroup();
                    nextStep = 'ElectB';
                }
            } else {
                this.pGame.resultId = this.resultId;
                nextStep = null;
                this.stopEvent();
            }             
        break;
    }

    return nextStep;
}


//找到下一个可用的id,竞选/Pk时期都是自动顺序。
pro.findNextId = function(srcId) {
    return this.pGame.findNextId(this.electsGroup,srcId,false);
}

//客户端退水消息，只有竞选过程会被call
pro.onElectAbstain = function(playerId) {
    let player = this.playersMap[playerId];

    if (playerId === this.nextId) {     //处理下一个发言者退出竞选的情况，
        this.nextId = this.findNextId(this.nextId);
    }
    console.log("==1=electsgroup:",this.electsGroup,this.currId,this.nextId,playerId);
    player.isJoin = false;
    this.pGame.sendRoomMsg('onElectAbstain',{playerId:playerId});
    Utils.removeFromArray(this.electsGroup,playerId);

    console.log("==2=electsgroup:",this.electsGroup,this.currId,this.nextId,playerId);
    if (this.electsGroup.length === 1) {
        let curStep = this.controller.curStep;
        if (curStep.name === 'EventSpeech') {
            this.pGame.resultId = this.electsGroup[0];
            this.isBreakElect = true;
            curStep.onStopSpeech();
        } else if (curStep.name === 'ElectC') {
            this.pGame.resultId = this.electsGroup[0];
            this.isBreakElect = true;
            this.controller.skip();
        } 
    } 
}

//获取选举结果
pro.getVoteResult =  function(votingGroup) {
    let targets = this.pGame.getMaxGroup(this.votingGroup);
    let resultId
    if (targets.length === 0) {
        resultId = -1;
    } else if (targets.length === 1) {
        let index = targets[0];
        let player = this.players[index-1];
        resultId = player.id;
    } else {  //两人以上平票
        resultId =  null;
        //重新设置要pk的竞选组(如果还需要pk的话，会使用到)
        for (let i in targets) {
            let index = targets[i];
            let player = this.players[index-1];
            player.isJoin = true;
        }
    }
    
    return resultId;
}

//创建选举分组，分为警上组和投票组。用于平票pk
pro.createElectGroup = function() {
    let elects = [];    //选举组 （警上组），会因退水变化
    let votes = [];     //投票组 （警下组）
    let waits = [];     //不能投票的组，初始等同上警组，不受退水影响

    for (let i in this.players) {
        let player = this.players[i];
        let id = player.id;

        if (player.isJoin) {
            elects.push(id);
            waits.push(id);
            player.isJoin = false;  //清除标记
        } else {
            //竞选已结束，白天的投票过程，已出局玩家无权投票。
            //夜里死亡玩家isDying = true，但是isDead = false。
            //  if (this.isElectOver && player.isDead) {
            if (player.isDead) {
                waits.push(id);
            } else {
                votes.push(id);
            }
        }
        player.hasDone = false;     //清除发言完成标识
    }

    this.electsGroup = elects;
    this.votingGroup = votes;
    this.waitingGroup = waits;
    this.speechGroup = elects;

    console.log('====== 警上 =====',this.electsGroup);
    console.log('====== 警下 =====',this.votingGroup);
    console.log('====== 发呆 =====',this.waitingGroup);
}