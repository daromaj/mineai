const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config({ path: `.env.local`, override: true });

const { startBot, stopBot, sendMessage, handleChatMessage } = require('./src/aiCommands');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('login', () => {
    startBot(socket);
  });

  socket.on('sendMessage', (message) => {
    console.log('Attempt to send message:', message);
    sendMessage(message, socket);
  });

  socket.on('stopBot', () => {
    stopBot(socket);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    stopBot(socket);
  });
});

const PORT = process.env.WEB_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
