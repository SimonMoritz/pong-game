import { GAME, scaledConfig, relativeHit, Ball, Player } from './game-logic.js';

const DEFAULT_PROMPT = 'Click to play';
const AI_SUBTITLE = 'W / S · move paddle';
const TWO_PLAYER_SUBTITLE = 'W / S · left    ↑ / ↓ · right';
const MOBILE_PROMPT = 'Tap to play';
const MOBILE_SUBTITLE = null;
const RESTART_SUBTITLE = 'Click to play again';
const MOBILE_RESTART_SUBTITLE = 'Tap to play again';

function defaultSubtitle(state) {
    if (state.mobile) return MOBILE_SUBTITLE;
    return state.aiEnabled ? AI_SUBTITLE : TWO_PLAYER_SUBTITLE;
}
const SERVE_DELAY = 1.0;

// --- State creation ---

export function createGameState(viewport, options = {}) {
    const mobile = options.mobile ?? false;
    const state = {
        viewport: {
            width: viewport.width,
            height: viewport.height,
        },
        config: null,
        ball: null,
        leftPlayer: null,
        rightPlayer: null,
        leftScore: 0,
        rightScore: 0,
        aiEnabled: options.aiEnabled ?? true,
        mobile,
        playing: false,
        serveDelay: 0,
        prompt: mobile ? MOBILE_PROMPT : DEFAULT_PROMPT,
        subtitle: null,
        randomSource: options.random ?? Math.random,
    };

    state.subtitle = defaultSubtitle(state);
    initialiseEntities(state);

    return state;
}

export function resizeGameState(state, viewport) {
    state.viewport = {
        width: viewport.width,
        height: viewport.height,
    };
    state.playing = false;
    state.prompt = state.mobile ? MOBILE_PROMPT : DEFAULT_PROMPT;
    state.subtitle = defaultSubtitle(state);

    initialiseEntities(state);

    return getGameSnapshot(state);
}

// --- State transitions ---

export function setAiEnabled(state, value) {
    state.aiEnabled = value;
    if (!state.playing && state.prompt && !state.leftScore && !state.rightScore) {
        state.subtitle = defaultSubtitle(state);
    }
    return getGameSnapshot(state);
}

export function startGame(state) {
    state.leftScore = 0;
    state.rightScore = 0;
    state.playing = true;
    state.prompt = null;
    state.subtitle = null;
    initialiseEntities(state);
    return getGameSnapshot(state);
}

export function stopGame(state) {
    state.playing = false;
    return getGameSnapshot(state);
}

export function stepGame(state, input, dt) {
    const events = [];

    if (!state.playing) {
        return {
            state: getGameSnapshot(state),
            events,
        };
    }

    applyPlayerInput(state, input, dt);

    if (state.serveDelay > 0) {
        state.serveDelay = Math.max(0, state.serveDelay - dt);
    } else {
        if (state.ball.move(dt)) {
            events.push('wallBounce');
        }

        if (state.ball.velX < 0) {
            if (reflectLeft(state)) {
                events.push('paddleHit');
            }
        } else if (reflectRight(state)) {
            events.push('paddleHit');
        }

        if (checkIfBallOutOfBounds(state)) {
            events.push('score');
        }
    }

    return {
        state: getGameSnapshot(state),
        events,
    };
}

// --- Snapshot ---

export function getGameSnapshot(state) {
    return {
        ball: toEntitySnapshot(state.ball),
        leftPlayer: toEntitySnapshot(state.leftPlayer),
        rightPlayer: toEntitySnapshot(state.rightPlayer),
        scores: {
            left: state.leftScore,
            right: state.rightScore,
        },
        aiEnabled: state.aiEnabled,
        playing: state.playing,
        prompt: state.prompt,
        subtitle: state.subtitle,
    };
}

// --- Internal helpers ---

function initialiseEntities(state) {
    state.config = scaledConfig(state.viewport);
    state.ball = new Ball(state.viewport, state.config);
    state.leftPlayer = new Player('left', state.viewport, state.config);
    state.rightPlayer = new Player('right', state.viewport, state.config);
    state.ball.velX = state.config.BALL_SPEED_X;
    state.ball.velY = randomServeVelocity(state);
}

function applyPlayerInput(state, input, dt) {
    if (state.aiEnabled) {
        moveAiPaddle(state, dt);
    } else {
        if (input.rightTouchY != null) {
            moveTowardY(state.rightPlayer, input.rightTouchY, state.config.PADDLE_SPEED, dt);
        } else {
            if (input.arrowDown) state.rightPlayer.move(state.config.PADDLE_SPEED, dt);
            if (input.arrowUp) state.rightPlayer.move(-state.config.PADDLE_SPEED, dt);
        }
    }

    if (input.leftTouchY != null) {
        moveTowardY(state.leftPlayer, input.leftTouchY, state.config.PADDLE_SPEED, dt);
    } else {
        if (input.s) state.leftPlayer.move(state.config.PADDLE_SPEED, dt);
        if (input.w) state.leftPlayer.move(-state.config.PADDLE_SPEED, dt);
    }
}

