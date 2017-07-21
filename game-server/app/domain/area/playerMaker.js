const Consts = require('../../consts/consts');

const RoleModule = ['actor','seer','witch','hunter','guarder','wolf'];

let PlayerMaker = function(player) {
    let moduleName = './actors/' + RoleModule[player.role];
    let roleBase = require(moduleName);
    
    return new roleBase(player);
}

module.exports = PlayerMaker;

