"use strict";

function use(plugin, config) { /* jshint validthis: true */
    plugin(this, config);

    return this;
}

module.exports = use;