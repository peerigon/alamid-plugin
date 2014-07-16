"use strict";

var plugin = require("../lib/plugin.js");
var overridePlugin;

overridePlugin = plugin("peerigon/override-plugin", function (obj) {
    var pluginContext = this;

    this(obj).override("someMethod", function (number) {
        var self = this;

        // do some async task
        setTimeout(function () {
            pluginContext.overridden.call(self, number);
        }, 0);

        return "intermediate result";
    });
});

module.exports = overridePlugin;