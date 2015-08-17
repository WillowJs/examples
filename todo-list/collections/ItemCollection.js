'use strict';
var Bookshelf = require('../models/bookshelf');
var Item = require('../models/Item');
module.exports = Bookshelf.Collection.extend({
	model: Item
});