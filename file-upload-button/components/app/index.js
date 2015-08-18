'use strict';
var Willow = require('willow-component');
module.exports = Willow.createClass({
	getInitialState: function() {
		return { fileUrl: false };
	},
	render: function() {
		var FileUpload = this.require.FileUpload;
		var link = false;
		if(this.state.fileUrl) {
			link = <a href={this.state.fileUrl}>Uploaded File</a>;
		}
		return <div>
			<FileUpload events={{'finish-upload': {sync: true}}} trigger={this.trigger.bind(this)} />
			{link}
		</div>;
	}
})
.require('FileUpload', '../file-upload/index.js', 'both')
.on('finish-upload', {
	name: 'create-link',
	method: 'local',
	dependencies: [],
	run: function(e, resolve, reject) {
		this.setState({ fileUrl: e.results.start.url });
	}
});