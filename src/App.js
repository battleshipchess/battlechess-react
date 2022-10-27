import React from 'react';
import { Chess } from 'chess.js'
import Cookies from 'js-cookie';
import './App.css';
import MainChessboard from './boards/MainChessboard';
import BattleshipSetupBoard from './boards/BattleshipSetupBoard';
import BattleshipBoard from './boards/BattleshipBoard';

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
            empty: ' ',
            ship: '+',
            shot: '.',
            hit: 'x',
            sunk: '-',
            illegal: 'i',
        }

        let board = [];
        for (let x = 0; x < this.size; x++) {
            board.push([]);
            for (let y = 0; y < this.size; y++) {
                board[x].push(' ');
            }
        }

        if (!Cookies.get("playerId")) {
            Cookies.set("playerId", this.randomId());
        }

        this.state = {
            chess: new Chess(),
            board: board,
            gameState: this.states.setup,
            playerId: Cookies.get("playerId"),
        };

        this.onMove = this.onMove.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.onBoardSetupCompleted = this.onBoardSetupCompleted.bind(this);
    }

    componentDidMount() {
        const ws = new WebSocket(`ws://${process.env.REACT_APP_WS_HOST}:${process.env.REACT_APP_WS_PORT}`);
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
        } else {
            let chess = new Chess();
            chess.loadPgn(data.pgn);
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
            })
        }
    }

    onMove(sourceSquare, targetSquare, _) {
        if (!this.state.ws) return;
        let chess = new Chess();
        chess.loadPgn(this.state.chess.pgn());
        chess.move({
            from: sourceSquare,
            to: targetSquare
        });

        this.state.ws.send(JSON.stringify({
            messageType: "MAKE_MOVE",
            playerId: this.state.playerId,
            sourceSquare: sourceSquare,
            targetSquare: targetSquare
        }))

        this.setState({
            chess: chess,
        });
    }

    onBoardSetupCompleted(ships) {
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
        }));

        this.setState({
            gameState: this.states.waiting_for_opponent,
        })
    }

    renderBoardSetup() {
        return (
            <div className="App">
                <header className="App-header">
                    <div>Welcome to BattleChess</div>
                </header>
                <div className='mainContent'>
                    <BattleshipSetupBoard onBoardSetupCompleted={this.onBoardSetupCompleted} size={this.size} />
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
                    <MainChessboard chess={this.state.chess} color={this.state.color} onMove={this.onMove} />
                    <BattleshipBoard board={this.state.board} size={this.size} color={this.state.color} />
                    <BattleshipBoard board={this.state.opponentBoard} size={this.size} color={this.state.color} />
                </div>
            </div>
        );
    }

    render() {
        if (this.state.gameState === this.states.setup) {
            return this.renderBoardSetup();
        } else if (this.state.gameState === this.states.waiting_for_opponent) {
            return (
                <div className="App">
                    <header className="App-header">
                        <div>Waiting for opponent</div>
                    </header>
                    <div className='mainContent'>
                        Invite a friend to play
                    </div>
                </div>
            );
        }
        return this.renderGame();
    }
}

export default App;
