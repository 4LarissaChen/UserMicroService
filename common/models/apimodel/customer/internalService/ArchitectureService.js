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
var neo4jDataUtils = require('../../../../../server/utils/neo4jDataUtils');
var dateUtils = require('../../../../../server/utils/dateUtils.js');
var arrayUtils = require('../../../../../server/utils/arrayUtils.js');
var moment = require('moment')
var counter = 1;
var fs = require('fs');

module.exports = ArchitectureService;

function ArchitectureService(transaction) {
    this.transaction = transaction;
}

ArchitectureService.prototype.getAllOMLocation = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(ins)-[*]->(n:OMLocation)-[rels *]->(m) " +
        "WHERE LABELS(ins)[0] IN %s AND LABELS(m) IN %s WITH rels ORDER BY LENGTH(rels) DESC RETURN startNode(LAST(rels)) AS sn, endNode(LAST(rels)) AS en";
    var arr1 = "[\"POMView\", \"LOMView\"]"
    var arr2 = "[\"Actor\", \"LogicalNode\", \"PhysicalNode\"]";
    cypher = nodeUtil.format(cypher, arr1, arr2);
    return this.transaction.run(cypher, {}).then(neo4jResult => {
        return neo4jResult.records.map(record => {
            return {
                sn: record.get("sn"),
                en: record.get("en")
            }
        });
    }).then(results => {
        return Promise.map(results, result => {
            var getUICypher = "MATCH (pUI:UI)<-[pRel]-(p:%s{_id:$snId})-->(c:%s{_id:$enId})-[cRel]->(cUI:UI) " +
                "WHERE pRel.instanceId = cRel.instanceId AND cUI.parent <> pUI.id RETURN pUI as parentUI, cUI as childrenUI";
            getUICypher = nodeUtil.format(getUICypher, result.sn.labels[0], result.en.labels[0]);
            return this.transaction.run(getUICypher, { snId: result.sn.properties._id, enId: result.en.properties._id }).then(neo4jResult => {
                return neo4jResult.records.map(record => {
                    return {
                        parentUI: record.get("parentUI").properties,
                        childrenUI: record.get("childrenUI").properties
                    }
                });
            });
        });
    });
}

ArchitectureService.prototype.updateOMLocationUI = function (uiNode) {
    var cypher = "MATCH (n:UI{_id: $_id}) SET n = $properties";
    return this.transaction.run(cypher, {
        _id: uiNode._id,
        properties: uiNode
    }).then(neo4jResult => {
        return true;
    })

}

//MATCH (:POMView)-->(n:OMLocation)-[rels *]->(m) WHERE not m:UI WITH rels MATCH (pUI:UI)<-[pRel]-(p{_id:startNode(LAST(rels))._id})-->(c{_id:endNode(LAST(rels))._id})-[cRel]->(cUI:UI) WHERE pRel.instanceId = cRel.instanceId  and cUI.parent <> pUI.id RETURN p, c
//check

ArchitectureService.prototype.getLastModified = function () {
    var cypher = "MATCH (n) WHERE EXISTS(n.lastModified) AND RIGHT(n.lastModified, 1) <> 'Z' RETURN n";
    return this.transaction.run(cypher, {
    }).then(neo4jResult => {
        return neo4jResult.records.map(r => r.get('n'));
    })
}

ArchitectureService.prototype.getCreated = function () {
    var cypher = "MATCH (n) WHERE EXISTS(n.created) AND RIGHT(n.created, 1) <> 'Z' RETURN n";
    return this.transaction.run(cypher, {
    }).then(neo4jResult => {
        return neo4jResult.records.map(r => r.get('n'));
    })
}

ArchitectureService.prototype.updateLastModified = function (id, label, lastModified) {
    var cypher = "MATCH (n:%s{_id: $id}) SET n.lastModified = $lastModified";
    cypher = nodeUtil.format(cypher, label);
    return this.transaction.run(cypher, {
        id: id,
        lastModified: lastModified
    }).then(() => {
        return true;
    })
}

ArchitectureService.prototype.updateCreated = function (id, label, created) {
    var cypher = "MATCH (n:%s{_id: $id}) SET n.created = $created";
    cypher = nodeUtil.format(cypher, label);
    return this.transaction.run(cypher, {
        id: id,
        created: created
    }).then(() => {
        return true;
    })
}

ArchitectureService.prototype.getDuplicateNameOMLocations = function () {
    var cypher = "MATCH (arch:Architecture)-->(:Element)-->(loc:OMLocation) " +
        "RETURN DISTINCT arch, COLLECT(loc) AS locs";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                arch: r.get("arch"),
                locs: r.get("locs")
            }
        });
    })
}

