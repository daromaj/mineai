// buildings.test.js
const path = require('path');
const fs = require('fs');
const  createBuilding  = require('./buildings');

jest.mock('mineflayer');
jest.mock('fs');

describe('createBuilding function', () => {
  let bot;
  let structure;

  beforeEach(() => {
    bot = {
      chat: (message)=> {console.log('chat: ', message)},
      entity: {
        position: {
          x: 0,
          y: 0,
          z: 0,
        },
      },
    };

    structure = {
      '0': {
        '0': {
          '-1': {
            mat_id: '18',
          },
        },
      },
    };

    fs.readFileSync.mockReturnValue(JSON.stringify(structure));
  });

  it('should create a building', async () => {
    await createBuilding(bot, 470);

  });

  it('should handle error when placing block', async () => {
    bot.chat.mockRejectedValueOnce(new Error('Mocked error'));

    await createBuilding(bot, 'myRenderObject_1');

    expect(bot.chat).toHaveBeenCalledTimes(1);
    expect(bot.chat).toHaveBeenCalledWith('/setblock 1 0 1 cobblestone');
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
