"use strict";

var plugin = require("../lib/plugin.js");
var beforeAsyncPlugin;

beforeAsyncPlugin = plugin("peerigon/beforeAsync-plugin", function (obj) {
    var self = this;

    this(obj).before("someMethod", function (number) {
        var overridden = self.overridden();

        setTimeout(function () {
            overridden(number);
        }, 0);

        return "intermediate result";
    });
});

module.exports = beforeAsyncPlugin;