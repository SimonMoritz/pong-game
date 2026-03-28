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

Status: Done

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

**Fix:** Move `game-logic.js` into a Worker. The main thread posts input state each frame and receives updated game state back:
```
Main thread:  input → postMessage({keys, dt}) → Worker
Worker:       physics tick → postMessage({ball, leftPlayer, rightPlayer}) → Main thread
Main thread:  render from received state
```
Tradeoffs: adds latency of one message round-trip per frame (~0ms in practice but non-zero), complicates the architecture significantly, and requires serialising game state. Only worth it if logic becomes genuinely expensive.

**Files:** new `worker.js`, significant restructure of `main.js` and `game-logic.js`

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
- offscreen canvas for center divider (blit instead of per-frame `setLineDash` + `stroke`)
- pre-baked `AudioBuffer`s replacing per-hit oscillator/gain node allocation
- wall bounce dedup (`Ball.move()` returns bounce flag, single source of truth)
- DPR transform set once at renderer construction instead of every frame

Also included on these branches, but outside the pure performance scope:
- gameplay tuning via larger paddles and slower AI
- visual ball restyle in the renderer
