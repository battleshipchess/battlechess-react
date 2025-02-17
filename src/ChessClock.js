import React from "react";
import "./ChessClock.css";
import PieceDifferenceIndicator from "./PieceDifferenceIndicator";
import { WHITE } from "chess.js";
import { BLACK } from "chess.js";

class ChessClock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    formatTime(leftoverMillis) {
        let mm = Math.max(0, Math.floor(leftoverMillis / 1000 / 60));
        let ss = Math.max(0, Math.floor((leftoverMillis / 1000) % 60));
        if (mm < 10) mm = "0" + mm;
        if (ss < 10) ss = "0" + ss;
        return `${mm}:${ss}`;
    }

    initRefreshInterval() {
        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId);
        }
        if (this.props.turn) {
            this.refreshIntervalId = setInterval(() => {
                let opponentTime = null;
                let playerTime = null;
                if (this.props.turn === null) {
                    opponentTime = this.props.opponentLeftoverTime;
                    playerTime = this.props.leftoverTime;
                    clearInterval(this.refreshIntervalId);
                } else if (this.props.turn === this.props.color) {
                    opponentTime = this.props.opponentLeftoverTime;
                    playerTime = this.props.leftoverTime - (Date.now() - this.props.lastTimeSync);
                } else {
                    opponentTime = this.props.opponentLeftoverTime - (Date.now() - this.props.lastTimeSync);
                    playerTime = this.props.leftoverTime;
                }

                if (opponentTime < 0 || playerTime < 0) {
                    this.props.onTimeOut();
                }
                this.setState({
                    opponentTime: this.formatTime(opponentTime),
                    playerTime: this.formatTime(playerTime)
                })
            }, 100);
        } else {
            this.setState({
                opponentTime: this.formatTime(this.props.opponentLeftoverTime),
                playerTime: this.formatTime(this.props.leftoverTime)
            })
        }
    }

    componentDidMount() {
        this.initRefreshInterval();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.turn !== this.props.turn
            || prevProps.color !== this.props.color
            || prevProps.opponentLeftoverTime !== this.props.opponentLeftoverTime
            || prevProps.leftoverTime !== this.props.leftoverTime) {
            this.initRefreshInterval();
        }
    }

    componentWillUnmount() {
        clearInterval(this.refreshIntervalId);
    }

    render() {
        let opponentClass = "";
        let playerClass = "";
        let turn_indicator = [];
        if (this.props.turn !== null && this.props.turn === this.props.color) {
            playerClass = "ticking";
            turn_indicator = ["hidden", "turn_indicator"];
        } else if (this.props.turn !== null) {
            opponentClass = "ticking";
            turn_indicator = ["opponent_turn_indicator", "hidden"];
        }

        let liveIndicator = <div className="player_live" />;
        if (!this.props.isOpponentLive) {
            liveIndicator = <div className="player_offline" />;
        }


        return (<div className="chess_clock">
            <div>
                <div />
                <div>
                    <div>Opponent</div>
                    <div id="opponent_time" className={opponentClass}>{liveIndicator}{this.state.opponentTime}</div>
                    <PieceDifferenceIndicator chess={this.props.chess} color={this.props.color === WHITE ? BLACK : WHITE} />
                </div>
                <div className={turn_indicator[0]} />
            </div>
            <div>
                <div className={turn_indicator[1]} />
                <div>
                    <div>You</div>
                    <div id="own_time" className={playerClass}>{this.state.playerTime}</div>
                    <PieceDifferenceIndicator chess={this.props.chess} color={this.props.color} />
                </div>
                <div />
            </div>
        </div>);
    }
}

export default ChessClock;