import './App.css';
import React from 'react';
import Cookies from 'js-cookie';
import Battlechess from './Battlechess';
import AppRender from './AppRender';
import Utils from './Utils';
import { startStockfishPlayer } from './StockfishPlayer';
class App extends React.Component {

    constructor(props) {
        super(props);

        let board = [];
        for (let x = 0; x < Utils.boardSize; x++) {
            board.push([]);
            for (let y = 0; y < Utils.boardSize; y++) {
                board[x].push(Utils.boardStates.empty);
            }
        }

        if (!Cookies.get("playerId")) {
            Cookies.set("playerId", Utils.randomId(), { expires: 1 });
        }

        this.state = {
            chess: new Battlechess(),
            board: board,
            gameState: Utils.gameStates.setup,
            playerId: Cookies.get("playerId"),
            lastMoveSoundPlayed: null,
        };

        this.onMove = this.onMove.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.onBoardSetupCompleted = this.onBoardSetupCompleted.bind(this);
        this.resetGame = this.resetGame.bind(this);
        this.resign = this.resign.bind(this);
        this.selectPiece = this.selectPiece.bind(this);
        this.deselectPiece = this.deselectPiece.bind(this);
        this.onTimeOut = this.onTimeOut.bind(this);
        this.reviewMove = this.reviewMove.bind(this);
        this.reviewMoveDelta = this.reviewMoveDelta.bind(this);

        this.renderBoardSetup = AppRender.renderBoardSetup.bind(this);
        this.renderGame = AppRender.renderGame.bind(this);
        this.renderWinner = AppRender.renderWinner.bind(this);
        this.renderPermanentGameURL = AppRender.renderPermanentGameURL.bind(this);
        this.renderGameOver = AppRender.renderGameOver.bind(this);
        this.renderWaitingForOpponent = AppRender.renderWaitingForOpponent.bind(this);
        this.renderDisconnectedOverlay = AppRender.renderDisconnectedOverlay.bind(this);
        this.renderResignConfirmationOverlay = AppRender.renderResignConfirmationOverlay.bind(this);
        this.renderArchivedGame = AppRender.renderArchivedGame.bind(this);
    }

    reconnect(reconnectAttempts) {
        if (this.state.ws && this.state.ws.readyState === WebSocket.OPEN) {
            this.state.ws.close();
        }
        const ws = new WebSocket(process.env.REACT_APP_API_URI);
        ws.addEventListener('message', this.handleMessage);
        ws.addEventListener('open', () => {
            if (this.state.gameState === Utils.gameStates.archived_game) {
                ws.send(JSON.stringify({
                    messageType: "QUERY_ARCHIVED_GAME",
                    playerId: this.state.playerId,
                    gameId: this.state.archivedGame,
                }))
            } else {
                ws.send(JSON.stringify({
                    messageType: "QUERY_GAME_STATUS",
                    playerId: this.state.playerId,
                }))
            }
        });
        let errorHandler = () => {
            if (reconnectAttempts <= 0) {
                this.setState({
                    disconnected: true,
                })
            }
            else {
                this.reconnect(reconnectAttempts - 1);
            }
        };
        ws.addEventListener('close', errorHandler);
        ws.addEventListener('error', errorHandler);
        this.setState({
            ws: ws,
        })
    }

    componentDidMount() {
        var url = new URL(window.location.href);
        var gameCode = url.searchParams.get("game");
        var archivedGame = url.searchParams.get("archive");
        if (gameCode) {
            this.setState({
                gameCode: gameCode
            });
        } else if (archivedGame) {
            this.setState({
                gameState: Utils.gameStates.archived_game,
                archivedGame: archivedGame,
            })
        }

        this.reconnect(1);

        document.onkeydown = (e) => {
            if (e.key === 'ArrowLeft') {
                this.reviewMoveDelta(-1);
            }
            else if (e.key === 'ArrowRight') {
                this.reviewMoveDelta(1);
            }
        }
    }

    handleMessage(data) {
        data = JSON.parse(data.data);
        if (data.messageType === "UPDATE_STATE" && data.state === "ARCHIVED_GAME") {
            let chess = new Battlechess();
            chess.loadMoveHistory(data.moveHistory);
            this.setState({
                chess: chess,
                whitePlayerBoard: data.board1,
                blackPlayerBoard: data.board2,
            })
        } else if (data.messageType === "UPDATE_STATE" && data.state === "WAITING_FOR_OPPONENT") {
            this.setState({
                gameState: Utils.gameStates.waiting_for_opponent,
                gameCode: data.gameCode,
            })
        } else if (data.messageType === "UPDATE_STATE" && data.state === "IDLE") {
            this.setState({
                gameState: Utils.gameStates.setup,
            })
        } else if (data.messageType === "UPDATE_STATE" && data.state === "GAME_OVER") {
            let chess = new Battlechess();
            chess.loadMoveHistory(data.moveHistory);
            if (this.state.gameState !== Utils.gameStates.game_over && this.state.lastMoveSoundPlayed !== null)
                Utils.playSound(data.state);
            this.setState({
                gameState: Utils.gameStates.game_over,
                winner: data.winner,
                winCondition: data.winCondition,
                chess: chess,
                color: data.color,
                board: data.board,
                opponentBoard: data.opponentBoard,
                leftoverTime: data.leftoverTime,
                opponentLeftoverTime: data.opponentLeftoverTime,
                lastTimeSync: Date.now(),
                isOpponentLive: data.isOpponentLive,
                selectedPiece: null,
            })
        } else {
            if (this.state.gameState === Utils.gameStates.waiting_for_opponent) {
                Utils.playSound("START_GAME");
            } else if (data.moveHistory.length > 0 && this.state.lastMoveSoundPlayed !== null && data.moveHistory.length !== this.state.lastMoveSoundPlayed) {
                Utils.playSound(data.moveHistory[data.moveHistory.length - 1]);
            }
            let chess = new Battlechess();
            chess.loadMoveHistory(data.moveHistory);
            let gameState = Utils.gameStates.making_move;
            if (chess.turn() !== data.color) {
                gameState = Utils.gameStates.opponent_move;
            }
            this.setState({
                chess: chess,
                color: data.color,
                gameState: gameState,
                board: data.board,
                opponentBoard: data.opponentBoard,
                leftoverTime: data.leftoverTime,
                opponentLeftoverTime: data.opponentLeftoverTime,
                lastTimeSync: Date.now(),
                isOpponentLive: data.isOpponentLive,
                lastMoveSoundPlayed: data.moveHistory.length
            })

            var url = new URL(window.location.href);
            var stockfish = url.searchParams.get("stockfish");
            if (stockfish && !data.isOpponentLive)
            {
                startStockfishPlayer('', 'stockfish' + this.state.playerId, stockfish)
            }
        }
    }

