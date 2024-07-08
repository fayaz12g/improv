import React, { useState } from 'react';
import SoundEffect from '../apps/SoundEffect';
import finishTheme from '../sound/finish.m4a';

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
  sessionList,
  leaderboard,
  kicked,
  titleTheme,
  BackgroundMusic,
  speakingTheme,
  guessingTheme,
  sentGuess,
}) => {
  const [noName, setNoName] = useState(false);

  const handleJoinClick = (sessionIds) => {
    setSessionId(sessionIds);
    if (!playerName)
      setNoName(true);
    joinSession(sessionIds);
  };

  return (
    <div>
      {!isEndGame ? (
        <div>
          {!joinedSession ? (
            <>
              {(sessionList.length > 0) && <h2>Join a Game</h2>}
              {(sessionList.length > 0) && <div>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Your Name"
                />
              </div>}
              <div>
              {Array.isArray(sessionList) && sessionList.length > 0 ? (
                  sessionList.map((sessionIds) => (
                    <button
                      style={{ fontWeight: 'bold' }}
                      key={sessionIds}
                      onClick={() => handleJoinClick(sessionIds)}
                      >
                      {sessionList.length === 1 ? (
                        "Join Session"
                      ) : (
                        <>
                          Join Session <br />
                          {sessionIds}
                        </>
                      )}
                    </button>
                  ))
                ) : (
                  <p>No active sessions available.</p>
                )}
              </div>
              {noName && <p style={{ color: 'red' }}>First enter a name to join Session {sessionId}</p>}
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
                <h3>Guess the Adlibber!</h3>
                {isEndScene ? (
                  <div>Try to blend in, make it look like you're picking someone!</div>
                ) : (
                  <>
                    <div>
                      <b>{currentLine?.text}</b>
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
                    {isSpeaker && (
                      <div>
                        Read your line: 
                      </div>
                      )}
                      <div>
                        {currentLine?.text}
                      </div>
                      {/* {isSpeaker && (
                        <p className="smalltext">(Read your line!)</p>
                      )} */}
                      {isSpeaker && <button onClick={nextLine}>Next</button>}
                    </>
                  )}
                </>
              )}
            {playerRole === 'Guesser' &&
              (isEndScene ? (
                <div>
                    <h3>Guess the Adlibber!</h3>
                    {!sentGuess && <p>Choose the person you think was making up their lines:</p>}
                    {sentGuess && <p>Your guess was sent.</p>}
                    {!sentGuess && 
                    players.map((player, index) => (
                        player.name !== playerName && (
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
        <SoundEffect audioSrc={finishTheme}/>
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

}
export default PlayerScreen;
