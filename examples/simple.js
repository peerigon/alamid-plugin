"use strict";

var plugin = require("../lib/plugin.js");
var simplePlugin;

simplePlugin = plugin("peerigon/simple-plugin", function (obj) {
    obj.newNumber = 2;
});

module.exports = simplePlugin;