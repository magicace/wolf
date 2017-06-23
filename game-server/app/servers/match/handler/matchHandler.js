const Code = require('../../../../../shared/code');
const AreaType = require('../../../consts/areaType');
const Dispatcher = require('../../../util/dispatcher');
const ChannelUtil = require('../../../util/channelUtil');

// const logger = require('pomelo-logger').getLogger(__filename);

module.exports = function(app) {
    return new Handler(app);
}

let Handler = function(app) {
    this.app = app;
    this.pool = require('../../../domain/entity/waitingPool').getInstance(app);
    this.channelService = app.get('channelService');
}

let pro = Handler.prototype;

pro.entry = function(msg, session, next) {
    let self = this;
    let typeId = msg.typeId;
    if (typeId < 0 || typeId >= AreaType.length) {
        //容错。此处应该log，现在还不清楚log规划。先输出控制台。
        console.log('There is a mistake in typeId %s from client!!!',typeId);
        typeId = 0;
    }

    this.typeId = typeId;
    this.attr = AreaType[typeId];

    let player = this.getPlayer(session);

    //等级要求判断，不相信客户端判断。
    if (player.level < this.attr.level) {
        next(null, {code: Code.MATCH.FA_LEVEL_NOT_ENOUGH});
        return;
    }

    //找到一个可用的房间
    let room = this.pool.getFreeRoom(typeId);

    //求出房间所在通道，通告其他客户端进入事件。
    let param = {
        route: 'onAdd',
        playerId: player.id 
    }
    let channelName = ChannelUtil.getRoomChannelName(room.id);
    let channel = this.channelService.getChannel(channelName,true);
    this.channel = channel;
    channel.pushMessage(param,function(){
        session.set('playerSt',2);
        session.set('typeId',typeId);
        session.set('roomId',room.id);
        session.pushAll(function(){
            //next (null, {code: Code.OK, room: room.id, players: JSON.stringify(room.players)});
            next (null, {code: Code.OK, room: room.id});
            // 当前玩家加入通道
            channel.add(session.uid,session.frontendId);
            // 当前玩家加入房间。
            room.add(player);
        });
    });
}


pro.leave = function(msg, session, next) {
    //不需要客户端传roomId,playerId等数据，从session中取，不相信客户端数据。
    let typeId = session.get('typeId');
    let roomId = session.get('roomId');
    let playerId = session.get('playerId');    

    let room = this.pool.getRoomByType(typeId,roomId);
    room.leave(playerId,function(msg){
        next(null,msg);
    });
}

pro.ready = function(msg, session, next) {
    //不需要客户端传roomId,playerId等数据，从session中取，不相信客户端数据。
    let typeId = session.get('typeId');
    let roomId = session.get('roomId');
    let playerId = session.get('playerId');

    let self = this;
    let room = this.pool.getRoomByType(typeId,roomId)
    if (room.setReady(playerId)) {
        let param = {
            route:'onReady',
            playerId: playerId
        }
        this.channel.pushMessage(param,function(){
            next(null, {code: Code.OK});
            session.set('serverId',room.areaId);
            session.pushAll(function(){
                //检查是否全部准备，放在最后确保执行顺序在回传code.Ok之后。
                room.checkReady();
            });
        });

    } else {
        next(null, {code: Code.MATCH.FA_PLAYER_NOT_EXIST});
    }
}

/**
 * Get the player information from session.
 * @param {Object} session The session of current client.
 * @return {Object} Include many important information of player. create as an object.
 */
pro.getPlayer = function(session) {
    let player = {};
    player.id = session.get('playerId');
    player.level = session.get('playerLevel');  
    player.name = session.get('playerName');
    player.icon = session.get('playerIcon');
    player.uid = session.uid;
    player.sid = session.frontendId;
    player.isReady = false;

    return player;
}
