"use strict";

function plugin(namespace, fn) {
    if (typeof namespace !== "string") {
        throw new TypeError("Cannot create plugin: namespace should be a string, instead saw " + truncate(namespace));
    }

    return function (obj, config) {
        fn.call(createPluginContext(namespace), obj, config);
    };
}

function createPluginContext(namespace) {
    var takeControl, overridden, target;

    function pluginContext(currentObj) {
        target = currentObj;

        return pluginContext;
    }

    pluginContext.overridden = function () {
        takeControl = false;

        return overridden;
    };

    pluginContext.before = function (key, fn) {
        var currentOverridden = target[key];

        if (typeof currentOverridden !== "function") {
            throw new TypeError("Cannot hook before method: Property '" + key + "' is not typeof function, instead saw " + truncate(overridden));
        }

        target[key] = function () {
            var args = arguments;
            var result;

            takeControl = true;
            overridden = currentOverridden;

            result = fn.apply(this, arguments);

            if (takeControl === false) {
                return result;
            }

            if (Array.isArray(result)) {
                args = result;
            } else if (typeof result !== "undefined") {
                throw new TypeError("Cannot apply " + truncate(result) + " as arguments for the overridden method '" + key + "': Expected an array or a function");
            }

            return overridden.apply(this, args);
        };
    };

    pluginContext.after = function (key, fn) {
        var currentOverridden = target[key];

        if (typeof currentOverridden !== "function") {
            throw new TypeError("Cannot hook after method: Property '" + key + "' is not typeof function, instead saw " + truncate(overridden));
        }

        target[key] = function () {
            var result, newResult;

            overridden = currentOverridden;

            result = overridden.apply(this, arguments);
            newResult = fn.apply(this, [result, arguments]);

            if (newResult === undefined) {
                return result;
            }
            return newResult;
        };
    };

    pluginContext.set = function (key, value) {
        target[namespace + "/" + key] = value;
    };

    pluginContext.get = function (key) {
        return target[namespace + "/" + key];
    };

    return pluginContext;
}

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