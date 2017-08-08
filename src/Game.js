'use strict';

const Util = require('./Util');
const { itemDb, playerDb, roomDb, storeDb } =
  require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const { Attribute, PlayerRank, ItemType, Direction } =
  require('./Attributes');
const Player = require('./Player');
const Train = require('./Train');

const tostring = Util.tostring;

let isRunning = false;

// Game Handler class
class Game extends ConnectionHandler {

  static isRunning() {
    return isRunning;
  }

  static setIsRunning(bool) {
    isRunning = bool;
  }

  constructor(connection, player) {
    super(connection);
    this.player = player;
  }

  enter() {
    this.lastCommand = "";

    const p = this.player;
    p.active = true;
    p.loggedIn = true;
    // p.room is initially a room id when Player object
    // first initialized -- so converting to actual
    // room object here
    if (!isNaN(p.room)) p.room = roomDb.findById(p.room);
    p.room.addPlayer(p);

    Game.sendGame("<bold><green>" + p.name +
      " has entered the realm.</green></bold>");

    if (p.newbie) this.goToTrain();
    else p.sendString(Game.printRoom(p.room));
  }

  handle(data) {
    const parseWord = Util.parseWord;
    const removeWord = Util.removeWord;
    const p = this.player;

    // check if the player wants to repeat a command
    if (data === '/') data = this.lastcommand;
    else this.lastcommand = data; // if not, record the command.

    // get the first word and lowercase it.
    const firstWord = parseWord(data, 0);

    // ------------------------------------------------------------------------
    //  REGULAR access commands
    // ------------------------------------------------------------------------
    if (firstWord === "chat" || firstWord === ':') {
      const text = removeWord(data, 0);
      Game.sendGame(
        `<white><bold>${p.name} chats: ${text}</bold></white>`);
      return;
    }

    if (firstWord === "experience" || firstWord === "exp") {
      p.sendString(this.printExperience());
      return;
    }

    if (firstWord === "inventory" || firstWord === "inv") {
      p.sendString(this.printInventory());
      return;
    }

    if (firstWord === "quit") {
      this.connection.close();
      Game.logoutMessage(p.name + " has left the realm.");
      return;
    }

    if (firstWord === "remove") {
      this.removeItem(parseWord(data, 1));
      return;
    }

    if (firstWord === "stats" || firstWord === "st") {
      p.sendString(this.printStats());
      return;
    }

    if (firstWord === "time") {
      const msg = "<bold><cyan>" +
        "The current system time is: " +
        Util.timeStamp() + " on " +
        Util.dateStamp() + "<newline/>" +
        "The system has been up for: " +
        Util.upTime() + ".</cyan></bold>";
      p.sendString(msg);
      return;
    }

    if (firstWord === "use") {
      this.useItem(removeWord(data, 0));
      return;
    }

    if (firstWord === "whisper") {
      // get the players name
      const name = parseWord(data, 1);
      const message = removeWord(removeWord(data, 0), 0);
      this.whisper(message, name);
      return;
    }

    if (firstWord === "who") {
      p.sendString(Game.whoList(
        parseWord(data, 1).toLowerCase()));
      return;
    }

    // ------------------------------------------------------------------------
    //  GOD access commands
    // ------------------------------------------------------------------------
    if (firstWord === "kick" && p.rank >= PlayerRank.GOD) {

      const targetName = parseWord(data, 1);
      if (targetName === '') {
        p.sendString("<red><bold>Usage: kick <name></bold></red>");
        return;
      }

      // find a player to kick
      const target = playerDb.findLoggedIn(targetName);
      if (!target) {
        p.sendString("<red><bold>Player could not be found</bold></red>");
        return;
      }

      if (target.rank > p.rank) {
        p.sendString("<red><bold>You can't kick that player!</bold></red>");
        return;
      }

      target.connection.close();
      Game.logoutMessage(target.name +
        " has been kicked by " + p.name + "!!!");
      return;
    }

    // ------------------------------------------------------------------------
    //  ADMIN access commands
    // ------------------------------------------------------------------------
    if (firstWord === "announce" && p.rank >= PlayerRank.ADMIN) {
      Game.announce(removeWord(data, 0));
      return;
    }

    if (firstWord === "changerank" && p.rank >= PlayerRank.ADMIN) {
      const name = parseWord(data, 1);
      let rank = parseWord(data, 2);

      if (name === '' || rank === '') {
        p.sendString("<red><bold>Usage: changerank <name> <rank></bold></red>");
        return;
      }

      // find the player to change rank
      const target = playerDb.findByNameFull(name);
      if (!target) {
        p.sendString("<red><bold>Error: Could not find user " +
          name + "</bold></red>");
        return;
      }

      rank = PlayerRank.get(rank.toUpperCase());
      if (!rank) {
        p.sendString("<red><bold>Invalid rank!</bold></red>");
        return;
      }

      target.rank = rank;
      Game.sendGame("<green><bold>" + target.name +
        "'s rank has been changed to: " + target.rank.toString());
      return;
    }

    if (firstWord === "reload" && p.rank >= PlayerRank.ADMIN) {
      const db = parseWord(data, 1);

      if (db === '') {
        p.sendString("<red><bold>Usage: reload <db></bold></red>");
        return;
      }

      if (db === "items") {
        itemDb.load();
        p.sendString("<bold><cyan>Item Database Reloaded!</cyan></bold>");
      } else {
        p.sendString("<bold><red>Invalid Database Name!</red></bold>");
      }
      return;
    }

    if (firstWord === "shutdown" && p.rank >= PlayerRank.ADMIN) {
      Game.announce("SYSTEM IS SHUTTING DOWN");
      Game.setIsRunning(false);
      return;
    }

  }

