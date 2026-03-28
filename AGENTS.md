# AGENTS.md — Guidance for AI Coding Agents

This file provides guidance for AI agents (Claude Code, Codex, Copilot, etc.) working in this repository.

## Overview

Browser-based Pong game built with plain ES modules — no build step, no framework, no transpilation.
Static files are served directly from `public/`. The server (`server.js`) only serves those files over HTTPS.

---

## Environment Setup

Node version is pinned in `.nvmrc`. Always activate it before running any Node commands:

```bash
nvm use          # activates Node 24 LTS as specified in .nvmrc
npm install      # installs express (only runtime dependency)
```

---

## Commands

```bash
# Run all tests
node --test

# Run a single test file
node --test test/game-logic.test.js
node --test test/game-mechanics.test.js

# Serve the game locally (no build needed)
npx serve public/
# or
python3 -m http.server --directory public/

# Start production HTTPS server (requires privkey.pem + fullchain.pem)
npm start
```

There is **no build step**. Changes to `public/` files are immediately reflected on reload.

---

## Project Structure

```
public/
  game-logic.js   # Pure game logic — no browser/DOM dependencies. Imported by tests and main.js.
  main.js         # Browser entry point: game loop, scoring, AI, event wiring.
  renderer.js     # Canvas drawing — all ctx operations isolated here.
  input.js        # Keyboard state tracking via keydown/keyup listeners.
  index.html      # Minimal HTML: canvas, scoreboard HUD, AI toggle button.
  styles.css      # Full-screen canvas layout, HUD positioning.
server.js         # HTTPS static file server (CommonJS, uses Express).
test/
  game-logic.test.js      # Tests for GAME constants and relativeHit().
  game-mechanics.test.js  # Tests for Ball, Player, scoring, round reset.
```

---

## Architecture

The architecture should be modular and compositional going forward. This is an old project that should be improved — ambitious refactoring is encouraged.

**Separation of concerns is the core principle.** Keep these boundaries strict:

- `game-logic.js` — pure logic only. No `document`, `window`, `canvas`, or DOM of any kind.
  Exports: `GAME`, `scaledConfig`, `relativeHit`, `Ball`, `Player`.
- `main.js` — wires everything together; the only file allowed to touch the DOM.
- `renderer.js` — all `CanvasRenderingContext2D` calls live here, nowhere else.
- `input.js` — all event listeners for keyboard input live here, nowhere else.

**Scaling system:** `GAME` constants are calibrated for a 300×150 reference canvas.
`scaledConfig(canvas)` proportionally scales them for any window size. Always pass `config`
(the scaled version) to `Ball`, `Player`, and `relativeHit` — never use raw `GAME` in `main.js`
for pixel/speed values.

**Factory pattern** for browser modules: `createRenderer(canvas)` and `createInputHandler()`
return plain objects or state — they do not use classes.

**Classes** (`Ball`, `Player`) for stateful game objects with methods.

**Game loop:** `requestAnimationFrame` with delta-time — toggled by canvas click, paused on resize.
Game speeds are defined in pixels-per-second and multiplied by `dt` each frame for frame-rate independence.

---

## Code Style

### Modules
- All files in `public/` use **ES modules** (`import`/`export`). Use named exports; no default exports.
- `server.js` uses **CommonJS** (`require`/`module.exports`) — it is intentionally kept separate.
- Import paths always include the `.js` extension: `import { Ball } from './game-logic.js'`.

### Formatting
- **4-space indentation** — no tabs.
- **Semicolons required** at the end of every statement.
- **Single quotes** for all strings (`'left'`, not `"left"`), except template literals.
- **Trailing commas** in multi-line object and array literals.
- No line length limit enforced, but keep lines readable.
- No linter or formatter is configured — maintain consistency with the surrounding code manually.

### Naming Conventions
| Kind                    | Convention         | Example                       |
|-------------------------|--------------------|-------------------------------|
| Variables, functions    | `camelCase`        | `relativeHit`, `ballCenter`   |
| Constants (config)      | `UPPER_SNAKE_CASE` | `BALL_SPEED_X`, `WIN_SCORE`   |
| Classes                 | `PascalCase`       | `Ball`, `Player`              |
| Factory functions       | `createNoun`       | `createRenderer`              |
| Parameters              | `camelCase`        | `deltaY`, `currentTime`       |

