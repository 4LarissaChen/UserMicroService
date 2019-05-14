'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');
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
    return Store.findOne({ where: { _id: storeId } }).then(result => {
      if (!result || result.length == 0)
        throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, "Store");
      return result;
    })
  }

  updateStore(storeId, data) {
    let Store = app.models.Store;
    return this.getStore(storeId).then(result => {
      for (let key in data)
        result[key] = data[key];
      let store = new Store(result);
      return Store.upsert(store);
    });
  }

  getAllStores() {
    let Store = app.models.Store;
    return Store.find();
  }
}

module.exports = StoreService;