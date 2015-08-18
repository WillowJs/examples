'use strict';
var Willow = require('willow-component');
module.exports = Willow.createClass({
	getInitialState: function() {
		return {
			formName: 'form123'
		};
	},
	componentWillMount: function() {
		this.startTime = null;
	},
	componentDidMount: function() {
		this.refs.form.getDOMNode().target = this.state.formName;
	},
	render: function() {
		var style = {
			cursor: 'pointer',
			display: 'inline-block',
			color: '#fff',
			fontSize: '16px',
			textTransform: 'uppercase',
			padding: '11px 20px',
			border: 'none',
			marginLeft: '-1px',
			backgroundColor: '#962d22',
			transition: 'all 0.2s ease-in'
		};
		return (
			<label style={style}>
				<iframe ref="iframe" style={{display: 'none'}} onLoad={this.trigger('finish-upload')} name={this.state.formName} />
				<form ref="form" encType="multipart/form-data" action="/component/file-upload/upload/save" method="post">
					<input type="file" name="file" ref="file" style={{display: 'none'}} onChange={this.trigger('upload')} />
				</form>
				Upload File
			</label>
		);
	}
})
.require('Busboy', 'busboy', 'server')
.require('uuid', 'uuid', 'server')
.require('path', 'path', 'server')
.require('aws', 'aws-sdk', 'server')
.config('aws', require('../../config/aws'), 'server')
.on('upload', {
	name: 'start',
	method: 'local',
	dependencies: [],
	run: function(e, resolve, reject) {
		if(!this.refs.file.getDOMNode().value) {
			return reject({
				message: 'No file was selected.',
				params: {},
				status: 400,
				id: 'NOFILE'
			});
		}

		this.refs.form.getDOMNode().submit();
	}
})
.on('upload', {
	name: 'save',
	method: 'post',
	dependencies: ['start'],
	run: function(e, resolve, reject) {
		var s3 = new this.require.aws.S3({
			accessKeyId: this.config.aws.accessKeyId,
			secretAccessKey: this.config.aws.secretAccessKey
		});
		var busboy = new this.require.Busboy({headers: e.req.headers });
		var self = this;

		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			var ext = self.require.path.extname(e.name);
			var params = {
				Bucket: self.config.aws.bucket,
				Key: self.require.uuid.v4()+ext,
				Body: file,
				ACL: self.config.aws.acl,
				ContentType: mimetype
			};
			var options = {
				partSize: 10 * 1024 * 1024,
				queueSize: 1
			};

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
		});
		e.req.pipe(busboy);
	}
})
.on('finish-upload', {
	name: 'start',
	method: 'local',
	dependencies: [],
	run: function(e, resolve, reject) {
		// Grab contents of iframe to get result
		var iframe = this.refs.iframe.getDOMNode();
		var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

		// Strip tags so that we're just left with JSON
		var response = JSON.parse(iframeDocument.body.innerHTML.replace(/(<([^>]+)>)/ig, ''));

		resolve(response);
	}
});