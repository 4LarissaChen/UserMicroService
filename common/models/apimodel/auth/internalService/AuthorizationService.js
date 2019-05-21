'use strict';
var Promise = require('bluebird');
var loopback = require('loopback');
var logger = require('winston');
var apiUtils = require('../../../../../server/utils/apiUtils.js');
var promiseUtils = require('../../../../../server/utils/promiseUtils.js');
var nodeUtil = require('util');

class AuthorizationService {

  unAssignRoleToButchartUser(userId, roleName) {
    var Role = loopback.findModel('Role');
    var RoleMapping = loopback.findModel('RoleMapping');
    return Role.findOne({ where: { name: roleName } })
      .then(role => RoleMapping.destroyAll({ "principalId": userId, roleId: role.id }));
  }

}

module.exports = AuthorizationService;