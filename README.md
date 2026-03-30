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
This web game is deployed as a static site behind Cloudflare.

The GitHub Actions workflow expects:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT_NAME`
