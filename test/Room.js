const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const { itemDb } =
  require(path.join(__dirname, '..', 'src', 'Databases'));

const { RoomType, Direction }
  = require(path.join(__dirname, '..', 'src', 'Attributes'));

const Room = require(path.join(__dirname, '..', 'src', 'Room'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));

describe("Room", () => {

  let room;
  beforeEach(() => {
    room = new Room();
  });

  it("should properly intializes", () => {
    expect(room.id).to.equal(0);
    expect(room.name).to.equal("UNDEFINED");
    expect(room.type).to.equal(RoomType.PLAINROOM);
    expect(room.data).to.equal(0);
    expect(room.description).to.equal("UNDEFINED");

    expect(room.rooms[Direction.NORTH]).to.equal(0);
    expect(room.rooms[Direction.EAST]).to.equal(0);
    expect(room.rooms[Direction.SOUTH]).to.equal(0);
    expect(room.rooms[Direction.WEST]).to.equal(0);

    expect(room.spawnWhich).to.equal(0);
    expect(room.maxEnemies).to.equal(0);

    expect(room.items).to.be.an('array').that.is.empty;
    expect(room.money).to.equal(0);

    expect(room.players).to.be.an('array').that.is.empty;
    expect(room.enemies).to.be.an('array').that.is.empty;
  });

  it("should properly adds/removes players", () => {
    const p = new Player();
    expect(room.players.length).to.equal(0);
    room.addPlayer(p);
    expect(room.players.length).to.equal(1);
    expect(room.players[0]).to.equal(p);
    room.removePlayer(p);
    expect(room.players.length).to.equal(0);
  });

  it("should properly adds/removes items", () => {
    const sword = itemDb.findByNameFull("Short Sword");
    const armor = itemDb.findByNameFull("Chainmail Armor");
    expect(room.items.length).to.equal(0);
    room.addItem(sword);
    expect(room.items.length).to.equal(1);
    expect(room.items[0]).to.equal(sword);
    room.removeItem(sword);
    expect(room.items.length).to.equal(0);

    for (let i = 0; i < 32; i++) {
      room.addItem(sword);
    }
    expect(room.items.length).to.equal(32);
    room.addItem(armor);
    expect(room.items.length).to.equal(32);
    expect(room.items[31]).to.equal(armor);
  });

  it("should properly finds items", () => {
    const sword = itemDb.findByNameFull("Short Sword");
    const armor = itemDb.findByNameFull("Chainmail Armor");
    expect(room.findItem("sword")).to.equal(0);
    room.addItem(sword);
    expect(room.findItem("sword")).to.equal(sword);
    expect(room.findItem("Chainmail Armor")).to.equal(0);
    room.addItem(armor);
    expect(room.findItem("Chainmail Armor")).to.equal(armor);
  });


});
