
var kbEvents = {};
var gamePadEvents = [];
var mouseEvents = {};

window.onhashchange = function () {
    window.location.reload();
}
function GaaSController($scope) {
	var gameSlug = window.location.hash.substr(1);
	if(gameSlug == "") {
		// location.href = "/";
		return;
	}
	var socket = io.connect(window.location.origin, { query: "game=" + gameSlug });
	var controls = {};
	var img = $('#gameview');

	//$scope.roster = [];
	//$scope.name = '';

	socket.on('connect', function () {
		// $scope.setName();
	});

	socket.on('image', function(pngFile) {
		img.attr('src', pngFile.data);
		var ratio = img[0].naturalHeight / img[0].naturalWidth;
		// console.log(ratio, innerHeight);
		if((ratio >= 1 && window.innerHeight / ratio < window.innerWidth) || (ratio < 1 && window.innerWidth * ratio > window.innerHeight)) {
		    img.css('height', '100%');
		    img.css('width', 'auto');
		}
		else {
		    img.css('height', 'auto');
		    img.css('width', '100%');
		}
	});

	//socket.on('roster', function (names) {
	//	$scope.roster = names;
	//	$scope.$apply();
	//});
	socket.on('controls', function(controls) {
		if(typeof controls.kb == "object" )
			for(var i = 0; i < controls.kb.length; i++) {
				var es = controls.kb[i].event.split("|");
				for(var j = 0; j < es.length; j++) {
					if(kbEvents[es[j]] instanceof Array)
						kbEvents[es[j]].push(controls.kb[i]);
					else kbEvents[es[j]] = [controls.kb[i]];
				}
				if(controls.kb[i].map) {
					var layout = gamePadLayout[controls.kb[i].map];
					layout.keyCode = controls.kb[i].keyCode;
					layout.key = controls.kb[i].key;
					gamePadEvents.push(layout);
				}
			}
		if(typeof controls.mouse == "object") {
			for(var i in controls.mouse) {
				mouseEvents[i] = controls.mouse[i];
			}
		}
		
		GameController.init({
			canvas: controlview[0],
			buttons: gamePadEvents
		});
		console.log(gamePadEvents);
	    //socket.disconnect();
	    //socket.emit('close');
	});
	
	//$scope.setName = function () {
	//	socket.emit('identify', $scope.name);
	//};
	
	function keyEvent(event) {
		if(!(kbEvents[event.type] instanceof Array)) return;
		for(var j = 0; j < kbEvents[event.type].length; j++) {
			if(kbEvents[event.type][j].keyCode == event.keyCode){
				// console.log(event.type, event.keyCode);
				socket.emit(event.type, {type: event.type, keyCode: event.keyCode, which: event.which});
			}
		}
   }
	
	var controlview = $('#controlview');
	var eventNames = ['keydown', 'keyup', 'keypress'];
	for(var i = 0; i < eventNames.length; i++) {
		window.addEventListener(eventNames[i], keyEvent);
	}
	eventNames = ['mousemove', 'mousedown', 'mouseup', 'click'];
	for(var i in eventNames) {
		function mouseEvent(event) {
			if(mouseEvents[event.type] !== true) return true;
					// console.log(event.type);
			var offset = img.offset();
			var scaleX = img[0].naturalWidth / img.width();
			var scaleY = img[0].naturalHeight / img.height();
			socket.emit(event.type, {
				type: event.type,
				screenX: Math.min( scaleX * (event.screenX - offset.left), 	img[0].naturalWidth), 
				screenY: Math.min( scaleY * (event.screenY - offset.top), 	img[0].naturalHeight),
				clientX: Math.min( scaleX * (event.clientX - offset.left), 	img[0].naturalWidth),
				clientY: Math.min( scaleY * (event.clientY - offset.top), 	img[0].naturalHeight),
				pageX: Math.min( scaleX * (event.pageX - offset.left), 		img[0].naturalWidth),
				pageY: Math.min( scaleY * (event.pageY - offset.top), 		img[0].naturalHeight)
			});
		}
		img.on(eventNames[i], mouseEvent);
		controlview.on(eventNames[i], mouseEvent);
	}
	
	
	var canvas = document.getElementsByTagName('canvas')[0];
	function resize(){
		//controlview.width(window.innerWidth);
		//controlview.height(window.innerWidth);
		controlview[0].width = window.innerWidth;
		controlview[0].height = window.innerHeight;
	}
	window.addEventListener('resize', resize, false);
	resize();
	 function touchKeyEvent(e, keyCode) {
		return keyEvent({
			type: e.type.replace("pointer", "key"),
			keyCode: keyCode
		});
	}
	var scale = window.innerWidth * 0.0005;
	var gamePadLayout = {
		// Right key
		RightKey: {
			position: {x: '15%', y:'80%'},
			offset: {x: 80 * scale},
			width: 100 * scale,
			height: 50 * scale,
			fill: "rgba(0,0,0,0.5)",
			stroke: "rgba(255,255,255,0.3)",
			lineWidth: 3,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.RightKey.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.RightKey.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.RightKey.keyCode)}
		},
		// Left key
		LeftKey: {
			position: {x: '15%', y:'80%'},
			offset: {x: -80 * scale},
			width: 100 * scale,
			height: 50 * scale,
			fill: "rgba(0,0,0,0.5)",
			stroke: "rgba(255,255,255,0.3)",
			lineWidth: 3,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.LeftKey.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.LeftKey.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.LeftKey.keyCode)}
		},
		// Up key
		UpKey: {
			position: {x: '15%', y:'80%'},
			offset: {y: -80 * scale},
			width: 50 * scale,
			height: 100 * scale,
			fill: "rgba(0,0,0,0.5)",
			stroke: "rgba(255,255,255,0.3)",
			lineWidth: 3,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.UpKey.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.UpKey.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.UpKey.keyCode)}
		},
		// Down key
		DownKey: {
			position: {x: '15%', y:'80%'},
			offset: {y: 80 * scale},
			width: 50 * scale,
			height: 100 * scale,
			fill: "rgba(0,0,0,0.5)",
			stroke: "rgba(255,255,255,0.3)",
			lineWidth: 3,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.DownKey.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.DownKey.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.DownKey.keyCode)}
		},
		
		// A key
		A: {
			position: {x: '85%', y:'75%'},
			radius: 70 * scale,
			fill: "rgba(0, 200, 0, 0.3)",
			stroke: "rgba(255,255,255, 0.3)",
			lineWidth: 10,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.A.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.A.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.A.keyCode)}
		},
		// B key
		B: {
			position: {x: '75%', y:'85%'},
			radius: 70 * scale,
			fill: "rgba(255,255,0, 0.3)",
			stroke: "rgba(255,255,255, 0.3)",
			lineWidth: 10,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.B.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.B.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.B.keyCode)}
		}
	};
	/*
	GameController.init({
		canvas: controlview[0],
		buttons: gamePadEvents
		/*left: {
			type: 'joystick',
			position: {left: '15%', bottom: '15%'},
			joystick: {
				touchStart: function(){
					console.log('touch starts');
				},
				touchEnd: function(){
					console.log('touch ends');
				},
				touchMove: function(details){
					console.log(details);
				}
			}
		},
		
	    left: {
			type: 'dpad',
			position: { left: '13%', bottom: '22%' },
			dpad: {
				up: {
					width: '7%',
					height: '15%',
					stroke: 2,
					touchStart: function() {
						GameController.simulateKeyEvent( 'press', 38);
						GameController.simulateKeyEvent( 'down', 38);
					},
					touchEnd: function() {
						GameController.simulateKeyEvent( 'up', 38);
					}
				},
				left: {
					width: '15%',
					height: '7%',
					stroke: 2,
					touchStart: function() {
						GameController.simulateKeyEvent( 'press', 37);
						GameController.simulateKeyEvent( 'down', 37);
					},
					touchEnd: function() {
						GameController.simulateKeyEvent( 'up', 37);
					}
				},
				down: {
					width: '7%',
					height: '15%',
					stroke: 2,
					touchStart: function() {
						GameController.simulateKeyEvent( 'press', 40);
						GameController.simulateKeyEvent( 'down', 40);
					},
					touchEnd: function() {
						GameController.simulateKeyEvent( 'up', 40);
					}
				},
				right: {
					width: '15%',
					height: '7%',
					stroke: 2,
					touchStart: function() {
						GameController.simulateKeyEvent( 'press', 39);
						GameController.simulateKeyEvent( 'down', 39);
					},
					touchEnd: function() {
						GameController.simulateKeyEvent( 'up', 39);
					}
				}
			}
	    },
		right:  {
			position: {right: '15%', bottom: '20%'},
			type: 'buttons',
			buttons: [{
				label: 'A',
				fontSize: 23,
				touchStart: function(){
				console.log('A start');
				}
			}, {
				label: 'B',
				fontSize: 23,
				touchStart: function(){
					console.log('B start');
				}
			},
				false,
				false
			]
		}
	});*/
}
