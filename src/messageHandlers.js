const { createBuilding, materials_test } = require('./buildings');

function setupMessageHandlers(bot) {
  process.on('message', (msg) => {
    if (msg.type === 'SEND_CHAT') {
      try {
        bot.chat(msg.message);
        process.send({ type: 'LOG', data: `Message sent: ${msg.message}` });
      } catch (err) {
        process.send({ type: 'LOG', data: `Error sending message: ${err.message}` });
      }
    }
    if (msg.type === 'COMMAND') {
      try {
        bot.setControlState('forward', true);
        process.send({ type: 'LOG', data: `Performed action ${msg.message}` });
      } catch (err) {
        process.send({ type: 'LOG', data: `Error performing action ${msg.message} message: ${err.message}` });
      }
    }
    if (msg.type === 'CREATE_STRUCTURE') {
      try {
        const structureFunction = new Function('bot', msg.functionBody);
        structureFunction(bot);
        process.send({ type: 'LOG', data: 'Structure creation function executed' });
      } catch (err) {
        process.send({ type: 'LOG', data: `Error creating structure: ${err.message}` });
      }
    }
    if (msg.type === 'CREATE_BUILDING') {
      createBuilding(bot, msg.building_id);
    }
    if (msg.type === 'TEST_MATERIALS') {
      materials_test(bot);
    }
  });

  process.on('SIGTERM', () => {
    console.log('Bot process terminated');
    bot.end();
  });
}

module.exports = { setupMessageHandlers };
