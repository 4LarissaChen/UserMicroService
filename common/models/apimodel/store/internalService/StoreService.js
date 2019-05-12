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
    Store.destroyAll({ where: { _id: storeId } });
  }

  getStore(storeId) {
    let Store = app.models.Store;
    Store.findOne({ where: { _id: storeId } }).then(result => {
      if (result.length == 0)
        throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, "Store");
      return result[0];
    })
  }

  updateStore(storeId, data) {
    return this.getStore(storeId).then(result => {
      for (let key in data)
        result[key] = data[key];
      let store = new Store(result);
      return Store.upsert(store);
    });
  }
}

module.exports = StoreService;