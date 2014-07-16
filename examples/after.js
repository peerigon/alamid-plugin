"use strict";

var plugin = require("../lib/plugin.js");
var afterPlugin;

afterPlugin = plugin("peerigon/after-plugin", function (obj) {
    this(obj).after("someMethod", function (result, args) {
        return args[0];
    });
});

module.exports = afterPlugin;