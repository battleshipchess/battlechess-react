import React from "react";
import "./BattleshipBoard.css";
import "long-press-event";


class BattleshipSetupBoard extends React.Component {

    constructor(props) {
        super(props);

        this.ships = [
            {
                amount: 1,
                shape: 'xxxx',
            },
            {
                amount: 2,
                shape: 'xxx',
            },
            {
                amount: 2,
                shape: 'xx',
            },
            {
                amount: 4,
                shape: 'x',
            },
        ];

        let shipState = [];
        this.ships.forEach(shipType => {
            for (let i = 0; i < shipType.amount; i++) {
                shipState.push({
                    position: {
                        x: null,
                        y: null,
                        width: shipType.shape.length,
                        height: 1,
                    },
                });
            }
        })

        this.state = {
            ships: shipState,
        };

        this.shipRefs = [];
        shipState.forEach(ship => this.shipRefs.push(React.createRef()));

        this.onShipyardDragStart = this.onShipyardDragStart.bind(this);
        this.dropShip = this.dropShip.bind(this);
        this.rotateShip = this.rotateShip.bind(this);
        this.startGame = this.startGame.bind(this);
        this.startPrivateGame = this.startPrivateGame.bind(this);
        this.randomizeShips = this.randomizeShips.bind(this);
        this.randomizeSingleShip = this.randomizeSingleShip.bind(this);
        this.handleShipReset = this.handleShipReset.bind(this);
        this.showOptions = this.showOptions.bind(this);
        this.moveShip = this.moveShip.bind(this);
    }

    randomizeSingleShip(ship, ships, maxAttempts) {
        if (ship.position.x !== null && ship.position.y !== null) {
            return true;
        }

        let attempts = 0;
        let newPosition = {};
        while (attempts++ < maxAttempts) {
            newPosition.x = Math.floor(Math.random() * this.props.size);
            newPosition.y = Math.floor(Math.random() * this.props.size);
            if (Math.random() < .5) {
                newPosition.width = ship.position.width;
                newPosition.height = ship.position.height;
            } else {
                newPosition.width = ship.position.height;
                newPosition.height = ship.position.width;
            }

            if (this.isDropPositionPossible(ships, newPosition)) {
                ship.position = newPosition;
                return true;
            }
        }
        return false;
    }

    randomizeShips() {
        let ships = null;
        let allPlaced = !this.state.ships.some(ship => ship.position.x === null || ship.position.y === null);
        let placementSuccessful = false;
        let attempts = 0;
        while (!placementSuccessful) {
            if (attempts > 10) {
                break;
            }
            attempts++;
            placementSuccessful = true;
            ships = JSON.parse(JSON.stringify(this.state.ships));
            if (allPlaced) {
                ships.forEach(ship => {
                    ship.position.x = null;
                    ship.position.y = null;
                });
            }

            for (let ship of ships) {
                let success = this.randomizeSingleShip(ship, ships, 25);
                if (!success) {
                    placementSuccessful = false;
                    break;
                }
            }
        }
        this.setState({
            ships: ships
        })
    }

    handleShipReset(e) {
        if (e.dataTransfer.dropEffect === 'none') {
            var [idx] = e.dataTransfer.getData("text").split(";");
            let ships = JSON.parse(JSON.stringify(this.state.ships));
            ships[idx].position.x = null;
            ships[idx].position.y = null;
            if (ships[idx].position.width === 1) {
                ships[idx].position.width = ships[idx].position.height;
                ships[idx].position.height = 1;
            }
            this.setState({
                ships: ships,
            })
        }
    }

    squareWidth() {
        return document.getElementsByClassName('battleship_setup_board')[0].getBoundingClientRect().width / this.props.size;
    }

    onShipyardDragStart(event) {
        let bounds = event.target.getBoundingClientRect();
        let xPositionInShip = event.clientX - bounds.x;
        let yPositionInShip = event.clientY - bounds.y;

        event.dataTransfer.setData("text", `${event.target.dataset.idx};${xPositionInShip};${yPositionInShip}`);
        event.dataTransfer.dropEffect = "move";
    }

    allowDrop(event) {
        event.preventDefault();
    }

