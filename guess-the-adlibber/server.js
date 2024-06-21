const https = require('https');
const fs = require('fs');
const express = require('express');
const socketIO = require('socket.io');

const app = express();

// Update these paths to point to your SSL certificate and key files
const options = {
    key: fs.readFileSync('./privkey.pem'),
    cert: fs.readFileSync('./fullchain.pem')
};

const server = https.createServer(options, app);
const io = socketIO(server);

app.use(express.static('build'));

let sessions = {};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('createSession', () => {
        const sessionId = Math.random().toString(36).substring(2, 15);
        const shortSessionId = sessionId.substr(0, 4).toUpperCase();
        sessions[shortSessionId] = { sessionId, players: [] }; // Store with shortSessionId as the key
        socket.join(sessionId);
        socket.emit('sessionCreated', { sessionId: shortSessionId });
        console.log('Session created with ID:', sessionId);
    });
    

    socket.on('joinSession', ({ sessionId, playerName }) => {
        if (sessions[sessionId]) { // Check against shortSessionId
            sessions[sessionId].players.push({ name: playerName, socketId: socket.id, points: 0 });
            socket.join(sessions[sessionId].sessionId); // Join the full sessionId room
            io.to(sessions[sessionId].sessionId).emit('playerJoined', { players: sessions[sessionId].players });
            console.log('Player joined session:', sessionId, playerName);
        } else {
            socket.emit('error', 'Session not found');
        }
    });
    

    socket.on('startGame', ({ sessionId, rounds }) => {
        // Handle starting game logic
        io.to(sessionId).emit('gameStarted', { rounds, scripts: [] });
        console.log('Game started for session:', sessionId);
    });

    socket.on('nextLine', ({ sessionId, line }) => {
        io.to(sessionId).emit('updateLine', { line });
    });

    socket.on('guessAdlibber', ({ sessionId, guess }) => {
        // Handle guessing logic and update points
        io.to(sessionId).emit('updatePoints', { points: '1' });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
