'use strict';

const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const EntityDatabase = require('./EntityDatabase');
const Player = require('./Player');

const file = path.join(__dirname, '..', 'data', 'items.json');

class PlayerDatabase extends EntityDatabase {

  constructor() {
    super();
  }

  // save method is not needed
  // because we don't use 'players.txt' to keep
  // tracks of all players, we are reading players
  // directly from data/players/ directory

  load(itemDb) {
    const folder = path.join(__dirname, '..', 'data', 'players');
    fs.readdirSync(folder).forEach(file => {
      const playerName = file.replace('.json', '');
      this.loadPlayer(playerName, itemDb);
    });
    return true;
  }

  addPlayer(player) {
    if (this.hasId(player.id)) return false;
    if (this.hasNameFull(player.name)) return false;

    this.add(player);
    this.savePlayer(player);
  }

  loadPlayer(playerName, itemDb) {
    const file = path.join(__dirname, '..', 'data', 'players', playerName + '.json');
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
