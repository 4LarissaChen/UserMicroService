
'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');

var butchartUserService = require('./internalService/ButchartUserService.js');
var messageUtils = require('../../../../server/utils/messageUtils.js');
module.exports = function (ButchartUserAPI) {

  ButchartUserAPI.remoteMethod('sendMessage', {
    description: "Get message verification code.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'operation', type: 'string', required: true, description: "login/register/changePwd/idVerification", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'SendMessageResponse', description: '', root: true },
    http: { path: '/butchartuser/:tel/sendMessage', verb: 'put', status: 200, errorStatus: 500 }
  });
  ButchartUserAPI.sendMessage = function (tel, operation, cb) {
    let code = ("00000" + Math.floor(Math.random() * 1000000)).substr(-6);
    return messageUtils.sendMessage(tel, code, operation).then(result => {
      let resp = { code: code };
      return resp;
    });
  };

  ButchartUserAPI.remoteMethod('login', {
    description: "ButchartUser login.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    { arg: 'code', type: 'string', required: true, description: "Verification code", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/butchartuser/login', verb: 'put', status: 200, errorStatus: 500 }
  });

  ButchartUserAPI.login = function (tel, code) {
    let ButchartUser = app.models.ButchartUser;
    let butchartuser;
    let now = moment().utc().format();
    return ButchartUser.find({ where: { tel: tel } }).then(result => {
      if (result.length == 0)
        butchartuser = {
          _id: tel,
          tel: tel,
          email: "",
          password: "ButChart",
          lastLoginDate: now,
          registerDate: now,
          userProfile: {
            defaultAddress: "",
            accountLevel: "0"
          }
        }
      else
        butchartuser = result[0];
      return messageUtils.querySentMessage(tel, code);
    }).then(() => {
      butchartuser.lastLoginDate = moment.utc().format();
      return ButchartUser.upsert(butchartuser);
    }).then(() => {
      return { isSuccess: true };
    }).catch(err => {
      return Promise.resolve(err);
    })
  }

  ButchartUserAPI.remoteMethod('setDefaultAddress', {
    description: "Set default address Id.",
    accepts: [{ arg: 'butchartuserId', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'addressId', type: 'string', required: true, description: "Default address Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/butchartuser/:butchartuserId/address/:addressId', verb: 'put', status: 200, errorStatus: 500 }
  });

};