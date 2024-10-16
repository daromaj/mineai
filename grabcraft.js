// Import required modules
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const ProgressBar = require('progress');

// Create the directory if it doesn't exist
const directory = 'blueprints/pages';
if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
}

// Function to save HTML content to a file
async function savePage(pageNumber) {
    let url = `https://www.grabcraft.com/minecraft/buildings/pg/${pageNumber}`;
    if (pageNumber === 1) {
        url = 'https://www.grabcraft.com/minecraft/buildings';
    }

    const filePath = path.join(directory, `page-${pageNumber}.html`);

    if (fs.existsSync(filePath)) {
        console.log(`File ${filePath} already exists. Skipping download.`);
        return;
    }

    console.log(`Downloading page ${pageNumber} from ${url}`);

    try {
        const response = await axios.get(url);
        fs.writeFileSync(filePath, response.data);
        console.log(`Page ${pageNumber} saved as ${filePath}`);
        await extractAndSaveData(filePath, pageNumber);
    } catch (error) {
        console.error(`Failed to download page ${pageNumber}: ${error.message}`);
    }
}

// Function to extract and save data from a file
async function extractAndSaveData(filePath, pageNumber) {
    const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'));
    const data = [];

    $('.product-box').each((index, element) => {
        const title = $(element).find('.text-info h3.name a').text().trim();
        const href = $(element).find('.text-info h3.name a').attr('href');
        const description = $(element).find('.text-info .product-description').text().trim();
        const blockCount = $(element).find('.text-info .price .regular-price').text().trim().replace('<i class="fa fa-cubes"></i>&nbsp;Block count:&nbsp;', '').trim();

        data.push({
            title,
            href,
            description,
            blockCount,
            blueprint: ''
        });
    });

    const jsonData = JSON.stringify(data, null, 2);
    const jsonFilePath = path.join(directory, `data.json`);

    if (fs.existsSync(jsonFilePath)) {
        const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        const mergedData = [...existingData, ...JSON.parse(jsonData)];
        fs.writeFileSync(jsonFilePath, JSON.stringify(mergedData, null, 2));
    } else {
        fs.writeFileSync(jsonFilePath, jsonData);
    }
    console.log(`Data saved for page ${pageNumber}`);
}

// Function to clean up data
async function cleanData(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    data.forEach((entry) => {
        // Add root URL to href
        entry.href = `https://www.grabcraft.com${entry.href}`;

        // Extract block count from string
        const blockCount = entry.blockCount.match(/\d+/g);
        if (blockCount) {
            entry.blockCount = blockCount[0];
        }
    });

    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData);
    console.log('Data cleaned up!');
}

// Function to process data
async function processData(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const directory = path.join('blueprints', 'blueprints');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`Created directory: ${directory}`);
    }

    const bar = new ProgressBar('Processing data [:bar] :percent :etas', {
        complete: '█',
        incomplete: '░',
        width: 40,
        total: data.length
    });

    for (const entry of data) {
        try {
            const urlParts = entry.href.split('/');
            const filename = `${urlParts[urlParts.length - 2]}__${urlParts[urlParts.length - 1]}.html`;
            const htmlFilePath = path.join(directory, filename);

            if (!fs.existsSync(htmlFilePath)) {
                const response = await axios.get(entry.href);
                fs.writeFileSync(htmlFilePath, response.data);
                console.log(`Saved ${filename} to ${directory}`);
            }

            const $ = cheerio.load(fs.readFileSync(htmlFilePath, 'utf8'));
            const scriptTag = $('script[src*="myRenderObject"]');
            if (scriptTag.length > 0) {
                const src = scriptTag.attr('src');
                entry.blueprint = src;

                const filename = path.basename(src);
                const filepath = path.join(directory, filename);
                const response = await axios.get(src);
                fs.writeFileSync(filepath, response.data);
                console.log(`Saved ${filename} to ${directory}`);
            } else {
                console.log(`No script tag found for ${entry.title}`);
            }
        } catch (error) {
            console.error(`Failed to process ${entry.title}: ${error.message}`);
        }

        bar.tick(1);
    }

    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData);
    console.log('Data processed!');
}



// Download all pages
async function downloadPages() {
    const total = 236;
    const bar = new ProgressBar(`Downloading pages [:bar] :percent :etas`, {
        complete: '█',
        incomplete: '░',
        width: 40,
        total
    });

    for (let i = 1; i <= total; i++) {
        await savePage(i);
        bar.tick(1);
    }
}

// downloadPages();

const filePath = path.join(directory, `data.json`);
// cleanData(filePath);

processData(filePath);