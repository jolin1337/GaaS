
function GaaSController($scope) {
	var socket = io.connect(window.location.origin, { /* Parameters sent in the connection phase here */ });
	
	function getGame(gameId) {
		for(var i = 0; i < $scope.games.length; i++)
			if($scope.games[i].id == gameId)
				return $scope.games[i];
		return gameId;
	}
	
	$scope.games = [{name: "Loading..."}];
	socket.on('directory', function (games) {
		$scope.ip = games.gameIp;
	    $scope.games = games.games;
		$scope.$apply();
		$('.carousel-indicators li:first-child').addClass('active');
		$('.carousel-inner .item:first-child').addClass('active');
	});
	socket.on('addGame', function (gameObject) {
		$scope.games.push(gameObject);
		$scope.$apply();
	});
	socket.on('removeGame', function (gameId) {
		for(var i = 0; i < $scope.games.length; i++)
			if($scope.games[i].id == gameId) {
				$scope.games.splice(i, 1);
				$scope.$apply();
				break;
			}
	});
	socket.on('playerList', function(players) {
		var game = getGame(players.gameId);
		//if(players.players.length == 1) {
		//	window.location.href = 'http://' + $scope.ip + '/#' + players.gameId + "," + players.players[0];
		//}
		//else {
			$scope.gameDetailed = {
				gameName: game.name,
				slug: game.slug,
				id: game.id,
				watchers: players.players
			};
			$scope.apply();
		//}
	});
	socket.emit('directory');
	
	$scope.lookUpWatchers = function(gameId) {
		socket.emit('playersOf', gameId);
		// jQuery.support.cors = true;
		// window.$.ajax({
		// 	url: 'http://gaas-wissthom.c9users.io:8081/inGamePlayers', 
		// 	data: {game:gameId}, 
		// 	dataType: 'json',
		// 	success: function(onGoingGames) {
		// 		console.log(onGoingGames);
		// 	}
		// });
	}
}