import './GameFooter.css';

function GameFooter() {
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
                        <img src={process.env.PUBLIC_URL + '/pieces/cburnett/bP.svg'} alt={`black pawn`} className="inline-img" />
                        CS Student who likes chess
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