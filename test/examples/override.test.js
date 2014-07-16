"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

chai.config.includeStack = true;
chai.use(require("sinon-chai"));

describe("override", function () {
    var overridePlugin, spy, obj;

    before(function () {
        overridePlugin = require("../../examples/override.js");
        obj = {
            someMethod: spy = sinon.spy()
        };
    });

    it("should run without errors", function (done) {
        var result;

        overridePlugin(obj);
        result = obj.someMethod(2);

        expect(spy).to.not.have.been.called;
        expect(result).to.equal("intermediate result");

        setTimeout(function () {
            expect(spy).to.have.been.calledWithExactly(2);
            done();
        }, 10);
    });

});