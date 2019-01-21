'use strict';

module.exports = function(app) {


    // var writeInstance = function() {
    //     session.writeTransaction(function (transaction) {
    //         return transaction.run( "MATCH (sc:SystemContext{_id:'SYSTEMCONTEXT_rkKlZU0UWG'}), (actor:Actor{_id: 'actor_0d1c728a_ae80_479a_9fa0_98873a39114e'}) MERGE (sc)-[:ACTEDBY]->(actor) RETURN sc")
    //     }).then(function(result){
    //         console.log(result);
    //         session.close();
    //     })
    // }
    //
    // writeInstance();

    // session.readTransaction(function(transaction){
    //     return transaction.run('MATCH (person:Person) RETURN person');
    // }).then(function(result){
    //     console.log(result);
    //     session.close();
    // }).catch(function(e){
    //     console.log(e);
    // })

    // session.readTransaction(function(transaction){
    //     return transaction.run(
    //         'MATCH (m:Movie)<-[r:ACTED_IN]-(a:Person) \
    //         RETURN m,r,a \
    //         LIMIT {limit}', {limit: 100})
    // }).then(function(result){
    //     console.log(result);
    //     session.close();
    // })


    //       <coreModel xx=""/>



    //
    // var readInstance = function () {
    //     session.readTransaction(function(transaction){
    //         return transaction.run( "MATCH p=(sc:SystemContext{_id:'SYSTEMCONTEXT_rkKlZU0UWG'})-[rel*1..]->(ref) WHERE NOT ref:AssetArtifactType RETURN sc, COLLECT(DISTINCT ref) AS refs, COLLECT(DISTINCT rel) AS rels")
    //     }).then(function(result){
    //         var neo4jNodes = result.records[0].get('refs');
    //         var neo4jRels = result.records[0].get('rels');
    //         neo4jNodes.push(result.records[0].get('sc'))
    //         console.log(neo4jNodes);
    //         console.log(neo4jRels);
    //         session.close();
    //     })
    // }
    //
    //
    // readInstance();

};


