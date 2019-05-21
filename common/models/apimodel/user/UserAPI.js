
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
var artifactConstants = require('../../../../server/constants/apiConstants.js');
var fs = require('fs');
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

  UserAPI.remoteMethod('floristRegister', {
    description: "Florist register.",
    accepts: [{ arg: 'registerData', type: 'FloristRegisterRequest', required: true, description: "Florist register data", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'ButchartUser', description: '', root: true },
    http: { path: '/user/floristRegister', verb: 'put', status: 200, errorStatus: [500] }
  });
  UserAPI.floristRegister = function (registerData) {
    let telReg = /^1\d{10}$/;
    if (!telReg.test(registerData.tel))
      throw apiUtils.build500Error(errorConstants.ERROR_NAME_INVALID_INPUT_PARAMETERS, "Phone number is invalid!");
    let userService = new UserService();
    registerData.florist._id = apiUtils.generateShortId("florist");
    return ButchartUser.find({ where: { tel: tel } }).then(result => {
      if (result.length == 0)
        return userService.createUser(registerData);
      else
        if (!result[0].florist._id)
          throw apiUtils.build500Error(errorConstants.ERROR_TARGET_MODEL_EXISTS, "Florist")
    })
  }

  UserAPI.remoteMethod('login', {
    description: "User login.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    { arg: 'code', type: 'string', required: true, description: "Verification code", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'ButchartUser', description: '', root: true },
    http: { path: '/user/login', verb: 'post', status: 200, errorStatus: [500] }
  });

  UserAPI.login = function (tel, code) {
    let AccessToken = loopback.findModel("AccessToken");
    let ButchartUser = loopback.findModel("ButchartUser");
    let AuthorizationAPI = loopback.findModel("AuthorizationAPI");
    let userService = new UserService();
    let telReg = /^1\d{10}$/;
    let resp;
    if (!telReg.test(tel))
      throw apiUtils.build500Error(errorConstants.ERROR_NAME_INVALID_INPUT_PARAMETERS, "Phone number is invalid!");
    return ButchartUser.find({ where: { tel: tel } }).then(result => {
      if (result.length == 0)
        return userService.createUser({ tel: tel });
      else
        return messageUtils.querySentMessage(tel, code).then(() => result)
    }).then(result => {
      resp = result[0];
      return app.models.AuthorizationAPI.getButchartUserRoles(resp._id);
    }).then(result => {
      resp.roles = result;
      return AccessToken.destroyAll({ "userId": tel }).then(() => {
        return ButchartUser.login({ username: tel, password: artifactConstants.BUTCHARTUSER_DEFAULT_PWD });
      })
    }).then(result => {
      resp.token = result;
      return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { "_id": tel }, { $set: { "lastLoginDate": moment().local().format('YYYY-MM-DD HH:mm:ss') } });
    }).then(() => {
      return AuthorizationAPI.assignRoleToButchartUser(tel, "Customer");
    }).then(() => resp).catch(err => {
      throw err;
    })
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
    description: "Update shopping cart.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } },
    { arg: 'data', type: ['ShoppingCartItem'], required: true, description: "Shopping item list.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/workspace/user/:userId/updateShoppingList', verb: 'put', status: 200, errorStatus: [500] }
  });
  UserAPI.updateShoppingList = function (userId, data) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.find({ where: { _id: userId } }).then(result => {
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

  UserAPI.remoteMethod('setStaticData', {
    description: "Get florist.",
    accepts: [{ arg: 'modelNames', type: ['string'], required: true, description: "Model Names.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/user/setStaticData', verb: 'post', status: 200, errorStatus: [500] }
  });
  UserAPI.setStaticData = function (modelNames) {
    return Promise.map(modelNames, modelName => {
      let model = loopback.findModel(modelName);
      let data = JSON.parse(fs.readFileSync(__dirname + '/../../data/dummy/' + modelName + '.json'));
      return Promise.map(data, element => {
        element._id = apiUtils.generateShortId(modelName);
        return model.create(element);
      });
    }).then(() => {
      let relationship = JSON.parse(fs.readFileSync(__dirname + '/../../data/Relationship.json'));
      return Promise.map(Object.keys(relationship), key => {
        let fromModel = loopback.findModel(key.split('2')[0]);
        let toModel = loopback.findModel(key.split('2')[1]);
        let fromNodes = [];
        return Promise.map(relationship[key], element => {
          return toModel.findOne({ where: { name: element.to } }).then(result => {
            if (!result)
              console.log(element.to);
            return promiseUtils.mongoNativeUpdatePromise('ProductSeries', { name: element.from }, { $addToSet: { includeProducts: result._id } })
          })
        })
      })
    })
  }
}; 