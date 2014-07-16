"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

chai.config.includeStack = true;
chai.use(require("sinon-chai"));

describe("before", function () {
    var beforePlugin, spy, obj;

    before(function () {
        beforePlugin = require("../../examples/before.js");
        obj = {
            someMethod: spy = sinon.spy()
        };
    });

    it("should run without errors", function () {
        beforePlugin(obj);
        obj.someMethod(0);
        expect(spy).to.have.been.calledWithExactly(1);
    });

});