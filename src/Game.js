'use strict';

const { playerDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const { PlayerRank } = require('./Attributes');
const Player = require('./Player');

const isRunning = false;

// Game Handler class
class Game extends ConnectionHandler {

  static isRunning() {
    return isRunning;
  }

  constructor(connection, player) {
    super(connection);
    this.player = player;
  }

  enter() {
    const p = this.player;
    this.lastCommand = "";
    p.active = true;
    p.loggedIn = true;

    this.sendGame("<bold><green>" + p.name +
      " has entered the realm.</green></bold>");

    if (p.newbie) this.goToTrain();
  }

  handle(data) {

  }

  static sendGlobal(msg) {
    this._sendToFilteredPlayers(msg, 'loggedIn');
  }

  static sendGame(msg) {
    this._sendToFilteredPlayers(msg, 'active');
  }

  static _sendToFilteredPlayers(msg, filter) {
    for (let key of playerDb.map.keys()) {
      const player = playerDb.map.get(key);
      if (player[filter]) player.sendString(msg);
    }
  }

}

module.exports = Game;
