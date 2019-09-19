import { keyPressed } from 'kontra';
import { Sprite } from './sprite';
import * as util from './utility';
import { ships } from './ships/import';
import { createBullet } from './bullet';
import { createShrapnel } from './shrapnel';
import { sound } from './sounds';

export class Ship extends Sprite.class {

    /**
     * Rotation, width, x, y, color, are all set automagically by Sprite
     * @param {[type]} props [description]
     */
    constructor(props) {
        super(props);

        this.game = props.game;
        // The stats & info for the ship loaded from /ships/*.js
        var shipData = JSON.parse(JSON.stringify(ships[props.shipType]));
        this.shipData = shipData;

        // Default properties for all ships
        this.ammoCurrent = shipData.ammo;
        this.fireDt = 0;
        this.lines = {};
        this.lines.random = [];
        this.history = [];
        this.rainbow = 0;
        this.rewindDt = 0;
        this.rewinding = 0;
        this.rewindSpeed = 5; // E.g. rewind time 5* faster than realtime
        this.type = 'ship';
        this.rotation = Math.random() * 360;
        this.dr = props.dr || 0;

        // Modify these values defined in shipData specs to make less crazy
        this.rof = shipData.rof;
        this.ror = 4; // shipData.ror; // All same to save 8 B sigh
        this.ammo = shipData.ammo;
        this.mass = shipData.mass + 11;
        this.radius = 7; // shipData.radius; // All same to save 2 B
        this.rof = 1 / 5; // this.rof; // All the same to save 2 B
        this.thrust = shipData.thrust + 6;
        this.turnRate = (shipData.turnRate + 11) / 4; // 3 -> 5 degrees/s
        this.maxSpeed = (this.shipData.maxSpeed + 6) / 12;

        // Useful stuff to have references to
        this.player = props.player;

        // Ship "model" information
        this.lines.body = shipData.lines.body || [];
        this.lines.detail = shipData.lines.detail || [];
        this.lines.thrust = shipData.lines.thrust || [];
        this.lines.hitbox = shipData.lines.hitbox || [];

        // Merge body & detail into 'ship' line array for doing fun effects etc
        this.lines.ship = this.lines.body.concat(this.lines.detail);

        // If it's not a "real" ship, return now before hitboxy stuff
        if (props.pseudo) {
            return;
        }

        // Hitbox related properties
        // If the ship doesn't have a collision box defined, use it's body
        // Assumes that the body is a consecutive set of lines
        // (e.g. line end coords match the following line start coords)
        if (!this.lines.hitbox.length) {
            this.lines.hitbox = [];
            this.lines.body.forEach(line => {
                this.lines.hitbox.push([line[0], line[1]]);
            });
        }
        this.hitbox = this.game.cSystem.createPolygon(
            this.x,
            this.y,
            this.lines.hitbox
        );
        this.hitbox.scale = this.scale;
        this.hitbox.owner = this;
    }

    addShield() {
        // Remove the normal hitbox
        this.hitbox.remove();

        this.shield = 1;
        this.shieldDegrading = 0;
        this.hitbox = this.game.cSystem.createCircle(
            this.x,
            this.y,
            this.radius + 4
        );
        this.hitbox.owner = this; // Re-add the hitbox owner
    }

    removeShield() {
        this.hitbox.remove();
        this.shield = 0;

        // Re-add normal hitbox
        this.hitbox = this.game.cSystem.createPolygon(
            this.x,
            this.y,
            this.lines.hitbox
        );
        this.hitbox.scale = this.scale;
        this.hitbox.owner = this;
    }

    /**
     * Pew pew a bullet out.
     *
     * Can't do it if:
     *  - Fired recently
     *  - Rewinding
     * @param  {[type]} sprites [description]
     * @return {[type]}         [description]
     */
    fire() {
        if (this.fireDt < this.rof ||
            this.ammoCurrent < 1 ||
            this.rewinding) {
            return false;
        }

        const cos = Math.cos(util.degToRad(this.rotation));
        const sin = Math.sin(util.degToRad(this.rotation));

        sound.fire();

        this.fireDt = 0;
        this.ammoCurrent--;
        this.player.shotsFired++;

        // Knockback (hass less effect for ships with greater mass)
        this.dx -= cos / (this.mass / 2);
        this.dy -= sin / (this.mass / 2);

        createBullet(this);
    }

    turnLeft() {
        this.rotation -= this.turnRate;
    }

    turnRight() {
        this.rotation += this.turnRate;
    }

