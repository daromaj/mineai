const fs = require('fs');
const minecraftData = require('minecraft-data');

// Initialize minecraft-data for the latest version
const mcData = minecraftData('1.20.6');

// Read the JSON file
const materialsData = JSON.parse(fs.readFileSync('blueprints/enriched_unique_materials.json', 'utf8'));

/**
 * Validate a material entry against Minecraft block data.
 * @param {Object} entry - Material entry to validate.
 * @param {string} entry.name - Material name.
 * @param {string} entry.args - Material arguments (block name and states).
 * @returns {Object|null} Error object if validation fails, null otherwise.
 */
function validateMaterial(entry) {
    const { name, args } = entry;
    const [blockName, ...states] = args.replace('minecraft:', '').split('[');
    
    // Validate block name
    const block = mcData.blocksByName[blockName];
    if (!block) {
        return { error: `Invalid block name: ${blockName}`, properName: getProperBlockName(blockName) };
    }

    // Validate states
    if (states.length > 0) {
        const statesStr = states[0].replace(']', '');
        const statesPairs = statesStr.split(',');
        for (const pair of statesPairs) {
            const [key, value] = pair.split('=');
            const property = block.states.find(s => s.name === key);
            if (!property) {
                return { error: `Invalid state key: ${key} for block ${blockName}`, properName: blockName, properStates: getProperStates(block.states) };
            }

            // Check property type and validate accordingly
            if (property.type === 'bool' || (property.values && property.values.length === 2 && property.values.includes('true') && property.values.includes('false'))) {
                // Boolean property
                if (value !== 'true' && value !== 'false') {
                    return { error: `Invalid boolean value: ${value} for state ${key} of block ${blockName}. Expected 'true' or 'false'.`, properName: blockName, properStates: getProperStates(block.states) };
                }
            } else if (property.type === 'enum' || (property.values && Array.isArray(property.values))) {
                // Enum property
                if (!property.values.includes(value)) {
                    return { error: `Invalid state value: ${value} for state ${key} of block ${blockName}. Expected one of: ${property.values.join(', ')}.`, properName: blockName, properStates: getProperStates(block.states) };
                }
            } else if (property.type === 'int' || property.name.endsWith('_bit')) {
                // Integer or bit property
                const intValue = parseInt(value, 10);
                if (isNaN(intValue) || intValue < 0 || (property.name.endsWith('_bit') && intValue > 7)) {
                    return { error: `Invalid ${property.name.endsWith('_bit') ? 'bit' : 'integer'} value: ${value} for state ${key} of block ${blockName}. Expected ${property.name.endsWith('_bit') ? 'a value between 0 and 7' : 'an integer'}.`, properName: blockName, properStates: getProperStates(block.states) };
                }
            } else {
                return { error: `Unknown property type for state ${key} of block ${blockName}`, properName: blockName, properStates: getProperStates(block.states) };
            }
        }
    }

    return null; // No errors
}

function getProperBlockName(blockName) {
    for (const block in mcData.blocksByName) {
        if (blockName.toLowerCase().includes(block.toLowerCase())) {
            return block;
        }
    }
    return `No similar block found for ${blockName}`;
}

function getProperStates(blockStates) {
    return blockStates.map(state => {
        if (state.type === 'bool') {
            return `${state.name}: true, false`;
        } else if (state.type === 'enum' || (state.values && Array.isArray(state.values))) {
            return `${state.name}: ${state.values.join(', ')}`;
        } else if (state.type === 'int') {
            return `${state.name}: integer value`;
        } else if (state.name.endsWith('_bit')) {
            return `${state.name}: bit values 0-7`;
        } else {
            return `${state.name}: unknown type`;
        }
    }).join(', ');
}

let validCount = 0;
let invalidCount = 0;
for (const entry of materialsData) {
    const validationResult = validateMaterial(entry);
    if (validationResult === null) {
        validCount++;
    } else {
        invalidCount++;
        console.log(`Name: ${entry.name}`);
        console.log(`Args: ${entry.args}`);
        console.log(`Error: ${validationResult.error}`);
        if (validationResult.properName) {
            console.log(`Proper block name: ${validationResult.properName}`);
        }
        if (validationResult.properStates) {
            console.log(`Available states: ${validationResult.properStates}`);
        }
        console.log('---');
        break; // Stop on first error
    }
}

console.log(`Validation stopped on first error.`);
console.log(`Valid entries: ${validCount}`);
console.log(`Invalid entries: ${invalidCount}`);
