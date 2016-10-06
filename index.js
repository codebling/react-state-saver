"use strict";
var React = require('react');


var createClass = React.createClass;
React.createClass = function(spec) {
  console.log('creating class!');
  var originalGetInitialState = spec.getInitialState;
  spec.getInitialState = function() {
    console.log('getting state!!');
    return originalGetInitialState.apply(this, arguments);
  };
  return createClass.apply(React, arguments);
};
