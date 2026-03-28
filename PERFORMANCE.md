# Performance & Quality Improvements

Status key:
- Done: implemented on `feature/performance`
- Partial: some related work is implemented, but the full proposal below is not
- Not done: still just a proposal

## Step 1 — Device Pixel Ratio (DPR)

Status: Done

**Problem:** On Retina/HiDPI screens the canvas renders at CSS pixels, not physical pixels. Everything looks blurry.

**Fix:** In `resizeCanvas()`, set the canvas backing store to physical pixels, but keep game logic in CSS pixels via a logical viewport object:
```js
const dpr = window.devicePixelRatio || 1;
viewport.width = window.innerWidth;
viewport.height = window.innerHeight;
canvas.width = viewport.width * dpr;
canvas.height = viewport.height * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```
The transform keeps draw coordinates in CSS pixels, while the game logic and scaling use `viewport.width`/`viewport.height` instead of the physical backing-store size.

**Files:** `main.js` (resizeCanvas), `renderer.js` (ctx scale on creation or per-frame)

---

## Step 2 — `alpha: false` context hint

Status: Done

**Problem:** The browser composites the canvas against the page background on every frame, even though the background is always solid black.

**Fix:** Pass `{ alpha: false }` when acquiring the 2D context:
```js
canvas.getContext('2d', { alpha: false })
```
One-liner in `renderer.js`. Free performance, no behaviour change.

**Files:** `renderer.js`

---

## Step 3 — Pixel snapping in renderer

Status: Done

**Problem:** Ball and paddle positions are floats (velocity × dt). Drawing `fillRect` at sub-pixel coordinates triggers anti-aliasing — fuzzy edges and extra GPU work.

**Fix:** Wrap all draw coordinates in `Math.round()` in `drawFrame`:
```js
ctx.fillRect(Math.round(ball.x), Math.round(ball.y), ball.width, ball.height);
```
Physics remain float-precision; only the draw call is snapped.

**Files:** `renderer.js`

---

## Step 4 — Resize debounce

Status: Done

**Problem:** `resizeCanvas` fires continuously while dragging the window, reinitialising all game objects and recreating the renderer on every event.

**Fix:** Debounce with a 100ms timeout:
```js
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 100);
});
```

**Files:** `main.js`

---

## Step 5 — Offscreen canvas for center divider

Status: Not done — reverted, full-screen blit was slower than direct draw

**Problem:** The dashed center line is static but redrawn every frame. `setLineDash` + `stroke` is one of the more expensive Canvas 2D operations, especially at high refresh rates on large screens.

**Fix:** Draw the divider once to an `OffscreenCanvas` on init/resize, then `drawImage` it each frame:
```js
const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
// draw divider to offscreen once
// in drawFrame: ctx.drawImage(offscreen, 0, 0)
```

**Files:** `renderer.js` — add a `resize(canvas)` method or rebuild the renderer on resize (already done via `initGame`)

---

## Step 6 — Pre-baked AudioBuffers

Status: Done

**Problem:** Every sound creates two new Web Audio nodes (`OscillatorNode` + `GainNode`), which are allocated and garbage collected on every paddle hit or wall bounce.

**Fix:** On `createSoundEngine()` init, generate each sound's PCM data once into an `AudioBuffer`. Replay with `BufferSourceNode`, which is cheap to create and has no GC pressure from oscillators:
```js
function generateBuffer(ac, frequency, duration) {
    const samples = Math.ceil(ac.sampleRate * duration);
    const buffer = ac.createBuffer(1, samples, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
        const t = i / ac.sampleRate;
        const envelope = Math.max(0, 1 - t / duration);
        data[i] = (Math.sign(Math.sin(2 * Math.PI * frequency * t))) * envelope * 0.15;
    }
    return buffer;
}
```

**Files:** `sound.js`

---

## Bonus — Low impact / mostly academic for pong

## Step 7 — Wall bounce double-check

Status: Done

**Problem:** The wall condition is evaluated twice per frame — once in `gameplay()` to trigger the sound, and once inside `Ball.move()` for the actual physics bounce. Not a real performance cost but inelegant duplication.

**Fix:** Have `Ball.move()` return whether a wall bounce occurred, and use that return value to trigger the sound:
```js
// In Ball.move():
const bounced = this.y < WALL_MARGIN || this.y > this.canvasHeight - BALL_SIZE - WALL_MARGIN;
if (bounced) this.velY *= -1;
// ...
return bounced;

// In gameplay():
if (ball.move(dt)) sound.wallBounce();
```
Single source of truth, no duplicated condition.

**Files:** `game-logic.js` (Ball.move), `main.js` (gameplay)

---

## Step 8 — Web Workers for game logic

Status: Not done

**Problem:** Physics and game logic run on the main thread alongside rendering. On a busy page this could cause jank, since a long frame blocks both. For pong this is academic — the logic is trivial — but it's a useful pattern.

**Fix:** Do not move only `game-logic.js` into a Worker. The current architecture has too much simulation code in `main.js` for that split to be clean. The correct boundary is:

