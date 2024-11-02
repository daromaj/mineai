const MessageTypes = require('./messageTypes');
const { OpenAI } = require('openai');

const aiclient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

function extractFunctionBody(text) {
  const functionRegex = /function\s+createStructure\s*\([\s\S]*?\{([\s\S]*)\}/;
  const match = text.match(functionRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function handleAIBotBuild(username, message, socket, botProcess) {
  const messageParts = message.split(' ');
  console.log(`messageParts ${messageParts}`);
  const thirdPartIsNumber = !isNaN(messageParts[3]);
  console.log(`thirdPartIsNumber ${thirdPartIsNumber}`);
  console.log(`messageParts[3] ${messageParts[3]}`);
  let prompt;
  let systemPrompt;

  if (messageParts[3] === 'test') {
    if (botProcess) {
      botProcess.send({ type: MessageTypes.TEST_MATERIALS });
    } else {
      socket.emit('message', { type: 'log', content: 'Bot is not connected. Cannot test materials.' });
    }
    return;
  }

  if (thirdPartIsNumber) {
    console.log(`Received build request from ${username} with id: ${messageParts[3]}`);

    building_id = messageParts[3];
    socket.emit('message', { type: 'log', content: 'Bot request for building ' + building_id });

    if (botProcess) {
      botProcess.send({ type: 'CREATE_BUILDING', building_id: building_id });
    } else {
      socket.emit('message', { type: 'log', content: 'Bot is not connected. Cannot create building.' });
    }
    return;

  } else {
    console.log(`Received build request from ${username}`);
    prompt = messageParts.slice(3).join(' ');
    systemPrompt = `You are an AI assistant that generates JavaScript functions for creating structures in Minecraft using the Mineflayer library. The function should accept a 'bot' parameter and use 'bot.chat' to send setblock commands. Create a function that builds a structure based on the following prompt: "${prompt}". The prompt is in Polish language. The function should be named 'createStructure'. It should start creating the structure at bot.entity.position. use Math.floor for calculating blocks placement - they need integer value. Bot is connected to Minecraft Java edition. 
    If prompt doesn't specify materials, try to limit yourself to these blocks:
    minecraft:stone
    minecraft:dirt
    minecraft:grass_block
    minecraft:cobblestone
    minecraft:sand
    minecraft:gravel
    minecraft:oak_log
    minecraft:spruce_log
    minecraft:birch_log
    minecraft:jungle_log
    minecraft:acacia_log
    minecraft:dark_oak_log
    minecraft:oak_planks
    minecraft:spruce_planks
    minecraft:birch_planks
    minecraft:jungle_planks
    minecraft:acacia_planks
    minecraft:dark_oak_planks
    minecraft:oak_leaves
    minecraft:spruce_leaves
    minecraft:birch_leaves
    minecraft:jungle_leaves
    minecraft:sandstone
    minecraft:glass
    minecraft:coal_ore
    minecraft:iron_ore
    minecraft:gold_ore
    minecraft:diamond_ore
    minecraft:emerald_ore
    minecraft:redstone_ore
    minecraft:lapis_ore
    minecraft:bedrock
    minecraft:clay
    minecraft:water
    minecraft:lava

    minecraft:white_wool
    minecraft:orange_wool
    minecraft:magenta_wool
    minecraft:light_blue_wool
    minecraft:yellow_wool
    minecraft:lime_wool
    minecraft:pink_wool
    minecraft:gray_wool
    minecraft:light_gray_wool
    minecraft:cyan_wool
    minecraft:purple_wool
    minecraft:blue_wool
    minecraft:brown_wool
    minecraft:green_wool
    minecraft:red_wool
    minecraft:black_wool

    minecraft:white_terracotta
    minecraft:orange_terracotta
    minecraft:magenta_terracotta
    minecraft:light_blue_terracotta
    minecraft:yellow_terracotta
    minecraft:lime_terracotta
    minecraft:pink_terracotta
    minecraft:gray_terracotta
    minecraft:light_gray_terracotta
    minecraft:cyan_terracotta
    minecraft:purple_terracotta
    minecraft:blue_terracotta
    minecraft:brown_terracotta
    minecraft:green_terracotta
    minecraft:red_terracotta
    minecraft:black_terracotta

    Respond ONLY with the code for createStructure function.`;
  }

  aiclient.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    model: process.env.GROQ_MODEL,
  })
    .then(response => {
      const generatedFunction = response.choices[0].message.content;
      const functionBody = extractFunctionBody(generatedFunction);
      console.log(functionBody)

      if (functionBody) {
        socket.emit('message', { type: 'log', content: 'Structure creation function generated' });

        if (botProcess) {
          botProcess.send({ type: MessageTypes.CREATE_STRUCTURE, functionBody: functionBody });
        } else {
          socket.emit('message', { type: 'log', content: 'Bot is not connected. Cannot create structure.' });
        }
      } else {
        socket.emit('message', { type: 'log', content: 'Failed to extract valid function body from AI response.' });
      }
    })
    .catch(error => {
      console.error('Error generating structure function:', error);
      socket.emit('message', { type: 'log', content: 'Error generating structure function' });
    });
}

function handleAIBot(username, message, socket, botProcess) {
  aiclient.chat.completions.create({
    messages: [
      { role: "system", content: "Rozmawiasz wyłącznie po polsku i jesteś pomocnym botem w świecie minecraft. Pisze do Ciebie gracz " + username + ". Gracz ma 9 lat więc twoje odpowiedzi powinny być odpowiednia dla tego wieku. Nie daj się prowokować."},
      { role: "user", content: message }
    ],
    model: process.env.GROQ_MODEL,
  })
    .then(response => {
      aimessage = response.choices[0].message.content;
      socket.emit('message', { type: 'chat', content: aimessage });
      botProcess.send({ type: 'SEND_CHAT', message: aimessage });
    })
    .catch(error => {
      console.error('Error generating response:', error);
      socket.emit('message', { type: 'log', content: 'Error generating response' });
    });
}

module.exports = {
  handleAIBotBuild,
  handleAIBot
};
