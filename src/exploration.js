const { Vec3 } = require('vec3');

let stopExploration = false;
const states = ['left', 'right', 'jump'];

function turnTheBot(bot) {
  if (Math.random() < 0.5) {
    const turnAmount = (Math.random() * 10 - 5) * Math.PI / 180;
    const newYaw = bot.entity.yaw + turnAmount;
    bot.look(newYaw, 0);
  }
}

function scoutSurroundings(bot) {
  const maxDistance = 5;

  const nearbyBlockPositions = bot.findBlocks({
    matching: block => block.name !== 'air',
    maxDistance: maxDistance,
    count: 1000
  });

  const nearbyBlocks = nearbyBlockPositions.map(pos => {
    const block = bot.blockAt(pos);
    return {
      type: block.name,
      position: pos
    };
  });

  const visibleEntities = Object.values(bot.entities).filter(entity => {
    const distance = bot.entity.position.distanceTo(entity.position);
    return distance <= maxDistance;
  });

  return {
    blocks: nearbyBlocks,
    entities: visibleEntities.map(entity => ({
      name: entity.name,
      position: entity.position
    }))
  };
}

function exploreTheWorld(bot) {
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

function cleanup(bot) {
  stopExploration = true;
  bot.setControlState('forward', false);
  bot.setControlState('sprint', false);
  if (bot.viewer) {
    console.log('closing viewer');
    bot.viewer.close();
    console.log('viewer closed');
  }
}

module.exports = { scoutSurroundings, exploreTheWorld, cleanup };
