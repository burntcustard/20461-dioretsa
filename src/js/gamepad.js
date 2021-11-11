
let browserGamepads = []; // Actually an object in Chrome hrmm

export function buttonPressed(gamepadIndex, button) {
    // if (!window.gamepads[gamepadIndex]) {
    //     return false;
    // }
    return !!window.gamepads[gamepadIndex].pressedButtons[button];
}

export function axisValue(gamepadIndex, axesIndex) {
    // if (!window.gamepads[gamepadIndex]) {
    //     return false;
    // }

    //if (window.gamepads[gamepadIndex].axesMap[axesIndex] < 0) {
    //    return window.gamepads[gamepadIndex].axes[window.gamepads[gamepadIndex].axes.length + axesIndex];
    //}
    return window.gamepads[gamepadIndex].axes[axesIndex];
}

function getKeyByValue(obj, value) {
    return Object.keys(obj).find(key => obj[key] === value);
}

export function pollGamepads(game) {

    browserGamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    Array.prototype.forEach.call(browserGamepads, pad => {
        if (!pad) {
            return;
        }
        var gamepad = window.gamepads[pad.index];
        pad.buttons.forEach((button, i) => {
            let mappedKey = getKeyByValue(gamepad.buttonMap, i);
            if (button.pressed) {
                if (mappedKey) {
                    gamepad.pressedButtons[mappedKey] = true;
                // } else {
                //     gamepad.pressedButtons[i] = true;
                }
           } else {
               if (mappedKey) {
                   gamepad.pressedButtons[mappedKey] = false;
               // } else {
               //     gamepad.pressedButtons[i] = false;
               }
           }
        });
        gamepad.axes.x = 0;
        gamepad.axes.y = 0;
        pad.axes.forEach((axis, i) => {
            // let mappedAxis = getKeyByValue(gamepad.axesMap, i);
            // if (mappedAxis) {
            //     gamepad.axes[mappedAxis] = axis;
            // // } else {
            // //     gamepad.axes[i] = axis;
            // }
            // Odd axis = y axis (hopefully)
            if (i & 1) {
                gamepad.axes.y += axis;
            // Even axes = x axis (hopefully)
            } else {
                gamepad.axes.x += axis;
            }
        });
    });

    // if (gamepads[0] && gamepads[0].pressedButtons) {
    //     console.log(gamepads[0].pressedButtons);
    // }
}
