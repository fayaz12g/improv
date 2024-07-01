import React from 'react';

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
  sessionList,
  leaderboard,
  removePlayer
}) => {
  const handleRemovePlayer = (playerToRemove) => {
    removePlayer(playerToRemove)
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

  return (
    <div>
      <h2>Room Code: {ipAddress}</h2>
      {!sessionCreated ? (
        <button onClick={createSession}>Create Session</button>
      ) : !gameStarted ? (
        <div>
          <h3>Session Number: {sessionId}</h3>
          <h4>Players:</h4>
          <ul>
            {players.map((player) => (
              <PlayerListItem key={player.id} player={player} />
            ))}
          </ul>
          {players.length === 4 && (
            <div>
                          <p style={{ fontFamily: 'Alloy Ink' }}>
              {players.length === 4
                ? "Enter the number of rounds you would like to play:"
                : "Waiting for 4 players..."}
            </p>
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