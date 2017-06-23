const Code = require('../../../../../shared/code');
const userDao = require('../../../dao/userDao');
const async = require('async');
const channelUtil = require('../../../util/channelUtil');
const utils = require('../../../util/utils');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

/**
 * New client entry.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.entry = function(msg, session, next) {
	console.log('entry:',msg);
	let token = msg.token;
	let self = this;

	if(!token) {
		next(new Error('invalid entry request: empty token'), {code: Code.FAIL});
		return;
	}

	let uid,players, player;
	async.waterfall([
		// auth token
		function(cb) {
			self.app.rpc.auth.authRemote.auth(session, token, cb);
		},
		function(code,user,cb) {
			if (code !== Code.OK) {
				next(null, {code: code});
				return;
			}

			if (!user) {
				next (null, {code: Code.ENTRY.FA_USER_NOT_EXIST});
				return;
			}
			uid = user.id;
			userDao.getPlayersByUid(user.id, cb);
		},
		function(res, cb) {
			players = res;
			self.app.get('sessionService').kick(uid, cb);
		},
		function(cb) {
			session.bind(uid, cb);
		},
		function(cb) {
			if (!players || players.length ===0) {
				next(null, {code: Code.OK});
				return;
			}

			player = players[0];
			session.set('playerName', player.name);
			session.set('playerId', player.id);
			session.set('playerLevel',player.level);
			session.set('playerIcon',player.iconIndex);
			session.set('playerSt',1);
			session.on('closed', onUserLeave.bind(null, self.app));
			session.pushAll(cb);
		},
		function(cb) {
			let channelName = channelUtil.getGlobalChannelName();
			self.app.rpc.chat.chatRemote.add(session, player.userId, player.name, channelName, cb);		
		},
		function(code) {
			console.log(code == Code.OK);
			if (code !== Code.OK) {
				next(null, {code: Code.FAIL});
				return;
			}

			next(null, {code: Code.OK, player: players ? player : null});
		}
	]);
};

let onUserLeave = function (app, session, reason) {
    console.log('onUserLeave-reason: ', reason);
	if(!session || !session.uid) {
		return;
	}

	utils.myPrint('1 ~ OnUserLeave is running ...');
	// app.rpc.area.playerRemote.playerLeave(session, {playerId: session.get('playerId'), instanceId: session.get('instanceId')}, function(err){
	// 	if(!!err){
	// 		logger.error('user leave error! %j', err);
	// 	}
	// });


	let playerSt = session.get('playerSt');

	if (playerSt == 2) {
		let typeId = session.get('typeId');
		let roomId = session.get('roomId');
		let playerId = session.get('playerId');
		app.rpc.match.matchRemote.playerLeave(session,typeId,roomId,playerId,function(data){
			if(data.code !== Code.OK){
				// logger.error('user leave error! %j', code);
				console.log('user leave error! %j', data.code);
			} else {
				console.log('============ player %j has left', playerId);
			}
		});
	}
	
	app.rpc.chat.chatRemote.kick(session, session.uid, null);
};

// /**
//  * Publish route for mqtt connector.
//  *
//  * @param  {Object}   msg     request message
//  * @param  {Object}   session current session object
//  * @param  {Function} next    next step callback
//  * @return {Void}
//  */
// Handler.prototype.publish = function(msg, session, next) {
// 	var result = {
// 		topic: 'publish',
// 		payload: JSON.stringify({code: 200, msg: 'publish message is ok.'})
// 	};
//   next(null, result);
// };

// /**
//  * Subscribe route for mqtt connector.
//  *
//  * @param  {Object}   msg     request message
//  * @param  {Object}   session current session object
//  * @param  {Function} next    next step callback
//  * @return {Void}
//  */
// Handler.prototype.subscribe = function(msg, session, next) {
// 	var result = {
// 		topic: 'subscribe',
// 		payload: JSON.stringify({code: 200, msg: 'subscribe message is ok.'})
// 	};
//   next(null, result);
// };
