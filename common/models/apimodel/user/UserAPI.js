
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
var promiseUtils = require('../../../../server/utils/promiseUtils.js');
var artifactConstants = require('../../../../server/constants/apiConstants.js');
var fs = require('fs');
module.exports = function (UserAPI) {

  UserAPI.remoteMethod('floristRegister', {
    description: "注册花艺师账号.",
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
    description: "用户登录.",
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
        return result;
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
    accepts: { arg: 'userId', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    returns: { arg: 'resp', type: 'ButchartUser', description: '', root: true },
    http: { path: '/butchartuser/userId/:userId/getUserInfo', verb: 'get', status: 200, errorStatus: 500 }
  });
  UserAPI.getUserInfo = function (userId) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.findOne({ where: { _id: userId } }).catch(err => err);
  }

  UserAPI.remoteMethod('updateUserInfo', {
    description: "更新用户信息.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'userData', type: 'UpdateUserInfoRequest', required: true, description: "用户信息", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'ButchartUser', description: '', root: true },
    http: { path: '/butchartuser/userId/:userId/updateUserInfo', verb: 'put', status: 200, errorStatus: 500 }
  });
  UserAPI.updateUserInfo = function (userId, userData) {
    let self = this;
    return self.getUserInfo(userId).then(result => {
      let user = apiUtils.parseToObject(result);
      Object.keys(apiUtils.parseToObject(userData)).forEach(key => {
        user[key] = userData[key];
      });
      return promiseUtils.mongoNativeUpdatePromise("ButchartUser", { _id: userId }, user);
    })
  }

  UserAPI.remoteMethod('addToShoppingList', {
    description: "Get products by product series Id.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } },
    { arg: 'productId', type: 'string', required: true, description: "Product id", http: { source: 'path' } },
    { arg: 'quantity', type: 'number', required: true, description: "Quantity", http: { source: 'query' } },
    { arg: 'price', type: 'number', required: true, description: "Price", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/user/:userId/product/:productId/addToShoppingList', verb: 'post', status: 200, errorStatus: [500] }
  });
  UserAPI.addToShoppingList = function (userId, productId, quantity, price) {
    let ButchartUser = app.models.ButchartUser;
    let item = {};
    return ButchartUser.find({ where: { _id: userId } }).then(result => {
      result = result[0].toObject();
      if (result && result.shoppingCart.length > 0)
        result.shoppingCart.forEach(element => {
          if (element.productId == productId) {
            element.quantity += quantity;
            element.addDate = moment().local().format('YYYY-MM-DD HH:mm:ss');
            element.price = price;
            item = element;
          }
        })
      if (item.productId)
        return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { _id: userId }, { $set: { shoppingCart: result.shoppingCart } });
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

  UserAPI.remoteMethod('setDefaultFlorist', {
    description: "Set User's default Florist.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    { arg: 'floristId', type: 'string', required: true, description: "Florist Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/user/:userId/florist/:floristId/setDefaultFlorist', verb: 'put', status: 200, errorStatus: [500] }
  });
  UserAPI.setDefaultFlorist = function (userId, floristId) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.find({ where: { _id: userId } }).then(result => {
      if (result.length == 0)
        throw apiUtils.build404Error(nodeUtil.format(errorConstants.ERROR_MESSAGE_NO_MODEL_FOUND, 'ButchartUser'));
      return promiseUtils.mongoNativeUpdatePromise('ButchartUser', { _id: userId }, { $set: { "userProfile.defaultFlorist": floristId } });
    }).then(() => {
      return { isSuccess: true };
    });
  }

  UserAPI.remoteMethod('getUserCount', {
    description: "获取用户数量.",
    returns: { arg: 'resp', type: 'number', description: 'is success or not', root: true },
    http: { path: '/user/getUserCount', verb: 'get', status: 200, errorStatus: [500] }
  });
  UserAPI.getUserCount = function () {
    let ButchartUser = loopback.findModel("ButchartUser");
    return ButchartUser.find().then(result => ({ resp: result.length }));
  }

  UserAPI.remoteMethod('deleteUserDefaultAddress', {
    description: "Delete user's default address.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/user/:userId/deleteUserDefaultAddress', verb: 'delete', status: 200, errorStatus: [500] }
  });
  UserAPI.deleteUserDefaultAddress = function (userId) {
    return promiseUtils.mongoNativeUpdatePromise("ButchartUser", { _id: userId }, { $unset: { "userProfile.defaultAddress": "" } });
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