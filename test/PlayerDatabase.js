const { expect } = require('chai');
const sinon = require('sinon');

const fs = require('fs');
const jsonfile = require('jsonfile');
const path = require('path');

const { Attribute, PlayerRank } = require(path.join(__dirname, '..', 'src', 'Attributes'));
const { itemDb, playerDb } = require(path.join(__dirname, '..', 'src', 'Databases'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));

describe("PlayerDatabase", () => {

  const dataPath = path.join(__dirname, '..', 'data', 'players');

  it("should properly loads all items from file", () => {
    const dataArray = jsonfile.readFileSync(
      path.join(dataPath, '_players.json'));
    const expectedSize = dataArray.length;
    expect(playerDb.size()).to.equal(expectedSize);
    expect(playerDb.findByNameFull("admin").name).to.equal("admin");
    expect(playerDb.findByNameFull("test").name).to.equal("test");
    expect(playerDb.lastId()).to.equal(playerDb.size());
  });


  it("should not add existing players in database", () => {
    const dataArray = jsonfile.readFileSync(
      path.join(dataPath, '_players.json'));
    const expectedSize = dataArray.length;
    expect(playerDb.size()).to.equal(expectedSize);
    const player = playerDb.findByNameFull("test");
    playerDb.addPlayer(player);
    expect(playerDb.size()).to.equal(expectedSize);
  });

  it("should properly adds/removes player", () => {
    const testUser = 'UnitTestUser103';
    const testPass = "validPassword";
    const file = path.join(dataPath, testUser + '.json');
    const sizeBeforeAdd = playerDb.size();
    const getDataArray = () => {
      return jsonfile.readFileSync(
        path.join(dataPath, '_players.json'));
    };
    const player = new Player();
    player.name = testUser;
    player.password = testPass;
    expect(fs.existsSync(file)).to.be.false;
    expect(getDataArray().indexOf(testUser)).to.equal(-1);

    playerDb.addPlayer(player);
    expect(fs.existsSync(file)).to.be.true;
    expect(playerDb.size()).to.equal(sizeBeforeAdd + 1);
    expect(getDataArray().indexOf(testUser)).to.not.equal(-1);

    playerDb.removePlayer(player);
    expect(fs.existsSync(file)).to.be.false;
    expect(playerDb.size()).to.equal(sizeBeforeAdd);
    expect(getDataArray().indexOf(testUser)).to.equal(-1);
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
