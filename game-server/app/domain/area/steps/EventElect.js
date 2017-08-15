const EventBase = require('./EventBase');
const Inherits = require ('../inherits');
// const Utils = require('../../../util/utils');

function EventElect(param) {
    EventBase.call(this,param);
}

module.exports = EventElect;
Inherits(EventElect,EventBase);

let pro = EventElect.prototype;

pro.begin = function() {
    let startStep = (this.pGame.dayCount === 2) ? 'ElectC' : 'ElectA';
    this.startEvent(startStep);
}

pro.getStepMsg = function(stepName) {
    let msg = {};

    switch (stepName) {
        case 'ElectB':
            this.createElectGroup();
            msg = {elects:this.electsGroup};
        break;

        
        case 'Sheriff':
            let index;
            if (this.resultId > 0) {
                let player = this.playersMap[this.resultId];
                index = player.index;
            } 
            msg = {index: index};
        break;        
    }

    return msg;
}

pro.getNextStep = function(stepName) {
    let nextStep;

    switch(stepName) {
        case 'ElectA':
            nextStep = 'ElectB';
        break;
        
        case 'ElectB':
            let count = this.electsGroup.length;
            if (count === 0) {
                this.resultId = -1;
                nextStep = 'Sheriff';
            } else if (count === 1) {
                this.resultId = this.electsGroup[0];
                nextStep = 'Sheriff';
            } else {
                // this.speechGroup = this.electsGroup;
                this.currId = this.findNextId();
                this.nextId = this.findNextId(this.currId);
                this.isDescent = false;
                nextStep = 'EventFight';
            }
        break;
       
        case 'EventFight':
            this.resultId = this.pGame.resultId;
            nextStep = 'Sheriff';
        break;
        

        case 'Sheriff':
            this.pGame.isElectOver = true;
            this.pGame.sheriffId = this.resultId;
            if (this.resultId > 0) {
                let player = this.playersMap[this.resultId];
                player.isSheriff = true;
            }

            this.stopEvent();
        break;
    }

    return nextStep;
}

//创建选举分组，分为警上组和投票组。同时用于平票pk
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
            votes.push(id);
        }
    }

    this.electsGroup = elects;
    this.votingGroup = votes;
    this.waitingGroup = waits;

    // this.speechGroup = elects;
    console.log('====== 警上 =====',this.electsGroup);
    console.log('====== 警下 =====',this.votingGroup);
    console.log('====== 发呆 =====',this.waitingGroup);
}

//客户端退水消息
pro.onElectAbstain = function(playerId) {
    let curStep = this.controller.curStep;
    if (curStep.name === 'EventFight') {
        curStep.onElectAbstain(playerId);
    } else {
        console.log("*******************************!!!!!!!!!!");
    }
}

//找到下一个可用的id,竞选时期都是自动顺序。
pro.findNextId = function(srcId) {
    return this.pGame.findNextId(this.electsGroup,srcId,false);
}