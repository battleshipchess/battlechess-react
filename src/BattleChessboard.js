
import React from "react";
import "./BattleshipBoard.css";
import { Chess } from "chess.js";

class BattleChessboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.onDrop = this.onDrop.bind(this);
    }

    onDrop({ sourceSquare, targetSquare, pieceInfo }) {
        let chess = new Chess();
        chess.loadPgn(this.props.chess.pgn());

        if (chess.move({
            from: sourceSquare,
            to: targetSquare
        })) {
            this.props.onMove(sourceSquare, targetSquare, pieceInfo);
        }
    }

    squareStatus(x, y) {
        if (this.props.color === 'b') {
            x = this.props.size - x;
            y = this.props.size - y;
        }
        return this.props.opponentBoard[x][y];
    }

    render() {
        return (<div className="battleship_board">
            <table>
                <tbody>
                    {Array.from({ length: this.props.size }, (_, rowIdx) =>
                        <tr key={rowIdx}>
                            {Array.from({ length: this.props.size }, (_, colIdx) =>
                                <td key={colIdx} data-square-status={this.squareStatus(colIdx, rowIdx)} />
                            )}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>);
    }
}

export default BattleChessboard;