'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');
var promiseUtils = require('../../../../../server/utils/promiseUtils.js');

class AddressService {

  getAddress(userId) {
    let Address = app.models.Address;
    return Address.find({ where: { userId: userId, isDeleted: 0 } });
  };

  changeDefaultAddress(userId, addressId) {
    return promiseUtils.mongoNativeUpdatePromise("ButchartUser", { _id: userId }, { $set: { "userProfile.defaultAddress": addressId } });
  }

}

module.exports = AddressService;