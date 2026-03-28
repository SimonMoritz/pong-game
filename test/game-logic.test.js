import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAME, relativeHit } from '../public/game-logic.js';

// --- GAME constants ---

test('GAME constants have expected values', () => {
    assert.equal(GAME.BALL_SIZE, 4);
    assert.equal(GAME.PADDLE_WIDTH, 5);
    assert.equal(GAME.PADDLE_HEIGHT, 34);
    assert.equal(GAME.PADDLE_OFFSET, 20);
    assert.equal(GAME.PADDLE_SPEED, 200);       // pixels per second
    assert.equal(GAME.BALL_SPEED_X, 150);       // pixels per second
    assert.equal(GAME.MAX_BALL_SPEED_X, 450);   // pixels per second
    assert.equal(GAME.WIN_SCORE, 10);
    assert.equal(GAME.WALL_MARGIN, 1);
    assert.equal(GAME.AI_MAX_SPEED, 120);       // pixels per second
    assert.equal(GAME.MAX_BALL_SPEED_Y, 300);   // pixels per second
});

// --- relativeHit ---

test('relativeHit returns 0 for center zone (positions 17-18)', () => {
    assert.equal(relativeHit(17), 0);
    assert.equal(relativeHit(18), 0);
});

test('relativeHit returns negative delta for upper zone (position < 17)', () => {
    const delta = relativeHit(6);
    assert.ok(delta < 0, `expected negative delta, got ${delta}`);
});

test('relativeHit returns positive delta for lower zone (position > 18)', () => {
    const delta = relativeHit(20);
    assert.ok(delta > 0, `expected positive delta, got ${delta}`);
});

test('relativeHit returns -1 at top edge (position 0)', () => {
    // (1 - 0/halfHeight)² = 1, negated for upper zone
    assert.equal(relativeHit(0), -1);
});

test('relativeHit returns 1 at bottom edge (position = PADDLE_HEIGHT)', () => {
    // distFromBottom = 0, (1 - 0/halfHeight)² = 1
    assert.equal(relativeHit(GAME.PADDLE_HEIGHT), 1);
});

test('relativeHit gives smaller delta further from paddle edge', () => {
    const deltaClose = Math.abs(relativeHit(2));
    const deltaFurther = Math.abs(relativeHit(5));
    assert.ok(deltaClose >= deltaFurther, 'closer to edge should give >= deflection');
});

test('relativeHit deflection is symmetric: top and bottom zones mirror each other', () => {
    // position 5 is 5 units from top edge (distance 5)
    // position 29 is 5 units from bottom edge (|29-34|=5)
    const topDelta = relativeHit(5);
    const bottomDelta = relativeHit(29);
    assert.ok(topDelta < 0, 'top zone delta should be negative');
    assert.ok(bottomDelta > 0, 'bottom zone delta should be positive');
    assert.equal(Math.abs(topDelta), Math.abs(bottomDelta));
});

test('relativeHit delta is between -1 and 1 for all valid positions', () => {
    for (let pos = 0; pos <= GAME.PADDLE_HEIGHT; pos++) {
        const delta = relativeHit(pos);
        assert.ok(delta >= -1 && delta <= 1,
            `relativeHit(${pos}) = ${delta} is out of [-1, 1] range`);
    }
});
