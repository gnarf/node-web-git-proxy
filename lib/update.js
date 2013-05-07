var _ = require( "underscore" ),
	async = require( "async" ),
	config = require( "./config" ),
	grunt = require( "grunt" ),
	fs = require( "fs" ),
	Repo = require( "git-tools" ),
	buildCommand = fs.existsSync( config.buildCommand );

function removeDirectory( directory ) {
	console.log( "Removing", directory );
	grunt.file["delete"]( directory, { force: true });
}

function generateUpdateFunction( repo, directory, sha, ref ) {
	var realDirectory = config.output + "/" + directory;

	grunt.file.mkdir( realDirectory );
	return function( callback ) {
		console.log( "Archiving " + sha + " to " + realDirectory + " on ref " + ref );
		grunt.util.spawn({
			cmd: __dirname + "/export-sha.sh",
			args: [ sha, realDirectory, ref ],
			opts: { cwd: config.working }
		}, function( err ) {
			if ( err ) {
				console.log( "There was an error exporting the SHA:\n" + err );
				return callback( err );
			}
			if ( buildCommand ) {
				console.log( "Running build command" );
				grunt.util.spawn({
					cmd: config.buildCommand,
					args: [ directory, sha, ref ],
					opts: { stdio: "inherit", cwd: realDirectory }
				}, function() {
					// swallow error from build
					callback();
				});
			} else {
				callback();
			}
		});
	};
}

module.exports = function( callback ) {
	var lastrun,
		thisrun = {
			repo: config.repo,
			title: config.title
		},
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
		if( config.deleteTags ) {
			clean = _.difference( _.keys( lastrun.tags ), _.keys( thisrun.tags ) );

			clean.forEach(function( tag ) {
				console.log( "Removing unused directory for tag " + tag );
				removeDirectory( config.output + "/" + tag );
			});
		}
		async.series( _.map( tags, function( tag ) {
			if ( lastrun.tags[ tag.name ] &&
				lastrun.tags[ tag.name ].sha === tag.sha ) {
				return function( callback ) {
					console.log( "Skipping " + tag.name + " @ " + tag.sha );
					callback();
				};
			}
			return function( callback ) {
				generateUpdateFunction( repo, tag.name, tag.sha, "refs/tags/" + tag.name )( function( err ) {
					if ( err ) {
						delete thisrun.tags[ tag.name ];
						return callback();
					}
					callback.apply( this, arguments );
				});
			};
		}), callback );
	}, function( results, callback ) {
		repo.branches( callback );
	}, function( branches, callback ) {
		var clean;

		thisrun.branches = {};
		_.each( branches, function( branch ) {
			thisrun.branches[ branch.name ] = branch;
		});
		clean = _.difference( _.keys( lastrun.branches ), _.keys( thisrun.branches ) );

		clean.forEach(function( branch ) {
			console.log( "Removing unused directory for branch " + branch );
			removeDirectory( config.output + "/" + branch );
		});
		async.series( _.map( branches, function( branch ) {
			if ( lastrun.branches[ branch.name ] &&
				lastrun.branches[ branch.name ].sha === branch.sha ) {
				return function( callback ) {
					console.log( "Skipping " + branch.name + " @ " + branch.sha );
					callback();
				};
			}
			return function( callback ) {
				generateUpdateFunction( repo, branch.name, branch.sha, "refs/heads/" + branch.name )( function( err ) {
					if ( err ) {
						delete thisrun.branches[ branch.name ];
						return callback();
					}
					callback.apply( this, arguments );
				});
			};
		}), callback );

	}, function( results, callback ) {
		grunt.file.write( config.output + "/data.json", JSON.stringify( thisrun ) );
		callback();
	}], callback);

};
