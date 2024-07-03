import React from 'react';
import AnimatedTitle from './AnimatedTitle';

const HostScreen = ({
  socket,
  ipAddress,
  sessionCreated,
  createSession,
  gameStarted,
  sessionId,
  players,
  rounds,
  setRounds,
  startGame,
  currentRound,
  leaderboard,
  removePlayer,
  isEndScene,
  gameMode,
  setGameMode,
  currentLine,
}) => {
  const handleRemovePlayer = (playerToRemove) => {
    removePlayer(playerToRemove);
  };

  const toggleGameMode = () => {
    setGameMode(gameMode === 'classic' ? 'freeforall' : 'classic');
  };

  const PlayerListItem = ({ player }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <li
        key={player.id}
        style={{
          textDecoration: player.removed ? 'line-through' : 
            (isHovered ? 'line-through' : 'none'),
          cursor: 'pointer'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleRemovePlayer(player.name)}
      >
        {player.name}
      </li>
    );
  };

  const handleStartGame = () => {
    if (socket) {
      socket.emit('startGame', { sessionId, rounds, gameMode });
    }
  };

  return (
    <div className="host-screen">
      <div className="animated-title-container">
        <AnimatedTitle />
      </div>
      <h2 className="room-code">Room Code: {ipAddress}</h2>
      {!sessionCreated ? (
        <button onClick={createSession}>Create Session</button>
      ) : !gameStarted ? (
        <div className="host-lobby">
          <div className="left-box">
            <h3>Session Number: {sessionId}</h3>
            <h4>Players:</h4>
            <ul>
              {players.map((player) => (
                <PlayerListItem key={player.id} player={player} />
              ))}
            </ul>
          </div>
          <div className="right-box">
            <p style={{ fontFamily: 'Alloy Ink' }}>Game Settings:</p>
            <label>
              Number of rounds:
              <br />
              <input
                type="number"
                min="1"
                max="12"
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value))}
              />
            </label>
            <label>
              <br />
              Game Mode:
              <div className="button-wrapper">
                <button onClick={toggleGameMode} className="game-mode-button">
                  {gameMode === 'classic' ? 'Classic' : 'Free for All'}
                </button>
              </div>
            </label>
          </div>
          <div className="start-game-container">
            <button onClick={handleStartGame} disabled={players.length !== 4}>
              {players.length === 4 ? "Start Game" : "Waiting for 4 players..."}
            </button>
          </div>
        </div>
      ) : !isEndScene ? (
        <div className="game-content">
          <h3>Round: {currentRound}/{rounds}</h3>
          <h3>{currentLine?.text}</h3>
          <h4>Leaderboard:</h4>
          <ul>
            {Object.entries(leaderboard)
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
              .map(([name, score]) => (
                <li key={name}>{name}: {score}</li>
              ))}
          </ul>
        </div>
      ) : (
        <div className="game-content">
          <h3>Round: {currentRound}/{rounds}</h3>
          <h3>The Guesser is Guessing</h3>
          <h4>Leaderboard:</h4>
          <ul>
            {Object.entries(leaderboard)
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
              .map(([name, score]) => (
                <li key={name}>{name}: {score}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HostScreen;