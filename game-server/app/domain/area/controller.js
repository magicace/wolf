const StepManager = require('./stepManager');

let Controller = function(param) {
    this.pEvent = param.pEvent;
    this.name = param.name;
    this.pEvent.changeGameController(this);
}

module.exports = Controller;
let pro = Controller.prototype;

pro.init = function(stepName) {
    this.gameLoop(stepName);
}

pro.gameLoop = function(stepName) {
    console.log('===== The step name is: [%s]-%s',this.name,stepName);
    this.curStep = StepManager(this.pEvent,stepName);
    this.curStep.begin();
    
    //如果当前是事件，仅仅执行begin()
    //在事件完成后才执行toNext();
    if (!this.curStep.isEvent) {
        let interval = this.curStep.getInterval();
        let self = this;
        if (interval <= 0) {
            return self.toNext();
        } else {
            this.timer = setTimeout(()=>{
                return self.toNext();
            },interval);
        }
    }
}

pro.toNext = function() {
    this.curStep.end();
    let nextStep = this.curStep.getNext();
    if (nextStep) {
        return this.gameLoop(nextStep);
    }

    //如果没有nextStep，就一直挂在curStep下，永久等待。
    //后续可以用skip或jumpTo来跳转到其他step.
    //这个是实现EventBase的关键。
}

pro.jumpTo = function(stepName) {
    clearTimeout(this.timer);
    this.gameLoop(stepName);
}

pro.skip = function() {
    clearTimeout(this.timer);
    this.toNext();
}

// pro.setHaltStep = function(stepName) {
//     this.haltStep = stepName;
// }

pro.resume = function() {
    //使用resume时，本级控制器一定是挂起在某个Event下的。
    //将游戏的事件控制器设置为当前本控制器。
    this.pEvent.changeGameController(this);
    this.toNext();

    // stepName = stepName || this.haltStep;
    // this.gameLoop(stepName);
}
