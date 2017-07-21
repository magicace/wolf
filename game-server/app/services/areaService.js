const GameRoom = require("../domain/area/gameRoom");

let AreaService = function(app) {
    this.app = app;
    this.roomMap = {};

}

module.exports = AreaService;
let pro = AreaService.prototype;

pro.createRoom = function(msg) {
    let param = {
        app: this.app,
        roomId: msg.roomId,
        typeId: msg.typeId
    }
    let players = JSON.parse(msg.players);
    let room = new GameRoom(param);

    // if (room.addGroup(players)) {
    //     this.roomMap[msg.roomId] = room;
    // } else {
    //     room = null;
    //     return false;
    // }

    // room.createRole();
    room.addGroup(players);
    this.roomMap[msg.roomId] = room;
    return true;
}

pro.getRoomById = function(roomId) {
    return this.roomMap[roomId];
}