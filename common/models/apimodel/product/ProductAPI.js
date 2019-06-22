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
module.exports = function (ProductAPI) {

  ProductAPI.remoteMethod('createProductSeries', {
    description: "Create a product series.",
    accepts: [{ arg: 'createData', type: 'CreateProductSeriesRequest', required: true, description: "Create product series data.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/store/createProductSeries', verb: 'post', status: 200, errorStatus: 500 }
  });
  ProductAPI.createProductSeries = function (createData) {
    let ProductSeries = loopback.findModel("ProductSeries");
    createData._id = apiUtils.generateShortId("ProductSeries");
    return ProductSeries.create(createData);
  }

  ProductAPI.remoteMethod('createProduct', {
    description: "Create a product.",
    accepts: [{ arg: 'createData', type: 'CreateProductRequest', required: true, description: "Create product data.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/store/createProduct', verb: 'post', status: 200, errorStatus: 500 }
  });
  ProductAPI.createProduct = function (createData) {
    let ProductSeries = loopback.findModel("ProductSeries");
    let Product = loopback.findModel("Product");

    createData._id = apiUtils.generateShortId("Product");
    let seriesId = createData.seriesId;
    delete createData.seriesId;
    return Product.create(createData).then(() => {
      return promiseUtils.mongoNativeUpdatePromise("ProductSeries", { "_id": ProductSeries }, { $addToSet: { includeProducts: seriesId } });
    }).catch(err => {
      throw err;
    })
  }

  ProductAPI.remoteMethod('getProductSeries', {
    description: "Get product series.",
    accepts: [{ arg: 'seriesId', type: 'string', required: false, description: "Product series id.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: ['ProductSeries'], description: '', root: true },
    http: { path: '/productSeries/getProductSeries', verb: 'get', status: 200, errorStatus: 500 }
  });
  ProductAPI.getProductSeries = function (seriesId) {
    let ProductSeries = loopback.findModel("ProductSeries");
    return ProductSeries.find({ where: { "_id": seriesId } });
  }

  ProductAPI.remoteMethod('getProductsBySeriesId', {
    description: "Get product series.",
    accepts: [{ arg: 'seriesId', type: 'string', required: true, description: "Product series id.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: ['Product'], description: '', root: true },
    http: { path: '/productSeries/getProductsBySeriesId', verb: 'get', status: 200, errorStatus: 500 }
  });
  ProductAPI.getProductsBySeriesId = function (seriesId) {
    let self = this;
    let Product = loopback.findModel("Product");
    return self.getProductSeries(seriesId).then(result => {
      return Promise.map(result[0].includeProducts, productId => {
        return Product.findOne({ where: { "_id": productId } });
      })
    }).catch(err => {
      throw err;
    })
  }

  ProductAPI.remoteMethod('getProductById', {
    description: "Get product by id.",
    accepts: [{ arg: 'productId', type: 'string', required: true, description: "Product id.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/productSeries/getProductById', verb: 'get', status: 200, errorStatus: 500 }
  });
  ProductAPI.getProductById = function (productId) {
    let Product = loopback.findModel("Product");
    return Product.findOne({ where: { "_id": productId } }).catch(err => {
      throw err;
    });
  }

  ProductAPI.remoteMethod('updateProducts', {
    description: "Get product by id.",
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/productSeries/updateProducts', verb: 'post', status: 200, errorStatus: 500 }
  });
  ProductAPI.updateProducts = function () {
    let Product = loopback.findModel("Product");
    return Product.find({}).then(result => {
      result.forEach(element => {
        return promiseUtils.mongoNativeUpdatePromise("Product", { _id: element._id }, { type: "花束" });
      });
    }).then(() => ({ isSuccess: true })).catch(err => err);
  }
}