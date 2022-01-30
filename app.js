// @ts-check

const express = require("express");
const http = require("http");
const websocket = require("ws");

const router = require("./routes/index");

// const port = process.argv[2];
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

//app.get("/", router);
app.get("/", function(req, res) {
  res.render("splash.ejs", { 
    totalGames: totalGames,
    onlinePlayers: onlinePlayers,
    fastestGame: fastestGame
  });
});
app.get("/play", router);

const server = http.createServer(app);
const splashConnection = new websocket.Server({ port: 8080 });
const gameConnection = new websocket.Server({ server });

// statistics
let totalGames = 0;
let onlinePlayers = 0;
let fastestGame = Infinity;

const Statistics = {

  TOTAL_GAMES: () => {
    return JSON.stringify({
      type: "total_games",
      data: totalGames
    });
  },

  ONLINE_PLAYERS: () => {
    return JSON.stringify({
      type: "online_players",
      data: onlinePlayers
    });
  },

  FASTEST_GAME: () => {
    return JSON.stringify({
      type: "fastest_game",
      data: (fastestGame == Infinity) ? "None" : fastestGame
    });
  },
}

// Game data
const Game = require("./game");
const Messages = require("./public/javascripts/messages");
const { Status } = require("./game");

const websockets = {}; //property: websocket, value: game

setInterval(() => {

  for (let i in websockets) {

    if (Object.prototype.hasOwnProperty.call(websockets, i)) {
      let game = websockets[i];

      if (game != null && (game.status == Status.ABORTED || game.status == Status.ANDY_WIN || game.status == Status.OTTO_WIN || game.status == Status.DRAW)) {
        console.log("Removing socket " + i);
        delete websockets[i];
      }
    }
  }

  // update online players considering removal of aborted games
  let players = Object.keys(websockets).length;
  
  if (players != onlinePlayers) {
    onlinePlayers = players;
    splashConnection.clients.forEach(client => {
      client.send(Statistics.ONLINE_PLAYERS())
    });
  }
  
}, 2000);

// game allocation data
let gameId = 0;
let currentGame = new Game(gameId++);
let connectionId = 0;

gameConnection.on("connection", (socket) => {
  // set status, if it was previously aborted from one player joining and leaving afterwards
  if (currentGame.status == Status.ABORTED) {
    currentGame.setStatus(Status.WAITING);
  }

  const client = socket;
  client["id"] = connectionId++;
  const playerType = currentGame.addPlayer(client);
  websockets[client["id"]] = currentGame;

  console.log("Connecting socket " + client["id"] + " to game " + currentGame.id);

  // update online players
  onlinePlayers++;
  splashConnection.clients.forEach(client => {
    client.send(Statistics.ONLINE_PLAYERS())
  })

  client.send(Messages.SET_PLAYER(playerType));

  if (currentGame.isFull()) {
    currentGame.setStatus(Math.random() >= 0.5 ? Status.ANDY_TURN : Status.OTTO_TURN);
    currentGame = new Game(gameId++);
  }

  client.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type == Messages.TYPE_PLACE) {
      const game = websockets[client["id"]];

      // don't execute other placements until the current one is completed
      if (game.status != Status.WAITING) {
        let prevStatus = game.status;
        game.setStatus(Status.WAITING);

        let playerType = message.data[0];
        let column = message.data[1];
        let row = game.place(playerType, column);

        if (row >= 0) {
          game.sendMessage(Messages.PUT_CIRCLE(playerType, row, column));

          if (game.checkWinner(row, column)) {
            game.setStatus(playerType == 1 ? Status.ANDY_WIN : Status.OTTO_WIN);

            // update total games
            totalGames++;
            splashConnection.clients.forEach(client => {
              client.send(Statistics.TOTAL_GAMES())
            });

            // update the fastest game time
            let timePlayed = game.timer.getTimePassed();

            if (fastestGame > timePlayed) {
              fastestGame = timePlayed;
              splashConnection.clients.forEach(client => {
                client.send(Statistics.FASTEST_GAME())
              });
            }

          } else {
            // is completely filled
            if (!game.hasSpace()) {
              game.setStatus(Status.DRAW);

              // update total games
              totalGames++;
              splashConnection.clients.forEach(client => {
                client.send(Statistics.TOTAL_GAMES())
              });

              // update the fastest game time
              let timePlayed = game.timer.getTimePassed();

              if (fastestGame > timePlayed) {
                fastestGame = timePlayed;
                splashConnection.clients.forEach(client => {
                  client.send(Statistics.FASTEST_GAME())
                });
              }

            } else {
              game.setStatus(prevStatus == Status.ANDY_TURN ? Status.OTTO_TURN : Status.ANDY_TURN);
            }
          }

        } else {
          // resend current turn
          game.setStatus(prevStatus);
        }
      }
    }
  };

  client.onclose = (event) => {
    console.log(`${client["id"]} disconnected ...`);

    if (event.code == 1001) {
      const game = websockets[client["id"]];

      if (game != null) {
        console.log("Aborting game " + game.id);
        game.setStatus(Status.ABORTED);
      }
    }
  };

  client.onerror = (event) => {
    console.log(event);
  }
});

// not needed because of templating
/*
splashConnection.on("connection", function (socket) {
  socket.send(Statistics.TOTAL_GAMES());
  socket.send(Statistics.ONLINE_PLAYERS());
  socket.send(Statistics.FASTEST_GAME());
})
*/

server.listen(process.env.PORT);