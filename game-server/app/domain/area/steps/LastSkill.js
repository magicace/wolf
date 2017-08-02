const Step = require ('./Step');
const Inherits = require ('../inherits');

function LastSkill(param) {
    Step.call(this,param);
}

module.exports = LastSkill;

Inherits(LastSkill,Step);
let pro = LastSkill.prototype;

pro.begin = function() {
    //死亡处理事件控制中的当前玩家。
    let player = this.pSuper.player;  
    msg = player.getActMsg(this.name);
    msg.delay = this.delay;
    player.sendMsg(this.route,msg);
}