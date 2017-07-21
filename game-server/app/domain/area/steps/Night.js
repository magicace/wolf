const Step = require ('./Step');
const Inherits = require ('../inherits');

function Night(param) {
    Step.call(this,param);
}

module.exports = Night;

Inherits(Night,Step);
let pro = Night.prototype;

pro.begin = function() {
    let players = this.pGame.players;
    for (let i in players) {
        let player = players[i];
        let msg = player.getActMsg(this.name);
        msg.delay = this.delay;       
        player.sendMsg(this.route,msg);
    }
}
