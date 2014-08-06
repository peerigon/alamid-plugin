"use strict";

var plugin = require("../lib/plugin.js");
var storePlugin;

storePlugin = plugin(function (obj) {
    var self = this;

    this(obj).store().newNumber = 2;

    obj.getNewNumber = function () {
        return self(obj).store().newNumber;
    };
});

module.exports = storePlugin;