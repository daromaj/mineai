const { mineflayerViewer } = require('./botConfig');
const { exploreTheWorld, cleanup } = require('./exploration');

function setupEventHandlers(bot, explore = false) {
  bot.on('spawn', () => {
    console.log('Bot spawned');
    process.send('BOT_SPAWNED');
    setTimeout(() => {
      try {
        bot.chat("Cześć, jestem aibot. Powiedz coś do mnie zaczynając od aibot.");
        bot.chat("jeżeli napiszesz: aibot buduj <opis budowli> - to spróbuję to dla Ciebie zbudować.");
        cleanup(bot);
        process.send({ type: 'LOG', data: 'Introduction message sent' });
        mineflayerViewer(bot, { port: 3001, firstPerson: false });
        if (explore) {
          exploreTheWorld(bot);
        }
      } catch (err) {
        process.send({ type: 'LOG', data: `Error sending introduction: ${err.message}` });
      }
    }, 2000);
  });

  bot.on('error', (err) => {
    console.error('Bot error:', err.message);
    process.send({ type: 'LOG', data: `Bot error: ${err.message}` });
  });

  bot.on('end', () => {
    console.log('Bot disconnected');
    cleanup(bot);
    process.send('BOT_DISCONNECTED');
  });

  bot.on('message', (message) => {
    process.send({ type: 'CHAT_MESSAGE', data: { message: message.toString() } });
  });
}

module.exports = { setupEventHandlers };
