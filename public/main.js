import { createRenderer } from './renderer.js';
import { createInputHandler } from './input.js';
import { createSoundEngine } from './sound.js';

const canvas = document.getElementById('gb');
const leftScoreLabel = document.getElementById('leftScore');
const rightScoreLabel = document.getElementById('rightScore');
const aiToggleButton = document.getElementById('aiToggle');
const isMobile = 'ontouchstart' in window;
const { keys, touch } = createInputHandler(canvas);
const viewport = {
    width: 0,
    height: 0,
};

if (isMobile) {
    aiToggleButton.style.display = 'none';
}

const worker = new Worker('./game-worker.js', { type: 'module' });

// Main-thread orchestration state
let renderer;
let currentState = null;
let animationId = null;
let lastTime = 0;
let pendingDt = 0;
let tickInFlight = false;

const sound = createSoundEngine();
const MAX_PENDING_DT = 0.2;

worker.addEventListener('message', (event) => {
    const { type, state, events } = event.data;

    if (type !== 'frame') {
        return;
    }

    currentState = state;
    tickInFlight = false;

    updateHud(state);
    playEvents(events);
    renderState();

    if (state.playing && animationId === null) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    } else if (!state.playing) {
        stopAnimationLoop();
    }

    flushTick();
});

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const vv = window.visualViewport;
    viewport.width = vv ? vv.width : window.innerWidth;
    viewport.height = vv ? vv.height : window.innerHeight;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    renderer = createRenderer(canvas, viewport);
    stopAnimationLoop();
    pendingDt = 0;
    tickInFlight = false;
    worker.postMessage({
        type: 'resize',
        viewport,
        mobile: isMobile,
        aiEnabled: isMobile ? true : undefined,
    });
}

// --- Game loop ---

function startGame() {
    if (!currentState || currentState.playing) return;

    pendingDt = 0;
    tickInFlight = false;
    worker.postMessage({ type: 'start' });
}

function gameLoop(currentTime) {
    if (!currentState || !currentState.playing) {
        animationId = null;
        return;
    }

    const dt = (currentTime - lastTime) / 1000;  // convert ms to seconds
    lastTime = currentTime;

    // Cap dt to prevent spiral of death on tab switch
    pendingDt = Math.min(pendingDt + Math.min(dt, 0.1), MAX_PENDING_DT);

    flushTick();
    animationId = requestAnimationFrame(gameLoop);
}

function flushTick() {
    if (!currentState || !currentState.playing || tickInFlight || pendingDt <= 0) {
        return;
    }

    const dt = Math.min(pendingDt, 0.1);
    pendingDt = Math.max(0, pendingDt - dt);
    tickInFlight = true;

    worker.postMessage({
        type: 'tick',
        dt,
        input: {
            w: keys.w,
            s: keys.s,
            arrowUp: keys.arrowUp,
            arrowDown: keys.arrowDown,
            leftTouchY: touch.leftY,
            rightTouchY: touch.rightY,
        },
    });
}

// --- UI updates ---

function updateHud(state) {
    leftScoreLabel.textContent = String(state.scores.left);
    rightScoreLabel.textContent = String(state.scores.right);
    aiToggleButton.textContent = state.aiEnabled ? 'AI: ON' : 'AI: OFF';
}

function renderState() {
    if (!renderer || !currentState) return;

    if (currentState.prompt) {
        renderer.drawPrompt(currentState.prompt, currentState.subtitle);
        return;
    }

    renderer.drawFrame(currentState.ball, currentState.leftPlayer, currentState.rightPlayer);
}

function playEvents(events) {
    for (const event of events) {
        if (event === 'wallBounce') {
            sound.wallBounce();
        } else if (event === 'paddleHit') {
            sound.paddleHit();
        } else if (event === 'score') {
            sound.score();
        }
    }
}

function stopAnimationLoop() {
    if (!animationId) return;

    cancelAnimationFrame(animationId);
    animationId = null;
}

// --- Event wiring ---
let resizeTimer = null;
function debouncedResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 100);
}
window.addEventListener('resize', debouncedResize);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', debouncedResize);
}
resizeCanvas();

aiToggleButton.addEventListener('click', () => {
    if (!currentState) return;

    worker.postMessage({
        type: 'setAiEnabled',
        value: !currentState.aiEnabled,
    });
});

canvas.addEventListener('click', () => {
    startGame();
});

// touchstart preventDefault in input.js suppresses the synthetic click on mobile,
// so handle tap-to-start directly via touchend.
canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    startGame();
});
