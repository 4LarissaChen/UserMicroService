'use strict';

var fs = require('fs');
var Promise = require('bluebird')
var dataRootPath = __dirname + '/../../common/models/data/dummy/';
var authDataFileNames = ['RoleMapping.json'];
var app = require('../server.js');
var apiUtils = require('./apiUtils.js');
var promiseUtils = require('./promiseUtils.js');

Promise.promisifyAll(fs);

exports.importDummyDataToMongoDB = function () {
  return readDummyData().then(data => writeDmmyDataToMongo(data));
};

function readDummyData() {
  return readFileNames().then(names => readFiles(names));
}

function readFileNames() {
  return fs.readdirAsync(dataRootPath);
}

function readFiles(names) {
  var data = {};
  var proArr = names.map(function (name) {
    var modelName = name.substr(0, name.length - 5);
    return fs.readFileAsync(dataRootPath + name).then(JSON.parse).then(obj => data[modelName] = obj);
  });
  return Promise.all(proArr).then(() => data);
}

function writeDmmyDataToMongo(data) {
  return writeNotMappingDummyData(data).then(() => writeMappingDummyData(data));
}

function writeNotMappingDummyData(data) {
  var authModelNames = authDataFileNames.map(name => name.substr(0, name.length - 5));
  var promiseArray = [], model;
  for (var modelName in data) {
    if (data.hasOwnProperty(modelName) && authModelNames.indexOf(modelName) < 0) {
      model = app.models[modelName];
      promiseArray = promiseArray.concat(data[modelName].map(function (obj) {
        obj._id = apiUtils.generateShortId(modelName);
        return model.create(obj);
      }));
    }
  }
  return Promise.all(promiseArray);
}
function writeMappingDummyData(data) {
  var relations = JSON.parse(fs.readFileSync(__dirname + '/../../common/models/data/Relationship.json'));
  return Promise.map(data['ProductSeries'], series => {
    series._id = apiUtils.generateShortId('ProductSeries');
    promiseArray.push(model.create(series));
    let rels = relations.ProductSeries2Product.filter(rel => rel.from == series.name);
    let ids = rels.map(r => {
      let p = products.find(prod => prod.name == r.to);
      return p._id;
    })
    return promiseUtils.mongoNativeUpdatePromise('ProductSeries', { name: rell[0].from }, { $set: { includeProducts: ids } });
  })
}
//   var rm = data.RoleMapping, RoleMapping = app.models.RoleMapping, Role = app.models.Role;
//   return Role.find().then(roles => {
//     var roleMap = {};
//     roles.forEach(role => { roleMap[role.name] = role });
//     rm.forEach(mapping => {
//       mapping.roleNames.forEach(role => {
//         RoleMapping.create({ principalId: mapping.userId, roleId: roleMap[role].id, principalType: RoleMapping.USER });
//       });
//     });
//   });
// }


