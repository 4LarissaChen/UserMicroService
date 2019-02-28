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
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'AddAddressRequest', required: true, description: "Address infomation.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/address/customerId/:customerId/addAddress', verb: 'post', status: 200, errorStatus: 500 }
  });
  AddressAPI.addAddress = function (customerId, addressData) {
    var Address = loopback.findModel("Address");
    let addressInfo = {
      _id: apiUtils.generateShortId("address"),
      customerId: customerId,
      address: addressData.address,
      tel: addressData.tel,
      postcode: addressData.postcode,
      isDefault: addressData.isDefault
    }
    return Address.upsert(addressInfo).then(() => {
      return addressService.changeDefaultAddress(customerId, addressInfo);
    }).then(() => {
      return { isSuccess: true };
    })
  };

  AddressAPI.remoteMethod('modifyAddress', {
    description: "Modify shipping address.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'ModifyAddressRequest', required: true, description: "Address infomation.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/address/customerId/:customerId/modifyAddress', verb: 'put', status: 200, errorStatus: 500 }
  });
  AddressAPI.modifyAddress = function (customerId, addressData) {
    return promiseUtils.mongoNativeUpdatePromise("Address", { _id: addressData._id }, {
      $set: {
        address: addressData.address,
        tel: addressData.tel,
        postcode: addressData.postcode,
        isDefault: addressData.isDefault
      }
    }).then(() => {
      return addressService.changeDefaultAddress(customerId, addressData);
    }).then(() => {
      return { isSuccess: true };
    })
  }

  AddressAPI.remoteMethod('getAddress', {
    description: "Get shipping address.",
    accepts: { arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/address/customerId/:customerId/getAddress', verb: 'get', status: 200, errorStatus: 500 }
  });
  AddressAPI.getAddress = function (customerId) {
    return addressService.getAddress(customerId);
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