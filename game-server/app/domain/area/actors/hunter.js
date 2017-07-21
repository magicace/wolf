const Actor = require ('./actor');
const Inherits = require ('../inherits');

function Hunter(param) {
    Actor.call(this,param);
    this.skillStep = 'ShootTime';
}

Inherits(Hunter,Actor);
let pro = Hunter.prototype;

pro.setSkillEffect = function(msg) {
    let player = this.pGame.players[msg.target-1];
    //没写完
}

module.exports = Hunter;