# pong-game
Pong implemented in JavaScript.

Simple game designed by using a canvas object. Control the left side with w as up and s as down, the right player is controlled by the arrows.

Find it here:
https://pong-game.dk

## Running locally

The game is plain static files, so any static file server works. No SSL certificates needed.

```bash
npx serve public/
```

Then open http://localhost:3000 in your browser.

Alternatively, with Python:

```bash
python3 -m http.server --directory public/
```

Then open http://localhost:8000.

## CI/CD
This web game is deployed with github actions, it should be easy reproduce on any self-hosted linux runner. See .github/workflows for details.
