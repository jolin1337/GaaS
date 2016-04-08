//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
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

io.on('connection', function (socket) {
	sockets.push(socket);
	
	socket.on('directory', function() {
		try {

			var url = "http://" + process.argv[2] + "/game-meta.json";
			
			request({
			    url: url,
			    json: true
			}, function (error, response, gameMeta) {
			    if (!error && response.statusCode === 200) {
		    		socket.emit('directory', gameMeta);
		    		//JSON.parse(fs.readFileSync(__dirname + '/server/game-meta.json', 'utf8')));
			    }
			    else 
					socket.emit('directory', {"games" : []});
			})
		} catch(e) {
			socket.emit('directory', {"games" : []});
		}
	});

	socket.on('disconnect', function () {
		sockets.splice(sockets.indexOf(socket), 1);
		updateRoster();
	});

	socket.on('identify', function (name) {
		socket.set('name', String(name || 'Anonymous'), function (err) {
			updateRoster();
		});
	});
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