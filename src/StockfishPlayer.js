import Battlechess from "./Battlechess";
import BattleshipSetupBoard from "./boards/BattleshipSetupBoard";
import Utils from "./Utils";

function handleStockfishMessage(ws, playerId, strength, data)
{
    data = JSON.parse(data.data);
    if (data.messageType === "UPDATE_STATE" && data.state === "GAME_ACTIVE") {
        let chess = new Battlechess();
        chess.loadMoveHistory(data.moveHistory);
        if (chess.turn() !== data.color) {
            return;
        }

        let sourceSquare = null;
        let targetSquare = null;

        if (chess.takeKing()) {
            let move = chess.takeKing();
            ws.send(JSON.stringify({
                messageType: "MAKE_MOVE",
                playerId,
                sourceSquare: move.from,
                targetSquare: move.to
            }));
        } else if (chess.legalMoves().length === 0) {
            let moves = chess.moves();
            let move = moves[Math.floor(Math.random() * moves.length)];
            ws.send(JSON.stringify({
                messageType: "MAKE_MOVE",
                playerId,
                sourceSquare: move.from,
                targetSquare: move.to
            }));
        } else {
            const stockfish = new Worker("./stockfish.js");
            const FEN_POSITION = chess.chess.fen();
            
            stockfish.postMessage("uci");
            stockfish.postMessage(`position fen ${FEN_POSITION}`);
            stockfish.postMessage(`go depth ${strength}`);
            
            stockfish.onmessage = (e) => {
                if (e.data.startsWith("bestmove")) {
                    sourceSquare = e.data.split(" ")[1].substring(0, 2);
                    targetSquare = e.data.split(" ")[1].substring(2, 4);
                    ws.send(JSON.stringify({
                        messageType: "MAKE_MOVE",
                        playerId,
                        sourceSquare,
                        targetSquare
                    }));
                }
            };
        }
}
}

export function startStockfishPlayer(gameCode, strength) {
    const playerId = Utils.randomId();

    let board = [];
    for (let x = 0; x < Utils.boardSize; x++) {
        board.push([]);
        for (let y = 0; y < Utils.boardSize; y++) {
            board[x].push(Utils.boardStates.empty);
        }
    }

    let ships = BattleshipSetupBoard.randomShips(BattleshipSetupBoard.initShips());
    ships.forEach(ship => {
        for (let x = ship.position.x; x < ship.position.x + ship.position.width; x++) {
            for (let y = ship.position.y; y < ship.position.y + ship.position.height; y++) {
                board[x][y] = Utils.boardStates.ship;
            }
        }
    });

    const ws = new WebSocket(process.env.REACT_APP_API_URI);
    ws.addEventListener('message', (data) => handleStockfishMessage(ws, playerId, strength, data));
    ws.addEventListener('open', () => {
        ws.send(JSON.stringify({
            messageType: "START_GAME",
            playerId,
            board,
            gameCode,
        }))
    });
}
