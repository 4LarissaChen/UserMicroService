
'use strict';
var loopback = require('loopback');
var apiUtil = require('../utils/apiUtils');
var Promise = require('bluebird');
var app = require('../server.js');

var addPrefixErrorMessage = function (modelType, err) {
  err.message = modelType + " - " + err.message;
  return err;
};

exports.getModelCreationPromise = function (modelName, data) {
  return new Promise(function (resolve, reject) {
    loopback.findModel(modelName).create(
      data,
      function (err, models) {
        if (!err) {
          resolve(models);
        } else {
          reject(err)
        }
      });
  });
};

exports.mongoNativeUpdatePromise = function (modelName, where, data) {
  return new Promise(function (resolve, reject) {
    var mongoConnector = app.dataSources.mongo.connector;
    var options = { allowExtendedOperators: true };
    mongoConnector.updateAll(modelName, where, data, options, function (err, result) {
      if (!err) {
        resolve(result);
      } else {
        reject(err)
      }
    })
  });
};