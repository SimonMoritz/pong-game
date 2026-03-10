import { GAME, scaledConfig, relativeHit, Ball, Player } from './game-logic.js';
import { createRenderer } from './renderer.js';
import { createInputHandler } from './input.js';
import { createSoundEngine } from './sound.js';

const canvas = document.getElementById('gb');
const keys = createInputHandler();

// Game state
let config, ball, leftPlayer, rightPlayer, renderer;
let leftScore = 0, rightScore = 0;
let playing = false;
let animationId = null;
let lastTime = 0;
let aiEnabled = true;
let winnerLabel = null;

const sound = createSoundEngine();

// --- Initialisation ---

function initGame() {
    config = scaledConfig(canvas);
    ball = new Ball(canvas, config);
    leftPlayer = new Player('left', canvas, config);
    rightPlayer = new Player('right', canvas, config);
    renderer = createRenderer(canvas);
    ball.velX = config.BALL_SPEED_X;
    ball.velY = (Math.random() - 0.5) * config.BALL_SPEED_X;
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (playing) {
        stopGame();
    }
    initGame();
    renderer.drawPrompt('Click to play', 'W / S · left    ↑ / ↓ · right');
}

// --- Game loop ---

function startGame() {
    playing = true;
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function stopGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    playing = false;
}

function gameLoop(currentTime) {
    if (!playing) return;

    const dt = (currentTime - lastTime) / 1000;  // convert ms to seconds
    lastTime = currentTime;

    // Cap dt to prevent spiral of death on tab switch
    const cappedDt = Math.min(dt, 0.1);

    gameplay(cappedDt);
    animationId = requestAnimationFrame(gameLoop);
}

function gameplay(dt) {
    if (aiEnabled) {
        moveAiPaddle(dt);
    } else {
        if (keys.arrowDown) rightPlayer.move(config.PADDLE_SPEED, dt);
        if (keys.arrowUp) rightPlayer.move(-config.PADDLE_SPEED, dt);
    }
    if (keys.s) leftPlayer.move(config.PADDLE_SPEED, dt);
    if (keys.w) leftPlayer.move(-config.PADDLE_SPEED, dt);

    const atWall = ball.y < config.WALL_MARGIN || ball.y > ball.canvasHeight - config.BALL_SIZE - config.WALL_MARGIN;
    if (atWall) sound.wallBounce();
    ball.move(dt);

    if (ball.velX < 0) {
        reflectLeft();
    } else {
        reflectRight();
    }

    checkIfBallOutOfBounds();
    if (playing) renderer.drawFrame(ball, leftPlayer, rightPlayer);
}

// --- AI ---

function moveAiPaddle(dt) {
    const paddleCenter = rightPlayer.y + rightPlayer.height / 2;
    const ballCenter = ball.y + ball.height / 2;
    const diff = ballCenter - paddleCenter;
    const maxMove = config.AI_MAX_SPEED * dt;
    const step = Math.min(Math.abs(diff), maxMove);
    // Convert step back to speed (px/s) for the move function
    const speed = dt > 0 ? step / dt : 0;
    rightPlayer.move(diff > 0 ? speed : -speed, dt);
}

// --- Ball reflection ---
function reflectLeft() {
    if (config.PADDLE_OFFSET <= ball.x && ball.x <= config.PADDLE_OFFSET + leftPlayer.width) {
        const relativeBallPosition = ball.y - leftPlayer.y;
        if (0 <= relativeBallPosition && relativeBallPosition <= leftPlayer.height) {
            ball.velX *= -1;
            const newSpeed = Math.min(Math.abs(ball.velX) * 1.05, config.MAX_BALL_SPEED_X);
            ball.velX = ball.velX < 0 ? -newSpeed : newSpeed;
            ball.velY += relativeHit(relativeBallPosition, config) * config.BALL_SPEED_X;
            ball.velY = Math.max(-config.MAX_BALL_SPEED_Y, Math.min(config.MAX_BALL_SPEED_Y, ball.velY));
            sound.paddleHit();
        }
    }
}

function reflectRight() {
    const rightEdge = canvas.width - config.PADDLE_OFFSET - rightPlayer.width;
    if (rightEdge <= ball.x && ball.x <= canvas.width - config.PADDLE_OFFSET) {
        const relativeBallPosition = ball.y - rightPlayer.y;
        if (0 <= relativeBallPosition && relativeBallPosition <= rightPlayer.height) {
            ball.velX *= -1;
            const newSpeed = Math.min(Math.abs(ball.velX) * 1.05, config.MAX_BALL_SPEED_X);
            ball.velX = ball.velX < 0 ? -newSpeed : newSpeed;
            ball.velY += relativeHit(relativeBallPosition, config) * config.BALL_SPEED_X;
            ball.velY = Math.max(-config.MAX_BALL_SPEED_Y, Math.min(config.MAX_BALL_SPEED_Y, ball.velY));
            sound.paddleHit();
        }
    }
}

// --- Scoring ---
function newRound() {
    ball.x = canvas.width / 2 - ball.width / 2;
    ball.y = canvas.height / 2 - ball.height / 2;
    ball.velX = ball.velX > 0 ? -config.BALL_SPEED_X : config.BALL_SPEED_X;
    ball.velY = (Math.random() - 0.5) * config.BALL_SPEED_X;
    leftPlayer.y = canvas.height / 2 - leftPlayer.height / 2;
    rightPlayer.y = canvas.height / 2 - rightPlayer.height / 2;
}

function checkIfBallOutOfBounds() {
    if (ball.x < 0) {
        incrementScore(rightPlayer);
        newRound();
    } else if (canvas.width < ball.x) {
        incrementScore(leftPlayer);
        newRound();
    }
}

function incrementScore(player) {
    sound.score();
    if (player.side === 'left') {
        leftScore++;
        document.getElementById('leftScore').textContent = leftScore;
        if (leftScore >= GAME.WIN_SCORE) {
            winnerLabel = 'Left wins!';
            resetScore();
        }
    } else {
        rightScore++;
        document.getElementById('rightScore').textContent = rightScore;
        if (rightScore >= GAME.WIN_SCORE) {
            winnerLabel = aiEnabled ? 'AI wins!' : 'Right wins!';
            resetScore();
        }
    }
}

function resetScore() {
    leftScore = 0;
    rightScore = 0;
    document.getElementById('leftScore').textContent = '0';
    document.getElementById('rightScore').textContent = '0';
    stopGame();
    if (winnerLabel) {
        renderer.drawPrompt(winnerLabel, 'Click to play again');
        winnerLabel = null;
    } else {
        renderer.drawPrompt('Click to play', 'W / S · left    ↑ / ↓ · right');
    }
}

// --- Event wiring ---
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.getElementById('aiToggle').addEventListener('click', () => {
    aiEnabled = !aiEnabled;
    document.getElementById('aiToggle').textContent = aiEnabled ? 'AI: ON' : 'AI: OFF';
});

canvas.addEventListener('click', () => {
    if (!playing) {
        startGame();
    } else {
        stopGame();
    }
});
