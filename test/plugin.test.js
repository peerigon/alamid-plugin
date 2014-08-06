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
        var spy, newPlugin, obj;

        beforeEach(function () {
            spy = sinon.spy();
            newPlugin = plugin("testPlugin", spy);
            obj = {};
        });

        it("should pass obj to fn", function () {
            newPlugin(obj);

            expect(spy).to.have.been.calledWith(obj);
        });

        it("should pass obj and config to fn", function () {
            var config = {};

            newPlugin(obj, config);

            expect(spy).to.have.been.calledWith(obj, config);
        });

        it("should mark the obj so the plugin can't be applied twice on the same obj", function () {
            newPlugin(obj);
            newPlugin(obj);

            expect(spy).to.have.been.calledOnce;
        });

    });

});

describe("fn's context", function () {
    var spy;
    var newPlugin;
    var obj;
    var otherObj;

    function createPlugin(fn) {
        spy = sinon.spy(fn);
        newPlugin = plugin("testPlugin", spy);
    }

    function applyPlugin() {
        newPlugin(obj);
        expect(spy).to.have.been.calledOnce;
    }

    function runTests(onOtherObj) {
        var target;

        beforeEach(function () {
            if (onOtherObj) {
                target = {};
            } else {
                target = obj;
            }
        });

        describe(".store()", function () {

            it("should return an object", function () {
                createPlugin(function () {
                    expect(this(target).store()).to.be.an("object");
                });
                applyPlugin();
            });

            it("should store the returned object under obj['plugin/' + pluginNamespace]", function () {
                createPlugin(function () {
                    expect(this(target).store()).to.equal(target["plugin/testPlugin"]);
                });
                applyPlugin();
            });

            it("should make the store not enumerable", function () {
                createPlugin(function () {
                    this(target).store();
                });
                applyPlugin();

                expect(Object.keys(target)).to.not.contain("plugin/testPlugin");
            });

            it("should return always the same object for obj", function () {
                createPlugin(function () {
                    expect(this(target).store()).to.equal(this(target).store());
                });
                applyPlugin();
            });

            it("should return different objects for different targets", function () {
                createPlugin(function () {
                    expect(this(target).store()).to.not.equal(this({}).store());
                });
                applyPlugin();
            });

        });

        describe(".before(key, preFn)", function () {
            var calls, preFn, someMethod;

            beforeEach(function () {
                calls = [];
                target.someMethod = someMethod = sinon.spy(function () {
                    calls.push("someMethod");
                    return "someMethod's return value";
                });
            });

            it("should replace the original method", function () {
                createPlugin(function () {
                    this(target).before("someMethod", function () {});
                });
                applyPlugin();

                expect(target.someMethod).to.not.equal(someMethod);
            });

            it("should run preFn and then the original method", function () {
                createPlugin(function () {
                    this(target).before("someMethod", preFn = sinon.spy(function () {
                        calls.push("preFn");
                    }));
                });
                applyPlugin();
                target.someMethod();

                expect(calls).to.eql(["preFn", "someMethod"]);
            });

            it("should pass the given arguments to preFn and to the original method", function () {
                createPlugin(function () {
                    this(target).before("someMethod", preFn = sinon.spy());
                });
                applyPlugin();
                target.someMethod(1, 2, 3);

                expect(preFn).to.have.been.calledWithExactly(1, 2, 3);
                expect(someMethod).to.have.been.calledWithExactly(1, 2, 3);
            });

            it("should call preFn and the original method on the expected context", function () {
                var ctx = {};

                createPlugin(function () {
                    this(target).before("someMethod", preFn = sinon.spy());
                });
                applyPlugin();

                target.someMethod();
                expect(preFn).to.have.been.calledOn(target);
                expect(someMethod).to.have.been.calledOn(target);
                target.someMethod.call(ctx);
                expect(preFn).to.have.been.calledOn(ctx);
                expect(someMethod).to.have.been.calledOn(ctx);
            });

            it("should enable preFn to override the args for the original method", function () {
                createPlugin(function () {
                    var self = this;

                    this(target).before("someMethod", function () {
                        self.override.args = ["b"];
                    });
                });
                applyPlugin();

                target.someMethod("a");
                expect(someMethod).to.have.been.calledWithExactly("b");
            });

            it("should not alter the return value of the original method", function () {
                createPlugin(function () {
                    this(target).before("someMethod", function () {});
                });
                applyPlugin();

                expect(target.someMethod()).to.equal("someMethod's return value");
            });

            it("should throw an error if there is no function with the given key", function () {
                createPlugin(function () {
                    this(target).before("nonExistentMethod", function () {});
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
                target.someMethod = someMethod = sinon.spy(function () {
                    calls.push("someMethod");
                    return "someMethod's return value";
                });
            });

            it("should replace the original method", function () {
                createPlugin(function () {
                    this(target).after("someMethod", function () {});
                });
                applyPlugin();

                expect(target.someMethod).to.not.equal(someMethod);
            });

            it("should run the original method and then postFn", function () {
                createPlugin(function () {
                    this(target).after("someMethod", postFn = sinon.spy(function () {
                        calls.push("postFn");
                    }));
                });
                applyPlugin();
                target.someMethod();

                expect(calls).to.eql(["someMethod", "postFn"]);
            });

            it("should pass the result and the original arguments to postFn", function () {
                createPlugin(function () {
                    this(target).after("someMethod", postFn = sinon.spy());
                });
                applyPlugin();
                target.someMethod(1, 2, 3);

                expect(postFn.firstCall.args[0]).to.equal("someMethod's return value");
                expect(slice.call(postFn.firstCall.args[1])).to.eql([1, 2, 3]);
            });

            it("should call postFn and the original method on the expected context", function () {
                var ctx = {};

                createPlugin(function () {
                    this(target).after("someMethod", postFn = sinon.spy());
                });
                applyPlugin();

                target.someMethod();
                expect(postFn).to.have.been.calledOn(target);
                expect(someMethod).to.have.been.calledOn(target);
                target.someMethod.call(ctx);
                expect(postFn).to.have.been.calledOn(ctx);
                expect(someMethod).to.have.been.calledOn(ctx);
            });

            it("should not alter the arguments for the original method", function () {
                createPlugin(function () {
                    this(target).after("someMethod", function () {});
                });
                applyPlugin();

                target.someMethod(1, 2, 3);
                expect(someMethod).to.have.been.calledWithExactly(1, 2, 3);
            });

            it("should not alter the return value of the original method", function () {
                createPlugin(function () {
                    this(target).after("someMethod", function () {});
                });
                applyPlugin();

                expect(target.someMethod()).to.equal("someMethod's return value");
            });

            it("should enable postFn to override the return value of the original method", function () {
                createPlugin(function () {
                    var self = this;

                    this(target).after("someMethod", function () {
                        self.override.result = "overridden value";
                    });
                });
                applyPlugin();

                expect(target.someMethod()).to.equal("overridden value");
            });

            it("should throw an error if there is no function with the given key", function () {
                createPlugin(function () {
                    this(target).after("nonExistentMethod", function () {});
                });

                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot hook after method: Property 'nonExistentMethod' is not typeof function, instead saw undefined");
            });

        });

        describe(".override(key, fn)", function () {
            var someMethod;

            beforeEach(function () {
                target.someMethod = someMethod = sinon.spy(function () {
                    return "someMethod's return value";
                });
            });

            it("should give fn the full control over when to call the original method via pluginContext.overridden", function (done) {
                createPlugin(function () {
                    var pluginContext = this;

                    this(target).override("someMethod", function () {
                        setTimeout(function () {
                            pluginContext.overridden();
                        }, 0);
                    });
                });
                applyPlugin();
                target.someMethod();

                expect(someMethod).to.not.have.been.called;
                setTimeout(function () {
                    expect(someMethod).to.have.been.calledOnce;
                    done();
                }, 10);
            });

            it("should return the returned result", function () {
                var result;

                createPlugin(function () {
                    this(target).override("someMethod", function () {
                        return "overridden result";
                    });
                });
                applyPlugin();

                expect(target.someMethod()).to.equal("overridden result");
            });

            it("should throw an error if there is no function with the given key", function () {
                createPlugin(function () {
                    this(target).override("nonExistentMethod", function () {});
                });

                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot override method: Property 'nonExistentMethod' is not typeof function, instead saw undefined");
            });

        });

        describe(".define(key, value)", function () {

            it("should define the property with the given key and value if it is undefined", function () {
                createPlugin(function () {
                    this(target).define("someValue", 2);
                    this(target).define("someMethod", function () {
                        return this.someValue;
                    });
                });

                applyPlugin();

                expect(target).to.have.property("someValue", 2);
                expect(target).to.have.property("someMethod");
                expect(target.someMethod()).to.equal(2);
            });

            it("should throw an error if the property is already defined", function () {
                createPlugin(function () {
                    this(target).define("someValue", 2);
                });
                target.someValue = 1;

                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot define property 'someValue': There is already a property with value 1");
            });

            it("should take the whole prototype chain into account", function () {
                var child = Object.create(target);

                createPlugin(function () {
                    this(child).define("someValue", 2);
                });
                target.someValue = 1;

                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot define property 'someValue': There is already a property with value 1");
            });

            it("should even work on undefined properties which aren't enumerable", function () {
                var child = Object.create(target);

                createPlugin(function () {
                    this(child).define("someValue", 2);
                });
                Object.defineProperty(target, "someValue", {
                    enumerable: false,
                    writable: true
                });

                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot define property 'someValue': There is already a property with value undefined");
            });

        });

        describe(".hook(key, fn)", function () {

            it("should define the method if it is undefined", function () {
                function fn() {}

                createPlugin(function () {
                    this(target).hook("someMethod", fn);
                });

                expect(target).to.not.have.property("someMethod");
                applyPlugin();
                expect(target).to.have.property("someMethod", fn);
            });

            it("should hook before the method if the property is already a function", function () {
                var secondSpy;
                var thirdSpy;

                createPlugin(function () {
                    this(target).hook("someMethod", secondSpy = sinon.spy());
                });

                target.someMethod = thirdSpy = sinon.spy(function () {
                    expect(secondSpy).to.have.been.calledOnce;
                });
                applyPlugin();
                target.someMethod();

                expect(thirdSpy).to.have.been.calledOnce;
            });

            it("should throw an error if the property is not a function", function () {
                createPlugin(function () {
                    this(target).hook("someMethod", function () {});
                });
                target.someMethod = 1;

                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot hook into method 'someMethod': Expected 'someMethod' to be a function, instead saw 1");
            });

            it("should take the whole prototype chain into account", function () {
                var child = Object.create(target);

                createPlugin(function () {
                    this(child).hook("someMethod", function () {});
                });
                target.someMethod = 1;

                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot hook into method 'someMethod': Expected 'someMethod' to be a function, instead saw 1");
            });

            it("should even work on undefined properties which aren't enumerable", function () {
                var child = Object.create(target);

                createPlugin(function () {
                    this(child).hook("someMethod", function () {});
                });
                Object.defineProperty(target, "someMethod", {
                    enumerable: false,
                    writable: true
                });

                expect(function () {
                    applyPlugin();
                }).to.throw("Cannot hook into method 'someMethod': Expected 'someMethod' to be a function, instead saw undefined");
            });

        });
    }

    beforeEach(function () {
        obj = {};
    });

    it("should be typeof function", function () {
        createPlugin();
        applyPlugin();

        expect(spy.thisValues[0]).to.be.a("function");
    });

    describe("called with (obj)", function () {

        describe("working on obj", function () {
            runTests(false);
        });

        describe("working on some other obj", function () {
            runTests(true);
        });

    });

});