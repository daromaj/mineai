const { fork } = require('child_process');
const path = require('path');
const { handleAIBotBuild, handleAIBot } = require('./openaiHandler');

let botProcess = null;
let isBotConnected = false;

function startBot(socket) {
  if (botProcess) {
    socket.emit('message', { type: 'log', content: 'Bot is already connected' });
    return;
  }

  botProcess = fork(path.join(__dirname, '..', 'bot.js'), [], {
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
      handleChatMessage(message.data.username, message.data.message, socket);
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
}

function stopBot(socket) {
  if (botProcess) {
    botProcess.kill();
    botProcess = null;
    isBotConnected = false;
    socket.emit('message', { type: 'log', content: 'Bot process stopped' });
  } else {
    socket.emit('message', { type: 'log', content: 'No bot process to stop' });
  }
}

function sendMessage(message, socket) {
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
}

function handleChatMessage(username, message, socket) {
  console.log(`Received message from ${username}: ${message}`);

  const messageParts = message.toLowerCase().split(' ');
  if (messageParts[1] === "aibot" && messageParts[2] === "buduj") {
    handleAIBotBuild(username, message, socket, botProcess);
  } else if (messageParts[1] === "aibot") {
    handleAIBot(username, message, socket, botProcess);
  } else {
    handleNormalMessage(username, message);
  }
}

function handleNormalMessage(username, message) {
  console.log(`Normal message received from ${username}: ${message}`);
}

module.exports = {
  startBot,
  stopBot,
  sendMessage,
  handleChatMessage
};
