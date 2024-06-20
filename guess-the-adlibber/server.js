const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;
let sessions = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createSession', () => {
        const sessionId = generateSessionId();
        sessions[sessionId] = { host: socket.id, players: [], points: {} };
        socket.join(sessionId);
        socket.emit('sessionCreated', { sessionId });
    });

    socket.on('joinSession', ({ sessionId, playerName }) => {
        if (sessions[sessionId]) {
            sessions[sessionId].players.push({ id: socket.id, name: playerName });
            sessions[sessionId].points[socket.id] = 0;
            socket.join(sessionId);
            io.to(sessionId).emit('playerJoined', { players: sessions[sessionId].players });
        } else {
            socket.emit('error', 'Session not found');
        }
    });

    socket.on('startGame', async ({ sessionId, rounds }) => {
        const scripts = await fetchScripts();
        io.to(sessionId).emit('gameStarted', { rounds, scripts });
    });

    socket.on('nextLine', ({ sessionId, line }) => {
        io.to(sessionId).emit('updateLine', { line });
    });

    socket.on('guessAdlibber', ({ sessionId, guess }) => {
        const points = updatePoints(sessionId, guess);
        io.to(sessionId).emit('updatePoints', { points });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        // Handle player disconnection
    });
});

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15);
}

function updatePoints(sessionId, guess) {
    // Implement point updating logic
    return sessions[sessionId].points;
}

async function fetchScripts() {
    const response = await fetch('https://raw.githubusercontent.com/fayaz12g/gta/main/scripts.json');
    return response.json();
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
