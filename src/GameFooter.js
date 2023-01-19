import './GameFooter.css';

function GameFooter(props) {
    if (props.state === "rules") {
        return (
            <footer className='gameFooter'>
                <div>
                    <div className='footerColumn'>
                        <div>
                            How to play
                        </div>
                        <div>
                            <ul>
                                <li>The left chessboard shows your fleet and where your opponent has hit it</li>
                                <li>The right chessboard shows where you've hit your opponents fleet</li>
                                <li>When you move a chesspiece, you simultaneously shoot at your opponents fleet (right side)</li>
                                <li>When your opponent moves, they shoot at your own fleet (left side)</li>
                                <li>When you hit a ship, you get to move again</li>
                                <li>Win by capturing your opponents king or by sinking his entire fleet</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }
    return (
        <footer className='gameFooter'>
            <div>
                <div className='footerColumn'>
                    <div>
                        How to play
                    </div>
                    <div>
                        You've heard of chess? And you know all about battleship? Then let me introduce you to BattleChess™! You shoot where you move. You keep moving until you miss. That's it. Try not to lose!
                    </div>
                </div>
                <div className='footerColumn'>
                    <div>
                        About me
                    </div>
                    <div>
                        <img src={process.env.PUBLIC_URL + '/pieces/cburnett/bP.svg'} alt={`black pawn`} className="inline-img" width="100" height="100"/>
                        CS Student who likes chess
                    </div>
                    <div>
                        🐛 Encountered an issue? <a href='.'>Report it here!</a>
                    </div>
                    <div>
                        💸 <a href='https://www.paypal.com/donate/?hosted_button_id=KTEHDA54Q7CGW'>Support the project</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default GameFooter;