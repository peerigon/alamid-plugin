"use strict";

/**
 * Returns a plugin that executes the given fn on a pluginContext. The pluginContext provides various tools
 * for defining and overriding properties on an existing object.
 *
 * @param {Function} fn
 * @returns {Function}
 */
function plugin(fn) {
    // Generating a random namespace to store values on an object without colliding with existing properties.
    // Should be enough randomness for our use-case.
    var namespace = Math.random().toString() + Math.random().toString() + Math.random().toString();

    /**
     * Set target as new current target to work on. All other methods provided by the pluginContext
     * will work on the new target.
     *
     * @param {*} target
     * @returns {pluginContext}
     */
    function pluginContext(target) {
        pluginContext.target = target;

        return pluginContext;
    }

    /**
     * A reference to the overridden method. Will be updated right before the hook.
     *
     * @type {*}
     */
    pluginContext.overridden = null;

    /**
     * The current target the pluginContext is working on. This value is updated by calling
     * pluginContext(newTarget).
     *
     * @type {*}
     */
    pluginContext.target = null;

    /**
     * Returns an object associated with the current target to store private properties.
     * Will return different objects for different targets, but always the same object for the same target.
     *
     * @returns {object}
     */
    pluginContext.store = function () {
        return pluginContext.target[namespace] || createStore(pluginContext.target, namespace);
    };

    /**
     * Defines `value` with the given `key` on the current target. If the property is already set, an error is thrown.
     * Use this method to extend the public api of an object, so the programmer is instantly informed about a naming collision.
     *
     * This function takes the whole prototype chain into account.
     *
     * @param {string} key
     * @param {*} value
     */
    pluginContext.define = function (key, value) {
        var target = pluginContext.target;

        if (key in target) {
            throw new Error("Cannot define property '" + key + "': There is already a property with value " + truncate(target[key]));
        }
        target[key] = value;
    };

    /**
     * Run `fn` before the function specified by `key` is executed. A reference to the overridden-method is provided
     * under `pluginContext.overridden`. It's also possible to change the applied arguments by changing
     * `pluginContext.override.args`.
     *
     * Throws an error if `key` is not a function on the current target.
     *
     * @param {string} key
     * @param {function} fn
     */
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

    /**
     * Run `fn` after the function specified by `key` is executed.  A reference to the overridden-method is provided
     * under `pluginContext.overridden`. It's also possible to change the returned results by changing
     * `pluginContext.override.result`.
     *
     * Throws an error if `key` is not a function on the current target.
     *
     * @param {string} key
     * @param {function} fn
     */
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

    /**
     * Replace the function specified by `key` with `fn`. A reference to the overridden method is provided
     * at `pluginContext.overridden`.
     * Throws an error if `key` is not a function on the current target.
     *
     * @param {string} key
     * @param {function} fn
     */
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

    /**
     * Provides a reference to the arguments that will be or have been applied to the original `fn`.
     * This property is only meaningful when inside of a `before`-, `after`- or `override`-hook.
     *
     * Changing this value will change the applied arguments in the `before`-hook.
     *
     * @type {arguments}
     */
    pluginContext.override.args = null;

    /**
     * Provides a reference to the result that `fn` has returned.
     * This property is only meaningful when inside of an `after`-hook.
     *
     * Changing this value will change the returned value.
     *
     * @type {arguments}
     */
    pluginContext.override.result = null;

    /**
     * Runs `fn` when the function specified by `key` is executed. Use this method if you don't want
     * to modify an existing method, but want to hook into whenever the method is called. Within a
     * hook there is no way to override any values. It's also important that `fn` has no side-effects.
     *
     * Throws an error if the property is defined and not a function.
     * Throws no error and defines implicitly the property if the property was previously undefined.
     *
     * @param {string} key
     * @param {function} fn
     */
    pluginContext.hook = function (key, fn) {
        var target = pluginContext.target;
        var value = pluginContext.target[key];

        if (key in target) {
            if (typeof value !== "function") {
                throw new Error("Cannot hook into method '" + key + "': Expected '" + key + "' to be a function, instead saw " + truncate(value));
            }

            target[key] = function () {
                fn.apply(this, arguments);
                return value.apply(this, arguments);
            };
        } else {
            target[key] = fn;
        }
    };

    return function plugin(obj, config) {
        // abort if the plugin has already been applied on this obj
        if (obj[namespace]) {
            return;
        }

        // create a new store and mark this obj
        createStore(obj, namespace);

        fn.call(pluginContext, obj, config);
    };
}

/**
 * Creates a store associated with `obj` under the given `key`.
 * The store is not enumerable to hide it from the debugging view.
 *
 * @param {object} obj
 * @param {string} key
 * @returns {object}
 */
function createStore(obj, key) {
    var value = {};

    Object.defineProperty(obj, key, {
        enumerable: false,
        value: value
    });

    return value;
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