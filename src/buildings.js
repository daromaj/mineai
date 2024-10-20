const BUILDING_DIR = '../blueprints/blueprints/';
const fs = require('fs');
const path = require('path');


const enrichedUniqueMaterials = require('../blueprints/enriched_unique_materials.json');

function find_block_by_id(id) {
    return enrichedUniqueMaterials.find((material) => material.mat_id == id).args;
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

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
                if (max_y < y_value){
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

module.exports = {
    createBuilding,
    materials_test
};
