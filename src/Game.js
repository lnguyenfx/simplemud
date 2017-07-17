'use strict';

const { playerDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const { PlayerRank } = require('./Attributes');
const Player = require('./Player');

// Game Handler class
class Game extends ConnectionHandler {

  constructor(connection, player) {
    super();
    this.connection = connection;
    this.player = player;
  }

  enter() {
  }

  handle(data) {

  }

}

module.exports = Game;
