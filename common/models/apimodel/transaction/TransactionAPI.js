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
module.exports = function (TransactionAPI) {

  TransactionAPI.remoteMethod('createTransaction', {
    description: "Create transaction.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "ButchartUser Id", http: { source: 'path' } },
    { arg: 'orderId', type: 'string', required: true, description: "Order Id", http: { source: 'path' } },
    { arg: 'addressId', type: 'string', required: true, description: "Address Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/userId/:userId/order/:orderId/store/:storeId/address/:addressId', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.createTransaction = function (userId, orderId, addressId) {
    let Transaction = app.models.Transaction;
    let ButchartUser = app.models.ButchartUser;
    let transaction = {
      _id: apiUtils.generateShortId("transaction"),
      userId: userId,
      orderId: orderId,
      address: addressId,
      createDate: moment().utc().format(),
      status: 'unpayed'
    };
    return ButchartUser.count({ _id: userId }).then(result => {
      if (result == 0) throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, "ButchartUser");
      return Transaction.upsert(transaction);
    }).then(() => {
      return { isSuccess: true }
    });
  }

  TransactionAPI.remoteMethod('changeStatus', {
    description: "Change transaction status.",
    accepts: [{ arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } },
    { arg: 'status', type: 'string', required: true, description: "transaction status", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/transaction/:transactionId/changeStatus', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.changeStatus = function (transactionId, status) {
    let Transaction = app.models.Transaction;
    return Transaction.findOne({ _id: transactionId }).then(result => {
      if (!result) throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, "Transaction");
      return promiseUtils.mongoNativeUpdatePromise("Transaction", { _id: transactionId }, { $set: { status: status, payedDate: moment().utc().format() } });
    }).then(() => {
      return { isSuccess: true };
    })
  }

  TransactionAPI.remoteMethod('getButchartUserOwnedTransactions', {
    description: "Get ButchartUser owend transactions.",
    accepts: { arg: 'userId', type: 'string', required: true, description: "ButchartUser Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/userId/:userId/getButchartUserOwnedTransactions', verb: 'get', status: 200, errorStatus: 500 }
  });
  TransactionAPI.getButchartUserOwnedTransactions = function (userId) {
    var Transaction = app.models.Transaction;
    return Transaction.find({ userId: userId }).then(result => {
      return result.sort((a, b) => a.createDate <= b.createDate);
    })
  }

  TransactionAPI.remoteMethod('getTransactionById', {
    description: "Get transaction by Id.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "ButchartUser Id", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/userId/:userId/transactionId/:transactionId/getTransactionById', verb: 'get', status: 200, errorStatus: 500 }
  });
  TransactionAPI.getTransactionById = function (userId, transactionId) {
    var Transaction = app.models.Transaction;
    return Transaction.findOne({ transactionId: transactionId });
  }

  TransactionAPI.remoteMethod('searchTransaction', {
    description: "Search transactions by conditions.",
    accepts: [{ arg: 'filter', type: 'SearchTransactionRequest', required: true, description: "Conditions", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/transaction/searchTransaction', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.searchTransaction = function (filter) {
    var Transaction = app.models.Transaction;
    var conditions = [];
    if (filter.userId !== "")
      conditions.push({ userId: filter.userId });
    if (filter.status !== "")
      conditions.push({ status: filter.status });
    if (filter.fromDate !== "")
      conditions.push({ createDate: { "$gt": filter.fromDate } });
    if (filter.toDate !== "")
      conditions.push({ createDate: { "$lt": filter.toDate } })
    return Transaction.find({ where: { "$and": conditions } }).then(result => {
      return result.sort((a, b) => { a.createDate <= b.createDate });
    })
  }
}