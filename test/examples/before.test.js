"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

chai.config.includeStack = true;
chai.use(require("sinon-chai"));

describe("examples/before", function () {
    var beforeExample, spy, obj;

    before(function () {
        beforeExample = require("../../examples/before.js");
        obj = {
            someMethod: spy = sinon.spy()
        };
    });

    it("should run without errors", function () {
        beforeExample(obj);
        obj.someMethod(0);
        expect(spy).to.have.been.calledWithExactly(1);
    });

});