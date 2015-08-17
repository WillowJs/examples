'use strict';

var gulp = require('gulp');
var fs = require('fs');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');
var watchify = require('watchify');
var browserify = require('browserify');
var babelify = require('babelify');
var gutil = require('gutil');
var assign = require('lodash.assign');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var _ = require('lodash');
var context = require('willow-context');
var ncp = require('ncp').ncp;
ncp.limit = 16;
var spawn = require('child_process').spawn;
var uglify = require('gulp-uglify');
var server = null;
var serverRunning = false;


/*
 * BROWSERIFY
 */
// add custom browserify options here
var customOpts = {
	entries: ['./assets/scripts/main.js'],
	debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts).transform(babelify));

b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

/*
 * SHARED TASKS
 */
gulp.task('client-components', function(next) {
	console.log('client-components');
	var componentsDir = './components';

	async.auto({
		mkdir: [function(cb) {
			mkdirp('./assets/scripts/components', cb);
		}],
		read: [function(cb) {
			fs.readdir(componentsDir, cb);
		}],
		filter: ['read', function(cb, data) {
			async.filter(data.read, function(file, cb1) {
				fs.stat(path.join(componentsDir, file), function(err, stat) {
					if(err) {
						return cb(false);
					}
					cb1(stat.isDirectory());
				});
			}, function(data1) {
				cb(null, data1);
			});
		}],
		copy: ['mkdir', 'filter', function(cb, data) {
			require('node-jsx').install();

			async.each(data.filter, function(file, cb1) {
				var p = path.join(componentsDir, file);
				if(p.charAt(0) !== '/' && p.charAt(0) !== '.') {
					p = './' + p;
				}
				var dir = path.join('./assets/scripts/components', file);
				mkdirp(dir, function(err, data2) {
					ncp(p, dir, function(err2) {
						if (err2) {
							return console.error(err);
						}
						cb1();
					});
				});
			}, cb);
		}],
		write: ['copy', function(cb, data) {
			require('node-jsx').install();
			async.each(data.filter, function(file, cb1) {
				var p = path.join(componentsDir, file);
				if(p.charAt(0) !== '/' && p.charAt(0) !== '.') {
					p = './' + p;
				}
				delete require.cache[require.resolve(p)];
				var comp = require(p);
				var f = genCompClientFile(comp, file);
				mkdirp(path.join('./assets/scripts/components', file), function(err, data2) {
					fs.writeFile(
						path.join('./assets/scripts/components', file, 'index.js'),
						f,
						function() {
							cb1();
						}
					);
				});
			}, cb);
		}]
	}, next);
});

function genCompClientFile(comp, name) {
	var contextObj = comp.prototype._willow.getContext();
	var requires = context(contextObj.requires, 'client');
	var config = context(contextObj.config, 'client');
	var file = '\'use strict\';\n';
	file += 'var React = require(\'react\');\n';
	file += 'var Willow = require(\'willow-component\');\n';
	file += 'var ajax = require(\'component-ajax\');\n';
	file += 'var compJson = '+componentToString(comp, name)+';\n';
	file += 'var Component = Willow.createClass(compJson.contents);\n';
	file += 'var state = Component.prototype._willow;\n';
	file += 'var requires = {};\n';

	for(var i in requires) {
		file += 'requires[\''+i+'\'] = require(\''+requires[i]+'\');\n';
	}

	file += 'if(compJson.metadata) state.setMetadata(compJson.metadata);\n';
	file += 'state.setEvents(compJson.events);\n';
	file += 'state.setRequires(requires);\n';
	file += 'state.setConfig('+JSON.stringify(config)+');\n';
	file += 'module.exports = Component;\n';
	return file;
}

