const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Logon = require(path.join(__dirname, '..', 'src', 'Logon'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const { playerDb } = require(path.join(__dirname, '..', 'src', 'Databases'));

describe("Logon", () => {
  const conn = new Connection(new net.Socket(), telnet);

  const testUser = 'UnitTestUser102';
  const testPass = "validPassword";
  const dataPath =
    path.join(__dirname, '..', 'data',
              'players', testUser + '.json');
  let player;
  beforeEach(() => {
    player = new Player();
    player.name = testUser;
    player.password = testPass;
    playerDb.addPlayer(player);
    player.connection = conn;
  });

  afterEach(() => {
    playerDb.removePlayer(player);
  });

  const cc = telnet.cc;
  let loginHandler, stubSendMsg;

  beforeEach(() => {
    loginHandler = new Logon(conn);
    const stub = sinon.stub(conn, 'sendMessage');
    stub.callsFake(msg => {
      var args = stub.args;
      if (args.length > 0)
        return telnet.translate(stub.args[stub.callCount - 1][0])
    });
    stubSendMsg = stub;
  });

  afterEach(() => {
    conn.sendMessage.restore();
  })

  it("should properly diplay welcome on enter", () => {
    const expectedMsg = "<bold><red>Weclome to SimpleMUD</red></bold>\r\n" +
                        "<white>Please enter your name, or" +
                        " \"new\" if you are new: </white>";
    loginHandler.enter();

    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.getCall(0).args[0]).to.equal(expectedMsg);
  });

  it("should properly disconnect if max invalid response reached", () => {
    const stubCloseConn = sinon.stub(conn, 'close').callsFake();

    loginHandler.numErrors = 5;
    loginHandler.handle();

    expect(stubCloseConn.calledOnce).to.be.true;
    expect(stubSendMsg.calledOnce).to.be.true;

    loginHandler.numErrors = 0;
    conn.close.restore();
  });

  it("should properly handle new connection -- 'new'", () => {
    loginHandler.handle('new');
    const expectedMsg =
      "<yellow>Please enter your desired name: </yellow>";
    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.getCall(0).args[0]).to.equal(expectedMsg);
    expect(loginHandler.state).to.equal("NEWUSER");
  });

  it("should properly handle new connection -- 'non-existing user'", () => {
    loginHandler.handle('INVALID');
    let expectedMsg =
      "<red><bold>Sorry, the user '<white>INVALID</white>" +
      "' does not exist\r\n" +
      "Please enter your name, or \"new\" if you are new: " +
      "</bold></red>";
    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.getCall(0).args[0]).to.equal(expectedMsg);
    expect(loginHandler.state).to.equal("NEWCONNECTION");
  });

  it ("should properly validate acceptable user names", () => {
    const validate = loginHandler.acceptableName;
    const invalidNames = ["te", "test$$@", "!test",
                          "AReallyLongUserName", "Test User"];
    const validNames = ["Tom", "test2", "PhatomOfTheNight"];
    invalidNames.forEach(name => {
      expect(validate(name)).to.be.false;
    })
    validNames.forEach(name => {
      expect(validate(name)).to.be.true;
    })
  });

  it("should properly register new user", () =>{

    const stubGoToGame =
      sinon.stub(loginHandler, 'goToGame').callsFake();
    loginHandler.handle('new');
    let expectedMsg =
      "<red><bold>Sorry, the name '<white>" + testUser +
      "</white>' has already been taken.\r\n" +
      "<yellow>Please enter your desired name: </yellow>" +
      "</bold></red>";
    loginHandler.handle(testUser);
    expect(stubSendMsg.getCall(1).args[0]).to.equal(expectedMsg);
    expectedMsg =
      "<red><bold>Sorry, the name '<white>te$t</white>" +
      "' is unacceptible.\r\n" +
      "<yellow>Please enter your desired name: </yellow>" +
      "</bold></red>";
    loginHandler.handle('te$t');
    expect(stubSendMsg.getCall(2).args[0]).to.equal(expectedMsg);
    expectedMsg =
      "<green>Please enter your desired password: </green>";
    loginHandler.handle("NewTestPlayer");
    expect(stubSendMsg.getCall(3).args[0]).to.equal(expectedMsg);
    expectedMsg = "<bold><red>INVALID PASSWORD!</red>\r\n" +
                  "<green>Please enter your desired password: " +
                  "</green></bold>";
    loginHandler.handle("bad password");
    expect(stubSendMsg.getCall(4).args[0]).to.equal(expectedMsg);
    expectedMsg = "<green>Thank you! " +
      "You are now entering the realm..." +
      "</green>\r\n";
    loginHandler.handle(testPass);
    expect(stubSendMsg.getCall(5).args[0]).to.equal(expectedMsg);
    expect(fs.existsSync(dataPath)).to.be.true;
    expect(stubGoToGame.getCall(0).args[0]).to.be.true;
    loginHandler.goToGame.restore();
    playerDb.removePlayer(playerDb.findByNameFull("NewTestPlayer"));
  });

  it("should properly handle new connection -- 'existing user'", () => {
    const stubGoToGame =
      sinon.stub(loginHandler, 'goToGame').callsFake();
    loginHandler.handle(testUser);
    let expectedMsg =
      "<green><bold>Welcome, <white>" + testUser +
      "</white>\r\n" +
      "Please enter your password: </bold></green>";
    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.getCall(0).args[0]).to.equal(expectedMsg);
    expectedMsg =
      "<bold><red>INVALID PASSWORD!</red>\r\n" +
      "<green>Please enter your password: " +
      "</green></bold>";
    loginHandler.handle("bad password");
    expect(stubSendMsg.getCall(1).args[0]).to.equal(expectedMsg);
    expectedMsg = "<green>Thank you! " +
      "You are now entering the realm..." +
      "</green>\r\n";
    loginHandler.handle(testPass);
    expect(stubSendMsg.getCall(2).args[0]).to.equal(expectedMsg);
    expect(stubGoToGame.getCall(0).args[0]).to.be.false;
    loginHandler.goToGame.restore();
  });

  it("should properly transition to Game handler -- loggedIn = false", () =>{
      const stubConnClose =
        sinon.stub(conn, 'close').callsFake();
      const player = playerDb.findByNameFull(testUser);
      player.loggedIn = false;
      conn.addHandler(loginHandler);
      sinon.stub(conn, 'addHandler').callsFake();
      expect(conn._handler()).to.equal(loginHandler);
      loginHandler.name = testUser;
      loginHandler.goToGame(true);
      expect(player.newbie).to.be.true;
      expect(player.connection).to.equal(conn);
      expect(stubConnClose.calledOnce).to.be.false;
      conn.clearHandlers();
      conn.addHandler.restore();
      conn.close.restore();
  });

  it("should properly transition to Game handler -- loggedIn = true", () =>{
      const stubConnClose =
        sinon.stub(conn, 'close').callsFake();
      const player = playerDb.findByNameFull(testUser);
      conn.addHandler(loginHandler);
      expect(conn._handler()).to.equal(loginHandler);
      loginHandler.name = testUser;
      player.loggedIn = true;
      loginHandler.goToGame(false);
      expect(player.newbie).to.be.false;
      expect(player.connection).to.equal(conn);
      expect(conn._handler()).to.be.an.instanceof(Game);
      expect(stubConnClose.calledOnce).to.be.true;
      conn.clearHandlers();
      conn.close.restore();
  });

});
