import React from 'react';

const HostScreen = ({
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
}) => (
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
              {Object.entries(leaderboard)
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort by score in descending order
                  .map(([name, score]) => (
                      <li key={name}>{name}: {score}</li>
                  ))}
          </ul>
      </div>
    )}
  </div>
);

export default HostScreen;
