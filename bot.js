const mineflayer = require('mineflayer');
const mineflayerViewer = require('prismarine-viewer').mineflayer
const { Vec3 } = require('vec3');

const bot = mineflayer.createBot({
  host: process.env.HOST,
  port: parseInt(process.env.PORT, 10),
  username: process.env.USERNAME,
  version: false,
  auth: 'microsoft'
});

explore = false;

states = ['left', 'right', 'jump'];
// 'back', 'sneak'

let stopExploration = false;

function turnTheBot(bot){
  if (Math.random() < 0.5) {
    const turnAmount = (Math.random() * 10 - 5) * Math.PI / 180; // Convert degrees to radians
    const newYaw = bot.entity.yaw + turnAmount;
    bot.look(newYaw, 0); // Pitch of 0 means looking straight forward
  }
}

function exploreTheWorld(bot){
  bot.setControlState('forward', true);
  bot.setControlState('sprint', true);
  let intervalId = setInterval(() => {
    if (stopExploration) {
      clearInterval(intervalId);
      return;
    }
    const state = states[Math.floor(Math.random() * states.length)];
    bot.setControlState(state, true);
    setTimeout(() => {
      bot.setControlState(state, false);
    }, 90);

    turnTheBot(bot);
  }, 100);
}


function cleanup(bot){
  stopExploration = true;
  bot.setControlState('forward', false);
  bot.setControlState('sprint', false);
  if(bot.viewer){
    console.log('closing viewer');
    bot.viewer.close();
    console.log('viewer closed');
  }  
}

bot.on('spawn', () => {
  console.log('Bot spawned');
  process.send('BOT_SPAWNED');
  setTimeout(() => {
    try {
      bot.chat("Cześć, jestem aibot");
      cleanup(bot);
      stopExploration = false;
      process.send({ type: 'LOG', data: 'Introduction message sent' });
      mineflayerViewer(bot, { port: 3001, firstPerson: false })      
      if(explore){
        exploreTheWorld(bot);
      }
      // createRainbow(bot);
      // createSettlerHouse(bot);
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
  cleanup(bot)
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
  if(msg.type === 'COMMAND') {
    try {
      bot.setControlState('forward', true);
      process.send({ type: 'LOG', data: `Performed action ${msg.message}` });
    } catch (err) {
      process.send({ type: 'LOG', data: `Error performing action ${msg.message} message: ${err.message}` });
    }    
  }
});

process.on('SIGTERM', () => {
  stopExploration = true;  
  console.log('Bot process terminated');
  bot.end();
});


/**
 * Creates a rainbow at the bot's location.
 * 
 * @param {MineflayerBot} bot The bot to create the rainbow for.
 */function createRainbow(bot) {
  const colors = ['red_wool', 'orange_wool', 'yellow_wool', 'lime_wool', 'light_blue_wool', 'blue_wool', 'purple_wool'];
  const centerX = Math.floor(bot.entity.position.x);
  const centerY = Math.floor(bot.entity.position.y);
  const centerZ = Math.floor(bot.entity.position.z);
  const radius = 10; // Adjust for bigger or smaller arc
  const heightFactor = 2; // Controls arc height

  for (let i = 0; i < colors.length; i++) {
    for (let angle = -Math.PI / 2; angle <= Math.PI / 2; angle += Math.PI / 20) { // Half-circle arc
      const x = centerX + Math.round(radius * Math.cos(angle));
      const z = centerZ + i; // Shifts each color horizontally
      const y = centerY + Math.round(heightFactor * Math.sin(angle)); // Controls height

      bot.chat(`/setblock ${x} ${y} ${z} ${colors[i]}`);
    }
  }

  bot.chat('Rainbow arc created!');
}


function createSettlerHouse(bot) {
  const startX = Math.floor(bot.entity.position.x) + 1;
  const startY = Math.floor(bot.entity.position.y);
  const startZ = Math.floor(bot.entity.position.z);

  const width = 5;
  const height = 4;
  const depth = 5;

  // Build walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        if (x === 0 || x === width - 1 || z === 0 || z === depth - 1) {
          bot.chat(`/setblock ${startX + x} ${startY + y} ${startZ + z} oak_planks`);
        }
      }
    }
  }

  // Build roof
  for (let x = -1; x <= width; x++) {
    for (let z = -1; z <= depth; z++) {
      bot.chat(`/setblock ${startX + x} ${startY + height} ${startZ + z} oak_slab`);
    }
  }

  // Create door
  bot.chat(`/setblock ${startX + Math.floor(width / 2)} ${startY + 1} ${startZ} air`);
  bot.chat(`/setblock ${startX + Math.floor(width / 2)} ${startY + 2} ${startZ} air`);

  // Create windows
  bot.chat(`/setblock ${startX} ${startY + 2} ${startZ + Math.floor(depth / 2)} glass`);
  bot.chat(`/setblock ${startX + width - 1} ${startY + 2} ${startZ + Math.floor(depth / 2)} glass`);

  bot.chat('Settler house created!');
}
