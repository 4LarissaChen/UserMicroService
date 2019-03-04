'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');
var promiseUtils = require('../../../../../server/utils/promiseUtils.js');

class AddressService {

  getAddress(userId) {
    let Address = app.models.Address;
    return Address.find({ userId: userId });
  };

  changeDefaultAddress(userId, addressData) {
    if (addressData.isDefault !== true)
      return Promise.resolve();
    return this.getAddress(userId).then(result => {
      let changeDefaultAddr = result.find(r => r.isDefault === true && r._id !== addressData._id);
      if (!changeDefaultAddr)
        return Promise.resolve();
      return promiseUtils.mongoNativeUpdatePromise("Address", { _id: changeDefaultAddr._id }, { $set: { isDefault: false } });
    });
  }

}

module.exports = AddressService;