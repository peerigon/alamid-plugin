"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var use = require("../use.js");

chai.config.includeStack = true;
chai.use(require("sinon-chai"));

describe(".use(plugin, config?)", function () {
    var obj;
    var spy;
    
    beforeEach(function () {
        obj = {
            use: use
        };
        spy = sinon.spy();
    });

    it("should call the plugin with obj as first argument", function () {
        obj.use(spy);
        expect(spy).to.have.been.calledWith(obj);
    });

    it("should call the plugin with the config as second argument", function () {
        var config = {};

        obj.use(spy, config);
        expect(spy).to.have.been.calledWith(obj, config);
    });

    it("should be chainable", function () {
        expect(obj.use(spy)).to.equal(obj);
    });

});