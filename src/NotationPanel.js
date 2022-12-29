import './NotationPanel.css';

function NotationPanel(props) {
    let moves = props.chess.moveNotation();
    
    return <div className='notationPanel'>{moves.map(move => <span key={move}>{move}</span>)}</div>;
}

export default NotationPanel;
