'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');
var errorConstants = require('../../../../server/constants/errorConstants.js');
var promiseUtils = require('../../../../server/utils/promiseUtils.js');
var StoreService = require('./internalService/StoreService.js');
module.exports = function (StoreAPI) {

  StoreAPI.remoteMethod('createStore', {
    description: "Create a sotre.",
    accepts: [{ arg: 'createData', type: 'CreateStoreRequest', required: true, description: "Create store data.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/store/createStore', verb: 'post', status: 200, errorStatus: 500 }
  });
  StoreAPI.createStore = function (createData) {
    let storeService = new StoreService();
    return storeService.createStore(createData);
  }

  StoreAPI.remoteMethod('deleteStore', {
    description: "Delete a sotre.",
    accepts: [{ arg: 'storeId', type: 'tring', required: true, description: "store id.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/store/deleteStore', verb: 'delete', status: 200, errorStatus: 500 }
  });
  StoreAPI.deleteStore = function (storeId) {
    let storeService = new StoreService()
    return storeService.deleteStore(storeId);
  }

  StoreAPI.remoteMethod('updateStore', {
    description: "Delete a sotre.",
    accepts: [{ arg: 'storeId', type: 'string', required: true, description: "Store id.", http: { source: 'query' } },
    { arg: 'updateData', type: 'UpdateStoreRequest', required: true, description: "Update store data.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/store/updateStore', verb: 'put', status: 200, errorStatus: 500 }
  });
  StoreAPI.updateStore = function(storeId, updateData){
    let storeService = new StoreService();
      return storeService.updateStore(updateData);
  }
}