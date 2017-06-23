const Code = require('../../../../../shared/code');
const Consts = require('../../../consts/consts');

module.exports = function(app) {
    return new AreaHandler(app,app.get('areaService'));
}; 

let AreaHandler = function(app,areaService) {
    this.app = app;
    this.areaService = areaService;
}

let pro = AreaHandler.prototype;

pro.entry = function(msg,session,next) {
    //不需要客户端传roomId,playerId等数据，从session中取，不相信客户端数据。
    let self = this;
    let roomId = session.get('roomId');
    let playerId = session.get('playerId');
    let room = this.areaService.getRoomById(roomId); 
    let outMsg = room.onPlayerEnterRoom(playerId,session.uid,session.frontendId);
    
    session.set('playerSt',3)
    session.pushAll(function(){
        next(null,{code:Code.OK,msg:JSON.stringify(outMsg)});
    });
}

pro.target = function(msg,session,next) {
    let self = this;
    let roomId = session.get('roomId');
    let playerId = session.get('playerId');
    let room = this.areaService.getRoomById(roomId);

    // let roleId = room.getPlayerById(playerId).role; //不相信客户端数据，服务端自己去查。

    // if (roleId == Consts.RoleType.WOLF) {
    //     room.wolfSelect(playerId,msg);
    // }
    room.onTargetSelected(playerId,msg,function(code) {
        next(null,{code:code});
    })
}
