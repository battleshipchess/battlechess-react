import React from 'react';
import { Chess } from 'chess.js'
import './App.css';
import MainChessboard from './MainChessboard';
import BattleshipSetupBoard from './BattleshipSetupBoard';

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
      hit: 'x'
    }

    let board = [];
    for (let x = 0; x < this.size; x++) {
      board.push([]);
      for (let y = 0; y < this.size; y++) {
        board[x].push('');
      }
    }
    
    this.state = {
      chess: new Chess(),
      board: board,
      gameState: this.states.setup,
    }

    this.onMove = this.onMove.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.onBoardSetupCompleted = this.onBoardSetupCompleted.bind(this);
  }

  handleMessage(data) {
    data = JSON.parse(data.data);
    if (data.messageType === "UPDATE_STATE") {
      let chess = new Chess();
      chess.loadPgn(data.pgn);
      this.setState({
        chess: chess,
        color: data.color,
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
      sourceSquare: sourceSquare,
      targetSquare: targetSquare
    }))

    this.setState({
      chess: chess,
    });
  }

  onBoardSetupCompleted(ships) {
    let board = JSON.parse(JSON.stringify(this.state.board));
    console.log(board);
    console.log(ships);
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

    const ws = new WebSocket(`ws://${process.env.REACT_APP_WS_HOST}:${process.env.REACT_APP_WS_PORT}`);
    ws.addEventListener('message', this.handleMessage);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        messageType: "START_GAME",
        board: board,
      }));
    });

    this.setState({
      ws: ws,
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
          <BattleshipSetupBoard onBoardSetupCompleted={this.onBoardSetupCompleted} size={this.size}/>
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
          <div />
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
