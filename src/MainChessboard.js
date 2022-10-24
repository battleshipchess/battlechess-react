import React from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";

class MainChessboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};

        this.allowDrag = this.allowDrag.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    allowDrag(pieceInfo) {
        return this.props.color === this.props.chess.turn() && pieceInfo.piece[0] === this.props.chess.turn();
    }

    onDrop({sourceSquare, targetSquare, piece}) {
        let chess = new Chess();
        chess.loadPgn(this.props.chess.pgn());

        if(chess.move({
            from: sourceSquare,
            to: targetSquare
        })) {
            this.props.onMove(sourceSquare, targetSquare, piece);
        }
    }

    render() {
        let orientation = 'white';
        if(this.props.color === 'b') {
            orientation = 'black';
        }
        return (
            <Chessboard position={this.props.chess.fen()} allowDrag={this.allowDrag} onDrop={this.onDrop} orientation={orientation}/>
        );
    }
}

export default MainChessboard;