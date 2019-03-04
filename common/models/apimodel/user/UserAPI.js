
'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');

var userService = require('./internalService/UserService.js');
var messageUtils = require('../../../../server/utils/messageUtils.js');
module.exports = function (UserAPI) {

  UserAPI.remoteMethod('sendMessage', {
    description: "Get message verification code.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'operation', type: 'string', required: true, description: "login/register/changePwd/idVerification", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'SendMessageResponse', description: '', root: true },
    http: { path: '/butchartuser/:tel/sendMessage', verb: 'post', status: 200, errorStatus: 500 }
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
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/butchartuser/login', verb: 'put', status: 200, errorStatus: 500 }
  });

  UserAPI.login = function (tel, code) {
    let ButchartUser = app.models.ButchartUser;
    let user;
    let now = moment().utc().format();
    return ButchartUser.find({ where: { tel: tel } }).then(result => {
      if (result.length == 0)
      user = {
          _id: tel,
          tel: tel,
          email: "",
          password: "Butchart",
          lastLoginDate: now,
          registerDate: now,
          userProfile: {
            defaultAddress: "",
            accountLevel: "0"
          }
        }
      else
      user = result[0];
      return messageUtils.querySentMessage(tel, code);
    }).then(() => {
      user.lastLoginDate = moment.utc().format();
      return ButchartUser.upsert(user);
    }).then(() => {
      return { isSuccess: true };
    }).catch(err => {
      return Promise.resolve(err);
    })
  }

  UserAPI.remoteMethod('setDefaultAddress', {
    description: "Set default address Id.",
    accepts: [{ arg: 'butchartuserId', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'addressId', type: 'string', required: true, description: "Default address Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/butchartuser/:butchartuserId/address/:addressId', verb: 'put', status: 200, errorStatus: 500 }
  });

};