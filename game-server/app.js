const pomelo = require('pomelo');
const ChatService = require('./app/services/chatService');
const routeUtil = require('./app/util/routeUtil');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'werewolf');

// app.configure('production|development', function () {
    app.before(pomelo.filters.toobusy());
    app.enable('systemMonitor');

    app.filter(pomelo.filters.time()); //开启conn日志，对应pomelo-admin模块下conn request
    app.rpcFilter(pomelo.rpcFilters.rpcLog());//开启rpc日志，对应pomelo-admin模块下rpc request

//     // var sceneInfo = require('./app/modules/sceneInfo');
//     // var onlineUser = require('./app/modules/onlineUser');
//     // if (typeof app.registerAdmin === 'function') {
//     //     // app.registerAdmin(sceneInfo, {app: app});
//     //     app.registerAdmin(onlineUser, {app: app});
//     // }
// });

// configure for global
app.configure('production|development', function () {
    // proxy configures
    app.set('proxyConfig', {
        cacheMsg: true,
        interval: 30,
        lazyConnection: true,
        // enableRpcLog: true
    });

    // remote configures
    app.set('remoteConfig', {
        cacheMsg: true,
        interval: 30
    });

    // route configures
    app.route('area', routeUtil.area);
    app.route('connector', routeUtil.connector);

    app.loadConfig('mysql', app.getBase() + '/../shared/config/mysql.json');
    app.filter(pomelo.filters.timeout());    
});

// app configuration for connector
app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.hybridconnector,
      heartbeat : 3,
      useDict : true,
      useProtobuf : true
    });
});

// Configure for gate server

app.configure('production|development', 'gate', function () {
    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector,
            useProtobuf: true
        });
});

// Configure for auth server
app.configure('production|development', 'auth', function () {
    // load session congfigures
    app.set('session', require('./config/session.json'));
});

// Configure database
app.configure('production|development', 'auth|connector|chat', function () {
    var dbclient = require('./app/dao/mysql/mysql').init(app);
    app.set('dbclient', dbclient);
    // app.load(pomelo.sync, {path:__dirname + '/app/dao/mapping', dbclient: dbclient});
    // app.use(sync, {sync: {path: __dirname + '/app/dao/mapping', dbclient: dbclient}});
});

// Configure for chat server
app.configure('production|development', 'chat', function () {
    app.set('chatService', new ChatService(app));
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
