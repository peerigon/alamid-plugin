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

    function pluginContext(target) {
        pluginContext.target = target;

        return pluginContext;
    }

    pluginContext.overridden = null;

    pluginContext.target = null;

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

    pluginContext.set = function (key, value) {
        pluginContext.target[namespace + "/" + key] = value;
    };

    pluginContext.get = function (key) {
        return pluginContext.target[namespace + "/" + key];
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