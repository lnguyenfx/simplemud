'use strict';

const { playerDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const { PlayerRank } = require('./Attributes');
const Player = require('./Player');

// Game Handler class
class Train extends ConnectionHandler {

  constructor(connection, player) {
    super(connection);
    this.player = player;
  }

  enter() {
  }

  handle(data) {

  }

}

module.exports = Train;
