const express = require('express');
const Token = require('../shared/token');
const secret = require('../shared/config/session').secret;
const userDao = require('./lib/dao/userDao');
const Md5 = require('./lib/md5');
const app = express();
const mysql = require('./lib/dao/mysql/mysql');
const everyauth = require('./lib/oauth');
const publicPath = __dirname +  '/public';

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "Wild Wolf" }));
  app.use(everyauth.middleware());
  app.use(app.router);
  app.set('view engine', 'jade');
  app.set('views', publicPath);
  app.set('view options', {layout: false});
  app.set('basepath',publicPath);
});

app.configure('development', function(){
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});

console.log("Web server has started.\nPlease log on http://127.0.0.1:3001/index.html");


//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); //"X-Requested-With""Content-Type"
    res.header('Access-Control-Allow-Credentials','true');
    // res.header("X-Powered-By",' 3.2.1')
    // res.header("Content-Type", "application/json;charset=utf-8");

    next();
});


//设置get方式注册
app.get('/register/*',function(req,res) {
  var name = req.query.name;
  var pass = req.query.pwd;
  console.log("================ Register ===================");
  console.log("name=",name);
  console.log("pass=",pass);

  if (!name || !pass) {
    res.send({code: 500});
    return;
  }

  let salt = Md5.getSalt();
  console.log("salt=",salt);

  pass = Md5.b64_md5(pass + salt);

  userDao.createUser(name, pass, salt,function(err, user) {
    console.log("err:",err);
    if (err || !user) {
      if (err && err.code === 1062) {
        res.send({code: 501});
      } else {
        res.send({code: 500});
      }
    } else {
      console.log('A new user was created! --' + name);
      res.send({code: 200, token: Token.create(user.id, Date.now(), secret), uid: user.id});
    }
  });

})

//设置get方式登录验证
app.get('/login/*', function(req, res) {
  var name = req.query.name;
  var pass = req.query.pwd;
  console.log("================== Login ====================");
  console.log("name=",name);
  
  if (!name || !pass) {
    res.send({code: 500});
    return;
  }

  userDao.getUserByName(name, function(err, user) {
    if (err || !user) {
      console.log('username not exist!');
      res.send({code: 500});
      return;
    }

    pass = Md5.b64_md5(pass+user.salt);
    console.log("pass=",pass);
    if (pass !== user.password) {
      // TODO code
      // password is wrong
      console.log('password incorrect!');
      res.send({code: 501});
      return;
    }

    console.log(name + ' login!');
    res.send({code: 200, token: Token.create(user.id, Date.now(), secret), uid: user.id});
  });
});

mysql.init();
app.listen(3001);