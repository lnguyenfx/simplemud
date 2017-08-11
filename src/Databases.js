'use strict';
const path = require('path');
const ItemDatabase = require(path.join(__dirname, '..', 'src', 'ItemDatabase'));
const PlayerDatabase = require(path.join(__dirname, '..', 'src', 'PlayerDatabase'));
const RoomDatabase = require(path.join(__dirname, '..', 'src', 'RoomDatabase'));
const StoreDatabase = require(path.join(__dirname, '..', 'src', 'StoreDatabase'));
const { EnemyTemplateDatabase, EnemyDatabase} =
  require(path.join(__dirname, '..', 'src', 'EnemyDatabase'));

const itemDb = new ItemDatabase();
const playerDb = new PlayerDatabase();
const roomDb = new RoomDatabase();
const storeDb = new StoreDatabase();
const enemyTpDb = new EnemyTemplateDatabase();
const enemyDb = new EnemyDatabase();

const loadDatabases = () => {
  itemDb.load();
  playerDb.load(itemDb);
  roomDb.loadTemplates();
  roomDb.loadData(itemDb);
  storeDb.load(itemDb);
  enemyTpDb.load();
  enemyDb.load(enemyTpDb, roomDb);
};

const saveDatabases = () => {
  playerDb.save();
  roomDb.saveData();
  enemyDb.save();
}

loadDatabases();

module.exports = { itemDb, playerDb, roomDb,
                   storeDb, enemyTpDb, enemyDb,
                   loadDatabases, saveDatabases };