function componentToString(comp, name) {
	var state = comp.prototype._willow;
	function recurse(target, tabs) {
		tabs = tabs || 0;
		if(_.isFunction(target)) {
			return target.toString();
		}
		else if(_.isArray(target)) {
			var pieces = [];
			for(var i=0; i < target.length; i++) {
				pieces.push(recurse(target[i], tabs+1));
			}
			return '['+pieces.join(',')+']';
		}
		else if(_.isObject(target)) {
			var result = '{\n';
			var count = 0;
			for(var j in target) {
				count++;
				result += _.repeat('\t', tabs)+'\''+j+'\': ' + recurse(target[j], tabs+1)+',';
			}
			if(count) {
				result = result.substring(0, result.length-1);
			}
			result += '}';
			return result;
		}
		else if(_.isString(target)) {
			return '"'+target.toString()+'"';
		}
		else {
			return target.toString();
		}
	}


	var results = '{\n';

	// Contents
	results += '\tcontents: ' + recurse(state.getContents(), 2)+'\n';

	// Events
	var events = state.getEvents();
	results += ', events: ';
	var eventPieces = [];
	for(var i in events) {
		var handlerPieces = [];
		for(var j in events[i]) {
			if(events[i][j].method.toLowerCase() !== 'local') {
				handlerPieces.push('\''+j+'\': {\n\
					name: \''+events[i][j].name+'\',\n\
					method: \''+events[i][j].method+'\',\n\
					dependencies: '+JSON.stringify(events[i][j].dependencies)+',\n\
					run: function(e, resolve, reject) {\n\
						ajax({\n\
							url: \'/component/'+name+'/'+i+'/'+events[i][j].name+'\',\n\
							type: \''+events[i][j].method+'\',\n\
							dataType: \'json\',\n\
							data: e.results,\n\
							success: function(r) {\n\
								resolve(r);\n\
							},\
							error: function(r) {\n\
								reject(JSON.parse(r.responseText));\n\
							}\n\
						});\n\
					}\n\
				}');
			}
			else {
				handlerPieces.push('\''+j+'\': ' + recurse(events[i][j]));
			}
		}
		eventPieces.push('\''+i+'\': {'+handlerPieces.join(',') + '}');
	}

	// Metadata
	var metadata = state.getMetadata();

	results += '{' + eventPieces.join(',') + '}, metadata: ';
	results += metadata ? metadata.toString() : 'undefined';
	results += '}';

	return results;
}

gulp.task('bundle', bundle);

function bundle() {
	b.bundle()
	.on('error', function(e) {
		gutil.log('Browserify Error', e);
	})
	.pipe(source('./assets/scripts/main.js'))
	.pipe(buffer())
	.pipe(sourcemaps.init({
		loadMaps: true
	})) // loads map from browserify file
	.pipe(sourcemaps.write()) // writes .map file
	.pipe(rename('bundle.js'))
	.pipe(gulp.dest('./assets/scripts'));
}

gulp.task('jsmin', function() {
	return gulp.src('assets/scripts/bundle.js')
	.pipe(uglify())
	.pipe(rename('bundle.min.js'))
	.pipe(gulp.dest('assets/scripts'));
});

gulp.task('serve', ['client-components', 'bundle', 'server', 'watch']);

gulp.task('build', ['client-components', 'bundle', 'jsmin']);

gulp.task('watch', function() {
	gulp.watch(
		[ 'components/**/*.js' ],
		[ 'client-components', 'server' ]
	);
});

gulp.task('server', function() {
	function startServer() {
		if(server && serverRunning) {
			console.log('Stopping server...');
			server.kill();
		}
		else {
			console.log('Starting server...');
			var env = Object.create(process.env);
			env.NODE_ENV = 'development';
			server = spawn('node', ['index'], { env: env });
			serverRunning = true;
			server.on('close', function(code) {
				console.log('Server closed with code ['+code+']');
				serverRunning = false;
				startServer();
			});
			server.on('error', function(err) {
				console.log(err);
			});
			server.stdout.on('data', function(data) {
				console.log(data.toString());
			});
			server.stderr.on('data', function(data) {
				console.log(data.toString());
			});
		}
	}

	startServer();
});