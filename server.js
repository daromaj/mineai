const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { fork } = require('child_process');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const { OpenAI } = require('openai');

const aiclient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

app.use(express.static(path.join(__dirname, 'public')));

let botProcess = null;
let isBotConnected = false;

function handleChatMessage(username, message, socket) {
  console.log(`Received message from ${username}: ${message}`);

  const messageParts = message.toLowerCase().split(' ');
  if (messageParts[1] === "aibot" && messageParts[2] === "buduj") {
    handleAIBotDawaj(username, message, socket);
  } else if (messageParts[1] === "aibot") {
    handleAIBot(username, message, socket);
  } else {
    handleNormalMessage(username, message);
  }
}

function extractFunctionBody(text) {
  const functionRegex = /function\s+createStructure\s*\([\s\S]*?\{([\s\S]*)\}/;
  const match = text.match(functionRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function handleAIBotDawaj(username, message, socket) {
  const prompt = message.split(' ').slice(3).join(' ');
  const systemPrompt = `You are an AI assistant that generates JavaScript functions for creating structures in Minecraft using the Mineflayer library. The function should accept a 'bot' parameter and use 'bot.chat' to send setblock commands. Create a function that builds a structure based on the following prompt: "${prompt}". The prompt is in Polish language. The function should be named 'createStructure'. It should start creating the structure at bot.entity.position. use Math.floor for calculating blocks placement - the need integer value. Respond ONLY with the code for createStructure function.`;

  aiclient.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    model: "llama-3.1-70b-versatile",
  })
  .then(response => {
    const generatedFunction = response.choices[0].message.content;
    const functionBody = extractFunctionBody(generatedFunction);
    console.log(functionBody)
    
    if (functionBody) {
      socket.emit('message', { type: 'log', content: 'Structure creation function generated' });
      
      if (botProcess) {
        botProcess.send({ type: 'CREATE_STRUCTURE', functionBody: functionBody });
      } else {
        socket.emit('message', { type: 'log', content: 'Bot is not connected. Cannot create structure.' });
      }
    } else {
      socket.emit('message', { type: 'log', content: 'Failed to extract valid function body from AI response.' });
    }
  })
  .catch(error => {
    console.error('Error generating structure function:', error);
    socket.emit('message', { type: 'log', content: 'Error generating structure function' });
  });
}

function handleAIBot(username, message, socket) {
  aiclient.chat.completions.create({
    messages: [
      { role: "system", content: "Rozmawiasz wyłącznie po polsku i jesteś pomocnym botem w świecie minecraft. Pisze do Ciebie gracz "+username },
      {role: "user", content: message}      
    ],
    model: "llama-3.1-70b-versatile",
  })
  .then(response => {
    aimessage = response.choices[0].message.content;
    socket.emit('message', { type: 'chat', content: aimessage });
    botProcess.send({ type: 'SEND_CHAT', message: aimessage });
  })
  .catch(error => {
    console.error('Error generating response:', error);
    socket.emit('message', { type: 'log', content: 'Error generating response' });
  });
}

function handleNormalMessage(username, message) {
  console.log(`Normal message received from ${username}: ${message}`);
}

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
