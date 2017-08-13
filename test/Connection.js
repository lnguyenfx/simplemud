const net = require('net');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const Handler = require(path.join(__dirname, '..', 'src', 'ConnectionHandler'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));

describe("Connection", () => {
  const conn = new Connection(new net.Socket(), telnet);

  const firstHandler = new Handler();
  it("should properly adds first handler", () => {
    const spy = sinon.spy(firstHandler, 'enter');
    conn.addHandler(firstHandler);
    expect(spy.calledOnce).to.be.true;
    expect(conn.handlers.length).to.be.equal(1);

    firstHandler.enter.restore();
  });

  const secondHandler = new Handler();
  it("should properly adds second handler and leaves the first", () => {
    const spyFirst = sinon.spy(firstHandler, 'leave')
    const spySecond = sinon.spy(secondHandler, 'enter');
    conn.addHandler(secondHandler);
    expect(spyFirst.calledOnce).to.be.true;
    expect(spySecond.calledOnce).to.be.true;
    expect(conn.handlers.length).to.be.equal(2);

    firstHandler.leave.restore();
    secondHandler.enter.restore();
  });

  const thirdHandler = new Handler();
  it("should properly remove handler from list of 3", () => {
    conn.addHandler(thirdHandler);
    const spySecond = sinon.spy(secondHandler, 'enter')
    const spyThird = sinon.spy(thirdHandler, 'leave');
    conn.removeHandler();
    expect(spySecond.calledOnce).to.be.true;
    expect(spyThird.calledOnce).to.be.true;
    expect(conn.handlers.length).to.be.equal(2);

    secondHandler.enter.restore();
    thirdHandler.leave.restore();
  });

  it("should properly send translated telnet message", () => {
    const stub = sinon.stub(conn.socket, 'write');
    stub.callsFake(function (data, encoding, cb) {
      var args = stub.args;
      // this will echo whatever they wrote
      if (args.length > 0)
        this.emit('data', stub.args[stub.callCount - 1][0]);
    });

    conn.sendMessage("<green>System all green!</green>");

    expect(stub.calledOnce).to.be.true;
    expect(stub.getCall(0).args[0]).to.
      equal("\u001b[0m\x1B[32mSystem all green!\x1B[0m\u001b[0m");

    conn.socket.write.restore();
  });

  it("should properly clear all handlers", () => {
    const spySecond = sinon.spy(secondHandler, 'leave');
    conn.clearHandlers();
    expect(spySecond.calledOnce).to.be.true;
    expect(conn.handlers.length).to.be.equal(0);
  });

  it("should properly close connection when cannot send message", () => {
    const handler = new Handler();
    const stubConnClose = sinon.stub(conn, 'close').callsFake();
    conn.addHandler(handler);
    expect(stubConnClose.calledOnce).to.be.false;
    conn.sendMessage("test");
    expect(stubConnClose.calledOnce).to.be.true;
    conn.close.restore();
  });

  it("should properly handle disconnect", () => {
    const stub = sinon.stub(conn.socket, 'end');
    stub.callsFake(function (data, encoding) {
        this.emit('close');
    });
    const spy = sinon.spy(conn, 'clearHandlers');

    conn.close();

    expect(stub.calledOnce).to.be.true;
    expect(spy.calledOnce).to.be.true;

    conn.clearHandlers.restore();
    conn.socket.end.restore();
  });

});
