"use strict";

var chai = require("chai");
var expect = chai.expect;

chai.config.includeStack = true;

describe("simple", function () {
    var simplePlugin, obj;

    before(function () {
        simplePlugin = require("../../examples/simple.js");
        obj = {};
    });

    it("should run without errors", function () {
        simplePlugin(obj);
        expect(obj).to.have.property("newNumber", 2);
    });
});