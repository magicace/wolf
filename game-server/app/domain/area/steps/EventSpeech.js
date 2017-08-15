const EventBase = require('./EventBase');
const Inherits = require ('../inherits');
const Utils = require('../../../util/utils');

function EventSpeech(param) {
    EventBase.call(this,param);
}

module.exports = EventSpeech;
Inherits(EventSpeech,EventBase);

let pro = EventSpeech.prototype;

pro.begin = function() {
    this.speechGroup = this.pSuper.speechGroup;
    this.currId = this.pSuper.currId;
    this.nextId = this.pSuper.nextId;
    this.isDescent = this.pSuper.isDescent;
    this.clearSpeech();
    this.startEvent('SpeechA');
}

pro.getStepMsg = function(stepName) {
    let msg = {};
    switch (stepName) {
        case 'SpeechA':
            msg = {playerId: this.currId, isOver: false};
        break;

        case 'SpeechB':
            msg = {playerId: this.currId, isOver: true};
        break;
    }
    return msg;
}

pro.getNextStep = function(stepName) {
    let nextStep;
    switch(stepName) {
        case 'SpeechB':
            let player = this.playersMap[this.currId];
            player.hasDone = true;

            if (this.nextId !== null) {
                this.currId = this.nextId;
                this.nextId = this.findNextId(this.currId);
                nextStep = 'SpeechA';
            } else {
                this.stopEvent();
            }
        break;
    }

    return nextStep;
}

pro.clearSpeech = function() {
    for (let i in this.players) {
        let player = this.players[i];
        player.hasDone = false;
    }    
}

pro.onStopSpeech = function() {
    //正常情况下，能进入这个地方，nextId一定是null。安全起见,主动设置一下。
    this.nextId = null;
    //跳到SpeechB，是给客户端1秒时间，做关闭Mic动画。然后会结束整个事件。
    this.controller.skip();
}

pro.findNextId = function(srcId) {
    return this.pGame.findNextId(this.speechGroup,srcId,this.isDescent);
}