import { GAME, scaledConfig, relativeHit, Ball, Player } from './game-logic.js';
import { createRenderer } from './renderer.js';
import { createInputHandler } from './input.js';

const canvas = document.getElementById('gb');
const keys = createInputHandler();

// Game state
let config, ball, leftPlayer, rightPlayer, renderer;
let leftScore = 0, rightScore = 0;
let playing = false;
let mainRoutine = null;
let aiEnabled = false;

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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (playing) {
        clearInterval(mainRoutine);
        playing = false;
    }
    initGame();
    renderer.drawPrompt('Click to play');
}

// --- Game loop ---

function startGame() {
    playing = true;
    mainRoutine = setInterval(gameplay, 10);
}

function gameplay() {
    if (aiEnabled) {
        moveAiPaddle();
    } else {
        if (keys.arrowDown) rightPlayer.move(config.PADDLE_SPEED);
        if (keys.arrowUp)   rightPlayer.move(-config.PADDLE_SPEED);
    }
    if (keys.s) leftPlayer.move(config.PADDLE_SPEED);
    if (keys.w) leftPlayer.move(-config.PADDLE_SPEED);

    ball.move();

    if (ball.velX < 0) {
        reflectLeft();
    } else {
        reflectRight();
    }

    checkIfBallOutOfBounds();
    renderer.drawFrame(ball, leftPlayer, rightPlayer);
}

// --- AI ---

function moveAiPaddle() {
    const paddleCenter = rightPlayer.y + rightPlayer.height / 2;
    const ballCenter = ball.y + ball.height / 2;
    const diff = ballCenter - paddleCenter;
    const step = Math.min(Math.abs(diff), config.AI_MAX_SPEED);
    rightPlayer.move(diff > 0 ? step : -step);
}

// --- Ball reflection ---

function reflectLeft() {
    if (config.PADDLE_OFFSET <= ball.x && ball.x <= config.PADDLE_OFFSET + leftPlayer.width) {
        const relativeBallPosition = ball.y - leftPlayer.y;
        if (0 <= relativeBallPosition && relativeBallPosition <= leftPlayer.height) {
            ball.velX *= -1;
            ball.velY += relativeHit(relativeBallPosition, config);
            ball.velY = Math.max(-config.MAX_BALL_SPEED_Y, Math.min(config.MAX_BALL_SPEED_Y, ball.velY));
        }
    }
}

function reflectRight() {
    const rightEdge = canvas.width - config.PADDLE_OFFSET - rightPlayer.width;
    if (rightEdge <= ball.x && ball.x <= canvas.width - config.PADDLE_OFFSET) {
        const relativeBallPosition = ball.y - rightPlayer.y;
        if (0 <= relativeBallPosition && relativeBallPosition <= rightPlayer.height) {
            ball.velX *= -1;
            ball.velY += relativeHit(relativeBallPosition, config);
            ball.velY = Math.max(-config.MAX_BALL_SPEED_Y, Math.min(config.MAX_BALL_SPEED_Y, ball.velY));
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
    if (player.side === 'left') {
        leftScore++;
        document.getElementById('leftScore').textContent = leftScore;
        if (leftScore >= GAME.WIN_SCORE) resetScore();
    } else {
        rightScore++;
        document.getElementById('rightScore').textContent = rightScore;
        if (rightScore >= GAME.WIN_SCORE) resetScore();
    }
}

function resetScore() {
    leftScore = 0;
    rightScore = 0;
    document.getElementById('leftScore').textContent = '0';
    document.getElementById('rightScore').textContent = '0';
    clearInterval(mainRoutine);
    renderer.drawPrompt('Click to play');
    playing = false;
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
        clearInterval(mainRoutine);
        playing = false;
    }
});
