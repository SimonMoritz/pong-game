let canvas = document.getElementById("gb");
const gameboard = canvas.getContext("2d");
gameboard.fillStyle = "red";

class Ball{
    constructor(){
        this.x = 148;
        this.y = 73;
        this.width = 4;
        this.height = 4;
    }

    move(delta_x){
        this.x = this.x + delta_x;
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
let ball = new Ball();
let leftPlayer = new Player('left');
let rightPlayer = new Player('right');


gameboard.fillRect(ball.x, ball.y, ball.width, ball.height);
gameboard.fillRect(leftPlayer.x, leftPlayer.y, leftPlayer.width, leftPlayer.height);
gameboard.fillRect(rightPlayer.x,rightPlayer.y, rightPlayer.width, rightPlayer.height);