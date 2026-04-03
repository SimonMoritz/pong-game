import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAME } from '../public/game-logic.js';
import {
    createGameState,
    getGameSnapshot,
    resizeGameState,
    setAiEnabled,
    startGame,
    stepGame,
    stopGame,
} from '../public/game-engine.js';

const CANVAS = { width: 300, height: 150 };

test('createGameState starts paused with the default prompt', () => {
    const state = createGameState(CANVAS, { random: () => 0.5 });
    const snapshot = getGameSnapshot(state);

    assert.equal(snapshot.playing, false);
    assert.equal(snapshot.prompt, 'Click to play');
    assert.equal(snapshot.subtitle, 'W / S · move paddle');
    assert.equal(snapshot.scores.left, 0);
    assert.equal(snapshot.scores.right, 0);
});

test('createGameState shows both player controls when AI is disabled', () => {
    const state = createGameState(CANVAS, { random: () => 0.5, aiEnabled: false });
    const snapshot = getGameSnapshot(state);

    assert.equal(snapshot.subtitle, 'W / S · left    ↑ / ↓ · right');
});

test('startGame and stopGame toggle the playing flag without mutating scores', () => {
    const state = createGameState(CANVAS, { random: () => 0.5 });

    startGame(state);
    assert.equal(getGameSnapshot(state).playing, true);

    stopGame(state);
    assert.equal(getGameSnapshot(state).playing, false);
    assert.equal(getGameSnapshot(state).scores.left, 0);
    assert.equal(getGameSnapshot(state).scores.right, 0);
});

test('stepGame emits a wallBounce event when the ball hits a wall', () => {
    const state = createGameState(CANVAS, { random: () => 0.5 });

    startGame(state);
    state.ball.y = 0;
    state.ball.velY = -100;

    const result = stepGame(state, {
        w: false,
        s: false,
        arrowUp: false,
        arrowDown: false,
    }, 0.01);

    assert.deepEqual(result.events, ['wallBounce']);
    assert.ok(state.ball.velY > 0, `velY should be positive after bounce, got ${state.ball.velY}`);
});

test('stepGame increments the right score when the ball exits the left edge', () => {
    const state = createGameState(CANVAS, { random: () => 0.5 });

    startGame(state);
    state.ball.x = -1;
    state.ball.velX = 0;
    state.ball.velY = 0;

    const result = stepGame(state, {
        w: false,
        s: false,
        arrowUp: false,
        arrowDown: false,
    }, 0);

    assert.deepEqual(result.events, ['score']);
    assert.equal(result.state.scores.right, 1);
    assert.equal(result.state.ball.x, CANVAS.width / 2 - result.state.ball.width / 2);
    assert.equal(result.state.ball.y, CANVAS.height / 2 - result.state.ball.height / 2);
});

test('stepGame emits a paddleHit event when the ball hits the left paddle', () => {
    const state = createGameState(CANVAS, { random: () => 0.5 });

    startGame(state);
    state.leftPlayer.y = 50;
    state.ball.x = state.config.PADDLE_OFFSET + 1;
    state.ball.y = state.leftPlayer.y + state.leftPlayer.height / 2;
    state.ball.velX = -state.config.BALL_SPEED_X;
    state.ball.velY = 0;

    const result = stepGame(state, {
        w: false,
        s: false,
        arrowUp: false,
        arrowDown: false,
    }, 0);

    assert.deepEqual(result.events, ['paddleHit']);
    assert.ok(state.ball.velX > 0, `velX should be positive after paddle hit, got ${state.ball.velX}`);
});

test('winning a round stops the game and publishes the winner prompt with final scores', () => {
    const state = createGameState(CANVAS, { random: () => 0.5 });

    startGame(state);
    state.rightScore = GAME.WIN_SCORE - 1;
    state.ball.x = -1;
    state.ball.velX = 0;

    const result = stepGame(state, {
        w: false,
        s: false,
        arrowUp: false,
        arrowDown: false,
    }, 0);

    assert.deepEqual(result.events, ['score']);
    assert.equal(result.state.playing, false);
    assert.equal(result.state.scores.left, 0);
    assert.equal(result.state.scores.right, GAME.WIN_SCORE);
    assert.equal(result.state.prompt, 'AI wins');
    assert.equal(result.state.subtitle, 'Click to play again');
});

test('winning against the AI publishes the human winner prompt with final scores', () => {
    const state = createGameState(CANVAS, { random: () => 0.5, aiEnabled: true });

    startGame(state);
    state.leftScore = GAME.WIN_SCORE - 1;
    state.ball.x = CANVAS.width + 1;
    state.ball.velX = 0;

    const result = stepGame(state, {
        w: false,
        s: false,
        arrowUp: false,
        arrowDown: false,
    }, 0);

    assert.deepEqual(result.events, ['score']);
    assert.equal(result.state.playing, false);
    assert.equal(result.state.scores.left, GAME.WIN_SCORE);
    assert.equal(result.state.scores.right, 0);
    assert.equal(result.state.prompt, 'Human wins!');
    assert.equal(result.state.subtitle, 'Click to play again');
});

test('stepGame moves the AI paddle toward the ball when AI is enabled', () => {
    const state = createGameState(CANVAS, { random: () => 0.5 });
    const startY = state.rightPlayer.y;

    startGame(state);
    state.ball.y = state.rightPlayer.y + state.rightPlayer.height + 20;

    stepGame(state, {
        w: false,
        s: false,
        arrowUp: false,
        arrowDown: false,
    }, 0.1);

    assert.ok(state.rightPlayer.y > startY,
        `AI paddle should move down toward the ball, got ${state.rightPlayer.y} from ${startY}`);
});

test('resizeGameState preserves scores but resets play state to the default prompt', () => {
    const state = createGameState(CANVAS, { random: () => 0.5 });

    startGame(state);
    state.leftScore = 3;
    state.rightScore = 4;
    setAiEnabled(state, false);

    const snapshot = resizeGameState(state, { width: 600, height: 300 });

    assert.equal(snapshot.playing, false);
    assert.equal(snapshot.prompt, 'Click to play');
    assert.equal(snapshot.subtitle, 'W / S · left    ↑ / ↓ · right');  // AI is off
    assert.equal(snapshot.scores.left, 3);
    assert.equal(snapshot.scores.right, 4);
    assert.equal(snapshot.aiEnabled, false);
});
