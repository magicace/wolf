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
        player.isDying = true;
        pGame.noticeDeath(player.id,10);        //死亡原因10，代表被猎人带走，代码暂定。

        let deadGroup = pGame.curController.pEvent.deadGroup;
        deadGroup.push(player.index);

        // 如果被猎人带人的玩家允许有遗言：
        if (pGame.dayCount === 1) {
            player.hasLastWords = true;
        }
    }

    return pGame.curController.skip();
}

module.exports = Hunter;