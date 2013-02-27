var path = require( "path" ),
	config = require( "../config" );

function resolvePath( key, _default ) {
	config[ key ] = path.resolve( __dirname, "..", config[ key ] || _default );
}

resolvePath( "output", "public_html" );
resolvePath( "working", "repo.git" );

module.exports = config;
