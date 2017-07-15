const net = require('net');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Logon = require(path.join(__dirname, '..', 'src', 'Logon'));

describe("Logon", () => {
  const conn = new Connection(new net.Socket(), telnet);
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
    const stubCloseConn = sinon.stub(conn, 'closeConnection').callsFake();

    loginHandler.numErrors = 5;
    loginHandler.handle();

    expect(stubCloseConn.calledOnce).to.be.true;
    expect(stubSendMsg.calledOnce).to.be.true;

    loginHandler.numErrors = 0;
    conn.closeConnection.restore();
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

  it("should properly handles new connection -- 'existing user'", () => {
    loginHandler.handle('test');
    let expectedMsg = cc('green') + cc('bold') +
      "Welcome, " + cc('white') + "test" + cc('reset') +
      cc('bold') + cc('green') + cc('newline') +
      "Please enter your password: " +
      cc('reset') + cc('green') + cc('reset');
    expect(stubSendMsg.calledOnce).to.be.true;
    expect(stubSendMsg.returnValues[0]).to.equal(expectedMsg);
    expect(loginHandler.state).to.equal("ENTERPASS");
  });

});
