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
    bot.chat('hi!');
}

bot.once('spawn', welcome);
