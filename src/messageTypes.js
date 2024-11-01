/**
 * Enum for message types used in inter-process communication
 * @readonly
 * @enum {string}
 */
const MessageTypes = Object.freeze({
    SEND_CHAT: 'SEND_CHAT',
    COMMAND: 'COMMAND',
    CREATE_STRUCTURE: 'CREATE_STRUCTURE',
    CREATE_BUILDING: 'CREATE_BUILDING',
    TEST_MATERIALS: 'TEST_MATERIALS',
    LOG: 'LOG',
    CHAT_MESSAGE: 'CHAT_MESSAGE',
    BOT_SPAWNED: 'BOT_SPAWNED',
    BOT_DISCONNECTED: 'BOT_DISCONNECTED'
});

module.exports = MessageTypes;