    /**
     * Push the ship forward. Takes into account the ships thrust & mass.
     *
     * Can't do it if:
     *  - Rewinding
     * TODO: Rocket engine noises
     * @return {[type]} [description]
     */
    engineOn() {
        if (this.rewinding) {
            return false;
        }

        const cos = Math.cos(util.degToRad(this.rotation));
        const sin = Math.sin(util.degToRad(this.rotation));

        if (Math.random() < .05) {
            sound.thrusters();
        }

        // a = F / m (Newton's 2nd law of motion)
        this.ddx = cos * .1 * this.thrust / this.mass;
        this.ddy = sin * .1 * this.thrust / this.mass;
    }

    /**
     * Remove acceleration if the ship isn't thrusting this update
     * @return {[type]} [description]
     */
    engineOff() {
        this.ddx = this.ddy = 0;
    }

    /**
     * (Start going) back in time
     *
     * Can't be done if the ship already did it recently.
     * @return {[type]} [description]
     */
    rewind() {
        if (this.rewindDt <= this.ror) {
            return false;
        }

        sound.rewind();
        this.rewindDt = 0;
        this.rewinding = this.history.length;
    }

    shipUpdate() {

        // Keep the ships rotation between 0 and 360 (makes AI simpler)
        if (this.rotation > 360) {
            this.rotation -= 360;
        }
        if (this.rotation < 0) {
            this.rotation += 360;
        }

        if (this.shieldDegrading) {
            this.shieldDegrading--;
            if (this.shieldDegrading === 0) {
                sound.shieldPop();
                this.removeShield();
            }
        }

        if (this.rewindDt < this.ror) {
            this.rewindDt += 1 / 60;
        }

        this.fireDt += 1 / 60;

        if (this.invuln > 0) {
            this.invuln -= 1 / 60;
        } else {
            this.invuln = 0;
        }

        if (this.rainbow > 0) {
            this.rainbow -= 1 / 60;
            if (Math.floor(this.rainbow * 12) % 2) { // every 15 frames
                sound.rainbow();
            }
            if (this.rainbow <= 0) {
                this.maxSpeed = (this.shipData.maxSpeed + 6) / 12;
                this.rainbow = 0;
            }
        }

        if (this.rewinding > 0) {
            this.rewinding = this.rewinding - this.rewindSpeed;

            // If something borked (can't go back that far?) cancel rewind
            if (!this.history[this.rewinding]) {
                this.rewinding = 0;
                return false;
            }

            // More x and y coordinates "back in time"
            if (this.rewinding < this.history.length) {
                this.x = this.history[this.rewinding].x;
                this.y = this.history[this.rewinding].y;
            }

            // Last rewind update, lose 20% velocity and be invulnerable .2s
            // (which is just long enough not to do the flashy flashy)
            //  - and get ammo back!
            if (this.rewinding === 0) {
                this.dx *= .8;
                this.dy *= .8;
                this.invuln = .2;
                this.ammoCurrent = this.history[0].ammo;
                this.rainbow = this.history[0].rainbow;
            }

            return true; // Don't do any other ship updating this game update
        }

        if (this.ammoCurrent < this.ammo) {
            this.ammoCurrent += (1 / 60) * .5;
        }

        this.velocity = this.velocity.add(this.acceleration);

        // Apply max speed cap & "drag" (pretend the ship is thrusting back)
        util.slow(this.velocity, this.mass, this.maxSpeed);

        this.position = this.position.add(this.velocity);

        // Record current location & info into rewind history
        this.history.push({
            x: this.x,
            y: this.y,
            ammo: this.ammoCurrent,
            rainbow: this.rainbow
        });
        // Remove last update location from location history
        // 120 (frames) means rewind goes back 2s in time
        if (this.history.length > 120) {
            this.history.shift();
        }

        this.hitbox.x = this.x;
        this.hitbox.y = this.y;
        this.hitbox.angle = util.degToRad(this.rotation);
    }

    explode() {
        this.exploded = true;

        if (this.player) {
            this.player.deaths++;
        }

        sound.explodeShip();

        // Create new line sprites where the ship lines were
        this.lines.ship.forEach(line => {
            createShrapnel(line, this);
        });
    }

    pseudoRender(scale, x, y) {
        this.ctx.save();
        this.ctx.scale(scale, scale);
        this.ctx.translate(x, y);
        this.ctx.rotate(util.degToRad(this.rotation));
        this.ctx.strokeStyle = this.color;
        this.ctx.scale(3, 3);
        this.ctx.beginPath();

        this.ctx.lineWidth = .8;

        this.ctx.moveTo(this.lines.body[0][0], this.lines.body[0][1]);
        for (var i = 0; i < this.lines.body.length - 1; i++) {
            this.ctx.lineTo(this.lines.body[i][2], this.lines.body[i][3]);
        }
        this.ctx.closePath();

        this.lines.detail.forEach(line => {
            this.ctx.moveTo(line[0], line[1]);
            this.ctx.lineTo(line[2], line[3]);
        });

        this.ctx.stroke();

        this.ctx.restore();
    }

