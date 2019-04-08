'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');

class UserService {

  createUser(tel) {
    let ButchartUser = app.models.ButchartUser;
    let user = {
      _id: tel,
      tel: tel,
      email: "",
      registerDate: moment().local().format('YYYY-MM-DD HH:mm:ss'),
      password: "Butchart",
      lastLoginDate: moment().local().format('YYYY-MM-DD HH:mm:ss'),
      userProfile: {
        defaultAddress: "",
        accountLevel: "0"
      },
      shoppingCart:[]
    }
    return ButchartUser.create(user);
  }

}

module.exports = UserService;