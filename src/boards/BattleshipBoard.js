import "./BattleshipBoard.css";

function getContent(props, colIdx, rowIdx) {
    if(props.color === 'b') {
        return props.board[props.size - colIdx - 1][props.size - rowIdx - 1];
    }
    return props.board[colIdx][rowIdx];
}

function BattleshipSetupBoard(props) {
    return (
        <div className="battleship_board_container">
            <div className="battleship_board">
                <table>
                    <tbody>
                        {Array.from({ length: props.size }, (_, rowIdx) =>
                            <tr key={rowIdx}>
                                {Array.from({ length: props.size }, (_, colIdx) =>
                                    <td data-content={getContent(props, colIdx, rowIdx)} key={colIdx} />
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BattleshipSetupBoard;