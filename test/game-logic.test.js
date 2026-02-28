const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GAME, relativeHit } = require('../public/game-logic.js');

// --- GAME constants ---

test('GAME constants have expected values', () => {
    assert.equal(GAME.BALL_SIZE,       4);
    assert.equal(GAME.PADDLE_WIDTH,    5);
    assert.equal(GAME.PADDLE_HEIGHT,   26);
    assert.equal(GAME.PADDLE_OFFSET,   20);
    assert.equal(GAME.PADDLE_SPEED,    2);
    assert.equal(GAME.BALL_SPEED_X,    1.5);
    assert.equal(GAME.WIN_SCORE,       10);
    assert.equal(GAME.WALL_MARGIN,     1);
    assert.equal(GAME.AI_MAX_SPEED,    1.6);
    assert.equal(GAME.MAX_BALL_SPEED_Y, 3);
});

// --- relativeHit ---

test('relativeHit returns 0 for center zone (positions 13-14)', () => {
    assert.equal(relativeHit(13), 0);
    assert.equal(relativeHit(14), 0);
});

test('relativeHit returns negative delta for upper zone (position < 13)', () => {
    const delta = relativeHit(6);
    assert.ok(delta < 0, `expected negative delta, got ${delta}`);
});

test('relativeHit returns positive delta for lower zone (position > 14)', () => {
    const delta = relativeHit(20);
    assert.ok(delta > 0, `expected positive delta, got ${delta}`);
});

test('relativeHit caps delta at 1 for extreme upper position', () => {
    // position=1 → 1/1 = 1, capped at 1, returned as -1
    assert.equal(relativeHit(1), -1);
});

test('relativeHit caps delta at 1 for extreme lower position', () => {
    // position=25 → newPos = |25-26| = 1, 1/1 = 1, capped at 1
    assert.equal(relativeHit(25), 1);
});

test('relativeHit gives smaller delta further from paddle edge', () => {
    const deltaClose  = Math.abs(relativeHit(2));
    const deltaFurther = Math.abs(relativeHit(5));
    assert.ok(deltaClose >= deltaFurther, 'closer to edge should give >= deflection');
});

test('relativeHit deflection is symmetric: top and bottom zones mirror each other', () => {
    // position 5 is 8 units from top (distance 5)
    // position 21 is 5 units from bottom edge (|21-26|=5)
    const topDelta    = relativeHit(5);
    const bottomDelta = relativeHit(21);
    assert.ok(topDelta < 0,    'top zone delta should be negative');
    assert.ok(bottomDelta > 0, 'bottom zone delta should be positive');
    assert.equal(Math.abs(topDelta), Math.abs(bottomDelta));
});

test('relativeHit delta is between -1 and 1 for all valid positions', () => {
    for (let pos = 0; pos <= GAME.PADDLE_HEIGHT; pos++) {
        if (pos === 0) continue; // tested separately below
        const delta = relativeHit(pos);
        assert.ok(delta >= -1 && delta <= 1,
            `relativeHit(${pos}) = ${delta} is out of [-1, 1] range`);
    }
});

test('relativeHit(0) returns -1, not Infinity (1/0 is guarded by Math.min cap)', () => {
    // 1/0 === Infinity in JS, but Math.min(1, Infinity) === 1, so result is -1
    assert.equal(relativeHit(0), -1);
});