function moveTowardY(player, targetY, speed, dt) {
    const paddleCenter = player.y + player.height / 2;
    const diff = targetY - paddleCenter;
    const maxMove = speed * dt;
    const step = Math.min(Math.abs(diff), maxMove);
    const direction = diff > 0 ? step / dt : -step / dt;
    if (dt > 0) player.move(direction, dt);
}

function moveAiPaddle(state, dt) {
    const paddleCenter = state.rightPlayer.y + state.rightPlayer.height / 2;
    const ballCenter = state.ball.y + state.ball.height / 2;
    const diff = ballCenter - paddleCenter;
    const maxMove = state.config.AI_MAX_SPEED * dt;
    const step = Math.min(Math.abs(diff), maxMove);
    const speed = dt > 0 ? step / dt : 0;
    state.rightPlayer.move(diff > 0 ? speed : -speed, dt);
}

function reflectLeft(state) {
    const { ball, leftPlayer, config } = state;

    if (config.PADDLE_OFFSET <= ball.x && ball.x <= config.PADDLE_OFFSET + leftPlayer.width) {
        const relativeBallPosition = ball.y - leftPlayer.y;
        if (0 <= relativeBallPosition && relativeBallPosition <= leftPlayer.height) {
            ball.velX *= -1;
            const newSpeed = Math.min(Math.abs(ball.velX) * 1.05, config.MAX_BALL_SPEED_X);
            ball.velX = ball.velX < 0 ? -newSpeed : newSpeed;
            ball.velY += relativeHit(relativeBallPosition, config) * config.BALL_SPEED_X;
            ball.velY = clamp(ball.velY, -config.MAX_BALL_SPEED_Y, config.MAX_BALL_SPEED_Y);
            return true;
        }
    }

    return false;
}

function reflectRight(state) {
    const { ball, rightPlayer, config, viewport } = state;
    const rightEdge = viewport.width - config.PADDLE_OFFSET - rightPlayer.width;

    if (rightEdge <= ball.x && ball.x <= viewport.width - config.PADDLE_OFFSET) {
        const relativeBallPosition = ball.y - rightPlayer.y;
        if (0 <= relativeBallPosition && relativeBallPosition <= rightPlayer.height) {
            ball.velX *= -1;
            const newSpeed = Math.min(Math.abs(ball.velX) * 1.05, config.MAX_BALL_SPEED_X);
            ball.velX = ball.velX < 0 ? -newSpeed : newSpeed;
            ball.velY += relativeHit(relativeBallPosition, config) * config.BALL_SPEED_X;
            ball.velY = clamp(ball.velY, -config.MAX_BALL_SPEED_Y, config.MAX_BALL_SPEED_Y);
            return true;
        }
    }

    return false;
}

function checkIfBallOutOfBounds(state) {
    if (state.ball.x < 0) {
        incrementScore(state, 'right');
        newRound(state);
        return true;
    }

    if (state.viewport.width < state.ball.x) {
        incrementScore(state, 'left');
        newRound(state);
        return true;
    }

    return false;
}

function incrementScore(state, side) {
    const restartSub = state.mobile ? MOBILE_RESTART_SUBTITLE : RESTART_SUBTITLE;
    if (side === 'left') {
        state.leftScore++;
        if (state.leftScore >= GAME.WIN_SCORE) {
            state.prompt = state.aiEnabled ? 'Human wins!' : 'Left wins!';
            state.subtitle = restartSub;
            resetScore(state);
        }
        return;
    }

    state.rightScore++;
    if (state.rightScore >= GAME.WIN_SCORE) {
        state.prompt = state.aiEnabled ? 'AI wins' : 'Right wins!';
        state.subtitle = restartSub;
        resetScore(state);
    }
}

function resetScore(state) {
    state.playing = false;
}

function newRound(state) {
    state.ball.x = state.viewport.width / 2 - state.ball.width / 2;
    state.ball.y = state.viewport.height / 2 - state.ball.height / 2;
    state.ball.velX = state.ball.velX > 0 ? -state.config.BALL_SPEED_X : state.config.BALL_SPEED_X;
    state.ball.velY = randomServeVelocity(state);
    state.leftPlayer.y = state.viewport.height / 2 - state.leftPlayer.height / 2;
    state.rightPlayer.y = state.viewport.height / 2 - state.rightPlayer.height / 2;
    state.serveDelay = SERVE_DELAY;
}

function randomServeVelocity(state) {
    return (state.randomSource() - 0.5) * state.config.BALL_SPEED_X;
}

function toEntitySnapshot(entity) {
    return {
        x: entity.x,
        y: entity.y,
        width: entity.width,
        height: entity.height,
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
