
'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');

var CustomerService = require('./internalService/CustomerService.js');
var messageUtils = require('../../../../server/utils/messageUtils.js');
module.exports = function (CustomerAPI) {

  CustomerAPI.remoteMethod('sendMessage', {
    description: "Get message verification code.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'operation', type: 'string', required: true, description: "login/register/changePwd/idVerification", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'SendMessageResponse', description: '', root: true },
    http: { path: '/customer/:tel/sendMessage', verb: 'put', status: 200, errorStatus: 500 }
  });
  CustomerAPI.sendMessage = function (tel, operation, cb) {
    let code = ("00000" + Math.floor(Math.random() * 1000000)).substr(-6);
    return messageUtils.sendMessage(tel, code, operation).then(result => {
      let resp = { code: code };
      return resp;
    });
  };

  CustomerAPI.remoteMethod('login', {
    description: "Customer login.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    { arg: 'code', type: 'string', required: true, description: "Verification code", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/customer/login', verb: 'put', status: 200, errorStatus: 500 }
  });

  CustomerAPI.login = function (tel, code) {
    let Customer = app.models.Customer;
    let customer;
    return Customer.find({ where: { tel: tel } }).then(result => {
      if (result.length == 0)
        customer = {
          _id: tel,
          tel: tel,
          email: "",
          password: "ButChard",
          vipLevel: "0",
          lastLoginDate: moment().utc().format()
        }
      else
        customer = result[0];
      return messageUtils.querySentMessage(tel, code);
    }).then(() => {
      customer.lastLoginDate = moment.utc().format();
      return Customer.upsert(customer);
    }).then(() => {
      return { isSuccess: true };
    }).catch(err => {
      return Promise.resolve(err);
    })
  }
};