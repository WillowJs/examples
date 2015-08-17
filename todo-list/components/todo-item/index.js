'use strict';
var Willow = require('willow-component');
module.exports = Willow.createClass({
	render: function() {
		return (
			<div>
				<div>{this.props.item.name}</div>
			</div>
		);
	}
});