const mineflayer = require('mineflayer');
const mineflayerViewer = require('prismarine-viewer').mineflayer

const bot = mineflayer.createBot({
  host: process.env.HOST,
  port: parseInt(process.env.PORT, 10),
  username: process.env.USERNAME,
  version: false,
  auth: 'microsoft'
});

bot.on('spawn', () => {
  console.log('Bot spawned');
  process.send('BOT_SPAWNED');
  setTimeout(() => {
    try {
      bot.chat("Cześć, jestem aibot");
      process.send({ type: 'LOG', data: 'Introduction message sent' });
      mineflayerViewer(bot, { port: 3001, firstPerson: true })      
    } catch (err) {
      process.send({ type: 'LOG', data: `Error sending introduction: ${err.message}` });
    }
  }, 2000);



  // const path = [bot.entity.position.clone()]
  // bot.on('move', () => {
  //   if (path[path.length - 1].distanceTo(bot.entity.position) > 1) {
  //     path.push(bot.entity.position.clone())
  //     bot.viewer.drawLine('path', path)
  //   }
  // })  
});

bot.on('error', (err) => {
  console.error('Bot error:', err.message);
  process.send({ type: 'LOG', data: `Bot error: ${err.message}` });
});

bot.on('end', () => {
  console.log('Bot disconnected');
  if(bot.viewer){
    console.log('closing viewer');
    bot.viewer.close();
    console.log('viewer closed');
  }
  process.send('BOT_DISCONNECTED');
});

bot.on('message', (message) => {
  process.send({ type: 'CHAT_MESSAGE', data: { message: message.toString() } });
});

process.on('message', (msg) => {
  if (msg.type === 'SEND_CHAT') {
    try {
      bot.chat(msg.message);
      process.send({ type: 'LOG', data: `Message sent: ${msg.message}` });
    } catch (err) {
      process.send({ type: 'LOG', data: `Error sending message: ${err.message}` });
    }
  }
});

process.on('SIGTERM', () => {
  console.log('Bot process terminated');
  bot.end();
});
