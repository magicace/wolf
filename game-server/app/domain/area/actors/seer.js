const Actor = require ('./actor');
const Inherits = require ('../inherits');
const Consts = require('../../../consts/consts');

function Seer(param) {
    Actor.call(this,param);
    this.skillStep = 'NightB';
}

Inherits(Seer,Actor);
module.exports = Seer;

let pro = Seer.prototype;

pro.setSkillEffect = function(msg) {
    let targetPlayer = this.pGame.players[msg.target-1];
    let outMsg = {
        playerId: targetPlayer.id,
        isWolf: (targetPlayer.role === Consts.RoleType.WOLF)
    }

    this.sendMsg('onSeerSelect',outMsg);
}



// class Seer extends Actor {
//     constructor(param) {
//         super(param);
//         this.skillStep = 'NightB';
//     }
// }