    onMove(sourceSquare, targetSquare, _) {
        if (!this.state.ws) return;
        this.setState({
            selectedPiece: null,
        })
        if (this.state.chess.turn() !== this.state.color) return;

        let chess = new Battlechess();
        chess.loadMoveHistory(this.state.chess.moveHistory);
        let move = chess.move(sourceSquare, targetSquare, chess.calculateHitFlags(false, false, false, false));
        if (move) {
            this.state.ws.send(JSON.stringify({
                messageType: "MAKE_MOVE",
                playerId: this.state.playerId,
                sourceSquare: sourceSquare,
                targetSquare: targetSquare
            }))

            this.setState({
                chess: chess,
                leftoverTime: this.state.leftoverTime - (Date.now() - this.state.lastTimeSync),
                lastTimeSync: Date.now(),
            });
        }
    }

    deselectPiece() {
        this.setState({
            selectedPiece: null
        })
    }

    selectPiece(x, y) {
        this.setState({
            selectedPiece: { x, y }
        })
    }

    onBoardSetupCompleted(ships, gameCode) {
        let board = JSON.parse(JSON.stringify(this.state.board));
        ships.forEach(ship => {
            for (let x = ship.position.x; x < ship.position.x + ship.position.width; x++) {
                for (let y = ship.position.y; y < ship.position.y + ship.position.height; y++) {
                    board[x][y] = Utils.boardStates.ship;
                }
            }
        });

        if (window.debugBattleshipBoard) {
            board = window.debugBattleshipBoard;
        }

        this.state.ws.send(JSON.stringify({
            messageType: "START_GAME",
            playerId: this.state.playerId,
            board: board,
            gameCode: gameCode,
        }));
        
        this.setState({
            board: board,
            gameState: Utils.gameStates.waiting_for_opponent,
            gameCode: gameCode,
        })

        return this.state.playerId;
    }

    resetGame() {
        Cookies.set("playerId", Utils.randomId(), { expires: 7 });
        if (this.state.ws && this.state.ws.readyState === WebSocket.OPEN) {
            this.state.ws.send(JSON.stringify({
                messageType: "ABORT",
                playerId: this.state.playerId,
            }));
        }
        window.location = window.location.href.split("?")[0];
    }

    resign() {
        this.setState({resignConfirmation: null});
        this.state.ws.send(JSON.stringify({
            messageType: "ABORT",
            playerId: this.state.playerId,
        }));
    }

    onTimeOut() {
        this.state.ws.send(JSON.stringify({
            messageType: "QUERY_TIMEOUT",
            playerId: this.state.playerId,
        }))
    }

    reviewMove(moveIdx) {
        if (!this.state.chess) return;
        if (moveIdx >= this.state.chess.moveHistory.length - 1)
            moveIdx = null;
        if (moveIdx < -1)
            moveIdx = -1;

        this.state.chess.setReviewMove(moveIdx);

        this.setState({
            chess: this.state.chess,
        })
    }

    reviewMoveDelta(delta) {
        if (!this.state.chess) return;
        let moveIdx = this.state.chess.reviewMove;
        if (moveIdx === null)
            moveIdx = this.state.chess.moveHistory.length - 1;

        moveIdx += delta;

        this.reviewMove(moveIdx);
    }

    render() {
        let content = null;
        if (this.state.gameState === Utils.gameStates.archived_game) {
            if (this.state.whitePlayerBoard && this.state.blackPlayerBoard)
                content = this.renderArchivedGame();
        } else if (this.state.gameState === Utils.gameStates.setup) {
            content = this.renderBoardSetup();
        } else if (this.state.gameState === Utils.gameStates.waiting_for_opponent) {
            content = this.renderWaitingForOpponent();
        } else if (this.state.gameState === Utils.gameStates.game_over) {
            content = this.renderGameOver();
        } else {
            content = this.renderGame();
        }

        if (this.state.disconnected) {
            return (<>
                {content}
                {this.renderDisconnectedOverlay()}
            </>);
        }
        if (this.state.resignConfirmation) {
            return (<>
                {content}
                {this.renderResignConfirmationOverlay()}
            </>);
        }
        return content;
    }
}

export default App;
