'use strict';
var Promise = require('bluebird');
var loopback = require('loopback');
var logger = require('winston');
var apiUtils = require('../../../../../server/utils/apiUtils.js');
var constants = require('../../../../../server/constants/constants.js');
var cypherConstants = require('../../../../../server/constants/cypherConstants.js');
var apiConstants = require('../../../../../server/constants/apiConstants.js');
var artifactConstants = require('../../../../../server/constants/artifactConstants.js');
var promiseUtils = require('../../../../../server/utils/promiseUtils.js');
var nodeUtil = require('util');

module.exports = ArchCypherQueryService;

function ArchCypherQueryService() { }



var executeCypherStatement = function (cypher) {
  return new Promise(function (resolve, reject) {
    promiseUtils.getNeo4jQueryPromise(cypher, {}, {}).then(function (neo4jResults) {
      resolve(neo4jResults);
    }).catch(function (err) {
      logger.error("Error Happens while execute cypher query statement : " + err);
      reject(err);
    });
  });
}

ArchCypherQueryService.prototype.commentMigrate = function (artifactId, comment, isPrivate) {
  var cypher = {};
  if (isPrivate) {
    cypher = {
      query: "MATCH (a:AssetArtifact{_id:{artifactId}}) " +
        "CREATE (a)-[:PRIVATECOMMENT]->(b:Comment{_id:{commentId}, content:{content}, created:{created}, commentedBy:{userId}}) " +
        "RETURN b._id AS _id",
      params: {
        artifactId: artifactId,
        commentId: comment._id,
        content: comment.content,
        created: comment.created,
        userId: comment.COMMENTEDBY_CAUser_id[0]
      }
    };
  } else {
    cypher = {
      query: "MATCH (a:AssetArtifact{_id:{artifactId}}) " +
      "CREATE (a)-[:PUBLICCOMMENT]->(b:Comment{_id:{commentId}, content:{content}, created:{created}, commentedBy:{userId}}) " +
      "RETURN b._id AS _id",
      params: {
        artifactId: artifactId,
        commentId: comment._id,
        content: comment.content,
        created: comment.created,
        userId: comment.COMMENTEDBY_CAUser_id[0]
      }
    };
  }
  return executeCypherStatement(cypher);
}
