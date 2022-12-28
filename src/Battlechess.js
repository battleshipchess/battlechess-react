import { WHITE } from "chess.js";
import { BLACK } from "chess.js";
import { QUEEN } from "chess.js";
import { Chess } from "chess.js";

const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * PGN:
 * multiple consecutive moves of the same color are separated using ;
 * a move resulting in hitting a ship is denoted with *
 * a move resulting in sinking a ship is denoted with ~
 */

// UTILITY FUNCTIONS
function swap_color(c) {
    return c === WHITE ? BLACK : WHITE
}
// ----------------

class Move {
    constructor({ color, from, to, flags, piece, san }, hit, sunk) {
        this.color = color;
        this.from = from;
        this.to = to;
        this.flags = flags;
        this.piece = piece;
        this.san = san;
        this.hit = hit;
        this.sunk = sunk;
    }
}

class Battlechess {
    constructor(fen) {
        this.initialFen = fen ? fen : defaultFen;
        this.chess = new Chess(this.initialFen);
        this.moveHistory = [];
    }

    gameNotation() {
        let notation = '1. ';
        let moveNumber = 1;
        this.moveHistory.forEach(move => {
            notation += move.san;
            if(move.sunk) {
                notation += '↓';
            } else if(move.hit) {
                notation += '.';
            } else {
                notation += ' ';
                if(move.color === BLACK) {
                    moveNumber++;
                    notation += moveNumber + '. '
                }
            }
        });
        return notation;
    }

    loadMoveHistory(moveHistory) {
        this.chess = new Chess(this.initialFen);
        this.moveHistory = [];
        moveHistory.forEach(move => {
            this.move(move.from, move.to, move.hit, move.sunk);
        })
    }

    move(from, to, hit, sunk) {
        let newMove = this.chess.move({
            from: from,
            to: to
        });
        if (!newMove) {
            newMove = this.chess.move({
                from: from,
                to: to,
                promotion: QUEEN
            });
        }

        if (!newMove) {
            return;
        }

        this.moveHistory.push(new Move(newMove, hit, sunk));

        if (hit) {
            let newFen = this.chess.fen().split(" ");
            newFen[1] = swap_color(newFen[1]); // stay at same color
            newFen[3] = '-'; // remove en passant square
            newFen[5] = newFen[1] === BLACK ? newFen[5] - 1 : newFen[5]; // stay at same fullmove count
            newFen = newFen.join(" ");
            this.chess = new Chess(newFen);
        }

        return newMove;
    }

    turn() {
        return this.chess.turn();
    }

    notTurn() {
        return swap_color(this.chess.turn());
    }

    get(square) {
        return this.chess.get(square);
    }

    moves({ verbose, square, }) {
        return this.chess.moves({ verbose, square, });
    }
}

export default Battlechess;