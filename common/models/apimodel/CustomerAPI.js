'use strict'
var app = require('../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');

var apiUtils = require('../../../server/utils/apiUtils.js');
var messageUtils = require('../../../server/utils/messageUtils.js');
var CustomerService = require('./internalServices/CustomerService.js');

module.exports = function (CustomerAPI) {
  apiUtils.disableRelatedModelRemoteMethod(CustomerAPI);


  CustomerAPI.remoteMethod('createCustomer', {
    description: "Create a customer.",
    accepts: { arg: 'tel', type: 'string', required: true, description: "User telephont number.", http: { source: 'path' } },
    return: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/customer/created/:tel', verb: 'post', status: 200, errorStatus: [500] }
  });
  CustomerAPI.createCustomer = function (tel) {
    let Customer = app.models.Customer;
    return Customer.find({ where: { tel: tel } }).then(result => {
      if (result.length > 0)
        throw new Error("User already exists.");
      let customer = {
        _id: tel,
        tel: tel,
        email: "",
        registerDate: moment().utc().format(),
        password: "ButChard",
        vipLevel: "0",
        lastLoginDate: moment().utc().format()
      }
      return Customer.create(customer);
    }).then(() => {
      return { "isSuccess": true };
    })
  }

  CustomerAPI.remoteMethod('sendMessage', {
    description: "Get message verification code.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'operation', type: 'string', required: true, description: "login/register/changePwd/idVerification", http: { source: 'query' } }],
    return: { arg: 'resp', type: 'SendMessageResponse', description: "", root: true },
    http: { path: '/customer/sendMessage/:tel', verb: 'put', status: 200, errorStatus: [500] }
  });
  CustomerAPI.sendMessage = function (tel, operation) {
    let code = ("00000" + Math.floor(Math.random() * 1000000)).substr(-6);
    // return messageUtils.sendMessage(tel, code, operation).then(result => {
    //   let resp = {code: code};
    //   return Promise.resolve(resp);
    // });
    return Promise.resolve({ "code": code });
  }

  CustomerAPI.remoteMethod('login', {
    description: "Customer login.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    { arg: 'code', type: 'string', required: true, description: "Verification code", http: { source: 'query' } }],
    return: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/customer/login', verb: 'post', status: 200, errorStatus: [500] }
  });
  CustomerAPI.login = function (tel, code) {
    let customerService = new CustomerService();
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
    }).catch(err => {
      return Promise.resolve(err);
    })
  }

  CustomerAPI.remoteMethod('updateCustomerInfo', {
    description: "Update customer information.",
    accepts: { arg: 'updateCusomerInfoData', type: 'UpdateCusomerInfoRequest', required: true, description: "", http: { source: 'body' } },
    return: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/customer/update/:tel', verb: 'post', status: 200, errorStatus: [500] }
  });
  CustomerAPI.updateCustomerInfo = function (tel) {

  }
}