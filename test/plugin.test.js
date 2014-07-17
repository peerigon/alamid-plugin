"use strict";

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var plugin = require("../lib/plugin.js");

var slice = Array.prototype.slice;

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

            it("should pass the given arguments to preFn and to the original method", function () {
                createPlugin(function () {
                    this(someObj).before("someMethod", preFn = sinon.spy());
                });
                applyPlugin();
                someObj.someMethod(1, 2, 3);
                expect(preFn).to.have.been.calledWithExactly(1, 2, 3);
                expect(someMethod).to.have.been.calledWithExactly(1, 2, 3);
            });

            it("should call preFn and the original method on the expected context", function () {
                var ctx = {};

                createPlugin(function () {
                    this(someObj).before("someMethod", preFn = sinon.spy());
                });
                applyPlugin();
                someObj.someMethod();
                expect(preFn).to.have.been.calledOn(someObj);
                expect(someMethod).to.have.been.calledOn(someObj);
                someObj.someMethod.call(ctx);
                expect(preFn).to.have.been.calledOn(ctx);
                expect(someMethod).to.have.been.calledOn(ctx);
            });

            it("should enable preFn to override the args for the original method", function () {
                createPlugin(function () {
                    var self = this;

                    this(someObj).before("someMethod", function () {
                        self.override.args = ["b"];
                    });
                });
                applyPlugin();
                someObj.someMethod("a");
                expect(someMethod).to.have.been.calledWithExactly("b");
            });

            it("should not alter the return value of the original method", function () {
                createPlugin(function () {
                    this(someObj).before("someMethod", function () {});
                });
                applyPlugin();
                expect(someObj.someMethod()).to.equal("someMethod's return value");
            });

            it("should throw an error if there is no function with the given key", function () {
                createPlugin(function () {
                    this(someObj).before("nonExistentMethod", function () {});
                });
                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot hook before method: Property 'nonExistentMethod' is not typeof function, instead saw undefined");
            });

        });

        describe(".after(key, postFn)", function () {
            var calls, postFn, someMethod;

            beforeEach(function () {
                calls = [];
                someObj.someMethod = someMethod = sinon.spy(function () {
                    calls.push("someMethod");
                    return "someMethod's return value";
                });
            });

            it("should replace the original method", function () {
                createPlugin(function () {
                    this(someObj).after("someMethod", function () {});
                });
                applyPlugin();
                expect(someObj.someMethod).to.not.equal(someMethod);
            });

            it("should run the original method and then postFn", function () {
                createPlugin(function () {
                    this(someObj).after("someMethod", postFn = sinon.spy(function () {
                        calls.push("postFn");
                    }));
                });
                applyPlugin();
                someObj.someMethod();
                expect(calls).to.eql(["someMethod", "postFn"]);
            });

            it("should pass the result and the original arguments to postFn", function () {
                createPlugin(function () {
                    this(someObj).after("someMethod", postFn = sinon.spy());
                });
                applyPlugin();
                someObj.someMethod(1, 2, 3);
                expect(postFn.firstCall.args[0]).to.equal("someMethod's return value");
                expect(slice.call(postFn.firstCall.args[1])).to.eql([1, 2, 3]);
            });

            it("should call postFn and the original method on the expected context", function () {
                var ctx = {};

                createPlugin(function () {
                    this(someObj).after("someMethod", postFn = sinon.spy());
                });
                applyPlugin();
                someObj.someMethod();
                expect(postFn).to.have.been.calledOn(someObj);
                expect(someMethod).to.have.been.calledOn(someObj);
                someObj.someMethod.call(ctx);
                expect(postFn).to.have.been.calledOn(ctx);
                expect(someMethod).to.have.been.calledOn(ctx);
            });

            it("should not alter the arguments for the original method", function () {
                createPlugin(function () {
                    this(someObj).after("someMethod", function () {});
                });
                applyPlugin();
                someObj.someMethod(1, 2, 3);
                expect(someMethod).to.have.been.calledWithExactly(1, 2, 3);
            });

            it("should not alter the return value of the original method", function () {
                createPlugin(function () {
                    this(someObj).after("someMethod", function () {});
                });
                applyPlugin();
                expect(someObj.someMethod()).to.equal("someMethod's return value");
            });

            it("should enable postFn to override the return value of the original method", function () {
                createPlugin(function () {
                    var self = this;

                    this(someObj).after("someMethod", function () {
                        self.override.result = "overridden value";
                    });
                });
                applyPlugin();
                expect(someObj.someMethod()).to.equal("overridden value");
            });

            it("should throw an error if there is no function with the given key", function () {
                createPlugin(function () {
                    this(someObj).after("nonExistentMethod", function () {});
                });
                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot hook after method: Property 'nonExistentMethod' is not typeof function, instead saw undefined");
            });

        });

        describe(".override(key, fn)", function () {
            var someMethod;

            beforeEach(function () {
                someObj.someMethod = someMethod = sinon.spy(function () {
                    return "someMethod's return value";
                });
            });

            it("should give fn the full control over when to call the original method via pluginContext.overridden", function (done) {
                createPlugin(function () {
                    var pluginContext = this;

                    this(someObj).override("someMethod", function () {
                        setTimeout(function () {
                            pluginContext.overridden();
                        }, 0);
                    });
                });
                applyPlugin();
                someObj.someMethod();
                expect(someMethod).to.not.have.been.called;
                setTimeout(function () {
                    expect(someMethod).to.have.been.calledOnce;
                    done();
                }, 10);
            });

            it("should return the returned result", function () {
                var result;

                createPlugin(function () {
                    this(someObj).override("someMethod", function () {
                        return "overridden result";
                    });
                });
                applyPlugin();
                expect(someObj.someMethod()).to.equal("overridden result");
            });

            it("should throw an error if there is no function with the given key", function () {
                createPlugin(function () {
                    this(someObj).override("nonExistentMethod", function () {});
                });
                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot override method: Property 'nonExistentMethod' is not typeof function, instead saw undefined");
            });

        });

        describe(".define(key, value)", function () {

            it("should define the property with the given key and value if it is undefined", function () {
                createPlugin(function () {
                    this(obj).define("someValue", 2);
                    this(obj).define("someMethod", function () {
                        return this.someValue;
                    });
                });
                applyPlugin();
                expect(obj).to.have.property("someValue", 2);
                expect(obj).to.have.property("someMethod");
                expect(obj.someMethod()).to.equal(2);
            });

            it("should throw an error if the property is already defined", function () {
                createPlugin(function () {
                    this(someObj).define("someValue", 2);
                });
                someObj.someValue = 1;
                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot define property 'someValue': There is already a property with value 1");
            });

            it("should take the whole prototype chain into account", function () {
                var child = Object.create(someObj);

                createPlugin(function () {
                    this(child).define("someValue", 2);
                });
                someObj.someValue = 1;
                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot define property 'someValue': There is already a property with value 1");
            });

            it("should even work on undefined properties which aren't enumerable", function () {
                var child = Object.create(someObj);

                createPlugin(function () {
                    this(child).define("someValue", 2);
                });
                Object.defineProperty(someObj, "someValue", {
                    enumerable: false,
                    writable: true
                });
                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot define property 'someValue': There is already a property with value undefined");
            });

        });

    });

});