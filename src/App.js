import React from 'react';
import Cookies from 'js-cookie';
import './App.css';
import BattleshipSetupBoard from './boards/BattleshipSetupBoard';
import BattleChessboard from './boards/BattleChessboard';
import Battlechess from './Battlechess';
import ChessClock from './ChessClock';

import UIfx from 'uifx';
import missSoundFile from './sounds/splash-by-blaukreuz-6261.mp3';
import hitSoundFile from './sounds/9mm-pistol-shoot-short-reverb-7152.mp3';
import sinkSoundFile from './sounds/cannon-shot-6153-cropped.mp3';
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
            Cookies.set("playerId", this.randomId());
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
        this.selectPiece = this.selectPiece.bind(this);
        this.deselectPiece = this.deselectPiece.bind(this);
        this.onTimeOut = this.onTimeOut.bind(this);
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
        this.setState({
            ws: ws,
        })
    }

    randomId() {
        const dateString = Date.now().toString(36);
        const randomness = Math.random().toString(36).substring(2);
        return dateString + randomness;
    }

    playSound(lastAction) {
        const missSound = new UIfx(missSoundFile, { volume: .3 });
        const hitSound = new UIfx(hitSoundFile, { volume: .3 });
        const sinkSound = new UIfx(sinkSoundFile, { volume: .3 });
        console.log(lastAction);
        switch (lastAction) {
            case this.boardStates.hit:
                hitSound.play();
                break;
            case this.boardStates.shot:
                missSound.play();
                break;
            case this.boardStates.sunk:
                sinkSound.play();
                break;
            default:
                break;
        }
    }

    handleMessage(data) {
        data = JSON.parse(data.data);
        if (data.messageType === "UPDATE_STATE" && data.state === "WAITING_FOR_OPPONENT") {
            this.setState({
                gameState: this.states.waiting_for_opponent,
            })
        } else if (data.messageType === "UPDATE_STATE" && data.state === "IDLE") {
            this.setState({
                gameState: this.states.setup,
            })
        } else if (data.messageType === "UPDATE_STATE" && data.state === "GAME_OVER") {
            let chess = new Battlechess();
            chess.loadMoveHistory(data.moveHistory);
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
                lastMove: data.lastMove,
                isOpponentLive: data.isOpponentLive,
            })
        } else {
            this.playSound(data.lastAction);
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
                lastMove: data.lastMove,
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
        let move = chess.move(sourceSquare, targetSquare);
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
        Cookies.set("playerId", this.randomId());
        if(this.state.ws) {
            this.state.ws.send(JSON.stringify({
                messageType: "ABORT",
                playerId: this.state.playerId,
            }));
        }
        window.location = window.location.href.split("?")[0];
    }

    onTimeOut() {
        this.state.ws.send(JSON.stringify({
            messageType: "QUERY_GAME_STATUS",
            playerId: this.state.playerId,
        }))
    }

    renderBoardSetup() {
        return (
            <div className="App">
                <header className="App-header">
                    <div>Welcome to BattleChess</div>
                </header>
                <div className='mainContent'>
                    <BattleshipSetupBoard onBoardSetupCompleted={this.onBoardSetupCompleted} size={this.size} gameCode={this.state.gameCode} />
                    <div />
                </div>
            </div>
        );
    }

    renderGame() {
        return (
            <div className="App">
                <header className="App-header">
                    <div>Battle to the death</div>
                </header>
                <div className='mainContent'>
                    <ChessClock leftoverTime={this.state.leftoverTime} opponentLeftoverTime={this.state.opponentLeftoverTime} lastTimeSync={this.state.lastTimeSync} turn={this.state.chess.turn()} color={this.state.color} onTimeOut={this.onTimeOut} isOpponentLive={this.state.isOpponentLive} />
                    <BattleChessboard chess={this.state.chess} onMove={this.onMove} board={this.state.board} size={this.size} color={this.state.color} lastMove={this.state.lastMove} selectedPiece={this.state.selectedPiece} selectPiece={this.selectPiece} deselectPiece={this.deselectPiece} />
                    <BattleChessboard chess={this.state.chess} onMove={this.onMove} board={this.state.opponentBoard} size={this.size} color={this.state.color} lastMove={this.state.lastMove} selectedPiece={this.state.selectedPiece} selectPiece={this.selectPiece} deselectPiece={this.deselectPiece} />
                </div>
            </div>
        );
    }

    renderWinner() {
        if (this.state.winner === null) {
            return <div className="game_result">It's a DRAW. Time for a rematch</div>
        } else if (this.state.winner === this.state.color) {
            return <div className="game_result">Congratulations! You Won!</div>
        } else {
            return <div className="game_result">Looks like you lost. Better luck next time!</div>
        }
    }

    renderGameOver() {
        return (
            <div className="App">
                <header className="App-header" data-state="game_over">
                    <div>Game Over</div>
                </header>
                <div className='mainContent faded disabled'>
                    <ChessClock leftoverTime={this.state.leftoverTime} opponentLeftoverTime={this.state.opponentLeftoverTime} lastTimeSync={this.state.lastTimeSync} turn={null} color={this.state.color} onTimeOut={this.onTimeOut} isOpponentLive={this.state.isOpponentLive} />
                    <BattleChessboard chess={this.state.chess} onMove={this.onMove} board={this.state.board} size={this.size} color={this.state.color} lastMove={this.state.lastMove} selectedPiece={this.state.selectedPiece} selectPiece={this.selectPiece} deselectPiece={this.deselectPiece} />
                    <BattleChessboard chess={this.state.chess} onMove={this.onMove} board={this.state.opponentBoard} size={this.size} color={this.state.color} lastMove={this.state.lastMove} selectedPiece={this.state.selectedPiece} selectPiece={this.selectPiece} deselectPiece={this.deselectPiece} />
                </div>
                {this.renderWinner()}
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <input type="button" data-type="primary" value="NEW GAME" onClick={this.resetGame} />
                </div>
            </div>
        );
    }

    renderWaitingForOpponent() {
        if (!this.state.gameCode) {
            return (
                <div className="App">
                    <header className="App-header">
                        <div>Waiting for opponent</div>
                    </header>
                    <div className='mainContentVertical waitingForOpponent'>
                        You will be paired with the next person to start a game
                        <div className="battlechessIcon loading"></div>
                        <input type="button" data-type="primary" value="ABORT" onClick={this.resetGame} />
                    </div>
                </div>
            );
        } else {
            let url = "https://battlechess.club/?game=" + this.state.gameCode;
            return (
                <div className="App">
                    <header className="App-header">
                        <div>Waiting for opponent</div>
                    </header>
                    <div className='mainContent waitingForOpponent'>
                        Copy this and share it with a friend to play <br />
                        {url}
                    </div>
                    <div className="loadingIcon"></div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <input type="button" data-type="primary" value="ABORT" onClick={this.resetGame} />
                    </div>
                </div>
            );
        }
    }

    render() {
        if (this.state.gameState === this.states.setup) {
            return this.renderBoardSetup();
        } else if (this.state.gameState === this.states.waiting_for_opponent) {
            return this.renderWaitingForOpponent();
        } else if (this.state.gameState === this.states.game_over) {
            return this.renderGameOver();
        }
        return this.renderGame();
    }
}

export default App;
