import { GameLoop } from 'kontra';
import { colors } from '../colors';
import { keyPressed } from '../keyboard';
import { newPlayer } from '../newPlayer';
import { pollGamepads, buttonPressed } from '../gamepad';
import { renderText } from '../text';
import { ships } from '../ships/import';
import { sound } from '../sounds';
import * as util from '../utility';

var game;
var scenes;

function getPlayerUiPos(playerIndex, gridSize, margin) {
    let x = y = 0;

    // Grid position coords e.g.
    // 0,0  1,0  2,0        0,0  1,0
    // 0,1  1,1  2,1   or   0,1  1,1
    // 0,2  1,2  2,2
    let xPos = playerIndex % gridSize;
    let yPos = Math.floor(playerIndex / gridSize) % gridSize;

    // Translate to game coords
    x = xPos * game.width / gridSize;
    y = yPos * game.height / gridSize;

    // Add double margin for 0-index, otherwise double
    x += xPos ? margin : margin * 2;
    y += yPos ? margin : margin * 2;

    return [x, y];
}

const menuLoop = GameLoop({  // create the main game loop
    update() { // update the game state
        pollGamepads();

        if (keyPressed('n')) {
            newPlayer(game, 'ai');
        }

        if (keyPressed('m')) {
            var lastAiIndex = null;
            game.players.forEach((player, i) => {
                if (player.controls === 'ai') {
                    lastAiIndex = i;
                }
            });

            // Explodes if the AI was at index - 0 but that shouldn't happen!
            if (lastAiIndex !== null) {
                game.players.splice(lastAiIndex, 1);
            }
        }

        game.players.forEach((player, i) => {

            if (!player.ship) {
                player.pseudoSpawn();
            }

            if (player.controls === 'ai') {
                player.ready = true;
                return;
            }

            if (player.keys.accept()) {
                player.debounce.accept--;
                if (player.debounce.accept <= 0) {
                    player.ready = !player.ready;
                    sound.beep();
                    player.debounce.accept = 15;
                }
            } else {
                player.debounce.accept = 0;
            }

            if (player.keys.back()) {
                player.debounce.back--;
                if (player.debounce.back <= 0) {
                    menuLoop.stop();
                    scenes.startMainMenu(game, scenes);
                    sound.beep()
                    player.debounce.back = 15;
                }
            } else {
                player.debounce.back = 0;
            }

            if (player.ready) {
                return;
            }

            player.ship.rotation += player.ship.dr;

            if (player.keys.up()) {
                if (player.debounce.up > 0) {
                    player.debounce.up--;
                    return;
                }

                player.color = util.objValPrev(colors, player.color);

                while (util.otherPlayerHasSameColor(game.players, player)) {
                    player.color = util.objValPrev(colors, player.color);
                }

                game.players[i].ship.color = player.color;
                sound.beep();
                player.debounce.up = 15;
            } else {
                player.debounce.up = 0;
            }

            if (player.keys.down()) {
                if (player.debounce.down > 0) {
                    player.debounce.down--;
                    return;
                }

                player.color = util.objValNext(colors, player.color);

                while (util.otherPlayerHasSameColor(game.players, player)) {
                    player.color = util.objValNext(colors, player.color);
                }

                game.players[i].ship.color = player.color;
                sound.beep();
                player.debounce.down = 15;
            } else {
                player.debounce.down = 0;
            }

            if (player.keys.left()) {
                if (player.debounce.left > 0) {
                    player.debounce.left--;
                    return;
                }
                player.shipType = util.objKeyPrev(ships, player.shipType);
                player.pseudoSpawn();
                sound.beep()
                player.debounce.left = 15;
            } else {
                player.debounce.left = 0;
            }

            if (player.keys.right()) {
                if (player.debounce.right > 0) {
                    player.debounce.right--;
                    return;
                }
                player.shipType = util.objKeyNext(ships, player.shipType);
                player.pseudoSpawn();
                sound.beep()
                player.debounce.right = 15;
            } else {
                player.debounce.right = 0;
            }

        });

        if (game.players.length > 1 &&
            game.players.every(player => player.ready)) {
            menuLoop.stop();
            scenes.startGame(game, scenes);
        }
    },

    render() {
        let gridSize = game.players.length > 4 ? 3 : 2;
        let margin = 4;

        game.players.forEach((player, i) => {
            let [x, y] = getPlayerUiPos(i, gridSize, margin);

            game.ctx.save();
            game.ctx.scale(game.scale, game.scale);
            game.ctx.clearRect(
                x,
                y,
                game.width / gridSize - 12,
                game.height / gridSize - 12,
            );
            game.ctx.strokeStyle = player.color;
            game.ctx.strokeRect(
                x,
                y,
                game.width / gridSize - 12,
                game.height / gridSize - 12,
            )
            game.ctx.restore();

            renderText({
                text: 'player ' + (i + 1),
                color: player.color,
                size: .8,
                x: x + 12,
                y: y + 12,
                scale: game.scale,
                ctx: game.ctx
            });

            renderText({
                alignBottom: true,
                text: player.gamepadId ? player.gamepadId : player.controls,
                color: player.color,
                size: .5,
                x: x + 12,
                y: y + game.height / gridSize - 20,
                scale: game.scale,
                ctx: game.ctx
            });

            if (player.controls === 'ai') {
                renderText({
                    alignBottom: true,
                    text: '(m) remove',
                    color: player.color,
                    size: .5,
                    x: x + 30,
                    y: y + game.height / gridSize - 20,
                    scale: game.scale,
                    ctx: game.ctx
                });
            }

            renderText({
                alignRight: true,
                alignBottom: true,
                text: player.ready ? 'ready!' : 'selecting',
                color: player.color,
                size: .8,
                x: x + game.width / gridSize - 22,
                y: y + game.height / gridSize - 20,
                scale: game.scale,
                ctx: game.ctx
            });

            if (player.ship) {
                player.ship.pseudoRender(
                    game.scale,
                    x + game.width / gridSize - 80,
                    y + (game.height / gridSize - 12) / 2
                );
            }
        });

        // Draw "add new player" infos
        for (let i = game.players.length; i < 4; i++) {
            let [x, y] = getPlayerUiPos(i, gridSize, margin);

            renderText({
                text: '(n) add ai player',
                alignCenter: true,
                size: .5,
                x: x + game.width / (gridSize * 2),
                y: y + game.height / (gridSize * 2) - 8,
                scale: game.scale,
                ctx: game.ctx
            });

            renderText({
                text: game.unusedControls + ' add player',
                alignCenter: true,
                size: .5,
                x: x + game.width / (gridSize * 2),
                y: y + game.height / (gridSize * 2) + 8,
                scale: game.scale,
                ctx: game.ctx
            });
        }
    }
});

export function startShipSelect(newGame, otherScenes) {
    game = newGame;
    scenes = otherScenes;

    game.players.forEach(player => {
        player.ship = null;
        player.reset();
    });

    menuLoop.start();
}
