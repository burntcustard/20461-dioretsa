//import { keyDown } from 'kontra';
import { keyDown } from './keyboard';
import { buttonPressed, axisValue } from './gamepad';

export default (scheme, gamepadIndex) => {
    if (typeof scheme === 'string') {
        switch (scheme.toLowerCase()) {
            case 'arrows':
                return {
                    thrust: () => keyDown('ArrowUp'),
                    fire:   () => keyDown(' '),
                    left:   () => keyDown('ArrowLeft'),
                    right:  () => keyDown('ArrowRight'),
                    rewind: () => keyDown('ArrowDown'),
                    up:     () => keyDown('ArrowUp'),
                    down:   () => keyDown('ArrowDown'),
                    accept: () => keyDown(' '),
                    back:   () => keyDown('Escape'),
                };
            case 'wasd/zqsd':
                return {
                    thrust: () => keyDown('w') || keyDown('z'),
                    fire:   () => keyDown('e'),
                    left:   () => keyDown('a') || keyDown('q'),
                    right:  () => keyDown('d'),
                    rewind: () => keyDown('s'),
                    up:     () => keyDown('w'),
                    down:   () => keyDown('s'),
                    accept: () => keyDown('e'),
                    back:   () => keyDown('x'),
                };
            case 'gamepad':
                return {
                    thrust: () => buttonPressed(gamepadIndex, 'a'),
                    fire:   () => buttonPressed(gamepadIndex, 'r'),
                    left:   () => axisValue(gamepadIndex, 'x') < -.5,
                    right:  () => axisValue(gamepadIndex, 'x') > .5,
                    rewind: () => buttonPressed(gamepadIndex, 'l'),
                    up:     () => axisValue(gamepadIndex, 'y') < -.5,
                    down:   () => axisValue(gamepadIndex, 'y') > .5,
                    accept: () => buttonPressed(gamepadIndex, 'a'),
                    back:   () => buttonPressed(gamepadIndex, 'b'),
                }
            //default:
            //    console.error('Unknown control scheme');
        }
    }
}
