"use strict";

var plugin = require("../lib/plugin.js");
var beforePlugin;

beforePlugin = plugin("peerigon/before-plugin", function (obj) {
    this(obj).before("someMethod", function () {
        return [2];
    });
});

module.exports = beforePlugin;