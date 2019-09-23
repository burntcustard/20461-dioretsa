/**
 * Based on Kontra keyboard.js
 * https://github.com/straker/kontra/blob/master/src/keyboard.js
 *
 * But using event.key rather than event.which
 */

// Store callbacks for single key pressed events
let callbacks = {};

// Different to Kontras - pressedKeys stores a list of which keys have been
// pressed, but have not had anything done with the keyDown event yet.
let pressedKeys = {};

// Same as Kontra pressedKeys - a list of keys that are "held down", i.e.
// haven't had a keyup even to "turn them off" yet.
let downKeys = {};

/**
 * Execute a function that corresponds to a keyboard key.
 *
 * @param {KeyboardEvent} e
 */
function keydownEventHandler(e) {
    // If it's a key event being repeated because of being held, do nothing
    if (e.repeat) {
        return
    }
    pressedKeys[e.key] = true;
    downKeys[e.key] = true;

    if (callbacks[e.key]) {
        callbacks[e.key](e);
    }
}

/**
 * Set the released key to not being pressed.
 *
 * @param {KeyboardEvent} e
 */
function keyupEventHandler(e) {
    downKeys[e.key] = false;
}

/**
 * Reset pressed keys.
 * Window "barely ever" gets blurred while keys held down so don't need this.
 */
// function blurEventHandler() {
//   pressedKeys = {};
// }

/**
 * Initialize keyboard event listeners. This function must be called before using other keyboard functions.
 * @function initKeys
 */
export function initKeys() {
    window.addEventListener('keydown', keydownEventHandler);
    window.addEventListener('keyup', keyupEventHandler);
    // window.addEventListener('blur', blurEventHandler);
}

/**
 * [bindKeys description]
 * @param  {Array}   keys     Array of KeyboardEvent.key codes -
 * developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 * @param  {Function} callback [description]
 */
export function bindKeys(keys, callback) {
  keys.map(key => callbacks[key] = callback);
}

/**
 * [unbindKeys description]
 * @param  {Array}   keys     Array of KeyboardEvent.key codes -
 * developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 */
export function unbindKeys(keys) {
  keys.map(key => callbacks[key] = false);
}

export function keyPressed(key) {
    if (pressedKeys[key]) {
        pressedKeys[key] = false;
        return true
    }
    // implicit else return undefined (falsey)
}

export function keyDown(key) {
    return !!downKeys[key];
}