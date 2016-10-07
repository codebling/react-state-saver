"use strict";
var React = require('react');
var Map = require('collections/map');
var hash = require('object-hash');
var serialize = require('serialize-javascript');

var originalCreateClassFunction = null;

var StateSaver = function(serializedData) {
  var data = eval(serializedData);
  this.map = new Map(data);
};
StateSaver.prototype.installCaptureHook = function() {
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
StateSaver.prototype.uninstallCaptureHook = function() {
  if(originalCreateClassFunction !== null) {
    React.createClass = originalCreateClassFunction;
    originalCreateClassFunction = null;
  }
};
StateSaver.prototype.getSavedState = function() {
    return serialize(this.map.entries());
};

module.exports = StateSaver;