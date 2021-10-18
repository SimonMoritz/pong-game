class Ball{
    constructor(){
        this.x = 148;
        this.y = 73;
        this.width = 4;
        this.height = 4;
    }

    move(delta_x, delta_y){
        this.x = this.x + delta_x;
        this.y =this.y + delta_y;
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
        this.y = this.y + delta_y;
    }
}

function createFrame(){
    gameboard.clearRect(0,0,canvas.width, canvas.height);
    gameboard.fillRect(ball.x, ball.y, ball.width, ball.height);
    gameboard.fillRect(leftPlayer.x, leftPlayer.y, leftPlayer.width, leftPlayer.height);
    gameboard.fillRect(rightPlayer.x,rightPlayer.y, rightPlayer.width, rightPlayer.height);
}

let canvas = document.getElementById("gb");
const gameboard = canvas.getContext("2d");
gameboard.fillStyle = "white";
gameboard.save();

//create moving objects
let ball = new Ball();
let leftPlayer = new Player('left');
let rightPlayer = new Player('right');

//variables for key press
let isArrowUpPressed = false, isArrowDownPressed = false, isEPressed = false, isDPressed = false;

document.addEventListener('keydown', function(event){
    let key = event.key;
    switch(key){
        case 'ArrowUp':
            isArrowUpPressed = true;
            break;
        case 'ArrowDown':
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
        case 'ArrowUp':
            isArrowUpPressed = false;
            break;
        case 'ArrowDown':
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

createFrame();
setInterval(function(){
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

    createFrame();
}, 10);