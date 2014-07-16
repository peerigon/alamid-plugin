"use strict";

var chai = require("chai");
var expect = chai.expect;

chai.config.includeStack = true;

describe("after", function () {
    var afterPlugin, obj;

    before(function () {
        afterPlugin = require("../../examples/after.js");
        obj = {
            someMethod: function () {
                return 0;
            }
        };
    });

    it("should run without errors", function () {
        afterPlugin(obj);
        expect(obj.someMethod()).to.equal(1);
    });

});