const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Logon = require(path.join(__dirname, '..', 'src', 'Logon'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));
const { playerDb } = require(path.join(__dirname, '..', 'src', 'Databases'));

describe("Logon", () => {
  const conn = new Connection(new net.Socket(), telnet);

  const testUser = 'UnitTestUser102';
  const testPass = "validPassword";
  const dataPath =
    path.join(__dirname, '..', 'data',
              'players', testUser + '.json');
  before(() => {
    const player = playerDb.findByNameFull(testUser);
    if (player) playerDb.removePlayer(player);
  });

  after(() => {
    const player = playerDb.findByNameFull(testUser);
    if (player) playerDb.removePlayer(player);
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

  it("should properly display welcome on enter", () => {
    const expectedMsg = cc('bold') + cc('red') + "Weclome to SimpleMUD" +
                        cc('reset') + cc('bold') + cc('reset') + cc('newline') +
                        "Please enter your name, or \"new\" if you are new: ";
    loginHandler.enter();

    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.returnValues[0]).to.equal(expectedMsg);
  });

  it("should properly disconnects if max invalid response reached", () => {
    const stubCloseConn = sinon.stub(conn, 'close').callsFake();

    loginHandler.numErrors = 5;
    loginHandler.handle();

    expect(stubCloseConn.calledOnce).to.be.true;
    expect(stubSendMsg.calledOnce).to.be.true;

    loginHandler.numErrors = 0;
    conn.close.restore();
  });

  it("should properly handles new connection -- 'new'", () => {
    loginHandler.handle('new');
    const expectedMsg = cc('yellow') +
      "Please enter your desired name: " + cc('reset');
    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.returnValues[0]).to.equal(expectedMsg);
    expect(loginHandler.state).to.equal("NEWUSER");
  });

  it("should properly handles new connection -- 'non-existing user'", () => {
    loginHandler.handle('INVALID');
    let expectedMsg = cc('red') + cc('bold') +
      "Sorry, the user '" + cc('white') +
      "INVALID" + cc('reset') + cc('bold') + cc('red') +
      "' does not exist" + cc('newline') +
      "Please enter your name, or \"new\" if you are new: " +
      cc('reset') + cc('red') + cc('reset');
    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.returnValues[0]).to.equal(expectedMsg);
    expect(loginHandler.state).to.equal("NEWCONNECTION");
  });

  it ("should properly validates acceptable user names", () => {
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
    let expectedMsg = cc('red') + cc('bold') +
      "Sorry, the name '" + cc('white') + "test" +
      cc('reset') + cc('bold') + cc('red') +
      "' has already been taken." + cc('newline') +
      cc('yellow') + "Please enter your desired name: " +
      cc('reset') + cc('bold') + cc('red') + cc('reset') +
      cc('red') + cc('reset');
    loginHandler.handle('test');
    expect(stubSendMsg.returnValues[1]).to.equal(expectedMsg);
    expectedMsg = cc('red') + cc('bold') +
      "Sorry, the name '" + cc('white') + "te$t" +
      cc('reset') + cc('bold') + cc('red') +
      "' is unacceptible." + cc('newline') +
      cc('yellow') + "Please enter your desired name: " +
      cc('reset') + cc('bold') + cc('red') + cc('reset') +
      cc('red') + cc('reset');
    loginHandler.handle('te$t');
    expect(stubSendMsg.returnValues[2]).to.equal(expectedMsg);
    expectedMsg = cc('green') +
      "Please enter your desired password: " + cc('reset');
    loginHandler.handle(testUser);
    expect(stubSendMsg.returnValues[3]).to.equal(expectedMsg);
    expectedMsg = cc('bold') + cc('red') +
                  "INVALID PASSWORD!" +
                  cc('reset') + cc('bold') +
                  cc('newline') + cc('green') +
                  "Please enter your desired password: " +
                  cc('reset') + cc('bold') + cc('reset');
    loginHandler.handle("bad password");
    expect(stubSendMsg.returnValues[4]).to.equal(expectedMsg);
    expectedMsg = cc('green') + "Thank you! " +
      "You are now entering the realm..." + cc('reset');
    loginHandler.handle(testPass);
    expect(stubSendMsg.returnValues[5]).to.equal(expectedMsg);
    expect(fs.existsSync(dataPath)).to.be.true;
    expect(stubGoToGame.getCall(0).args[0]).to.be.true;
    loginHandler.goToGame.restore();
  });

  it("should properly handles new connection -- 'existing user'", () => {
    const stubGoToGame =
      sinon.stub(loginHandler, 'goToGame').callsFake();
    loginHandler.handle(testUser);
    let expectedMsg = cc('green') + cc('bold') +
      "Welcome, " + cc('white') + testUser + cc('reset') +
      cc('bold') + cc('green') + cc('newline') +
      "Please enter your password: " +
      cc('reset') + cc('green') + cc('reset');
    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.returnValues[0]).to.equal(expectedMsg);
    expectedMsg = cc('bold') + cc('red') +
                  "INVALID PASSWORD!" +
                  cc('reset') + cc('bold') +
                  cc('newline') + cc('green') +
                  "Please enter your password: " +
                  cc('reset') + cc('bold') + cc('reset');
    loginHandler.handle("bad password");
    expect(stubSendMsg.returnValues[1]).to.equal(expectedMsg);
    expectedMsg = cc('green') + "Thank you! " +
      "You are now entering the realm..." + cc('reset');
    loginHandler.handle(testPass);
    expect(stubSendMsg.returnValues[2]).to.equal(expectedMsg);
    expect(stubGoToGame.getCall(0).args[0]).to.be.false;
    loginHandler.goToGame.restore();
  });

  it("should properly transitions to Game handler -- loggedIn = false", () =>{
      const stubConnClose =
        sinon.stub(conn, 'close').callsFake();
      const player = playerDb.findByNameFull(testUser);
      player.loggedIn = false;
      conn.addHandler(loginHandler);
      expect(conn._handler()).to.equal(loginHandler);
      loginHandler.name = testUser;
      loginHandler.goToGame(true);
      expect(player.newbie).to.be.true;
      expect(player.connection).to.equal(conn);
      expect(conn._handler()).to.be.an.instanceof(Game);
      expect(stubConnClose.calledOnce).to.be.false;
      conn.clearHandlers();
      conn.close.restore();
  });

  it("should properly transitions to Game handler -- loggedIn = true", () =>{
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
