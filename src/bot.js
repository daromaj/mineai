const { createBot } = require('./botConfig');
const { setupEventHandlers } = require('./eventHandlers');
const { setupMessageHandlers } = require('./messageHandlers');

const bot = createBot();

setupEventHandlers(bot, false); // Set to true if you want to enable exploration
setupMessageHandlers(bot);

module.exports = bot;
