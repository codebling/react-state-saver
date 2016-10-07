"use strict";
var React = require('react');
var hash = require('object-hash');

var originalCreateClassFunction = null;

var StateSaver = function(data) {
  this.map = new Map(data);
};
StateSaver.prototype.installCaptureHook = function() {
  if(originalCreateClassFunction === null) {
    originalCreateClassFunction = React.createClass;
    var stateSaver = this;
    React.createClass = function(spec) {
      var originalGetInitialStateFunction = spec.getInitialState;
      spec.getInitialState = function() {
        var state = originalGetInitialStateFunction.apply(this, arguments);
        stateSaver.map.set({spec: spec, specHash: hash(spec), props: this.props}, state);
        return state;
      };
      return originalCreateClassFunction.apply(React, arguments);
    };
  }
};
StateSaver.prototype.installReplayHook = function() {
  if(originalCreateClassFunction === null) {
    originalCreateClassFunction = React.createClass;
    var stateSaverThis = this;
    React.createClass = function(spec) {
      var originalGetInitialStateFunction = spec.getInitialState;
      spec.getInitialState = function() {
        return stateSaverThis.map.get({spec: spec, specHash: hash(spec), props: this.props});
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
  return Array.from(this.map.entries());
};

module.exports = StateSaver;