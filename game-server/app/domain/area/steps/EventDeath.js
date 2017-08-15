const EventBase = require('./EventBase');
const Inherits = require ('../inherits');
// const Utils = require('../../../util/utils');

function EventDeath(param) {
    EventBase.call(this,param);
}

module.exports = EventDeath;
Inherits(EventDeath,EventBase);

let pro = EventDeath.prototype;

pro.begin = function() {  
    this.deadGroup = this.pSuper.deadGroup;
    this.index = 0;  //控制当前死亡组的序号 
    let start = this.getValidStep();
    if (start) {
        this.startEvent(start);
    } else {
        this.isEvent = false;
    }

    //如果有一个有效的Step（有后事要处理），开启事件控制。
    //否则，由于并没有开启新的控制器，将isEvent设置为false。
    //这样它将表现为普通Step,控制器会读取它的next开始后续步骤。
}

pro.getValidStep = function() { //从后续死者组中找到第一个有效的step
    let step
    do {
        player = this.getPlayer(this.index++);
        if (!player) {          //死者组已经没有任何玩家。
            break;
        }
        step = this.getPlayerStep();
    } while (!step);
    return step;
}

//从死者组中找到当前序号的玩家并返回。
pro.getPlayer = function(index){
    let player;
    if (index < this.deadGroup.length) {
        let playerIndex = this.deadGroup[index];
        player = this.players[playerIndex-1];
        player.isDead = true;  //彻底死亡状态，后续此玩家就出局了。
        this.player = player;
        this.currId = player.id;
    }
    return player;
}

//按顺序查找指定玩家尚存的死亡事件步骤。
pro.getPlayerStep = function() {
    let player = this.player;
    let step = player.hasLastWords ? 'SpeechA' 
        : (player.hasDeathSkill ? 'LastSkill' 
        : (player.isSheriff ? 'MoveBadge' : null));
    return step;
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

        case 'MoveBadge':
            this.pGame.sheriffId = -1;
            break;

        case 'Sheriff':
            let index;
            if (this.pGame.sheriffId > 0) {
                let player = this.playersMap[this.pGame.sheriffId];
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
        case 'SpeechA':
            nextStep = 'SpeechB';
            break;
        case 'SpeechB':
            this.player.hasLastWords = false;       //遗言已经讲完。
            nextStep = this.getPlayerStep();
            break;
        case 'LastSkill':
            this.player.hasDeathSkill = false;      //死亡技能已经用了。
            nextStep = this.getPlayerStep();
            break;

        case 'MoveBadge':
            this.player.isSheriff = false;          //警徽已经移交或者撕毁。
            nextStep = 'Sheriff';                   //显示警徽移交情况。
            break;

        case 'Sheriff':
            // nextStep = this.getPlayerStep();     //按当前设定，后续一定是null
            nextStep = null;
            break;

    }


    if (!nextStep) {    //当前玩家没有后续步骤，找下一个玩家
        nextStep = this.getValidStep();
        if (!nextStep) {    //所有玩家都没有后续步骤
            return this.stopEvent();
        }
    }



    return nextStep;
}