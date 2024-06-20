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
    const [scripts, setScripts] = useState([]);
    const [currentLine, setCurrentLine] = useState(null);

    useEffect(() => {
        if (socket) {
            console.log('Socket connected:', socket);
            socket.on('sessionCreated', ({ sessionId }) => {
                console.log('Session created with ID:', sessionId);
                setSessionId(sessionId);
            });
            socket.on('playerJoined', ({ players }) => {
                console.log('Players joined:', players);
                setPlayers(players);
            });
            socket.on('gameStarted', ({ rounds, scripts }) => {
                console.log('Game started with rounds and scripts:', rounds, scripts);
                setRounds(rounds);
                setScripts(scripts);
                setGameStarted(true);
            });
            socket.on('updateLine', ({ line }) => {
                console.log('Line updated:', line);
                setCurrentLine(line);
            });
            socket.on('updatePoints', ({ points }) => {
                console.log('Points updated:', points);
                // Update points
            });
        }
    }, [socket]);

    const connectToServer = () => {
        console.log('Connecting to server at:', ipAddress);
        const newSocket = io(`http://${ipAddress}:3000`);
        setSocket(newSocket);
    };

    const createSession = () => {
        if (socket) {
            console.log('Creating session...');
            socket.emit('createSession');
        } else {
            console.log('Socket not connected.');
        }
    };

    const joinSession = () => {
        if (socket && sessionId && playerName) {
            console.log(`Joining session ${sessionId} as ${playerName}...`);
            socket.emit('joinSession', { sessionId, playerName });
        } else {
            console.log('Socket not connected or session ID/player name missing.');
        }
    };

    const startGame = () => {
        if (socket) {
            console.log(`Starting game for session ${sessionId} with ${rounds} rounds...`);
            socket.emit('startGame', { sessionId, rounds });
        } else {
            console.log('Socket not connected.');
        }
    };

    const nextLine = () => {
        // Implement next line logic
    };

    const guessAdlibber = (guess) => {
        if (socket) {
            console.log(`Guessing adlibber in session ${sessionId}: ${guess}`);
            socket.emit('guessAdlibber', { sessionId, guess });
        } else {
            console.log('Socket not connected.');
        }
    };

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
                <div>
                    <h2>Host Screen</h2>
                    <button onClick={createSession}>Create Session</button>
                    {sessionId && (
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
                                        onChange={(e) => setRounds(e.target.value)}
                                    />
                                    <button onClick={startGame}>Start Game</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <h2>Player Screen</h2>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name"
                    />
                    <button onClick={joinSession}>Join Session</button>
                    {gameStarted && (
                        <div>
                            <h3>Game Started</h3>
                            {/* Display the current line and controls for the game */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
