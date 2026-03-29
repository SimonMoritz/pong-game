# pong-game
Pong implemented in JavaScript.

Simple game designed by using a canvas object. Control the left side with w as up and s as down, the right player is controlled by the arrows.

Find it here:
https://pong-game.dk

## Deployment

Production deployment is documented in [`DEPLOYMENT.md`](/home/simon/pong-game/DEPLOYMENT.md).

The intended hosting model for this repo is now static deployment from `public/` via DigitalOcean Spaces and the Spaces CDN.

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
This web game is deployed with GitHub Actions by syncing `public/` to DigitalOcean Spaces and purging the Spaces CDN.
