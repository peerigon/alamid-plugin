"use strict";

var plugin = require("../lib/plugin.js");
var afterPlugin;

afterPlugin = plugin("peerigon/after", function (obj) {
    var self = this;

    this(obj).after("someMethod", function (result) {
        self.override.result = ++result;
    });
});

module.exports = afterPlugin;