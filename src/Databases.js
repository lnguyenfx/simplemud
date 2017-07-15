'use strict';
const path = require('path');
const ItemDatabase = require(path.join(__dirname, '..', 'src', 'ItemDatabase'));
const PlayerDatabase = require(path.join(__dirname, '..', 'src', 'PlayerDatabase'));

const itemDb = new ItemDatabase();
itemDb.load();

const playerDb = new PlayerDatabase();
playerDb.load(itemDb);

module.exports = { itemDb, playerDb };
