const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const { playerDb } = require(path.join(__dirname, '..', 'src', 'Databases'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));

describe("Game", () => {
  const conn = new Connection(new net.Socket(), telnet);
  let game, player;
  beforeEach(() => {
    player = new Player();
    game = new Game(conn, player);
    sinon.stub(playerDb, 'addPlayer').callsFake((player) => {
      playerDb.add(player);
    });
  });

  afterEach(() => {
    playerDb.addPlayer.restore();
  });

  it("should properly return whether game is running", () => {
    expect(Game.isRunning()).to.be.false;
  });

  const testSendToFilteredPlayers = (filter) => {
    const players = [];
    const stubs = [];
    for (let i = 0; i < 10; i++) {
      const player = new Player();
      players[i] = player;
      stubs[i] = sinon.stub(player, 'sendString').callsFake();
      if (i % 2 === 0) player[filter] = true;
      else player[filter] = false;
      playerDb.addPlayer(player);
    }
    let sendCommand;
    if (filter === 'active') sendCommand = 'sendGame';
    else sendCommand = 'sendGlobal';
    Game[sendCommand]("testing 123");
    stubs.forEach((stub, i) => {
      if (i % 2 === 0) expect(stub.calledOnce).to.be.true;
      else expect(stub.calledOnce).to.be.false;
    });
    players.forEach((player) => {
      player.sendString.restore();
    });
  };

  it("should properly sends message to all logged in users", () => {
    testSendToFilteredPlayers('loggedIn');
  });

  it("should properly sends message to all active users", () => {
    testSendToFilteredPlayers('active');
  });

});
