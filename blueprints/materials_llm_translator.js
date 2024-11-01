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

// Modified categories array
const categories = [
    { id: 1, name: 'military-buildings', name_pl: 'budynki wojskowe' },
    { id: 2, name: 'other-193', name_pl: 'inne - 193' },
    { id: 3, name: 'towers', name_pl: 'wieże' },
    { id: 4, name: 'miscellaneous-162', name_pl: 'różne - 162' },
    { id: 5, name: 'medieval-houses', name_pl: 'domki wiejskie' },
    { id: 6, name: 'farm-buildings', name_pl: 'gospodarstwa rolne' },
    { id: 7, name: 'wooden-houses', name_pl: 'drewniane domy' },
    { id: 8, name: 'modern-houses', name_pl: 'nowoczesne domy' },
    { id: 9, name: 'churches', name_pl: 'kościoły' },
    { id: 10, name: 'medieval-castles', name_pl: 'średniowieczne zamki' },
    { id: 11, name: 'stone-houses', name_pl: 'murowane domy' },
    { id: 12, name: 'tree-houses', name_pl: 'domy na drzewie' },
    { id: 13, name: 'cartoons', name_pl: 'animacje' },
    { id: 14, name: 'other-190', name_pl: 'inne - 190' },
    { id: 15, name: 'ruins', name_pl: 'ruiny' },
    { id: 16, name: 'brick-houses', name_pl: 'ceglane domy' },
    { id: 17, name: 'starter-houses', name_pl: 'domy startowe' },
    { id: 18, name: 'survival-houses', name_pl: 'domy survivalowe' },
    { id: 19, name: 'cafes', name_pl: 'kawiarnie' },
    { id: 20, name: 'castles', name_pl: 'zamki' },
    { id: 21, name: 'stadiums', name_pl: 'stadiony' },
    { id: 22, name: 'hotels', name_pl: 'hotele' },
    { id: 23, name: 'restaurants', name_pl: 'restauracje' },
    { id: 24, name: 'sightseeing-buildings', name_pl: 'budynki turystyczne' },
    { id: 25, name: 'service-stations', name_pl: 'stacje obsługi' },
    { id: 26, name: 'buildings', name_pl: 'budynki' },
    { id: 27, name: 'malls', name_pl: 'centra handlowe' },
    { id: 28, name: 'skyscrapers', name_pl: 'drapacze chmur' },
    { id: 29, name: 'quartz-houses', name_pl: 'kwarcowe domy' },
    { id: 30, name: 'video-games', name_pl: 'gry wideo' },
    { id: 31, name: 'movies', name_pl: 'filmy' }
];

// Modified traverseBuildings function
async function traverseBuildings() {
    const inputFilePath = './blueprints/pages/data_full_local.json';  // Input file
    const outputFilePath = './enriched_data.json';  // Output file

    try {
        const fileContent = fs.readFileSync(inputFilePath, 'utf8');
        const data = JSON.parse(fileContent);

        const enrichBuildings = async () => {
            const enrichedBuildings = [];
            for (const building of data) {
                const parsedUrl = new URL(building.href);
                    const pathParts = parsedUrl.pathname.split('/');
                const lastNamePart = pathParts[pathParts.length - 1];
                const category = categories.find(c => c.name === lastNamePart);

                if (category) {
                    building.category_id = category.id;
                    building.category_name = category.name;
                    building.category_pl = category.name_pl;
                } else {
                    building.category_id = 'Unknown';
                    building.category_name = 'Unknown';
                    building.category_pl = 'Nieznany';
            }

                enrichedBuildings.push(building);
        }

            return enrichedBuildings;
        };

        const enrichedData = await enrichBuildings();

        fs.writeFileSync(outputFilePath, JSON.stringify(enrichedData, null, 2));
        console.log(`Enriched data saved to ${outputFilePath}`);
    } catch (error) {
        console.error(`Error reading file:`, error);
    }
}

traverseBuildings();
