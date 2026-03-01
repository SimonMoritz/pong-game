// Pure game-logic constants and functions — no browser dependencies.
// Loaded as a plain script in the browser (adds to global scope),
// and imported as a CommonJS module in the Node.js test runner.

const GAME = {
    BALL_SIZE: 4,
    PADDLE_WIDTH: 5,
    PADDLE_HEIGHT: 26,
    PADDLE_OFFSET: 20,   // horizontal distance of each paddle from the canvas edge
    PADDLE_SPEED: 2,
    BALL_SPEED_X: 1.5,
    WIN_SCORE: 10,
    WALL_MARGIN: 1,
    AI_MAX_SPEED: 1.6,  // AI paddle speed — lower than PADDLE_SPEED so humans can win
    MAX_BALL_SPEED_Y: 3,   // prevents velY from growing unbounded after repeated paddle hits
};

// Calculates the Y velocity change when ball hits a paddle.
// The paddle face is divided into three zones:
//   - Upper zone (position < PADDLE_HEIGHT/2):       deflects ball upward
//   - Center zone (PADDLE_HEIGHT/2 to /2+1):         no extra Y deflection
//   - Lower zone (position > PADDLE_HEIGHT/2 + 1):   deflects ball downward
// Deflection magnitude is 1/distance-from-edge, capped at 1 unit per hit.
function relativeHit(position) {
    const halfHeight = GAME.PADDLE_HEIGHT / 2;  // 13
    let deltaVelY;

    if (position < halfHeight) {
        deltaVelY = Math.min(1, 1 / position);
        return -deltaVelY;
    }
    if (position > halfHeight + 1) {
        const newPos = Math.abs(position - GAME.PADDLE_HEIGHT);
        deltaVelY = Math.min(1, 1 / newPos);
        return deltaVelY;
    }
    return 0;
}

class Ball {
    constructor(canvas) {
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.width = GAME.BALL_SIZE;
        this.height = GAME.BALL_SIZE;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height / 2 - this.height / 2;
        this.velX = 0;
        this.velY = 0;
    }

    move() {
        if (this.y < GAME.WALL_MARGIN || this.y > this.canvasHeight - GAME.BALL_SIZE - GAME.WALL_MARGIN) {
            this.velY *= -1;
        }
        this.x += this.velX;
        this.y += this.velY;
    }
}

class Player {
    constructor(side, canvas) {
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.side = side;
        this.width = GAME.PADDLE_WIDTH;
        this.height = GAME.PADDLE_HEIGHT;
        if (side === 'left') {
            this.x = GAME.PADDLE_OFFSET;
        } else if (side === 'right') {
            this.x = canvas.width - GAME.PADDLE_OFFSET - this.width;
        } else {
            console.error("choose playing side, either 'left' or 'right'");
        }
        this.y = canvas.height / 2 - this.height / 2;
    }

    move(delta_y) {
        if (this.y < GAME.WALL_MARGIN && delta_y < 0) return;
        if (this.y > (this.canvasHeight - this.height) && delta_y > 0) return;
        this.y += delta_y;
    }
}

// Export for Node.js test runner; in the browser these become globals via <script>
if (typeof module !== 'undefined') {
    module.exports = { GAME, relativeHit, Ball, Player };
}
