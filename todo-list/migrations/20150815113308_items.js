'use strict';
exports.up = function(knex, Promise) {
	return knex.schema.createTable('items', function(table) {
		table.increments('id').primary();
		table.string('name');
		table.boolean('completed');
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('items');
};
