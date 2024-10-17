const fs = require('fs');
const readline = require('readline');
const { OpenAI } = require('openai');

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    // baseURL: "https://api.groq.com/openai/v1"
    baseURL: "http://localhost:11434/v1"
});

// Path to input and output files
const inputFilePath = 'unique_materials.json';  // Input file
const outputFilePath = 'enriched_unique_materials.json';  // Output file

// Function to call OpenAI and get the Minecraft block state args
async function getMinecraftArgs(materialName) {
    const prompt = `You are a hacker and expert in Minecrafr. Convert the following material name and its state description into a format accepted by Minecraft Java Edition's in game /setblock command:\n"${materialName}". 
    DO NOT provide any explanations or extra information.
    Respond using format <block>[state] or just <block> if state is not needed.`;

    // console.log(prompt);

    const response = await client.chat.completions.create({
        model: "gemma2:27b",
        messages: [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    });

    //   client.chat.completions.create({
    //     messages: [
    //       { role: "system", content: prompt },
    //       { role: "user", content: message }
    //     ],
    //     model: "llama-3.1-70b-versatile",
    //   })

    //   const response = await client.chat.completions.create({
    //     model: "gemma:2b",//process.env.GROQ_MODEL,
    //     prompt: prompt,
    //     max_tokens: 100,
    //     temperature: 0,
    //   });

    const args = response.choices[0].message.content.trim();
    console.log(`args: ${args}`);
    return args;
}

// Main function to process the input file row by row
async function processMaterials() {
    const rl = readline.createInterface({
        input: fs.createReadStream(inputFilePath),
        crlfDelay: Infinity,
    });

    const output = [];

    for await (const line of rl) {
        if (line.trim()) {
            const material = JSON.parse(line);
            console.log(`Processing: ${material.name}`);

            try {
                const args = await getMinecraftArgs(material.name);
                material.args = args;
                output.push(material);
            } catch (error) {
                console.error(`Error processing ${material.name}:`, error);
                material.args = "Error processing";
                output.push(material);
            }
        }
    }

    // Write the enriched materials to a new file
    fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2));
    console.log(`Enriched materials saved to ${outputFilePath}`);
}

processMaterials();
