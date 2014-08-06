"use strict";

function plugin(namespace, fn) {
    if (typeof namespace !== "string") {
        throw new TypeError("Cannot create plugin: namespace should be a string, instead saw " + truncate(namespace));
    }

    function pluginContext(target) {
        pluginContext.target = target;

        return pluginContext;
    }

    pluginContext.overridden = null;

    pluginContext.target = null;

    // TODO replace set/get with store() for faster property access
    // e.g. pluginContext(this).store().bla = "Blub";
    pluginContext.store = function () {
        return pluginContext.target[namespace] || (pluginContext.target[namespace] = {});
    };

    pluginContext.define = function (key, value) {
        var target = pluginContext.target;

        if (hasProp(target, key)) {
            throw new Error("Cannot define property '" + key + "': There is already a property with value " + truncate(target[key]));
        }
        target[key] = value;
    };

    pluginContext.before = function (key, fn) {
        var overridden = pluginContext.target[key];

        if (typeof overridden !== "function") {
            throw new TypeError("Cannot hook before method: Property '" + key + "' is not typeof function, instead saw " + truncate(overridden));
        }

        pluginContext.target[key] = function () {
            pluginContext.override.args = arguments;
            pluginContext.override.result = null;
            pluginContext.overridden = overridden;

            fn.apply(this, arguments);

            return overridden.apply(this, pluginContext.override.args);
        };
    };

    pluginContext.after = function (key, fn) {
        var overridden = pluginContext.target[key];

        if (typeof overridden !== "function") {
            throw new TypeError("Cannot hook after method: Property '" + key + "' is not typeof function, instead saw " + truncate(overridden));
        }

        pluginContext.target[key] = function () {
            pluginContext.override.args = arguments;
            pluginContext.overridden = overridden;
            pluginContext.override.result = overridden.apply(this, arguments);

            fn.call(this, pluginContext.override.result, pluginContext.override.args);

            return pluginContext.override.result;
        };
    };

    pluginContext.override = function (key, fn) {
        var overridden = pluginContext.target[key];

        if (typeof overridden !== "function") {
            throw new TypeError("Cannot override method: Property '" + key + "' is not typeof function, instead saw " + truncate(overridden));
        }

        pluginContext.target[key] = function () {
            pluginContext.override.args = arguments;
            pluginContext.override.result = null;
            pluginContext.overridden = overridden;

            return fn.apply(this, arguments);
        };
    };

    pluginContext.override.args = null;

    pluginContext.override.result = null;

    return function (obj, config) {
        if (obj[namespace] === null) {
            return;
        }
        obj[namespace] = null;
        fn.call(pluginContext, obj, config);
    };
}

function hasProp(obj, key) {
    return obj[key] !== undefined || checkProtoChain(obj, key);
}

function checkProtoChain(obj, key) {
    var hasOwnProp = obj.hasOwnProperty(key),
        proto;

    if (hasOwnProp) {
        return true;
    }

    proto = Object.getPrototypeOf(obj);
    if (proto === null) {
        return false;
    }
    return checkProtoChain(Object.getPrototypeOf(obj), key);
}

/* istanbul ignore next because truncate is only for readable error messages */
function truncate(obj) {
    if (!obj) {
        return obj;
    }

    obj = obj.toString();
    if (obj.length > 30) {
        return obj.slice(0, 30) + "...";
    }

    return obj;
}

module.exports = plugin;