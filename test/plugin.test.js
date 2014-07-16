"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var plugin = require("../lib/Plugin.js");

chai.config.includeStack = true;
chai.use(require("sinon-chai"));

return;

describe("plugin", function () {

    it("should be a function", function () {
        expect(plugin).to.be.a("function");
    });

});

describe("plugin(fn)", function () {

    it("should return a function", function () {
        expect(plugin(function () {})).to.be.a("function");
    });
    
    describe("(obj, config?)", function () {
        var spy, newPlugin, obj, config;

        beforeEach(function () {
            spy = sinon.spy();
            newPlugin = plugin(spy);
            obj = {};
            config = {};
        });
        
        it("should pass obj to fn", function () {
            newPlugin(obj);
            expect(spy).to.have.been.calledWith(obj);
        });

        it("should pass obj and config to fn", function () {
            newPlugin(obj, config);
            expect(spy).to.have.been.calledWith(obj, config);
        });
        
    });

});

describe("fn's context", function () {

    describe(".override(obj, key)", function () {

    });

});