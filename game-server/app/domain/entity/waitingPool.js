const AreaType = require('../../consts/areaType');
const Room = require('./waitingRoom');
const Dispatcher = require('../../util/dispatcher');

// module.exports = function(app) {
//     if (!!RoomPool.instance) {
//         console.log("====================== pool instance is exists");
//         return RoomPool.instance;
//     }

//     console.log("====================== create a new pool");
// 	return new RoomPool(app);
// };


let RoomPool = function(app) {
    this.app = app;
    this.counter = 0;

    //定义服务器池(初始设置一次)和房间池。均对应不同的服务器type，每种type一个池。
    this.poolArray = [];
    this.areaArray = [];
    
    for(let i in AreaType) {
        this.poolArray[i] = [];
        this.areaArray[i] = [];
    }

    let areas =  this.app.get('servers').area;
    for(let i in areas) {
        let area = areas[i];
        this.areaArray[area.typeId].push(area.id);
    }
    //单例隐式返回
    // RoomPool.instance = this;
}

let pro = RoomPool.prototype;

/**
 * @return {Number} 获得roomid，递增。
 */
pro.getCounter = function() {
    return ++this.counter;
}

/**
 * Get a valid room to enter
 * @param  {Number} typeId Type of area
 * @param  {Number} num The number of players who is going to enter the room
 * @return {Object}
 */

pro.getFreeRoom = function(typeId,num) {
    num = num || 1;
    let room;
    let pool = this.poolArray[typeId];
    for (let i in pool) {
        room = pool[i];
        if (room.isOpen && room.getFreeNum() >= num) {
            return room;
        }
    }

    //if not found a valid room, create a new room.
    return this.createRoom(typeId);
},

/**
 * Create a new room by tyepId
 * @param {Number} typeId the id of area server type.
 * @return {Object} a new room.
 */
pro.createRoom = function(typeId) {
    let roomId = this.getCounter();

    let areaId = Dispatcher.dispatch(roomId,this.areaArray[typeId]);
    let pool = this.poolArray[typeId];
    let params = {
        app: this.app,
        pool: pool,
        id: roomId,
        num: AreaType[typeId].num,
        typeId: typeId,
        areaId: areaId,
    }

    // console.log('================= areaId: ',areaId);
    room = new Room(params);
    pool.push(room);
    return room;   
}

/** Get a specified room by roomId
 * @param {Number} roomId Room id
 * @return {Object}
 */
pro.getRoomById = function(roomId) {
    let room;
    for (let i in this.poolArray) {
        let pool = this.poolArray[i];
        for (let j in pool) {
            if (pool[j].id == roomId) {
                room = pool[j];
                break;
            }
        }
    }
    return room;
}

/** Get a specified room by roomId
 * @param {Number} typeId which type the room is
 * @param {Number} roomId Room id
 * @return {Object}
 */
pro.getRoomByType = function(typeId,roomId) {
    let room;
    let pool = this.poolArray[typeId];
    for (let i in pool) {
        if (pool[i].id == roomId) {
            room = pool[i];
            break;
        }
    }
    return room;
}

/**
 * @param {Number} typeId Type of area
 * @return {Array of String} Return the area id group of specified area type.
 */
pro.getAreas = function(typeId) {
    return this.areaArray[typeId];
}

let instance;
module.exports.getInstance = function(app) {
    if (instance == undefined) {
        console.log("=================== create a new pool ===================");
        instance = new RoomPool(app);
    } 
    
    return instance;
}