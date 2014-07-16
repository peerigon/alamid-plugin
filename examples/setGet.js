"use strict";

var plugin = require("../lib/plugin.js");
var setGetPlugin;

setGetPlugin = plugin("peerigon/setget-plugin", function (obj) {
    var self = this;

    this(obj).set("newNumber", 2);

    obj.getNewNumber = function () {
        return self(obj).get("newNumber");
    };
});

module.exports = setGetPlugin;