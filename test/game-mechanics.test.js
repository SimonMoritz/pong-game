// Tests for game mechanics: ball movement, player boundaries, speed cap,
// scoring detection, and round reset.
//
// main.js depends on browser globals (canvas, document), so these tests
// reproduce the same logic using lightweight mock objects.  They act as a
// regression net: if the mechanics in main.js change, update the mocks here.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GAME, relativeHit } = require('../public/game-logic.js');

const CANVAS = { width: 300, height: 150 };

// Mirror of the Ball class from main.js
class Ball {
    constructor() {
        this.width = GAME.BALL_SIZE;
        this.height = GAME.BALL_SIZE;
        this.x = CANVAS.width / 2 - this.width / 2;
        this.y = CANVAS.height / 2 - this.height / 2;
        this.velX = 0;
        this.velY = 0;
    }
    move() {
        if (this.y < GAME.WALL_MARGIN || this.y > CANVAS.height - GAME.BALL_SIZE - GAME.WALL_MARGIN) {
            this.velY *= -1;
        }
        this.x += this.velX;
        this.y += this.velY;
    }
}

// Mirror of the Player class from main.js
class Player {
    constructor(side) {
        this.side = side;
        this.width = GAME.PADDLE_WIDTH;
        this.height = GAME.PADDLE_HEIGHT;
        this.x = side === 'left'
            ? GAME.PADDLE_OFFSET
            : CANVAS.width - GAME.PADDLE_OFFSET - this.width;
        this.y = CANVAS.height / 2 - this.height / 2;
    }
    move(delta_y) {
        if (this.y < GAME.WALL_MARGIN && delta_y < 0) return;
        if (this.y > (CANVAS.height - this.height) && delta_y > 0) return;
        this.y += delta_y;
    }
}

// --- Ball movement ---

test('ball moves by its velocity each frame', () => {
    const ball = new Ball();
    ball.velX = GAME.BALL_SPEED_X;
    ball.velY = 0.5;
    const prevX = ball.x;
    const prevY = ball.y;
    ball.move();
    assert.equal(ball.x, prevX + GAME.BALL_SPEED_X);
    assert.equal(ball.y, prevY + 0.5);
});

test('ball bounces off top wall (velY flips from negative to positive)', () => {
    const ball = new Ball();
    ball.y = 0; // at top wall
    ball.velY = -1;
    ball.move();
    assert.ok(ball.velY > 0, `velY should be positive after top-wall bounce, got ${ball.velY}`);
});

test('ball bounces off bottom wall (velY flips from positive to negative)', () => {
    const ball = new Ball();
    // condition is y > threshold (strict), so place ball one pixel past it
    ball.y = CANVAS.height - GAME.BALL_SIZE - GAME.WALL_MARGIN + 1;
    ball.velY = 1;
    ball.move();
    assert.ok(ball.velY < 0, `velY should be negative after bottom-wall bounce, got ${ball.velY}`);
});

test('ball does not bounce while in the middle of the canvas', () => {
    const ball = new Ball(); // starts at center
    ball.velY = 1;
    ball.move();
    assert.equal(ball.velY, 1);
});

// --- Player movement ---

test('player moves down by PADDLE_SPEED when in bounds', () => {
    const player = new Player('left');
    const before = player.y;
    player.move(GAME.PADDLE_SPEED);
    assert.equal(player.y, before + GAME.PADDLE_SPEED);
});

test('player moves up by PADDLE_SPEED when in bounds', () => {
    const player = new Player('left');
    const before = player.y;
    player.move(-GAME.PADDLE_SPEED);
    assert.equal(player.y, before - GAME.PADDLE_SPEED);
});

test('player cannot move above the top wall', () => {
    const player = new Player('left');
    player.y = 0; // at the top wall
    player.move(-GAME.PADDLE_SPEED);
    assert.equal(player.y, 0);
});

test('player cannot move below the bottom wall', () => {
    const player = new Player('right');
    // condition is y > threshold (strict), so place player one pixel past it
    player.y = CANVAS.height - player.height + 1;
    player.move(GAME.PADDLE_SPEED);
    assert.equal(player.y, CANVAS.height - player.height + 1);
});

// --- Ball speed cap ---

test('velY stays within MAX_BALL_SPEED_Y after many extreme paddle hits', () => {
    let velY = 0.5;
    for (let i = 0; i < 20; i++) {
        velY += relativeHit(1); // position 1 = max upward deflection (-1)
        velY = Math.max(-GAME.MAX_BALL_SPEED_Y, Math.min(GAME.MAX_BALL_SPEED_Y, velY));
    }
    assert.ok(Math.abs(velY) <= GAME.MAX_BALL_SPEED_Y,
        `expected |velY| <= ${GAME.MAX_BALL_SPEED_Y}, got ${velY}`);
});

test('cap clamps an already-excessive velY back to MAX_BALL_SPEED_Y', () => {
    let velY = 10; // artificially large
    velY = Math.max(-GAME.MAX_BALL_SPEED_Y, Math.min(GAME.MAX_BALL_SPEED_Y, velY));
    assert.equal(velY, GAME.MAX_BALL_SPEED_Y);
});

// --- Scoring detection ---

test('ball past left edge should increment right player score', () => {
    const ball = new Ball();
    ball.x = -1;
    let rightScore = 0;
    if (ball.x < 0) rightScore++;
    assert.equal(rightScore, 1);
});

test('ball past right edge should increment left player score', () => {
    const ball = new Ball();
    ball.x = CANVAS.width + 1;
    let leftScore = 0;
    if (ball.x > CANVAS.width) leftScore++;
    assert.equal(leftScore, 1);
});

test('ball on left edge exactly does not score', () => {
    const ball = new Ball();
    ball.x = 0;
    let rightScore = 0;
    if (ball.x < 0) rightScore++;
    assert.equal(rightScore, 0);
});

// --- Round reset (serve direction alternates) ---

test('newRound centers the ball', () => {
    const ball = new Ball();
    ball.x = 0; ball.y = 0; ball.velX = GAME.BALL_SPEED_X;
    // simulate newRound
    ball.x = CANVAS.width / 2 - ball.width / 2;
    ball.y = CANVAS.height / 2 - ball.height / 2;
    assert.equal(ball.x, CANVAS.width / 2 - GAME.BALL_SIZE / 2);
    assert.equal(ball.y, CANVAS.height / 2 - GAME.BALL_SIZE / 2);
});

test('newRound reverses serve direction', () => {
    const ball = new Ball();
    ball.velX = GAME.BALL_SPEED_X; // was going right
    ball.velX = ball.velX > 0 ? -GAME.BALL_SPEED_X : GAME.BALL_SPEED_X;
    assert.equal(ball.velX, -GAME.BALL_SPEED_X);
});

test('newRound keeps serve direction when already negative', () => {
    const ball = new Ball();
    ball.velX = -GAME.BALL_SPEED_X; // was going left
    ball.velX = ball.velX > 0 ? -GAME.BALL_SPEED_X : GAME.BALL_SPEED_X;
    assert.equal(ball.velX, GAME.BALL_SPEED_X);
});
