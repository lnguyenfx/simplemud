'use strict';

const { playerDb, roomDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const { Attribute } = require('./Attributes');
const Player = require('./Player');

// Game Handler class
class Train extends ConnectionHandler {

  constructor(connection, player) {
    super(connection);
    this.player = player;
  }

  enter() {
    const p = this.player;
    if (p.newbie) {
      const welcomeMsg =
        "<magenta><bold>Welcome to SimpleMUD, " + p.name + "!</bold>\r\n" +
        "You must train your character with your desired stats,\r\n" +
        "before you enter the realm.</magenta>\r\n\r\n" ;
      this.connection.sendMessage(welcomeMsg);
      p.newbie = false;
    }
    this.printStats(false);
  }

  handle(data) {
    const p = this.player;
    if (data === "quit") {
      playerDb.savePlayer(p);
      this.connection.removeHandler();
      return;
    }
    const n = parseInt(data);
    if (n >= 1 && n <= 3) {
      if (p.statPoints > 0) {
        p.statPoints--;
        p.addToBaseAttr(Attribute.get(n - 1), 1);
      }
    }

    this.printStats(true);
  }

  printStats(clear) {
    const p = this.player;
    const statsMsg = (clear ? "<clearscreen/>" : '') + "<white><bold>" +
      "--------------------------------- Your Stats ----------------------------------\r\n" +
      "</bold>" +
      "Player:           " + p.name + "\r\n" +
      "Level:            " + p.level + "\r\n" +
      "Stat Points Left: " + p.statPoints + "\r\n" +
      "1) Strength:      " + p.GetAttr(Attribute.STRENGTH) + "\r\n" +
      "2) Health:        " + p.GetAttr(Attribute.HEALTH) + "\r\n" +
      "3) Agility:       " + p.GetAttr(Attribute.AGILITY) + "\r\n" +
      "<bold>" +
      "-------------------------------------------------------------------------------\r\n" +
      "Enter 1, 2, or 3 to add a stat point, or \"quit\" to enter the realm: " +
      "</bold></white>";
    this.connection.sendMessage(statsMsg);
  }

  hungup() {
    const p = this.player;
    playerDb.logout(p.id);
  }

}

module.exports = Train;
