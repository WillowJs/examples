'use strict';
var path = require('path');
var WillowServer = require('willow-server');
// var bodyParser = require('body-parser');
var App = require('./components/app');
var express = require('willow-server/node_modules/express');

new WillowServer({
	componentNamespace: 'component',
	componentDir: path.join(__dirname, './components'),
	port: 3000,
	app: App,
	beforeMiddleware: [
		express.static('assets'),
		// bodyParser.json(),
		// bodyParser.urlencoded({ extended: false }),
		// busboy()
		// bodyParser.raw({limit: '50mb'})
	]
});