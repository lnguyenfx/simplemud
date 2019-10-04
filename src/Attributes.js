'use strict';

const Enum = require('enum');

const Attribute = new Enum({
  'STRENGTH'        : 0,
  'HEALTH'          : 1,
  'AGILITY'         : 2,
  'MAXHITPOINTS'    : 3,
  'ACCURACY'        : 4,
  'DODGING'         : 5,
  'STRIKEDAMAGE'    : 6,
  'DAMAGEABSORB'    : 7,
  'HPREGEN'         : 8
});

const ItemType = new Enum({'WEAPON': 0, 'ARMOR': 1, 'HEALING': 2});

const PlayerRank = new Enum({'REGULAR': 0, 'GOD': 1, 'ADMIN': 2});

const RoomType = new Enum({'PLAINROOM': 0, 'TRAININGROOM': 1, 'STORE': 2});

const Direction = new Enum({
  'NORTH'   : 0,
  'EAST'    : 1,
  'SOUTH'   : 2,
  'WEST'    : 3,
});

module.exports = {
  Attribute,
  ItemType,
  PlayerRank,
  RoomType,
  Direction
};
