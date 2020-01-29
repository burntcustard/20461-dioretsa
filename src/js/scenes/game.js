import { GameLoop } from 'kontra';
import { Collisions } from 'collisions';
import { createMeteor } from '../meteor';
import { pollGamepads } from '../gamepad';
import { doCollisions } from '../doCollisions';
import { AmmoPickup } from '../pickups/ammo.js';
import { ShieldPickup } from '../pickups/shield.js';
import { StarPickup } from '../pickups/star.js';
import { dontDetectNewInput } from '../detectInput';
import * as gameOver from '../gameOver';

var game;
var scenes;

function endGame() {
    // Pause the game and put win screen up?
    game.over = 1;
    game.places = [];
    // Give each player a position (1st, 2nd, etc)
    game.players.forEach(player => {
        game.places.push(player);
    });
    game.places.sort((p1, p2) => {
        if (p1.score > p2.score) {
            return -1;
        }
        if (p1.score < p2.score) {
            return 1;
        }
        // PLayer scores are the same so compare deaths
        if (p1.deaths < p2.deaths) {
            return -1;
        }
        if (p1.deaths > p2.deaths) {
            return 1;
        }
        // Player deaths are the same as well! So choose a player randomly
        return Math.round(Math.random() < .5 ? -1 : 1);
    });
    game.places.forEach((player, i) => {
        player.place = i;
    });
}

const gameLoop = GameLoop({  // create the main game loop
    update() { // update the game state
        pollGamepads();

        if (game.over) {
            game.over++;

            // Check for "readying to go to menu"

            // Players are already .ready from game start, so check for unready
            game.players.forEach(player => {
                if (player.controls === 'ai') {
                    player.ready = false;
                    return;
                }
                if (player.keys.accept() && game.over > 60) {
                    player.debounce.accept--;
                    if (player.debounce.accept <= 0) {
                        player.ready = !player.ready;
                        player.debounce.accept = 15;
                    }
                } else {
                    player.debounce.accept = 0;
                }
            });

            if (game.players.every(p => !p.ready)) {
                gameLoop.stop();
                scenes.startMainMenu(game, scenes);
            }
        }

        game.players.forEach(player => {
            player.update();
        });

        game.sprites.map(sprite => {
            sprite.update();

            if (sprite.type !== 'bullet') {
                if (sprite.x > game.width) {
                    sprite.x = 0;
                } else if (sprite.x < 0) {
                    sprite.x = game.width;
                }
                if (sprite.y > game.height) {
                    sprite.y = 0;
                } else if (sprite.y < 0) {
                    sprite.y = game.height;
                }
            }
        });

        doCollisions(game);

        // Remove dead & exploded sprite's hitboxes from the collision system
        game.sprites.forEach(sprite => {
            if (!sprite.isAlive() || sprite.exploded) {
                sprite.hitbox && sprite.hitbox.remove();
            }
        });

        // Remove dead sprites from the sprites list
        game.sprites = game.sprites.filter(sprite => sprite.isAlive());
        game.meteors = game.meteors.filter(sprite => sprite.isAlive());
        game.pickups = game.pickups.filter(sprite => sprite.isAlive());

        // Remove exploded ships from the both lists & the player
        game.sprites = game.sprites.filter(sprite => !sprite.exploded);

        if (!game.over) {
            game.players.forEach(player => {
                if (player.ship.exploded && player.ship.ttl) {
                    player.ship = {};
                    setTimeout(() => {
                        player.spawn();
                    }, 3000);
                }

                // Check if someone has won!
                // TODO: See if it's likely for 2 ships to get to 10 in same update
                if (player.score > 1) {
                    endGame();
                }
            });
        }

        if (game.meteors.length < 5 && Math.random() < .005) {
            createMeteor({
                x: Math.random() * game.width,
                y: Math.random() * game.height,
                radius: 20,
                game: game
            });
        }

        if (game.pickups.length < 1) {
            let rand = Math.random();
            let pickup = null;
            if (.000 < rand && rand < .001) {
                pickup = new AmmoPickup({
                    x: Math.random() * game.width,
                    y: Math.random() * game.height,
                    game: game
                });
            }
            if (.001 < rand && rand < .002) {
                pickup = new ShieldPickup({
                    x: Math.random() * game.width,
                    y: Math.random() * game.height,
                    game: game
                });
            }
            if (.002 < rand && rand < .0027) {
                pickup = new StarPickup({
                    x: Math.random() * game.width,
                    y: Math.random() * game.height,
                    game: game
                });
            }
            if (pickup) {
                game.sprites.push(pickup);
                game.pickups.push(pickup);
            }
        }

    },

    render() {
        // Render all the sprites
        game.sprites.map(sprite => sprite.render(game.scale));

        if (game.over) {
            gameOver.render(game);
        } else {
            // Render the player scores
            game.players.map((player, i) =>
                player.renderScore(i, game.players.length)
            );
        }

        // Render debug collision stuff
        // game.ctx.save();
        // game.ctx.scale(game.scale, game.scale);
        // game.ctx.strokeStyle = '#0F0';
        // game.ctx.beginPath();
        // game.cSystem.draw(game.ctx);
        // game.ctx.stroke();
        // game.ctx.restore();
    }
});

var game;

export function startGame(newGame, otherScenes) {
    game = newGame;
    scenes = otherScenes;

    dontDetectNewInput();

    game.meteors = [];
    game.pickups = [];
    game.sprites = [];
    game.over = 0;

    // Create new collision system & collision result object
    game.cSystem = new Collisions();
    game.cResult = game.cSystem.createResult();

    // Big asteroid in the middle (dioretsa)
    createMeteor({
        x: game.width / 2,
        y: game.height / 2,
        radius: Math.min(game.width / 5, game.height / 5),
        mass: 100000,
        dx: 0,
        dy: 0,
        dr: .1,
        game: game
    });

    game.players.forEach(player => {
        player.spawn();
    });

    gameLoop.start();
}
