"use strict";

var chai = require("chai");
var expect = chai.expect;

chai.config.includeStack = true;

describe("setGet", function () {
    var setGetPlugin, obj;

    before(function () {
        setGetPlugin = require("../../examples/setGet.js");
        obj = {};
    });

    it("should run without errors", function () {
        setGetPlugin(obj);
        expect(obj.getNewNumber()).to.equal(2);
    });
});