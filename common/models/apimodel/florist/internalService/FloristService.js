'use strict'
var app = require('../../../../../server/server.js');
var loopback = require('loopback');
var moment = require('moment');
var Promise = require('bluebird');
var promiseUtils = require('../../../../../server/utils/promiseUtils.js');
var apiUtils = require('../../../../../server/utils/apiUtils.js');
var errorConstants = require('../../../../../server/constants/errorConstants.js');
class FloristService {
  updateCustomerPool(floristId, customerId) {
    let Florist = loopback.findModel("Florist");
    return Florist.find({ where: { "userId": customerId } }).then(result => {
      if (!result)
        throw apiUtils.build404Error(nodeUtil.format(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, 'Florist'));
      return promiseUtils.mongoNativeUpdatePromise('Florist', { customerPool: customerId }, { $pull: { customerPool: customerId } });
    }).then(result => {
      return promiseUtils.mongoNativeUpdatePromise('Florist', { userId: floristId }, { $addToSet: { customerPool: customerId } })
    }).then(() => {
      return { isSuccess: true };
    })
  }

  getFloristList(){
    let Florist = loopback.findModel("Florist");
    return Florist.find();
  }
}

module.exports = FloristService;