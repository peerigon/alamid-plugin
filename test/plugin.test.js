"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var plugin = require("../lib/Plugin.js");

chai.config.includeStack = true;
chai.use(require("sinon-chai"));

describe("plugin", function () {

    it("should be a function", function () {
        expect(plugin).to.be.a("function");
    });

});

describe("plugin(namespace, fn)", function () {

    it("should return a function", function () {
        expect(plugin("testPlugin", function () {})).to.be.a("function");
    });

    it("should throw an error if namespace is not a string", function () {
        expect(function () {
            // that's probably the most common error: we've forgotten to pass a namespace
            plugin(function () {});
        }).to.throw("Cannot create plugin: namespace should be a string, instead saw function");
    });

    describe("calling the returned function with (obj, config?)", function () {
        var spy, newPlugin, obj, config;

        beforeEach(function () {
            spy = sinon.spy();
            newPlugin = plugin("testPlugin", spy);
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
    var spy, newPlugin, obj;

    function createPlugin(fn) {
        spy = sinon.spy(fn);
        newPlugin = plugin("testPlugin", spy);
    }

    function applyPlugin() {
        newPlugin(obj);
        expect(spy).to.have.been.calledOnce;
    }

    beforeEach(function () {
        obj = {};
    });

    it("should be typeof function", function () {
        createPlugin();
        applyPlugin();
        expect(spy.thisValues[0]).to.be.a("function");
    });

    describe("called with (someObj)", function () {
        var someObj;

        beforeEach(function () {
            someObj = {};
        });

        describe(".set(key, value)", function () {
            
            it("should store the value on someObj as namespace + '/' + key", function () {
                createPlugin(function () {
                    this(someObj).set("someKey", "some value");
                    expect(someObj).to.have.property("testPlugin/someKey", "some value");
                });
                applyPlugin();
            });
            
        });

        describe(".get(key)", function () {

            it("should return undefined if no value has been previously set", function () {
                createPlugin(function () {
                    expect(this(someObj).get("someKey")).to.be.undefined;
                });
                applyPlugin();
            });

            it("should return someValue if someValue has previously been set", function () {
                createPlugin(function () {
                    this(someObj).set("someKey", "some value");
                    expect(this(someObj).get("someKey")).to.equal("some value");
                });
                applyPlugin();
            });

        });

        describe(".before(key, preFn)", function () {
            var calls, preFn, someMethod;

            beforeEach(function () {
                calls = [];
                someObj.someMethod = someMethod = sinon.spy(function () {
                    calls.push("someMethod");
                    return "someMethod's return value";
                });
            });

            it("should replace the original method", function () {
                createPlugin(function () {
                    this(someObj).before("someMethod", function () {});
                });
                applyPlugin();
                expect(someObj.someMethod).to.not.equal(someMethod);
            });

            it("should run preFn and then the original method", function () {
                createPlugin(function () {
                    this(someObj).before("someMethod", preFn = sinon.spy(function () {
                        calls.push("preFn");
                    }));
                });
                applyPlugin();
                someObj.someMethod();
                expect(calls).to.eql(["preFn", "someMethod"]);
            });

            it("should pass the given arguments to preFn and the original method", function () {
                createPlugin(function () {
                    this(someObj).before("someMethod", preFn = sinon.spy());
                });
                applyPlugin();
                someObj.someMethod(1, 2, 3);
                expect(preFn).to.have.been.calledWithExactly(1, 2, 3);
                expect(someMethod).to.have.been.calledWithExactly(1, 2, 3);
            });

            it("should enable preFn to override the args for the original method", function () {
                createPlugin(function () {
                    this(someObj).before("someMethod", function () {
                        return ["b"];
                    });
                });
                applyPlugin();
                someObj.someMethod("a");
                expect(someMethod).to.have.been.calledWithExactly("b");
            });

            it("should throw an error if preFn returned something other than undefined, a function or an array", function () {
                createPlugin(function () {
                    this(someObj).before("someMethod", function () {
                        return "you cannot return just a string";
                    });
                });
                applyPlugin();
                expect(function () {
                    someObj.someMethod();
                }).to.throw("Cannot apply you cannot return just a strin... as arguments for the overridden method 'someMethod': Expected an array or a function");
            });

            it("should not alter the return value of the original method", function () {
                createPlugin(function () {
                    this(someObj).before("someMethod", function () {});
                });
                applyPlugin();
                expect(someObj.someMethod()).to.equal("someMethod's return value");
            });

            it("should give preFn the full control by calling overridden() on the plugin context", function (done) {
                var result;

                createPlugin(function () {
                    var pluginContext = this;

                    this(someObj).before("someMethod", function () {
                        var overridden = pluginContext.overridden();

                        setTimeout(function () {
                            overridden();
                        }, 0);

                        return "intermediate result";
                    });
                });
                applyPlugin();
                result = someObj.someMethod();

                expect(someMethod).to.not.have.been.called;
                expect(result).to.equal("intermediate result");

                setTimeout(function () {
                    expect(someMethod).to.have.been.calledOnce;
                    done();
                }, 10);
            });

        });

    });

});