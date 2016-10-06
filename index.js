"use strict";
var React = require('react');

var originalCreateClassFunction = null;

function hook() {
  if(originalCreateClassFunction === null) {
    originalCreateClassFunction = React.createClass;
    React.createClass = function(spec) {
      var originalGetInitialStateFunction = spec.getInitialState;
      spec.getInitialState = function() {
        return originalGetInitialStateFunction.apply(this, arguments);
      };
      return originalCreateClassFunction.apply(React, arguments);
    };
  }
}

function unhook() {
  if(originalCreateClassFunction !== null) {
    React.createClass = originalCreateClassFunction;
    originalCreateClassFunction = null;
  }
}

module.exports.hook = hook;
module.exports.unhook = unhook;