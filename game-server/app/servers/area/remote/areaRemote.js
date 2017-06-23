const Code = require('../../../../../shared/code');

module.exports = function(app) {
	return new AreaRemote(app,app.get('areaService'));
};

let AreaRemote = function(app,areaService) {
	this.app = app;
	this.areaService = areaService;
};

let pro = AreaRemote.prototype;
/**
 *	Add room into area
 */
pro.createRoom = function(msg, cb) {
	if (this.areaService.createRoom(msg)) {
		cb(Code.OK);
	} else {
		cb(Code.AREA.FA_ROOM_CREATE);
	}
};

// /**
//  * leave Channel
//  * uid
//  * channelName
//  */
// AreaRemote.prototype.leave =function(uid, channelName, cb){
// 	this.chatService(uid, channelName);
// 	cb();
// };

// /**
//  * kick out user
//  *
//  */
// AreaRemote.prototype.kick = function(uid, cb){
// 	this.chatService.kick(uid);
// 	cb();
// };
