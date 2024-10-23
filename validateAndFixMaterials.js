const fs = require('fs');
const minecraftData = require('minecraft-data');

// Initialize minecraft-data for the latest version
const mcData = minecraftData('1.20.6');

// Initialize an empty array for storing color names
let COLORS = [];

// Check if mcData.itemsById is not undefined or null
if (mcData.itemsById) {
    const mcDataItems = Object.values(mcData.itemsByName);
    mcDataItems.forEach(item => {
        if (item.name.toLowerCase().includes('dye')) {
            const dyeName = item.name.replace('dye', '');
            COLORS.push(dyeName);
        }
    });
} else {
    console.log('Items data is not available');
}

// Check if mcData.blocksByName is not undefined or null
if (mcData.blocksByName) {
    const mcDataBlocks = Object.values(mcData.blocksByName);
    mcDataBlocks.forEach(block => {
        if (block.name.includes('terracotta')) {
            let blockName = block.name.replace('terracotta', '').replaceAll('_', ' ').trim();
            COLORS.push(blockName);
        }

        if (block.name.includes('stained')) {
            const blockName = block.name.replace('stained_', '')
            .replace('_clay', '').replace('_glass', '').replace('_terracotta', '')
            .replace('_stone_bricks', '')
            .replace('glazed_', '')
            .replace('pane', '')
            .replaceAll('_', ' ').trim();
            COLORS.push(blockName);
        }
    });
} else {
    console.log('Blocks data is not available');
}

COLORS = [...new Set(COLORS)] // Get unique values
COLORS = COLORS.sort(); // Sort the color names

// Read the JSON file
const materialsData = JSON.parse(fs.readFileSync('blueprints/enriched_unique_materials.json', 'utf8'));

/**
 * Clean up a name by removing parenthetical content and trimming
 * @param {string} name - The name to clean
 * @returns {string} The cleaned name
 */
function cleanName(name) {
    // Take everything before the first parenthesis and trim
    return name.split('(')[0].trim().toLowerCase();
}

/**
 * Extract color from a name that contains "Stained Clay"
 * @param {string} name - The name to extract color from
 * @returns {string|null} The color found or null
 */
function extractColorFromStainedClay(name) {
    const cleanedName = cleanName(name);
    if (cleanedName.includes('stained clay')) {
        // The color should be before "stained clay"
        const beforeStainedClay = cleanedName.split('stained clay')[0].trim();
        return COLORS.find(color =>
            beforeStainedClay === color.replace('_', ' ') ||
            beforeStainedClay === color
        );
    }
    return null;
}

/**
 * Handle special cases of renamed blocks
 * @param {string} name - The material name
 * @param {string} fixMe - The fix_me value if exists
 * @returns {string|null} The new block name or null if no special case matches
 */
function handleRenamedBlocks(name, fixMe = '') {
    // First try to extract color from the name if it contains "Stained Clay"
    const color = extractColorFromStainedClay(name);
    if (color) {
        const newBlockName = `${color}_terracotta`;
        if (mcData.blocksByName[newBlockName]) {
            return newBlockName;
        }
    }

    // If that didn't work and we have a fix_me value containing _stained_ or _hardened_clay
    if (fixMe) {
        const fixMeLower = fixMe.toLowerCase();
        if (fixMeLower.includes('_stained_') || fixMeLower.includes('_hardened_clay')) {
            // Extract color from fix_me
            const colorMatch = COLORS.find(color => fixMeLower.includes(color));
            if (colorMatch) {
                const newBlockName = `${colorMatch}_terracotta`;
                if (mcData.blocksByName[newBlockName]) {
                    return newBlockName;
                }
            }
        }
    }

    return null;
}

/**
 * Find a matching block name using the cleaned material name
 * @param {string} name - The material name to search with
 * @param {string} fixMe - The fix_me value if exists
 * @returns {string|null} The matching block name or null if not found
 */
function findBlockByName(name, fixMe = '') {
    // Check for renamed blocks first using both name and fix_me
    const renamedBlock = handleRenamedBlocks(name, fixMe);
    if (renamedBlock) {
        return renamedBlock;
    }

    const cleanedName = cleanName(name);

    // Try direct match first
    for (const block in mcData.blocksByName) {
        if (block.replace('_', ' ') === cleanedName) {
            return block;
        }
    }

    // Try partial match
    for (const block in mcData.blocksByName) {
        const blockName = block.replace(/_/g, ' ');
        if (cleanedName.includes(blockName) || blockName.includes(cleanedName)) {
            return block;
        }
    }

    return null;
}

/**
 * Validate and fix a material entry against Minecraft block data.
 * @param {Object} entry - Material entry to validate.
 * @param {string} entry.name - Material name.
 * @param {string} entry.args - Material arguments (block name and states).
 * @param {string} [entry.fix_me] - Original args value that needs fixing.
 * @returns {Object} Result object containing validation status and fixes if needed.
 */
