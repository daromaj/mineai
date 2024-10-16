const BUILDING_DIR = 'blueprints/blueprints';
const fs = require('fs');
const path = require('path');

/**
 * Creates a building with the given ID.
 * 
 * @param {import('mineflayer').Bot} bot - The bot instance.
 * @param {string} building_id - The ID of the building to create.
 * 
 * @returns {Promise<object>} A promise resolving to the created building.
 */
function createBuilding(bot, building_id) {
    // Construct the path to the building file
    const buildingFilePath = path.join(BUILDING_DIR, `myRenderObject_${building_id}.js`);

    // Check if the building file exists
    if (!fs.existsSync(buildingFilePath)) {
        throw new Error(`Building file not found: ${buildingFilePath}`);

    }

    myRenderObject = require(buildingFilePath);

    var z = Object.keys(myRenderObject)// x y

    for (var z of Object.keys(myRenderObject)) {
        for (var x of Object.keys(myRenderObject[z])) {
            for (var block of Object.keys(z[x])) {
                

/**
 * 
                "x": 16,
                "y": "1",
                "z": "3",
                "hex": "#000000",
                "rgb": [
                    0,
                    0,
                    0
                ],
                "name": "Stone Slab (Upper)",
 */
            }
        }
    }

}

module.exports(createBuilding);

async function buildStructure(bot, structure) {
    const materialMap = {
        "169": "stone_bricks",
        "90": "stone_brick_slab",
        "223": "cobblestone_wall",
        "172": "chiseled_stone_bricks",
        "485": "stone_brick_stairs",
        "486": "stone_brick_stairs",
        "487": "stone_brick_stairs",
        "484": "stone_brick_stairs"
    };

    const pos = bot.entity.position.floored();

    for (let y of Object.keys(structure)) {
        for (let z of Object.keys(structure[y])) {
            for (let x of Object.keys(structure[y][z])) {
                const block = structure[y][z][x];
                const material = materialMap[block.mat_id];

                if (material) {
                    const targetPos = pos.offset(block.x, block.y, block.z);
                    try {
                        await bot.placeBlock(bot.blockAt(targetPos.offset(0, -1, 0)), bot.entity.position.direction);
                    } catch (err) {
                        console.error(`Error placing block at x:${block.x}, y:${block.y}, z:${block.z}:`, err);
                    }
                }
            }
        }
    }
}