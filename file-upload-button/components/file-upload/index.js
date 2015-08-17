'use strict';
/*global FileDrop*/
var Willow = require('willow-component');
module.exports = Willow.createClass({
	componentWillMount: function() {
		this.startTime = null;
	},
	componentDidMount: function() {
		this.uploadZone = new FileDrop(this.refs.uploadButton.getDOMNode(), {});
		var self = this;
		this.uploadZone.event('send', self.trigger('choose-file'));
	},
	getInitialState: function() {
		return {
			display: 'block'
		};
	},
	render: function() {
		var style = {
			display: this.state.display
		};
		return (
			<div>
				<div style={style}>this is some text</div>
				<button className="file-upload" ref="uploadButton">test</button>;
			</div>
		);
	}
})
.require('filedrop', 'filedrop', 'client')
.require('aws', 'aws-sdk', 'server')
.require('uuid', 'uuid', 'server')
.require('path', 'path', 'server')
.config('aws', require('../../config/aws'), 'server')
.on('choose-file', {
	name: 'start',
	method: 'local',
	dependencies: [],
	run: function(e, resolve, reject) {
		if(!e.length) {
			reject('no file was selected');
		}
		else {
			e[0].event('done', function(xhr) {
				resolve(xhr);
			});
			e[0].event('error', function(err) {
				reject(err);
			});
			e[0].sendTo('/component/file-upload/upload-file/process?name='+encodeURIComponent(e[0].name));
		}
	}
})
.on('upload-file', {
	name: 'process',
	method: 'post',
	dependencies: [],
	run: function(e, resolve, reject) {
		var ext = this.require.path.extname(e.name);
		var s3 = new this.require.aws.S3({
			accessKeyId: this.config.aws.accessKeyId,
			secretAccessKey: this.config.aws.secretAccessKey
		});
		var params = {Bucket: this.config.aws.bucket, Key: this.require.uuid.v4()+ext, Body: e.parent};
		var options = {partSize: 10 * 1024 * 1024, queueSize: 1};
		s3.upload(params, options, function(err, data) {
			if(err) {
				reject({
					message: err.message,
					params: {},
					status: err.statusCode,
					id: err.code
				});
			}
			else {
				resolve({
					url: data.Location
				});
			}
		});
	}
});