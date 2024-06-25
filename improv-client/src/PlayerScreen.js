import React from 'react';

const PlayerScreen = ({
  isEndGame,
  joinedSession,
  sessionId,
  setSessionId,
  playerName,
  setPlayerName,
  joinSession,
  gameStarted,
  players,
  playerRole,
  isEndScene,
  currentLine,
  isSpeaker,
  nextLine,
  guessAdlibber,
  leaderboard,
}) => (
  <div>
    {!isEndGame ? (
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
            <p>
              {players.length === 4
                ? "Waiting for host to start the game..."
                : "Waiting for 4 players..."}
            </p>
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
                    <div>
                      Dialogue: <br />
                      {currentLine?.text}
                    </div>
                    {currentLine?.isAdlib && (
                      <p className="smalltext">(It's your line!)</p>
                    )}
                    {isSpeaker && <button onClick={nextLine}>Next</button>}
                  </>
                )}
              </>
            )}
            {playerRole &&
              (playerRole.startsWith('Speaker 2') ||
                playerRole.startsWith('Speaker 3')) && (
                <>
                  <h3>Your Role: Speaker</h3>
                  {isEndScene ? (
                    <div>END SCENE</div>
                  ) : (
                    <>
                      <div>
                        Dialogue: <br />
                        {currentLine?.text}
                      </div>
                      {isSpeaker && (
                        <p className="smalltext">(Read your line!)</p>
                      )}
                      {isSpeaker && <button onClick={nextLine}>Next</button>}
                    </>
                  )}
                </>
              )}
            {playerRole === 'Guesser' &&
              (isEndScene ? (
                <div>
                    <h3>Your Role: Guesser</h3>
                    <p>Guess who the Adlibber was:</p>
                    {players.map((player, index) => (
                        player.role !== 'Guesser' && (
                            <button
                                key={index}
                                onClick={() => guessAdlibber(player.name)}
                            >
                                {player.name}
                            </button>
                        )
                    ))}
                </div>
              ) : (
                <div>
                  <h3>Your Role: Guesser</h3>
                  <p>Listen carefully and try to guess the adlibber!</p>
                  <p>{currentLine?.text}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    ) : (
      <div>
        <h3>Game Results</h3>
        <ul>
          {Object.entries(leaderboard).map(([name, score]) => (
            <li key={name}>
              {name}: {score}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default PlayerScreen;
