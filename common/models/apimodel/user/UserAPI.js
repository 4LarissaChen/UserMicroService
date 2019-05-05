
'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');
var errorConstants = require('../../../../server/constants/errorConstants.js');
var UserService = require('./internalService/UserService.js');
var messageUtils = require('../../../../server/utils/messageUtils.js');
var promiseUtils = require('../../../../server/utils/promiseUtils.js');
module.exports = function (UserAPI) {

  UserAPI.remoteMethod('sendMessage', {
    description: "Get message verification code.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'operation', type: 'string', required: true, description: "login/register/changePwd/idVerification", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'SendMessageResponse', description: '', root: true },
    http: { path: '/user/:tel/sendMessage', verb: 'post', status: 200, errorStatus: 500 }
  });
  UserAPI.sendMessage = function (tel, operation, cb) {
    let code = ("00000" + Math.floor(Math.random() * 1000000)).substr(-6);
    return messageUtils.sendMessage(tel, code, operation).then(result => {
      let resp = { code: code };
      return resp;
    });
  };

  UserAPI.remoteMethod('login', {
    description: "User login.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    { arg: 'code', type: 'string', required: true, description: "Verification code", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'ButchartUser', description: '', root: true },
    http: { path: '/user/login', verb: 'post', status: 200, errorStatus: [500] }
  });

  UserAPI.login = function (tel, code) {
    let telReg = /^1\d{10}$/;
    if (!telReg.test(tel))
      throw apiUtils.build500Error(errorConstants.ERROR_NAME_INVALID_INPUT_PARAMETERS, "Phone number is invalid!");
    let ButchartUser = app.models.ButchartUser;
    let userService = new UserService();
    return ButchartUser.find({ where: { tel: tel } }).then(result => {
      if (result.length == 0)
        return userService.createUser(tel);
      else
        return messageUtils.querySentMessage(tel, code).then(() => {
          result[0].lastLoginDate = moment().local().format('YYYY-MM-DD HH:mm:ss');
          return ButchartUser.upsert(result[0])
        });
    });
  }

  UserAPI.remoteMethod('getUserInfo', {
    description: "Get user information.",
    accepts: { arg: 'userId', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    returns: { arg: 'resp', type: 'ButchartUser', description: '', root: true },
    http: { path: '/butchartuser/userId/:userId/getUserInfo', verb: 'get', status: 200, errorStatus: 500 }
  });
  UserAPI.getUserInfo = function (userId) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.find({ where: { _id: userId } }).catch(err => err);
  }

  UserAPI.remoteMethod('addToShoppingList', {
    description: "Get products by product series Id.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } },
    { arg: 'productId', type: 'string', required: true, description: "Product id", http: { source: 'path' } },
    { arg: 'quantity', type: 'string', required: true, description: "Quantity", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/user/:userId/product/:productId/addToShoppingList', verb: 'post', status: 200, errorStatus: [500] }
  });
  UserAPI.addToShoppingList = function (userId, productId, quantity) {
    let ButchartUser = app.models.ButchartUser;
    let item = {};
    return ButchartUser.find({ where: { _id: userId } }).then(result => {
      if (result[0] && result[0].shoppingCart.length > 0)
        result[0].shoppingCart.forEach(element => {
          if (element.productId == productId) {
            element.quantity += quantity;
            item = element;
          }
        })
      if (item.productId)
        return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { _id: userId }, { $set: { shoppingCart: result[0].shoppingCart } });
      else
        item = {
          productId: productId,
          quantity: quantity,
          addDate: moment().local().format('YYYY-MM-DD HH:mm:ss')
        }
      return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { _id: userId }, { $addToSet: { shoppingCart: item } });
    }).then(() => {
      return { isSuccess: true };
    }).catch(err => {
      throw err;
    })
  }

  UserAPI.remoteMethod('updateShoppingList', {
    description: "Get products by product series Id.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } },
    { arg: 'data', type: ['ShoppingCartItem'], required: true, description: "User id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/workspace/user/:userId/updateShoppingList', verb: 'put', status: 200, errorStatus: [500] }
  });
  UserAPI.updateShoppingList = function (userId, data) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.find({ where: { _id: userId } }).then(resul => {
      if (result.length == 0)
        throw apiUtils.build404Error(nodeUtil.format(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, 'ButchartUser'));
      return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { _id: userId }, { $set: { shoppingCart: data } });
    })
  }

  UserAPI.remoteMethod('getShoppingList', {
    description: "Get products by product series Id.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: ['ShoppingCartItem'], description: 'is success or not', root: true },
    http: { path: '/user/:userId/getShoppingList', verb: 'get', status: 200, errorStatus: [500] }
  });
  UserAPI.getShoppingList = function (userId) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.find({ where: { _id: userId } }).then(result => {
      if (result.length == 0)
        throw apiUtils.build404Error(nodeUtil.format(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, 'ButchartUser'));
      return Promise.resolve(result[0].shoppingCart);
    })
  }

  UserAPI.remoteMethod('updateCustomerPool', {
    description: "updateCustomerPool florist's customer pool.",
    accepts: [{ arg: 'floristId', type: 'string', required: true, description: "Florist Id", http: { source: 'path' } },
    { arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/florist/:floristId/updateCustomerPool', verb: 'put', status: 200, errorStatus: [500] }
  });
  UserAPI.updateCustomerPool = function (floristId, customerId) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.find({ where: { _id: userId } }).then(resul => {
      if (result.length == 0)
        throw apiUtils.build404Error(nodeUtil.format(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, 'ButchartUser'));
      return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { customerPool: customerId }, { $pull: { customerPool: customerId } });
    }).then(result => {
      return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { _id: floristId }, { $addToSet: { customerPool: customerId } })
    }).then(() => {
      return { isSuccess: true };
    })
  }

  UserAPI.remoteMethod('setDefaultFlorist', {
    description: "Set User's default Florist.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    { arg: 'floristId', type: 'string', required: true, description: "Florist Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/user/:userId/florist/:floristId/setDefaultFlorist', verb: 'put', status: 200, errorStatus: [500] }
  });
  UserAPI.setDefaultFlorist = function (userId, floristId) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.find({ where: { _id: userId } }).then(resul => {
      if (result.length == 0)
        throw apiUtils.build404Error(nodeUtil.format(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, 'ButchartUser'));
      return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { _id: userId }, { $set: { "userProfile.defaultFlorist": floristId } });
    }).then(() => {
      return { isSuccess: true };
    });
  }
}; 