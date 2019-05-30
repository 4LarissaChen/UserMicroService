
'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');
var errorConstants = require('../../../../server/constants/errorConstants.js');
var apiConstants = require('../../../../server/constants/apiConstants.js');
var promiseUtils = require('../../../../server/utils/promiseUtils.js');
var FloristService = require('./internalService/FloristService.js');
module.exports = function (FloristAPI) {

  FloristAPI.remoteMethod('getFlorist', {
    description: "Get Florist.",
    accepts: [{ arg: 'floristId', type: 'string', required: true, description: "Florist id.", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'Florist', description: '', root: true },
    http: { path: '/florist/:floristId/getFlorist', verb: 'get', status: 200, errorStatus: 500 }
  });
  FloristAPI.getFlorist = function (floristId) {
    let Florist = loopback.findModel('Florist');
    return Florist.findOne({ where: { "userId": floristId } });
  }

  FloristAPI.remoteMethod('createFlorist', {
    description: "Create Florist.",
    accepts: [{ arg: 'floristId', type: 'string', required: true, description: "Florist id.", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'Florist', description: '', root: true },
    http: { path: '/florist/:floristId/createFlorist', verb: 'post', status: 200, errorStatus: 500 }
  });
  FloristAPI.createFlorist = function (floristId) {
    let Florist = loopback.findModel('Florist');
    return Florist.findOne({ where: { "userId": floristId } }).then(result => {
      if (result && result._id)
        throw apiUtils.build500Error(nodeUtil.format(errorConstants.ERROR_TARGET_MODEL_EXISTS, 'Florist'));
      let florist = {
        _id: apiUtils.generateShortId("Florist"),
        userId: floristId,
        customerPool: [],
        status: apiConstants.FLORIST_STATUS_ACTIVE,
        createDate: moment().local().format('YYYY-MM-DD HH:mm:ss')
      }
      return Florist.create(florist);
    })
  }

  FloristAPI.remoteMethod('updateCustomerPool', {
    description: "updateCustomerPool florist's customer pool.",
    accepts: [{ arg: 'floristId', type: 'string', required: true, description: "Florist Id", http: { source: 'path' } },
    { arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/florist/:floristId/customer/:customerId/updateCustomerPool', verb: 'put', status: 200, errorStatus: [500] }
  });
  FloristAPI.updateCustomerPool = function (floristId, customerId) {
    let floristService = new FloristService();
    return floristService.updateCustomerPool(floristId, customerId).then(() => {
      return { isSuccess: true };
    });
  }
}