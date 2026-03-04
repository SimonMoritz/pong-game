// Pure game-logic constants and functions — no browser dependencies.

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

// Reference canvas dimensions that GAME constants are calibrated for.
const REFERENCE_WIDTH = 300;
const REFERENCE_HEIGHT = 150;

// Returns a copy of GAME with pixel/speed values scaled to the given canvas size.
// Preserves gameplay feel at any resolution.
function scaledConfig(canvas) {
    const sx = canvas.width / REFERENCE_WIDTH;
    const sy = canvas.height / REFERENCE_HEIGHT;
    const s = Math.min(sx, sy);
    return {
        BALL_SIZE: Math.max(2, Math.round(GAME.BALL_SIZE * s)),
        PADDLE_WIDTH: Math.max(2, Math.round(GAME.PADDLE_WIDTH * s)),
        PADDLE_HEIGHT: Math.max(10, Math.round(GAME.PADDLE_HEIGHT * s)),
        PADDLE_OFFSET: Math.round(GAME.PADDLE_OFFSET * sx),
        PADDLE_SPEED: GAME.PADDLE_SPEED * s,
        BALL_SPEED_X: GAME.BALL_SPEED_X * s,
        WIN_SCORE: GAME.WIN_SCORE,
        WALL_MARGIN: Math.max(1, Math.round(GAME.WALL_MARGIN * s)),
        AI_MAX_SPEED: GAME.AI_MAX_SPEED * s,
        MAX_BALL_SPEED_Y: GAME.MAX_BALL_SPEED_Y * s,
    };
}

// Calculates the Y velocity change when ball hits a paddle.
// The paddle face is divided into three zones:
//   - Upper zone (position < PADDLE_HEIGHT/2):       deflects ball upward
//   - Center zone (PADDLE_HEIGHT/2 to /2+1):         no extra Y deflection
//   - Lower zone (position > PADDLE_HEIGHT/2 + 1):   deflects ball downward
// Deflection magnitude is 1/distance-from-edge, capped at 1 unit per hit.
function relativeHit(position, config = GAME) {
    const halfHeight = config.PADDLE_HEIGHT / 2;
    let deltaVelY;
    if (position < halfHeight) {
        deltaVelY = Math.min(1, Math.log(halfHeight / position));
        return -deltaVelY;
    }
    if (position > halfHeight + 1) {
        const newPos = Math.abs(position - config.PADDLE_HEIGHT);
        deltaVelY = Math.min(1, Math.log(halfHeight / newPos));
        return deltaVelY;
    }
    return 0;
}

class Ball {
    constructor(canvas, config = GAME) {
        this.config = config;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.width = config.BALL_SIZE;
        this.height = config.BALL_SIZE;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height / 2 - this.height / 2;
        this.velX = 0;
        this.velY = 0;
    }

    move() {
        const { WALL_MARGIN, BALL_SIZE } = this.config;
        if (this.y < WALL_MARGIN || this.y > this.canvasHeight - BALL_SIZE - WALL_MARGIN) {
            this.velY *= -1;
        }
        this.x += this.velX;
        this.y += this.velY;
    }
}

class Player {
    constructor(side, canvas, config = GAME) {
        this.config = config;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.side = side;
        this.width = config.PADDLE_WIDTH;
        this.height = config.PADDLE_HEIGHT;
        if (side === 'left') {
            this.x = config.PADDLE_OFFSET;
        } else if (side === 'right') {
            this.x = canvas.width - config.PADDLE_OFFSET - this.width;
        } else {
            console.error("choose playing side, either 'left' or 'right'");
        }
        this.y = canvas.height / 2 - this.height / 2;
    }

    move(delta_y) {
        if (this.y < this.config.WALL_MARGIN && delta_y < 0) return;
        if (this.y > (this.canvasHeight - this.height) && delta_y > 0) return;
        this.y += delta_y;
    }
}

export { GAME, scaledConfig, relativeHit, Ball, Player };
