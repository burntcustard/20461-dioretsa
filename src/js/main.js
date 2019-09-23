import { init } from 'kontra';
import { initKeys } from './keyboard';
import { setSizing } from './setSizing';

// Import all the scenes because we're somehow going to handle changing
// between them here... to stop circular dependencies getting in the way

import { startMainMenu } from './scenes/main';
import { startShipSelect } from './scenes/select';
import { startGame } from './scenes/game';

// Kontra init canvas
let { canvas, context } = init();

const game = {
    canvas: canvas,
    ctx: context,
    // meteors: [],
    // pickups: [],
    players: [],
    // sprites: [],
    // The following get added by setSizing()
    // scale: 1.0,
    // supersampling: 1.0,
    // width: 360,
    // height: 202.5
};

const scenes = {
    startMainMenu: startMainMenu,
    startShipSelect: startShipSelect,
    startGame: startGame
};

// Give game to window object so can be accessed w/eventListeners (e.g.
// gamepadconnected). There must be a better way to do this.
window.game = game;

// Kontra init keyboard stuff
initKeys();

canvas.style = 'width:100%;background:#000';

setSizing(game);

window.onresize = () => {
    setSizing(game);
}

game.unusedControls = '(gamepad)(wasd/zqsd)(arrows)';

startMainMenu(game, scenes);
