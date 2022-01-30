// @ts-check

// 0 - waiting for other player
// 1 - Andy
// 2 - Otto
let playerType = 0;
let currentTurn = 0;

let currentTimeout = null;

for (let i = 0; i < 7; i++) {
    let column = document.getElementById("col" + (i + 1));
    column.addEventListener("click", (event) => {
        event.preventDefault();
        column.parentElement.style.pointerEvents = "none";
        column.parentElement.style.visibility = "hidden";
        socket.send(Messages.PLACE(playerType, i));
        currentTimeout = setTimeout(() => {
            column.parentElement.style.pointerEvents = "auto";
            currentTimeout = null;
        }, 1000);
    });
}

function setTurn(player) {
    currentTurn = player;
    let content = null;

    if (currentTurn == playerType) {
        
        if (currentTimeout != null) {
            clearTimeout(currentTimeout);
            currentTimeout = null;
        }

        // show columns
        let columns = document.getElementById("input-columns");
        columns.style.pointerEvents = "auto";
        columns.style.visibility = "visible";

        content = "Your";
    } else {
        content = (currentTurn == 1 ? "Andy's" : "Otto's");
    }

    const display = document.getElementById("turn");
    display.innerHTML = content + " turn";
    display.style.color = (currentTurn == 1 ? "#93B0DC" : "#012E71");
    
    if (currentTurn == 1) {
        document.getElementById("andy").classList.remove("disabled");
        document.getElementById("otto").classList.add("disabled");

    } else {
        document.getElementById("andy").classList.add("disabled");
        document.getElementById("otto").classList.remove("disabled");
    }
}

function placeDisk(player, row, column) {
    const grid = document.getElementById("back-grid");
    let disk = document.createElement("div");
    disk.style.gridRow = row + 1;
    disk.style.gridColumn = column + 1;
    disk.style.backgroundImage = `radial-gradient(circle max(32px, calc(40vw / 7 * 0.4 + 1px)) at center, ${(player == 1) ? "#93B0DC" : "#012E71"} max(32px, calc(40vw / 7 * 0.4 + 1px)), transparent 0)`;
    grid.append(disk);
    disk.animate([
        { 
            opacity: "0%",
            transform: `translateY(-${row * 100}%)`
        },
        {
            opacity: "100%",
            transform: `translateY(-${row * 100}%)`
        },
        {
            transform: "translateY(0%)"
        },
        {
            transform: "translateY(0%)"
        },
        {
            transform: `translateY(-${Math.trunc(row * 40 / 6)}px)`
        },
        {
            transform: "translateY(0%)"
        },
        {
            transform: `translateY(-${Math.trunc(row * 26 / 6)}px)`
        },
        {
            transform: "translateY(0%)"
        },
        {
            transform: `translateY(-${Math.trunc(row * 10 / 6)}px)`
        },
        {
            transform: "translateY(0%)"
        },
    ], {
        duration: Math.trunc((row + 1) * 750 / 7),
        easing: "ease-out"
    });
}

function setWinner(winner) {
    currentTurn = -1;

    // hide columns
    let columns = document.getElementById("input-columns");
    columns.style.pointerEvents = "none";
    columns.style.visibility = "hidden";
    
    let content = null;

    if (playerType == winner) {
        content = "You win!";
    } else if (winner == 0) {
        content = "It's a draw!";
    } else {
        content = (winner == 1 ? "Andy wins!" : "Otto wins!");
    }

    // display winner
    const display = document.getElementById("turn");
    display.innerHTML = content;

    if (winner != 0) {
        display.style.color = (winner == 1 ? "#93B0DC" : "#012E71");
        let img = document.getElementById(winner == 1 ? "andy" : "otto");
        img.classList.add("anim");
        img.style.animationName = "bounce";
        img.style.animationIterationCount = "infinite";

    } else {
        display.style.color = "#0D489C";
        document.getElementById("andy").classList.add("disabled");
        document.getElementById("otto").classList.add("disabled");
    }
}

var host = location.origin.replace(/^http/, 'ws')
const socket = new WebSocket(host);

socket.onmessage = function (event) {
    const message = JSON.parse(event.data);

    if (message.type == Messages.TYPE_SET_PLAYER) {
        playerType = message.data;
        console.log("Player: " + playerType);
        document.getElementById((playerType == 1) ? "andy" : "otto").classList.remove("disabled");
    }

    if (message.type == Messages.TYPE_SET_TURN) {
        setTurn(message.data);
    }

    if (message.type == Messages.TYPE_SET_WINNER) {
        setWinner(message.data);
    }

    if (message.type == Messages.TYPE_PUT_CIRCLE) {
        const data = message.data;
        placeDisk(data[0], data[1], data[2]);
    }

    if (message.type == Messages.TYPE_SET_TIME) {
        let time = message.data;
        document.getElementById("timer").innerHTML = `${String(Math.trunc(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
    }
}

socket.onclose = function (event) {
    if (currentTurn != -1) {
        const display = document.getElementById("turn");
        let opponent = (playerType == 1) ? 2 : 1;
        display.innerHTML = ((opponent == 1) ? "Andy" : "Otto") + " left the game";
        display.style.color = "#0D489C";
        document.getElementById("andy").classList.add("disabled");
        document.getElementById("otto").classList.add("disabled");
    }
};

socket.onerror = function (event) {
    console.log(event);
};

this.onbeforeunload = (event) => {
    socket.onclose = (event) => {};
    socket.close(1001);
}