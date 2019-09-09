/**
 * ~120 B
 */
export default () => {
    return {
        rof: 5,
        ror: 4,
        turnRate: 9,
        radius: 8,
        mass: 4,
        thrust: 8,
        ammo: 4,
        maxSpeed: 8,
        lines: {
            body: [
                [ -6, -7, -2, -6 ],
                [ -2, -6,  2, -2 ],
                [  2, -2,  7, -2 ],
                [  7, -2,  9,  0 ],
                [  9,  0,  7,  2 ],
                [  7,  2,  2,  2 ],
                [  2,  2, -2,  6 ],
                [ -2,  6, -6,  7 ],
                [ -6,  7, -3,  2 ],
                [ -3,  2, -5,  2 ],
                [ -5,  2, -5, -2 ],
                [ -5, -2, -3, -2 ],
                [ -3, -2, -6, -7 ]
            ],
            detail: [
                [ -4, -2,  2, -2 ],
                [ -4,  2,  2,  2 ]
            ],
            thrust: [
                [ -6, -1, -8,  0 ],
                [ -8,  0, -6,  1 ]
            ],
            hitbox: [
                [  6, -2 ],
                [  8,  0 ],
                [  6,  2 ],
                [  3,  2 ],
                [ -7,  7 ],
                [ -7, -7 ],
                [  3, -2 ]
            ]
        }
    }
}
