"use strict";
var Module = require('module');
var React = require('react');
var hash = require('object-hash');

var originalCreateClassFunction = null;
var originalRequire = null;
var getInitialStateKey = 'getInitialState';
var markedKey = '__REACT_STATE_SAVER_MARKED_FOR_REACT_STATE_SAVING__';
var originalGetInitialStateFunctionSaveKey = '__REACT_STATE_SAVER_ORIGINAL_GET_INITIAL_STATE_FUNCTION__';
var hashOfPlainOldSpecKey = '__REACT_STATE_SAVER_HASH_OF_PLAIN_OLD_SPEC__';

var HashingHelper = {};
HashingHelper.functionNormalisingReplacer = function (value) {
  if(typeof value === 'function') {
    value = value.toString().replace(/[ \t\r\n]+/g, '');
  }
  return value;
};
HashingHelper.computeHashOfPlainOldSpec = function (spec) {
  var options = {
    algorithm: 'md5', //the fastest
    respectFunctionNames: true, //we want that
    respectFunctionProperties: false, //speed + avoid risk of different primitive protos in node vs browser
    respectType: false, //works for our use case: we're only hashing plain objects
    unorderedArrays: true, //speed optimisation which should work for our use case
    unorderedSets: true, //speed optimisation which should work for our use case
    replacer: HashingHelper.functionNormalisingReplacer
  };
  return hash(spec, options);
};
HashingHelper.createKey = function (specHash, props) {
  var propsHash = hash(JSON.stringify(props));
  var objectKey = {specHash: specHash, propsHash: propsHash};
  return hash(objectKey);
};

var StateSaver = function(data) {
  this.map = new Map(data);
};
StateSaver.prototype.installCaptureHook = function() {
  if(originalRequire === null) {
    originalCreateClassFunction = React.createClass;
    var stateSaver = this;
    var getReplacementGetInitiailStateFunction = function(spec) {
      return function() {
        var state = spec[originalGetInitialStateFunctionSaveKey].apply(this, arguments);
        stateSaver.map.set(HashingHelper.createKey(spec[hashOfPlainOldSpecKey], this.props), state);
        return state;
      }
    };
    React.createClass = function(spec) {
      var hasGetInitialStateFunction = getInitialStateKey in spec;
      if(hasGetInitialStateFunction) {
        spec[hashOfPlainOldSpecKey] = HashingHelper.computeHashOfPlainOldSpec(spec);
        spec[originalGetInitialStateFunctionSaveKey] = spec[getInitialStateKey];
        spec[getInitialStateKey] = getReplacementGetInitiailStateFunction(spec);
      }
      var reactClass = originalCreateClassFunction.apply(React, arguments);
      if(hasGetInitialStateFunction) {
        reactClass[markedKey] = true;
      }
      return reactClass;
    };
    originalRequire = Module.prototype.require;
    Module.prototype.require = function() {
      var potentialReactClass = originalRequire.apply(this, arguments);
      if(potentialReactClass[markedKey]) {
        var spec = potentialReactClass.prototype;
        spec[getInitialStateKey] = getReplacementGetInitiailStateFunction(spec);
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
      var hasGetInitialStateFunction = getInitialStateKey in spec;
      if(hasGetInitialStateFunction) {
        var originalGetInitialStateFunction = spec[getInitialStateKey];
        spec[hashOfPlainOldSpecKey] = HashingHelper.computeHashOfPlainOldSpec(spec);
        spec[getInitialStateKey] = function() {
          var savedState = stateSaver.map.get(HashingHelper.createKey(spec[hashOfPlainOldSpecKey], this.props));
          if(typeof savedState === 'undefined') {
            return originalGetInitialStateFunction.apply(arguments);
          } else {
            return savedState;
          }
        };
      }
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