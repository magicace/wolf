const Base = require ('./Base');
const Controller = require('../controller');
const Inherits = require ('../inherits');


function EventBase(param) {
    Base.call(this,param);

    this.isEvent = true;
    //常用的玩家数组和玩家id对照map,引用到本类。
    this.players = this.pGame.players;
    this.playersMap = this.pGame.playersMap;
}

module.exports = EventBase;

Inherits(EventBase,Base);
let pro = EventBase.prototype;

//开启事件
pro.startEvent = function(stepName) {
    let attr = {pEvent : this, name: this.name};
    this.controller = new Controller(attr);
    this.controller.init(stepName);
}

//停止事件。
pro.stopEvent = function() {
    this.controller = null;
    //上级控制器的resume，会将系统当前控制器恢复成上级控制器。
    return this.pSuper.controller.resume();
}


//将当前控制器逐级上传，一直到gameroom节点。这样可以实现事件嵌套。
pro.changeGameController = function(pController) {
    this.pSuper.changeGameController(pController);
}

pro.end = function() {
    let nextStep = this.pSuper.getNextStep(this.name);
    if (!!nextStep) {
        this.next = nextStep;
    }
}

// pro.getStepMsg = function(stepName) {

// }

// pro.getNextStep = function(stepName) {
  
// }