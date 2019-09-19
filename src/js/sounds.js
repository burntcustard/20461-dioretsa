import zzfx from './zzfx';

export const sound = {
    explodeShip:   () => zzfx(.5,.1,1100,.9,0,0,4,0,.4),       // ZzFX 24676
    explodeMeteor: () => zzfx(.2,.1,1100,.9,0,0,4,0,.4),       // ZzFX 24676
    respawn:       () => zzfx(.2,0,250,1,.7,0,0,38,.5),        // ZzFX 14035
    fire:          () => zzfx(.4,0,1300,.1,.3,6.1,0,15.9,.88), // ZzFX 95732
    beep:          () => zzfx(.2,0,1000,.2,.03,.1,.1,0,.86),   // ZzFX 42665
    thrusters:     () => zzfx(.3,.1,68,1,.07,0,3.6,0,.7),      // ZzFX 78097
    rewind:        () => zzfx(1,.1,11,.9,.5,2.5,.9,.4,.88),    // ZzFX 82235
    shieldPop:     () => zzfx(.6,0,134,.1,.2,.1,0,11.6,.13),   // ZzFX 26117
    rainbow:       () => zzfx(.2,.8,900,.1,.1,1.4,0,0,.7),     // ZzFX 1820
    scoreInc:      () => zzfx(.3,0,1993,.3,.1,.1,0,0,.8),      // ZzFX 38591
    getPickup:     () => zzfx(.3,0,51,.1,.6,2,.3,19,1),        // ZzFX 54138
}
