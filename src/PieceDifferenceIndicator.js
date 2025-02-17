
function PieceDifferenceIndicator({ chess, color }) {
    let differences = chess.pieceDifference(color);
    let pieces = [];
    let sum = 0;
    for (let piece in differences) {
        sum += differences[piece] * chess.pieceValue({ type: piece });
        for (let i = 0; i < differences[piece]; i++) {
            pieces.push(piece);
        }
    }
    return (
        <div style={{display: 'flex', justifyContent: 'end', fontSize: '.75em', color: 'gray', alignItems: 'center'}}>
            <span style={{opacity: sum > 0 ? 1 : 0}}>{'+' + sum}</span>
            {pieces.map((piece, i) => {
                return (<img key={i} src={`${process.env.PUBLIC_URL}/pieces/cburnett/b${piece.toUpperCase()}.svg`} alt={piece}
                style={{
                    height: '1em',
                    opacity: '0.8',
                }}/>);
            })}
        </div>
    );
}

export default PieceDifferenceIndicator;
