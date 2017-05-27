module.exports = {
  RES_CODE : {
    SUC_OK						: 1,		// success
    ERR_FAIL					: -1,		// Failded without specific reason
    ERR_USER_NOT_LOGINED		: -2,		// User not login
    ERR_CHANNEL_DESTROYED		: -10,		// channel has been destroyed
    ERR_SESSION_NOT_EXIST		: -11,		// session not exist
    ERR_CHANNEL_DUPLICATE		: -12,		// channel duplicated
    ERR_CHANNEL_NOT_EXIST		: -13		// channel not exist
  },

  MYSQL : {
    ERROR_DUP_ENTRY	: 1062
  },


  MESSAGE: {
    RES: 200,
    ERR: 500,
    PUSH: 600
  },

  Pick: {
    SUCCESS: 1,
    VANISH:	2,
    NOT_IN_RANGE: 3,
    BAG_FULL: 4
  },

  TaskState: {
    COMPLETED:2,
    COMPLETED_NOT_DELIVERY:1,
    NOT_COMPLETED:0,
    NOT_START:-1
  },

  TaskType: {
    KILL_MOB: 0,
    KILL_PLAYER: 1
  },

  Event:{
    chat:'onChat'
  },

};
