import { Chess, SQUARES, QUEEN, WHITE, BLACK, KING } from "chess.js";

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
    constructor({ color, from, to, flags, piece, san }, hitFlags) {
        this.color = color;
        this.from = from;
        this.to = to;
        this.flags = flags;
        this.piece = piece;
        this.san = san;
        this.hitFlags = hitFlags;
    }
}

class Battlechess {
    constructor(fen) {
        this.initialFen = fen ? fen : defaultFen;
        this.chess = new Chess(this.initialFen);
        this.moveHistory = [];
        this.reviewMove = null;
        this.reachedPositions = {};
        this.maxPositionRepetitions = 0;
    }

    setReviewMove(moveIdx) {
        this.reviewMove = moveIdx;

        this.reviewChess = new Chess(this.initialFen);
        this.moveHistory.slice(0, moveIdx + 1).forEach(move => {
            this.renderReviewMove(move);
        })
    }

    halfMoveNotation() {
        let halfMoves = [];
        let notation = '';
        this.moveHistory.forEach(move => {
            notation += move.san.replace('#', '+'); // mate in normal chess isn't mate here
            if (move.san.startsWith('O-O')) {
                if (move.hitFlags.king.sunk) {
                    notation += '↓';
                } else if (move.hitFlags.king.hit) {
                    notation += '.';
                } else if (move.hitFlags.hit) {
                    notation += '_';
                }
                if (move.hitFlags.rook.sunk) {
                    notation += '↓';
                } else if (move.hitFlags.rook.hit) {
                    notation += '.';
                } else if (!move.hitFlags.hit) {
                    halfMoves.push(notation);
                    notation = '';
                }
                return;
            }
            if (move.hitFlags.sunk) {
                notation += '↓';
            } else if (move.hitFlags.hit) {
                notation += '.';
            } else {
                halfMoves.push(notation);
                notation = '';
            }
        });
        if (notation !== '') {
            halfMoves.push(notation);
        }
        return halfMoves;
    }

    /**
     * PGN:
     * multiple consecutive moves of the same color are separated using
     * . if a ship was hit
     * ↓ if a ship was sunk
     */
    moveNotation() {
        let halfMoves = this.halfMoveNotation();
        let moves = [];
        for (let halfMoveNumber = 0; halfMoveNumber < halfMoves.length; halfMoveNumber += 2) {
            moves.push(((halfMoveNumber / 2) + 1) + '. ' + [halfMoves[halfMoveNumber], halfMoves[halfMoveNumber + 1]].join(' '));
        }
        if(moves.length > 0) {
            moves[moves.length - 1] = moves[moves.length - 1].trim(); // possible trailing ' ' from join if second halfmove is empty
            if(this.isMate()) {
                moves[moves.length - 1] += '#';
            }
        }
        return moves;
    }

    loadMoveHistory(moveHistory) {
        this.chess = new Chess(this.initialFen);
        this.moveHistory = [];
        moveHistory.forEach(move => {
            this.move(move.from, move.to, move.hitFlags);
        })
    }

    calculateHitFlags(mainHit, mainSunk, castleHit, castleSunk) {
        return {
            hit: mainHit || castleHit,
            sunk: mainSunk || castleSunk,
            king: {
                hit: mainHit,
                sunk: mainSunk,
            },
            rook: {
                hit: castleHit,
                sunk: castleSunk,
            },
        }
    }

    findMatchingMove(from, to, chess) {
        let moveObj = null
        const moves = chess._moves({ legal: false, square: from })
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

        return moveObj;
    }

    modifyFenOnHit(hitFlags, fen) {
        if (!hitFlags.hit)
            return fen;

        let newFen = fen.split(" ");
        newFen[1] = swap_color(newFen[1]); // stay at same color
        newFen[3] = '-'; // remove en passant square
        newFen[5] = newFen[1] === BLACK ? newFen[5] - 1 : newFen[5]; // stay at same fullmove count
        return newFen.join(" ");
    }

    disableCastling(fen, color) {
        let newFen = fen.split(" ");
        let castling = newFen[2];
        if (color === WHITE) {
            castling = castling.replace('K', '');
            castling = castling.replace('Q', '');
        } else {
            castling = castling.replace('k', '');
            castling = castling.replace('q', '');
        }
        newFen[2] = castling;
        return newFen.join(" ");
    }

    move(from, to, hitFlags) {
        let moveObj = this.findMatchingMove(from, to, this.chess);
        if (!moveObj)
            return null;

        const prettyMove = this.chess._makePretty(moveObj)

        this.moveHistory.push(new Move(prettyMove, hitFlags));
        this.chess._makeMove(moveObj);

        let newFen = this.modifyFenOnHit(hitFlags, this.chess.fen());
        if (moveObj.captured === KING) {
            // disable castling because chess library only checks for rooks that are taken, not kings
            // which leads to an error when moves() is called later
            newFen = this.disableCastling(newFen, this.chess.turn());
        }
        let newPosition = newFen.split(" ").slice(0, 4).join(" ");
        this.chess = new Chess(newFen);

        if (!this.reachedPositions[newPosition])
            this.reachedPositions[newPosition] = 0;
        this.reachedPositions[newPosition] += 1;
        if (this.reachedPositions[newPosition] > this.maxPositionRepetitions)
            this.maxPositionRepetitions = this.reachedPositions[newPosition];

        return prettyMove
    }

    renderReviewMove(move) {
        let moveObj = this.findMatchingMove(move.from, move.to, this.reviewChess);
        if (!moveObj)
            return null;
        this.reviewChess._makeMove(moveObj);
        this.reviewChess = new Chess(this.modifyFenOnHit(move.hitFlags, this.reviewChess.fen()));
    }

    turn() {
        return this.chess.turn();
    }

    get(square) {
        if (this.reviewMove != null)
            return this.reviewChess.get(square);
        return this.chess.get(square);
    }

    moves(square) {
        if (this.reviewMove != null)
            return [];
        return this.chess._moves({ legal: false, square }).map((move) => this.chess._makePretty(move));
    }

    legalMoves(square) {
        if (this.reviewMove != null)
            return [];
        return this.chess._moves({ legal: true, square }).map((move) => this.chess._makePretty(move));
    }

    lastMove() {
        if (this.moveHistory.length === 0)
            return null;
        if (this.reviewMove != null)
            return this.moveHistory[this.reviewMove];
        return this.moveHistory[this.moveHistory.length - 1];
    }

    inCheck(color) {
        let chess = this.chess;
        if (this.reviewMove)
            chess = this.reviewChess;

        return chess._isKingAttacked(color);
    }

    isDraw() {
        let stalemate = this.moves().length === 0 && !this.inCheck(this.turn());
        return this.maxPositionRepetitions >= 3 || stalemate;
    }

    isMate() {
        let fen = this.chess.fen().split(" ")[0]
        return !fen.includes('k') || !fen.includes('K');
    }

    takeKing() {
        for (let square of SQUARES) {
            for (let move of this.moves(square)) {
                if (this.get(move.to) && this.get(move.to).type === 'k') {
                    return move;
                }
            }
        }
        return null;
    }
}

export default Battlechess;