  leave() {
    const p = this.player;
    // deactivate player
    p.active = false;
    // log out the player from the database if the connection has been closed
    if (this.connection.isClosed) {
      playerDb.logout(p.id);
    }
  }

  // ------------------------------------------------------------------------
  //  This notifies the handler that a connection has unexpectedly hung up.
  // ------------------------------------------------------------------------
  hungup() {
    const p = this.player;
    Game.logoutMessage(`${p.name} has suddenly disappeared from the realm.`);
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
        p.addHitPoints(Util.randomInt(min, max));
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

  move(dir) {
    const p = this.player;
    if (!dir.hasOwnProperty('key')) {
      p.sendString("<red>Invalid direction!</red>");
      return;
    }
    const next = roomDb.findById(p.room.rooms[dir]);
    const previous = p.room;

    if (!next) {
      Game.sendRoom("<red>" + p.name + " bumps into the wall to the " +
                    dir.key + "!!!</red>", p.room);
      return;
    }

    previous.removePlayer(p);

    Game.sendRoom("<green>"  + p.name + " leaves to the " +
                  dir.key + ".</green>", previous);
    Game.sendRoom("<green>"  + p.name + " enters from the " +
                  this._oppositeDirection(dir) + ".</green>", next);
    p.sendString("<green>You walk " + dir.key + ".</green>");

    p.room = next;
    next.addPlayer(p);

    p.sendString(Game.printRoom(next));
  }

  _oppositeDirection(dir) {
    switch (dir) {
      case Direction.NORTH:
        return Direction.SOUTH.key;
      case Direction.EAST:
        return Direction.WEST.key;
      case Direction.SOUTH:
        return Direction.NORTH.key;
      case Direction.WEST:
        return Direction.EAST.key;
      default:
        return false;
    }
  }

  getItem(item) {
    const p = this.player;

    if (item[0] === '$') {
      // clear off the '$', and convert the result into a number.
      const money = parseInt(item.substr(1, item.length - 1));
      if (!isNaN(money)) { // if valid money amount
        // make sure there's enough money in the room
        if (money > p.room.money) {
          p.sendString("<red><bold>There isn't that much here!</bold></red>");
        } else {
          p.money += money;
          p.room.money -= money;
          Game.sendRoom("<cyan><bold>" + p.name + " picks up $" +
                        money + ".</bold></cyan>", p.room);
        }
        return;
      }
    }

    const i = p.room.findItem(item);

    if (!i) {
      p.sendString("<red><bold>You don't see that here!</bold></red>");
      return;
    }

    if (!p.pickUpItem(i)) {
      p.sendString("<red><bold>You can't carry that much!</bold></red>");
      return;
    }

    p.room.removeItem(i);
    Game.sendRoom("<cyan><bold>" + p.name + " picks up " +
                  i.name + ".</bold></cyan>", p.room);
  }

  dropItem(item) {
    const p = this.player;

    if (item[0] === '$') {
      // clear off the '$', and convert the result into a number.
      const money = parseInt(item.substr(1, item.length - 1));
      if (!isNaN(money)) { // if valid money amount
        // make sure there's enough money in the room
        if (money > p.money) {
          p.sendString("<red><bold>You don't have that much!</bold></red>");
        } else {
          p.money -= money;
          p.room.money += money;
          Game.sendRoom("<cyan><bold>" + p.name + " drops $" +
                        money + ".</bold></cyan>", p.room);
        }
        return;
      }
    }

    const i = p.getItemIndex(item);

    if (i === -1) {
      p.sendString("<red><bold>You don't have that!</bold></red>");
      return;
    }

    Game.sendRoom("<cyan><bold>" + p.name + " drops " +
                  p.inventory[i].name + ".</bold></cyan>", p.room);
    p.room.addItem(p.inventory[i]);
    p.dropItem(i);
  }

  buy(itemName) {
    const p = this.player;
    const s = storeDb.findById(p.room.data);
    if (!s) return false;
    const i = s.findItem(itemName);

    if (i === 0) {
      p.sendString("<red><bold>Sorry, we don't have that item!</bold></red>");
      return;
    }
    if (p.money < i.price) {
      p.sendString("<red><bold>Sorry, but you can't afford that!</bold></red>");
      return;
    }
    if (!p.pickUpItem(i)) {
      p.sendString("<red><bold>Sorry, but you can't carry that much!</bold></red>");
      return;
    }

    p.money -= i.price;
    Game.sendRoom("<cyan><bold>" + p.name + " buys a " +
                  i.name +"</bold></cyan>", p.room);
  }

  sell(itemName) {
    const p = this.player;
    const s = storeDb.findById(p.room.data);
    if (!s) return false;
    const index = p.getItemIndex(itemName);

    if (index === -1) {
      p.sendString("<red><bold>Sorry, you don't have that!</bold></red>");
      return;
    }
    const i = p.inventory[index];
    if (!s.findItem(i.name)) {
      p.sendString("<red><bold>Sorry, we don't want that item!</bold></red>");
    }
    p.dropItem(index);
    p.money += i.price;
    Game.sendRoom("<cyan><bold>" + p.name + " sells a " +
                  i.name + "</bold></cyan>", p.room);
  }

  static sendGlobal(msg) {
    Game._sendToPlayers(msg, 'loggedIn');
  }

  static sendGame(msg) {
    Game._sendToPlayers(msg, 'active');
  }

  static sendRoom(text, room) {
    room.players.forEach(player => {
      player.sendString(text);
    });
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

  static storeList(storeId) {
    const s = storeDb.findById(storeId);
    if (!s) return false;
    let output = "<white><bold>" +
                "--------------------------------------------------------------------------------\r\n";
      output += " Welcome to " + s.name + "!\r\n";
      output += "--------------------------------------------------------------------------------\r\n";
      output += " Item                           | Price\r\n";
      output += "--------------------------------------------------------------------------------\r\n";

    s.items.forEach(item => {
      output += " " + tostring(item.name, 31) + "| ";
      output += tostring(item.price) + "\r\n";
    });
    output += "--------------------------------------------------------------------------------\r\n" +
              "</bold></white>";
    return output;
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

  static printRoom(room) {
    let desc = `<newline/><bold><white>${room.name}</white></bold><newline/>` +
      `<bold><magenta>${room.description}</magenta></bold><newline/>` +
      "<bold><green>exits: ";

    Direction.enums.forEach(dir => {
      if (room.rooms[dir] !== 0) {
        desc += dir.key + "  ";
      }
    });
    desc += "</green></bold><newline/>";

    // ---------------------------------
    // ITEMS
    // ---------------------------------
    let temp = "<bold><yellow>You see: ";
    let count = 0;
    if (room.money > 0) {
      count++;
      temp += "$" + room.money + ", ";
    }

    room.items.forEach(item => {
      count++;
      temp += item.name + ", ";
    });

    if (count > 0) {
      temp = temp.substr(0, temp.length - 2);
      desc += temp + "</yellow></bold><newline/>";
    }

    // ---------------------------------
    // PEOPLE
    // ---------------------------------
    temp = "<bold><cyan>People: ";
    count = 0;

    room.players.forEach(player => {
      count++;
      temp += player.name + ", ";
    });

    if (count > 0) {
      temp = temp.substr(0, temp.length - 2);
      desc += temp + "</cyan></bold><newline/>";
    }

    return desc;

  }



}

module.exports = Game;
