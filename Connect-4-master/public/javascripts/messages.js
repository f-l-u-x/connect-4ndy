// @ts-check

(function (exports) {

    // server -> client
    exports.TYPE_SET_PLAYER = "set_player";
    exports.SET_PLAYER = function (playerType) {
        return JSON.stringify({
            type: exports.TYPE_SET_PLAYER,
            data: playerType
        });
    };

    // server -> client
    exports.TYPE_SET_TURN = "set_turn";
    exports.SET_TURN = function (playerType) {
        return JSON.stringify({
            type: exports.TYPE_SET_TURN,
            data: playerType
        });
    };

    // server -> client
    exports.TYPE_SET_WINNER = "set_winner";
    exports.SET_WINNER = function (playerType) {
        return JSON.stringify({
            type: exports.TYPE_SET_WINNER,
            data: playerType
        });
    };

    // client -> server
    exports.TYPE_PLACE = "place";
    exports.PLACE = function (playerType, column) {
        return JSON.stringify({
            type: exports.TYPE_PLACE,
            data: [playerType, column]
        });
    };

    // server -> client
    exports.TYPE_PUT_CIRCLE = "put_circle";
    exports.PUT_CIRCLE = function (playerType, row, column) {
        return JSON.stringify({
            type: exports.TYPE_PUT_CIRCLE,
            data: [playerType, row, column]
        });
    };

    // server -> client
    exports.TYPE_SET_TIME = "set_time";
    exports.SET_TIME = (time) => {
        return JSON.stringify({
           type: exports.TYPE_SET_TIME,
           data: time 
        });
    };
    
})(typeof exports === "undefined" ? (this.Messages = {}) : exports);