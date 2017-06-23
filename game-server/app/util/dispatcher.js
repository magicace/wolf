var crc = require('crc');

module.exports.dispatch = function(uid, srvs) {
	var index = Number(uid) % srvs.length;
	return srvs[index];
};