function validateAndFixMaterial(entry) {
    const { name, args, fix_me } = entry;

    // If entry has both args and fix_me, it means it still needs fixing
    // Use fix_me as the source for validation
    const sourceArgs = (fix_me && args) ? fix_me : args;
    const [blockName, ...states] = sourceArgs.replace('minecraft:', '').split('[');
    let needsFix = Boolean(fix_me && args); // If both exist, it needs fixing
    let fixedArgs = '';
    let properBlockName = blockName;

    // Validate block name
    const block = mcData.blocksByName[blockName];
    if (!block) {
        // Try to find block using both name and fix_me fields
        const matchedBlock = findBlockByName(name, fix_me);
        if (matchedBlock) {
            properBlockName = matchedBlock;
            needsFix = true;
        } else {
            // If still not found, try the original method
            properBlockName = getProperBlockName(blockName);
            if (properBlockName === `No similar block found for ${blockName}`) {
                return {
                    error: `Invalid block name: ${blockName}, couldn't find match using name: ${name}`,
                    properName: properBlockName
                };
            }
            needsFix = true;
        }
    }

    // Use the correct block reference
    const validBlock = block || mcData.blocksByName[properBlockName];
    if (!validBlock) {
        return {
            error: `Failed to get block data for ${properBlockName}`,
            properName: properBlockName
        };
    }

    // Start building the fixed args
    fixedArgs = `minecraft:${properBlockName}`;

    // Validate and fix states
    if (states.length > 0) {
        const statesStr = states[0].replace(']', '');
        const statesPairs = statesStr.split(',');
        const validStates = [];

        // Only process states if the block has states defined
        if (validBlock.states && validBlock.states.length > 0) {
            for (const pair of statesPairs) {
                const [key, value] = pair.split('=');
                const property = validBlock.states.find(s => s.name === key);

                if (!property) {
                    needsFix = true;
                    continue; // Skip invalid state
                }

                let fixedValue = value;
                // Validate and fix property values
                if (property.type === 'bool' || (property.values && property.values.length === 2 && property.values.includes('true') && property.values.includes('false'))) {
                    if (value !== 'true' && value !== 'false') {
                        fixedValue = 'false';
                        needsFix = true;
                    }
                } else if (property.type === 'enum' || (property.values && Array.isArray(property.values))) {
                    if (!property.values.includes(value)) {
                        fixedValue = property.values[0];
                        needsFix = true;
                    }
                } else if (property.type === 'int' || property.name.endsWith('_bit')) {
                    const intValue = parseInt(value, 10);
                    if (isNaN(intValue) || intValue < 0 || (property.name.endsWith('_bit') && intValue > 7)) {
                        fixedValue = '0';
                        needsFix = true;
                    }
                }
                validStates.push(`${key}=${fixedValue}`);
            }

            if (validStates.length > 0) {
                fixedArgs += `[${validStates.join(',')}]`;
            }
        } else {
            // If the block doesn't support states but states were provided, mark for fixing
            needsFix = true;
        }
    }

    if (needsFix) {
        return {
            fixed: true,
            originalArgs: fix_me || sourceArgs, // Keep the original fix_me value if it exists
            fixedArgs: fixedArgs
        };
    }

    return { fixed: false };
}

function getProperBlockName(blockName) {
    for (const block in mcData.blocksByName) {
        if (blockName.toLowerCase().includes(block.toLowerCase())) {
            return block;
        }
    }
    return `No similar block found for ${blockName}`;
}

let validCount = 0;
let fixedCount = 0;
let invalidCount = 0;

// Process and fix materials
for (const entry of materialsData) {
    const result = validateAndFixMaterial(entry);

    if (result.fixed) {
        entry.fix_me = result.originalArgs;
        entry.args = result.fixedArgs;
        fixedCount++;
        console.log(`Fixed entry:`);
        console.log(`Name: ${entry.name}`);
        console.log(`Original args: ${result.originalArgs}`);
        console.log(`Fixed args: ${result.fixedArgs}`);
        console.log('---');
    } else if (result.error) {
        invalidCount++;
        console.log(`Invalid entry:`);
        console.log(`Name: ${entry.name}`);
        console.log(`Args: ${entry.args}`);
        console.log(`Error: ${result.error}`);
        if (result.properName) {
            console.log(`Proper block name: ${result.properName}`);
        }
        console.log('---');
    } else {
        validCount++;
    }
}

// Write the updated data back to the file
fs.writeFileSync('blueprints/enriched_unique_materials.json', JSON.stringify(materialsData, null, 2));

console.log(`Validation complete.`);
console.log(`Valid entries: ${validCount}`);
console.log(`Fixed entries: ${fixedCount}`);
console.log(`Invalid entries: ${invalidCount}`);
