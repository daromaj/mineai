const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { fork } = require('child_process');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

let botProcess = null;
let isBotConnected = false;

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('login', () => {
    if (botProcess) {
      socket.emit('message', { type: 'log', content: 'Bot is already connected' });
      return;
    }

    botProcess = fork(path.join(__dirname, 'bot.js'), [], {
      env: {
        ...process.env,
        HOST: process.env.HOST,
        PORT: process.env.PORT,
        USERNAME: process.env.USERNAME
      }
    });

    botProcess.on('message', (message) => {
      console.log('Bot process message:', message);
      if (message === 'BOT_SPAWNED') {
        isBotConnected = true;
        socket.emit('message', { type: 'log', content: 'Bot has spawned and is connected' });
      } else if (message === 'BOT_DISCONNECTED') {
        isBotConnected = false;
        socket.emit('message', { type: 'log', content: 'Bot has disconnected' });
      } else if (message.type === 'CHAT_MESSAGE') {
        socket.emit('message', { type: 'chat', content: message.data.message });
      } else if (message.type === 'LOG') {
        socket.emit('message', { type: 'log', content: message.data });
      }
    });

    botProcess.on('error', (error) => {
      console.error('Bot process error:', error);
      socket.emit('message', { type: 'log', content: `Bot error: ${error.message}` });
    });

    botProcess.on('close', (code) => {
      console.log(`Bot process exited with code ${code}`);
      socket.emit('message', { type: 'log', content: `Bot disconnected (exit code: ${code})` });
      isBotConnected = false;
      botProcess = null;
    });
  });

  socket.on('sendMessage', (message) => {
    console.log('Attempt to send message:', message);
    console.log('Bot connection status:', isBotConnected);
    if (isBotConnected && botProcess) {
      try {
        botProcess.send({ type: 'SEND_CHAT', message: message });
        console.log('Sending message to bot:', message);
        socket.emit('message', { type: 'log', content: `Sending message: ${message}` });
      } catch (error) {
        console.error('Error sending message to bot:', error);
        socket.emit('message', { type: 'log', content: `Error sending message: ${error.message}` });
      }
    } else {
      console.error('Bot is not connected');
      socket.emit('message', { type: 'log', content: 'Bot is not connected' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    if (botProcess) {
      botProcess.kill();
      botProcess = null;
    }
    isBotConnected = false;
  });
});

const PORT = process.env.WEB_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
