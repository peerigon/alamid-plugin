"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

chai.config.includeStack = true;
chai.use(require("sinon-chai"));

describe("examples/hook", function () {
    var hookExample;
    var obj;

    before(function () {
        hookExample = require("../../examples/hook.js");
    });
    beforeEach(function () {
        obj = {};
    });

    describe("when the method doesn't exist", function () {

        it("should define the method", function () {
            hookExample(obj);

            expect(obj).to.have.property("someMethod");
            expect(obj).to.not.have.property("message");
            obj.someMethod();
            expect(obj).to.have.property("message", "hi");
        });

    });

    describe("when the method already exists", function () {

        it("should hook before the method", function () {
            var spy;

            obj.someMethod = spy = sinon.spy(function () {
                expect(obj).to.have.property("message", "hi");
            });
            hookExample(obj);

            expect(obj).to.not.have.property("message");
            obj.someMethod();
            expect(spy).to.have.been.calledOnce;
        });

    });

    describe("when the exists but is not a function", function () {

        it("should throw an error", function () {
            expect(function () {
                obj.someMethod = 2;
                hookExample(obj);
            }).to.throw();
        });

    });

});