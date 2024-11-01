const BUILDING_DIR = '../blueprints/blueprints/';
const fs = require('fs');
const path = require('path');

const enrichedUniqueMaterials = require('../blueprints/enriched_unique_materials.json');
const buildings_list = require('../blueprints/buildings.json');

function find_block_by_id(id) {
    return enrichedUniqueMaterials.find((material) => material.mat_id == id).args;
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
// Create distinct categories set once when module loads
const categories = Array.from(
  new Set(
    buildings_list.map(building => JSON.stringify({
    category_id: building.category_id,
    category_pl: building.category_pl
    }))
  )
).map(category => JSON.parse(category))
.sort((a, b) => a.category_id - b.category_id);

/**
 * 
 * @param {import('mineflayer').Bot} bot 
 * @param {*} structure 
 */
async function createBuilding(bot, building_id) {

    //turn north
    // await bot.lookAt(0, bot.entity.position.y, 1);

    structure = undefined;
    try {
        structure = require(BUILDING_DIR + 'myRenderObject_' + building_id + '.json');
    } catch (err) {
        console.error(`Error loading building structure for ID ${building_id}:`, err);
        bot.chat("Nie ma budynku o takim numerze - sprobuj jeszcze raz z innym numerem.")
        return; // exit the function if load fails
    }

    //find max z and x
    let max_z = -1, max_x = -1, max_y = -1;
    for (let y of Object.keys(structure)) {
        for (let z of Object.keys(structure[y])) {
            for (let x of Object.keys(structure[y][z])) {
                x_value = Number(x);
                if (max_x < x_value) {
                    max_x = x_value;
                }
                z_value = Number(z);
                if (max_z < z_value) {
                    max_z = z_value;
                }
                y_value = Number(y);
                if (max_y < y_value) {
                    max_y = y_value;
                }
            }
        }
    }
    width = max_x + 1;
    length = max_z + 1;
    x_param = Math.ceil(width / 2);
    z_param = Math.ceil(length / 2);
    bot.chat(`/fill ~-${x_param} ~ ~1 ~${x_param} ~${max_y} ~${max_z} air`);
    await sleep(1000)

    console.log(`x_param: ${x_param} z_param: ${z_param}`);

    const startX = Math.floor(bot.entity.position.x) - x_param;//- x_param;
    const startY = Math.floor(bot.entity.position.y) - 1;
    const startZ = Math.floor(bot.entity.position.z);// + z_param;

    // console.log('bot position: ', startX, startY, startZ);

    for (let y of Object.keys(structure)) {
        for (let z of Object.keys(structure[y])) {
            for (let x of Object.keys(structure[y][z])) {
                const block = structure[y][z][x];
                // console.log(block);
                const material = find_block_by_id(block.mat_id);

                if (material) {
                    try {
                        // cmd = `\/setblock ${startX + Number(block.x)} ${startY + Number(block.y)} ${startZ + Number(block.z)} ${material}`;
                        //sleep for 100ms to avoid spamming the server
                        await sleep(10);
                        cmd = "/setblock " + `${startX + Number(block.x)} ${startY + Number(block.y)} ${startZ + Number(block.z)} ${material}`;
                        console.log(cmd)
                        bot.chat(cmd);
                    } catch (err) {
                        console.error(`Error placing block at x:${block.x}, y:${block.y}, z:${block.z}:`, err);
                    }
                }
            }
        }
    }
}

/**
 * Test function to create each material from enrichedUniqueMaterials
 * @param {import('mineflayer').Bot} bot 
 */
async function materials_test(bot) {
    const startX = Math.floor(bot.entity.position.x) + 1;
    const startY = Math.floor(bot.entity.position.y);
    const startZ = Math.floor(bot.entity.position.z);

    for (let i = 0; i < enrichedUniqueMaterials.length; i++) {
        // Clean the area in front of the bot
        bot.chat(`/fill ${startX} ${startY} ${startZ} ${startX + 5} ${startY + 5} ${startZ + 5} air`);
        await sleep(10);

        const material = enrichedUniqueMaterials[i];
        try {
            const cmd = `/setblock ${startX} ${startY} ${startZ} ${material.args}`;
            console.log(`Testing material: ${material.args}`);
            bot.chat(cmd);
            await sleep(10);
        } catch (err) {
            console.error(`Error placing material ${material.args}:`, err);
        }
    }
    console.log("Materials test completed");
}

function list_categories(bot) {
    bot.chat('Kategorie dostępnych budynków (id i nazwa):');
    categories.forEach(category => {
        msg = `${category.category_id} ${category.category_pl}`;
        console.log(msg);
        bot.chat(msg);
    });
}

/**
 * Returns a random item from an array.
 *
 * @param {array} array - The input array.
 * @returns {object} A random item from the input array.
 */
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function list_buildings(bot, message) {
    console.log('List buildings was called with message', message);
    command = message.split(' ').slice(1).join(' ');
    // possible messages "aibot baza" - this just returns a hardcoded message
    if (command === 'aibot baza') {
        bot.chat(`Cześć! Mam bazę ${buildings_list.length} struktur, które potrafię dla Ciebie zbudować.`);
        bot.chat('Napisz "aibot baza k" żeby dostać listę kategorii i ich numberu');
        bot.chat('Napisz "aibot baza l" żeby dostać opis losowego budynku');
        bot.chat('Napisz "aibot baza k_id l" żeby dostać opis losowego budynku w kategorii gdzie k_id to numer kategorii. Na przykład wpisz "aibot baza 2 l"');
        bot.chat('Napisz "aibot baza numer" żeby dostać opis budynku o danym numerze');
        bot.chat('Napisz "aibot baza s fraza" żeby znaleźć strukturę gdzie nazwa albo opis zawiera szukaną frazę');
        return;
    }
    if (command === 'aibot baza k') {
        list_categories(bot);
        return;
    }
    if (command === 'aibot baza l') {
        //get random object from buildings_list and return it's description
        const building = getRandomItem(buildings_list);
        describeBuilding(bot, building);
        return;
    }
    command_parts = command.split(' ');
    if (command.includes('aibot baza') && command_parts.length === 4 && command_parts[2] !== '' && !isNaN(command_parts[2])) {
        const category_id = Number(command_parts[2]);
        const category = categories.find(category => category.category_id === category_id);
        if (category === undefined) {
            bot.chat('Nie ma takiej kategorii!');
            list_categories(bot);
        } else {
            const filteredBuildings = buildings_list.filter(building => building.category_id === category_id);
            const building = getRandomItem(filteredBuildings);
            describeBuilding(bot, building);
        }
        return;
    }
    if (command.startsWith('aibot baza ') && !isNaN(command_parts[2])) {
        const building = find_building_by_id(command_parts[2]);
        if (building === undefined) {
            bot.chat('Nie ma takiego budynku! Podałeś zły numer.');
        }else{
            describeBuilding(bot, building);
        }
        return;
    }

    if (command.startsWith('aibot baza s ')) {
        const search_term = command_parts.slice(3).join(' ').trim();
        const buildings = find_buildings_by_term(search_term);
        if (buildings === undefined || buildings.length === 0) {
            bot.chat('Nie mogę znaleźć takiego budynku. Spróbuj poszukać czegoś innego.');
        }else{
            if (buildings.length > 10){
                bot.chat('Za dużo budynków pasuje do Twojego wyszukiwania. Pokazuje tylko 5 pierwszych wyników');
            }
            for (let building of buildings.slice(0, 5)) {
                describeBuilding(bot, building);
            }
            return;
        }    
    }
    bot.chat('Nie rozumiem Twojej wiadomości :(');
}

function find_buildings_by_term(term) {
    return buildings_list.filter(building => 
        building.title_pl.includes(term) || 
        building.desc_pl.includes(term)
    );
}

function find_building_by_id(id) {
    for (let building of buildings_list) {
        let building_number = building.blueprint.match(/\d+/)[0];
        if (building_number === id) {
            return building;
        }
    }
}

function describeBuilding(bot, building) {
    bot.chat(`Nazwa: ${building.title_pl}`);
    bot.chat(`Opis: ${building.desc_pl}`);
    bot.chat(`Kategoria: ${building.category_id} - ${building.category_pl}`);
    bot.chat(`Liczba bloków: ${building.blockCount}`);
    // Extract the building number from the blueprint field
    // Example building.blueprint value: "myRenderObject_7123.json"
    building_number = building.blueprint.match(/\d+/)[0];
    bot.chat(`Number struktury: ${building_number}`);
    bot.chat(`Żeby ją zbudować wpisz: aibot buduj ${building_number}`);
}

module.exports = {
    createBuilding,
    materials_test,
    list_buildings
};


