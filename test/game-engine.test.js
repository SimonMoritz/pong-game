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
    assert.equal(snapshot.subtitle, 'W / S · left    ↑ / ↓ · right');
    assert.equal(snapshot.scores.left, 0);
    assert.equal(snapshot.scores.right, 0);
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

test('winning a round resets the scoreboard and publishes the winner prompt', () => {
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
    assert.equal(result.state.scores.right, 0);
    assert.equal(result.state.prompt, 'AI wins!');
    assert.equal(result.state.subtitle, 'Click to play again');
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
    assert.equal(snapshot.subtitle, 'W / S · left    ↑ / ↓ · right');
    assert.equal(snapshot.scores.left, 3);
    assert.equal(snapshot.scores.right, 4);
    assert.equal(snapshot.aiEnabled, false);
});
