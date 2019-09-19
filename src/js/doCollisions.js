import { createMeteor } from './meteor';
import { bounce } from './bounce';
import * as util from './utility';
import { sound } from './sounds';

function doCollision(sprite1, sprite2, cResult, sprites) {

    // Shrapnel just gets pushed out the way
    if (sprite2.type === 'shrapnel') {
        if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {
            sprite2.x += cResult.overlap * cResult.overlap_x;
            sprite2.y += cResult.overlap * cResult.overlap_y;
        }
        return;
    }

    // Bullet collisions are handled by all the other individual types
    // if (sprite1.type === 'bullet') {
    //     if (sprite2.type === 'bullet') {
    //         return;
    //     }
    //     if (sprite2.type === 'meteor') {
    //         return;
    //     }
    //     if (sprite2.type === 'pickup') {
    //         return;
    //     }
    //     if (sprite2.type === 'ship') {
    //         return;
    //     }
    // }

    if (sprite1.type === 'meteor') {
        if (sprite2.type === 'bullet') {

            if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {
                sprite2.ttl = 0;
                //zzfx(.4,0,1000,.1,.1,.4,3,0,.55); // ZzFX 46683
                // sound.baseExplo() ???

                if (sprite1.mass < 1e4 && sprite1.radius > 8) {

                    // Split the meteor
                    for (var i = 0; i < 3; i++) {
                        createMeteor({
                            x: sprite1.x,
                            y: sprite1.y,
                            radius: sprite1.radius / 1.8,
                            game: sprite1.game
                        });
                    }
                    sprite1.ttl = 0
                    sound.explodeMeteor();
                } else if (sprite1.mass > 1e4) {
                    // TODO: Sparks or shrapnel or something?
                } else {
                    sprite1.explode(sprites);
                    sound.explodeMeteor();
                }
            }
            return;
        }

        if (sprite2.type === 'meteor') {
            if (sprite1.bounced || sprite2.bounced){
                return;
            }
            if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {
                bounce(sprite1, sprite2, cResult);
                // TODO: Meteor bouncey sound
            }
            return;
        }

        if (sprite2.type === 'pickup') {
            if (sprite1.bounced || sprite2.bounced){
                return;
            }
            if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {
                bounce(sprite1, sprite2, cResult);
                // TODO: Pickup/meteor bouncey sound
            }
            return;
        }

        // Handled in (sprite1.type === 'ship')
        // if (sprite2.type === 'ship') {
        //     return;
        // }
    }

    if (sprite1.type === 'pickup') {

        // Pickups don't interact with bullets at all (?)
        // if (sprite2.type === 'bullet') {
        //     return;
        // }

        // Handled in (sprite1.type === 'meteor')
        // if (sprite2.type === 'meteor') {
        //     return;
        // }

        // There should only be one pickup out at once, so they never collide
        // if (sprite2.type === 'pickup') {
        //     if (sprite1.bounced || sprite2.bounced){
        //         return;
        //     }
        //     if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {
        //         bounce(sprite1, sprite2, cResult);
        //     }
        //     return;
        // }

        // Handled in (sprite1.type === 'ship')
        // if (sprite2.type === 'ship') {
        //     return;
        // }
    }

    if (sprite1.type === 'ship') {
        if (sprite2.type === 'bullet') {
            // Can't collide with own bullets
            if (sprite2.owner === sprite1) {
                return;
            }

            if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {
                sprite2.owner.player.shotsLanded++;
                sprite2.ttl = 0;

                if (sprite1.rainbow) {
                    return;
                }

                if (sprite1.invuln) {
                    return;
                }

                if (sprite1.shield) {
                    sprite1.shieldDegrading = sprite1.shieldDegrading || 60;
                    return;
                }

                sprite1.explode(sprites);
                sprite2.owner.player.score++;
                sound.scoreInc();
            }
            return;
        }

        if (sprite2.type === 'meteor') {
            if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {

                if (sprite1.invuln) {
                    sprite1.x -= cResult.overlap * cResult.overlap_x;
                    sprite1.y -= cResult.overlap * cResult.overlap_y;
                    return;
                }

                if (sprite1.shield) {
                    sprite1.shieldDegrading = sprite1.shieldDegrading || 60;
                    sprite1.x -= cResult.overlap * cResult.overlap_x;
                    sprite1.y -= cResult.overlap * cResult.overlap_y;
                    return;
                }

                if (sprite1.rainbow) {
                    if (60 > sprite2.radius && sprite2.radius > 8) {

                        // Split the meteor
                        for (var i = 0; i < 3; i++) {
                            createMeteor({
                                x: sprite2.x,
                                y: sprite2.y,
                                radius: sprite2.radius / 1.8,
                                meteors: sprite2,
                                game: sprite2.game
                            });
                        }
                        sprite2.ttl = 0;
                        sound.explodeMeteor();
                    } else if (sprite2.radius > 60) {
                        sprite1.x -= cResult.overlap * cResult.overlap_x;
                        sprite1.y -= cResult.overlap * cResult.overlap_y;
                    } else {
                        sprite2.explode(sprites);
                        sound.explodeMeteor();
                    }
                    return;
                }

                // If the ship and the asteroid are both going super slow,
                // don't explode. Ideally this'd take into account mass etc.
                if (util.normalise(sprite1.velocity) < .3 &&
                    util.normalise(sprite2.velocity) < .3) {
                    sprite1.x -= cResult.overlap * cResult.overlap_x;
                    sprite1.y -= cResult.overlap * cResult.overlap_y;
                    return;
                }

                sprite1.explode(sprites);
                sprite1.player.crashes++;
            }
            return;
        }

        if (sprite2.type === 'pickup') {
            if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {
                sprite2.applyTo(sprite1);
                sound.getPickup();
                sprite2.ttl = 0;
            }
            return;
        }

        if (sprite2.type === 'ship') {
            if (sprite2.rewinding) {
                return;
            }
            if (sprite1.hitbox.collides(sprite2.hitbox, cResult)) {
                if (sprite1.rainbow && !sprite2.invuln) {
                    if (sprite1.shield) {
                        sprite2.x += cResult.overlap * cResult.overlap_x;
                        sprite2.y += cResult.overlap * cResult.overlap_y;
                        return;
                    }
                    if (sprite2.shield) {
                        sprite2.shieldDegrading = sprite2.shieldDegrading || 60;
                        sprite2.x += cResult.overlap * cResult.overlap_x;
                        sprite2.y += cResult.overlap * cResult.overlap_y;
                        return;
                    }
                    sprite2.explode();
                    sprite1.player.score++;
                    sound.scoreInc();
                    return;
                }

                sprite2.x += cResult.overlap * cResult.overlap_x;
                sprite2.y += cResult.overlap * cResult.overlap_y;
            }
            return;
        }
    }
}

/**
 * Handles updating the collision system, figuring out what collides,
 * and updating sprites based on the collision results.
 * @param  {[type]} sprites [description]
 * @param  {[type]} cSystem [description]
 * @param  {[type]} cResult [description]
 * @return {[type]}         [description]
 */
export function doCollisions({sprites, cSystem, cResult}) {

    // A reuseable list of sprites that might be colliding
    var potentials = {};

    // Update the collision system
    cSystem.update();

    // For every sprite, maybe check for collisions, and do stuff with 'em.
    // Note that the 'return's in here just skip the rest of current sprite
    sprites.forEach(sprite => {

        // If there's no hitbox, don't check for collisions (obviously?)
        if (!sprite.hitbox) {
            return;
        }

        // No collision-ing into things if you're a rewinding ship
        if (sprite.rewinding) {
            return;
        }

        potentials = sprite.hitbox.potentials();

        // If there are no potential collisions with this sprite, do nothin'
        if (!potentials) {
            return
        }

        for (const otherHitbox of potentials) {
            doCollision(sprite, otherHitbox.owner, cResult, sprites);
        }
    });

    sprites.forEach(sprite => {
        sprite.bounced = false;
    });
}
