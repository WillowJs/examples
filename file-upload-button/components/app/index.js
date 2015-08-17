'use strict';
var Willow = require('willow-component');
module.exports = Willow.createClass({
	render: function() {
		var FileUpload = this.require.FileUpload;
		return <div>
			<FileUpload />
		</div>;
	}
})
.require('FileUpload', '../file-upload/index.js', 'both');