

// ###################################################################
// Start game!
//
// ###################################################################

//  Create the starfield.
// var container = document.getElementById('starfield');
// var starfield = new Starfield();
// starfield.initialise(container);
// starfield.start();

//  Setup the canvas.
var canvas = document.createElement("canvas");
// canvas.width = 800;
// canvas.height = 600;
canvas.getContext("2d");
//  Create the game.
var game = new Game();

//  Initialise it with the game canvas.
game.initialise(canvas);

// game.mute();
//  Start the game.
game.start();

//  Listen for keyboard events.
window.addEventListener("keydown", function keydown(e) {
    var keycode = e.keyCode;
    //  Supress further processing of left/right/space (37/29/32)
    if(keycode == 37 || keycode == 39 || keycode == 32) {
        e.preventDefault();
    }
    game.keyDown(keycode);
});
window.addEventListener("keyup", function keydown(e) {
    var keycode = e.keyCode;
    game.keyUp(keycode);
});

function toggleMute() {
    game.mute();
}