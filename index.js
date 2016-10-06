"use strict";
var React = require('react');
var Map = require('collections/map');
var hash = require('object-hash');

var originalCreateClassFunction = null;

var StateSaver = function() {
  this.map = new Map();
};
StateSaver.prototype.hook = function() {
  if(originalCreateClassFunction === null) {
    originalCreateClassFunction = React.createClass;
    var stateSaverThis = this;
    React.createClass = function(spec) {
      var originalGetInitialStateFunction = spec.getInitialState;
      spec.getInitialState = function() {
        var state = originalGetInitialStateFunction.apply(this, arguments);
        stateSaverThis.map.set({spec: spec, specHash: hash(spec), props: this.props}, state);
        return state;
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
  return this.map;
};

module.exports = function() {
  return new StateSaver();
};
