//
// # Gaming as a service directory app
//
// This file list all games available to the public gaming server
//

if(process.argv.length < 3) {
	console.log("You need to specify the path (ip and port number) to the game server as an argument.");
	process.exit(1);
}

var http = require('http');
var request = require("request");
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var fs = require("fs");

//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server, {log: false});
router.get('/', function(request, response, next) {
    // Website you wish to allow to connect
   response.header('Access-Control-Allow-Origin', '*');//'http://' + process.argv[2]);
    // Request methods you wish to allow
   response.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
   // Headers of the request you want to allow
   response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding, Accept-Language, Connection, Host, Referer, User-Agent');
   next();
});
router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];

io.on('connection', function (socket) {
	sockets.push(socket);
	
	socket.on('directory', function() {
		try {
			var ip = process.argv[2];
			var url = "http://" + ip + "/game-meta.json";
			console.log(url);
			request({
			    url: url,
			    json: true,
			}, function (error, response, gameMeta) {
			    if (!error && response.statusCode === 200) {
			    	if(typeof gameMeta.gameIp == "string" && gameMeta.gameIp != process.argv[2])
			    		console.warn("The ip set in init of this server does not match the one in game-meta.json file. Continue using " + process.argv[2]);
			    	gameMeta.gameIp = process.argv[2];
		    		socket.emit('directory', gameMeta);
		    		//JSON.parse(fs.readFileSync(__dirname + '/server/game-meta.json', 'utf8')));
			    }
			    else {
			    	console.error(error);
			    	if(response !== null)
			    		console.error(response.statusCode);
					socket.emit('directory', {"games" : [{name: "Sorry, no games available right now."}]});
			    }
			})
		} catch(e) {
			socket.emit('directory', {"games" : [{name: "Sorry, no games available right now."}]});
		}
	});

	socket.on('disconnect', function () {
		sockets.splice(sockets.indexOf(socket), 1);
		//	updateRoster();
	});

	//socket.on('identify', function (name) {
	//	socket.set('name', String(name || 'Anonymous'), function (err) {
	//		updateRoster();
	//	});
	//});
});

function updateRoster() {
	async.map(
		sockets,
		function (socket, callback) {
			socket.get('name', callback);
		},
		function (err, names) {
			broadcast('roster', names);
		}
	);
}

function broadcast(event, data) {
	sockets.forEach(function (socket) {
		socket.emit(event, data);
	});
}

server.listen(process.argv[3] || process.env.PORT || 3000, process.argv[4] || process.env.IP || "0.0.0.0", function(){
	var addr = server.address();
	console.log("Gaas directory server listening at", addr.address + ":" + addr.port);
});