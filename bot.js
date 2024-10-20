const { createBot } = require('./src/botConfig');
const { setupEventHandlers } = require('./src/eventHandlers');
const { setupMessageHandlers } = require('./src/messageHandlers');

const bot = createBot();

setupEventHandlers(bot, false); // Set to true if you want to enable exploration
setupMessageHandlers(bot);

module.exports = bot;
