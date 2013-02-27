var _ = require( "underscore" ),
	async = require( "async" ),
	config = require( "./config" ),
	grunt = require( "grunt" ),
	fs = require( "fs" ),
	Repo = require( "git-tools" );

function removeDirectory( directory ) {
	console.log( "Removing", directory );
	grunt.file["delete"]( directory, { force: true });
}

function generateUpdateFunction( repo, directory, sha ) {
	var realDirectory = config.working + "/" + directory;
	if ( !fs.existsSync( realDirectory ) ) {
		grunt.file.mkdir( realDirectory );
	}
	return function( callback ) {
		console.log( "Archiving " + sha + " to " + directory );
		grunt.util.spawn({
			cmd: __dirname + "/export-sha.sh",
			args: [ sha, realDirectory ],
			cwd: config.working
		}, callback );
	};
}

module.exports = function( callback ) {
	var lastrun,
		thisrun = {},
		repo = new Repo( config.working );

	try {
		lastrun = require( config.output + "/data.json" );
	} catch (e) {
		lastrun = {};
	}

	lastrun.branches = lastrun.branches || {};
	lastrun.tags = lastrun.tags || {};

	async.waterfall([function( callback ) {
		repo.tags( callback );
	}, function( tags, callback ) {
		var clean;

		thisrun.tags = {};
		_.each( tags, function( tag ) {
			thisrun.tags[ tag.name ] = tag;
		});

		clean = _.difference( _.keys( lastrun.tags || {} ), _.keys( thisrun.tags ) );

		clean.forEach(function( tag ) {
			console.log( "Removing unused directory for tag " + tag );
			removeDirectory( config.output + "/" + tag );
		});
		async.series( _.map( tags, function( tag ) {
			if ( lastrun.tags[ tag.name ] && lastrun.tags[ tag.name ].sha === tag.sha ) {
				return function( callback ) {
					console.log( "Skipping " + tag.name + " @ " + tag.sha );
					callback();
				};
			}
			return generateUpdateFunction( repo, tag.name, tag.sha );
		}), callback );
	}, function( results, callback ) {
		repo.branches( callback );
	}, function( branches, callback ) {
		var clean;

		thisrun.branches = {};
		_.each( branches, function( branch ) {
			thisrun.branches[ branch.name ] = branch;
		});
		clean = _.difference( _.keys( lastrun.branches || {} ), _.keys( thisrun.branches ) );

		clean.forEach(function( branch ) {
			console.log( "Removing unused directory for branch " + branch );
			removeDirectory( config.output + "/" + branch );
		});
		async.series( _.map( branches, function( branch ) {
			if ( lastrun.branches[ branch.name ] && lastrun.branches[ branch.name ].sha === branch.sha ) {
				return function( callback ) {
					console.log( "Skipping " + branch.name + " @ " + branch.sha );
					callback();
				};
			}
			return generateUpdateFunction( repo, branch.name, branch.sha );
		}), callback );

	}, function( results, callback ) {
		grunt.file.write( config.output + "/data.json", JSON.stringify( thisrun ) );
		callback();
	}], callback);

};
