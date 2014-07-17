"use strict";

var chai = require("chai");
var expect = chai.expect;

chai.config.includeStack = true;

describe("setGet", function () {
    var setGetExample, obj;

    before(function () {
        setGetExample = require("../../examples/setGet.js");
        obj = {};
    });

    it("should run without errors", function () {
        setGetExample(obj);
        expect(obj.getNewNumber()).to.equal(2);
    });
});