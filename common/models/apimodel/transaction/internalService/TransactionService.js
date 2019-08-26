'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');
var loopback = require('loopback');
var apiUtils = require('../../../../../server/utils/apiUtils.js');
var errorConstants = require('../../../../../server/constants/errorConstants.js');
var promiseUtils = require('../../../../../server/utils/promiseUtils.js');
class TransactionService {

  createTransaction(data) {
    let Transaction = app.models.Transaction;
    return Transaction.upsert(data);
  }
  getTransactionById(transactionId) {
    let Transaction = app.models.Transaction;
    return Transaction.find({ where: { _id: transactionId } }).then(result => {
      if (result.length == 0)
        throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, 'Transaction');
      return result[0];
    });
  }

  updateTransaction(where, data) {
    return promiseUtils.mongoNativeUpdatePromise("Transaction", where, data);
  }

  getTransactionOwnerId(transactionId) {
    let Transaction = loopback.findModel("Transaction");
    return Transaction.findOne({ where: { "_id": transactionId } });
  }

  getUnassignedTransactions() {
    let Transaction = loopback.findModel("Transaction");
    return Transaction.find({ where: { $and: [{ storeId: null }, { status: "Payed" }] } });
  }

  searchTransactions(filter, page) {
    var Transaction = app.models.Transaction;
    filter = apiUtils.parseToObject(filter);
    var conditions = [];
    if (filter.userId && filter.userId !== "")
      conditions.push({ userId: filter.userId });
    if (filter.floristId && filter.floristId !== "")
      conditions.push({ floristId: filter.floristId });
    if (filter.storeId && filter.storeId !== "")
      conditions.push({ storeId: filter.storeId });
    if (filter.status) {
      if (filter.status instanceof Array && filter.status.length && filter.status.length > 0)
        filter.status.forEach(s => conditions.push({ status: s }));
      conditions.push({ status: filter.status });
    }
    if (filter.fromDate && filter.fromDate !== "")
      conditions.push({ createDate: { "$gte": filter.fromDate } });
    if (filter.fromDate == null)
      conditions.push({ createDate: { "$gte": '2019-01-01 00:00:00' } });
    if (filter.toDate && filter.toDate !== "")
      conditions.push({ createDate: { "$lte": filter.toDate } });
    if (filter.toDate == null)
      conditions.push({ createDate: { "$lte": moment().local().format('YYYY-MM-DD HH:mm:ss') } });
    let option = {
      where: { "$and": conditions },
      order: 'createDate DESC'
    }
    if (page != null && page > 0) {
      option.limit = 10;
      option.skip = (page - 1) * 10;
    }
    return Transaction.find(option).catch(err => {
      throw err;
    });
  }

  searchTransactionsWithAddress(filter, page) {
    let self = this;
    return self.searchTransactions(filter, page).then(result => {
      let Address = loopback.findModel("Address");
      let Store = loopback.findModel("Store");
      return Promise.map(result, tran => {
        return new Promise((resolve, reject) => {
          if (tran.addressId)
            return resolve(Address.findOne({ where: { _id: tran.addressId } }));
          else if (tran.addressId == null && tran.logistics.deliveryMethod == "自取")
            return resolve(Store.findOne({ where: { _id: tran.storeId }, fields: { province: true, city: true, street: true, name: true , _id: true} }));
          else
            return reject();
        }).then(result => {
          tran.address = result;
          delete tran.addressId
          return tran;
        });
      });
    });
  }

}

module.exports = TransactionService;