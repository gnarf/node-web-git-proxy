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

grunt.registerTask( "cron", [ "update-repo", "check-versions" ]);

};
