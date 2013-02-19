// var config = require( "./lib/config" );

module.exports = function( grunt ) {

grunt.initConfig({
	lint: {
		grunt: "grunt.js",
		src: [ "lib/**", "scripts/**" ]
	},
	jshint: {
		grunt: { options: grunt.file.readJSON( ".jshintrc" ) },
		src: { options: grunt.file.readJSON( ".jshintrc" ) }
	},
	test: {
		files: [ "test/**/*.js" ]
	}
});

grunt.registerTask( "default", "lint" );

};
