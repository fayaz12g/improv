import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
    const [ipAddress, setIpAddress] = useState('');
    const [role, setRole] = useState(null);
    const [socket, setSocket] = useState(null);
    const [sessionId, setSessionId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [rounds, setRounds] = useState(1);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentLine, setCurrentLine] = useState(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [playerRole, setPlayerRole] = useState(null);
    const [leaderboard, setLeaderboard] = useState({});
    const [sessionCreated, setSessionCreated] = useState(false);
    const [joinedSession, setJoinedSession] = useState(false);
    const [isEndScene, setIsEndScene] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('connect', () => {
                console.log('Successfully connected to the server');
            });
            socket.on('sessionCreated', ({ sessionId }) => {
                const shortSessionId = sessionId.substr(0, 4).toUpperCase();
                setSessionId(shortSessionId);
                setSessionCreated(true);
            });
            socket.on('playerJoined', ({ players }) => {
                setPlayers(players);
            });
            socket.on('gameStarted', ({ rounds, roles }) => {
                setRounds(rounds);
                setGameStarted(true);
                setCurrentRound(1);
                
                // Initialize leaderboard
                const newLeaderboard = {};
                players.forEach(player => {
                    newLeaderboard[player.name] = 0;
                });
                setLeaderboard(newLeaderboard);

                // Set player role
                if (role === 'player') {
                    const playerRole = roles[socket.id];
                    setPlayerRole(playerRole);
                }
            });
            socket.on('updateLine', ({ line, isAdlib, isSpeaker }) => {
                setCurrentLine({ text: line, isAdlib });
                setIsSpeaker(isSpeaker);
                setIsEndScene(false);
            });
            socket.on('updatePoints', ({ points }) => {
                setLeaderboard(prevLeaderboard => ({
                    ...prevLeaderboard,
                    ...points
                }));
            });
            socket.on('endScene', () => {
                setIsEndScene(true);
                setIsSpeaker(false);
            });
        }
    }, [socket, players, role]);

    const connectToServer = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const url = `${protocol}://${ipAddress}:3000`;
        const newSocket = io(url, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
    };

    const createSession = () => {
        if (socket) {
            socket.emit('createSession');
        }
    };
    
    const joinSession = () => {
        if (socket && sessionId && playerName) {
            socket.emit('joinSession', { sessionId: sessionId.toUpperCase(), playerName });
            setJoinedSession(true);
        }
    };

    const startGame = () => {
        if (socket) {
            socket.emit('startGame', { sessionId, rounds });
        }
    };

    const nextLine = () => {
        if (socket) {
            socket.emit('nextLine', { sessionId });
        }
    };

    const guessAdlibber = (guess) => {
        if (socket) {
            socket.emit('guessAdlibber', { sessionId, guess });
        }
    };

    const renderHostScreen = () => (
        <div>
            <h2>Host Screen</h2>
            {!sessionCreated ? (
                <button onClick={createSession}>Create Session</button>
            ) : !gameStarted ? (
                <div>
                    <h3>Session ID: {sessionId}</h3>
                    <h4>Players:</h4>
                    <ul>
                        {players.map((player, index) => (
                            <li key={index}>{player.name}</li>
                        ))}
                    </ul>
                    {players.length === 4 && (
                        <div>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={rounds}
                                onChange={(e) => setRounds(parseInt(e.target.value))}
                            />
                            <button onClick={startGame}>Start Game</button>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <h3>Round: {currentRound}/{rounds}</h3>
                    <h4>Leaderboard:</h4>
                    <ul>
                        {Object.entries(leaderboard).map(([name, score]) => (
                            <li key={name}>{name}: {score}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );

    const renderPlayerScreen = () => (
        <div>
            <h2>Player Screen</h2>
            {!joinedSession ? (
                <>
                    <input
                        type="text"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        placeholder="Enter Session ID"
                    />
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter Your Name"
                    />
                    <button onClick={joinSession}>Join Session</button>
                </>
            ) : !gameStarted ? (
                <div>
                    <h3>Joined Session: {sessionId}</h3>
                    <h4>Players:</h4>
                    <ul>
                        {players.map((player, index) => (
                            <li key={index}>{player.name}</li>
                        ))}
                    </ul>
                    <p>{players.length === 4 ? "Waiting for host to start the game..." : "Waiting for 4 players..."}</p>
                </div>
            ) : (
                <div>
                    <h3>Your Role: {playerRole}</h3>
                    {playerRole && playerRole.startsWith('Speaker') && (
                        <>
                            {isEndScene ? (
                                <div>END SCENE</div>
                            ) : (
                                <>
                                    <div>Dialogue: {currentLine?.text}</div>
                                    {currentLine?.isAdlib && <div>(This is an ADLIB line)</div>}
                                    {isSpeaker && <button onClick={nextLine}>Next</button>}
                                </>
                            )}
                        </>
                    )}
                    {playerRole === 'Guesser' && (
                        isEndScene ? (
                            <div>
                                <p>Guess who the Adlibber was:</p>
                                {players.map((player, index) => (
                                    <button key={index} onClick={() => guessAdlibber(player.name)}>
                                        {player.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <p>Listen carefully and try to guess the adlibber!</p>
                                <p>{currentLine?.text}</p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="App">
            {!socket ? (
                <div>
                    <h2>Enter Server IP Address</h2>
                    <input type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} />
                    <button onClick={connectToServer}>Connect</button>
                </div>
            ) : !role ? (
                <div>
                    <button onClick={() => setRole('host')}>Host</button>
                    <button onClick={() => setRole('player')}>Player</button>
                </div>
            ) : role === 'host' ? (
                renderHostScreen()
            ) : (
                renderPlayerScreen()
            )}
        </div>
    );
}

export default App;