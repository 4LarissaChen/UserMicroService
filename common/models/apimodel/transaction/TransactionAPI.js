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
var TransactionService = require('./internalService/TransactionService.js');
module.exports = function (TransactionAPI) {

  TransactionAPI.remoteMethod('createTransaction', {
    description: "Create transaction.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    { arg: 'createData', type: 'CreateTransactionRequest', required: true, description: "Create transaction data.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/userId/:userId/order/:orderId/store/:storeId/address/:addressId', verb: 'post', status: 200, errorStatus: 500 }
  });
  TransactionAPI.createTransaction = function (userId, createData) {
    let transactionService = new TransactionService();
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.count({ _id: userId }).then(result => {
      if (result == 0) throw apiUtils.build404Error(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, "ButchartUser");
      createData = createData.__data;
      createData._id = apiUtils.generateShortId("transaction");
      createData.userId = userId;
      createData.status = "unpayed";
      createData.createDate = moment().local().format('YYYY-MM-DD HH:mm:ss');
      createData.logistics = createData.logistics.__data;
      createData.productList = createData.productList.map(r => r.__data);
      return transactionService.createTransaction(createData);
    }).then(() => {
      return { createdId: createData._id };
    });
  }

  TransactionAPI.remoteMethod('updateTransaction', {
    description: "Create transaction.",
    accepts: [{ arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } },
    { arg: 'updateData', type: 'UpdateTransactionRequest', required: true, description: "Update transaction data", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/transaction/:transactionId/updateTransaction', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.updateTransaction = function (transactionId, updateData) {
    let transactionService = new TransactionService();
    return transactionService.getTransactionById(transactionId).then(result => {
      updateData = updateData.__data;
      for (let key in updateData)
        result.__data[key] = updateData[key];
      return transactionService.updateTransaction(result.__data);
    }).then(() => ({ isSuccess: true })).catch(err => {
      throw err;
    });
  }

  TransactionAPI.remoteMethod('getUserOwnedTransactions', {
    description: "Get user owend transactions.",
    accepts: { arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/userId/:userId/getUserOwnedTransactions', verb: 'get', status: 200, errorStatus: 500 }
  });
  TransactionAPI.getUserOwnedTransactions = function (userId) {
    var Transaction = app.models.Transaction;
    return Transaction.find({ userId: userId }).then(result => {
      return result.sort((a, b) => a.createDate <= b.createDate);
    })
  }

  TransactionAPI.remoteMethod('getTransactionById', {
    description: "Get transaction by Id.",
    accepts: [{ arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/transaction/:transactionId/getTransactionById', verb: 'get', status: 200, errorStatus: 500 }
  });
  TransactionAPI.getTransactionById = function (transactionId) {
    let transactionService = new TransactionService();
    return transactionService.getTransactionById(transactionId);
  }

  TransactionAPI.remoteMethod('searchTransaction', {
    description: "Search transactions by conditions.",
    accepts: [{ arg: 'filter', type: 'SearchTransactionRequest', required: true, description: "Conditions", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/transaction/searchTransaction', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.searchTransaction = function (filter) {
    var Transaction = app.models.Transaction;
    filter = filter.__data;
    var conditions = [];
    if (filter.userId && filter.userId !== "")
      conditions.push({ userId: filter.userId });
    if (filter.status && filter.status !== "")
      conditions.push({ status: filter.status });
    if (filter.fromDate && filter.fromDate !== "")
      conditions.push({ createDate: { "$gt": moment(filter.fromDate).format('YYYY-MM-DD HH:mm:ss') } });
    if (filter.toDate && filter.toDate !== "")
      conditions.push({ createDate: { "$lt": moment(filter.toDate).format('YYYY-MM-DD HH:mm:ss') } })
    return Transaction.find({ where: { "$and": conditions } }).then(result => {
      return result.sort((a, b) => { a.createDate <= b.createDate });
    })
  }

  TransactionAPI.remoteMethod('getTransactionOwnerId', {
    description: "Search transactions by conditions.",
    accepts: [{ arg: 'transactionId', type: 'string', required: true, description: "Transaction Id.", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'string', description: '', root: true },
    http: { path: '/transaction/:transactionId/getTransactionOwnerId', verb: 'get', status: 200, errorStatus: 500 }
  });
  TransactionAPI.getTransactionOwnerId = function (transactionId) {
    var transactionService = new TransactionService();
    return transactionService.getTransactionOwnerId(transactionId).catch(err => {
      throw err;
    })
  }

  TransactionAPI.remoteMethod('getUnassignedTransactions', {
    description: "Get all the unassigned transactions.",
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/transaction/getUnassignedTransactions', verb: 'get', status: 200, errorStatus: 500 }
  });
  TransactionAPI.getUnassignedTransactions = function(){
    var transactionService = new TransactionService()
    return transactionService.getUnassignedTransactions().catch(err => err);
  }
}