"use strict";

function plugin(namespace, fn) {
    return function (obj, config) {
        fn.call(createPluginContext(namespace), obj, config);
    };
}

function createPluginContext(namespace) {
    function pluginContext(currentObj) {
        pluginContext.target = currentObj;

        return pluginContext;
    }

    pluginContext.target = null;

    pluginContext.before = function (key, fn) {
        var target = pluginContext.target;
        var overridden = target[key];

        if (typeof overridden !== "function") {
            throw new TypeError("Cannot hook before method: Property '" + key + "' is not typeof function, instead saw " + overridden);
        }

        target[key] = function () {
            var args = arguments;
            var result = fn.apply(this, arguments);

            if (typeof result === "function") {
                // TODO implement
                return;
            }

            if (result && typeof result.length === "number") {
                args = result;
            }

            return overridden.apply(this, args);
        };
    };

    pluginContext.after = function (key, fn) {
        var target = pluginContext.target;
        var overridden = target[key];

        if (typeof overridden !== "function") {
            throw new TypeError("Cannot hook after method: Property '" + key + "' is not typeof function, instead saw " + overridden);
        }

        target[key] = function () {
            var result = overridden.apply(this, arguments);
            var newResult;

            newResult = fn.apply(this, [result, arguments]);
            if (newResult === undefined) {
                return result;
            }
            return newResult;
        };
    };

    pluginContext.set = function (key, value) {
        pluginContext.target[namespace + "/" + key] = value;
    };

    pluginContext.get = function (key) {
        return pluginContext.target[namespace + "/" + key];
    };

    return pluginContext;
}

module.exports = plugin;