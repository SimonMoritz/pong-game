//gameboard and coloring of moving objects
let canvas = document.getElementById("gb");
// Set explicit internal canvas dimensions (CSS scales these for display)
canvas.width = 300;
canvas.height = 150;
const gameboard = canvas.getContext("2d");
gameboard.fillStyle = "white";
gameboard.font = '30px serif';

//scoring
let leftScoreNode = document.getElementById("leftScore");
let rightScoreNode = document.getElementById("rightScore");
let leftScore = 0;
let rightScore = 0;

//create moving objects
let ball = new Ball(canvas);
let leftPlayer = new Player('left', canvas);
let rightPlayer = new Player('right', canvas);

//update canvas
function createFrame() {
    gameboard.clearRect(0, 0, canvas.width, canvas.height);
    gameboard.fillRect(ball.x, ball.y, ball.width, ball.height);
    gameboard.fillRect(leftPlayer.x, leftPlayer.y, leftPlayer.width, leftPlayer.height);
    gameboard.fillRect(rightPlayer.x, rightPlayer.y, rightPlayer.width, rightPlayer.height);
}

//variables for key press
let isArrowUpPressed = false, isArrowDownPressed = false, isWPressed = false, isSPressed = false;

//AI mode toggle
let aiEnabled = false;
const aiToggleBtn = document.getElementById("aiToggle");
aiToggleBtn.addEventListener('click', function () {
    aiEnabled = !aiEnabled;
    aiToggleBtn.textContent = aiEnabled ? 'AI: ON' : 'AI: OFF';
});

gameboard.fillText("Click to play", 65, 80);
let playing;

//determining if key is pressed
document.addEventListener('keydown', function (event) {
    let key = event.key;
    switch (key) {
        case 'ArrowUp': isArrowUpPressed = true; break;
        case 'ArrowDown': isArrowDownPressed = true; break;
        case 'w': isWPressed = true; break;
        case 's': isSPressed = true; break;
    }
});
document.addEventListener('keyup', function (event) {
    let key = event.key;
    switch (key) {
        case 'ArrowUp': isArrowUpPressed = false; break;
        case 'ArrowDown': isArrowDownPressed = false; break;
        case 'w': isWPressed = false; break;
        case 's': isSPressed = false; break;
    }
});


//determines the vector of velocity for ball if it hits left player
function reflectLeft() {
    if (GAME.PADDLE_OFFSET <= ball.x && ball.x <= GAME.PADDLE_OFFSET + leftPlayer.width) {
        let relativeBallPosition = ball.y - leftPlayer.y;
        if (0 <= relativeBallPosition && relativeBallPosition <= leftPlayer.height) {
            ball.velX *= (-1);
            ball.velY += relativeHit(relativeBallPosition);
            ball.velY = Math.max(-GAME.MAX_BALL_SPEED_Y, Math.min(GAME.MAX_BALL_SPEED_Y, ball.velY));
        }
    }
}

//determines the vector of velocity for ball if it hits right player
function reflectRight() {
    if (canvas.width - GAME.PADDLE_OFFSET - rightPlayer.width <= ball.x && ball.x <= canvas.width - GAME.PADDLE_OFFSET) {
        let relativeBallPosition = ball.y - rightPlayer.y;
        if (0 <= relativeBallPosition && relativeBallPosition <= rightPlayer.height) {
            ball.velX *= (-1);
            ball.velY += relativeHit(relativeBallPosition);
            ball.velY = Math.max(-GAME.MAX_BALL_SPEED_Y, Math.min(GAME.MAX_BALL_SPEED_Y, ball.velY));
        }
    }
}

//determines if someone scored
function checkIfBallOutOfBounds() {
    if (ball.x < 0) {
        incrementScore(rightPlayer);
        newRound();
    }
    else if (canvas.width < ball.x) {
        incrementScore(leftPlayer);
        newRound();
    }
}

//game reset — alternates serve direction each round
function newRound() {
    ball.x = canvas.width / 2 - ball.width / 2;
    ball.y = canvas.height / 2 - ball.height / 2;
    ball.velX = ball.velX > 0 ? -GAME.BALL_SPEED_X : GAME.BALL_SPEED_X;
    ball.velY = Math.random() - 0.5;
    leftPlayer.y = canvas.height / 2 - leftPlayer.height / 2;
    rightPlayer.y = canvas.height / 2 - rightPlayer.height / 2;
}

//increment score
function incrementScore(player) {
    if (player.side === 'left') {
        leftScore++;
        leftScoreNode.innerHTML = leftScore.toString();
        if (leftScore >= GAME.WIN_SCORE) {
            resetScore();
        }
    }
    else if (player.side === 'right') {
        rightScore++;
        rightScoreNode.innerHTML = rightScore.toString();
        if (rightScore >= GAME.WIN_SCORE) {
            resetScore();
        }
    }
}

let mainRoutine;
//resets score -- end of game
function resetScore() {
    rightScore = 0;
    leftScore = 0;
    rightScoreNode.innerHTML = rightScore.toString();
    leftScoreNode.innerHTML = leftScore.toString();
    clearInterval(mainRoutine);
    gameboard.fillText("Click to play", 65, 80);
    playing = false;
}

//starting velocity ball
ball.velX = GAME.BALL_SPEED_X;
ball.velY = Math.random() - 0.5;

// Move the AI paddle to track the ball at a capped speed (keeps it beatable)
function moveAiPaddle() {
    const paddleCenter = rightPlayer.y + rightPlayer.height / 2;
    const ballCenter = ball.y + ball.height / 2;
    const diff = ballCenter - paddleCenter;
    const step = Math.min(Math.abs(diff), GAME.AI_MAX_SPEED);
    rightPlayer.move(diff > 0 ? step : -step);
}

function gameplay() {
    //user input movement
    if (aiEnabled) {
        moveAiPaddle();
    } else {
        if (isArrowDownPressed) { rightPlayer.move(GAME.PADDLE_SPEED); }
        if (isArrowUpPressed) { rightPlayer.move(-GAME.PADDLE_SPEED); }
    }
    if (isSPressed) { leftPlayer.move(GAME.PADDLE_SPEED); }
    if (isWPressed) { leftPlayer.move(-GAME.PADDLE_SPEED); }

    ball.move();

    //determine if any player reflects the ball
    if (ball.velX < 0) {
        reflectLeft();
    }
    else {
        reflectRight();
    }

    //determine if one player has scored
    checkIfBallOutOfBounds();

    //create new drawings
    createFrame();
}

//gives the user ability to start and stop the game
canvas.addEventListener('click', function () {
    if (!playing) {
        mainRoutine = setInterval(gameplay, 10);
    }
    else {
        clearInterval(mainRoutine);
    }
    playing = !playing;
});
