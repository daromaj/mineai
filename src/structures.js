function createRainbow(bot) {
  const colors = ['red_wool', 'orange_wool', 'yellow_wool', 'lime_wool', 'light_blue_wool', 'blue_wool', 'purple_wool'];
  const centerX = Math.floor(bot.entity.position.x);
  const centerY = Math.floor(bot.entity.position.y);
  const centerZ = Math.floor(bot.entity.position.z);
  const radius = 10;
  const heightFactor = 2;

  for (let i = 0; i < colors.length; i++) {
    for (let angle = -Math.PI / 2; angle <= Math.PI / 2; angle += Math.PI / 20) {
      const x = centerX + Math.round(radius * Math.cos(angle));
      const z = centerZ + i;
      const y = centerY + Math.round(heightFactor * Math.sin(angle));

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

module.exports = { createRainbow, createSettlerHouse };
