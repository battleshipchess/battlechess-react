import "./BattleshipBoard.css";

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


function pieceOverlay(props, x, y) {
    if (props.color === 'b') {
        x = props.size - x - 1;
        y = props.size - y - 1;
    }
    let piece = props.chess.get(square(x, y));
    if(!piece) {
        return null;
    }
    let filename = `${process.env.PUBLIC_URL}/pieces/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`;
    return (<img src={filename} alt={`${piece.color}${piece.type.toUpperCase()}`}/>);
}

function BattleChessboard(props) {
    return (
        <div className="battleship_board_container">
            <div className="battleship_board">
                <table>
                    <tbody>
                        {Array.from({ length: props.size }, (_, rowIdx) =>
                            <tr key={rowIdx}>
                                {Array.from({ length: props.size }, (_, colIdx) =>
                                    <td data-content={getContent(props, colIdx, rowIdx)} key={colIdx} >
                                        {pieceOverlay(props, colIdx, rowIdx)}
                                    </td>
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BattleChessboard;