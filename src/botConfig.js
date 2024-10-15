const mineflayer = require('mineflayer');
const mineflayerViewer = require('prismarine-viewer').mineflayer;

const createBot = () => {
  console.log('Starting bot... and connecting to the server ' + process.env.HOST + ':' + process.env.PORT);

  const bot = mineflayer.createBot({
    host: process.env.HOST,
    port: parseInt(process.env.PORT, 10),
    username: process.env.USERNAME,
    version: false,
    auth: 'offline'
  });

  return bot;
};

module.exports = { createBot, mineflayerViewer };
