import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import titleImage from './image/title.png';
import PlayerScreen from './apps/PlayerScreen';
import HostScreen from './apps//HostScreen';
import titleTheme from './sound/theme.m4a';
import speakingTheme from './sound/speaking.m4a';
import guessingTheme from './sound/guessing.m4a';
import finishTheme from './sound/finish.m4a';
import BackgroundMusic from './apps/BackgroundMusic';
import AnimatedTitle from './apps/AnimatedTitle';

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
    const [joinedSession, setJoinedSession] = useState(false);
    const [isEndScene, setIsEndScene] = useState(false);
    const [isEndGame, setIsEndGame] = useState(false);
    const [gameMode, setGameMode] = useState('classic');
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [connectionError, setConnectionError] = useState(false); 
    const [connectionWaiting, setConnectionWaiting] = useState(false);
    const [kicked, setKicked] = useState(false);
    const [theme, setTheme] = useState('light');
    const [clientVersion] = useState('0.6 Sonic Alpha');
    const [serverVersion, setServerV] = useState('Disconnected');
    let [sessionList, setSessionList] = useState([]);
    const [sessionCreated, setSessionCreated] = useState(() => {
        const storedValue = sessionStorage.getItem('sessionCreated');
        return storedValue === 'true' ? true : false;
      });


    useEffect(() => {
        if (socket) {
            if (role === 'host' && sessionCreated === false) {
        createSession()
            }
        }
    }, [role]);

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
                // const shortSessionId = sessionId.substr(0, 4).toUpperCase();
                const shortSessionId = sessionId;
                setSessionId(shortSessionId);
                sessionStorage.setItem('sessionId', shortSessionId);
                setSessionCreated(true);
            });
            socket.on('updatePlayers', ({ players }) => {
                setPlayers(players);
            });
            socket.on('playerRemoved', ({ removedPlayer }) => {
                console.log(`I heard that ${removedPlayer} was removed. He must've been a bad boy.`)
                // if playerName equals removedPlayer, then reset all variables and storage
                if (playerName===removedPlayer) {
                    resetEverything()

                    setKicked(true);
                }
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

        socket.on('availableSessions', (sessions) => {
            setSessionList(sessions);
         // Check if sessionList contains at least one session
            if (sessions.length > 0) {
                // Check if role in sessionStorage is not 'host'
                const storedRole = sessionStorage.getItem('role');
                if (storedRole !== 'host') {
                setRole('player');
                }
            }
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

    const resetEverything = () => {
        // Reset everything to default
        setRole(null);
        setIpAddress('');
        setPlayerName('');
        setJoinedSession(false);
        setRounds(0);
        setPlayers([]);
        setSessionId('');
        setSocket(null);
        setSessionList([]);
        
        // Clear out your storage, you're fired!
        sessionStorage.clear();
        
    }
    const connectToServer = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

        const octets = ipAddress.split('.'); // Split the ipAddress into octets

        let fullIpAddress;
      
        if (octets.length === 1) {
          // If only one octet
          fullIpAddress = `192.168.86.${octets[0]}`;
        } else if (octets.length === 2) {
          // If two octets
          fullIpAddress = `192.168.${octets[0]}.${octets[1]}`;
        } else {
          // Fallback for unexpected input
          fullIpAddress = ipAddress;
        }

        const url = `${protocol}://${fullIpAddress}:3000`;
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
            sessionStorage.setItem('sessionCreated', true);
        }
    };
    
    const joinSession = (clickedSessionId) => {
        setSessionId(clickedSessionId);
        if (socket && sessionId && playerName) {
            socket.emit('joinSession', { sessionId, playerName });
            setJoinedSession(true);
            sessionStorage.setItem("playerId", socket.id);
        }
        if (!playerName) {
            console.log("No player name when trying to join!")
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

    const removePlayer = (playerToRemove) => {
        console.log(`Asked the server to remove ${playerToRemove}`)
        socket.emit('removePlayer', { sessionId, playerToRemove });
      };

    const renderHostScreen = () => (
      <HostScreen
        socket={socket}
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
        sessionList={sessionList}
        leaderboard={leaderboard}
        removePlayer={removePlayer}
        titleTheme={titleTheme}
        BackgroundMusic={BackgroundMusic}
        isEndScene={isEndScene}
        speakingTheme={speakingTheme}
        guessingTheme={guessingTheme}
        gameMode={gameMode}
        setGameMode={setGameMode}
        currentLine={currentLine}
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
        sessionList={sessionList}
        leaderboard={leaderboard}
        kicked={kicked}
        titleTheme={titleTheme}
        BackgroundMusic={BackgroundMusic}
        speakingTheme={speakingTheme}
        guessingTheme={guessingTheme}
      />
    );

  return (
    <div className="App">
    {/* Background music components */}
    <BackgroundMusic audioSrc={guessingTheme} loopStart={0} loopEnd={16} isPlaying={isEndScene}/>
    <BackgroundMusic audioSrc={finishTheme} loopStart={0} loopEnd={8} isPlaying={isEndGame}/>
    <BackgroundMusic audioSrc={speakingTheme} loopStart={0} loopEnd={12} isPlaying={gameStarted && !isEndScene}/>
    <BackgroundMusic audioSrc={titleTheme} loopStart={24} loopEnd={71.9} isPlaying={!gameStarted} />
    

    {/* Main content */}
    <div className="main-content">
        {!socket ? (
            <div>
                <div className="animated-title-container">
                    <AnimatedTitle />
                </div>
                
                <div className="centered-image-container">
                    {/* <img src={titleImage} alt="Improvomania Logo" className="centered-image" /> */}
                </div>
                {/* {!connectionWaiting && !kicked && <h2>Room Code:</h2>} */}
                {kicked && <h2 style={{ color: 'red' }}>You have been kicked by the host.</h2>}
                {!connectionWaiting && !kicked && <input type="text" 
                value={ipAddress} 
                placeholder="Enter the room code"
                onChange={(e) => setIpAddress(e.target.value)} />}
                {!connectionWaiting && !kicked && <button onClick={connectToServer}>Connect</button>}
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
        </div>
    );
}

export default App;