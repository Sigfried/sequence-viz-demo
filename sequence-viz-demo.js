/*
 * # sequence-viz-demo.js
 * Author: [Sigfried Gold](http://sigfried.org)  
 * License: [MIT](http://sigfried.mit-license.org/)  
 */
"use strict";
var seqviz = require("sequence-viz");
require("d3");
require("nvd3");
console.log(seqviz);
//var d3 = require("d3");
var exports = {
    seqviz: seqviz,
    supergroup : seqviz.supergroup,
}
module.exports = exports;

window.seqviz = exports;

