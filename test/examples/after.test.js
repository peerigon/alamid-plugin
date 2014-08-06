"use strict";

var chai = require("chai");
var expect = chai.expect;

chai.config.includeStack = true;

describe("examples/after", function () {
    var afterExample, obj;

    before(function () {
        afterExample = require("../../examples/after.js");
        obj = {
            someMethod: function () {
                return 0;
            }
        };
    });

    it("should run without errors", function () {
        afterExample(obj);
        expect(obj.someMethod()).to.equal(1);
    });

});