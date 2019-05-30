'use strict'
var app = require('../../../../../server/server.js');
var loopback = require('loopback');
var moment = require('moment');
var Promise = require('bluebird');
var promiseUtils = require('../../../../../server/utils/promiseUtils.js');
var apiUtils = require('../../../../../server/utils/apiUtils.js');
var errorConstants = require('../../../../../server/constants/errorConstants.js');

class StoreService {

  createStore(data) {
    data._id = apiUtils.generateShortId('store');
    let Store = app.models.Store;
    return Store.upsert(data);
  }

  deleteStore(storeId) {
    let Store = app.models.Store;
    return Store.destroyAll({ where: { _id: storeId } });
  }

  getStore(storeId) {
    let Store = app.models.Store;
    return Store.findOne({ where: { "_id": storeId } }).then(result => {
      if (!result)
        throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, "Store");
      return result;
    })
  }

  updateStore(data) {
    let Store = app.models.Store;
    return Store.upsert(data);
  }

  getAllStores() {
    let Store = app.models.Store;
    return Store.find();
  }

  bindFlorist(storeId, floristId) {
    return promiseUtils.mongoNativeUpdatePromise("Store", { _id: storeId }, { $addToSet: { florists: floristId } });
  }

  unbindFlorist(storeId, floristId) {
    return promiseUtils.mongoNativeUpdatePromise("Store", { _id: storeId }, { $pull: { florists: floristId } });
  }

  getStoreByFlorist(floristId) {
    let Store = loopback.findModel("Store");
    return Store.findOne({ where: { florists: floristId } });
  }
}

module.exports = StoreService;