- `main.js` owns DOM, canvas, HUD, keyboard listeners, audio, resize/click wiring, and the `requestAnimationFrame` clock
- a new pure simulation layer owns authoritative game state, AI, collisions, scoring, round reset, and win logic
- `game-worker.js` wraps that simulation layer and exchanges plain serialisable snapshots/events with the main thread

That means step 8 should be implemented as an architectural extraction first, then a Worker integration:

### Proposed architecture

**1. Keep `game-logic.js` as low-level pure primitives**

`game-logic.js` should remain the home of:
- `GAME`
- `scaledConfig()`
- `relativeHit()`
- `Ball`
- `Player`

It should not become the Worker entry point. It is better treated as reusable simulation building blocks for both tests and the engine layer.

**2. Add a new pure `game-engine.js`**

Create a new module responsible for the full simulation state machine. This module should contain the logic that currently lives in `main.js`:
- initial state creation from `viewport` and `scaledConfig`
- serve direction and round reset
- player input application
- AI paddle movement
- ball movement
- paddle reflection
- scoring
- win detection

Suggested API shape:

```js
function createGameState(viewport, options = {}) { ... }
function resizeGameState(state, viewport) { ... }
function stepGame(state, input, dt) { ... }
```

`stepGame()` should return both the next serialisable state and a list of discrete events:

```js
{
    state,
    events: ['wallBounce', 'paddleHit', 'score'],
}
```

This keeps side effects off the simulation path and gives the main thread enough information to play sounds and update UI.

**3. Add `game-worker.js` as a thin adapter**

The Worker should not contain game rules directly. It should:
- hold the authoritative engine state
- handle messages from the main thread
- call `createGameState()`, `resizeGameState()`, and `stepGame()`
- post back snapshots and events

Suggested message flow:

```js
// main -> worker
{ type: 'init', viewport: { width, height } }
{ type: 'start' }
{ type: 'stop' }
{ type: 'resize', viewport: { width, height } }
{ type: 'setAiEnabled', value: true }
{ type: 'tick', dt, input: { w, s, arrowUp, arrowDown } }

// worker -> main
{
    type: 'frame',
    state: {
        ball: { x, y, width, height },
        leftPlayer: { x, y, width, height },
        rightPlayer: { x, y, width, height },
        scores: { left, right },
        playing: true,
        prompt: null,
    },
    events: ['wallBounce', 'paddleHit'],
}
```

Cross-thread messages should only use plain objects. Do not post `Ball` or `Player` instances across the boundary.

**4. Reduce `main.js` to orchestration only**

After the extraction, `main.js` should stop owning simulation rules. Its responsibilities become:
- create renderer, sound engine, and input handler
- maintain the latest snapshot received from the worker
- send `tick` messages from `requestAnimationFrame`
- render the received snapshot
- update DOM score labels and prompts from worker state
- trigger audio from worker events

This is the key architectural rule for step 8:

> Worker owns all simulation state. Main thread owns all side effects.

Without that boundary, the Worker version will be harder to reason about than the current single-thread design.

### Recommended implementation sequence

1. Extract a pure simulation module from `main.js` without using a Worker yet.
2. Move AI, reflection, scoring, round reset, and win logic into that module.
3. Change `main.js` to render immutable snapshots rather than mutating `ball` and `Player` instances directly.
4. Introduce `game-worker.js` and place the engine behind `postMessage`.
5. Keep sound on the main thread, driven by worker-emitted events.

### Tradeoffs

- Adds one message round-trip per frame, which is small but non-zero
- Requires state serialisation on every tick
- Increases architectural complexity significantly for a game whose logic is currently trivial
- Becomes worthwhile only if the simulation grows meaningfully beyond basic pong

### Files

- new `public/game-engine.js`
- new `public/game-worker.js`
- significant restructure of `public/main.js`
- minimal reuse-focused changes in `public/game-logic.js`

---

## Priority Order

| Step | Impact | Effort |
|------|--------|--------|
| 1. DPR | High — visually obvious on any HiDPI screen | Low |
| 2. alpha: false | Low-medium — free CPU/GPU | Trivial |
| 3. Pixel snapping | Medium — crisp rendering, less GPU work | Trivial |
| 4. Resize debounce | Low-medium — prevents thrashing | Trivial |
| 5. Offscreen divider | Medium at high refresh rates | Low |
| 6. Pre-baked audio | Low-medium — reduces GC pressure | Low-medium |
| 7. Wall bounce dedup | Low — code quality only | Trivial |
| 8. Web Workers | Academic for pong | High |

## Current branch summary

Implemented on `feature/performance` and `feature/performance-refinements`:
- HiDPI canvas support using a logical `viewport` plus a higher-density canvas backing store
- `alpha: false` for the 2D rendering context
- pixel-snapped draw coordinates for the ball and paddles
- resize debouncing in `main.js`
- pre-baked `AudioBuffer`s replacing per-hit oscillator/gain node allocation
- wall bounce dedup (`Ball.move()` returns bounce flag, single source of truth)
- DPR transform set once at renderer construction instead of every frame

Also included on these branches, but outside the pure performance scope:
- gameplay tuning via larger paddles and slower AI
- visual ball restyle in the renderer
