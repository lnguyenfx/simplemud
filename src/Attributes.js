'use trict';

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

module.exports = {
  Attribute
};
