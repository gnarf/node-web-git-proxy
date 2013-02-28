var config = require( "./lib/config" ),
	update = require( "./lib/update" ),
	fs = require( "fs" );

module.exports = function( grunt ) {

grunt.loadNpmTasks( "grunt-contrib-jshint" );

grunt.initConfig({
	jshint: {
		all: [ "Gruntfile.js", "lib/**.js" ],
		options: grunt.file.readJSON( ".jshintrc" )
	}
});

grunt.registerTask( "default", [ "jshint", "cron" ] );

grunt.registerTask( "clean", function() {
	var data;
	try {
		data = require( config.output + "/data.json" );
	} catch( e ) {
		console.log( "No data.json found" );
		return;
	}
	Object.keys( data.branches || {} )
		.concat( Object.keys( data.tags || {} ) )
		.forEach(function( directory ) {
			grunt.log.writeln( "Removing " + directory );
			grunt.file["delete"]( config.output + "/" + directory );
		});
	grunt.log.writeln( "Removing data.json" );
	grunt.file["delete"]( config.output + "/data.json" );
});

grunt.registerTask( "update-repo", function() {
	function thenFetch( err ) {
		if ( err ) {
			grunt.verbose.error();
			done( err );
			return;
		}
		grunt.util.spawn({
			cmd: "git",
			args: [ "fetch", "-fup", "origin", "+refs/tags/*:refs/tags/*", "+refs/heads/*:refs/heads/*" ],
			opts: {
				cwd: config.working
			}
		}, function( err, result ) {
			if ( err ) {
				grunt.verbose.error();
				done( err );
				return;
			}

			grunt.log.writeln( result );

			done();
		});
	}
	var done = this.async();
	if ( !fs.existsSync( config.working ) ) {
		grunt.log.writeln( "Cloning " + config.repo + " to " + config.working );

		grunt.util.spawn({
			cmd: "git",
			args: [ "clone", "--bare", config.repo, config.working ]
		}, thenFetch);
	} else {
		grunt.log.writeln( "Fetching updates from " + config.repo );
		grunt.util.spawn({
			cmd: "git",
			args: [ "remote", "set-url", "origin", config.repo ],
			opts: {
				cwd: config.working
			}
		}, thenFetch );


	}
});

grunt.registerTask( "check-versions", function() {
	var done = this.async();
	if ( !fs.existsSync( config.output ) ) {
		grunt.file.mkdir( config.output );
	}
	update( done );
});

grunt.registerTask( "check-config", function() {
	var done = this.async(),
		errors = [];
	if ( !config.repo ) {
		errors.push( "Missing repo in config.json" );
	}
	if ( !config.title ) {
		errors.push( "Missing title in config.json" );
	}
	if ( errors.length ) {
		grunt.verbose.error();
		done( new Error( errors.join(", ") ) );
	} else {
		done();
	}
});

grunt.registerTask( "cron", [ "check-config", "update-repo", "check-versions" ]);

};
