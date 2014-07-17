"use strict";

var chai = require("chai");
var expect = chai.expect;

chai.config.includeStack = true;

describe("simple", function () {
    var simpleExample, obj;

    before(function () {
        simpleExample = require("../../examples/simple.js");
        obj = {};
    });

    it("should run without errors", function () {
        simpleExample(obj);
        expect(obj).to.have.property("newNumber", 2);
    });
});