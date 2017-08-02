const EventBase = require('./EventBase');
const Inherits = require ('../inherits');
const Utils = require('../../../util/utils');

function EventElect(param) {
    EventBase.call(this,param);
}

module.exports = EventElect;
Inherits(EventElect,EventBase);

let pro = EventElect.prototype;

pro.begin = function() {
    this.createRoundGroup();
    this.isAscent = true;

    let startStep;
    if (this.pGame.sheriffId > 0) {  //有警长
        this.sheriffId = this.pGame.sheriffId;
        startStep = 'Order';
    } else {
        //随机顺序；
        this.currId = this.findNextId();
        this.nextId = this.findNextId(this.currId);
        startStep = 'EventFight';
    }
    
    this.startEvent(startStep);
}

pro.getStepMsg = function(stepName) {
    let msg = {};

    switch (stepName) {
        case 'Order':  //警长决定发言顺序
            let leftId = this.findNextId(this.sheriffId,false);
            let rightId = this.findNextId(this.sheriffId,true);
            //默认为警右发言，如果玩家没有选择就以此为准。先设置好默认状态：
            this.currId = rightId;      
            this.nextId = this.findNextSpeaker(this.currId,true);
            //发送消息等待警长选择：
            msg = {leftId: leftId, rightId: rightId};
        break;

        case 'Result':
            let index;
            if (this.resultId > 0) {
                let player = this.playersMap[this.resultId];
                index = player.index;
            } 
            msg = {index: index, isElectOver: true};
        break;  
    }

    return msg;
}

pro.getNextStep = function(stepName) {
    let nextStep;

    switch(stepName) {
        case 'Order':
            nextStep = 'EventFight';            
        break;

        case 'EventFight':
            this.resultId = this.pGame.resultId;
            nextStep = 'Result';
        break;

        case 'Result':
            if (this.resultId > 0) {
                let player = this.playersMap[this.resultId];
                player.isDead = true;
                player.hasLastWords = true;
                this.deadGroup = [player.index];
                nextStep = 'EventDeath';
            } else {    //平安日
                this.stopEvent();
            }   
        break;

        case 'EventDeath':
            this.stopEvent();
        break;
    }

    return nextStep;
}

//每轮正式发言的投票组和被投票组（均为全体）
pro.createRoundGroup = function() {
    let elects = [];    //选举组 （被投票）
    let votes = [];     //投票组
    let waits = [];     //不能投票的组，这里为已出局玩家

    for (let i in this.players) {
        let player = this.players[i];
        player.hasDone = false;     //清除发言结束标记
        let id = player.id;
        if (!player.isDead) {
            elects.push(id);
            votes.push(id);
        } else {
            waits.push(id);
        }
    }

    this.electsGroup = elects;
    this.votingGroup = votes;
    this.waitingGroup = waits;

    this.speechGroup = this.electsGroup;    //设置发言组
}

pro.findNextId = function(srcId,isAscent) {
    isAscent = isAscent || this.isAscent;
    return this.pGame.findNextId(this.electsGroup,srcId,isAscent);
}

pro.onSheriffOrder = function(msg) {
    if (this.controller.curStep === 'Order') {
        if (msg.isLeft) {
            this.isAscent = false;
            this.currId = this.findNextId(this.sheriffId,false);
            this.nextId = this.findNextId(this.currId,false);
        }
        this.controller.jumpTo('EventFight');
    }
}