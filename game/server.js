//
// # Gaming as a service gaming app
//
// This file computes all games currently running on the public gaming server
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
//    If arguments is passed it overides the port aswell the process.env.PORT
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server, {log: false});

router.get('/inGamePlayers', function(request, response) {
	response.setHeader('content-type', 'text/json');
	if(typeof request.query.game == "string") {
		var socketsInGame = findSocketsInGame(request.query.game);
		var socketIdsInGame = [];
		socketsInGame.forEach(function(socket) {
			var sID = socket.sessionId || socket.id;
			socketIdsInGame.push(gameInstances[sID].userName);
		});
		response.end(JSON.stringify({players: socketIdsInGame, gameId: request.query.game}));
	}
	else response.end("{players:[], gameId: -1}");
});
router.use(express.static(path.resolve(__dirname, 'client')));
var gameInstances = {};
var sockets = [];
var socketCount = 0;

io.on('connection', function (socket) {
	if(sockets.length > 4) {
		// To much load on the server! TODO: Maybe send a message to the client
		socket.disconnect();
	}
	var gameIdentifier = socket.handshake.query.game;
	var watchGameId = socket.handshake.query.watch;
	if(typeof watchGameId == "string" && watchGameId.length > 0) {
		var socketToWatch = findSocket(watchGameId);
		if(typeof socketToWatch == "object") {
			var sID = socketToWatch.sessionId || socketToWatch.id;
			gameInstances[sID].watchers.push(socket);
			sockets.push(socket);
			socket.on('disconnect', function() {
				gameInstances[sID].watchers.splice(gameInstances[sID].watchers.indexOf(socket),1);
				sockets.splice(sockets.indexOf(socket), 1);
			});
			setUpWatchListeners(socket, gameInstances[sID]);
			return;
		}
		else {
			socket.disconnect();
			return;
		}
	}
	if(typeof gameIdentifier == "undefined") {
		
		socket.disconnect();
		return;
	}
	else if(!isNaN(gameIdentifier)) gameIdentifier = Math.floor(gameIdentifier);
	
	var gameInstance = {watchers:[]};
	try {
		var sID = socket.sessionId || socket.id;
		Game.createNewGame(gameIdentifier, function (g) {
			gameInstance = g;
			gameInstance.watchers = [];
			gameInstance.userName = "User " + (++socketCount);
			gameInstances[sID] = gameInstance;
			gameInstance.on('update', function (delta, canvasData) {
				if(canvasData !== null) { // TODO: implement streaming content
					var ctx = canvasData.getContext("2d");
					ctx.fillStyle = "rgba(0,0,0,0.3)";
					ctx.fillText(gameInstance.userName, 0, canvasData.height);
					var data = canvasData.toDataURL();
					socket.emit('image', {data: data});
					for(var i = 0; i < gameInstances[sID].watchers.length; i++)
						gameInstances[sID].watchers[i].emit('image', {data: data});
				}
			});
			var ctrls = Game.getControls(gameIdentifier);
			// console.log(ctrls);
			socket.emit('controls', {
				kb: ctrls.keyboardEvents, 
				mouse: ctrls.mouseEvents
			});
			
			socket.on('disconnect', function () {
				if(typeof gameInstance == "object") {
					if(gameInstance.userName.split(" ")[1] >= socketCount)
						socketCount--;
					if(sockets.length <= 1) 
						socketCount = 0;
					if(typeof gameInstance.stopGame == "function")
						gameInstance.stopGame(socket.sessionId || socket.id);
					gameInstances[socket.sessionId || socket.id] = undefined;
					//gameInstances.splice(gameInstances.indexOf(gameInstance), 1);
				}
				sockets.splice(sockets.indexOf(socket), 1);
				//updateRoster();
			});
		
			socket.on('identify', function (name) {
				for(var i in gameInstances) 
					if(gameInstances[i] != undefined && gameInstances[i].userName == name)
						name = gameInstance.userName;
				gameInstance.userName = name;
				socket.emit('identify', {name: name, count: gameInstance.watchers.length});
				broadcast('roster', {name: name, count: gameInstance.watchers.length}, gameInstance.watchers);
				// socket.set('name', String(name || 'Anonymous'), function (err) {
				// 	updateRoster();
				// });
			});
			setUpWatchListeners(socket, gameInstance);
			setUpGameListeners(socket, gameInstance);
		}).startGame(sID);
	} catch(e) {
		console.log("User tryed to access a game that yet not exists: " + gameIdentifier);
		socket.disconnect();
	}
	// Loading screen...
	socket.emit('image', {data: canvasStream.render()});
	sockets.push(socket);

});
function findSocketsInGame(gameId) {
	var s = [];
	sockets.forEach(function(socket) {
		if(socket !== undefined && (gameInstances[socket.sessionId || socket.id].id == gameId))
			s.push(socket);
	});
	return s;
}
function findSocket(id) {
	var s = null;
	sockets.forEach(function(socket) {
		var sID = socket.sessionId || socket.id;
		if(gameInstances[sID].userName == id)//socket.id == id || socket.sessionId == id)
			s = socket;
	});
	return s;
}
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

function broadcast(event, data, scope) {
	if(!(scope instanceof Array))
		scope = sockets;
	scope.forEach(function (socket) {
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
function setUpWatchListeners(socket, gameInstance) {
	socket.on('watchers', function() {
		var users = [];
		gameInstance.watchers.forEach(function(socket) {
			users.push(gameInstances[socket.sessionId || socket.id].userName);
		});
		socket.emit('watchers', {myUser: gameInstance.userName, users: users.length});
	});
}


server.listen(process.argv[2] || process.env.PORT || 3000, process.argv[3] || process.env.IP || "0.0.0.0", function(){
	var addr = server.address();
	console.log("Gaas game server listening at", addr.address + ":" + addr.port);
});