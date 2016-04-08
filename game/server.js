//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var gaas = require("gaas");
var canvasStream = gaas.stream;
var Game = gaas.Game;
Game.getGamesDataFromFile(__dirname + "/client/game-meta.json");

//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server, {log: false});

router.use(express.static(path.resolve(__dirname, 'client')));
var gameInstances = [];
var sockets = [];


io.on('connection', function (socket) {
	var gameSlug = socket.handshake.query.game;
	if(typeof gameSlug == "undefined") {
		
		socket.disconnect();
		return;
	}
	var gameInstance = null;
	try {
		Game.createNewGame({slug: gameSlug}, function (g) {
			gameInstance = g;
			gameInstances.push(gameInstance);
			gameInstance.on('update', function (delta, canvasData) {
				if(canvasData !== null) // TODO: implement streaming content
					socket.emit('image', {data: canvasData});
			});
			var ctrls = Game.getControls(gameSlug);
			// console.log(ctrls);
			socket.emit('controls', {
				kb: ctrls.keyboardEvents, 
				mouse: ctrls.mouseEvents
			});
			setUpGameListeners(socket, gameInstance);
		}).startGame(socket.sessionId || socket.id);
	} catch(e) {
		console.log("User tryed to access a game that yet not exists: " + gameSlug);
		socket.disconnect();
	}
	// Loading screen...
	socket.emit('image', {data: canvasStream.render()});
	sockets.push(socket);


	socket.on('disconnect', function () {
		if(typeof gameInstance == "object") {
			if(typeof gameInstance.stopGame == "function")
				gameInstance.stopGame(socket.sessionId || socket.id);
			gameInstances.splice(gameInstances.indexOf(gameInstance), 1);
		}
		sockets.splice(sockets.indexOf(socket), 1);
		//updateRoster();
	});

	socket.on('identify', function (name) {
		// socket.set('name', String(name || 'Anonymous'), function (err) {
		// 	updateRoster();
		// });
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
function setUpGameListeners(socket, gameInstance) {
	
	// Game events
	// var keyEvents = ['keydown', 'keyup', 'keypress'];
	socket.on('keydown', function(event) {
	   if(typeof gameInstance == "object")
		   gameInstance.do(socket.sessionId || socket.id, {
				type: event.type, 
				keyCode: event.keyCode, 
				preventDefault:function(){}
		   });
	});
	socket.on('keyup', function(event) {
	   if(typeof gameInstance == "object")
		   gameInstance.do(socket.sessionId || socket.id, {
		    	type: event.type, 
		    	keyCode: event.keyCode, 
		    	preventDefault:function(){}
		   });
	});
	socket.on('keypress', function(event) {
	   if(typeof gameInstance == "object")
		   gameInstance.do(socket.sessionId || socket.id, {
		    	type: event.type, 
		    	keyCode: event.keyCode, 
		    	preventDefault:function(){}
		   });
	});
	socket.on('mousemove', function(event) {
	    if(typeof gameInstance == "object")
		    gameInstance.do(socket.sessionId || socket.id, event);
	});
	socket.on('mouseup', function(event) {
	    if(typeof gameInstance == "object")
		    gameInstance.do(socket.sessionId || socket.id, event);
	});
	socket.on('mousedown', function(event) {
	    if(typeof gameInstance == "object")
		    gameInstance.do(socket.sessionId || socket.id, event);
	});
	socket.on('click', function(event) {
	    if(typeof gameInstance == "object")
		    gameInstance.do(socket.sessionId || socket.id, event);
	});
}

server.listen(process.argv[2] || process.env.PORT || 3000, process.argv[3] || process.env.IP || "0.0.0.0", function(){
	var addr = server.address();
	console.log("Gaas game server listening at", addr.address + ":" + addr.port);
});