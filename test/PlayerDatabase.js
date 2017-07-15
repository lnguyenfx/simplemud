const { expect } = require('chai');
const sinon = require('sinon');

const fs = require('fs');
const path = require('path');

const { Attribute, PlayerRank } = require(path.join(__dirname, '..', 'src', 'Attributes'));
const { itemDb, playerDb } = require(path.join(__dirname, '..', 'src', 'Databases'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));

describe("PlayerDatabase",() => {

  it("should properly loads all items from file", () => {
    const folder = path.join(__dirname, '..', 'data', 'players');
    const expectedSize = fs.readdirSync(folder).reduce(sum => sum + 1, 0);
    expect(playerDb.size()).to.equal(expectedSize);
    expect(playerDb.findByNameFull("admin").name).to.equal("admin");
    expect(playerDb.findByNameFull("test").name).to.equal("test");
    expect(playerDb.lastId()).to.equal(playerDb.size());
  });

  it("should not add existing players in database", () => {
    const folder = path.join(__dirname, '..', 'data', 'players');
    const expectedSize = fs.readdirSync(folder).reduce(sum => sum + 1, 0);
    expect(playerDb.size()).to.equal(expectedSize);
    const player = playerDb.findByNameFull("test");
    playerDb.addPlayer(player);
    expect(playerDb.size()).to.equal(expectedSize);
  });

  it("should properly logs out players", () => {
    const player = playerDb.findByNameFull("test");
    expect(player.name).to.equal("test");
    const spy = sinon.spy(player, 'save');
    player.connection = 1;
    player.loggedIn = true;
    player.active = true;
    playerDb.logout(player.id);
    expect(player.connection).to.equal(0);
    expect(player.loggedIn).to.be.false;
    expect(player.active).to.be.false;
    expect(spy.calledOnce).to.be.true;
    player.save.restore();
  });

  it("should properly finds active players", () => {
    const player = playerDb.findByNameFull("test");
    expect(player.name).to.equal("test");
    player.active = 0;
    expect(playerDb.findActive(player.name)).to.be.false
    player.active = 1;
    expect(playerDb.findActive(player.name)).to.be.equal(player);
  });

  it("should properly finds logged in players", () => {
    const player = playerDb.findByNameFull("test");
    expect(player.name).to.equal("test");
    player.loggedIn = 0;
    expect(playerDb.findLoggedIn(player.name)).to.be.false
    player.loggedIn = 1;
    expect(playerDb.findLoggedIn(player.name)).to.equal(player);
  });

});
