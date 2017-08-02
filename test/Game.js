const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Util = require(path.join(__dirname, '..', 'src', 'Util'));
const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const { itemDb, playerDb, roomDb } =
  require(path.join(__dirname, '..', 'src', 'Databases'));
const { Attribute, PlayerRank, Direction } =
  require(path.join(__dirname, '..', 'src', 'Attributes'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));

const tostring = Util.tostring;

describe("Game", () => {
  const conn = new Connection(new net.Socket(), telnet);
  const cc = telnet.cc;
  let game, player, stubSocketSend;
  beforeEach(() => {
    player = new Player();
    game = new Game(conn, player);
    player.connection = conn;
    stubSocketSend = sinon.stub(conn.socket, 'write').callsFake();
    playerDb.add(player);
  });

  afterEach(() => {
    playerDb.map.delete(player.id);
    conn.socket.write.restore();
  });

  it("should properly return whether game is running", () => {
    expect(Game.isRunning()).to.be.false;
  });

  it("should properly set flag of whether game is running", () => {
    Game.setIsRunning(false);
    expect(Game.isRunning()).to.be.false;
    Game.setIsRunning(true);
    expect(Game.isRunning()).to.be.true;
    Game.setIsRunning(false);
    expect(Game.isRunning()).to.be.false;
  });

  describe("handle()", () => {

    it("should properly handle 'chat' commands", () => {
      const stub = stubSocketSend;
      sinon.stub(player, 'printStatbar').callsFake();
      const p = player;
      p.active = p.loggedIn = true;
      let expectedMsg = cc('white') + cc('bold') +
      `${p.name} chats: Hello there!` +
      cc('reset') + cc('white') + cc('reset') +
      cc('newline');
      game.handle('chat Hello there!');
      expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
      game.handle(': Hello there!');
      expect(stub.getCall(1).args[0]).to.equal(expectedMsg);
      player.printStatbar.restore();
    });

    it("should properly handle 'experience' command", () => {
      const spyPrintExp = sinon.spy(game, 'printExperience');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("experience");
      expect(spyPrintExp.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printExperience.restore();
    });

    it("should properly handle 'exp' command", () => {
      const spyPrintExp = sinon.spy(game, 'printExperience');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("exp");
      expect(spyPrintExp.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printExperience.restore();
    });

    it("should properly handle 'inventory' command", () => {
      const spyPrintInv = sinon.spy(game, 'printInventory');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("inventory");
      expect(spyPrintInv.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printInventory.restore();
    });

    it("should properly handle 'inv' command", () => {
      const spyPrintInv = sinon.spy(game, 'printInventory');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("inv");
      expect(spyPrintInv.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printInventory.restore();
    });

    it("should properly handle 'quit' command", () => {
      const stubCloseConn = sinon.stub(conn, 'close').callsFake();
      const stubLogoutMsg = sinon.stub(Game, 'logoutMessage').callsFake();
      const expectedMsg = player.name + " has left the realm.";
      game.handle('quit');
      expect(stubCloseConn.calledOnce).to.be.true;
      expect(stubLogoutMsg.getCall(0).args[0]).to.equal(expectedMsg);
      Game.logoutMessage.restore();
      conn.close.restore();
    });

    it("should properly handle 'remove' command", () => {
      const spy = sinon.spy(game, 'removeItem');
      game.handle('remove armor');
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.equal("armor");
      game.removeItem.restore();
    });

    it("should properly handle 'stats' command", () => {
      const spy = sinon.spy(game, 'printStats');
      game.handle('stats');
      expect(spy.calledOnce).to.be.true;
      game.printStats.restore();
    });

    it("should properly handle 'st' command", () => {
      const spy = sinon.spy(game, 'printStats');
      game.handle('st');
      expect(spy.calledOnce).to.be.true;
      game.printStats.restore();
    });

    it("should properly handle 'time' command", () => {
      const expectedMsg = cc('bold') + cc('cyan') +
        "The current system time is: " + Util.timeStamp() +
        " on " + Util.dateStamp() + cc('newline') +
        "The system has been up for: " + Util.upTime() +
        "." + cc('reset') + cc('bold') + cc('reset') +
        cc('newline');
      game.handle('time');
      expect(stubSocketSend.getCall(0).args[0]).to.be.
        equal(expectedMsg);
    });

    it("should properly handle 'use' command", () => {
      const spy = sinon.spy(game, 'useItem');
      game.handle('use high potion');
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.equal("high potion");
      game.useItem.restore();
    });

    it("should properly handle 'whisper' command", () => {
      const spy = sinon.spy(game, 'whisper');
      game.handle('whisper test Hello there!');
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args).to.
        have.same.members(['Hello there!', 'test']);
      game.whisper.restore();
    });

    it("should properly handle 'who' command", () => {
      const spy = sinon.spy(Game, 'whoList');
      game.handle('who');
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.equal('');
      game.handle('who all');
      expect(spy.getCall(1).args[0]).to.equal('all');
      Game.whoList.restore();
    });

    it("should properly handle 'kick' command", () => {
      const stubLogoutMsg = sinon.stub(Game, 'logoutMessage').callsFake();
      const stubConnClose = sinon.stub(conn, 'close').callsFake();
      const spyFindLoggedIn = sinon.spy(playerDb, 'findLoggedIn');
      const spySendStr = sinon.spy(player, 'sendString');
      const admin = new Player();
      admin.name = "TestAdmin";
      admin.rank = PlayerRank.ADMIN;
      admin.loggedIn = true;
      playerDb.add(admin);

      const testPlayer = new Player();
      testPlayer.name = "TestPlayer";
      testPlayer.rank = PlayerRank.REGULAR;
      testPlayer.loggedIn = true;
      testPlayer.connection = conn;
      playerDb.add(testPlayer);

      game.handle("kick someuser");
      expect(spyFindLoggedIn.calledOnce).to.be.false; // no priviledge

      player.rank = PlayerRank.GOD;
      game.handle("kick someuser");
      expect(spySendStr.getCall(0).args[0]).to.
        have.string("Player could not be found");

      game.handle("kick ");
      expect(spySendStr.getCall(1).args[0]).to.
        have.string("Usage: kick <name>");

      game.handle("kick " + testPlayer.name);
      expect(stubConnClose.calledOnce).to.be.true;
      expect(stubLogoutMsg.getCall(0).args[0]).to.have.
        string(testPlayer.name + " has been kicked");

      game.handle("kick " + admin.name);
      expect(spySendStr.getCall(2).args[0]).to.
        have.string("You can't kick that player!");

      playerDb.map.delete(testPlayer.id);
      playerDb.map.delete(admin.id);

      player.sendString.restore();
      playerDb.findLoggedIn.restore();
      conn.close.restore();
      Game.logoutMessage.restore();
    });

    it("should properly handle 'announce' command", () => {
      const spy = sinon.spy(Game, 'announce');
      const p = player;
      p.rank = PlayerRank.REGULAR;
      game.handle("announce Test announcement!");
      expect(spy.calledOnce).to.be.false;
      p.rank = PlayerRank.GOD;
      game.handle("announce Test announcement!");
      expect(spy.calledOnce).to.be.false;
      p.rank = PlayerRank.ADMIN;
      game.handle("announce Test announcement!");
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.
        equal("Test announcement!");
      Game.announce.restore();
    });

    it("should properly handle 'changerank' command", () => {
      const spySendGame = sinon.spy(Game, 'sendGame');
      const spySendStr = sinon.spy(player, 'sendString');
      const spyFindNameFull = sinon.spy(playerDb, 'findByNameFull');
      const p = player;
      const testPlayer = new Player();
      testPlayer.name = "TestPlayer";
      testPlayer.rank = PlayerRank.REGULAR;
      playerDb.add(testPlayer);

      p.rank = PlayerRank.REGULAR;
      game.handle("changerank " + testPlayer.name + " god");
      expect(spyFindNameFull.calledOnce).to.be.false;
      p.rank = PlayerRank.GOD;
      game.handle("changerank " + testPlayer.name + " god");
      expect(spyFindNameFull.calledOnce).to.be.false;
      p.rank = PlayerRank.ADMIN;
      game.handle("changerank " + testPlayer.name + " god");
      expect(spyFindNameFull.calledOnce).to.be.true
      expect(spySendGame.getCall(0).args[0]).to.have.
        string("rank has been changed to: GOD");
      game.handle("changerank " + testPlayer.name + " Regular");
      expect(spySendGame.getCall(1).args[0]).to.have.
        string("rank has been changed to: REGULAR");
      game.handle("changerank " + testPlayer.name + " ADMIN");
      expect(spySendGame.getCall(2).args[0]).to.have.
        string("rank has been changed to: ADMIN");

      game.handle("changerank InvalidPlayer god");
      expect(spySendStr.getCall(0).args[0]).to.have.
        string("Could not find user");

      game.handle("changerank " + testPlayer.name);
      expect(spySendStr.getCall(1).args[0]).to.have.
        string("Usage: changerank <name> <rank>");

      game.handle("changerank");
      expect(spySendStr.getCall(2).args[0]).to.have.
        string("Usage: changerank <name> <rank>");

      playerDb.map.delete(testPlayer.id);
      playerDb.findByNameFull.restore();
      player.sendString.restore();
      Game.sendGame.restore();
    });

    it("should properly handle 'reload' command", () => {
      const stubLoadItemDb = sinon.stub(itemDb, 'load').callsFake();
      const spySendStr = sinon.spy(player, 'sendString');
      const p = player;
      p.rank = PlayerRank.REGULAR;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.false;
      p.rank = PlayerRank.GOD;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.false;
      p.rank = PlayerRank.ADMIN;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.true;
      expect(spySendStr.getCall(0).args[0]).to.have.
        string("Item Database Reloaded!");

      game.handle("reload");
      expect(spySendStr.getCall(1).args[0]).to.have.
        string("Usage: reload <db>");

      game.handle("reload invalidDb");
      expect(spySendStr.getCall(2).args[0]).to.have.
        string("Invalid Database Name!");

      player.sendString.restore();
      itemDb.load.restore();
    });

    it("should properly handle 'shutdown' command", () => {
      const spy = sinon.spy(Game, 'announce');
      const p = player;
      p.rank = PlayerRank.REGULAR;
      game.handle("shutdown");
      expect(spy.calledOnce).to.be.false;
      p.rank = PlayerRank.GOD;
      game.handle("shtudown");
      expect(spy.calledOnce).to.be.false;
      p.rank = PlayerRank.ADMIN;
      Game.setIsRunning(true);
      expect(Game.isRunning()).to.be.true;
      game.handle("shutdown");
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.
        equal("SYSTEM IS SHUTTING DOWN");
      expect(Game.isRunning()).to.be.false;
      Game.announce.restore();
    });


  });

  it("should properly transition to enter()", () => {
    const p = player;
    const stubGoToTrain = sinon.stub(game, 'goToTrain').callsFake();
    const expectedMsg = cc('bold') + cc('green') +
      `${p.name} has entered the realm` +
      cc('reset') + cc('bold') + cc('reset');

    expect(p.active).to.be.false;
    expect(p.loggedIn).to.be.false;
    p.newbie = false;
    game.enter();
    expect(p.active).to.be.true;
    expect(p.loggedIn).to.be.true;
    expect(stubGoToTrain.calledOnce).to.be.false;
    p.newbie = true;
    game.enter();
    expect(stubGoToTrain.calledOnce).to.be.true;

    game.goToTrain.restore();
  });

  it("should properly trigger leave()", () => {
    const p = player;
    const stubLogout = sinon.stub(playerDb, 'logout').callsFake();
    p.active = true;
    conn.isClosed = true;
    game.leave();
    expect(p.active).to.be.false;
    expect(stubLogout.calledOnce).to.be.true;
    conn.isClosed = false;
    playerDb.logout.restore();
  });

  it("should properly trigger hungup()", () => {
    const p = player;
    const stubLogoutMsg = sinon.stub(Game, 'logoutMessage').callsFake();
    const expectedMsg = p.name + " has suddenly disappeared from the realm.";
    game.hungup();
    expect(stubLogoutMsg.getCall(0).args[0]).to.equal(expectedMsg);
    Game.logoutMessage.restore();
  });

  it("should properly go to Train handler", () => {
    const stubAddHandler =
      sinon.stub(conn, "addHandler").callsFake();
    player.name = "TestUser201";
    player.connection = conn;
    player.loggedIn = true;
    player.active = true;

    const expectedText = cc('red') + cc('bold') +
      player.name + " leaves to edit stats" + cc('reset')+
      cc('red') + cc('reset') + cc('newline');

    game.goToTrain();
    expect(stubAddHandler.calledOnce).to.be.true;
    expect(stubSocketSend.getCall(0).args[0]).to.
      equal(expectedText);

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

  it("should properly send message to all logged in users", () => {
    testSendToPlayers('sendGlobal', 'loggedIn');
  });

  it("should properly send message to all active users", () => {
    testSendToPlayers('sendGame', 'active');
  });

  it("should properly send logout message to active players", () => {
    const stub = sinon.stub(Game, 'sendGame').callsFake();
    const expectedMsg = "<red><bold>Player X is dropped.</bold></red>";
    Game.logoutMessage("Player X is dropped.");
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    Game.sendGame.restore();
  });

  it("should properly send announcement to logged in players", () => {
    const stub = sinon.stub(Game, 'sendGlobal').callsFake();
    const expectedMsg = "<cyan><bold>Test announcement!</bold></cyan>";
    Game.announce("Test announcement!");
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    Game.sendGlobal.restore();
  });

  it("should properly send whispers", () => {
    const stub = stubSocketSend;
    const p = player;
    const recipient = new Player();
    const testMsg = "Test whisper...";
    let expectedMsg = cc('red') + cc('bold') +
      "Error, cannot find user" + cc('reset') +
      cc('red') + cc('reset') + cc('newline');
    p.name = "Bob";
    recipient.name = "Sue";
    recipient.connection = conn;
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

  it ("should properly display who list", () => {
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

  it ("should properly display help", () => {
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

  it("should properly print player's experience", () => {
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

  it("should properly print player's stats", () => {
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

  it("should properly print player's inventory", () => {
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

  it("should properly use item from player's inventory", () => {
    const spy = sinon.spy(game, 'useItem');
    const p = player;
    const weapon = itemDb.findByNameFull("Rusty Knife");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Small Healing Potion");

    const expectedMsg = cc('red') + cc('bold') +
      "Could not find that item!" + cc('reset') +
      cc('red') + cc('reset') + cc('newline');

    game.useItem('Invalid Item');
    expect(spy.returnValues[0]).to.be.false;
    expect(stubSocketSend.getCall(0).args[0]).to.equal(expectedMsg);

    p.pickUpItem(weapon);
    p.pickUpItem(armor);
    p.pickUpItem(potion);

    expect(p.weapon).to.equal(-1);
    game.useItem(weapon.name);
    expect(spy.returnValues[1]).to.be.true;
    expect(p.weapon).to.equal(0);

    expect(p.armor).to.equal(-1);
    game.useItem(armor.name);
    expect(spy.returnValues[2]).to.be.true;
    expect(p.armor).to.equal(1);

    p.hitPoints = 0;
    expect(p.getItemIndex(potion.name)).to.equal(2);
    game.useItem(potion.name);
    expect(spy.returnValues[3]).to.be.true;
    expect(p.hitPoints).to.be.within(potion.min, potion.max);
    expect(p.getItemIndex(potion.name)).to.equal(-1);

    game.useItem.restore();
  });

  it("should properly remove item from player", () => {
    const spy = sinon.spy(game, 'removeItem');
    const p = player;
    const weapon = itemDb.findByNameFull("Rusty Knife");
    const armor = itemDb.findByNameFull("Leather Armor");
    const expectedMsg = cc('red') + cc('bold') +
      "Could not Remove item!" + cc('reset') +
      cc('red') + cc('reset') + cc('newline');

    game.removeItem('invalid');
    expect(spy.returnValues[0]).to.be.false;
    expect(stubSocketSend.getCall(0).args[0]).to.equal(expectedMsg);

    game.removeItem('weapon');
    expect(spy.returnValues[1]).to.be.false;
    expect(stubSocketSend.getCall(1).args[0]).to.equal(expectedMsg);

    game.removeItem('armor');
    expect(spy.returnValues[2]).to.be.false;
    expect(stubSocketSend.getCall(2).args[0]).to.equal(expectedMsg);

    p.pickUpItem(weapon);
    game.useItem(weapon.name);
    expect(p.Weapon()).to.equal(weapon);
    game.removeItem('weapon');
    expect(spy.returnValues[3]).to.be.true;
    expect(p.Weapon()).to.equal(0);

    p.pickUpItem(armor);
    game.useItem(armor.name);
    expect(p.Armor()).to.equal(armor);
    game.removeItem('armor');
    expect(spy.returnValues[4]).to.be.true;
    expect(p.Armor()).to.equal(0);

    game.removeItem.restore();
  });

  it("should properly print room's info", () => {
    const room = roomDb.findByNameFull("Training Room")

    const expectedText = cc('newline') + cc('bold') + cc('white') +
      room.name + cc('reset') + cc('bold') + cc('reset') +
      cc('newline') + cc('bold') + cc('magenta') +
      room.description + cc('reset') + cc('bold') + cc('reset') +
      cc('newline') + cc('bold') + cc('green') +
      "exits: NORTH  " + cc('reset') + cc('bold') + cc('reset') +
      cc('newline');

    expect(telnet.translate(Game.printRoom(room))).to.
      equal(expectedText);

    room.money = 123;

    let extraText = cc('bold') + cc('yellow') +
      "You see: $123" + cc('reset') + cc('bold') +
      cc('reset') + cc('newline');

    expect(telnet.translate(Game.printRoom(room))).to.
      equal(expectedText + extraText);

    const weapon = itemDb.findByNameFull("Shortsword");
    const armor = itemDb.findByNameFull("Leather Armor");
    room.items = [weapon, armor];

    extraText = cc('bold') + cc('yellow') +
      "You see: $123, Shortsword, Leather Armor" +
      cc('reset') + cc('bold') +
      cc('reset') + cc('newline');

    expect(telnet.translate(Game.printRoom(room))).to.
      equal(expectedText + extraText);

    player.name = "Test Player";
    room.addPlayer(player);

    extraText += cc('bold') + cc('cyan') +
      "People: Test Player" +
      cc('reset') + cc('bold') +
      cc('reset') + cc('newline');

    expect(telnet.translate(Game.printRoom(room))).to.
      equal(expectedText + extraText);

  });


});
