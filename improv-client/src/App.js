import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import './title.png';
import titleImage from './title.png';
import PlayerScreen from './PlayerScreen';
import HostScreen from './HostScreen';

function App() {
    const [ipAddress, setIpAddress] = useState(sessionStorage.getItem('ipAddress'));
    const [serverIP, setServerIP] = useState('');
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
    const [clientVersion] = useState('0.0.3 Slide');
    const [serverVersion, setServerV] = useState('Disconnected');

    useEffect(() => {
        if (socket) {
            console.log('Successfully connected to the server');
            if (sessionStorage.getItem('playerId') == null) {
                console.log('socket id: ' + socket.id);
                sessionStorage.setItem('playerId', socket.id);
            }
            if (sessionStorage.getItem('role') === 'host' && sessionStorage.getItem('sessionId')) {
                setRole('host')
                setSessionCreated(true)
                setSessionId(sessionStorage.getItem('sessionId'));
                socket.emit('reconnectHost', { sessionId: sessionId.toUpperCase() });
            }
        } else {
            if (ipAddress) {
                connectToServer();
            }
        }
    }, [socket]);

    useEffect(() => {
        if (socket) {                
            socket.on('connect', () => {
                setConnectionError(false); // Reset connection error state on successful connection
            });
            socket.on('sessionCreated', ({ sessionId }) => {
                const shortSessionId = sessionId.substr(0, 4).toUpperCase();
                setSessionId(shortSessionId);
                sessionStorage.setItem('sessionId', shortSessionId);
                setSessionCreated(true);
            });
            socket.on('updatePlayers', ({ players }) => {
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
        socket.on('reconnect', ({name, sessionId, players}) => {
            setRole('player');
            setPlayerName(name);
            setPlayers(players);
            setSessionId(sessionId);
            setJoinedSession(true);
            sessionStorage.setItem('playerId', socket.id);
        })
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
            query: {playerId: sessionStorage.getItem('playerId')}
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
          sessionStorage.setItem('ipAddress', ipAddress);
        });
        newSocket.on('serverVersion', (version) => {
          setServerV(version);
      });
      newSocket.on('serverIpAddress', (serverIpAddress) => {
        setServerIP(serverIpAddress);
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
            sessionStorage.setItem("playerId", socket.id);
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
      <HostScreen
        ipAddress={serverIP}
        sessionCreated={sessionCreated}
        createSession={createSession}
        gameStarted={gameStarted}
        sessionId={sessionId}
        players={players}
        rounds={rounds}
        setRounds={setRounds}
        startGame={startGame}
        currentRound={currentRound}
        leaderboard={leaderboard}
      />
    );

    const renderPlayerScreen = () => (
      <PlayerScreen
        isEndGame={isEndGame}
        joinedSession={joinedSession}
        sessionId={sessionId}
        setSessionId={setSessionId}
        playerName={playerName}
        setPlayerName={setPlayerName}
        joinSession={joinSession}
        gameStarted={gameStarted}
        players={players}
        playerRole={playerRole}
        isEndScene={isEndScene}
        currentLine={currentLine}
        isSpeaker={isSpeaker}
        nextLine={nextLine}
        guessAdlibber={guessAdlibber}
        leaderboard={leaderboard}
      />
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
                <button onClick={() => {setRole('host'); sessionStorage.setItem('role', 'host')}}>Host</button>
                <button onClick={() => {setRole('player'); sessionStorage.setItem('role', 'player')}}>Player</button>
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