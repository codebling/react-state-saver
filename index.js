"use strict";
var React = require('react');

var originalCreateClassFunction = null;

var StateSaver = function() {};
StateSaver.prototype.hook = function() {
  if(originalCreateClassFunction === null) {
    originalCreateClassFunction = React.createClass;
    var stateSaverThis = this;
    React.createClass = function(spec) {
      var originalGetInitialStateFunction = spec.getInitialState;
      spec.getInitialState = function() {
        return originalGetInitialStateFunction.apply(this, arguments);
      };
      return originalCreateClassFunction.apply(React, arguments);
    };
  }
};
StateSaver.prototype.unhook = function() {
  if(originalCreateClassFunction !== null) {
    React.createClass = originalCreateClassFunction;
    originalCreateClassFunction = null;
  }
};

module.exports = function() {
  return new StateSaver();
};
