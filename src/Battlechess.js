import { WHITE } from "chess.js";
import { BLACK } from "chess.js";
import { QUEEN } from "chess.js";
import { Chess } from "chess.js";

const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// UTILITY FUNCTIONS
/**
 * Extracts the zero-based rank of an 0x88 square.
 */
function rank(square) {
    return square >> 4
}

/**
 * Extracts the zero-based file of an 0x88 square.
 */
function file(square) {
    return square & 0xf
}

/**
 * Converts a 0x88 square to algebraic notation.
 */
function algebraic(square) {
    const f = file(square)
    const r = rank(square)
    return ('abcdefgh'.substring(f, f + 1) +
        '87654321'.substring(r, r + 1))
}

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

    /**
     * PGN:
     * multiple consecutive moves of the same color are separated using
     * . if a ship was hit
     * ↓ if a ship was sunk
     */
    gameNotation() {
        let notation = '1. ';
        let moveNumber = 1;
        this.moveHistory.forEach(move => {
            notation += move.san;
            if (move.sunk) {
                notation += '↓';
            } else if (move.hit) {
                notation += '.';
            } else {
                notation += ' ';
                if (move.color === BLACK) {
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
        let moveObj = null
        const moves = this.chess._moves({ legal: false, square: from })
        for (let i = 0; i < moves.length; i++) {
            if (
                from === algebraic(moves[i].from) &&
                to === algebraic(moves[i].to) &&
                (!('promotion' in moves[i]) || moves[i].promotion === undefined || QUEEN === moves[i].promotion)
            ) {
                moveObj = moves[i]
                break
            }
        }

        if (!moveObj) {
            return null;
        }

        const prettyMove = this.chess._makePretty(moveObj)

        this.moveHistory.push(new Move(prettyMove, hit, sunk));
        this.chess._makeMove(moveObj);

        if (hit) {
            let newFen = this.chess.fen().split(" ");
            newFen[1] = swap_color(newFen[1]); // stay at same color
            newFen[3] = '-'; // remove en passant square
            newFen[5] = newFen[1] === BLACK ? newFen[5] - 1 : newFen[5]; // stay at same fullmove count
            newFen = newFen.join(" ");
            this.chess = new Chess(newFen);
        }

        return prettyMove
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

    moves(square) {
        return this.chess._moves({ legal: false, square }).map((move) => this.chess._makePretty(move));
    }
}

export default Battlechess;