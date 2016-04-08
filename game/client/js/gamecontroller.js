
(function(global) {
    function convertStringValue(value, def, pof) {
        if(typeof pof != "number") pof = global.innerWidth;
        var val = value;
        if(typeof val == "string") {
            val = parseInt(val);
            var unit = value.replace("" + val, "");
            if(unit == '%') val *= pof / 100;
        }
        else if(typeof val != "number")
            return def;
        return val;
    }
    function forEachCollission(pointer, callback) {
        for(var i = 0; i < touchables.length; i++) {
            var diffX = convertStringValue(touchables[i].position.x, 0, global.innerWidth) 
                        + (typeof touchables[i].offset == "object" ? convertStringValue(touchables[i].offset.x, 0, global.innerWidth) : 0) 
                        - pointer.x;
            var diffY = convertStringValue(touchables[i].position.y, 0, global.innerHeight) 
                        + (typeof touchables[i].offset == "object" ? convertStringValue(touchables[i].offset.y, 0, global.innerHeight) : 0)
                        - pointer.y;
            var width = convertStringValue(touchables[i].width, undefined, global.innerWidth) * 0.5 || convertStringValue(touchables[i].radius, undefined);
            var height = convertStringValue(touchables[i].height, undefined, global.innerHeight) * 0.5 || width;
            if(!isNaN(width) && !isNaN(height) && diffX * diffX < width * width && diffY * diffY < height *height) {
                callback(touchables[i]);
            }
        }
    }
    function makePointer(event) {
        var type = "";
        switch (event.pointerType) {
            case event.POINTER_TYPE_MOUSE:
                type = "MOUSE";
                break;
            case event.POINTER_TYPE_PEN:
                type = "PEN";
                break;
            case event.POINTER_TYPE_TOUCH:
                type = "TOUCH";
                break;
        }
        return {
            pointerId: event.pointerId,
            pointerType: type,
            type: event.type,
            x: event.clientX,
            y: event.clientY
        };
    }
    var pointers = {};
    var touchables = [];
    function onPointerDown(e) {
        var newPointer = makePointer(e);
        pointers[newPointer.pointerId] = newPointer;
        forEachCollission(newPointer, function (touchable) {
            if(typeof touchable.touchStart == "function")
                touchable.touchStart(newPointer);
        });
        global.GameController.render();
    }
    function onPointerMove(e) {
        var updatedPointer = makePointer(e);
        var pointer = pointers[updatedPointer.pointerId];
        if(pointer != undefined) {
            pointer.x = updatedPointer.x;
            pointer.y = updatedPointer.y;
            forEachCollission(pointer, function (touchable) {
                if(typeof touchable.touchMove == "function")
                    touchable.touchMove(pointer);
            });
        }
        global.GameController.render();
    }
    function onPointerUp(e) {
        pointers[e.pointerId] = undefined;
        var pointer = makePointer(e);
        forEachCollission(pointer, function (touchable) {
            if(typeof touchable.touchEnd == "function")
                touchable.touchEnd(pointer);
        });
        global.GameController.render();
    }
    var canvas = null; 
    var debug = true;
    global.GameController = {
        init: function (options) {
            if(options.debug) options.debug = true;
            canvas = options.canvas || document.createElement('canvas');
            canvas.addEventListener('pointerdown', onPointerDown, false);
            canvas.addEventListener('pointermove', onPointerMove, false);
            canvas.addEventListener('pointerup', onPointerUp, false);
            canvas.addEventListener('pointerout', onPointerUp, false);
            touchables = options.buttons || [];
            if(options.joystick instanceof Array)
                for(var i = 0; i < options.joystick.length;i++)
                    touchables.push(options.joystick[i]);
            else if(options.joystick)
                touchables.push(options.joystick);
        },
        render: function () {
            if(canvas !== null) {
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if(debug) {
                    for(var i in pointers) {
                        if(pointers[i] == undefined) continue;
                        ctx.fillStyle = "#fff";
                        ctx.beginPath();
                        ctx.arc(pointers[i].x, pointers[i].y, 20, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
                for(var i = 0; i < touchables.length;i++) {
                    var touchable = touchables[i];
                    var radius = convertStringValue(touchable.radius, null);
                    var width = convertStringValue(touchable.width, null, global.innerWidth);
                    var height = convertStringValue(touchable.height, null, global.innerHeight);
                    var pos = {
                        x: convertStringValue(touchable.position.x, 0, global.innerWidth) + 
                                (typeof touchable.offset == "object" ? convertStringValue(touchable.offset.x, 0, global.innerWidth): 0),
                        y: convertStringValue(touchable.position.y, 0, global.innerHeight) +
                                (typeof touchable.offset == "object" ? convertStringValue(touchable.offset.y, 0, global.innerWidth): 0)
                    };
                    ctx.fillStyle = touchable.fill || "#fff";
                    ctx.lineWidth = touchable.lineWidth || 2;
                    ctx.lineCap = touchable.lineCap || "round";
                    ctx.strokeStyle = touchable.stroke || "#fff";
                    if(radius !== null) {
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, radius, 0, 2*Math.PI);
                        ctx.closePath();
                        if(touchable.fill)
                            ctx.fill();
                        if(touchable.stroke)
                            ctx.stroke();
                    }
                    else if(height !== null && width !== null) {
                        ctx.beginPath();
                        ctx.moveTo(pos.x - width/2, pos.y - height/2);
                        ctx.lineTo(pos.x + width/2, pos.y - height/2);
                        ctx.lineTo(pos.x + width/2, pos.y + height/2);
                        ctx.lineTo(pos.x - width/2, pos.y + height/2);
                        ctx.closePath();
                        if(touchable.fill)
                            ctx.fill();
                        if(touchable.stroke)
                            ctx.stroke();
                    }
                }
            }
        }
    };
})(window);