ArchitectureService.prototype.updateOMLocationName = function (archId, id, name) {
    var cypher = "MATCH (arch:Architecture{_id:$archId})-->(:Element)-->(loc:OMLocation{_id:$id}) " +
        "SET loc.name = $name";
    return this.transaction.run(cypher, {
        archId: archId,
        id: id,
        name: name
    }).then((neo4jResult) => true);
}

ArchitectureService.prototype.getDuplicateLNsByPN = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(pom:POMView)-[*]->(node)-[*]->(pn1:PhysicalNode)-[ref]->(ln:LogicalNode)<-[*]-(pn2:PhysicalNode) " +
        "WHERE pn1._id <> pn2._id AND NOT LABELS(node)[0] IN [\"PhysicalConnection\", \"LogicalConnection\"] RETURN pom AS ins, startNode(ref) AS sn, endNode(ref) AS en";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                ins: r.get("ins"),
                sn: r.get("sn"),
                en: r.get("en")
            }
        });
    })
}

ArchitectureService.prototype.getDuplicatePNsByPN = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(pom:POMView)-[*]->(pn1:PhysicalNode)-[ref]->(pn:PhysicalNode)<-[*]-(pn2:PhysicalNode) " +
        "WHERE pn1._id <> pn2._id RETURN pom AS ins, startNode(ref) AS sn, endNode(ref) AS en";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                ins: r.get("ins"),
                sn: r.get("sn"),
                en: r.get("en")
            }
        });
    })
}

ArchitectureService.prototype.getDuplicatePNsByLoc = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(pom:POMView)-->(loc1:OMLocation)-[ref *]->(pn:PhysicalNode)<-[*]-(loc2:OMLocation) " +
        "WHERE loc1._id <> loc2._id RETURN pom AS ins, startNode(LAST(ref)) AS sn, endNode(LAST(ref)) AS en";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                ins: r.get("ins"),
                sn: r.get("sn"),
                en: r.get("en")
            }
        });
    })
}

//delete directly
ArchitectureService.prototype.getDuplicatePNsByPOM = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(pom1:POMView)-[ref]->(pn:PhysicalNode)<-[*]-(pom2:POMView) " +
        "WHERE pom1._id <> pom2._id RETURN pom1 AS ins, startNode(ref) AS sn, endNode(ref) AS en";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                ins: r.get("ins"),
                sn: r.get("sn"),
                en: r.get("en")
            }
        });
    })
}

ArchitectureService.prototype.getDuplicateActorsByLoc = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(ins)-->(loc1:OMLocation)-[ref *]->(act:Actor)<-[*]-(loc2:OMLocation) " +
        "WHERE LABELS(ins)[0] IN [\"POMView\", \"LOMView\"] AND loc1._id <> loc2._id RETURN ins, startNode(LAST(ref)) AS sn, endNode(LAST(ref)) AS en";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                ins: r.get("ins"),
                sn: r.get("sn"),
                en: r.get("en")
            }
        });
    })
}

//delete directly
ArchitectureService.prototype.deleteDuplicateActorsByIns = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(ins1)-[ref]->(act:Actor)<-[*]-(ins2) " +
        "WHERE LABELS(ins1)[0] IN [\"POMView\", \"LOMView\"] AND LABELS(ins2)[0] IN [\"POMView\", \"LOMView\"] " +
        "AND ins1._id <> ins2._id DELETE ref";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                ins: r.get("ins"),
                sn: r.get("sn"),
                en: r.get("en")
            }
        });
    })
}

ArchitectureService.prototype.getDuplicateLNsByLoc = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(ins)-->(loc1:OMLocation)-[ref *]->(ln:LogicalNode)<-[*]-(loc2:OMLocation) " +
        "WHERE loc1._id <> loc2._id RETURN ins, startNode(LAST(ref)) AS sn, endNode(LAST(ref)) AS en";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                ins: r.get("ins"),
                sn: r.get("sn"),
                en: r.get("en")
            }
        });
    })
}

//delete directly
ArchitectureService.prototype.getDuplicateLNsByIns = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(ins1)-[ref]->(ln:LogicalNode)<-[*]-(ins2) " +
        "WHERE LABELS(ins1)[0] IN [\"POMView\", \"LOMView\"] AND LABELS(ins2)[0] IN [\"POMView\", \"LOMView\"] " +
        "AND ins1._id <> ins2._id DELETE ref";
    return this.transaction.run(cypher, {
    }).then((neo4jResult) => {
        return neo4jResult.records.map(r => {
            return {
                ins: r.get("ins"),
                sn: r.get("sn"),
                en: r.get("en")
            }
        });
    })
}

