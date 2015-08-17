'use strict';
var Willow = require('willow-component');
module.exports = Willow.createClass({
	getInitialState: function() {
		return {
			items: []
		};
	},
	componentDidMount: function() {
		this.trigger('initialize')();
	},
	render: function() {
		var TodoInput = this.require.TodoInput;

		var items = this.state.items.map(function(item) {
			return (<div key={item.id}>{item.name}</div>);
		});
		return (
			<div>
				<TodoInput trigger={this.trigger.bind(this)} events={{submit: {sync: true}}} />
				<div>
					{items}
				</div>
			</div>
		);
	}
})
.require('TodoInput', '../todo-input/index.js', 'both')
.require('ItemCollection', '../../collections/ItemCollection.js', 'server')
.on('initialize', {
	name: 'fetch',
	method: 'get',
	dependencies: [],
	run: function(e, resolve, reject) {
		var items = new this.require.ItemCollection();
		items.fetch()
		.then(function(collection) {
			resolve(collection.toJSON());
		})
		.catch(function(err) {
			reject(err);
		});
	}
})
.on('initialize', {
	name: 'update',
	method: 'local',
	dependencies: ['fetch'],
	run: function(e, resolve, reject) {
		console.log(e);
		this.setState({
			items: e.results.fetch
		});
	}
})
.on('submit', {
	name: 'input',
	method: 'local',
	dependencies: [],
	run: function(e, resolve, reject) {
		this.setState(function(previousState, currentProps) {
			console.log(previousState);
			previousState.items.push(e.results.save);
			return {items: previousState.items};
		});
	}
});