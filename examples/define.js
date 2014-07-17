"use strict";

var plugin = require("../lib/plugin.js");
var definePlugin;

definePlugin = plugin("peerigon/define-plugin", function (obj) {
    this(obj).define("someValue", 2);
    this(obj).define("someMethod", function () {
        return this.someValue;
    });
});

module.exports = definePlugin;