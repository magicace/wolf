const StepManager = require('./stepManager');

let Controller = function(param) {
    this.pEvent = param.pEvent;
    this.name = param.name;
    this.pEvent.changeGameController(this);
}

module.exports = Controller;
let pro = Controller.prototype;

pro.init = function(stepName) {
    return this.gameLoop(stepName);
}

// 游戏循环的入口
pro.gameLoop = function(stepName) {
    console.log('===== The step: [%s]-%s is Begin',this.name,stepName);
    this.curStep = StepManager(this.pEvent,stepName);
    this.curStep.begin();
    
    //如果当前是事件，仅仅执行begin()，本级控制就一直挂在这个事件Step下。
    //事件的begin()里面会new一个新的控制器出来，作为下级控制器继续游戏进程。
    //下级事件完成后，会调用本级的resume来恢复本级控制器，执行toNext();
    //然后游戏在本级控制器的控制下继续进行。参看EventBase相关描述。
    if (this.curStep.isEvent) {
        return;
    }

    //单纯的Step，定时或直接执行它的后续任务toNext();
    let interval = this.curStep.getInterval();
    let self = this;
    if (interval <= 0) {
        process.nextTick(()=> {
            return self.toNext();
        })
        // return self.toNext();
    } else {
        this.timer = setTimeout(()=>{
            return self.toNext();
        },interval);
    }

}

// 准备进入到下一个Step， 先执行本step的end()方法。
// 在end()方法中可以根据情况设置不用的nextStep；
pro.toNext = function() {
    this.curStep.end();
    console.log('===== The step: [%s]-%s is Over',this.name,this.curStep.name);
    let nextStep = this.curStep.getNext();
    if (nextStep) {
        return this.gameLoop(nextStep);
    }

    //如果没有nextStep，就一直挂在curStep下，永久等待。
    //调试过程中，可以建立一个Step，不设置next，作为暂停。
}

// pro.jumpTo = function(stepName) {
//     clearTimeout(this.timer);
//     // return this.gameLoop(stepName);
//     let self = this;
//     process.nextTick(()=> {
//         return self.gameLoop(stepName);
//     })
// }

pro.skip = function() {
    clearTimeout(this.timer);
    // return this.toNext();
    let self = this;
    process.nextTick(()=> {
        return self.toNext();
    })
}

// pro.setHaltStep = function(stepName) {
//     this.haltStep = stepName;
// }

pro.resume = function() {
    //使用resume时，本级控制器一定是挂起在某个Event下的。
    //将游戏的事件控制器设置为当前本控制器。
    this.pEvent.changeGameController(this);
    let self = this;
    process.nextTick(()=> {
        return self.toNext();
    })

    // stepName = stepName || this.haltStep;
    // this.gameLoop(stepName);
}
