class Ball{
    constructor(){
        //starting coordinates
        this.width = 4;
        this.height = 4;
        this.x = canvas.width/2 - this.width/2;
        this.y = canvas.height/2 - this.height/2;
        //velocity, split into its x and y components
        this.velX = 0;
        this.velY = 0;
    }

    move(){
        //bounce off the top and bottom sides
        if(this.y < 1 || this.y >145){
            this.velY *= (-1)
        }

        this.x = this.x + this.velX;
        this.y = this.y + this.velY;
    }
}

class Player{
    constructor(side){
        this.side = side;
        this.width = 5;
        this.height = 26;
        if(side === 'left'){
            this.x = 20;
        }
        else if(side === 'right'){
            this.x = canvas.width - 20 - this.width;
        }
        else{
            console.error("choose playing side, either 'left' or 'right'");
        }
        this.y = canvas.height/2 - this.height/2;
    }

    move(delta_y){
        if(this.y < 1 && delta_y < 0){
            return;
        }
        if(this.y > (canvas.height - this.height) && delta_y > 0){
            return;
        }
        this.y +=  delta_y;
    }
}

//gameboard and coloring of moving objects
let canvas = document.getElementById("gb");
const gameboard = canvas.getContext("2d");
gameboard.fillStyle = "white";
gameboard.font = '30px serif';

//scoring
let leftScoreNode = document.getElementById("leftScore");
let rightScoreNode = document.getElementById("rightScore");
let leftScore = 0;
let rightScore = 0;


//create moving objects
let ball = new Ball();
let leftPlayer = new Player('left');
let rightPlayer = new Player('right');

//update canvas
function createFrame(){
    gameboard.clearRect(0,0,canvas.width, canvas.height);
    gameboard.fillRect(ball.x, ball.y, ball.width, ball.height);
    gameboard.fillRect(leftPlayer.x, leftPlayer.y, leftPlayer.width, leftPlayer.height);
    gameboard.fillRect(rightPlayer.x,rightPlayer.y, rightPlayer.width, rightPlayer.height);
}

//variables for key press
let isArrowUpPressed = false, isArrowDownPressed = false, isWPressed = false, isSPressed = false;


gameboard.fillText("Click to play", 65 , 80)
let playing;

//determining if key is pressed
document.addEventListener('keydown', function(event){
    let key = event.key;
    switch(key){
        case 'ArrowUp':
            isArrowUpPressed = true;
            break;
        case 'ArrowDown':
            isArrowDownPressed = true;
            break;
        case 'w':
            isWPressed = true;
            break;
        case 's':
            isSPressed = true;
            break;
    }
});

document.addEventListener('keyup', function(event){
    let key = event.key;
    switch(key){
        case 'ArrowUp':
            isArrowUpPressed = false;
            break;
        case 'ArrowDown':
            isArrowDownPressed = false;
            break;
        case 'w':
            isWPressed = false;
            break;
        case 's':
            isSPressed = false;
            break;
    }
});

//determining velocity 
function relativeHit(position){
    let direction;
    if(ball.velY < 0){
        direction = -1;
    }
    else {
        direction = 1;
    }

    if(position < 4){
        return 0.6 * direction;
    }
    else if(position < 7){
        return 0.4 * direction;
    }
    else if(position < 9){
        return 0.2 * direction;
    }
    else if(position < 15){
        return 0;
    }
    else if(position < 19){
        return 0.2 * direction;
    }
    else if(position < 22){
        return 0.4 * direction;
    }
    else{
        return 0.6 * direction;
    }
}

function reflectRight() {
    if(20 <= ball.x && ball.x <= 20+leftPlayer.width){
        let relativeBallPosition = ball.y - (leftPlayer.y);
        if(0 <= relativeBallPosition && relativeBallPosition <= leftPlayer.height){
            ball.velX *= (-1)
            ball.velY += relativeHit(relativeBallPosition);
        }
    }
}

function reflectLeft() {
    if(canvas.width - 20 - rightPlayer.width <= ball.x && ball.x <= canvas.width - 20){
        let relativeBallPosition = ball.y - rightPlayer.y;
        if(0 <= relativeBallPosition && relativeBallPosition <= rightPlayer.height){
            ball.velX *= (-1);
            ball.velY += relativeHit(relativeBallPosition);
        }
    }
}


//determines if someone scored and returns true
function checkIfBallOutOfBounds() {
    if(ball.x < 0){
        incrementScore(leftPlayer);
        newRound();
    }
    else if(canvas.width < ball.x){
        incrementScore(rightPlayer);
        newRound();
    }
}

//game reset
function newRound() {
    ball.x = canvas.width/2 - ball.width/2;
    ball.y = canvas.height/2 - ball.height/2;
    ball.velY = Math.random()-0.5;
    leftPlayer.y = canvas.height/2 - leftPlayer.height/2;
    rightPlayer.y = canvas.height/2 - leftPlayer.height/2;
}

function incrementScore(player) {
    if(player.side === 'left'){
        leftScore++;
        rightScoreNode.innerHTML = leftScore.toString();
        if(leftScore >= 10){
            resetScore();
        }
    }
    else if(player.side === 'right'){
        rightScore++;
        leftScoreNode.innerHTML = rightScore.toString();
        if(rightScore >= 10){
            resetScore();
        }
    }
}

let mainRutine;
function resetScore(params) {
    rightScore = 0;
    leftScore = 0;
    rightScoreNode.innerHTML = rightScore.toString();
    leftScoreNode.innerHTML = leftScore.toString();
    clearInterval(mainRutine);
    gameboard.fillText("Click to play", 65 , 80);
    playing = false;
}

//starting velocity ball
ball.velX = 1.5;
ball.velY = Math.random()-0.5;


function subrutine() {
    if(isArrowDownPressed){
        rightPlayer.move(2);
    }
    if(isArrowUpPressed){
        rightPlayer.move(-2);
    }
    if(isSPressed){
        leftPlayer.move(2);
    }
    if(isWPressed){
        leftPlayer.move(-2);
    }

    ball.move();

    //determine if any player reflects the ball
    if(ball.velX < 0){
        reflectRight();
    } 
    else{
        reflectLeft();
    }

    //determine of one player has scored
    checkIfBallOutOfBounds();
    createFrame();
}



canvas.addEventListener('click', function() {
    if(!playing){
        mainRutine = setInterval(subrutine, 10);
    }
    else{
        clearInterval(mainRutine);
    }
    playing = !playing; 
});

