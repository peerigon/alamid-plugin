"use strict";

var plugin = require("../lib/plugin.js");
var hookPlugin;

hookPlugin = plugin("peerigon/hook", function (obj) {
    this(obj).hook("someMethod", function () {
        this.message = "hi";
    });
});

module.exports = hookPlugin;