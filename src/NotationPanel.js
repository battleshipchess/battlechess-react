import './NotationPanel.css';
import nextMoveSvg from './play-outline.svg';

function subMoves(move) {
    return move.split(' ').slice(1).map(m => m.split(/[._↓]+/).length).reduce((partialSum, a) => partialSum + a, 0);;
}

function NotationPanel(props) {
    let moves = props.chess.moveNotation();
    let highlightedMove = props.chess.reviewMove;
    if (highlightedMove === -1) highlightedMove = 0;
    if (highlightedMove === null) highlightedMove = props.chess.moveHistory.length - 1;
    let moveIdx = 0;

    return <div className='notationPanel'>
        {moves.length ?
            <div className='previousMove' onClick={() => props.reviewMoveDelta(-1)}><img src={nextMoveSvg} width={1} height={1} alt="previous move" /></div> : null}
        {moves.map(move => {
            let style = {};
            if (moveIdx <= highlightedMove && moveIdx + subMoves(move) > highlightedMove) {
                style = {
                    fontWeight: 'bold',
                }
            }
            let curMoveIdx = moveIdx;
            moveIdx += subMoves(move);
            return <span key={move} style={style} onClick={() => {props.reviewMove(curMoveIdx)}}>{move}</span>
        })}
        {moves.length ?
            <div className='nextMove' onClick={() => props.reviewMoveDelta(1)}><img src={nextMoveSvg} width={1} height={1} alt="next move" /></div> : null}
    </div>;
}

export default NotationPanel;
