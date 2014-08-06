"use strict";

var chai = require("chai");
var expect = chai.expect;

chai.config.includeStack = true;

describe("define", function () {
    var defineExample, obj;

    before(function () {
        defineExample = require("../../examples/define.js");
    });
    beforeEach(function () {
        obj = {};
    });

    describe("when all of the requested properties are undefined", function () {

        it("should run without errors", function () {
            defineExample(obj);
            expect(obj).to.have.property("someValue", 2);
            expect(obj).to.have.property("someMethod");
            expect(obj.someMethod()).to.equal(2);
        });

    });

    describe("when one of the requested property is already defined", function () {

        it("should throw an error", function () {
            expect(function () {
                obj.someValue = 2;
                defineExample(obj);
            }).to.throw();
        });

    });

});