import { keyPressed } from 'kontra';
import { Ship } from './ship';
import { renderText } from './text';
import * as ai from './ai';
import getKeys from './controls';
import { sound } from './sounds';

let gamepadIndex = 0;

export class Player {
    constructor(props) {
        this.color = props.color;
        this.controls = props.controls;
        this.game = props.game;
        this.ctx = props.ctx;
        this.shipType = props.shipType;
        this.reset();

        // Is an AI player?
        if (this.controls === 'ai') {
            this.ready = true;
            return;
        }

        // Set control scheme
        if (this.controls === 'gamepad') {
            this.keys = getKeys(this.controls, gamepadIndex++);
            this.gamepadId = '';
            // Assign gamepadId & Remove misc characters before 'Joy-Con'
            if (props.gamepadId.match(/2006|2007/)) {
                this.gamepadId = 'Joy Con';
            }
            if (props.gamepadId.includes('Xbox')) {
                this.gamepadId = 'Xbox Controller';
            }
            if (props.gamepadId.includes('(L)')) {
                this.gamepadId += ' (L)';
            }
            if (props.gamepadId.includes('(R)')) {
                this.gamepadId += ' (R)';
            }
            // this.gamepadId = props.gamepadId.replace(/.*(?=Joy-)/g, '');
            // if (this.gamepadId.includes('Xbox')) {
            //     this.gamepadId = 'Xbox Controller';
            // }
        } else if (this.controls) {
            this.keys = getKeys(this.controls);
        }

        // For menu item / key debouncing so doesn't spam
        this.debounce = {
            up: 15,
            down: 15,
            left: 15,
            right: 15,
            accept: 15,
            back: 15
        };
    }

    reset() {
        this.crashes = 0;
        this.deaths = 0;
        this.ready = false;
        this.score = 0;
        this.shotsFired = 0;
        this.shotsLanded = 0;
    }

    handleKeyPresses() {
        if (this.ship && this.ship.isAlive && !this.game.over) {
            // Rewind is first here so it has priority over everything
            if (this.keys.rewind()) {
                this.ship.rewind();
            }

            if (this.keys.thrust()) {
                this.ship.engineOn();
            } else {
                this.ship.engineOff();
            }

            if (this.keys.left()) {
                this.ship.turnLeft();
            }

            if (this.keys.right()) {
                this.ship.turnRight();
            }

            if (this.keys.fire()) {
                this.ship.fire();
            }
        }
    }

    update() {
        if (this.controls === 'ai') {
            ai.update(this);
        } else if (this.controls) {
            this.handleKeyPresses();
        }
    }

    // Not used anymore to save a few bytes
    // scoreInc() {
    //     this.score++;
    // }
    //
    // scoreDec() {
    //     // Can't go lower than 0
    //     if (this.score > 0) {
    //         this.score--;
    //     }
    // }

    /**
     * Used to draw a "pretend" player ship for the menu
     * @return {[type]} [description]
     */
    pseudoSpawn(x, y) {

        // Remove the old ship from the game sprites if it's there
        if (this.game.sprites) {
            var oldShipIndex = this.game.sprites.indexOf(this.ship);

            if (oldShipIndex > -1) {
                this.game.sprites.splice(oldShipIndex, 1);
            }
        }

        this.ship = new Ship({
            pseudo: true,
            x: x,
            y: y,
            color: this.color,
            shipType: this.shipType,
            game: this.game,
            player: this,
            dr: 1,
            scale: 2,

            update() {
                this.rotation += this.dr
            }
        });
    }

    spawn() {
        // Create a whole new ship for the player

        this.ship = new Ship({
            x: 20 + Math.random() * (this.game.width - 40),
            y: 20 + Math.random() * (this.game.height - 40),
            color: this.color,
            shipType: this.shipType,
            game: this.game,
            player: this,

            update() {
                this.shipUpdate(); // Calls this.advance() itself
            }
        });

        this.game.sprites.push(this.ship);

        sound.respawn();

        this.ship.invuln = 3; // Invulnerability for 3 seconds while respawning
    }

    renderScore(i, numPlayers) {
        var textProps = {
            color: this.color,
            ctx: this.ctx,
            alignCenter: true,
            x: this.game.width / 2 + i * 26 -
            (numPlayers > 2 ?
                // More than 2 players? Set x based on drawing on 2 lines
                Math.round(numPlayers / 2) * 13 +
                (i < numPlayers / 2 ?
                    0 // Line 1
                    : Math.round(numPlayers / 2) * 26 // Line 2
                ) - 13
                // 2 players? Set x based on drawing all on 1 line
                : 13
            ),
            y: this.game.height / 2 + (i < numPlayers / 2 ? -1 : 1) * (numPlayers > 2 ? 15 : 0),
            text: this.score,
            scale: this.game.scale,
            size: this.score > 8 ? 1.4 : 1
        };

        renderText(textProps);
    }
}
