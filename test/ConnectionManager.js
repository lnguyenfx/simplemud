const net = require('net');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const cm = require(path.join(__dirname, '..', 'src', 'ConnectionManager'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Logon = require(path.join(__dirname, '..', 'src', 'Logon'));

describe("ConnectionManager", () => {

  const socket = new net.Socket({});

  it("should add new socket to connections list", () => {
    sinon.stub(socket, 'write').callsFake(() => {});
    cm.newConnection(socket, telnet);
    expect(cm.totalConnections()).to.equal(1);
    expect(cm.getConnection(0)).to.equal(cm.findConnection(socket));
    socket.write.restore();
  });

  it("should add default Logon handler to new connection", () => {
    expect(cm.getConnection(0)._handler()).to.be.an.instanceOf(Logon);
  });

  it("should add new socket to connections list", () => {
    expect(cm.totalConnections()).to.equal(1);
    expect(cm.getConnection(0)).to.equal(cm.findConnection(socket));
  });

  it("should remove socket when socket ends", () => {
    const conn = cm.findConnection(socket);
    const stub = sinon.stub(conn.socket, 'end');
    stub.callsFake(function (data, encoding) {
        this.emit('close');
    });

    const spy = sinon.spy(cm, 'removeConnection');

    cm.closeConnection(socket);

    expect(spy.calledOnce).to.be.true;
    expect(cm.totalConnections()).to.equal(0);

    cm.removeConnection.restore();
    conn.socket.end.restore();
  });

});
