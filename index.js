"use strict";
var Module = require('module');
var React = require('react');
var hash = require('object-hash');

var originalCreateClassFunction = null;
var originalRequire = null;
var markedProperty = '__MARKED_FOR_REACT_STATE_SAVING__';
var originalGetInitialStateFunctionSavingProperty = '__ORIGINAL_GET_INITIAL_STATE_FUNCTION__';

var StateSaver = function(data) {
  this.map = new Map(data);
};
StateSaver.prototype.installCaptureHook = function() {
  if(originalRequire === null) {
    originalCreateClassFunction = React.createClass;
    var stateSaver = this;
    var getReplacementGetInitiailStateFunction = function(spec) {
      return function() {
        var state = spec[originalGetInitialStateFunctionSavingProperty].apply(this, arguments);
        stateSaver.map.set({specHash: hash(spec), propsHash: hash(this.props)}, state);
        return state;
      }
    };
    React.createClass = function(spec) {
      spec[originalGetInitialStateFunctionSavingProperty] = spec.getInitialState;
      spec.getInitialState = getReplacementGetInitiailStateFunction(spec);
      var reactClass = originalCreateClassFunction.apply(React, arguments);
      reactClass[markedProperty] = true;
      return reactClass;
    };
    originalRequire = Module.prototype.require;
    Module.prototype.require = function() {
      var potentialReactClass = originalRequire.apply(this, arguments);
      if(potentialReactClass[markedProperty]) {
        var spec = potentialReactClass.prototype;
        spec.getInitialState = getReplacementGetInitiailStateFunction(spec);
      }
      return potentialReactClass;
    }
  }
};
StateSaver.prototype.installReplayHook = function() {
  if(originalCreateClassFunction === null) {
    originalCreateClassFunction = React.createClass;
    var stateSaver = this;
    React.createClass = function(spec) {
      var originalGetInitialStateFunction = spec.getInitialState;
      spec.getInitialState = function() {
        return stateSaver.map.get({specHash: hash(spec), propsHash: hash(this.props)});
      };
      return originalCreateClassFunction.apply(React, arguments);
    };
  }
};
StateSaver.prototype.uninstallCaptureHook = function() {
  if(originalRequire !== null) {
    React.createClass = originalCreateClassFunction;
    originalCreateClassFunction = null;
    Module.prototype.require = originalRequire;
    originalRequire = null;
  }
};
StateSaver.prototype.getSavedState = function() {
  return Array.from(this.map.entries());
};

module.exports = StateSaver;