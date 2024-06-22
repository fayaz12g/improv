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
            currentSpeaker: null
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
        if (sessions[sessionId] && sessions[sessionId].players.length === 4) {
            const roles = ['Guesser', 'Speaker One', 'Speaker Two', 'Speaker Three'];
            const shuffledRoles = roles.sort(() => Math.random() - 0.5);
            
            sessions[sessionId].roles = {};
            sessions[sessionId].players.forEach((player, index) => {
                sessions[sessionId].roles[player.socketId] = shuffledRoles[index];
            });

            // Choose a random script
            const randomScriptIndex = Math.floor(Math.random() * scripts.length);
            sessions[sessionId].currentScript = scripts[randomScriptIndex];
            sessions[sessionId].currentLineIndex = 0;

            io.to(sessionId).emit('gameStarted', { 
                rounds, 
                roles: sessions[sessionId].roles
            });

            // Start the first line
            nextLine(sessionId);

            console.log('Game started for session:', sessionId);
        } else {
            socket.emit('error', 'Cannot start game: not enough players or session not found');
        }
    });

    socket.on('nextLine', ({ sessionId }) => {
        nextLine(sessionId);
    });

    socket.on('guessAdlibber', ({ sessionId, guess }) => {
        const session = sessions[sessionId];
        const adlibber = session.players.find(player => session.roles[player.socketId] === 'Speaker One');
        
        if (adlibber.name === guess) {
            // Correct guess
            const guesser = session.players.find(player => session.roles[player.socketId] === 'Guesser');
            guesser.points += 1;
            io.to(sessionId).emit('updatePoints', { points: { [guesser.name]: guesser.points } });
        }

        // Start next round or end game
        // This is where you'd implement the logic to reshuffle roles and start a new round
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Handle player disconnection here
    });
});

function nextLine(sessionId) {
    const session = sessions[sessionId];
    if (session.currentLineIndex < session.currentScript.dialogue.length) {
        const currentLine = session.currentScript.dialogue[session.currentLineIndex];
        const speakerRole = `Speaker ${currentLine.speaker}`;
        const speakerSocket = Object.keys(session.roles).find(key => session.roles[key] === speakerRole);
        const speakerName = session.players.find(player => player.socketId === speakerSocket).name;
        
        session.currentSpeaker = speakerSocket;

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
        io.to(guesserSocket).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });

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