const net = require('net');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Logon = require(path.join(__dirname, '..', 'src', 'Logon'));

describe("Logon", () => {
  const conn = new Connection(new net.Socket(), telnet);
  const loginHandler = new Logon(conn);

  it("should properly display welcome on enter", () => {
    const stub = sinon.stub(conn, 'sendMessage');
    stub.callsFake(msg => {
      var args = stub.args;
      // this will echo whatever they wrote
      if (args.length > 0)
        return telnet.translate(stub.args[stub.callCount - 1][0])
    });
    const expectedMsg = "\x1B[1m\x1B[31mWeclome to SimpleMUD\x1B[0m\x1B[0m\r\n\x1B[0m" +
                        "Please enter your name, or \"new\" if you are new: ";
    loginHandler.enter();

    expect(stub.calledOnce).to.be.true;
    expect(stub.returnValues[0]).to.equal(expectedMsg);

    conn.sendMessage.restore();
  });

  it("should properly disconnect if max invalid response reached", () => {
    const stubCloseConn = sinon.stub(conn, 'closeConnection').callsFake();
    const stubSendMsg = sinon.stub(conn, 'sendMessage').callsFake();
    loginHandler.numErrors = 5;
    loginHandler.handle();

    expect(stubCloseConn.calledOnce).to.be.true;
    expect(stubSendMsg.calledOnce).to.be.true;

    loginHandler.numErrors = 0;
    conn.closeConnection.restore();
    conn.sendMessage.restore();
  });
});
