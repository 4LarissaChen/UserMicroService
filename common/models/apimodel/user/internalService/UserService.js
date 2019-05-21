'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');

class UserService {

  createUser(data) {
    let ButchartUser = app.models.ButchartUser;
    let user = {
      _id: data.tel,
      tel: data.tel,
      email: "",
      username: data.tel,
      registerDate: moment().local().format('YYYY-MM-DD HH:mm:ss'),
      password: "Butchart",
      lastLoginDate: moment().local().format('YYYY-MM-DD HH:mm:ss'),
      userProfile: {
        defaultAddress: "",
        accountLevel: "0"
      },
      shoppingCart: []
    }
    return ButchartUser.create(user);
  }

}

module.exports = UserService;