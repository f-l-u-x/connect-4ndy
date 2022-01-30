// @ts-check

const Messages = require("./public/javascripts/messages");

const Status = {
    WAITING: "WAITING",
    ANDY_TURN: "ANDY_TURN",
    OTTO_TURN: "OTTO_TURN",
    ANDY_WIN: "ANDY_WIN",
    OTTO_WIN: "OTTO_WIN",
    DRAW: "DRAW",
    ABORTED: "ABORTED"
}

class Game {
    constructor(id) {
        // websockets
        this.id = id;
        this.andy = null;
        this.otto = null;
        this.status = Status.WAITING;

        this.gameboard = new Array(7);
        for (let i = 0; i < 7; i++) {
            this.gameboard[i] = new Array(6);
        }

        this.timer = (function (game) {
            let secondsPassed = 0;
            let interval = null;
        
            return {
                getTimePassed: () => {
                    return secondsPassed;
                },

                start: () => {
                    if (interval != null) {
                        return;
                    }
                    interval = setInterval(() => game.sendMessage(Messages.SET_TIME(++secondsPassed)), 1000);
                },
        
                stop: () => {
                    if (interval != null) {
                        clearInterval(interval);
                        interval = null;
                    }
                }
            };
        })(this);
    }

    place(player, column) {
        const columnArray = this.gameboard[column];

        for (let row = 5; row >= 0; row--) {

            if (columnArray[row] == null) {
                columnArray[row] = player;
                return row;
            }
        }
    }

    checkWinner(row, column) {
        let played = this.gameboard[column][row];
        let dimensionsCol = [0, 1, 1, 1, 0, -1, -1, -1];
        let dimensionsRow = [1, 1, 0, -1, -1, -1, 0, 1];
        let connected = [1, 1, 1, 1];

        for (let i = 0; i < 8; i++) {
            for (let j = 1; j <= 3; j++){
                let nextCol = column + dimensionsCol[i] * j;
                let nextRow = row + dimensionsRow[i] * j;
                if(nextCol < 0 || nextCol > 6 || nextRow < 0 || nextRow > 5 || this.gameboard[nextCol][nextRow] != played){
                    break;
                }
                connected[i % 4]++;
            }
        }

        for(const circles of connected){
            if(circles >= 4){
                return true;
            }
        }

        return false;
    }

    addPlayer(socket) {

        if (this.andy == null && this.otto == null) {
           let playerType = Math.floor(Math.random() + 0.5) + 1;

           if (playerType == 1) {
               this.andy = socket;
           } else {
               this.otto = socket;
           }

           return playerType;
        }

        if (this.andy == null) {
            this.andy = socket;
            return 1;
        } else {
            this.otto = socket;
            return 2;
        }
    }

    isFull() {
        return this.andy != null && this.otto != null;
    }

    hasSpace() {

        for(let column of this.gameboard){

            if(column[0] == null){
                return true;
            }
        }

        return false;
    }

    setStatus(status) {
        this.status = status;

        if (this.status == Status.ANDY_TURN || this.status == Status.OTTO_TURN) {
            this.timer.start();
            this.sendMessage(Messages.SET_TURN(this.status == Status.ANDY_TURN ? 1 : 2));

        } else if (this.status != Status.WAITING) {
            this.timer.stop();

            if (this.status == Status.ANDY_WIN || this.status == Status.OTTO_WIN) {
                this.sendMessage(Messages.SET_WINNER(this.status == Status.ANDY_WIN ? 1 : 2));

            } else if (this.status == Status.DRAW) {
                this.sendMessage(Messages.SET_WINNER(0));

            } else {

                try {
                    this.andy.close();
                    this.andy = null;
                } catch (e) {
                    console.log("Andy closing: " + e);
                }

                try {
                    this.otto.close();
                    this.otto = null;
                } catch (e) {
                    console.log("Otto closing: " + e);
                }
            }
        }
    }

    sendMessage(message) {
        this.andy.send(message);
        this.otto.send(message);
    }
}

module.exports = Game
module.exports.Status = Status;
