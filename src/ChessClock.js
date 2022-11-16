import React from "react";
import "./ChessClock.css";

class ChessClock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    formatTime(leftoverTime, tick) {
        let leftoverMillis = leftoverTime;
        if (tick) {
            leftoverMillis -= Date.now() - this.props.lastTimeSync;
        }
        let mm = Math.max(0, Math.floor(leftoverMillis / 1000 / 60));
        let ss = Math.max(0, Math.floor((leftoverMillis / 1000) % 60));
        if (mm < 10) mm = "0" + mm;
        if (ss < 10) ss = "0" + ss;
        return `${mm}:${ss}`;
    }

    componentDidMount() {
        this.refreshIntervalId = setInterval(() => {
            this.setState({ update: Date.now() })
        }, 100);
    }

    componentWillUnmount() {
        clearInterval(this.refreshIntervalId);
    }

    render() {
        return (<div className="chess_clock">
            <div><div>Opponent</div><div id="opponent_time" className={this.props.turn !== this.props.color ? "ticking" : ""}>{this.formatTime(this.props.opponentLeftoverTime, this.props.turn !== this.props.color)}</div></div>
            <div><div>You</div><div id="own_time" className={this.props.turn === this.props.color ? "ticking" : ""}>{this.formatTime(this.props.leftoverTime, this.props.turn === this.props.color)}</div></div>
        </div>);
    }
}

export default ChessClock;