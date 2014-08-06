"use strict";

var plugin = require("../lib/plugin.js");
var simplePlugin;

simplePlugin = plugin(function (obj) {
    obj.newNumber = 2;
});

module.exports = simplePlugin;