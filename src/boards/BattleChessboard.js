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

function onChessPieceDragStart(event) {
    let pieceDiv = event.target.closest(".chessPieceOverlay");
    if (!pieceDiv) {
        return;
    }
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

function pieceOverlay(props, x, y) {
    if (props.color === 'b') {
        x = props.size - x - 1;
        y = props.size - y - 1;
    }
    let piece = props.chess.get(square(x, y));
    if (!piece) {
        return null;
    }
    let filename = `${process.env.PUBLIC_URL}/pieces/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`;
    return (<div className="chessPieceOverlay" draggable="true" data-piece={piece.type} data-piececolor={piece.color} data-square={square(x, y)}
        onDragStart={onChessPieceDragStart}
        onDragEnd={onChessPieceDragEnd}>
        <img src={filename} alt={`${piece.color}${piece.type.toUpperCase()}`} />
    </div>);
}

function shipOverlay(content) {
    return (<div data-content={content} className="shipOverlay" />);
}

function BattleChessboard(props) {

    let onDrop = (event) => {
        event.preventDefault();
        let battleshipBoardDiv = event.target.closest(".battleship_board");
        let bounds = battleshipBoardDiv.getBoundingClientRect();
        let xInBoard = event.clientX - bounds.x;
        let yInBoard = event.clientY - bounds.y;

        let x = Math.floor(xInBoard * props.size / bounds.width);
        let y = Math.floor(yInBoard * props.size / bounds.height);
        if (props.color === 'b') {
            x = props.size - x - 1;
            y = props.size - y - 1;
        }

        props.onMove(event.dataTransfer.getData("text"), square(x, y));
    }

    return (
        <div className="battleship_board_container">
            <div className="battleship_board" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
                {Array.from({ length: props.size }, (_, rowIdx) =>
                    Array.from({ length: props.size }, (_, colIdx) =>
                        <div data-col={colIdx + 1} data-row={rowIdx + 1} key={`${colIdx}${rowIdx}`} >
                            {shipOverlay(getContent(props, colIdx, rowIdx))}
                            {pieceOverlay(props, colIdx, rowIdx)}
                        </div>
                    )).flat()}
            </div>
        </div>
    );
}

export default BattleChessboard;