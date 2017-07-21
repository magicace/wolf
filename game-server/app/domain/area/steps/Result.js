const Step = require ('./Step');
const Inherits = require ('../inherits');

function Result(param) {
    Step.call(this,param);
}

module.exports = Result;

Inherits(Result,Step);
let pro = Result.prototype;

pro.begin = function() {
    let players = this.pGame.players;

}