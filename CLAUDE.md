# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment
- Node: managed via nvm. Run `nvm use` before running any node commands (version pinned in `.nvmrc`).

## Commands

```bash
# Run all tests
node --test

# Run a single test file
node --test test/game-logic.test.js
node --test test/game-mechanics.test.js

# Serve locally (no build step needed)
npx serve public/
# or
python3 -m http.server --directory public/
```

There is no build step — the game is plain static files served directly from `public/`.

## Architecture

The architecture should be modular and compositional going forward. This is an old project that should be improved — ambitious refactoring is encouraged.

Currently the game is split into two ES modules: `public/game-logic.js` (pure logic, no browser deps, imported by both the browser and tests) and `public/main.js` (browser entry point: canvas rendering, input, game loop, scoring, AI). `index.html` loads `main.js` as `<script type="module">`, which imports `game-logic.js`; tests import it directly.

### Key game mechanics

- Ball paddle reflection: `relativeHit(position)` computes Y velocity delta based on where the ball hits the paddle — edges deflect more, center deflects nothing.
- `GAME.MAX_BALL_SPEED_Y` caps vertical speed after repeated hits.
- AI paddle (`moveAiPaddle` in `main.js`) tracks the ball at `GAME.AI_MAX_SPEED`, deliberately slower than `GAME.PADDLE_SPEED` so a human can win.
- Game loop runs at `setInterval(gameplay, 10)`, toggled by clicking the canvas.

## Deployment

CI/CD is via GitHub Actions (`.github/workflows/deploy.yml`), triggered manually (`workflow_dispatch`). It builds a Docker image and runs it on a self-hosted runner with TLS certs stored as repository secrets (`PRIVKEY`, `FULLCHAIN`).
