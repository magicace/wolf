var mysql = require('./mysql/mysql');
var userDao = module.exports;

/**
 * Get userInfo by username
 * @param {String} username
 * @param {function} cb
 */
userDao.getUserByName = function (username, cb){
  var sql = 'select * from  User where name = ?';
  var args = [username];
  console.log('sql: ', sql);
  mysql.query(sql,args,function(err, res){
    console.log('query: ', err,res);
    if(err !== null){
      cb(err.message, null);
    } else {
      if (!!res && res.length === 1) {
        var rs = res[0];
        var user = {id: rs.id, name: rs.name, password: rs.password, salt: rs.salt};
        cb(null, user);
      } else {
        cb(' user not exist ', null);
      }
    }
  });
};



/**
 * Create a new user
 * @param (String) username
 * @param {String} password
 * @param {String} salt salt for password, 4 characters.
 * @param {function} cb Call back function.
 */
userDao.createUser = function (username, password, salt, cb){
  let sql = 'insert into User (name,password,salt,loginCount,lastLoginTime) values(?,?,?,?,?)';
  let loginTime = Date.now();
  let args = [username, password, salt, 1, loginTime];
  //create a new player at same time.
  let _createPlayer = function(user,cb) {
    let sql = 'insert into Player (userId,name) values (?,?)';
    let args = [user.id,user.name];
    
    mysql.insert(sql,args,function(err,res) {
      if (err !== null) {
        cb({code: err.number, msg: err.mesage}, null);
      } else {
        cb(null,user)
      }
    });
  }

  mysql.insert(sql, args, function(err,res){
    if(err !== null){
      cb({code: err.number, msg: err.message}, null);
    } else {
      var userId = res.insertId;
      var user = {id: res.insertId, name: username, password: password, loginCount: 1, lastLoginTime:loginTime};
      //Create a new player at same time.
      _createPlayer(user,cb);
    }
  });
};







