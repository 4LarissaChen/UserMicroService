'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');

class ButchartUserService {

  createButchartUser(tel) {
    let ButchartUser = app.models.ButchartUser;
    return ButchartUser.find({ where: { tel: tel } }).then(result => {
      if (result.length > 0)
        throw new Error("User already exists.");
      let butchartUser = {
        _id: tel,
        tel: tel,
        email: "",
        registerDate: moment().utc().format(),
        password: "ButChard",
        lastLoginDate: moment().utc().format(),
        userProfile: {
          defaultAddress: "",
          accountLevel: "0"
        }
      }
      return ButchartUser.create(butchartUser);
    });
  }

}

module.exports = ButchartUserService;