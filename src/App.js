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
import GameFooter from './GameFooter';
import AppHeader from './AppHeader';

const GAME_OVER_CHESS = "chess";
const GAME_OVER_BATTLESHIP = "battleship";
const GAME_OVER_TIME_OUT = "timeout";
const GAME_OVER_RESIGN = "resign";

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
            Cookies.set("playerId", this.randomId(), {expires: 7});
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

    playSound(move) {
        if(move.sunk) {
            const sinkSound = new UIfx(sinkSoundFile, { volume: .3 });
            sinkSound.play();
        } else if (move.hit) {
            const hitSound = new UIfx(hitSoundFile, { volume: .3 });
            hitSound.play();
        } else {
            const missSound = new UIfx(missSoundFile, { volume: .3 });
            missSound.play();
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
            if (data.moveHistory.length > 0) {
                this.playSound(data.moveHistory[data.moveHistory.length - 1]);
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
        Cookies.set("playerId", this.randomId(), {expires: 7});
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

    copyToClipboard(text, event) {
        navigator.clipboard.writeText(text);

        let indicatorTarget = event.target.closest(".shareURL");
        indicatorTarget.classList.remove("copied");
        indicatorTarget.classList.add("copied");
        setTimeout(() => indicatorTarget.classList.remove("copied"), 2000);
    }

    renderBoardSetup() {
        return (
            <div className="App">
                <AppHeader message="Welcome to BattleChess" />
                <div className='mainContent'>
                    <BattleshipSetupBoard onBoardSetupCompleted={this.onBoardSetupCompleted} size={this.size} gameCode={this.state.gameCode} />
                    <div />
                </div>
                <GameFooter />
            </div>
        );
    }

    renderGame() {
        return (
            <div className="App">
                <AppHeader message="BattleChess" />
                <div className='mainContent'>
                    <ChessClock leftoverTime={this.state.leftoverTime} opponentLeftoverTime={this.state.opponentLeftoverTime} lastTimeSync={this.state.lastTimeSync} turn={this.state.chess.turn()} color={this.state.color} onTimeOut={this.onTimeOut} isOpponentLive={this.state.isOpponentLive} />
                    <BattleChessboard chess={this.state.chess} onMove={this.onMove} board={this.state.board} size={this.size} color={this.state.color} lastMove={this.state.lastMove} selectedPiece={this.state.selectedPiece} selectPiece={this.selectPiece} deselectPiece={this.deselectPiece} />
                    <BattleChessboard chess={this.state.chess} onMove={this.onMove} board={this.state.opponentBoard} size={this.size} color={this.state.color} lastMove={this.state.lastMove} selectedPiece={this.state.selectedPiece} selectPiece={this.selectPiece} deselectPiece={this.deselectPiece} />
                </div>
                <div className='mainContentVertical'>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <input type="button" data-type="primary" value="RESIGN" onClick={this.resign} />
                    </div>
                </div>
            </div>
        );
    }

    renderWinner() {
        const gameOverMessages = {
            win: {
                default: ['Congratulations! You Won!'],
            },
            loss: {
                default: ['Looks like you lost. Better luck next time!'],
            }
        }
        gameOverMessages.win[GAME_OVER_CHESS] = ['The king has been captured and your opponents fleet has scattered in fear! Looks like you\'ve won!'];
        gameOverMessages.win[GAME_OVER_BATTLESHIP] = ['Your opponents fleet has been sunk! Well played captain!'];
        gameOverMessages.win[GAME_OVER_TIME_OUT] = ['Looks like time has run out for your opponent. Well played!'];
        gameOverMessages.win[GAME_OVER_RESIGN] = ['Looks like your opponent has fled the battle! Congratulations, you won!'];

        gameOverMessages.loss[GAME_OVER_CHESS] = ['Your king has been captured by your opponent and your army has fled the battle. Better luck next time!'];
        gameOverMessages.loss[GAME_OVER_BATTLESHIP] = ['Your last ship has been sunk! The battle has been lost, but the war is far from over.'];
        gameOverMessages.loss[GAME_OVER_TIME_OUT] = ['Hesitation is the enemy of opportunity. Looks like time has run out this time!'];
        gameOverMessages.loss[GAME_OVER_RESIGN] = ['A good general knows when a battle is lost! Time to regroup and continue the fight!'];

        if (this.state.winner === null) {
            return <div className="game_result">It's a DRAW. Time for a rematch</div>
        }
        let winState = this.state.winner === this.state.color ? "win" : "loss";
        let messageOptions = gameOverMessages[winState][this.state.winCondition];
        if (messageOptions == null || messageOptions.length === 0) {
            messageOptions = gameOverMessages[winState].default;
        }

        let messageIdx = Math.floor(Math.random() * messageOptions.length);
        return <div className="game_result">{messageOptions[messageIdx]}</div>
    }

    renderGameOver() {
        return (
            <div className="App">
                <AppHeader message="Game Over" state="game_over" />
                <div className='mainContent faded disabled'>
                    <ChessClock leftoverTime={this.state.leftoverTime} opponentLeftoverTime={this.state.opponentLeftoverTime} lastTimeSync={this.state.lastTimeSync} turn={null} color={this.state.color} onTimeOut={this.onTimeOut} isOpponentLive={this.state.isOpponentLive} />
                    <BattleChessboard chess={this.state.chess} onMove={this.onMove} board={this.state.board} size={this.size} color={this.state.color} lastMove={this.state.lastMove} selectedPiece={this.state.selectedPiece} selectPiece={this.selectPiece} deselectPiece={this.deselectPiece} />
                    <BattleChessboard chess={this.state.chess} onMove={this.onMove} board={this.state.opponentBoard} size={this.size} color={this.state.color} lastMove={this.state.lastMove} selectedPiece={this.state.selectedPiece} selectPiece={this.selectPiece} deselectPiece={this.deselectPiece} />
                </div>
                <div className='mainContentVertical'>
                    {this.renderWinner()}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <input type="button" data-type="primary" value="NEW GAME" onClick={this.resetGame} />
                    </div>
                </div>
                <GameFooter />
            </div>
        );
    }

    renderWaitingForOpponent() {
        if (!this.state.gameCode) {
            return (
                <div className="App">
                    <AppHeader message="Waiting for opponent" />
                    <div className='mainContentVertical waitingForOpponent'>
                        You will be paired with the next person to start a game
                        <div className="battlechessIcon loading"></div>
                        <input type="button" data-type="primary" value="ABORT" onClick={this.resetGame} />
                    </div>
                    <GameFooter />
                </div>
            );
        } else {
            let url = "https://battlechess.club/?game=" + this.state.gameCode;
            return (
                <div className="App">
                    <AppHeader message="Waiting for opponent" />
                    <div className='mainContentVertical waitingForOpponent'>
                        <div className="shareURL">
                            <div style={{ cursor: 'pointer' }} onClick={(event) => this.copyToClipboard(url, event)}>
                                <img src={process.env.PUBLIC_URL + '/copyicon.svg'} className="inline-img" alt="copy to clipboard" />
                            </div>
                            <div>
                                {url}
                            </div>
                        </div>
                        Invite a friend to play by copying the URL
                        <div className="battlechessIcon loading"></div>
                        <input type="button" data-type="primary" value="ABORT" onClick={this.resetGame} />
                    </div>
                    <GameFooter />
                </div >
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
