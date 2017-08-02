//游戏步骤控制基类，包含消息处理和后续步骤的处理
const Base = require ('./Base');
const Inherits = require ('../inherits');

Step = function(param) {
    Base.call(this,param);
}

module.exports = Step;
Inherits(Step,Base);
let pro = Step.prototype;

pro.begin = function() {
    let msg = this.pSuper.getStepMsg(this.name);
    msg.delay = this.delay;
    this.pGame.sendRoomMsg(this.route,msg);
}

pro.end = function() {
    let nextStep = this.pSuper.getNextStep(this.name);
    if (!!nextStep) {
        this.next = nextStep;
    }
}

