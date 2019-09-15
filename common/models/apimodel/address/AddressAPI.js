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
      province: addressData.province,
      city: addressData.city,
      district: addressData.district,
      street: addressData.street,
      tel: addressData.tel,
      postcode: addressData.postcode,
      name: addressData.name,
      sex: addressData.sex,
      isDeleted: 0
    }
    return Address.upsert(addressInfo).then(() => {
      if (isDefault == true)
        return addressService.changeDefaultAddress(userId, addressInfo._id);
      return Promise.resolve();
    }).then(() => {
      return { createdId: addressInfo._id };
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
        province: addressData.province,
        city: addressData.city,
        district: addressData.district,
        street: addressData.street,
        tel: addressData.tel,
        postcode: addressData.postcode,
        sex: addressData.sex,
        name: addressData.name,
        isDeleted: 0
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
    http: { path: '/address/user/:userId/getAddress', verb: 'get', status: 200, errorStatus: 500 }
  });
  AddressAPI.getAddress = function (userId) {
    return addressService.getAddress(userId).then(result => {
      return result.map(r => {
        r = apiUtils.parseToObject(r);
        delete r.isDeleted;
        return r;
      })
    });
  }

  AddressAPI.remoteMethod('deleteAddress', {
    description: "Delete shipping address.",
    accepts: { arg: 'addressId', type: 'string', required: true, description: "Address Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/address/addressId/:addressId/deleteAddress', verb: 'delete', status: 200, errorStatus: 500 }
  })
  AddressAPI.deleteAddress = function (addressId) {
    return promiseUtils.mongoNativeUpdatePromise("Address", { _id: addressId }, { $set: { isDeleted: 1 } });
  }

  AddressAPI.remoteMethod('getAddressById', {
    description: "Get shipping address.",
    accepts: { arg: 'addressId', type: 'string', required: true, description: "Address Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Address'], description: '', root: true },
    http: { path: '/address/address/:addressId/getAddressById', verb: 'get', status: 200, errorStatus: 500 }
  });
  AddressAPI.getAddressById = function (addressId) {
    var Address = loopback.findModel("Address");
    return Address.find({ where: { _id: addressId, isDeleted: 0 }, fields: { isDeleted: false } });
  }
}