### Variable Declarations
- Always use `const` or `let`. Never `var`.
- Prefer `const`; use `let` only when the binding must be reassigned.

### Comments
- **Section headers** use `// --- Section Name ---` on their own line before a group of related functions.
- **Function-level comments** use plain `//` lines immediately above the function.
- Inline comments explain *why*, not *what*, placed on the same line or the line before.
- No JSDoc blocks — the codebase uses plain prose comments.

### Default Parameters for Config
Functions that operate on game dimensions accept an optional `config` parameter defaulting to `GAME`:

```js
function relativeHit(position, config = GAME) { ... }
```

This allows tests to call them with the default constants without needing a canvas.

---

## Testing

### Framework
Node.js built-in test runner — no external test dependencies.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAME, Ball, Player } from '../public/game-logic.js';
```

### Patterns
- One behavior per `test()` call. Test names are full sentences describing the expected behavior.
- Use a **mock canvas** object where a real canvas is needed: `const CANVAS = { width: 300, height: 150 };`
- Import directly from `public/game-logic.js` — tests never touch `main.js`, `renderer.js`, or `input.js`
  (those have browser dependencies that aren't available in Node).
- Prefer `assert.equal` for exact values, `assert.ok(expr, message)` for inequality checks.
  Always include a descriptive failure message in `assert.ok` calls.
- Test boundary conditions explicitly: walls, caps, exact-edge cases (e.g., `ball.x === 0` does not score).

### Running a Specific Test
```bash
node --test test/game-mechanics.test.js
```

---

## Error Handling

- **Fatal startup errors** (e.g., missing TLS certs in `server.js`): `console.error(...)` then `process.exit(1)`.
- **Invalid arguments** in constructors (e.g., wrong `side` value in `Player`): `console.error(...)`, no throw.
- **Boundary/clamp logic** in game objects: silent early `return` — no exceptions, no logging.
- **No try/catch** anywhere in `game-logic.js`. Keep pure logic free of error-handling noise.

---

## Key Domain Patterns

- **`relativeHit(position, config)`** — three-zone paddle face logic. Upper zone returns negative delta
  (deflects up), center zone returns 0, lower zone returns positive delta. Deflection uses
  `Math.log(halfHeight / position)`, capped at 1. Always clamp `velY` after calling it.
- **`scaledConfig`** uses `Math.min(sx, sy)` for uniform scaling of sizes/speeds, but scales
  `PADDLE_OFFSET` with `sx` only (horizontal dimension).
- **Serve direction alternates** each round: `ball.velX > 0 ? -speed : speed`.
- **AI paddle** moves at `AI_MAX_SPEED` (< `PADDLE_SPEED`) so a human player can always win.
- **DOM IDs** used in `main.js`: `gb` (canvas), `leftScore`, `rightScore`, `aiToggle`.
  Do not rename these without updating `index.html`.

---

## Deployment

CI/CD is via GitHub Actions (`.github/workflows/deploy.yml`), triggered manually (`workflow_dispatch`). It builds a Docker image and runs it on a self-hosted runner with TLS certs stored as repository secrets (`PRIVKEY`, `FULLCHAIN`).

---

## File Editing Best Practices

When making multiple changes to the same file:

1. **Plan all edits first** — Before editing, identify all changes needed in a file.
2. **Batch related changes** — Combine adjacent or related changes into a single edit operation when possible.
3. **Edit top-to-bottom** — When multiple separate edits are unavoidable, work from the top of the file downward to avoid line number shifts affecting later edits.
4. **Re-read after errors** — If an edit fails due to file modification, re-read the file before retrying.

Example of batching:
```javascript
// BAD: Three separate edits
// Edit 1: Change function signature
// Edit 2: Update function body
// Edit 3: Fix return statement

// GOOD: One edit that includes all three changes
// Edit 1: Replace entire function with updated version
```

This reduces errors and improves editing efficiency.