    renderUI(scale) {
        this.ctx.strokeStyle = '#0ef';

        // Draw ammo
        var ammoAngle = .2 * Math.PI * 1 / this.ammo;
        var gap = .05; // Gap between segments in radians
        for (let i = 0; i < Math.floor(this.ammoCurrent); i++) {
            this.ctx.beginPath();
            this.ctx.arc(
                0,
                0,
                this.radius + 6,
                Math.PI - (.2 * Math.PI * 1) + ammoAngle * i * 2,
                Math.PI + (ammoAngle * 2 - gap) - (.2 * Math.PI) + ammoAngle * i * 2
            );
            this.ctx.stroke();
        }

        // Draw rewind recharge
        if (this.rewindDt <= this.ror) {
            this.ctx.strokeStyle = '#0ef9';
        }
        this.ctx.beginPath();
        this.ctx.arc(
            0,
            0,
            this.radius + 6,
            -.2 * Math.PI * 1 / this.ror * this.rewindDt,
            +.2 * Math.PI * 1 / this.ror * this.rewindDt
        );

        this.ctx.stroke();
    }

    render(scale) {
        this.ctx.save();
        this.ctx.scale(scale, scale);
        this.ctx.translate(this.x, this.y);

        // Draw rewinding cooldown bar and ammo without rotation
        this.renderUI(scale);

        this.ctx.rotate(util.degToRad(this.rotation));

        // Draw
        this.ctx.strokeStyle = this.color;

        if (this.invuln) {
            // invuln is 1 / 60, and want to flash every 15 frames...
            if (Math.floor(this.invuln * 4 + .1) % 2) {
                this.ctx.lineWidth = .5;
            }
        }

        if (this.rainbow) {
            this.tmpColor = this.tmpColor || '';
            // rainbow is 1 / 60, and want to change every 5 frames...
            if (Math.floor(this.rainbow * 12) % 2) {
                this.tmpColor = 'hsl(' + Math.random() * 360 + ',100%,60%)';
            }
            this.ctx.strokeStyle = this.tmpColor;
        }

        this.ctx.beginPath();

        // Draw circle around ship for debugging
        // this.ctx.beginPath();  // start drawing a shape
        // this.ctx.arc(0, 0, this.radius * this.scale + 3, 0, Math.PI * 2);
        // this.ctx.stroke();

        if (this.rewinding) {
            this.rewindFrame = this.rewindFrame || 1;
            if (this.rewindFrame === 1) {
                this.lines.random = [];
                this.lines.ship.forEach(line => {
                    this.lines.random.push([
                        line[0] * Math.random(),
                        line[1] * Math.random(),
                        line[2] * Math.random(),
                        line[3] * Math.random()
                    ]);
                });
            }
            this.rewindFrame = this.rewindFrame < 4 ? this.rewindFrame + 1 : 1;

            this.lines.random.forEach(line => {
                this.ctx.moveTo(line[0], line[1]);
                this.ctx.lineTo(line[2], line[3]);
            });

            this.ctx.stroke();

        } else {

            this.ctx.moveTo(this.lines.body[0][0], this.lines.body[0][1]);
            for (var i = 0; i < this.lines.body.length - 1; i++) {
                this.ctx.lineTo(this.lines.body[i][2], this.lines.body[i][3]);
            }
            this.ctx.closePath();

            this.lines.detail.forEach(line => {
                this.ctx.moveTo(line[0], line[1]);
                this.ctx.lineTo(line[2], line[3]);
            });

            if (this.ddx || this.ddy) {
                this.lines.thrust.forEach((line, i) => {
                    // If x,y of 1st point of new line match 2nd point of prev
                    if (i > 0 &&
                        this.lines.thrust[i - 1][2] === line[0] &&
                        this.lines.thrust[i - 1][3] === line[1]) {
                        // Draw line connected to previous
                        this.ctx.lineTo(line[2], line[3]);
                    } else {
                        // Draw line NOT connect to previous
                        this.ctx.moveTo(line[0], line[1]);
                        this.ctx.lineTo(line[2], line[3]);
                    }
                });
            }

            this.ctx.stroke();

            if (this.shield === 1) {
                this.ctx.beginPath();
                this.ctx.arc(
                    0,
                    0,
                    this.radius + 4,
                    0,
                    2 * Math.PI
                );

                if (this.shieldDegrading) {
                    if (Math.floor(this.shieldDegrading / 15) % 2) {
                        this.ctx.lineWidth = .5;
                    }
                }

                this.ctx.strokeStyle = '#fff';
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }
}
