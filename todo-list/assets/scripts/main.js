var React = require('react');
window.fd = {logging: false}; // Turn off FileDrop logging
var AppComponent = require('./components/app');
React.render(<AppComponent />, document.getElementById('app'));