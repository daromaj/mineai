require('dotenv').config();

const mineflayer = require('mineflayer');

// Create the bot using values from the environment variables
const bot = mineflayer.createBot({
  host: process.env.HOST,
  port: parseInt(process.env.PORT, 10),
  username: process.env.USERNAME,
  version: false,
  auth: 'microsoft'
});

// Log errors and kick reasons:
bot.on('kicked', console.log)
bot.on('error', console.log)

const welcome = () =>{
    bot.chat('Cześć! Powiedz coś do mnie zaczynając od aibot');
}

bot.once('spawn', welcome);

// Log messages from other users and respond to 'aibot' messages
bot.on('chat', (username, message) => {
  console.log(`${username}: ${message}`); // Log the message

  if (message.startsWith('aibot')) {
      bot.chat(message); // Repeat the message back
  }
});
