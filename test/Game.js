const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Util = require(path.join(__dirname, '..', 'src', 'Util'));
const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const { itemDb, playerDb, roomDb, storeDb, enemyTpDb, enemyDb } =
  require(path.join(__dirname, '..', 'src', 'Databases'));
const { Attribute, PlayerRank, Direction } =
  require(path.join(__dirname, '..', 'src', 'Attributes'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const Room = require(path.join(__dirname, '..', 'src', 'Room'));
const Store = require(path.join(__dirname, '..', 'src', 'Store'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));

const tostring = Util.tostring;
const wrap = Util.wrap;

describe("Game", () => {
  const conn = new Connection(new net.Socket(), telnet);
  const cc = telnet.cc;
  let game, player, stubConnSendMsg;
  beforeEach(() => {
    player = new Player();
    game = new Game(conn, player);
    player.connection = conn;
    stubConnSendMsg = sinon.stub(conn, 'sendMessage').callsFake();
    playerDb.add(player);
  });

  afterEach(() => {
    playerDb.map.delete(player.id);
    conn.sendMessage.restore();
  });

  it("should properly return whether game is running", () => {
    expect(Game.isRunning()).to.be.false;
    Game.setIsRunning(true);
    expect(Game.isRunning()).to.be.true;
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

    let stubSendRoom;
    beforeEach(() => {
      stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();
    });

    afterEach(() => {
      Game.sendRoom.restore();
    })

    // ------------------------------------------------------------------------
    //  REGULAR access commands
    // ------------------------------------------------------------------------

    it("should properly handle 'chat' commands", () => {
      const stub = stubConnSendMsg;
      sinon.stub(player, 'printStatbar').callsFake();
      const p = player;
      p.active = p.loggedIn = true;
      let expectedMsg = "<white><bold>" +
      `${p.name} chats: Hello there!` +
      "</bold></white>" + "\r\n";
      game.handle('chat Hello there!');
      expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
      game.handle(': Hello there!');
      expect(stub.getCall(1).args[0]).to.equal(expectedMsg);
      player.printStatbar.restore();
    });

    const testExpCmd = (cmd) => {
      const spyPrintExp = sinon.spy(game, 'printExperience');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle(cmd);
      expect(spyPrintExp.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printExperience.restore();
    };

    it("should properly handle 'experience' command", () => {
      testExpCmd('experience');
    });

    it("should properly handle 'exp' command", () => {
      testExpCmd('exp');
    });

    const testHelpCmd = (cmd) => {
      const spyPrintHelp = sinon.spy(Game, 'printHelp');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle(cmd);
      expect(spyPrintHelp.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      Game.printHelp.restore();
    };

    it("should properly handle 'help' command", () => {
      testHelpCmd('help');
    });

    it("should properly handle 'commands' command", () => {
      testHelpCmd('commands');
    });

    const testInvCmd = (cmd) => {
      const spyPrintInv = sinon.spy(game, 'printInventory');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle(cmd);
      expect(spyPrintInv.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printInventory.restore();
    };

    it("should properly handle 'inventory' command", () => {
      testInvCmd('inventory');
    });

    it("should properly handle 'inv' command", () => {
      testInvCmd('inv');
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

    const testStatCmd = (cmd) => {
      const spy = sinon.spy(game, 'printStats');
      game.handle(cmd);
      expect(spy.calledOnce).to.be.true;
      game.printStats.restore();
    };

    it("should properly handle 'stats' command", () => {
      testStatCmd('stats');
    });

    it("should properly handle 'st' command", () => {
      testStatCmd('st');
    });

    it("should properly handle 'time' command", () => {
      const expectedMsg = "<bold><cyan>" +
        "The current system time is: " + Util.timeStamp() +
        " on " + Util.dateStamp() + "\r\n" +
        "The system has been up for: " + Util.upTime() +
        "</cyan></bold>" + "\r\n";
      game.handle('time');
      expect(stubConnSendMsg.getCall(0).args[0]).to.be.
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

    const testLookCmd = (cmd) => {
      player.room = roomDb.findByNameFull("Training Room");
      const spy = sinon.spy(Game, 'printRoom');
      game.handle(cmd);
      expect(spy.calledOnce).to.be.true;
      Game.printRoom.restore();
    };

    it("should properly handle 'look' command", () => {
      testLookCmd('look');
    });

    it("should properly handle 'l' command", () => {
      testLookCmd('l');
    });

    const testNorthCmd = (cmd) => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle(cmd);
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.NORTH);
      game.move.restore();
    };

    it("should properly handle 'north' command", () => {
      testNorthCmd('North');
    });

    it("should properly handle 'n' command", () => {
      testNorthCmd('n');
    });

    const testEastCmd = (cmd) => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle(cmd);
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.EAST);
      game.move.restore();
    };

    it("should properly handle 'east' command", () => {
      testEastCmd('East');
    });

    it("should properly handle 'e' command", () => {
      testEastCmd('e');
    });

    const testSouthCmd = (cmd) => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle(cmd);
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.SOUTH);
      game.move.restore();
    };

    it("should properly handle 'south' command", () => {
      testSouthCmd('South');
    });

    it("should properly handle 's' command", () => {
      testSouthCmd('s');
    });

    const testWestCmd = (cmd) => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle(cmd);
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.WEST);
      game.move.restore();
    };

    it("should properly handle 'west' command", () => {
      testWestCmd('West');
    });

    it("should properly handle 'w' command", () => {
      testWestCmd('w');
    });

    const testGetCmd = (cmd) => {
      const stub = sinon.stub(game, 'getItem').callsFake();
      game.handle(cmd + ' sword');
      expect(stub.getCall(0).args[0]).to.
        equal('sword');
      game.getItem.restore();
    };

    it("should properly handle 'get' command", () => {
      testGetCmd('get');
    });

    it("should properly handle 'take' command", () => {
      testGetCmd('take');
    });

    it("should properly handle 'drop' command", () => {
      const stub = sinon.stub(game, 'dropItem').callsFake();
      game.handle('drop healing potion');
      expect(stub.getCall(0).args[0]).to.
        equal('healing potion');
      game.dropItem.restore();
    });

    it("should properly handle 'train' command", () => {
      const p = player;
      const stub = sinon.stub(p, 'sendString').callsFake();
      p.experience = 0;

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('train');
      expect(stub.getCall(0).args[0]).to.
      equal("<red><bold>You cannot train here!</bold></red>");

      p.room = roomDb.findByNameFull("Training Room");
      game.handle('train');
      expect(stub.getCall(1).args[0]).to.
        equal("<red><bold>You don't have enough " +
              "experience to train!</bold></red>");

      p.experience = 40;
      game.handle('train');
      expect(stub.getCall(2).args[0]).to.
        equal("<green><bold>You are now level 2</bold></green>");

      p.sendString.restore();
    });

    it("should properly handle 'editstats' command", () => {
      const p = player;
      const stubSendString = sinon.stub(p, 'sendString').callsFake();
      const stubGoToTrain = sinon.stub(game, 'goToTrain').callsFake();
      p.experience = 0;

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('editstats');
      expect(stubSendString.getCall(0).args[0]).to.
      equal("<red><bold>You cannot edit your stats here!</bold></red>");
      expect(stubGoToTrain.calledOnce).to.be.false;

      p.room = roomDb.findByNameFull("Training Room");
      game.handle('editstats');
      expect(stubGoToTrain.calledOnce).to.be.true;

      p.sendString.restore();
      game.goToTrain.restore();
    });

    it("should properly handle 'list' command", () => {
      const p = player;
      const spySendStr = sinon.spy(p, 'sendString');
      const spyStoreList = sinon.spy(Game, 'storeList');

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('list');
      expect(spySendStr.getCall(0).args[0]).to.
        equal("<red><bold>You're not in a store!</bold></red>");
      expect(spyStoreList.calledOnce).to.be.false;

      p.room = roomDb.findByNameFull("Bobs Weapon Shop");
      game.handle('list');
      expect(spySendStr.getCall(1).args[0]).to.have.
        string("Rusty Knife");
      expect(spyStoreList.calledOnce).to.be.true;

      p.sendString.restore();
      Game.storeList.restore();
    });

    it("should properly handle 'buy' command", () => {
      const p = player;
      const spySendStr = sinon.spy(p, 'sendString');
      const stubBuy = sinon.stub(game, 'buy').callsFake();

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('buy shortsword');
      expect(spySendStr.getCall(0).args[0]).to.
        equal("<red><bold>You're not in a store!</bold></red>");
      expect(stubBuy.calledOnce).to.be.false;

      p.room = roomDb.findByNameFull("Bobs Weapon Shop");
      game.handle('buy shortsword');
      expect(stubBuy.calledOnce).to.be.true;
      expect(stubBuy.getCall(0).args[0]).to.equal("shortsword");

      p.sendString.restore();
      game.buy.restore();
    });

    it("should properly handle 'sell' command", () => {
      const p = player;
      const spySendStr = sinon.spy(p, 'sendString');
      const stubSell = sinon.stub(game, 'sell').callsFake();

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('sell shortsword');
      expect(spySendStr.getCall(0).args[0]).to.
        equal("<red><bold>You're not in a store!</bold></red>");
      expect(stubSell.calledOnce).to.be.false;

      p.room = roomDb.findByNameFull("Bobs Weapon Shop");
      game.handle('sell shortsword');
      expect(stubSell.calledOnce).to.be.true;
      expect(stubSell.getCall(0).args[0]).to.equal("shortsword");

      p.sendString.restore();
      game.sell.restore();
    });

    const testAttackCmd = (cmd) => {
      const stub = sinon.stub(game, 'playerAttack').callsFake();
      game.handle(cmd + ' thug');
      expect(stub.getCall(0).args[0]).to.
        equal('thug');
      game.playerAttack.restore();
    };

    it("should properly handle 'attack' command", () => {
      testAttackCmd('attack');
    });

    it("should properly handle 'a' command", () => {
      testAttackCmd('a');
    });

    // ------------------------------------------------------------------------
    //  GOD access commands
    // ------------------------------------------------------------------------

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

    // ------------------------------------------------------------------------
    //  ADMIN access commands
    // ------------------------------------------------------------------------

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
      const stubLoadRoomDb = sinon.stub(roomDb, 'loadTemplates').callsFake();
      const stubLoadStoreDb = sinon.stub(storeDb, 'load').callsFake();
      const stubLoadEnemyDb = sinon.stub(enemyTpDb, 'load').callsFake();
      const spySendStr = sinon.spy(player, 'sendString');
      const p = player;

      p.rank = PlayerRank.REGULAR;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.false;

      p.rank = PlayerRank.GOD;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.false;

      p.rank = PlayerRank.ADMIN;
      expect(stubLoadItemDb.calledOnce).to.be.false;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.true;
      expect(spySendStr.getCall(0).args[0]).to.have.
        string("Item Database Reloaded!");
      expect(stubLoadItemDb.calledOnce).to.be.true;

      expect(stubLoadRoomDb.calledOnce).to.be.false;
      game.handle("reload rooms");
      expect(spySendStr.getCall(1).args[0]).to.have.
        string("Room Database Reloaded!");
      expect(stubLoadRoomDb.calledOnce).to.be.true;

      expect(stubLoadStoreDb.calledOnce).to.be.false;
      game.handle("reload stores");
      expect(spySendStr.getCall(2).args[0]).to.have.
        string("Store Database Reloaded!");
      expect(stubLoadStoreDb.calledOnce).to.be.true;

      expect(stubLoadEnemyDb.calledOnce).to.be.false;
      game.handle("reload enemies");
      expect(spySendStr.getCall(3).args[0]).to.have.
        string("Enemy Database Reloaded!");
      expect(stubLoadEnemyDb.calledOnce).to.be.true;

      game.handle("reload");
      expect(spySendStr.getCall(4).args[0]).to.have.
        string("Usage: reload <db>");

      game.handle("reload invalidDb");
      expect(spySendStr.getCall(5).args[0]).to.have.
        string("Invalid Database Name!");

      player.sendString.restore();
      itemDb.load.restore();
      roomDb.loadTemplates.restore();
      storeDb.load.restore();
      enemyTpDb.load.restore();
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

    // ------------------------------------------------------------------------
    //  Command not recognized, send to room
    // ------------------------------------------------------------------------

    it("should send command to room if not recognized", () => {
      const p = player;
      p.name = "Test";
      game.handle("this is a test");
      const expectedMsg =
        "<bold>Test says: " + cc('dim') + "this is a test</bold>";
      expect(stubSendRoom.getCall(0).args[0]).to.equal(expectedMsg);
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

    const expectedText = "<red><bold>" +
      player.name + " leaves to edit stats" +
      "</bold></red>\r\n";

    game.goToTrain();
    expect(stubAddHandler.calledOnce).to.be.true;
    expect(stubConnSendMsg.getCall(0).args[0]).to.
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
    const stub = stubConnSendMsg;
    const p = player;
    const recipient = new Player();
    const testMsg = "Test whisper...";
    let expectedMsg = "<red><bold>" +
      "Error, cannot find user</bold></red>\r\n";
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
      expectedMsg = "<yellow>" + p.name + " whispers to you: " +
        "</yellow>" + testMsg + "\r\n";
    expect(stub.getCall(2).args[0]).to.equal(expectedMsg);

    playerDb.map.delete(recipient.id);
  });

  it ("should properly display who list", () => {
    const originalPlayerMap = playerDb.map;
    playerDb.map = new Map();
    expect(playerDb.size()).to.equal(0);
    const admin = new Player();
    admin.name = "TestAdmin";
    admin.rank = PlayerRank.ADMIN;
    admin.active = false;
    admin.loggedIn = true;
    admin.level = 100;
    playerDb.add(admin);
    const god = new Player();
    god.name = "TestGod";
    god.rank = PlayerRank.GOD;
    god.active = true;
    god.loggedIn = true;
    god.level = 505;
    playerDb.add(god);
    const user = new Player();
    user.name = "TestUser";
    user.rank = PlayerRank.REGULAR;
    user.active = false;
    user.loggedIn = false;
    user.level = 10;
    playerDb.add(user);
    expect(playerDb.size()).to.equal(3);
    const whoHeader = "<white><bold>" +
      "--------------------------------------------------------------------------------\r\n" +
      " Name             | Level     | Activity | Rank\r\n" +
      "--------------------------------------------------------------------------------\r\n";
    const whoFooter =
      "--------------------------------------------------------------------------------" +
      "</bold></white>";

    let expectedText = whoHeader +
      " TestAdmin        | 100       | " +
      "<yellow>Inactive</yellow>" +
       " | <green>ADMIN</green>\r\n" +
      " TestGod          | 505       | " +
      "<green>Online  </green>" +
       " | <yellow>GOD</yellow>\r\n" +
      " TestUser         | 10        | " +
      "<red>Offline </red>" +
       " | <white>REGULAR</white>\r\n" +
       whoFooter;

    expect(Game.whoList('all')).to.equal(expectedText);

    admin.loggedIn = false;
    expectedText = whoHeader +
      " TestGod          | 505       | " +
      "<green>Online  </green>" +
      " | <yellow>GOD</yellow>\r\n" +
      whoFooter;

    expect(Game.whoList()).to.equal(expectedText);

    playerDb.map = originalPlayerMap;
  });

  it ("should properly display help", () => {
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
        " attack <enemy>             - Attack an enemy\r\n" +
        "</bold></white>";

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

      expect(Game.printHelp(PlayerRank.REGULAR)).to.
        equal(help + end);
      expect(Game.printHelp(PlayerRank.GOD)).to.
        equal(help + god + end);
      expect(Game.printHelp(PlayerRank.ADMIN)).to.
        equal(help + god + admin + end);
  });

  it("should properly print player's experience", () => {
    const p = game.player;
    p.level = 2;
    p.experience = 25;
    const expectedText = "<white><bold>" +
      " Level:         " + p.level + "\r\n" +
      " Experience:    " + p.experience + "/" +
      p.needForLevel(p.level + 1) + " (" +
      Math.round(100 * p.experience / p.needForLevel(p.level + 1)) +
      "%)" + "</bold></white>";
    expect(game.printExperience()).to.
      equal(expectedText);
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
    const experienceText = "<white><bold>" +
      " Level:         " + p.level + "\r\n" +
      " Experience:    " + p.experience + "/" +
      p.needForLevel(p.level + 1) + " (" +
      Math.round(100 * p.experience / p.needForLevel(p.level + 1)) +
      "%)" + "</bold></white>";

    const expectedText = "<white><bold>" +
    "---------------------------------- Your Stats ----------------------------------\r\n" +
    " Name:          " + p.name + "\r\n" +
    " Rank:          " + p.rank.toString() + "\r\n" +
    " HP/Max:        " + p.hitPoints + "/" + attr(Attribute.MAXHITPOINTS) +
    "  (" + Math.round(100 * p.hitPoints / attr(Attribute.MAXHITPOINTS)) + "%)" +
    "\r\n" + experienceText + "\r\n" +
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
    expect(game.printStats()).to.
      equal(expectedText)
  });

  it("should properly print player's inventory", () => {
    const p = player;
    const weapon = itemDb.findByNameFull("Shortsword");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Small Healing Potion");
    p.pickUpItem(weapon);
    p.pickUpItem(armor);
    p.pickUpItem(potion);
    p.money = 123;
    expect(p.items).to.equal(3);

    let expectedText = "<white><bold>" +
      "-------------------------------- Your Inventory --------------------------------" +
      "\r\n" + " Items:  " + weapon.name + ", " +
      armor.name + ", " + potion.name + "\r\n" +
      " Weapon: NONE!" + "\r\n" + " Armor:  NONE!" +
      "\r\n" + " Money:  $" + p.money + "\r\n" +
      "--------------------------------------------------------------------------------" +
      "</bold></white>";

    expect(game.printInventory()).to.equal(expectedText);

    p.useWeapon(0);
    p.useArmor(1);

    expectedText = "<white><bold>" +
    "-------------------------------- Your Inventory --------------------------------" +
    "\r\n" + " Items:  " + weapon.name + ", " +
    armor.name + ", " + potion.name + "\r\n" +
    " Weapon: " + weapon.name + "\r\n" +
    " Armor:  " + armor.name + "\r\n" +
    " Money:  $" + p.money + "\r\n" +
    "--------------------------------------------------------------------------------" +
    "</bold></white>";

    expect(game.printInventory()).to.equal(expectedText);

  });

  it("should properly use item from player's inventory", () => {
    const spy = sinon.spy(game, 'useItem');
    const stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();
    const p = player;
    p.name = "Test";
    const weapon = itemDb.findByNameFull("Rusty Knife");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Small Healing Potion");

    const expectedMsg = "<red><bold>" +
      "Could not find that item!" +
      "</bold></red>\r\n";

    game.useItem('Invalid Item');
    expect(spy.returnValues[0]).to.be.false;
    expect(stubConnSendMsg.getCall(0).args[0]).to.equal(expectedMsg);

    p.pickUpItem(weapon);
    p.pickUpItem(armor);
    p.pickUpItem(potion);

    expect(p.weapon).to.equal(-1);
    game.useItem(weapon.name);
    expect(spy.returnValues[1]).to.be.true;
    expect(stubSendRoom.getCall(0).args[0]).to.
      equal("<green><bold>Test arms a Rusty Knife</bold></green>");
    expect(p.weapon).to.equal(0);

    expect(p.armor).to.equal(-1);
    game.useItem(armor.name);
    expect(spy.returnValues[2]).to.be.true;
    expect(stubSendRoom.getCall(1).args[0]).to.
      equal("<green><bold>Test puts on a Leather Armor</bold></green>");
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
    const expectedMsg = "<red><bold>" +
      "Could not Remove item!" +
      "</bold></red>\r\n";

    game.removeItem('invalid');
    expect(spy.returnValues[0]).to.be.false;
    expect(stubConnSendMsg.getCall(0).args[0]).to.equal(expectedMsg);

    game.removeItem('weapon');
    expect(spy.returnValues[1]).to.be.false;
    expect(stubConnSendMsg.getCall(1).args[0]).to.equal(expectedMsg);

    game.removeItem('armor');
    expect(spy.returnValues[2]).to.be.false;
    expect(stubConnSendMsg.getCall(2).args[0]).to.equal(expectedMsg);

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
    Game.sendRoom.restore();
  });

  it("should properly print room's info", () => {
    const room = roomDb.findByNameFull("Training Room")

    const expectedText = "\r\n" + "<bold><white>" +
      room.name + "</white></bold>" +
      "\r\n" + "<bold><magenta>" +
      room.description + "</magenta></bold>" +
      "\r\n" + "<bold><green>" +
      "exits: NORTH  " + "</green></bold>" +
      "\r\n";

    expect(Game.printRoom(room)).to.equal(expectedText);

    room.money = 123;

    let extraText = "<bold><yellow>" +
      "You see: $123" +
      "</yellow></bold>" + "\r\n";

    expect(Game.printRoom(room)).to.
      equal(expectedText + extraText);

    const weapon = itemDb.findByNameFull("Shortsword");
    const armor = itemDb.findByNameFull("Leather Armor");
    room.items = [weapon, armor];

    extraText = "<bold><yellow>" +
      "You see: $123, Shortsword, Leather Armor" +
      "</yellow></bold>" + "\r\n";

    expect(Game.printRoom(room)).to.
      equal(expectedText + extraText);

    player.name = "Test Player";
    room.addPlayer(player);

    extraText += "<bold><cyan>" +
      "People: Test Player" +
      "</cyan></bold>" + "\r\n";

    expect(Game.printRoom(room)).to.
      equal(expectedText + extraText);

    const banditTp = enemyTpDb.findByNameFull("Bandit");
    const bandit = enemyDb.create(banditTp, room);
    const thiefTp = enemyTpDb.findByNameFull("Thief");
    const thief = enemyDb.create(thiefTp, room);

    extraText += "<bold><red>" +
      "Enemies: Bandit, Thief" +
      "</red></bold>" + "\r\n";

    expect(Game.printRoom(room)).to.
      equal(expectedText + extraText);

    room.removePlayer(player);
    enemyDb.delete(bandit);
    enemyDb.delete(thief);
    room.items = [];
    room.money = 0;

  });

  it("should properly send text to players in a room", () => {
    const room = roomDb.findByNameFull("Training Room");
    const testP1 = new Player();
    const testP2 = new Player();
    const stubP1SendString = sinon.stub(testP1, 'sendString').callsFake();
    const stubP2SendString = sinon.stub(testP2, 'sendString').callsFake();

    room.addPlayer(testP1);
    room.addPlayer(testP2);

    Game.sendRoom("Testing", room);

    expect(stubP1SendString.calledOnce).to.be.true;
    expect(stubP2SendString.calledOnce).to.be.true;

    room.removePlayer(testP1);
    room.removePlayer(testP2);

    testP1.sendString.restore();
    testP2.sendString.restore();
  });

  it("should properly move player to new rooms", () => {
    const trainingRoom = roomDb.findByNameFull("Training Room");
    const avenue = roomDb.findByNameFull("Avenue");

    const testP1 = player;
    testP1.name = "TP1";
    testP1.room = trainingRoom;
    const stubP1SendString = sinon.stub(testP1, 'sendString').callsFake();

    const testP2 = new Player();
    testP2.name = "TP2";
    testP2.room = trainingRoom;
    const stubP2SendString = sinon.stub(testP2, 'sendString').callsFake();

    const testP3 = new Player();
    testP3.name = "TP3";
    testP3.room = avenue;
    const stubP3SendString = sinon.stub(testP3, 'sendString').callsFake();

    trainingRoom.addPlayer(testP1);
    trainingRoom.addPlayer(testP2);
    avenue.addPlayer(testP3);

    game.move('INVALID DIRECTION');

    expect(stubP1SendString.getCall(0).args[0]).to.have.
      string("<red>Invalid direction!</red>");

    game.move(Direction.SOUTH);
    expect(stubP1SendString.getCall(1).args[0]).to.have.
      string("<red>TP1 bumps into the wall to the SOUTH!!!</red>");
    expect(stubP2SendString.getCall(0).args[0]).to.have.
      string("<red>TP1 bumps into the wall to the SOUTH!!!</red>");

    game.move(Direction.NORTH);
    expect(stubP1SendString.getCall(2).args[0]).to.have.
      string("<green>You walk NORTH.</green>");

    expect(stubP2SendString.getCall(1).args[0]).to.have.
      string("<green>TP1 leaves to the NORTH.</green>");

    expect(stubP3SendString.getCall(0).args[0]).to.have.
      string("<green>TP1 enters from the SOUTH.</green>");

    expect(stubP1SendString.getCall(3).args[0]).to.have.
      string("<cyan>People: TP3, TP1</cyan>");

    trainingRoom.removePlayer(testP2);
    avenue.removePlayer(testP1);
    avenue.removePlayer(testP3);

    testP1.sendString.restore();
    testP2.sendString.restore();
    testP3.sendString.restore();
  });

  it("should properly allow player to pick up money from rooms", () => {
    const room = roomDb.findByNameFull("Training Room");
    const p = player;
    p.name = "Test";
    p.room = room;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.money = 150;

    game.getItem('$Invalid Amount');
    expect(stubSendString.getCall(0).args[0]).to.
    equal("<red><bold>You don't see that here!</bold></red>");

    game.getItem('$1000');
    expect(stubSendString.getCall(1).args[0]).to.
      equal("<red><bold>There isn't that much here!</bold></red>");

    game.getItem('$125');
    expect(stubSendString.getCall(2).args[0]).to.
      equal("<cyan><bold>Test picks up $125.</bold></cyan>");
    expect(p.money).to.equal(125);
    expect(room.money).to.equal(25);

    room.removePlayer(p);
    room.money = 0;

    p.sendString.restore();
  });

  it("should properly allow player to pick up items from rooms", () => {
    const room = roomDb.findByNameFull("Training Room");
    const sword = itemDb.findByNameFull("Shortsword");
    const p = player;
    p.name = "Test";
    p.room = room;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.addItem(sword);

    game.getItem('Invalid Item');
    expect(stubSendString.getCall(0).args[0]).to.
      equal("<red><bold>You don't see that here!</bold></red>");

    p.items = 16;
    game.getItem('Shortsword');
    expect(stubSendString.getCall(1).args[0]).to.
      equal("<red><bold>You can't carry that much!</bold></red>");

    expect(p.room.items[0]).to.equal(sword);
    p.items = 0;
    game.getItem('Shortsword');
    expect(stubSendString.getCall(2).args[0]).to.
      equal("<cyan><bold>Test picks up Shortsword.</bold></cyan>");

    expect(p.inventory[0]).to.equal(sword);
    expect(p.room.items).to.be.empty;

    room.items = [];
    room.removePlayer(p);

    p.sendString.restore();
  });

  it("should properly allow player to drop money in rooms", () => {
    const room = roomDb.findByNameFull("Training Room");
    const p = player;
    p.name = "Test";
    p.room = room;
    p.money = 150;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.money = 0;

    game.dropItem('$Invalid Amount');
    expect(stubSendString.getCall(0).args[0]).to.
    equal("<red><bold>You don't have that!</bold></red>");

    game.dropItem('$1000');
    expect(stubSendString.getCall(1).args[0]).to.
      equal("<red><bold>You don't have that much!</bold></red>");

    game.dropItem('$125');
    expect(stubSendString.getCall(2).args[0]).to.
      equal("<cyan><bold>Test drops $125.</bold></cyan>");
    expect(p.money).to.equal(25);
    expect(room.money).to.equal(125);

    room.removePlayer(p);
    room.money = 0;

    p.sendString.restore();
  });

  it("should properly allow player to drop items in rooms", () => {
    const room = roomDb.findByNameFull("Training Room");
    const sword = itemDb.findByNameFull("Shortsword");
    const p = player;
    p.name = "Test";
    p.room = room;
    p.pickUpItem(sword);

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.items = [];

    game.dropItem('Invalid Item');
    expect(stubSendString.getCall(0).args[0]).to.
      equal("<red><bold>You don't have that!</bold></red>");

    expect(p.inventory[0]).to.equal(sword);
    game.dropItem('Shortsword');
    expect(stubSendString.getCall(1).args[0]).to.
      equal("<cyan><bold>Test drops Shortsword.</bold></cyan>");

    expect(p.inventory[0]).to.be.undefined;
    expect(p.room.items[0]).to.equal(sword);

    room.items = [];
    room.removePlayer(p);

    p.sendString.restore();
  });

  it("should properly prints out info of a store", () => {
    const store = new Store();
    const knife = itemDb.findByNameFull("Knife");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Minor Healing Potion");
    store.name = "Test Store";
    store.items = [knife, armor, potion];
    knife.price = 100;
    armor.price = 200;
    potion.price = 50;
    storeDb.add(store);
    const expectedText = "<white><bold>" +
        "--------------------------------------------------------------------------------\r\n" +
        " Welcome to " + store.name + "!\r\n" +
        "--------------------------------------------------------------------------------\r\n" +
        " Item                           | Price\r\n" +
        "--------------------------------------------------------------------------------\r\n" +
        " Knife                          | 100\r\n" +
        " Leather Armor                  | 200\r\n" +
        " Minor Healing Potion           | 50\r\n" +
        "--------------------------------------------------------------------------------\r\n" +
        "</bold></white>";
    expect(Game.storeList('INVALID ID')).to.be.false;
    expect(Game.storeList(store.id)).to.equal(expectedText);
    storeDb.map.delete(store.id);
  });

  it("should properly allow player to buy items from a store", () => {
    const p = player;
    p.name = "Test";
    p.room = new Room();

    expect(game.buy('Item from Invalid Store')).to.be.false;

    const room = roomDb.findByNameFull("Samuels Armorsmith");
    p.room = room;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.money = 0;

    game.buy('Invalid Item');
    expect(stubSendString.getCall(0).args[0]).to.have.
      string("<red><bold>Sorry, we don't have that item!</bold></red>");

    game.buy('Chainmail Armor');
    expect(stubSendString.getCall(1).args[0]).to.have.
      string("<red><bold>Sorry, but you can't afford that!</bold></red>");

    p.money = 100;
    p.items = 16;

    game.buy('Chainmail Armor');
    expect(stubSendString.getCall(2).args[0]).to.have.
      string("<red><bold>Sorry, but you can't carry that much!</bold></red>");

    p.items = 0;
    game.buy('Chainmail Armor');
    expect(stubSendString.getCall(3).args[0]).to.have.
      string("<cyan><bold>Test buys a Chainmail Armor</bold></cyan>");

    expect(p.money).to.equal(20); // armor costs 80 in items.json:item 47

    p.sendString.restore();
  });

  it("should properly allow player to sell items to a store", () => {
    const p = player;
    p.name = "Test";
    p.room = new Room();

    expect(game.sell('Item from Invalid Store')).to.be.false;

    const room = roomDb.findByNameFull("The Insane Alchemist's Workshop");
    p.room = room;
    p.money = 0;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);

    const sword = itemDb.findByNameFull("Shortsword");
    const potion = itemDb.findByNameFull("Minor Healing Potion")

    game.sell("Shortsword");
    expect(stubSendString.getCall(0).args[0]).to.have.
      string("<red><bold>Sorry, you don't have that!</bold></red>");

    p.pickUpItem(sword);
    game.sell("Shortsword");
    expect(stubSendString.getCall(1).args[0]).to.have.
      string("<red><bold>Sorry, we don't want that item!</bold></red>");

    p.sendString.restore();

  });

  it("should properly allow enemies to attack players", () => {
    const p = player;
    p.name = "TestPlayer";
    const stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();
    const stubPlayerKilled = sinon.stub(Game, 'playerKilled').callsFake();

    const room = new Room();
    const thiefTp = enemyTpDb.findByNameFull("Thief");
    const thief = enemyDb.create(thiefTp, room);

    p.room = room;
    room.addPlayer(p);

    const e = thief.tp;

    e.accuracy = -100;
    Game.enemyAttack(thief);
    expect(stubSendRoom.getCall(0).args[0]).to.
      equal("<white>Thief swings at TestPlayer but misses!</white>");


    let numCall = 0;
    const testDamage = (min, max) => {
      p.setBaseAttr(Attribute.STRENGTH, 0);
      const sD = e.strikeDamage;
      let damage;
      for (let i = 0; i < 10; i++) {
        p.hitPoints = 10;
        damage = p.hitPoints;
        Game.enemyAttack(thief);
        damage -= p.hitPoints;
        expect(stubSendRoom.getCall(++numCall).args[0]).to.
          equal("<red>Thief hits TestPlayer for " +
                 damage + " damage!</red>");
        expect(damage).to.be.within(min + sD, max + sD);
      }
    }

    e.accuracy = 200;

    // bare fist
    e.weapon = 0;
    testDamage(1, 3);

    e.weapon = 42;
    // combat with dagger
    testDamage(3, 6);

    p.hitPoints = 1;
    expect(stubPlayerKilled.calledOnce).to.be.false;
    Game.enemyAttack(thief);
    expect(stubPlayerKilled.calledOnce).to.be.true;

    enemyDb.delete(thief);
    enemyTpDb.load(); // reset changes
    Game.sendRoom.restore();
    Game.playerKilled.restore();
  });

  it("should properly handle when player is killed", () => {
    const p = player;
    p.name = "TestPlayer";
    const stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();
    const stubSendStr = sinon.stub(p, 'sendString').callsFake();

    const room = new Room();
    const armor = itemDb.findByNameFull("Leather Armor");
    p.money = 105;
    p.experience = 55;
    p.pickUpItem(armor);
    p.useArmor(0);
    expect(p.Armor()).to.equal(armor);

    room.addPlayer(p);
    room.money = 0;
    room.items = [];

    Game.playerKilled(p);
    expect(stubSendRoom.getCall(0).args[0]).to.
      equal("<red><bold>TestPlayer has died!</bold></red>");
    expect(stubSendRoom.getCall(1).args[0]).to.
      equal("<cyan>$" + room.money + " drops to the ground.</cyan>");
    expect(room.money).to.equal(10);
    expect(stubSendRoom.getCall(2).args[0]).to.
      equal("<cyan>Leather Armor drops to the ground.</cyan>");
    expect(room.items[0].name).to.be.equal("Leather Armor");
    expect(stubSendStr.getCall(0).args[0]).to.
      equal("<white><bold>You have died, " +
            "but have been ressurected in " +
            "Town Square</bold></white>");

    expect(stubSendStr.getCall(1).args[0]).to.
      equal("<red><bold>You have lost " +
            "5 experience!</bold></red>");

    expect(stubSendRoom.getCall(3).args[0]).to.
      equal("<white><bold>TestPlayer appears out of " +
            "nowhere!!</bold></white>");

    p.room.removePlayer(p);
    p.sendString.restore();
    Game.sendRoom.restore();
  });

  it("should properly allow players to attack enemies", () => {
    const p = player;
    const timer = Game.getTimer();

    p.name = "TestPlayer";
    const stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();
    const stubSendStr = sinon.stub(p, 'sendString').callsFake();
    const stubEnemyKilled = sinon.stub(Game, 'enemyKilled').callsFake();

    const room = new Room();
    const banditTp = enemyTpDb.findByNameFull("Bandit");
    const bandit = enemyDb.create(banditTp, room);

    p.room = room;
    room.addPlayer(p);

    p.nextAttackTime = timer.getMS() + 500;
    game.playerAttack("bandit");
    expect(stubSendStr.getCall(0).args[0]).to.
      equal("<red><bold>You can't attack yet!</bold></red>");

    p.nextAttackTime = timer.getMS() - 500;
    room.removeEnemy(bandit);
    game.playerAttack("bandit");
    expect(stubSendStr.getCall(1).args[0]).to.
      equal("<red><bold>You don't see that here!</bold></red>");

    bandit.tp.dodging = 0;
    p.setBaseAttr(Attribute.ACCURACY, -100);
    room.addEnemy(bandit);
    game.playerAttack("bandit");
    expect(stubSendRoom.getCall(0).args[0]).to.
      equal("<white>TestPlayer swings at Bandit but misses!</white>");

    p.setBaseAttr(Attribute.ACCURACY, 100);
    bandit.tp.damageAbsorb = 0;

    let numCall = 0;
    const testDamage = (min, max) => {
      p.setBaseAttr(Attribute.STRENGTH, 10);
      const sD = p.GetAttr(Attribute.STRIKEDAMAGE);
      let damage;
      for (let i = 0; i < 10; i++) {
        p.nextAttackTime = timer.getMS() - 500;
        bandit.hitPoints = bandit.tp.hitPoints;
        game.playerAttack("bandit");
        damage = bandit.tp.hitPoints - bandit.hitPoints;
        expect(stubSendRoom.getCall(++numCall).args[0]).to.
          equal("<red>TestPlayer hits Bandit for " +
                 damage + " damage!</red>");
        expect(damage).to.be.within(min + sD, max + sD);
      }
    }

    // combat with bare-fist
    testDamage(1, 3);

    const dagger = itemDb.findByNameFull("Dagger");
    p.pickUpItem(dagger);
    p.useWeapon(0);

    // combat with dagger
    testDamage(3, 6);

    bandit.hitPoints = 1;
    expect(stubEnemyKilled.calledOnce).to.be.false;
    p.nextAttackTime = Util.getTimeMS() - 500;
    game.playerAttack("bandit");
    expect(stubEnemyKilled.calledOnce).to.be.true;

    enemyDb.delete(bandit);
    enemyTpDb.load(); // reset changes
    p.sendString.restore();
    Game.sendRoom.restore();
    Game.enemyKilled.restore();
  });

  it("should properly handle when enemy is killed", () => {
    const p = player;
    p.name = "TestPlayer";
    const stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();
    const stubSendStr = sinon.stub(p, 'sendString').callsFake();

    const room = new Room();
    const banditTp = enemyTpDb.findByNameFull("Bandit");
    const bandit = enemyDb.create(banditTp, room);

    p.room = room;
    room.money = 0;
    room.items = [];
    bandit.tp.loot[0].itemId = 42;
    bandit.tp.loot[0].chance = 100;
    bandit.tp.experience = 25;
    bandit.tp.moneyMin = 10;
    bandit.tp.moneyMax = 20;
    room.addPlayer(p);

    Game.enemyKilled(bandit, p);
    expect(stubSendRoom.getCall(0).args[0]).to.
      equal("<cyan><bold>Bandit has died!</bold></cyan>");
    expect(stubSendRoom.getCall(1).args[0]).to.
      equal("<cyan>$" + room.money + " drops to the ground.</cyan>");
    expect(room.money).to.be.within(10, 20);
    expect(stubSendRoom.getCall(2).args[0]).to.
      equal("<cyan>Dagger drops to the ground.</cyan>");
    expect(room.items[0].name).to.be.equal("Dagger");
    expect(stubSendStr.getCall(0).args[0]).to.
      equal("<cyan><bold>You gain 25 experience.</bold></cyan>");

    enemyTpDb.load(); // reset changes
    p.sendString.restore();
    Game.sendRoom.restore();
  });

});
