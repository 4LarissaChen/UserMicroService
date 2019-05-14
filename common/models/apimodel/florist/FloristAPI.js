
'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');
var errorConstants = require('../../../../server/constants/errorConstants.js');
var FloristService = require('./internalService/FloristService.js');
var promiseUtils = require('../../../../server/utils/promiseUtils.js');
module.exports = function (FloristAPI) {

  FloristAPI.remoteMethod('getFlorist', {
    description: "Get Florist.",
    accepts: [{ arg: 'floristId', type: 'string', required: true, description: "Florist id.", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'Florist', description: '', root: true },
    http: { path: '/florist/:floristId/getFlorist', verb: 'get', status: 200, errorStatus: 500 }
  });
  FloristAPI.getFlorist = function(floristId){
    let floristService = Flo
  }
}