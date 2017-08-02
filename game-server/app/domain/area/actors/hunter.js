const Actor = require ('./actor');
const Inherits = require ('../inherits');

function Hunter(param) {
    Actor.call(this,param);
    this.hasDeathSkill = true;
    this.skillStep = 'LastSkill';
}

Inherits(Hunter,Actor);
let pro = Hunter.prototype;

pro.setSkillEffect = function(msg) {
    let pGame = this.pGame;
    if (msg.target) {
        let player = pGame.players[msg.target-1];
        player.isDead = true;
        pGame.noticeDeath(player.id,10);       //死亡原因10，代表被猎人带走，代码暂定。
        // if (pGame.isLastWords) {                //在第一遗言阶段发动的技能
        //     pGame.speechGroup.push(player.id);
        //     pGame.nextId = pGame.findNextSpeaker(pGame.currId);
        // } 

        pGame.deadGroup.push(player.index);
    }

    return pGame.curController.skip();
}

module.exports = Hunter;