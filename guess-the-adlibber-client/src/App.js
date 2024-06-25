import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import './title.png';
import titleImage from './title.png';

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
    const [isEndGame, setIsEndGame] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [connectionError, setConnectionError] = useState(false); 
    const [connectionWaiting, setConnectionWaiting] = useState(false);
    const [theme, setTheme] = useState('light');
    const [clientVersion, setClientV] = useState('0.0.3 Slide');
    const [serverVersion, setServerV] = useState('Disconnected');

    useEffect(() => {
        if (socket) {
            socket.on('connect', () => {
                console.log('Successfully connected to the server');
                setConnectionError(false); // Reset connection error state on successful connection
            });
            socket.on('sessionCreated', ({ sessionId }) => {
                const shortSessionId = sessionId.substr(0, 4).toUpperCase();
                setSessionId(shortSessionId);
                setSessionCreated(true);
            });
            socket.on('playerJoined', ({ players }) => {
                setPlayers(players);
            });
            socket.on('gameStarted', ({ rounds, roles, currentround }) => {
              setRounds(rounds);
              setGameStarted(true);
              setCurrentRound(currentround);
              
              if (Object.keys(leaderboard).length === 0) {
                  console.log("Creating new leaderboard");
                  const newLeaderboard = {};
                  players.forEach(player => {
                      newLeaderboard[player.name] = 0;
                  });
                  setLeaderboard(newLeaderboard);
              }
              
              if (role === 'player') {
                  const playerRole = roles[socket.id];
                  setPlayerRole(playerRole);
              }
          });

          socket.on('roundStarted', ({ currentRound, roles }) => {
            setCurrentRound(currentRound);
            
            // Set player role
            if (socket && socket.id && roles[socket.id]) {
                const playerRole = roles[socket.id];
                setPlayerRole(playerRole);
            } else {
                console.error('Unable to set player role:', { socketId: socket?.id, roles });
            }

            // Reset any necessary state for the new round here
            setIsEndScene(false);
            setIsSpeaker(false);
            setCurrentLine(null);
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
                console.log("Updating leaderboard");
            });
            socket.on('endScene', () => {
                setIsEndScene(true);
                setIsSpeaker(false);
            });
            socket.on('endGame', () => {
                setIsEndGame(true);
            });
        }
        document.body.className = theme;
    }, [socket, players, role, leaderboard, theme]);

    const toggleTheme = () => {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

    const connectToServer = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const url = `${protocol}://${ipAddress}:3000`;
        const newSocket = io(url, {
            transports: ['websocket'],
        });
        setConnectionError(false);
        setConnectionWaiting(true);

        // Handle connection error
        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setConnectionError(true);
            setConnectionWaiting(false);
            newSocket.close()
        });
        newSocket.on('connect', data => {
          setSocket(newSocket);
          setConnectionWaiting(false);
        });
        newSocket.on('serverVersion', (version) => {
          setServerV(version);
      });
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
            socket.emit('nextLine', { sessionId: sessionId.toUpperCase() });
        }
    };

    const guessAdlibber = (guess) => {
        if (socket) {
            socket.emit('guessAdlibber', { sessionId: sessionId.toUpperCase(), guess });
        }
    };

    const renderHostScreen = () => (
        <div>
            <h2>Server IP: {ipAddress}</h2>
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
                            <h3>How many rounds would you like to play?</h3>
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
        {!isEndGame ?  (
          <div>
              {!joinedSession ? (
                  <>
                  <h2>Join a Game</h2>
                  <div>
                    <input
                      type="text"
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      placeholder="Enter Session ID"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter Your Name"
                    />
                  </div>
                  <div>
                    <button onClick={joinSession}>Join Session</button>
                  </div>
                </>              
              ) : !gameStarted ? (
                  <div>
                      <h2>Welcome, {playerName}</h2>
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
                        {playerRole && playerRole.startsWith('Speaker 1') && (
                          <>
                              <h3>Your Role: Adlibber</h3>
                              {isEndScene ? (
                                  <div>END SCENE</div>
                              ) : (
                                  <>
                                      <div>Dialogue: <br />{currentLine?.text}</div>
                                      {currentLine?.isAdlib && <p className='smalltext'>(It's your line!)</p>}
                                      {isSpeaker && <button onClick={nextLine}>Next</button>}
                                  </>
                              )}
                          </>
                      )}
                      {playerRole && (playerRole.startsWith('Speaker 2') || playerRole.startsWith('Speaker 3')) && (
                          <>
                              <h3>Your Role: Speaker</h3>
                              {isEndScene ? (
                                  <div>END SCENE</div>
                              ) : (
                                  <>
                                      <div>Dialogue: <br />{currentLine?.text}</div>
                                      {isSpeaker && <p className='smalltext'>(Read your line!)</p>}
                                      {isSpeaker && <button onClick={nextLine}>Next</button>}
                                  </>
                              )}
                          </>
                      )}
                      {playerRole === 'Guesser' && (
                          isEndScene ? (
                              <div>
                                  <h3>Your Role: Guesser</h3>
                                  <p>Guess who the Adlibber was:</p>
                                  {players.map((player, index) => (
                                      <button key={index} onClick={() => guessAdlibber(player.name)}>
                                          {player.name}
                                      </button>
                                  ))}
                              </div>
                          ) : (
                              <div>
                                  <h3>Your Role: Guesser</h3>
                                  <p>Listen carefully and try to guess the adlibber!</p>
                                  <p>{currentLine?.text}</p>
                              </div>
                          )
                      )}
                  </div>
              )}
          </div>
        ) : (
          <div>
              <h3>Game Results</h3>
              {/* <h4>You are in 1st place</h4> */}
              <ul>
                  {Object.entries(leaderboard).map(([name, score]) => (
                      <li key={name}>{name}: {score}</li>
                  ))}
              </ul>
          </div>
      )}
  </div>
);

  return (
    <div className="App">
        {!socket ? (
            <div>
                <div className="centered-image-container">
                    <img src={titleImage} alt="Improvomania Logo" className="centered-image" />
                </div>
                {!connectionWaiting && <h2>Connect to a server:</h2>}
                {!connectionWaiting && <input type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} />}
                {!connectionWaiting && <button onClick={connectToServer}>Connect</button>}
                {connectionWaiting && <h2>Attempting connection, please wait.</h2>}
                {connectionError && <p style={{ color: 'red' }}>Connection failed. Please check the IP address and try again.</p>}
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
            <button 
                className="theme-toggle" 
                onClick={toggleTheme}
            >
                {theme === 'light' ? '☀️' : '🌙'}
            </button>
          <div className="version-text smalltext">
            Client Version: {clientVersion}
            <br />
            Server Version: {serverVersion}
        </div>
        </div>
    );
}

export default App;