'use strict';

const { playerDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const { Attribute, PlayerRank, ItemType } = require('./Attributes');
const Player = require('./Player');
const Train = require('./Train');

const tostring = (str, width = 0) => {
  str = str.toString();
  if (str.length >= width) return str;
  return str + Array(width - str.length + 1).join(' ');
}

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

    Game.sendGame("<bold><green>" + p.name +
      " has entered the realm.</green></bold>");

    if (p.newbie) this.goToTrain();
  }

  handle(data) {

  }

  goToTrain() {
    const conn = this.connection;
    const p = this.player;
    Game.logoutMessage(p.name + " leaves to edit stats");
    conn.addHandler(new Train(conn, p));
  }

  useItem(name) {
    const p = this.player;
    const index = p.getItemIndex(name);

    if (index === -1) {
      p.sendString("<red><bold>Could not find that item!</bold></red>");
      return false;
    }

    const item = p.inventory[index];

    switch(item.type) {
      case ItemType.WEAPON:
        p.useWeapon(index);
        return true;
      case ItemType.ARMOR:
        p.useArmor(index);
        return true;
      case ItemType.HEALING:
        const min = item.min;
        const max = item.max;
        p.addBonuses(item);
        p.addHitPoints(Math.floor(Math.random() * (max - min + 1)) + min);
        p.dropItem(index);
        return true;
    }

    return false;
  }

  removeItem(typeName) {
    const p = this.player;

    typeName = typeName.toLowerCase();

    if (typeName === "weapon" && p.Weapon() !== 0) {
      p.removeWeapon();
      return true;
    }

    if (typeName === "armor" && p.Armor() !== 0) {
      p.removeArmor();
      return true;
    }

    p.sendString("<red><bold>Could not Remove item!</bold></red>");
    return false;
  }

  static sendGlobal(msg) {
    Game._sendToPlayers(msg, 'loggedIn');
  }

  static sendGame(msg) {
    Game._sendToPlayers(msg, 'active');
  }

  static _sendToPlayers(msg, filter) {
    for (let key of playerDb.map.keys()) {
      const player = playerDb.map.get(key);
      if (player[filter]) player.sendString(msg);
    }
  }

  static logoutMessage(reason) {
    Game.sendGame("<red><bold>" + reason + "</bold></red>");
  }

  static announce(announcement) {
    Game.sendGlobal("<cyan><bold>" + announcement + "</bold></cyan>");
  }

  whisper(msg, playerName) {
    const player = playerDb.findActive(playerName);
    if (!player) {
      this.player.sendString(
        "<red><bold>Error, cannot find user</bold></red>");
    } else {
      player.sendString(
        "<yellow>" + this.player.name +
        " whispers to you: </yellow>" + msg);
      this.player.sendString(
        "<yellow>You whisper to " + player.name +
        ": </yellow>" + msg);
    }
  }

  static whoList(mode) {
    let str = "<white><bold>" +
      "--------------------------------------------------------------------------------\r\n" +
      " Name             | Level     | Activity | Rank\r\n" +
      "--------------------------------------------------------------------------------\r\n";

    if (mode === 'all') {
      str += Game._who(() => true);
    } else {
      str += Game._who((player) => player.loggedIn);
    }

    str +=
      "--------------------------------------------------------------------------------" +
      "</bold></white>";

    return str;
  }

  static _who(filterFn) {
    let str = "";
    for (let key of playerDb.map.keys()) {
      const player = playerDb.map.get(key);
      if (filterFn(player)) {
        const p = player;
        str += " " + tostring(p.name, 17) + "| ";
        str += tostring(p.level.toString(), 10) + "| ";

        if (p.active) str += "<green>Online  </green>";
        else if (p.loggedIn) str += "<yellow>Inactive</yellow>";
        else str += "<red>Offline </red>";

        str += " | ";
        let rankColor = "";
        switch(p.rank) {
          case PlayerRank.REGULAR: rankColor = "white";   break;
          case PlayerRank.GOD:     rankColor = "yellow";  break;
          case PlayerRank.ADMIN:   rankColor = "green";   break;
        }
        str += "<" + rankColor + ">" + p.rank.toString() +
          "</" + rankColor + ">\r\n";
      }
    }
    return str;
  }

  static printHelp(rank) {
    const help = "<white><bold>" +
        "--------------------------------- Command List ---------------------------------\r\n" +
        " /                          - Repeats your last command exactly.\r\n" +
        " chat <mesg>                - Sends message to everyone in the game\r\n" +
        " experience                 - Shows your experience statistics\r\n" +
        " help                       - Shows this menu\r\n" +
        " inventory                  - Shows a list of your items\r\n" +
        " quit                       - Allows you to leave the realm.\r\n" +
        " remove <'weapon'/'armor'>  - removes your weapon or armor\r\n" +
        " stats                      - Shows all of your statistics\r\n" +
        " time                       - shows the current system time.\r\n" +
        " use <item>                 - use an item in your inventory\r\n" +
        " whisper <who> <msg>        - Sends message to one person\r\n" +
        " who                        - Shows a list of everyone online\r\n" +
        " who all                    - Shows a list of everyone\r\n" +
        " look                       - Shows you the contents of a room\r\n" +
        " north/east/south/west      - Moves in a direction\r\n" +
        " get/drop <item>            - Picks up or drops an item on the ground\r\n" +
        " train                      - Train to the next level (TR)\r\n" +
        " editstats                  - Edit your statistics (TR)\r\n" +
        " list                       - Lists items in a store (ST)\r\n" +
        " buy/sell <item>            - Buy or Sell an item in a store (ST)\r\n" +
        " attack <enemy>             - Attack an enemy\r\n</bold></white>";

      const god = "<yellow><bold>" +
        "--------------------------------- God Commands ---------------------------------\r\n" +
        " kick <who>                 - kicks a user from the realm\r\n" +
        "</bold></yellow>";

      const admin = "<green><bold>" +
        "-------------------------------- Admin Commands --------------------------------\r\n" +
        " announce <msg>             - Makes a global system announcement\r\n" +
        " changerank <who> <rank>    - Changes the rank of a player\r\n" +
        " reload <db>                - Reloads the requested database\r\n" +
        " shutdown                   - Shuts the server down\r\n" +
        "</bold></green>";

      const end =
        "--------------------------------------------------------------------------------";

      switch(rank) {
        case PlayerRank.REGULAR:
          return help + end;
        case PlayerRank.GOD:
          return help + god + end;
        default:
          return help + god + admin + end;
      }
  }

  printExperience() {
    const p = this.player;
    return "<white><bold>" +
      " Level:         " + p.level + "\r\n" +
      " Experience:    " + p.experience + "/" +
      p.needForLevel(p.level + 1) + " (" +
      Math.round(100 * p.experience / p.needForLevel(p.level + 1)) +
      "%)</bold></white>";
  }

  printStats() {
    const p = this.player;
    const attr = p.GetAttr.bind(p);
    const str = "<white><bold>" +
    "---------------------------------- Your Stats ----------------------------------\r\n" +
    " Name:          " + p.name + "\r\n" +
    " Rank:          " + p.rank.toString() + "\r\n" +
    " HP/Max:        " + p.hitPoints + "/" + attr(Attribute.MAXHITPOINTS) +
    "  (" + Math.round(100 * p.hitPoints / attr(Attribute.MAXHITPOINTS)) + "%)\r\n" +
    this.printExperience() + "\r\n" +
    " Strength:      " + tostring(attr(Attribute.STRENGTH), 16) +
    " Accuracy:      " + tostring(attr(Attribute.ACCURACY)) + "\r\n" +
    " Health:        " + tostring(attr(Attribute.HEALTH), 16) +
    " Dodging:       " + tostring(attr(Attribute.DODGING)) + "\r\n" +
    " Agility:       " + tostring(attr(Attribute.AGILITY), 16) +
    " Strike Damage: " + tostring(attr(Attribute.STRIKEDAMAGE)) + "\r\n" +
    " StatPoints:    " + tostring(p.statPoints, 16) +
    " Damage Absorb: " + tostring(attr(Attribute.DAMAGEABSORB)) + "\r\n" +
    "--------------------------------------------------------------------------------" +
    "</bold></white>";
    return str;
  }

  printInventory() {
    const p = this.player;

    let itemList = "<white><bold>" +
        "-------------------------------- Your Inventory --------------------------------\r\n" +
        " Items:  ";

    // Inventory
    p.inventory.forEach((item) => {
      itemList += item.name + ", ";
    });

    // chop off the extraneous comma, and add a newline.
    itemList = itemList.slice(0, -2);
    itemList += "\r\n";

    // Weapon/Armor
    itemList += " Weapon: ";
    if (p.Weapon() === 0) itemList += "NONE!";
    else itemList += p.Weapon().name;

    itemList += "\r\n Armor: ";
    if (p.Armor() === 0) itemList += "NONE!";
    else itemList += p.Armor().name;

    // Money
    itemList += "\r\n Money:    $" + p.money;

    itemList +=
        "\r\n--------------------------------------------------------------------------------" +
        "</bold></white>";

    return itemList;
  }

}

module.exports = Game;
