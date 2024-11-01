// buildings.test.js
const path = require('path');
const fs = require('fs');
const { list_buildings } = require('./buildings');

jest.mock('mineflayer');
jest.mock('fs');

// Mock the buildings_list data
jest.mock('../blueprints/buildings.json', () => ([
  {
    "title": "Troll Watchtower",
    "href": "https://ROOT_URL/minecraft/troll-watchtower/military-buildings",
    "description": "A watchtower with a roof filled with hay bales! How adorable is that? Well not exactly adorable but a good idea actually. The Troll tower You see is not very tall, so even people who are afraid of heights can climb up there and keep an eye on their land. Plus it looks safe, steady and strong - what else do we need from a watchtower, right? Anyway if You like this tower here then blueprints are below and have fun :)",
    "blockCount": "336",
    "blueprint": "myRenderObject_7120.json",
    "blueprint_href": "https://ROOT_URL/js/RenderObject/myRenderObject_7120.js",
    "title_pl": "Brama pod starym trolliem",
    "desc_pl": "Torrzysko z dachem wypełnionym sianem. Jak przyjemne! Dziwne, ale dobre podejście. Twierdza trolla, szukąc paletki i wygląda tak, że jest safest i stabilna i silna. Przeznaczenie jest klarne - co innego możemy chcieli? Jeśli tu lubisz ten toryzko tak poniżej znajdziesz plansze i rozrywka :)",
    "category_id": 1,
    "category_name": "military-buildings",
    "category_pl": "budynki wojskowe"
  },
  {
    "title": "Troll Hut",
    "href": "https://ROOT_URL/minecraft/troll-hut/other-193",
    "description": "Now this here is a rather interesting building. Apparently it is for Trolls or is it just a name? I have heard a lot of weird names before. But the hut! Isn't it so colorful and pretty to look at? It feels more like a hut for a traveller and it would be pretty nice to live in there as well - if You go inside then there is plenty of free room actually and You can even add all kind of things there You need for a happy life. So if You like it then build the hut :)",
    "blockCount": "951",
    "blueprint": "myRenderObject_7124.json",
    "blueprint_href": "https://ROOT_URL/js/RenderObject/myRenderObject_7124.js",
    "title_pl": "Huta kozla",
    "desc_pl": "Niestety to tutaj stoi bardzo ciekawy budynek. Według ogólności mógłby on być domem Trolli, jednak nie pewni się tego chyba. Siedzieliśmy na wiele niepowodzonych nazw przed tymtem, ale taki dom! Niewiem jak go się doznaje, co może byś tu po prostu wyglądał w takim stylu żeby ulec w nim i być utożsamieniem z nim to byłoby źle. Ale, ponieważ jest taka duże poniżej drzwi jest kilka spratów z tego co mam na uwagę się można coś dodać bez problemu jeśli się coś podziała to po prostu by to nie trwało.",
    "category_id": 2,
    "category_name": "other-193",
    "category_pl": "inne - 193"
  },
  {
    "title": "Tauren Totem",
    "href": "https://ROOT_URL/minecraft/tauren-totem/towers",
    "description": "I have seen a Totem like this before ... in a scary movie actually. But this Totem here is believed to have a spiritual significance - maybe it has great powers that we could use. Totems can actually help us, if we help them of course. At the mean time tho, look at that Tauren Totem here. So colorful, detailed and interesting, it could be a bit scary at night but it is okay because it is a well known Totem!",
    "blockCount": "8004",
    "blueprint": "myRenderObject_7123.json",
    "blueprint_href": "https://ROOT_URL/js/RenderObject/myRenderObject_7123.js",
    "title_pl": "Klasyczne totem taurymu.",
    "desc_pl": "Mam zobaczyć totem na takich podobnoh przedmiotach przedtem ... w strasznej filmie w rzeczywnoci. Ale totem ten tu jest uwierzony w znaczeniu duchowym - niepewien jest, czy ma silne magiczne mocy, z ktorych mozemy korzystac. Totemy niezwykle mogly nam pomóc - ale tez na nich musimy pomiczeć, bedzie tak. Mianowicie az tymczasem szukajmy wacht tej ta urn totemu tut. Jest on bardzo kolorowy, szczegolony i zaskakujacy - może mu w nocy zdacac wygladac straszny, ale zwyczajnie jest to po prostu znanych totem.",
    "category_id": 3,
    "category_name": "towers",
    "category_pl": "wieże"
  }
]));

describe('list_buildings function', () => {
  let bot;

  beforeEach(() => {
    bot = {
      chat: jest.fn()
    };
  });

  it('should return help messages when called with "aibot baza"', () => {
    list_buildings(bot, 'aibot baza');

    expect(bot.chat).toHaveBeenCalledTimes(5);
    expect(bot.chat).toHaveBeenNthCalledWith(1, 'Cześć! Mam bazę X struktur, które potrafię dla Ciebie zbudować.');
    expect(bot.chat).toHaveBeenNthCalledWith(2, 'Napisz "aibot baza k" żeby dostać listę kategorii');
    expect(bot.chat).toHaveBeenNthCalledWith(3, 'Napisz "aibot baza l" żeby dostać opis losowego budynku');
    expect(bot.chat).toHaveBeenNthCalledWith(4, 'Napisz "aibot baza k_id l" żeby dostać opis losowego budynku w kategorii');
    expect(bot.chat).toHaveBeenNthCalledWith(5, 'Napisz "aibot baza numer" żeby dostać opis budynku o danym numerze');
  });

  it('should list categories when called with "aibot baza k"', () => {
    list_buildings(bot, 'aibot baza k');

    expect(bot.chat).toHaveBeenCalledTimes(4);
    expect(bot.chat).toHaveBeenNthCalledWith(1, 'Kategorie dostępnych budynków (id i nazwa):');
    expect(bot.chat).toHaveBeenNthCalledWith(2, '1 - budynki wojskowe');
    expect(bot.chat).toHaveBeenNthCalledWith(3, '2 - inne - 193');
    expect(bot.chat).toHaveBeenNthCalledWith(4, '3 - wieże');
  });
});

/* Disabled original tests
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
*/
