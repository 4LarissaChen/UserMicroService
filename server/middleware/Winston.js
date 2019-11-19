'use strict';
var winston = require('winston');
var appRoot = global.appRoot;


var options = {
  info: {
    name: 'info-file',
    filename: appRoot + 'logs/info.log',
    level: 'info',
    handleExceptions: false,
    json: true,
    maxsize: 5242880,
    maxFiles: 5,
    colorsize: false,
  },
  error: {
    name: 'error-file',
    filename: appRoot + 'logs/error.log',
    level: 'error',
    handleExceptions: true,
    json: true,
    maxsize: 5242880,
    maxFiles: 5,
    colorsize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorsize: true,
  }
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)(options.info),
    new (winston.transports.File)(options.error),
    new (winston.transports.Console)(options.console),
  ]
});

module.exports = logger;