const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mineflayer = require('mineflayer');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

let bot = null;

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('login', () => {
    if (bot) {
      socket.emit('log', 'Bot is already connected');
      return;
    }

    const botProcess = spawn('node', ['-e', `
      const mineflayer = require('mineflayer');
      const bot = mineflayer.createBot({
        host: '${process.env.HOST}',
        port: ${parseInt(process.env.PORT, 10)},
        username: '${process.env.USERNAME}',
        version: false,
        auth: 'microsoft'
      });
      bot.on('spawn', () => console.log('BOT_SPAWNED'));
      bot.on('error', (err) => console.error('BOT_ERROR:', err.message));
      bot.on('end', () => console.log('BOT_DISCONNECTED'));
    `]);

    botProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      console.log('Bot process output:', message);
      if (message.includes('To sign in, use a web browser to open the page')) {
        socket.emit('loginMessage', message);
      } else if (message === 'BOT_SPAWNED') {
        socket.emit('log', 'Bot has spawned');
        bot = botProcess;
      }
    });

    botProcess.stderr.on('data', (data) => {
      console.error('Bot process error:', data.toString());
      socket.emit('log', `Bot error: ${data.toString()}`);
    });

    botProcess.on('close', (code) => {
      console.log(`Bot process exited with code ${code}`);
      socket.emit('log', `Bot disconnected (exit code: ${code})`);
      bot = null;
    });
  });

  socket.on('sendMessage', (message) => {
    if (bot) {
      bot.stdin.write(`bot.chat("${message}")\n`);
    } else {
      socket.emit('log', 'Bot is not connected');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    if (bot) {
      bot.kill();
      bot = null;
    }
  });
});

const PORT = process.env.WEB_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
