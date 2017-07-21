const Actor = require ('./actor');
const Inherits = require ('../inherits');

function Witch(param) {
    Actor.call(this,param);
    this.skillStep = 'NightB';
    this.isAntidote = true;
    this.isPoison = true;
}

Inherits(Witch,Actor);

let pro = Witch.prototype;
pro.getActMsg = function(stepName) {
    let msg = {};
    if (stepName === this.skillStep) {
        if ((!this.isAntidote) && (!this.isPoison)) {
            msg.isActStep = false;
        } else if (!this.isAntidote) {
            msg.isActStep = true;
            msg.isAnitidote = false;
            msg.isPoison = true;            
        } else {
            msg.isActStep = true;
            msg.isAnitidote = true;
            msg.isPoison = this.isPoison;
            msg.killIndex = this.pGame.killIndex;            
        }
    }
}

pro.setSkillEffect = function(msg) {
    if (msg.isCure) {
        let index = this.pGame.killIndex;
        let player = this.pGame.players[index-1];
        player.isCure = true;
    } else {
        let target = msg.target;
        let player = this.pGame.players[target-1];
        player.isPoison = true;
    }
}

module.exports = Seer;