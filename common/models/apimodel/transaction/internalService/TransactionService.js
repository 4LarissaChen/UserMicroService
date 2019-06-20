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
    return Transaction.find({ where: { $and: [{ storeId: null }, { floristId: null }] } });
  }
}

module.exports = TransactionService;