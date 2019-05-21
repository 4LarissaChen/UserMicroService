'use strict';
var apiUtils = require('../../../../server/utils/apiUtils.js');

var promiseUtils = require('../../../../server/utils/promiseUtils.js');
var app = require('../../../../server/server.js');
var logger = require('winston');
var nodeUtil = require('util');
var arrayUtils = require('../../../../server/utils/arrayUtils.js');
var AuthorizationService = require('./internalService/AuthorizationService.js')

module.exports = function(AuthorizationAPI) {
  apiUtils.disableRelatedModelRemoteMethod(AuthorizationAPI);


  AuthorizationAPI.remoteMethod('assignRoleToButchartUser', {
      description: "Assign role to a specific CAUser",
      accepts: [{ arg: 'userId', type: 'string', required: true, description: "Target User Id", http: { source: 'path' }},
          { arg: 'roleName', type: 'string', required: true, description: "Role Name", http: { source: 'path' }}],
      returns: { arg: 'isAssigned', type: 'AssignRoleToButchartUserResponse', description: '', root: true },
      http: { path: '/users/:userId/roles/:roleName', verb: 'post', status: 200, errorStatus: [500] }
  });
  AuthorizationAPI.assignRoleToButchartUser = function(userId, roleName) {
    var Role = app.models.Role;
    var RoleMapping = app.models.RoleMapping;
    return Role.findOne({where: {name: roleName}}).then(function(role) {
      return RoleMapping.findOrCreate({where : {principalId: userId, roleId: role.id}},
        {principalId: userId, roleId: role.id, principalType: RoleMapping.USER});
    }).then(() => ({isAssigned: true}) );
  }


  AuthorizationAPI.remoteMethod('getButchartUserRoles', {
      description: "Get all the roles for a specific CAUser",
      accepts: { arg: 'userId', type: 'string', required: true, description: "Target User Id", http: { source: 'path' }},
      returns: { arg: 'roles', type: ['string'], description: '', root: true },
      http: { path: '/users/:userId/roles', verb: 'get', status: 200, errorStatus: [500] }
  });
  AuthorizationAPI.getButchartUserRoles = function(userId) {
    var Role = app.models.Role;
    var RoleMapping = app.models.RoleMapping;
    return Role.getRoles({principalType: RoleMapping.USER, principalId: userId}).then(function(roles){
      var findRoleInstancePromise = [];
      roles = arrayUtils.remove(roles, '$authenticated');
      roles = arrayUtils.remove(roles, '$everyone');
      for (var i=0; i<roles.length; i++){
        var role = roles[i];
        findRoleInstancePromise.push(Role.findById(role));
      }
      return Promise.all(findRoleInstancePromise);
    }).then(function(roleInstances){
      var roleNames = [];
      for (var i=0; i<roleInstances.length; i++){
        roleNames.push(roleInstances[i].name);
      }
      return roleNames;
    });
  }

  AuthorizationAPI.remoteMethod('unAssignRoleToButchartUser', {
      description: "UnAssign role to a specific CAUser",
      accepts: [{ arg: 'userId', type: 'string', required: true, description: "Target User Id", http: { source: 'path' }},
          { arg: 'roleName', type: 'string', required: true, description: "Role Name", http: { source: 'path' }}],
      returns: { arg: 'isUnAssigned', type: 'UnAssignRoleToButchartUserResponse', description: '', root: true },
      http: { path: '/users/:userId/roles/:roleName', verb: 'delete', status: 200, errorStatus: [500] }
  });
  AuthorizationAPI.unAssignRoleToButchartUser = function(userId, roleName) {
    var authorizationService = new AuthorizationService();
    return authorizationService.unAssignRoleToButchartUser(userId, roleName).then(() => ({isUnAssigned: true}) );
  }




};
