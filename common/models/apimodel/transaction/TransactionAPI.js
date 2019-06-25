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
      createData = createData.toObject();
      createData._id = apiUtils.generateShortId("transaction");
      createData.userId = userId;
      createData.status = "Unpayed";
      createData.createDate = moment().format('YYYY-MM-DD HH:mm:ss');
      createData.logistics = createData.logistics;
      createData.productList = createData.productList;
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
      updateData = apiUtils.parseToObject(updateData);
      result = apiUtils.parseToObject(result);
      for (let key in updateData)
        if (updateData[key] != null)
          result[key] = updateData[key];
      return transactionService.updateTransaction({ _id: transactionId }, result);
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
    filter = apiUtils.parseToObject(filter);
    var conditions = [];
    if (filter.userId && filter.userId !== "")
      conditions.push({ userId: filter.userId });
    if (filter.status) {
      if (filter.status instanceof Array && filter.status.length && filter.status.length > 0)
        filter.status.forEach(s => conditions.push({ status: s }));
      conditions.push({ status: filter.status });
    }
    if (filter.fromDate && filter.fromDate !== "")
      conditions.push({ createDate: { "$gte": filter.fromDate } });
    if (filter.toDate && filter.toDate !== "")
      conditions.push({ createDate: { "$lte": filter.toDate } })
    return Transaction.find({ where: { "$and": conditions } }).then(result => {
      return result.sort((a, b) => { a.createDate <= b.createDate });
    }).catch(err => {
      throw err;
    });
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
  TransactionAPI.getUnassignedTransactions = function () {
    var transactionService = new TransactionService();
    return transactionService.getUnassignedTransactions().catch(err => err);
  }

  TransactionAPI.remoteMethod('changeTransactionToAfterSales', {
    description: "Search transactions by conditions.",
    accepts: [{ arg: 'transactionId', type: 'string', required: true, description: "Transaction Id.", http: { source: 'path' } },
    { arg: 'data', type: 'ChangeTransactionToAfterSalesRequest', required: true, description: "Feedback data.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/transaction/:transactionId/changeTransactionToAfterSales', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.changeTransactionToAfterSales = function (transactionId, data) {
    var transactionService = new TransactionService();
    let transaction;
    data.date = moment(data.date).local();
    return transactionService.getTransactionById(transactionId).then(result => {
      transaction = result;
      return transactionService.updateTransaction({ _id: transactionId }, { status: "AfterSales" });
    }).then(() => {
      let feedback = {
        _id: apiUtils.generateShortId("Feedback"),
        appraisal: data.appraisal,
        pics: data.pics,
        comment: data.comment,
        beginDate: moment().local().format('YYYY-MM-DD HH:mm:ss'),
        logistics: {
          deliveryMethod: transaction.logistics.deliveryMethod,
          freight: transaction.logistics.freight
        }
      };
      return transactionService.updateTransaction({ _id: transactionId }, { $push: { feedback: { $each: [feedback], $sort: { beginDate: -1 } } } });
    }).then(() => {
      return { isSuccess: true };
    }).catch(err => {
      throw err;
    });
  }

  TransactionAPI.remoteMethod('addAfterSalesLogisticsInfo', {
    description: "Search transactions by conditions.",
    accepts: [{ arg: 'transactionId', type: 'string', required: true, description: "Transaction Id.", http: { source: 'path' } },
    { arg: 'trackingId', type: 'string', required: true, description: "运单号码.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/transaction/:transactionId/addAfterSalesLogisticsInfo', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.addAfterSalesLogisticsInfo = function (transactionId, trackingId) {
    var transactionService = new TransactionService();
    let feedbackId;
    return transactionService.getTransactionById(transactionId).then(result => {
      transaction = result;
      feedbackId = apiUtils.parseToObject(result).feedback[0]._id;
      return transactionService.updateTransaction({ "feedback._id": feedbackId }, { trackingId: trackingId, type: "Send", finishDate: moment().local().format('YYYY-MM-DD HH:mm:ss') });
    }).then(() => ({ isSuccess: true })).catch(err => {
      throw err;
    })
  }

  TransactionAPI.remoteMethod('getDeliveryMethods', {
    description: "Get all delivery methods.",
    returns: { arg: 'resp', type: ['DeliveryMethod'], description: '', root: true },
    http: { path: '/transaction/getDeliveryMethods', verb: 'get', status: 200, errorStatus: 500 }
  });
  TransactionAPI.getDeliveryMethods = function () {
    var DeliveryMethod = loopback.findModel("DeliveryMethod");
    return DeliveryMethod.find({}).then(result => {
      return apiUtils.parseToObject(result);
    });
  }

  TransactionAPI.remoteMethod('addCommentToTransaction', {
    description: "向Transaction添加comment.",
    accepts: [{ arg: 'transactionId', type: 'string', required: true, description: "Transaction Id.", http: { source: 'path' } },
    { arg: 'comment', type: 'string', required: true, description: "comment.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/transaction/:transactionId/addCommentToTransaction', verb: 'put', status: 200, errorStatus: 500 }
  });
  TransactionAPI.addCommentToTransaction = function (transactionId, comment) {
    var transactionService = new TransactionService();
    return transactionService.getTransactionById(transactionId).then(result => {
      comment = apiUtils.parseToObject(commnet);
      return transactionService.updateTransaction({ _id: transactionId }, { comment: comment });
    });
  }
}