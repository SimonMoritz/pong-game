class Ball{
    constructor(){
        //starting coordinates
        this.x = 148;
        this.y = 73;
        this.width = 4;
        this.height = 4;

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
        if(side === 'left'){
            this.x = 20;
        }
        else if(side === 'right'){
            this.x = 275;
        }
        else{
            console.error("choose playing side, either 'left' or 'right'");
        }

        this.y = 62;
        this.width = 5;
        this.height = 26;
    }

    move(delta_y){
        if(this.y < 1 && delta_y < 0){
            return;
        }
        if(this.y > 123 && delta_y > 0){
            return;
        }
        this.y = this.y + delta_y;
    }
}

//gameboard and coloring of moving objects
let canvas = document.getElementById("gb");
const gameboard = canvas.getContext("2d");
gameboard.fillStyle = "white";


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
let isArrowUpPressed = false, isArrowDownPressed = false, isEPressed = false, isDPressed = false;

//determining if key is pressed
document.addEventListener('keydown', function(event){
    let key = event.key;
    switch(key){
        case 'o':
            isArrowUpPressed = true;
            break;
        case 'k':
            isArrowDownPressed = true;
            break;
        case 'e':
            isEPressed = true;
            break;
        case 'd':
            isDPressed = true;
            break;
    }
});

document.addEventListener('keyup', function(event){
    let key = event.key;
    switch(key){
        case 'o':
            isArrowUpPressed = false;
            break;
        case 'k':
            isArrowDownPressed = false;
            break;
        case 'e':
            isEPressed = false;
            break;
        case 'd':
            isDPressed = false;
            break;
    }
});

function reflectRight(ball, leftPlayer) {
    if(20 <= ball.x && ball.x <= 25){
        let relativeBallPosition = ball.y - (leftPlayer.y);
        if(0 <= relativeBallPosition && relativeBallPosition <= 26){
            ball.velX *= (-1)
        }
    }
}

function reflectLeft(ball, rightPlayer) {
    if(275 <= ball.x && ball.x <= 280){
        let relativeBallPosition = ball.y - (rightPlayer.y);
        if(0 <= relativeBallPosition && relativeBallPosition <= 26){
            ball.velX *= (-1)
        }
    }
}


//starting velocity ball
ball.velX = -1;
ball.velY = -0.5;

//main function for game
setInterval(function(){
    //move players
    if(isArrowDownPressed){
        rightPlayer.move(2);
    }
    if(isArrowUpPressed){
        rightPlayer.move(-2);
    }

    if(isDPressed){
        leftPlayer.move(2);
    }
    if(isEPressed){
        leftPlayer.move(-2);
    }

    //move ball
    ball.move();

    //determine if any player reflects the ball
    if(ball.velX < 0){
        reflectRight(ball, leftPlayer);
    } 
    else{
        reflectLeft(ball, rightPlayer);
    }
    createFrame();
}, 10);