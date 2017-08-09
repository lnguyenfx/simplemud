'use strict';
const path = require('path');
const ItemDatabase = require(path.join(__dirname, '..', 'src', 'ItemDatabase'));
const PlayerDatabase = require(path.join(__dirname, '..', 'src', 'PlayerDatabase'));
const RoomDatabase = require(path.join(__dirname, '..', 'src', 'RoomDatabase'));
const StoreDatabase = require(path.join(__dirname, '..', 'src', 'StoreDatabase'));
const { EnemyTemplateDatabase, EnemyDatabase} =
  require(path.join(__dirname, '..', 'src', 'EnemyDatabase'));

const itemDb = new ItemDatabase();
itemDb.load();

const playerDb = new PlayerDatabase();
playerDb.load(itemDb);

const roomDb = new RoomDatabase();
roomDb.loadTemplates();
roomDb.loadData(itemDb);

const storeDb = new StoreDatabase();
storeDb.load(itemDb);

const enemyTpDb = new EnemyTemplateDatabase();
enemyTpDb.load();

const enemyDb = new EnemyDatabase();
enemyDb.load(enemyTpDb, roomDb);

module.exports = { itemDb, playerDb, roomDb, storeDb, enemyTpDb, enemyDb };
