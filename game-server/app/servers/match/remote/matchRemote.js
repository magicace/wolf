const Code = require('../../../../../shared/code');
const ChannelUtil = require('../../../util/channelUtil');

module.exports = function(app) {
	return new Remote(app);
};

let Remote = function(app) {
    this.app = app;
    this.channelService = app.get('channelService');
}

let pro = Remote.prototype;

pro.playerLeave = function(typeId,roomId,playerId,cb) {
    let poolInstance = require('../../../domain/entity/waitingPool').getInstance();
    let room = poolInstance.getRoomByType(typeId,roomId);
    if (!room) {
        cb({code: Code.MATCH.FA_ROOM_NOT_EXIST});
        return;
    }

    room.leave(playerId, function(data) {
        cb(data);
    });
}