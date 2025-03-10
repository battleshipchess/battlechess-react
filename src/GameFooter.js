import './GameFooter.css';
import CookieConsent from 'react-cookie-consent';

function renderCookieConsent() {
    return <CookieConsent style={{
        color: 'white',
        borderTop: '3px solid black',
        backgroundColor: 'var(--primary-color)',
    }} buttonStyle={{
        backgroundColor: 'white',
        color: 'var(--primary-color)',
        fontWeight: 'bold',
        border: '2px solid black',
        boxShadow: 'black 3px 3px',
        padding: '.75em',
    }} declineButtonStyle={{
        backgroundColor: "transparent",
        color: 'white',
        padding: '0px',
        marginRight: '0px',
    }} buttonText='Accept All' declineButtonText='Decline' enableDeclineButton={true} onAccept={() => {
        window.gtag('consent', 'default', {
            'analytics_storage': 'granted',
        });
    }}>This website uses cookies to enable basic game functionality and to analyze site traffic</CookieConsent>;
}

function GameFooter(props) {
    if (props.state === 'rules') {
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
                                <li>When you capture a piece, all surrounding squares are revealed</li>
                                <li>Win by capturing your opponents king or by sinking his entire fleet</li>
                            </ul>
                        </div>
                    </div>
                    {renderCookieConsent()}
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
                        You've heard of chess? And you know all about battleship? Then let me introduce you to BattleshipChess™! You shoot where you move. You keep moving until you miss. That's it. Try not to lose!
                    </div>
                </div>
                <div className='footerColumn'>
                    <div>
                        About me
                    </div>
                    <div>
                        <img src={process.env.PUBLIC_URL + '/pieces/cburnett/bP.svg'} alt={`black pawn`} className='inline-img pawnAlignment' width='100' height='100' />
                        CS Student who likes chess
                    </div>
                    <div>
                        🐛 Encountered an issue? <a href='https://docs.google.com/forms/d/e/1FAIpQLSdjZ0549F7vNLkBSz__C1ev6Aqsk4YWpfTVaWQbZLTkzp3kNg/viewform?usp=sf_link'>Report it here!</a>
                    </div>
                    <div>
                        💸 <a href='https://www.paypal.com/donate/?hosted_button_id=KTEHDA54Q7CGW'>Support the project</a>
                    </div>
                </div>
                <div className='footerColumn'>
                    <div>
                        Attribution
                    </div>
                    <div>
                        ♫ Sounds used: <a href='https://freesound.org/people/leviclaassen/sounds/107786/'>leviclaassen</a> <a href='https://pixabay.com/sound-effects/9mm-pistol-shoot-short-reverb-7152/'>Pixabay</a> <a href='https://pixabay.com/sound-effects/cannon-shot-6153/'>Pixabay</a> <a href='https://pixabay.com/sound-effects/splash-by-blaukreuz-6261/'>Pixabay</a>
                    </div>
                </div>
                {renderCookieConsent()}
            </div>
        </footer>
    );
}

export default GameFooter;