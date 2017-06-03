const net = require('net');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const cm = require(path.join(__dirname, '..', 'src', 'ConnectionManager'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));

describe("ConnectionManager", () => {

  const socket = new net.Socket({});

  cm.newConnection(socket, [telnet]);

  it("should add new socket to connections list", () => {
    expect(cm.totalConnections()).to.equal(1);
    expect(cm.getConnection(0)).to.equal(socket);
  });

  it("should properly translate telnet protocol", () => {
    const cc = telnet.cCode;

    const stub = sinon.stub(socket, 'write');
    stub.callsFake(function (data, encoding, cb) {
      var args = stub.args;
      // this will echo whatever they wrote
      if (args.length > 0)
        this.emit('data', stub.args[stub.callCount - 1][0]);
    });

    const spy = sinon.spy(telnet, 'translate');

    socket.write(cc('green') + "System all green!" + cc('reset'));

    expect(spy.calledOnce).to.be.true;
    expect(spy.returnValues[0]).to.equal("\x1B[32mSystem all green!\x1B[0m");

    telnet.translate.restore();
    socket.write.restore();

  })

  it("should remove socket when socket ends", () => {

    const stub = sinon.stub(socket, 'end');
    stub.callsFake(function (data, encoding) {
        this.emit('close');
    });

    const spy = sinon.spy(cm, 'removeConnection');

    cm.closeConnection(socket);

    expect(spy.calledOnce).to.be.true;
    expect(cm.totalConnections()).to.equal(0);

    cm.removeConnection.restore();
    socket.end.restore();
  });

});
