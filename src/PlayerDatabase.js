'use strict';

const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const EntityDatabase = require('./EntityDatabase');
const Player = require('./Player');

const dataPath = path.join(__dirname, '..', 'data', 'players');

class PlayerDatabase extends EntityDatabase {

  constructor() {
    super();
  }

  save() {
    const file = path.join(dataPath, '_players.json');
    const dataArray = [];
    let index = 0;
    for (let key of this.map.keys()) {
      const player = this.map.get(key);
      dataArray.push(player.name);
      player.id = ++index;
      this.savePlayer(player);
    }
    jsonfile.writeFileSync(file, dataArray, {spaces: 2});
    return true;
  }

  load(itemDb) {
    const file = path.join(dataPath, '_players.json');
    const dataArray = jsonfile.readFileSync(file);
    dataArray.forEach(playerName => {
      this.loadPlayer(playerName, itemDb);
    });
    return true;
  }

  addPlayer(player) {
    if (this.hasId(player.id)) return false;
    if (this.hasNameFull(player.name)) return false;

    this.add(player);
    this.save();
    return true;
  }

  removePlayer(player) {
    if (!this.hasId(player.id)) return false;
    const file = path.join(dataPath, player.name + '.json');
    this.map.delete(player.id);
    this.save();
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return true;
  }

  loadPlayer(playerName, itemDb) {
    const file = path.join(dataPath, playerName + '.json');
    const dataObject = jsonfile.readFileSync(file);
    const dbPlayer = new Player();
    dbPlayer.load(dataObject, itemDb);
    this.addPlayer(dbPlayer);
  }

  savePlayer(player) {
    player.save();
  }

  logout(playerId) {
    const player = this.findById(playerId);
    if (!player) return false;
    player.connection = 0;
    player.loggedIn = false;
    player.active = false;

    // make sure the player is saved to disk
    player.save();
  }

  lastId() {
    return this.size();
  }

  findActive(playerName) {
    return this._findByNameWithFilter(playerName,
      (player) => player.active);
  }

  findLoggedIn(playerName) {
    return this._findByNameWithFilter(playerName,
      (player) => player.loggedIn);
  }

  _findByNameWithFilter(playerName, filterFn) {
    let player =
      this._findByName(playerName,
        "matchFull", filterFn);
    if (!player) player =
      this._findByName(playerName,
        "matchPartial", filterFn);
    return player;
  }

}

module.exports = PlayerDatabase;
