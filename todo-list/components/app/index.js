'use strict';
var Willow = require('willow-component');
module.exports = Willow.createClass({
	render: function() {
		var TodoList = this.require.TodoList;
		return <div>
			<TodoList />
		</div>;
	}
})
.require('TodoList', '../todo-list/index.js', 'both');