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
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    { arg: 'orderId', type: 'string', required: true, description: "Order Id", http: { source: 'path' } },
    { arg: 'storeId', type: 'string', required: true, description: "Store Id", http: { source: 'path' } },
    { arg: 'addressId', type: 'string', required: true, description: "Address Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/customer/:customerId/order/:orderId/store/:storeId/address/:addressId', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.createTransaction = function (customerId, orderId, storeId, addressId) {
    let Transaction = app.models.Transaction;
    let Customer = app.models.Customer;
    let transaction = {
      _id: apiUtils.generateShortId("transaction"),
      customerId: customerId,
      orderId: orderId,
      store: storeId,
      address: addressId,
      createTime: moment().utc().format(),
      status: 'unpayed'
    };
    return Customer.count({ _id: customerId }).then(result => {
      if (result == 0) throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, "Customer");
      return Transaction.upsert(transaction);
    }).then(() => {
      return { isSuccess: true }
    });
  }

  TransactionAPI.remoteMethod('changeStatus', {
    description: "Create transaction.",
    accepts: [{ arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } },
    { arg: 'status', type: 'string', required: true, description: "transaction status", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/transaction/:transactionId/changeStatus', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.changeStatus = function (transactionId, status) {
    let Transaction = app.models.Transaction;
    return Transaction.findOne({ _id: transactionId }).then(result => {
      if (!result) throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, "Transaction");
      return promiseUtils.mongoNativeUpdatePromise("Transaction", { _id: transactionId }, { $set: { status: status } });
    }).then(() => {
      return { isSuccess: true };
    })
  }

  TransactionAPI.remoteMethod('getCustomerOwnedTransactions', {
    description: "Get customer owend transactions.",
    accepts: { arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/transaction/:transactionId/getCustomerOwnedTransactions', verb: 'get', status: 200, errorStatus: 500 }
  });
  TransactionAPI.getCustomerOwnedTransactions = function (customerId) {
    var transaction = app.models.Transaction;
    return transaction.find({ customerId: customerId });
  }

  TransactionAPI.remoteMethod('searchTransaction', {
    description: "Get customer owend transactions.",
    accepts: [{ arg: 'filter', type: 'SearchTransactionRequest', required: true, description: "Filter", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/transaction/:transactionId/searchTransaction', verb: 'post', status: 200, errorStatus: 500 }
  });
  TransactionAPI.searchTransaction = function (customerId, filter) {
    var transaction = app.models.Transaction;
    return transaction.find(filter);
  }
}