const tokenService = require('../../../../../shared/token');
const userDao = require('../../../dao/userDao');
const Code = require('../../../../../shared/code');

const DEFAULT_SECRET = 'pomelo_session_secret';
const DEFAULT_EXPIRE = 6 * 60 * 60 * 1000;	// default session expire time: 6 hours

module.exports = function(app) {
	return new Remote(app);
};

let Remote = function(app) {
	this.app = app;
	let session = app.get('session') || {};
	this.secret = session.secret || DEFAULT_SECRET;
	this.expire = session.expire || DEFAULT_EXPIRE;
};

let pro = Remote.prototype;

/**
 * Auth token and check whether expire.
 *
 * @param  {String}   token token string
 * @param  {Function} cb
 * @return {Void}
 */
pro.auth = function(token, cb) {
	let res = tokenService.parse(token, this.secret);
	if(!res) {
		cb(null, Code.ENTRY.FA_TOKEN_ILLEGAL);
		return;
	}

	if(!checkExpire(res, this.expire)) {
		cb(null, Code.ENTRY.FA_TOKEN_EXPIRE);
		return;
	}

	userDao.getUserById(res.uid, function(err, user) {
		if(err) {
			cb(err);
			return;
		}
		cb(null, Code.OK, user);
	});
};

/**
 * Check the token whether expire.
 *
 * @param  {Object} token  token info
 * @param  {Number} expire expire time
 * @return {Boolean}        true for not expire and false for expire
 */
var checkExpire = function(token, expire) {
	if(expire < 0) {
		// negative expire means never expire
		return true;
	}

	return (Date.now() - token.timestamp) < expire;
};
