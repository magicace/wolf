const ChannelUtil = require('../../util/channelUtil');
const Code = require('../../../../shared/code');

let WaitingRoom = function(params) {
    this.app = params.app;
    this.pool = params.pool;
    this.id = params.id;
    this.maxNum = params.num;
    this.typeId = params.typeId;
    this.areaId = params.areaId;
    this.interval = params.interval || 30*1000;

    //set class member
    this.isOpen = true;   //allow to add in.
    this.players = [];
    //the number of players in this room:
    this.count = 0;
    //the number of players which have got ready.
    this.readyCount = 0;

    let channelName = ChannelUtil.getRoomChannelName(this.id);
    this.channel = this.app.get('channelService').getChannel(channelName,true);
}

/**
 * Expose 'Room' constructor.
 */
module.exports = WaitingRoom;

let pro = WaitingRoom.prototype;


/**
 * Add player group into the room.
 * @param {Object} players add players' group.
 * @return {Boolean} return if success or fail
 */
pro.addGroup = function(players) {
    if (players.length > this.getFreeNum()) {
        console.log("The players is too more to get into room :", room.id)
        return false;
    }

    for (let i in players) {
        let player = players[i];
        this.add(player);
    }
    return true;
}

/**
 * Add one player into the room.
 * @param {Object} player single player info.
 * @return {Boolean} return if success or fail
 */

pro.add = function(player) {
    for (let i in this.players) {
        if (player.id == this.players[i].id) {
            // find duplicate player, do not add again.
            console.log("Find duplicate playerId %s in Room ...",player.id);
            return false;
        }
    }

    this.players.push(player);
    if  (++this.count == this.maxNum) {
        this.onRoomFull();
    }
    return true;
}

pro.onRoomFull = function() {
    //等待ready过程中，即使有人掉线也不再允许加入。
    this.isOpen = false;
    this.startTimer();
    let param = {
        route: 'onFull',
        roomId: this.id,
        players: JSON.stringify(this.getOutPlayers())
        //JSON.stringify(room.players)
    }
    let self = this;
    this.channel.pushMessage(param,function(){
        console.log("======== The room %j is full",self.id);
    })
}

pro.startTimer = function() {
    if (this.interval > 0) {
        this.timer = setTimeout(this.rematch.bind(this),this.interval);
    }
}

//someone didn't get ready, the room need to rematch
pro.rematch = function() {
    //kick the players who was not ready, and change the state to not ready for others.
    let kickGroup = [];
    for (let i in this.players) {
        let player = this.players[i];
        if (!player.isReady) {
            let kick = {
                id : player.id,
                uid: player.uid,
                sid: player.sid
            }
            kickGroup.push(kick);
        } else {
            player.isReady = false;
        }
    }

    let param = {
        route: 'onRematch',
    }
    let self = this;
    this.channel.pushMessage(param,function(){
        console.log("============ reMatch =============");
        for (let i in kickGroup) {
            let player = kickGroup[i];
            self.channel.leave(player.uid,player.sid);
            self.removePlayerById(player.id);
        }
        self.isOpen = true;
        self.readyCount = 0;
    })
}


/**
 * When a player request to cancel match, it's called by matchHandler.
 * or a player disconnect and the session get a close event, called by matchRemote.
 * if the room is open, let him/her leave. otherwise, marked the player has left.
 * 
 * @param playerId player id
 * 
 */
pro.leave = function(playerId,cb) {
    if (!this.isOpen) {
        let index = this.getPlayerIndex(playerId);
        let player = this.players[index];
        player.isLeave = true;
        cb({code: Code.OK});
        return;
    }

    let player = this.removePlayerById(playerId);
    if (!player) {
        cb({code: Code.MATCH.FA_PLAYER_NOT_EXIST});
        return;
    }

    this.channel.leave(player.uid,player.sid);
    let param = {
        route: 'onLeave',
        playerId: playerId
    }
    this.channel.pushMessage(param,function(){
        cb({code: Code.OK});
    })
}

/**
 * get the number of free pos.
 * @param {Void}
 * @return {Number} free pos.
 */
pro.getFreeNum = function()　{
    return (this.maxNum - this.count);
}

/**
 * get the index of a specified player id in players array.
 * @param {Number} playerId player id.
 * @return {Number} player's index in array.
 */
pro.getPlayerIndex = function(playerId) {
    let index;
    for (let i in this.players) {
         if (playerId == this.players[i].id) {
            index = i;
            break;
        }
    } 
    return index;
}

/**
 * Remove a player from this.players[] by playerId;
 * @param {Number} playerId player Id;
 * @return {Object} return the info of player which is removed;
 */
 pro.removePlayerById = function(playerId) {
     let index = this.getPlayerIndex(playerId);
     let player;
     if (index) {
        player = this.players.splice(index,1);
        --this.count;
     }
     return player;
 }

/**
 * @param {Number} playerId player Id;
 * @return {Boolean} return if set ready or not found;
 */
pro.setReady = function(playerId) {
    let bRtn = false;
    for (let i in this.players) {
        let player = this.players[i];
        if (playerId == player.id) {
            if (!this.isReady) {　//避免客户端错误提交造成的重复计数
                player.isReady = true;
                ++this.readyCount;
            }
            bRtn = true;
            break;
        }
    }

    return bRtn;
}

/**
 * check if all players get ready or not
 * @param {Void}
 * @return {Boolean} if every one is ready or not.
 */
pro.checkReady = function() {
    if (this.readyCount < this.maxNum) {
        return false;
    } 
    if (this.readyCount > this.maxNum) {
        console.log("checkReady something error, ready count is greater than max number");
        return false;
    }

    //this.readyCount == this.maxNum 全部已经准备
    let self = this;
    let param = {
        route: 'onStart',
    }
    clearTimeout(self.timer);
    self.channel.pushMessage(param,function() {
        console.log("========= all ready ==========");    
    });

    let msg = {
        roomId: self.id,
        typeId: self.typeId,
        players:JSON.stringify(self.getOutPlayers())
    }
    self.app.rpc.area.areaRemote.createRoom.toServer(self.areaId,msg,function(code){
        if (code == Code.OK) {
            self.removeFromPool();
        } else {
            console.log("create game room fail, roomId: ",self.id);
        }
    });
    return true;
}

/**
 * Remove this room from pool
 */
pro.removeFromPool = function() {
    let index;
    for (let index in this.pool) {
        let room = this.pool[index];
        if (room.id == this.id) {
            break;
        }
    }
    if (index !== undefined) {
        this.pool.splice(index,1);        
    }
}

/**
 * @param players 输入指定的玩家组，默认为本房间所有玩家。
 * @return 返回一个提供给客户端的房间所有玩家的简单资料，需要什么提供什么。
 */
pro.getOutPlayers = function(players) {
    players = players || this.players;
    let outGroup = [];
    for (let i in players) {
        let player = players[i];
        let out = {
            id: player.id,
            name: player.name,
            icon: player.icon,
        }
        outGroup.push(out);
    }
    return outGroup;
}



