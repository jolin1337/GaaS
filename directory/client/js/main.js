
function GaaSController($scope) {
	var socket = io.connect(window.location.origin, { /* Parameters sent in the connection phase here */ });
	
	$scope.games = [{name: "Loading..."}];
	socket.on('directory', function (games) {
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
	socket.emit('directory');
}