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
    bot.chat("/fill ~-10 ~ ~10 ~18 ~18 ~18 air");
    await sleep(1000)
    const structure = require(BUILDING_DIR + 'myRenderObject_' + building_id + '.json');

    const startX = Math.floor(bot.entity.position.x) + 1;
    const startY = Math.floor(bot.entity.position.y) - 1 ;
    const startZ = Math.floor(bot.entity.position.z);

    console.log('bot position: ', startX, startY, startZ);

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

module.exports = createBuilding;

