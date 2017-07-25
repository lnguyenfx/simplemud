const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const { itemDb, playerDb } = require(path.join(__dirname, '..', 'src', 'Databases'));
const { Attribute, PlayerRank } = require(path.join(__dirname, '..', 'src', 'Attributes'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));

const tostring = (str, width = 0) => {
  str = str.toString();
  if (str.length >= width) return str;
  return str + Array(width - str.length + 1).join(' ');
}

describe("Game", () => {
  const conn = new Connection(new net.Socket(), telnet);
  const cc = telnet.cc;
  let game, player, stubSocketSend;
  beforeEach(() => {
    player = new Player();
    game = new Game(conn, player);
    stubSocketSend = sinon.stub(conn.socket, 'write').callsFake();
  });

  afterEach(() => {
    conn.socket.write.restore();
  });

  it("should properly returns whether game is running", () => {
    expect(Game.isRunning()).to.be.false;
  });

  it("should properly go to Train handler", () => {
    const stubAddHandler =
      sinon.stub(conn, "addHandler").callsFake();
    player.name = "Test";
    player.connection = conn;
    player.loggedIn = true;
    player.active = true;
    playerDb.add(player);

    const expectedText = cc('red') + cc('bold') +
      player.name + " leaves to edit stats" + cc('reset')+
      cc('red') + cc('reset') + cc('newline');

    game.goToTrain();
    expect(stubAddHandler.calledOnce).to.be.true;
    expect(stubSocketSend.getCall(0).args[0]).to.
      equal(expectedText);

    playerDb.map.delete(player.id);
    conn.addHandler.restore();
  });

  const testSendToPlayers = (sendCommand, filter) => {
    const originalDbSize = playerDb.size();
    const players = [];
    const stubs = [];
    for (let i = 0; i < 10; i++) {
      const player = new Player();
      players[i] = player;
      stubs[i] = sinon.stub(player, 'sendString').callsFake();
      if (i % 2 === 0) player[filter] = true;
      else player[filter] = false;
      playerDb.add(player);
    }
    Game[sendCommand]("testing 123");
    stubs.forEach((stub, i) => {
      if (i % 2 === 0) expect(stub.calledOnce).to.be.true;
      else expect(stub.calledOnce).to.be.false;
    });
    players.forEach((player) => {
      playerDb.map.delete(player.id);
      player.sendString.restore();
    });
    expect(playerDb.size()).to.equal(originalDbSize);
  };

  it("should properly sends message to all logged in users", () => {
    testSendToPlayers('sendGlobal', 'loggedIn');
  });

  it("should properly sends message to all active users", () => {
    testSendToPlayers('sendGame', 'active');
  });

  it("should properly sends logout message to active players", () => {
    const stub = sinon.stub(Game, 'sendGame').callsFake();
    const expectedMsg = "<red><bold>Player X is dropped.</bold></red>";
    Game.logoutMessage("Player X is dropped.");
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    Game.sendGame.restore();
  });

  it("should properly sends announcement to logged in players", () => {
    const stub = sinon.stub(Game, 'sendGlobal').callsFake();
    const expectedMsg = "<cyan><bold>Test announcement!</bold></cyan>";
    Game.announce("Test announcement!");
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    Game.sendGlobal.restore();
  });

  it("should properly sends whispers", () => {
    const stub = stubSocketSend;
    const p = player;
    const recipient = new Player();
    const testMsg = "Test whisper...";
    let expectedMsg = cc('red') + cc('bold') +
      "Error, cannot find user" + cc('reset') +
      cc('red') + cc('reset') + cc('newline');
    p.name = "Bob";
    recipient.name = "Sue";
    p.connection = recipient.connection = conn;
    game.whisper(testMsg, "Sue");
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    recipient.active = false;

    playerDb.add(recipient);
    game.whisper(testMsg, recipient.name);
    expect(stub.getCall(1).args[0]).to.equal(expectedMsg);

    recipient.active = true;
    game.whisper(testMsg, recipient.name);
      expectedMsg = cc('yellow') + p.name + " whispers to you: " +
        cc('reset') + testMsg + cc('newline');
    expect(stub.getCall(2).args[0]).to.equal(expectedMsg);

    playerDb.map.delete(recipient.id);
  });

  it ("should properly displays who list", () => {
    const originalPlayerMap = playerDb.map;
    playerDb.map = new Map();
    expect(playerDb.size()).to.equal(0);
    const admin = new Player();
    admin.name = "Admin";
    admin.rank = PlayerRank.ADMIN;
    admin.active = false;
    admin.loggedIn = true;
    admin.level = 100;
    playerDb.add(admin);
    const god = new Player();
    god.name = "God";
    god.rank = PlayerRank.GOD;
    god.active = true;
    god.loggedIn = true;
    god.level = 505;
    playerDb.add(god);
    const user = new Player();
    user.name = "User";
    user.rank = PlayerRank.REGULAR;
    user.active = false;
    user.loggedIn = false;
    user.level = 10;
    playerDb.add(user);
    expect(playerDb.size()).to.equal(3);
    const whoHeader = cc('white') + cc('bold') +
      "--------------------------------------------------------------------------------" + cc('newline') +
      " Name             | Level     | Activity | Rank\r\n" +
      "--------------------------------------------------------------------------------" + cc('newline');
    const whoFooter =
      "--------------------------------------------------------------------------------" +
      cc('reset') + cc('white') + cc('reset');

    let expectedText = whoHeader +
      " Admin            | 100       | " +
      cc('yellow') + "Inactive" + cc('reset') + cc('bold') + cc('white') +
       " | " + cc('green') + "ADMIN" + cc('reset') + cc('bold') + cc('white') +
       cc('newline') +
      " God              | 505       | " +
      cc('green') + "Online  " + cc('reset') + cc('bold') + cc('white') +
       " | " + cc('yellow') + "GOD" + cc('reset') + cc('bold') + cc('white') +
       cc('newline') +
      " User             | 10        | " +
      cc('red') + "Offline " + cc('reset') + cc('bold') + cc('white') +
       " | " + cc('white') + "REGULAR" + cc('reset') + cc('bold') + cc('white') +
       cc('newline') + whoFooter;

    expect(telnet.translate(Game.whoList('all'))).to.equal(expectedText);

    admin.loggedIn = false;
    expectedText = whoHeader +
      " God              | 505       | " +
      cc('green') + "Online  " + cc('reset') + cc('bold') + cc('white') +
       " | " + cc('yellow') + "GOD" + cc('reset') + cc('bold') + cc('white') +
       cc('newline') + whoFooter;

    expect(telnet.translate(Game.whoList())).to.equal(expectedText);

    playerDb.map = originalPlayerMap;
  });

  it ("should properly displays help", () => {
    const help = cc('white') + cc('bold') +
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
        " attack <enemy>             - Attack an enemy\r\n" +
        cc('reset') + cc('white') + cc('reset');

      const god = cc('yellow') + cc('bold') +
        "--------------------------------- God Commands ---------------------------------\r\n" +
        " kick <who>                 - kicks a user from the realm\r\n" +
        cc('reset') + cc('yellow') + cc('reset');

      const admin = cc('green') + cc('bold') +
        "-------------------------------- Admin Commands --------------------------------\r\n" +
        " announce <msg>             - Makes a global system announcement\r\n" +
        " changerank <who> <rank>    - Changes the rank of a player\r\n" +
        " reload <db>                - Reloads the requested database\r\n" +
        " shutdown                   - Shuts the server down\r\n" +
        cc('reset') + cc('green') + cc('reset');

      const end =
        "--------------------------------------------------------------------------------";

      expect(telnet.translate(Game.printHelp(PlayerRank.REGULAR))).to.
        equal(help + end);
      expect(telnet.translate(Game.printHelp(PlayerRank.GOD))).to.
        equal(help + god + end);
      expect(telnet.translate(Game.printHelp(PlayerRank.ADMIN))).to.
        equal(help + god + admin + end);
  });

  it("should properly prints player's experience", () => {
    const p = game.player;
    p.level = 2;
    p.experience = 25;
    const expectedText = cc('white') + cc('bold') +
      " Level:         " + p.level + cc('newline') +
      " Experience:    " + p.experience + "/" +
      p.needForLevel(p.level + 1) + " (" +
      Math.round(100 * p.experience / p.needForLevel(p.level + 1)) +
      "%)" + cc('reset') + cc('white') + cc('reset');
    expect(telnet.translate(game.printExperience())).to.
      equal(expectedText)
  });

  it("should properly prints player's stats", () => {
    const p = game.player;
    const attr = p.GetAttr.bind(p);
    p.level = 2;
    p.experience = 25;
    p.hitPoints = 5;
    Attribute.enums.forEach((item) => {
      p.baseAttributes[item] = Math.round(Math.random() * 10);
    });
    const experienceText = cc('white') + cc('bold') +
      " Level:         " + p.level + cc('newline') +
      " Experience:    " + p.experience + "/" +
      p.needForLevel(p.level + 1) + " (" +
      Math.round(100 * p.experience / p.needForLevel(p.level + 1)) +
      "%)" + cc('reset') + cc('white') + cc('bold') + cc('reset');

    const expectedText = cc('white') + cc('bold') +
    "---------------------------------- Your Stats ----------------------------------\r\n" +
    " Name:          " + p.name + cc('newline') +
    " Rank:          " + p.rank.toString() +  cc('newline') +
    " HP/Max:        " + p.hitPoints + "/" + attr(Attribute.MAXHITPOINTS) +
    "  (" + Math.round(100 * p.hitPoints / attr(Attribute.MAXHITPOINTS)) + "%)" +
    cc('newline') + experienceText + cc('bold') + cc('white') + cc('newline') +
    " Strength:      " + tostring(attr(Attribute.STRENGTH), 16) +
    " Accuracy:      " + tostring(attr(Attribute.ACCURACY)) + cc('newline') +
    " Health:        " + tostring(attr(Attribute.HEALTH), 16) +
    " Dodging:       " + tostring(attr(Attribute.DODGING)) + cc('newline') +
    " Agility:       " + tostring(attr(Attribute.AGILITY), 16) +
    " Strike Damage: " + tostring(attr(Attribute.STRIKEDAMAGE)) + cc('newline') +
    " StatPoints:    " + tostring(p.statPoints, 16) +
    " Damage Absorb: " + tostring(attr(Attribute.DAMAGEABSORB)) + cc('newline') +
    "--------------------------------------------------------------------------------" +
    cc('reset') + cc('white') + cc('reset');
    expect(telnet.translate(game.printStats())).to.
      equal(expectedText)
  });

  it("should properly prints player's inventory", () => {
    const p = player;
    const weapon = itemDb.findByNameFull("Short Sword");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Healing Potion");
    p.pickUpItem(weapon);
    p.pickUpItem(armor);
    p.pickUpItem(potion);
    p.money = 123;
    expect(p.items).to.equal(3);

    let expectedText = cc('white') + cc('bold') +
      "-------------------------------- Your Inventory --------------------------------" +
      cc('newline') + " Items:  " + weapon.name + ", " +
      armor.name + ", " + potion.name + cc('newline') +
      " Weapon: NONE!" + cc('newline') + " Armor: NONE!" +
      cc('newline') + " Money:    $" + p.money + cc('newline') +
      "--------------------------------------------------------------------------------" +
      cc('reset') + cc('white') + cc('reset');

    expect(telnet.translate(game.printInventory())).to.
      equal(expectedText);

    p.useWeapon(0);
    p.useArmor(1);

    expectedText = cc('white') + cc('bold') +
    "-------------------------------- Your Inventory --------------------------------" +
    cc('newline') + " Items:  " + weapon.name + ", " +
    armor.name + ", " + potion.name + cc('newline') +
    " Weapon: " + weapon.name + cc('newline') +
    " Armor: " + armor.name + cc('newline') +
    " Money:    $" + p.money + cc('newline') +
    "--------------------------------------------------------------------------------" +
    cc('reset') + cc('white') + cc('reset');

    expect(telnet.translate(game.printInventory())).to.
    equal(expectedText);

  });

});
