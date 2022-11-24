import { useEffect, useRef } from 'react';
import "./BattleshipBoard.css";
import "./Chessboard.css";

function getContent(props, colIdx, rowIdx) {
    if (props.color === 'b') {
        return props.board[props.size - colIdx - 1][props.size - rowIdx - 1];
    }
    return props.board[colIdx][rowIdx];
}

function square(x, y) {
    let alphabet = 'abcdefghijklmnopqrstuvwxyz';
    return `${alphabet[x]}${8 - y}`
}

function squareColor(x, y) {
    return ["light", "dark"][(x + y) % 2];
}

function onChessPieceDragStart(event, props) {
    let pieceDiv = event.target.closest(".chessPieceOverlay");
    if (!pieceDiv) {
        return;
    }
    props.selectPiece(pieceDiv.dataset.x, pieceDiv.dataset.y);
    event.dataTransfer.setData("text", `${pieceDiv.dataset.square}`);
    event.dataTransfer.dropEffect = "move";
    setTimeout(() => pieceDiv.classList.add("draggingChessPiece"), 1)
}

function onChessPieceDragEnd(event) {
    let pieceDiv = event.target.closest(".chessPieceOverlay");
    if (!pieceDiv) {
        return;
    }
    pieceDiv.classList.remove("draggingChessPiece")
}

function pieceOverlay(props, x, y, selectPiece) {
    if (props.color === 'b') {
        x = props.size - x - 1;
        y = props.size - y - 1;
    }
    let piece = props.chess.get(square(x, y));
    if (!piece) {
        return null;
    }
    let filename = `${process.env.PUBLIC_URL}/pieces/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`;
    return (<div className="chessPieceOverlay" draggable="true" data-piece={piece.type} data-piececolor={piece.color} data-square={square(x, y)} data-x={x} data-y={y}
        onDragStart={(event) => onChessPieceDragStart(event, props)}
        onDragEnd={onChessPieceDragEnd}
        onClick={selectPiece}>
        <img src={filename} alt={`${piece.color}${piece.type.toUpperCase()}`} />
    </div>);
}

function shipOverlay(content) {
    return (<div data-content={content} className="shipOverlay" />);
}

function lastMoveHighlight(x, y, props) {
    if (props.color === 'b') {
        x = props.size - x - 1;
        y = props.size - y - 1;
    }
    if (props.lastMove != null && props.lastMove.from === square(x, y)) {
        return (<div className="fromSquare" />);
    } else if (props.lastMove != null && props.lastMove.to === square(x, y)) {
        return (<div className="toSquare" />);
    }
    return (<div />);
}

function checkHighlight(x, y, props) {
    if (props.color === 'b') {
        x = props.size - x - 1;
        y = props.size - y - 1;
    }
    let piece = props.chess.get(square(x, y));
    if (props.chess.chess.inCheck() && piece.type === 'k' && piece.color === props.chess.turn()) {
        return (<div className="inCheck" />);
    }
    return (<div />);
}

function selectedPieceHighlight(x, y, props) {
    if (props.color === 'b') {
        x = props.size - x - 1;
        y = props.size - y - 1;
    }
    if (props.selectedPiece) {
        if (props.selectedPiece.x == x && props.selectedPiece.y == y) {
            return (<div className="selectedPiece" />);
        }
        let squareName = square(props.selectedPiece.x, props.selectedPiece.y);
        let moveOptions = props.chess.chess.moves({ square: squareName, verbose: true });
        moveOptions = moveOptions.map(move => move.to);
        if (moveOptions.includes(square(x, y))) {
            return (<div className="moveOption" />);
        }
    }
    return <div />;
}

function calculateCoordinates(event, color, size) {
    let battleshipBoardDiv = event.target.closest(".battleship_board");
    let bounds = battleshipBoardDiv.getBoundingClientRect();
    let xInBoard = event.clientX - bounds.x;
    let yInBoard = event.clientY - bounds.y;

    let x = Math.floor(xInBoard * size / bounds.width);
    let y = Math.floor(yInBoard * size / bounds.height);
    if (color === 'b') {
        x = size - x - 1;
        y = size - y - 1;
    }

    return [x, y];
}

function BattleChessboard(props) {
    const boardRef = useRef(null);

    let onDrop = (event) => {
        event.preventDefault();

        let [x, y] = calculateCoordinates(event, props.color, props.size);

        props.onMove(event.dataTransfer.getData("text"), square(x, y));
    }

    let selectPiece = (event) => {
        event.stopPropagation();

        let [x, y] = calculateCoordinates(event, props.color, props.size);

        let piece = props.chess.get(square(x, y));
        if (piece && piece.color === props.color) {
            props.selectPiece(x, y);
        } else if (props.selectedPiece) {
            let from = square(props.selectedPiece.x, props.selectedPiece.y);
            let to = square(x, y);
            props.onMove(from, to);
        }
    }

    useEffect(() => {
        let deselectPiece = (event) => {
            event.preventDefault();
            props.deselectPiece();
        }

        let curBoardRef = boardRef.current;
        if (boardRef.current) {
            boardRef.current.addEventListener('contextmenu', deselectPiece);
        }

        return () => {
            if (curBoardRef) {
                curBoardRef.removeEventListener('contextmenu', deselectPiece);
            }
        }
    });

    return (
        <div className="battleship_board_container">
            <div className="battleship_board" onDrop={onDrop} onDragOver={(event) => event.preventDefault()} onClick={selectPiece} ref={boardRef}>
                {Array.from({ length: props.size }, (_, rowIdx) =>
                    Array.from({ length: props.size }, (_, colIdx) =>
                        <div data-col={colIdx + 1} data-row={rowIdx + 1} key={`${colIdx}${rowIdx}`} >
                            {lastMoveHighlight(colIdx, rowIdx, props)}
                            {shipOverlay(getContent(props, colIdx, rowIdx))}
                            {selectedPieceHighlight(colIdx, rowIdx, props)}
                            {checkHighlight(colIdx, rowIdx, props)}
                            {pieceOverlay(props, colIdx, rowIdx, selectPiece)}
                        </div>
                    )).flat()}
            </div>
        </div>
    );
}

export default BattleChessboard;