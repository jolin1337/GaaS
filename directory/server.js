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
router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];

function getFromGameServer(file, callback, failCallback) {
	var ip = process.argv[2];
	var url = "http://" + ip + '/' + file;
	request({
	    url: url,
	    json: true,
	}, function (error, response, data) {
	    if (!error && response.statusCode === 200) {
	    	callback(response, data);
	    }
	    else {
	    	console.error(error);
	    	if(response !== null)
	    		console.error(response.statusCode);
	    	else response = undefined;
	    	failCallback(error, response);
	    }
	});
}

io.on('connection', function (socket) {
	sockets.push(socket);
	
	socket.on('directory', function() {
		getFromGameServer('game-meta.json', function(response, gameMeta) {
	    	if(typeof gameMeta.gameIp == "string" && gameMeta.gameIp != process.argv[2])
	    		console.warn("The ip set in init of this server does not match the one in game-meta.json file. Continue using " + process.argv[2]);
	    	gameMeta.gameIp = process.argv[2];
    		socket.emit('directory', gameMeta);
    		//JSON.parse(fs.readFileSync(__dirname + '/server/game-meta.json', 'utf8')));
		}, function(error, response) {
			socket.emit('directory', {"games" : [{name: "Sorry, no games available right now."}]});
		});
	});
	socket.on('playersOf', function(gameId) {
		getFromGameServer('inGamePlayers?game=' + gameId, function(response, playerList) {
			socket.emit('playerList', playerList);
		}, function() {
			socket.emit('playerList', {players:[], gameId: -1});
		});
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