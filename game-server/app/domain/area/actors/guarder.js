const Actor = require ('./actor');
const Inherits = require ('../inherits');

function Guarder(param) {
    Actor.call(this,param);
    this.skillStep = 'NightB';
}

Inherits(Guarder,Actor);

module.exports = Guarder;