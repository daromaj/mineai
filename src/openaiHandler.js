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
      botProcess.send({ type: 'TEST_MATERIALS' });
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
    systemPrompt = `You are an AI assistant that generates JavaScript functions for creating structures in Minecraft using the Mineflayer library. The function should accept a 'bot' parameter and use 'bot.chat' to send setblock commands. Create a function that builds a structure based on the following prompt: "${prompt}". The prompt is in Polish language. The function should be named 'createStructure'. It should start creating the structure at bot.entity.position. use Math.floor for calculating blocks placement - the need integer value. Respond ONLY with the code for createStructure function.`;
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
          botProcess.send({ type: 'CREATE_STRUCTURE', functionBody: functionBody });
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
      { role: "system", content: "Rozmawiasz wyłącznie po polsku i jesteś pomocnym botem w świecie minecraft. Pisze do Ciebie gracz " + username },
      { role: "user", content: message }
    ],
    model: "llama-3.1-70b-versatile",
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
