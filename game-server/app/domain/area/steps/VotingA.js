//投票阶段，只有可投票组能接收到开始投票的消息。
const Step = require ('./Step');
const Inherits = require ('../inherits');

function VotingA(param) {
    Step.call(this,param);
    this.playersMap = this.pGame.playersMap;
}

module.exports = VotingA;

Inherits(VotingA,Step);
let pro = VotingA.prototype;

pro.begin = function() {
    let group = this.pSuper.votingGroup;
    for (let i in group) {
        let playerId = group[i];
        let player = this.playersMap[playerId];
        let msg = {group:this.pSuper.electsGroup, delay: this.delay};
        
        player.sendMsg(this.route,msg);
    }

    group = this.pSuper.waitingGroup; 
    for (let i in group) {
        let playerId = group[i];
        let player = this.playersMap[playerId];
        let msg = {isWaiting: true, delay: this.delay};
        
        player.sendMsg(this.route,msg);
    }
}