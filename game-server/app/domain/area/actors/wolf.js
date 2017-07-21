const Actor = require ('./actor');
const Inherits = require ('../inherits');

function Wolf(param) {
    Actor.call(this,param);
    this.skillStep = 'NightA';
}

Inherits(Wolf,Actor);

let pro = Wolf.prototype;

pro.setSkillEffect = function(msg) {
    let outMsg = {
        playerId : this.id,
        target : msg.target,
        isOk : msg.isOk
    }

    this.pGame.sendWolfMsg('onWolfSelect',outMsg);
    if (msg.isOk) {
        this.target = msg.target;
    }
}

module.exports = Wolf;