    rectOverlap(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y);
    }

    isDropPositionOutOfBounds(position) {
        return (position.x < 0
            || position.y < 0
            || position.x + position.width > this.props.size
            || position.y + position.height > this.props.size);
    }

    isDropPositionPossible(ships, shipPosition) {
        if (this.isDropPositionOutOfBounds(shipPosition)) {
            return false;
        }

        let illegalBox = {
            x: shipPosition.x - 1,
            y: shipPosition.y - 1,
            width: shipPosition.width + 2,
            height: shipPosition.height + 2,
        }

        let overlap = false;

        ships.forEach(ship => {
            if (ship.position.x === null) return;
            if (this.rectOverlap(ship.position, illegalBox)) {
                overlap = true;
            }
        });

        return !overlap;
    }

    animateError(shipIdx) {
        let ships = JSON.parse(JSON.stringify(this.state.ships));
        ships[shipIdx].error = true;
        this.setState({
            ships: ships,
        })
        setTimeout(() => {
            ships[shipIdx].error = null;
            this.setState({
                ships: ships,
            })
        }, 500);
    }

    rotateShip(event) {
        let ships = JSON.parse(JSON.stringify(this.state.ships));
        let idx = event.target.dataset.idx;

        let rotatedPosition = JSON.parse(JSON.stringify(ships[idx].position));
        rotatedPosition.width = ships[idx].position.height;
        rotatedPosition.height = ships[idx].position.width;
        ships[idx].position.x = null;
        ships[idx].position.y = null;

        // attempt rotations along all points, not just top left corner
        for (let yOffset = 0; yOffset < rotatedPosition.height; yOffset++) {
            for (let xOffset = 0; xOffset < rotatedPosition.width; xOffset++) {
                for (let yAxis = 0; yAxis < ships[idx].position.height; yAxis++) {
                    for (let xAxis = 0; xAxis < ships[idx].position.width; xAxis++) {
                        let position = JSON.parse(JSON.stringify(rotatedPosition));
                        position.x += xAxis - xOffset;
                        position.y += yAxis - yOffset;
                        if (this.isDropPositionPossible(ships, position)) {
                            ships[idx].position = position;
                            this.setState({
                                ships: ships,
                            });
                            return;
                        }
                    }
                }
            }
        }
        this.animateError(idx);
    }

    showOptions(event) {
        let ships = JSON.parse(JSON.stringify(this.state.ships));
        let idx = event.target.dataset.idx;
        ships.forEach(ship => ship.optionsActive = false);
        ships[idx].optionsActive = true;
        this.setState({
            ships: ships,
        })
    }

    moveShip(event) {
        event.preventDefault();
        let ships = JSON.parse(JSON.stringify(this.state.ships));
        let idx = parseInt(event.target.dataset.idx);
        let dx = parseInt(event.target.dataset.dx);
        let dy = parseInt(event.target.dataset.dy);

        let position = JSON.parse(JSON.stringify(ships[idx].position));
        ships[idx].position.x = null;
        ships[idx].position.y = null;

        for (let i = 0; i < 8; i++) {
            position.x = position.x + dx;
            position.y = position.y + dy;
            if (this.isDropPositionPossible(ships, position)) {
                ships[idx].position = position;
                this.setState({
                    ships: ships,
                });
                return;
            }
        }

        this.animateError(idx);
    }

    dropShip(event) {
        let gridElement = event.target.closest(".battleship_drop_target");
        if (!gridElement) {
            return;
        }

        event.preventDefault();
        var [idx, xOffset, yOffset] = event.dataTransfer.getData("text").split(";");
        let ships = JSON.parse(JSON.stringify(this.state.ships));

        let bounds = gridElement.getBoundingClientRect();
        let xPositionInBoard = event.clientX - bounds.x - xOffset + .5 * this.squareWidth();
        let yPositionInBoard = event.clientY - bounds.y - yOffset + .5 * this.squareWidth();

        let x = Math.floor(xPositionInBoard * this.props.size / bounds.width);
        let y = Math.floor(yPositionInBoard * this.props.size / bounds.height);

        let position = JSON.parse(JSON.stringify(ships[idx].position));
        ships[idx].position.x = null;
        ships[idx].position.y = null;
        position.x = x;
        position.y = y;

        if (this.isDropPositionPossible(ships, position)) {
            ships[idx].position = position
            this.setState({
                ships: ships,
            })
        } else {
            this.animateError(idx);
        }
    }

    isFullyPlaced() {
        let fullyPlaced = true;
        this.state.ships.forEach(ship => {
            if (ship.position.x === null) {
                fullyPlaced = false;
            }
        });
        return fullyPlaced;
    }

    randomGameCode() {
        const dateString = Date.now().toString(36);
        const randomness = Math.random().toString(36).substring(2);
        return dateString + randomness;
    }

    startGame() {
        this.props.onBoardSetupCompleted(this.state.ships, this.props.gameCode);
    }

    startPrivateGame() {
        let gameCode = this.randomGameCode();
        this.props.onBoardSetupCompleted(this.state.ships, gameCode);
    }

    pieceOverlay(x, y) {
        const pieces = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
        ]
        let piece = pieces[y][x];
        if (!piece.length)
            return null;
        let filename = `${process.env.PUBLIC_URL}/pieces/cburnett/${piece}.svg`;
        return (<div className="chessPieceOverlay fadedPiece">
            <img src={filename} alt={`${piece}`} />
        </div>);
    }


    renderStartGameButtons() {
        if (this.isFullyPlaced() && !this.props.gameCode) {
            return [
                <input type="button" data-type="primary" value="START GAME" onClick={this.startGame} key="start" />,
                <input type="button" data-type="primary" value="START PRIVATE GAME" onClick={this.startPrivateGame} key="startprivate" />]
        } else if (this.isFullyPlaced() && this.props.gameCode) {
            return <input type="button" data-type="primary" value="JOIN GAME" onClick={this.startGame} />
        }

        if (!this.props.gameCode) {
            return [
                <input type="button" data-type="disabled" value="START GAME" key="start" />,
                <input type="button" data-type="disabled" value="START PRIVATE GAME" key="private" />
            ];
        }
        return <input type="button" data-type="disabled" value="JOIN GAME" />

    }

    shipyard() {
        return (<div className="shipyard">
            {this.ships.map((shipType, shipTypeIdx) => {
                let startIdx = 0;
                for (let i = 0; i < shipTypeIdx; i++) {
                    startIdx += this.ships[i].amount;
                }
                return <div key={shipType.shape}>
                    {Array.from({ length: shipType.amount }, (_, idx) =>
                        <div className={"ship"} key={idx}
                            draggable={this.state.ships[startIdx + idx].position.x === null} onDragStart={this.onShipyardDragStart}
                            onClick={() => {
                                let ships = JSON.parse(JSON.stringify(this.state.ships));
                                this.randomizeSingleShip(ships[startIdx + idx], ships, 150);
                                ships.forEach(ship => ship.optionsActive = false);
                                this.setState({
                                    ships: ships,
                                })
                            }}
                            style={{
                                "--ship-width": shipType.shape.length,
                                "--ship-height": 1,
                            }}
                            data-idx={startIdx + idx} />
                    )}
                </div>
            }
            )}
            {this.renderStartGameButtons()}
            <input type="button" value="Randomize" onClick={this.randomizeShips} />
        </div>)
    }

    board() {
        return (<div className="battleship_setup_board" onDrop={this.dropShip} onDragOver={this.allowDrop}>
            <div className="battleship_board_container">
                <div className="battleship_board">
                    {Array.from({ length: this.props.size }, (_, rowIdx) =>
                        Array.from({ length: this.props.size }, (_, colIdx) =>
                            <div data-col={colIdx + 1} data-row={rowIdx + 1} key={`${colIdx}${rowIdx}`} >
                                {this.pieceOverlay(colIdx, rowIdx)}
                            </div>
                        )).flat()}
                </div>
            </div>

            <table>
                <tbody>
                    {Array.from({ length: this.props.size }, (_, idx) =>
                        <tr key={idx}>
                            {Array.from({ length: this.props.size }, (_, idx) =>
                                <td key={idx} />
                            )}
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="battleship_drop_target" data-long-press-delay="300">
                {this.state.ships.map((ship, idx) =>
                    ship.position.x !== null ? <div key={`${idx}`}
                        style={{
                            "--ship-position-x": ship.position.x,
                            "--ship-position-y": ship.position.y,
                            "--ship-width": ship.position.width,
                            "--ship-height": ship.position.height,
                        }}
                    >
                        <div className={ship.error ? "ship shipError" : "ship"}
                            ref={this.shipRefs[idx]}
                            draggable={true} onDragStart={this.onShipyardDragStart}
                            onDragEnd={this.handleShipReset}
                            onClick={this.rotateShip}
                            data-position="absolute"
                            data-idx={idx} />
                        {ship.optionsActive ? <div className="shipOptions" style={{

                        }}>
                            <div style={{
                                "--ship-option-x": -1,
                                "--ship-option-y": "calc(0.5 * (var(--ship-height) - 1))",
                                zIndex: 2,
                            }} data-direction="left" data-idx={idx} data-dx={-1} data-dy={0} onClick={this.moveShip}></div>
                            <div style={{
                                "--ship-option-x": "calc(0.5 * (var(--ship-width) - 1))",
                                "--ship-option-y": -1,
                                zIndex: 2,
                            }} data-direction="up" data-idx={idx} data-dx={0} data-dy={-1} onClick={this.moveShip}></div>
                            <div style={{
                                "--ship-option-x": "var(--ship-width)",
                                "--ship-option-y": "calc(0.5 * (var(--ship-height) - 1))",
                                zIndex: 2,
                            }} data-direction="right" data-idx={idx} data-dx={1} data-dy={0} onClick={this.moveShip}></div>
                            <div style={{
                                "--ship-option-x": "calc(0.5 * (var(--ship-width) - 1))",
                                "--ship-option-y": "var(--ship-height)",
                                zIndex: 2,
                            }} data-direction="down" data-idx={idx} data-dx={0} data-dy={1} onClick={this.moveShip}></div>
                            <div style={{
                                zIndex: 1,
                                left: 0, top: 0, width: "100%", height: "100%",
                                position: "absolute",
                            }} onClick={() => {
                                let ships = JSON.parse(JSON.stringify(this.state.ships));
                                ships.forEach(ship => ship.optionsActive = false);
                                this.setState({ ships: ships });
                            }} />
                        </div> : null}
                    </div> : null
                ).filter(ship => ship !== null)
                }
            </div>
        </div >)
    }

    componentDidUpdate() {
        this.shipRefs.forEach((ref) => {
            if (!ref.current) return;
            ref.current.removeEventListener("long-press", this.showOptions);
            ref.current.addEventListener("long-press", this.showOptions);
        })
    }

    render() {
        return (
            <div className="battleship_board_container">
                {this.shipyard()}
                {this.board()}
            </div>
        );
    }
}

export default BattleshipSetupBoard;