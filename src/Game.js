'use strict';

const { playerDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const { PlayerRank } = require('./Attributes');
const Player = require('./Player');

const isRunning = false;

// Game Handler class
class Game extends ConnectionHandler {

  constructor(connection, player) {
    super(connection);
    this.player = player;
  }

  enter() {
  }

  handle(data) {

  }

}

module.exports = Game;
