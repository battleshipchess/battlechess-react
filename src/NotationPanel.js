import './NotationPanel.css';

function subMoves(move) {
    return move.split(' ').slice(1).map(m => m.split(/[._↓]+/).length).reduce((partialSum, a) => partialSum + a, 0);;
}

function NotationPanel(props) {
    let moves = props.chess.moveNotation();
    let highlightedMove = props.chess.reviewMove;
    if (highlightedMove === -1) highlightedMove = 0;
    if (highlightedMove === null) highlightedMove = props.chess.moveHistory.length - 1;
    let moveIdx = 0;

    return <div className='notationPanel'>{moves.map(move => {
        let style = {};
        if (moveIdx <= highlightedMove && (moveIdx += subMoves(move)) > highlightedMove) {
            style = {
                fontWeight: 'bold',
            }
        }
        return <span key={move} style={style}>{move}</span>
    })}</div>;
}

export default NotationPanel;
