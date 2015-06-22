var app = require( "express" )();
var http = require( "http" ).Server( app );
var io = require( "socket.io" )( http );

app.get( '/', function( req, res ) {
	res.sendFile( __dirname + "/index.htm" );
} );
app.get( '/css/*', function( req, res ) {
	res.sendFile( __dirname + req.url );
} );
app.get( '/*', function( req, res ) { // If there's an extension, send them the room page (todo: format it for their video?)
	res.sendFile( __dirname + "/room.htm" );
} );

http.listen( 80, function() {
	console.log( "popcornwith.me listening on *:80." );
} );

var curVid = { };
var playTime = { };

io.on( "connection", function( socket ) {
	socket.on( "disconnect", function( socket ) {
		//console.log( "User disconnected." );
	} );
	
	socket.on( "setRoom", function( data ) {
		socket.join( data, function() {
			console.log( "Joining room " + data );
			if( playTime[data] == null ) {
				playTime[data] = 0;
				curVid[data] = "N1uiLR6luWo";
			}
			
			socket.emit( "loadVideo", { vid: curVid[data], time: playTime[data] } );
		} );
	} );
	
	socket.on( "new", function( data ) {
		var room = socket.rooms[0];
		
		// Get video ID
		var id = data.split( "v=" )[1];
		var aP = id.indexOf( "&" );
		if( aP != -1 ) {
			id = id.substring( 0, aP );
		}
		
		curVid[room] = id;
		playTime[room] = 0;
		
		io.to( room ).emit( "loadVideo", { vid: curVid[room], time: playTime[room] } );
	} );
} );

var interval = setInterval( function() { // Update position if out of sync
	for( var i in playTime ) {
		playTime[i]++;
		io.to( i ).emit( "updatePosition", playTime[i] );
	}
}, 1000 );