'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');
var https = require('https');
var fs = require('fs');
global.appRoot = path.join(__dirname, '../');

var app = module.exports = loopback();

var env = process.env.NODE_ENV;

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", '3.2.1');
  next();
});

app.start = function () {
  // start the web server
  // var server = https.createServer({
  //   key: fs.readFileSync(global.appRoot + '/key.pem'),
  //   cert: fs.readFileSync(global.appRoot + '/cert.pem')
  // }, app);

  // server.listen(app.get('port'), function () {
  //   var baseUrl = 'https://' + app.get('host') + ':' + app.get('port');
  //   app.emit('started', baseUrl);
  //   console.log('LoopBack server listening @ %s%s', baseUrl, '/');
  //   if (app.get('loopback-component-explorer')) {
  //     var explorerPath = app.get('loopback-component-explorer').mountPath;
  //     console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
  //   }
  // });
  // return server;

  //http server:
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

