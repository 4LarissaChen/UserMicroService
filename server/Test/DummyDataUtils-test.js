'use strict'

var expect = require('chai').expect;
var ddu = require('../utils/DummyDataUtils.js');

//Chai Assertion, pls reference http://chaijs.com/api/bdd/
describe('Loopback model test', function(done) {
  this.timeout(500000);

  describe('#create()', function() {
    it('should create a new aodEnterprise artifact', function(done) {
      ddu.importDummyDataToMongoDB().then(done);
    })
  });

});