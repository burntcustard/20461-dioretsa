import { GameLoop } from 'kontra';
import { pollGamepads } from '../gamepad';
import { renderText } from '../text';
import { colors } from '../colors';
import ships from '../ships/import';
import * as util from '../utility';

var game;
var scenes;

const menuLoop = GameLoop({  // create the main game loop
    update() { // update the game state
        pollGamepads();

        game.players.forEach((player, i) => {

            if (!player.ship) {
                player.pseudoSpawn();
            }

            if (player.keys.accept()) {
                player.debounce.accept--;
                if (player.debounce.accept <= 0) {
                    player.ready = !player.ready;
                    player.debounce.accept = 15;
                }
            } else {
                player.debounce.accept = 0;
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
        game.players.forEach((player, i) => {
            var x = y = 0;

            if (i === 1 || i == 3) {
                x = 4 + game.width / 2;
            } else {
                x = 8;
            }
            if (i === 2 || i === 3) {
                y = 4 + game.height / 2;
            } else {
                y = 8;
            }

            game.context.save();
            game.context.scale(game.scale, game.scale);
            game.context.clearRect(
                x,
                y,
                game.width / 2 - 12,
                game.height / 2 - 12,
            );
            game.context.strokeStyle = player.color;
            game.context.strokeRect(
                x,
                y,
                game.width / 2 - 12,
                game.height / 2 - 12,
            )
            game.context.restore();

            renderText({
                text: 'player ' + (i + 1),
                color: player.color,
                size: .8,
                x: x + 12,
                y: y + 12,
                scale: game.scale,
                context: game.context
            });

            renderText({
                alignBottom: true,
                text: player.gamepadId ? player.gamepadId : player.controls,
                color: player.color,
                size: .5,
                x: x + 12,
                y: y + game.height / 2 - 20,
                scale: game.scale,
                context: game.context
            });

            renderText({
                alignRight: true,
                alignBottom: true,
                text: player.ready ? 'ready!' : 'selecting',
                color: player.color,
                size: .8,
                x: x + game.width / 2 - 22,
                y: y + game.height / 2 - 20,
                scale: game.scale,
                context: game.context
            });

            if (player.ship) {
                player.ship.pseudoRender(
                    game.scale,
                    x + game.width / 2 - 80,
                    y + (game.height / 2 - 12) / 2
                );
            }
        });
    }
});


export function startShipSelect(newGame, otherScenes) {
    game = newGame;
    scenes = otherScenes;
    menuLoop.start();
}
