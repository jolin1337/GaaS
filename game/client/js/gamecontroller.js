
(function(global) {
    
    function fillCircle(context, x, y, radius) {
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI, false);
        context.fill();
    }
    
    function clearCircle(context, x, y, radius) {
        context.save();
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI, false);
        context.clip();
        context.clearRect(x - radius - context.lineWidth, y - radius - context.lineWidth,
                          radius * 2 + 2 * context.lineWidth, radius * 2 + 2 * context.lineWidth);
        
        context.restore();
    }
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
            var touchable = touchables[i];
            if(typeof touchable.opt === "object")
                touchable = touchables[i].opt;
            var diffX = convertStringValue(touchable.position.x, 0, global.innerWidth) 
                        + (typeof touchable.offset == "object" ? convertStringValue(touchable.offset.x, 0, global.innerWidth) : 0) 
                        - pointer.x;
            var diffY = convertStringValue(touchable.position.y, 0, global.innerHeight) 
                        + (typeof touchable.offset == "object" ? convertStringValue(touchable.offset.y, 0, global.innerHeight) : 0)
                        - pointer.y;
            var width = convertStringValue(touchable.width, undefined, global.innerWidth) || convertStringValue(touchable.radius, undefined);
            var height = convertStringValue(touchable.height, undefined, global.innerHeight) || width;
            if(!isNaN(width) && !isNaN(height) && diffX * diffX < width * width && diffY * diffY < height *height) {
                callback(touchable);
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
            touchable.pointedPos = newPointer;
            touchable.state = "pressed";
            if(typeof touchable.touchStart == "function")
                touchable.touchStart(newPointer);
        });
        global.GameController.render();
    }
    function onPointerMove(e) {
        var updatedPointer = makePointer(e);
        var pointer = pointers[updatedPointer.pointerId];
        if(pointer != undefined) {
            // pointer.x = updatedPointer.x;
            // pointer.y = updatedPointer.y;
            forEachCollission(updatedPointer, function (touchable) {
                // touchable.state = "moved";
                if(typeof touchable.touchMove == "function")
                    touchable.touchMove(updatedPointer);
                if(touchable.state == "pressed" && typeof touchable.toucheDelta == "function")
                    touchable.toucheDelta({
                        dx: updatedPointer.x - touchable.movedPos.x,
                        dy: updatedPointer.y - touchable.movedPos.y
                    }, updatedPointer);
                touchable.movedPos = updatedPointer;
            });
        }
        global.GameController.render();
    }
    function onPointerUp(e) {
        pointers[e.pointerId] = undefined;
        var pointer = makePointer(e);
        forEachCollission(pointer, function (touchable) {
            touchable.pointedPos = undefined;
            touchable.movedPos = undefined;
            touchable.state = undefined;
            if(typeof touchable.touchEnd == "function")
                touchable.touchEnd(pointer);
        });
        global.GameController.render();
    }
    var canvas = null; 
    var debug = false;
    global.GameController = {
        init: function (options) {
            if(options.debug) options.debug = true;
            else options.debug = false;
            canvas = options.canvas || document.createElement('canvas');
            canvas.addEventListener('pointerdown', onPointerDown, false);
            canvas.addEventListener('pointermove', onPointerMove, false);
            canvas.addEventListener('pointerup', onPointerUp, false);
            canvas.addEventListener('pointerout', onPointerUp, false);
            touchables = options.buttons || [];
            if(options.joystick instanceof Array)
                for(var i = 0; i < options.joystick.length;i++)
                    touchables.push({type: 'joystick', opt: options.joystick[i]});
            else if(options.joystick)
                touchables.push({type: 'joystick', opt: options.joystick});
        },
        render: function () {
            if(canvas !== null) {
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if(debug) {
                    for(var i in pointers) {
                        if(pointers[i] == undefined) continue;
                        ctx.fillStyle = "#fff";
                        fillCircle(ctx, pointers[i].x, pointers[i].y, 10);
                    }
                }
                for(var i = 0; i < touchables.length;i++) {
                    var touchable = touchables[i];
                    var type = touchable.type;
                    if(typeof touchable.opt === "object")
                        touchable = touchable.opt;
                    var pointedPos = touchable.pointedPos;
                    var movedPos = touchable.movedPos;
                    var state = touchable.state;
                    
                    ctx.fillStyle = touchable.fill || "#fff";
                    ctx.lineWidth = touchable.lineWidth || 2;
                    ctx.lineCap = touchable.lineCap || "round";
                    ctx.strokeStyle = touchable.stroke || "#fff";
                    
                    var radius = convertStringValue(touchable.radius, null);
                    var width = convertStringValue(touchable.width, null, global.innerWidth);
                    var height = convertStringValue(touchable.height, null, global.innerHeight);
                    var pos = {
                        x: convertStringValue(touchable.position.x, 0, global.innerWidth) + 
                                (typeof touchable.offset == "object" ? convertStringValue(touchable.offset.x, 0, global.innerWidth): 0),
                        y: convertStringValue(touchable.position.y, 0, global.innerHeight) +
                                (typeof touchable.offset == "object" ? convertStringValue(touchable.offset.y, 0, global.innerWidth): 0)
                    };
                    
                    if(type == 'joystick') {
                        if(state == "pressed" || state == "moved") {
                            if(radius == null) radius = 20;
                            if(pointedPos != undefined) {
                                fillCircle(ctx, pointedPos.x, pointedPos.y, radius);
                                clearCircle(ctx, pointedPos.x, pointedPos.y, radius - 1.5*radius/8);
                                fillCircle(ctx, pointedPos.x, pointedPos.y, radius - 4*radius/8);
                                clearCircle(ctx, pointedPos.x, pointedPos.y, radius - 5.5*radius/8);
                                // if(touchable.fill)
                                //     ctx.fill();
                                // if(touchable.stroke)
                                //     ctx.stroke();
                            }
                            if(movedPos != undefined) {
                                var deltaPos = {y: movedPos.y - pointedPos.y, x: movedPos.x - pointedPos.x};
                                var angl = Math.atan2(deltaPos.y, deltaPos.x);
                                var tmp = {x: Math.cos(angl) * radius, y: Math.sin(angl) * radius};
                                if(tmp.x * tmp.x + tmp.y * tmp.y > deltaPos.x * deltaPos.x + deltaPos.y * deltaPos.y) {
                                    tmp.x = deltaPos.x;
                                    tmp.y = deltaPos.y;
                                }
                                fillCircle(ctx, tmp.x + pointedPos.x, tmp.y + pointedPos.y, radius/2);
                            }
                        }
                        continue;
                    }
                    else {
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
        }
    };
})(window);