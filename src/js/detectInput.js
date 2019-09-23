/**
 * When a new "input device" (gamepad, keyboard wasd, keyboard arrows), etc.
 * add a new player (if they don't exist already).
 * Also contains code for adding and removing AI players from the game!
 */

import { newPlayer } from './newPlayer';
//import { bindKeys, unbindKeys } from 'kontra';
import { bindKeys, unbindKeys } from './keyboard';

// Setup a global array for holding gamepad infos
window.gamepads = [];

function setupGamepad(e) {
    var pad = e.gamepad;
    var windowPad = window.gamepads[pad.index] = {
        id: pad.id,
        pressedButtons: {},
        axes: {x: 0, y: 0}
    };
    if (pad.id.includes('2006')) {
        windowPad.buttonMap = {
            'a': 1,
            'b': 0,
            'x': 3,
            'y': 2,
            'l': 4,
            'r': 5
        };
        // windowPad.axesMap = {
        //     'x': -1,
        //     'y': -2
        // };
    } else {
        windowPad.buttonMap = {
            'a': 0,
            'b': 1,
            'x': 3,
            'y': 2,
            'l': 6,
            'r': 7
        };
        // windowPad.axesMap = {
        //     'x': 0,
        //     'y': 1
        // };
    }

    // Code to handle new players being added with new gamepads.
    newPlayer(window.game, 'gamepad', pad.id);
}

function keySetUsed(keys) {
    if (!window.game.players.some(p => p.controls === keys)) {
        newPlayer(window.game, keys)
        window.game.unusedControls = window.game.unusedControls.replace(
            '(' + keys + ')', ''
        );
    }
}

export function detectNewInput() {

    // Event when new gamepads get connected
    window.addEventListener('gamepadconnected', setupGamepad);

    bindKeys(
        [' ', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'],
        function(e) {
            keySetUsed('arrows');
        }
    );

    bindKeys(['w', 'a', 's', 'd', 'z', 'q'], function(e) {
        keySetUsed('wasd/zqsd');
    });

    bindKeys(['n'], function(e) {
        newPlayer(window.game, 'ai');
    });

    bindKeys(['m'], function(e) {
        var lastAiIndex = null;
        window.game.players.forEach((player, i) => {
            if (player.controls === 'ai') {
                lastAiIndex = i;
            }
        });

        // Explodes if the AI was at index - 0 but that shouldn't happen!
        if (lastAiIndex !== null) {
            window.game.players.splice(lastAiIndex, 1);
        }
    });
}

export function dontDetectNewInput() {
    window.removeEventListener('gamepadconnected', setupGamepad);
    unbindKeys(['space', 'up', 'right', 'down', 'left', 'w', 'a', 's', 'd']);
}
