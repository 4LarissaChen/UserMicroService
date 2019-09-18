'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var loopback = require('loopback');
var Promise = require('bluebird');
var moment = require('moment');
var errorConstants = require('../../../../server/constants/errorConstants.js');
var promiseUtils = require('../../../../server/utils/promiseUtils.js');
module.exports = function (SystemAPI) {

  SystemAPI.remoteMethod('upsertAccessToken', {
    description: "Upsert AccessToken.",
    accepts: [{ arg: 'access_token', type: 'string', required: true, description: "Access token.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/system/upsertAccessToken', verb: 'put', status: 200, errorStatus: 500 }
  });
  SystemAPI.upsertAccessToken = function (access_token) {
    let SystemInfo = loopback.findModel("SystemInfo");
    return SystemInfo.findOne({}).then(result => {
      if (result == null) {
        let sysInfo = {
          _id: apiUtils.generateShortId('SystemInfo'),
          access_token: access_token,
          access_token_date: moment().local().format("YYYY-MM-DD HH:mm:ss")
        }
        return SystemInfo.create(sysInfo);
      } else
        return promiseUtils.mongoNativeUpdatePromise("SystemInfo", { _id: result._id }, { $set: { access_token: access_token, access_token_date: moment().local().format("YYYY-MM-DD HH:mm:ss") } });
    }).then(() => {
      return { isSuccess: true };
    })
  }

  SystemAPI.remoteMethod('getHomePagePics', {
    description: "Get Home Page Pics.",
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/system/getHomePagePics', verb: 'get', status: 200, errorStatus: 500 }
  });
  SystemAPI.getHomePagePics = function () {
    let SystemInfo = loopback.findModel("SystemInfo");
    return SystemInfo.findOne({ fields: { homePagePics: true } }).then(result => {
      return result;
    })
  }
}