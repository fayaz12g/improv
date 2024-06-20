import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

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
            socket.on('sessionCreated', ({ sessionId }) => setSessionId(sessionId));
            socket.on('playerJoined', ({ players }) => setPlayers(players));
            socket.on('gameStarted', ({ rounds, scripts }) => {
                setRounds(rounds);
                setScripts(scripts);
                setGameStarted(true);
            });
            socket.on('updateLine', ({ line }) => setCurrentLine(line));
            socket.on('updatePoints', ({ points }) => {
                // Update points
            });
        }
    }, [socket]);

    const connectToServer = () => {
        const newSocket = io(`http://${ipAddress}:3000`);
        setSocket(newSocket);
    };

    const createSession = () => {
        socket.emit('createSession');
    };

    const joinSession = () => {
        socket.emit('joinSession', { sessionId, playerName });
    };

    const startGame = () => {
        socket.emit('startGame', { sessionId, rounds });
    };

    const nextLine = () => {
        // Implement next line logic
    };

    const guessAdlibber = (guess) => {
        socket.emit('guessAdlibber', { sessionId, guess });
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
