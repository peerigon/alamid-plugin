"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var plugin = require("../lib/Plugin.js");

chai.config.includeStack = true;
chai.use(require("sinon-chai"));

describe("simple", function () {
    var simplePlugin, obj;

    before(function () {
        simplePlugin = require("../examples/simple.js");
        obj = {};
    });

    it("should run without errors", function () {
        simplePlugin(obj);
        expect(obj).to.have.property("newNumber", 2);
    });
});

describe("setGet", function () {
    var setGetPlugin, obj;

    before(function () {
        setGetPlugin = require("../examples/setGet.js");
        obj = {};
    });

    it("should run without errors", function () {
        setGetPlugin(obj);
        expect(obj.getNewNumber()).to.equal(2);
    });
});

describe("before", function () {
    var beforePlugin, spy, obj;

    before(function () {
        beforePlugin = require("../examples/before.js");
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

describe("after", function () {
    var afterPlugin, obj;

    before(function () {
        afterPlugin = require("../examples/after.js");
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

describe("override", function () {
    var overridePlugin, spy, obj;

    before(function () {
        overridePlugin = require("../examples/override.js");
        obj = {
            someMethod: spy = sinon.spy()
        };
    });

    it("should run without errors", function (done) {
        var result;

        overridePlugin(obj);
        result = obj.someMethod(2);

        expect(spy).to.not.have.been.called;
        expect(result).to.equal("intermediate result");

        setTimeout(function () {
            expect(spy).to.have.been.calledWithExactly(2);
            done();
        }, 10);
    });

});