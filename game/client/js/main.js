
var kbEvents = {};
var gamePadEvents = [];
var mouseTouchEvents = false;
var mouseEvents = {};

window.onhashchange = function () {
    window.location.reload();
}
function GaaSController($scope) {
	var gamePath = window.location.hash.substr(1).split(',');
	var gameSlug = gamePath[0];
	var gameWatch = "";
	if(gameSlug == "") {
		// location.href = "/";
		return;
	}
	if(gamePath.length > 1) {
		gameWatch += "&watch=" + gamePath[1];
	}
	var socket = io.connect(window.location.origin, { query: "game=" + gameSlug + gameWatch });
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
		if(typeof controls.kb == "object" ) {
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
		}
		if(typeof controls.mouse == "object") {
			for(var i in controls.mouse) {
				mouseEvents[i] = controls.mouse[i];
				if(controls.mouse[i] == true)
					mouseTouchEvents = true;
			}
		}
		if(null !== window.navigator.userAgent.match(
			/android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i) || 
			null !== window.navigator.userAgent.match(/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i))
		{
			window.GameController.init({
				debug: true,
				canvas: controlview[0],
				buttons: gamePadEvents,
				joystick: (mouseTouchEvents ? {
					position: {x: 0, y: 0},
					width: '50%',
					height: '100%',
					fill: "#fff",
					// stroke: "#555",
					radius: 50,
					touchStart: function(e) {
						mouseEvent({
							type: "mousedown",
							screenX: event.x, 
							screenY: event.y,
							clientX: event.x,
							clientY: event.y,
							pageX: event.x,
							pageY: event.y
						});
					},
					touchMove: function(delta, e) {
						mouseEvent({
							type: "mousemove",
							screenX: event.x, 
							screenY: event.y,
							clientX: event.x,
							clientY: event.y,
							pageX: event.x,
							pageY: event.y
						});
					},
					touchDelta: function(delta, e) {
						
					},
					touchEnd: function(e) {
						
						mouseEvent({
							type: "mouseup",
							screenX: event.x, 
							screenY: event.y,
							clientX: event.x,
							clientY: event.y,
							pageX: event.x,
							pageY: event.y
						});
					}
				}: undefined)
			});
		}
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
	
	var controlview = window.$('#controlview');
	var eventNames = ['keydown', 'keyup', 'keypress'];
	for(var i = 0; i < eventNames.length; i++) {
		window.addEventListener(eventNames[i], keyEvent);
	}
	eventNames = ['mousemove', 'mousedown', 'mouseup', 'click'];
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
	for(var i in eventNames) {
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
	var scale = Math.max(window.innerHeight, window.innerWidth) * 1.3;
	var gamePadLayout = {
		// Right key
		RightKey: {
			position: {x: '15%', y:'80%'},
			offset: {x: 0.04 * scale},
			width: 0.04 * scale,
			height: 0.02 * scale,
			fill: "rgba(0,0,0,0.7)",
			stroke: "rgba(255,255,255,0.3)",
			lineWidth: 3,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.RightKey.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.RightKey.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.RightKey.keyCode)}
		},
		// Left key
		LeftKey: {
			position: {x: '15%', y:'80%'},
			offset: {x: -0.04 * scale},
			width: 0.04 * scale,
			height: 0.02 * scale,
			fill: "rgba(0,0,0,0.7)",
			stroke: "rgba(255,255,255,0.3)",
			lineWidth: 3,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.LeftKey.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.LeftKey.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.LeftKey.keyCode)}
		},
		// Up key
		UpKey: {
			position: {x: '15%', y:'80%'},
			offset: {y: -0.04 * scale},
			width: 0.02 * scale,
			height: 0.04 * scale,
			fill: "rgba(0,0,0,0.7)",
			stroke: "rgba(255,255,255,0.3)",
			lineWidth: 3,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.UpKey.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.UpKey.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.UpKey.keyCode)}
		},
		// Down key
		DownKey: {
			position: {x: '15%', y:'80%'},
			offset: {y: 0.04 * scale},
			width: 0.02 * scale,
			height: 0.04 * scale,
			fill: "rgba(0,0,0,0.7)",
			stroke: "rgba(255,255,255,0.3)",
			lineWidth: 3,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.DownKey.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.DownKey.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.DownKey.keyCode)}
		},
		
		// A key
		A: {
			position: {x: '85%', y:'75%'},
			radius: 0.04 * scale,
			fill: "rgba(200, 0, 0, 0.4)",
			stroke: "rgba(255,255,255, 0.3)",
			lineWidth: 10,
			touchStart: function(e) {touchKeyEvent(e, gamePadLayout.A.keyCode)},
			touchMove: function(e) {touchKeyEvent(e, gamePadLayout.A.keyCode)},
			touchEnd: function(e) {touchKeyEvent(e, gamePadLayout.A.keyCode)}
		},
		// B key
		B: {
			position: {x: '72%', y:'85%'},
			radius: 0.04 * scale,
			fill: "rgba(0,200,0, 0.4)",
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