ArchitectureService.prototype.handleDumplicateRel = function (nodes) {
    var cypher = "MATCH (sn:%s{_id:$snId})-[ref]->(en:%s{_id:$enId}) DELETE ref";
    cypher = nodeUtil.format(cypher, nodes.sn.labels[0], nodes.en.labels[0]);
    return this.transaction.run(cypher, {
        snId: nodes.sn.properties._id,
        enId: nodes.en.properties._id
    }).then(() => {
        return true;
    })
}

ArchitectureService.prototype.getUIByLoc = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(ins)-->(loc:OMLocation)-[*]->(node) WHERE LABELS(ins)[0] IN [\"POMView\", \"LOMView\"] " +
        "AND LABELS(node)[0] IN [\"PhysicalNode\", \"LogicalNode\", \"Actor\"] WITH * MATCH (locUI:UI)<-[locUIRel:MXGRAPH]-(loc)-[*]->(node)-[nodeUIRel:MXGRAPH]->(nodeUI:UI) " +
        "RETURN DISTINCT node AS node, COLLECT(DISTINCT locUIRel) AS locRel, COLLECT(DISTINCT nodeUIRel) AS nodeRel";
    return this.transaction.run(cypher, {}).then(neo4jResult => {
        return neo4jResult.records.map(r => {
            return {
                node: r.get("node"),
                locRel: r.get("locRel"),
                nodeRel: r.get("nodeRel")
            }
        });
    })
}

ArchitectureService.prototype.deleteUI = function (node, rel) {
    var cypher = "MATCH (n:%s{_id: $id})-[rel:MXGRAPH]->(ui:UI) WHERE rel.instanceId = $instanceId DETACH DELETE ui";
    cypher = nodeUtil.format(cypher, node.labels[0])
    return this.transaction.run(cypher, { id: node.properties._id, instanceId: rel.properties.instanceId }).then(() => true);
}

ArchitectureService.prototype.getInvalidConnections = function () {
    var cypher = "MATCH (ins)-->(conn) WHERE (ins:POMView OR ins:LOMView) AND (conn:LogicalConnection OR conn:PhysicalConnection)  " +
        "WITH conn OPTIONAL MATCH (conn)-->(node) WHERE NOT node:UI RETURN DISTINCT conn, COLLECT(node) AS nodes";
    return this.transaction.run(cypher, {}).then(neo4jResult => {
        return neo4jResult.records.map(r => {
            return {
                conn: r.get("conn"),
                nodes: r.get("nodes")
            }
        });
    })
}

ArchitectureService.prototype.deleteConnections = function (conn, instanceId) {
    var cypher = "MATCH (conn:%s{_id: $id})-[rel:MXGRAPH]->(ui:UI) %s DETACH DELETE %s ui";
    cypher = nodeUtil.format(cypher, conn.labels[0], instanceId ? "WHERE rel.instanceId = $instanceId" : "", instanceId ? "" : "conn,")
    return this.transaction.run(cypher, { id: conn.properties._id, instanceId }).then(() => true);
}

ArchitectureService.prototype.getConnections = function () {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(ins)-->(node)-[connRef]->(connUI:UI) WHERE LABELS(ins)[0] IN [\"POMView\", \"LOMView\"] " +
        "AND LABELS(node)[0] IN [\"PhysicalConnection\", \"LogicalConnection\"] WITH * MATCH (snUI:UI)<-[snUIRel:MXGRAPH]-(sn)<--(node)-->(en)-[enUIRel:MXGRAPH]->(enUI:UI) " +
        "WHERE snUIRel.instanceId = enUIRel.instanceId " +
        "RETURN DISTINCT node AS conn, COLLECT(DISTINCT connRef.instanceId) AS connUIIds, COLLECT(DISTINCT snUIRel.instanceId) AS instanceIds";
    return this.transaction.run(cypher, {}).then(neo4jResult => {
        return neo4jResult.records.map(r => {
            return {
                conn: r.get("conn"),
                connUIIds: r.get("connUIIds"),
                instanceIds: r.get("instanceIds")
            }
        });
    })
}

ArchitectureService.prototype.deleteConnectionsAcrossGraphs = function (conn, instanceId) {
    var cypher = "MATCH (:Architecture)-->(:AssetArtifact)-->(n)-->(conn)-->(node) WHERE LABELS(n)[0] IN [\"POMView\", \"LOMView\"] " +
        "AND LABELS(conn)[0] IN [\"PhysicalConnection\", \"LogicalConnection\"] AND NOT node:UI WITH * MATCH (ins)-[*]->(node) " +
        "WHERE LABELS(ins)[0] IN [\"POMView\", \"LOMView\"] AND n._id <> ins._id DETACH DELETE conn";
    return this.transaction.run(cypher, {}).then(() => {
        let deleteOphanUICypher = "MATCH (ui:UI) WHERE NOT ()-[:MXGRAPH]->(ui) DELETE ui";
        return this.transaction.run(deleteOphanUICypher, {});
    }).then(() => true);
}