const fs = require('fs');
const readline = require('readline');
const { OpenAI } = require('openai');
require('dotenv').config({ path: `.env.local`, override: true });

const client = new OpenAI({
    // apiKey: process.env.GROQ_API_KEY,
    // apiKey: process.env.OPENROUTER_API_KEY,
    // baseURL: "https://api.groq.com/openai/v1"
    // baseURL: "http://localhost:11434/v1"
    // baseURL: "https://openrouter.ai/api/v1"
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: "https://api.cerebras.ai/v1"
});


// Path to input and output files
const inputFilePath = 'unique_materials.json';  // Input file
const outputFilePath = 'enriched_unique_materials.json';  // Output file

async function getMinecraftArgs(materialName) {
    const prompt = `You are a hacker and expert in Minecraft. Convert the following material name and its state description into a format accepted by Minecraft Java Edition's in game /setblock command:\n"${materialName}". 
    DO NOT provide any explanations or extra information.
    Respond using format <block>[state] or just <block> if state is not needed.`;

    const args = await askAI(prompt);
    console.log(`args: ${args}`);
    return args;
}

async function getAITranslation(sentence) {
    const prompt = `You are an expert polyglot. Translate following text to Polish:\n"${sentence}". 
    DO NOT provide any explanations or extra information.
    Respond directly with translation.`;

    const args = await askAI(prompt);
    console.log(`translation: ${args}`);
    return args;
}

async function askAI(prompt) {
    const response = await client.chat.completions.create({
        // model: "gemma2:27b",
        // model: "llama3.2",
        // model: "microsoft/phi-3-medium-128k-instruct:free",
        // model: "liquid/lfm-40b:free",
        // model: "llama-3.1-70b-versatile",
        model: "llama3.1-70b",
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

    const args = response.choices[0].message.content.trim();
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
// processMaterials();
const buildings = require('./pages/data.json');

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function translateBuildings() {
    const outputFilePath = './data_full.json';  // Output file
    let existingDataMap = new Map();

    // Read existing data from the output file
    try {
        const fileContent = fs.readFileSync(outputFilePath, 'utf8');
        const existingData = JSON.parse(fileContent);
        existingDataMap = new Map(existingData.map(building => [building.title, building]));
    } catch (error) {
        console.log('No existing file found or error reading file. Starting fresh.');
    }

    // Filter buildings that need translation
    const buildingsToTranslate = buildings.filter(building => {
        const existingBuilding = existingDataMap.get(building.title);
        return !existingBuilding || existingBuilding.title_pl === "Error processing" || existingBuilding.desc_pl === "Error processing";
    });

    let updatedCount = 0;
    const batchSize = 10; // Write to file every 10 translations

    for (const building of buildingsToTranslate) {
        console.log(`Processing: ${building.title}`);

        try {
            const title_pl = await getAITranslation(building.title);
            await sleep(1050);
            const desc_pl = await getAITranslation(building.description);
            await sleep(1050);

            existingDataMap.set(building.title, {
                ...building,
                title_pl,
                desc_pl
            });

            updatedCount++;

            // Write updated data to file after each batch
            if (updatedCount % batchSize === 0) {
                const updatedData = Array.from(existingDataMap.values());
                fs.writeFileSync(outputFilePath, JSON.stringify(updatedData, null, 2));
                console.log(`Batch of ${batchSize} translations saved.`);
            }
        } catch (error) {
            console.error(`Error processing ${building.title}:`, error);
            existingDataMap.set(building.title, {
                ...building,
                title_pl: "Error processing",
                desc_pl: "Error processing"
            });
        }
    }

    // Final write for any remaining updates
    if (updatedCount > 0) {
        const updatedData = Array.from(existingDataMap.values());
        fs.writeFileSync(outputFilePath, JSON.stringify(updatedData, null, 2));
    }

    console.log(`Enriched buildings saved to ${outputFilePath}`);
}

translateBuildings();
