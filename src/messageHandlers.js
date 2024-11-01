const { createBuilding, materials_test, list_buildings } = require('./buildings');
const MessageTypes = require('./messageTypes');

function setupMessageHandlers(bot) {
  process.on('message', (msg) => {
    if (msg.type === MessageTypes.SEND_CHAT) {
      try {
        bot.chat(msg.message);
        process.send({ type: MessageTypes.LOG, data: `Message sent: ${msg.message}` });
      } catch (err) {
        process.send({ type: MessageTypes.LOG, data: `Error sending message: ${err.message}` });
      }
    }
    if (msg.type === MessageTypes.COMMAND) {
      try {
        bot.setControlState('forward', true);
        process.send({ type: MessageTypes.LOG, data: `Performed action ${msg.message}` });
      } catch (err) {
        process.send({ type: MessageTypes.LOG, data: `Error performing action ${msg.message} message: ${err.message}` });
      }
    }
    if (msg.type === MessageTypes.CREATE_STRUCTURE) {
      try {
        const structureFunction = new Function('bot', msg.functionBody);
        structureFunction(bot);
        process.send({ type: MessageTypes.LOG, data: 'Structure creation function executed' });
      } catch (err) {
        process.send({ type: MessageTypes.LOG, data: `Error creating structure: ${err.message}` });
      }
    }
    if (msg.type === MessageTypes.CREATE_BUILDING) {
      createBuilding(bot, msg.building_id);
    }
    if (msg.type === MessageTypes.TEST_MATERIALS) {
      materials_test(bot);
    }
    if (msg.type === MessageTypes.LIST_BUILDINGS) {
      try {
        list_buildings(bot, msg.message);
        process.send({ type: MessageTypes.LOG, data: `Message sent: ${msg.message}` });
      } catch (err) {
        process.send({ type: MessageTypes.LOG, data: `Error sending message: ${err.message}` });
      }
    }    
  });

  process.on('SIGTERM', () => {
    console.log('Bot process terminated');
    bot.end();
  });
}

module.exports = { setupMessageHandlers };
