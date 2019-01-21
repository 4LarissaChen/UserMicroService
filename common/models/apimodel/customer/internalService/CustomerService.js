'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');

class CustomerService {

  createCustomer(tel){
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
    });
  }
  
}

module.exports = CustomerService;