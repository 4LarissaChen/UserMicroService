'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');
var errorConstants = require('../../../../server/constants/errorConstants.js');
var promiseUtils = require('../../../../server//utils/promiseUtils.js');

var AddressService = require('./internalService/AddressService.js');
var addressService = new AddressService();

module.exports = function (AddressAPI) {
  AddressAPI.remoteMethod('addAddress', {
    description: "Add shipping address.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'AddAddressRequest', required: true, description: "Address infomation.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/address/userId/:userId/addAddress', verb: 'post', status: 200, errorStatus: 500 }
  });
  AddressAPI.addAddress = function (userId, addressData) {
    var Address = loopback.findModel("Address");
    let isDefault = addressData.isDefault;
    let addressInfo = {
      _id: apiUtils.generateShortId("address"),
      userId: userId,
      address: addressData.address,
      tel: addressData.tel,
      postcode: addressData.postcode,
    }
    return Address.upsert(addressInfo).then(() => {
      if (isDefault == true)
        return addressService.changeDefaultAddress(userId, addressInfo._id);
      return Promise.resolve();
    }).then(() => {
      return { isSuccess: true };
    })
  };

  AddressAPI.remoteMethod('modifyAddress', {
    description: "Modify shipping address.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'ModifyAddressRequest', required: true, description: "Address infomation.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/address/userId/:userId/modifyAddress', verb: 'put', status: 200, errorStatus: 500 }
  });
  AddressAPI.modifyAddress = function (userId, addressData) {
    return promiseUtils.mongoNativeUpdatePromise("Address", { _id: addressData._id }, {
      $set: {
        address: addressData.address,
        tel: addressData.tel,
        postcode: addressData.postcode
      }
    }).then(() => {
      if (addressData.isDefault == true)
        return addressService.changeDefaultAddress(userId, addressData._id);
      return Promise.resolve();
    }).then(() => {
      return { isSuccess: true };
    })
  }

  AddressAPI.remoteMethod('getAddress', {
    description: "Get shipping address.",
    accepts: { arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/address/userId/:userId/getAddress', verb: 'get', status: 200, errorStatus: 500 }
  });
  AddressAPI.getAddress = function (userId) {
    return addressService.getAddress(userId);
  }

  AddressAPI.remoteMethod('deleteAddress', {
    description: "Delete shipping address.",
    accepts: { arg: 'addressId', type: 'string', required: true, description: "Address Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/address/addressId/:addressId/deleteAddress', verb: 'delete', status: 200, errorStatus: 500 }
  })
  AddressAPI.deleteAddress = function (addressId) {
    var Address = loopback.findModel("Address");
    return Address.destroyAll({ _id: addressId });
  }
}