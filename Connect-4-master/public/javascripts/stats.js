// @ts-check

function updateStats(event) {
    const message = JSON.parse(event.data);

    if (message.type == "total_games") {
        resetElement("total_games", message.data);
    }

    if (message.type == "online_players") {
        resetElement("online_players", message.data);
    }

    if (message.type == "fastest_game") {
        let time = message.data;
        resetElement("fastest_game", (time != "None" ? `${String(Math.trunc(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}` : time));
    }
}

// replaces content and restarts the animation
function resetElement(id, content) {
    const element = document.getElementById(id);
    const clone = element.cloneNode(true);
    clone.innerHTML = content;
    element.parentNode.replaceChild(clone, element);
}

const socket = new WebSocket("ws://localhost:8080");
socket.onmessage = updateStats;
onbeforeunload = (event) => socket.close();