import './App.css';
import React from 'react';
import Cookies from 'js-cookie';
import Battlechess from './Battlechess';
import AppRender from './AppRender';
import Utils from './Utils';
class App extends React.Component {

    constructor(props) {
        super(props);

        this.size = 8;

        this.states = {
            setup: "SETUP",
            waiting_for_opponent: "WAITING",
            opponent_move: "OPPONENT_MOVE",
            making_move: "MAKING_MOVE",
            game_over: "GAME_OVER",
        }

        this.boardStates = {
            // not ship
            empty: ' ',
            shot: 'x',
            illegal: 'i',

            // ship
            ship: 's',
            hit: '+',
            sunk: '#',
        }

        let board = [];
        for (let x = 0; x < this.size; x++) {
            board.push([]);
            for (let y = 0; y < this.size; y++) {
                board[x].push(this.boardStates.empty);
            }
        }

        if (!Cookies.get("playerId")) {
            Cookies.set("playerId", Utils.randomId(), { expires: 7 });
        }

        this.state = {
            chess: new Battlechess(),
            board: board,
            gameState: this.states.setup,
            playerId: Cookies.get("playerId"),
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
        this.renderGameOver = AppRender.renderGameOver.bind(this);
        this.renderWaitingForOpponent = AppRender.renderWaitingForOpponent.bind(this);
        this.renderDisconnectedOverlay = AppRender.renderDisconnectedOverlay.bind(this);
    }

    componentDidMount() {
        var url = new URL(window.location.href);
        var gameCode = url.searchParams.get("game");
        if (gameCode) {
            this.setState({
                gameCode: gameCode
            });
        }
        const ws = new WebSocket(`ws${process.env.NODE_ENV === 'development' ? '' : 's'}://${process.env.REACT_APP_WS_HOST}:${process.env.REACT_APP_WS_PORT}`);
        ws.addEventListener('message', this.handleMessage);
        ws.addEventListener('open', () => {
            ws.send(JSON.stringify({
                messageType: "QUERY_GAME_STATUS",
                playerId: this.state.playerId,
            }))
        });
        ws.addEventListener('close', () => {
            // delay to prevent popup on page reload
            setTimeout(() => {
                this.setState({
                    disconnected: true,
                })
            }, 2000);
        });
        this.setState({
            ws: ws,
        })

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
        if (data.messageType === "UPDATE_STATE" && data.state === "WAITING_FOR_OPPONENT") {
            this.setState({
                gameState: this.states.waiting_for_opponent,
                gameCode: data.gameCode,
            })
        } else if (data.messageType === "UPDATE_STATE" && data.state === "IDLE") {
            this.setState({
                gameState: this.states.setup,
            })
        } else if (data.messageType === "UPDATE_STATE" && data.state === "GAME_OVER") {
            let chess = new Battlechess();
            chess.loadMoveHistory(data.moveHistory);
            Utils.playSound(data.state);
            this.setState({
                gameState: this.states.game_over,
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
            if (data.moveHistory.length > 0) {
                Utils.playSound(data.moveHistory[data.moveHistory.length - 1]);
            }
            let chess = new Battlechess();
            chess.loadMoveHistory(data.moveHistory);
            let gameState = this.states.making_move;
            if (chess.turn() !== data.color) {
                gameState = this.states.opponent_move;
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
            })
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
                    board[x][y] = this.boardStates.ship;
                }
            }
        });

        if(window.debugBattleshipBoard) {
            board = window.debugBattleshipBoard;    
        }

        this.setState({
            board: board,
            gameState: this.states.waiting_for_opponent,
        })

        this.state.ws.send(JSON.stringify({
            messageType: "START_GAME",
            playerId: this.state.playerId,
            board: board,
            gameCode: gameCode,
        }));

        this.setState({
            gameState: this.states.waiting_for_opponent,
            gameCode: gameCode,
        })
    }

    resetGame() {
        Cookies.set("playerId", Utils.randomId(), { expires: 7 });
        if (this.state.ws) {
            this.state.ws.send(JSON.stringify({
                messageType: "ABORT",
                playerId: this.state.playerId,
            }));
        }
        window.location = window.location.href.split("?")[0];
    }

    resign() {
        this.state.ws.send(JSON.stringify({
            messageType: "ABORT",
            playerId: this.state.playerId,
        }));
    }

    onTimeOut() {
        this.state.ws.send(JSON.stringify({
            messageType: "QUERY_GAME_STATUS",
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
        if (this.state.gameState === this.states.setup) {
            content = this.renderBoardSetup();
        } else if (this.state.gameState === this.states.waiting_for_opponent) {
            content = this.renderWaitingForOpponent();
        } else if (this.state.gameState === this.states.game_over) {
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
        return content;
    }
}

export default App;
