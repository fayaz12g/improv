const http = require('http');
const fs = require('fs');
const express = require('express');
const socketIO = require('socket.io');

const app = express();

const options = {
    key: fs.readFileSync('./privkey.pem'),
    cert: fs.readFileSync('./fullchain.pem')
};

const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('build'));

let sessions = {};

// Load scripts from JSON file
const scripts = JSON.parse(fs.readFileSync('./scripts.json', 'utf8'));
console.log('Loaded scripts:', scripts);

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('createSession', () => {
        const sessionId = Math.random().toString(36).substring(2, 15);
        const shortSessionId = sessionId.substr(0, 4).toUpperCase();
        sessions[shortSessionId] = { 
            sessionId: shortSessionId, 
            players: [],
            currentScript: null,
            currentLineIndex: 0,
            roles: {},
            currentSpeaker: null,
            currentRound: 0, // Initialize current round
            rounds: 0 // Initialize total rounds (to be set later)
        };
        socket.join(shortSessionId);
        socket.emit('sessionCreated', { sessionId: shortSessionId });
        console.log('Session created with ID:', shortSessionId);
    });

    socket.on('joinSession', ({ sessionId, playerName }) => {
        if (sessions[sessionId]) {
            sessions[sessionId].players.push({ name: playerName, socketId: socket.id, points: 0 });
            socket.join(sessionId);
            io.to(sessionId).emit('playerJoined', { players: sessions[sessionId].players });
            console.log('Player joined session:', sessionId, playerName);
        } else {
            socket.emit('error', 'Session not found');
        }
    });

    socket.on('startGame', ({ sessionId, rounds }) => {
        console.log(`Starting game for session ${sessionId} with ${rounds} rounds`);
        if (sessions[sessionId] && sessions[sessionId].players.length === 4) {
            sessions[sessionId].rounds = rounds; // Set total rounds
            startRound(sessionId); // Start the first round
        } else {
            console.error(`Cannot start game: not enough players or session not found. Session:`, sessions[sessionId]);
            socket.emit('error', 'Cannot start game: not enough players or session not found');
        }
    });

    socket.on('nextLine', ({ sessionId }) => {
        nextLine(sessionId);
    });

    socket.on('guessAdlibber', ({ sessionId, guess }) => {
        const session = sessions[sessionId];
        const adlibber = session.players.find(player => session.roles[player.socketId] === 'Speaker 1');
        
        if (adlibber.name === guess) {
            // Correct guess
            const guesser = session.players.find(player => session.roles[player.socketId] === 'Guesser');
            guesser.points += 1;
            io.to(sessionId).emit('updatePoints', { points: { [guesser.name]: guesser.points } });
        }
    
        // Check if all rounds are completed
        if (session.currentRound >= session.rounds) {
            console.log('Game has ended');
            io.to(sessionId).emit('endGame'); // Signal end of game
        } else {
            // Increment current round
            session.currentRound++;
            console.log('Begining Round', session.currentRound, '/', session.rounds);
    
            // Start next round
            startRound(sessionId);
        }
    });
    

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Handle player disconnection here
    });
});

function startRound(sessionId) {
    const session = sessions[sessionId];
    session.currentRound++;

    // Assign roles for this round
    const roles = ['Guesser', 'Speaker 1', 'Speaker 2', 'Speaker 3'];
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);
    
    session.roles = {};
    session.players.forEach((player, index) => {
        session.roles[player.socketId] = shuffledRoles[index];
    });

    // Choose a random script
    const randomScriptIndex = Math.floor(Math.random() * scripts.length);
    session.currentScript = scripts[randomScriptIndex];
    session.currentLineIndex = 0;

    console.log(`Starting Round ${session.currentRound} for session ${sessionId}`);
    console.log('Roles assigned:', session.roles);
    console.log('Selected script:', session.currentScript);

    io.to(sessionId).emit('gameStarted', { 
        rounds: session.rounds, 
        roles: session.roles
    });

    // Start the first line for this round
    nextLine(sessionId);
}

function nextLine(sessionId) {
    const session = sessions[sessionId];
    if (!session) {
        console.error(`Session ${sessionId} not found`);
        return;
    }

    console.log(`Current script:`, session.currentScript);
    console.log(`Current line index:`, session.currentLineIndex);

    if (session.currentLineIndex < session.currentScript.dialogue.length) {
        const currentLine = session.currentScript.dialogue[session.currentLineIndex];
        console.log(`Current line:`, currentLine);

        const speakerRole = `Speaker ${currentLine.speaker}`;
        console.log(`Looking for speaker with role:`, speakerRole);

        const speakerSocket = Object.keys(session.roles).find(key => session.roles[key] === speakerRole);
        console.log(`Speaker socket:`, speakerSocket);

        if (!speakerSocket) {
            console.error(`No player found with role ${speakerRole}`);
            return;
        }

        const speaker = session.players.find(player => player.socketId === speakerSocket);
        if (!speaker) {
            console.error(`No player found with socket ID ${speakerSocket}`);
            return;
        }

        const speakerName = speaker.name;
        session.currentSpeaker = speakerSocket;

        console.log(`Current speaker: ${speakerName}`);

        if (currentLine.text === "ADLIB") {
            io.to(speakerSocket).emit('updateLine', { line: "ADLIB", isAdlib: true, isSpeaker: true });
        } else {
            io.to(speakerSocket).emit('updateLine', { line: currentLine.text, isAdlib: false, isSpeaker: true });
        }

        // Tell other players who is speaking
        session.players.forEach(player => {
            if (player.socketId !== speakerSocket && session.roles[player.socketId] !== 'Guesser') {
                io.to(player.socketId).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });
            }
        });

        // Tell the guesser who is speaking
        const guesserSocket = Object.keys(session.roles).find(key => session.roles[key] === 'Guesser');
        if (guesserSocket) {
            io.to(guesserSocket).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });
        } else {
            console.error('No guesser found in the session');
        }

        session.currentLineIndex++;
    } else {
        // End of script
        io.to(sessionId).emit('endScene');
    }
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
