const { expect } = require('chai');
const path = require('path');

const { RoomType } = require(path.join(__dirname, '..', 'src', 'Attributes'));
const { itemDb, roomDb } =
  require(path.join(__dirname, '..', 'src', 'Databases'));

describe("RoomDatabase", () => {

  it("should properly load all rooms from file", () => {
    expect(roomDb.size()).to.equal(57);
  });

  it("should find room based on id", () => {
    const room = roomDb.findById(5);
    expect(room.name).to.equal("Alley");
    expect(room.type).to.equal(RoomType.PLAINROOM);
  });

  it("should find full-match of room's name", () => {
    const room = roomDb.findByNameFull("Training Room");
    expect(room.name).to.equal("Training Room");
    expect(room.type).to.equal(RoomType.TRAININGROOM);
  });

  it("should find partial-match of room's name", () => {
    const room = roomDb.findByNamePartial("Bobs");
    expect(room.name).to.equal("Bobs Weapon Shop");
    expect(room.type).to.equal(RoomType.STORE);
  });

  it("should properly save/load room data", () => {
    const sword = itemDb.findByNameFull("Short Sword");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Healing Potion");
    const room = roomDb.findByNameFull("Street");
    expect(room.items).to.be.empty;
    expect(room.money).to.equal(0);
    room.items = [sword, armor, potion];
    room.money = 123;
    roomDb.saveData();
    room.items = [];
    room.money = 0;
    roomDb.loadData(itemDb);
    expect(room.items).to.have.
      members([sword, armor, potion]);
    expect(room.money).to.equal(123);
    room.items = [];
    room.money = 0;
    roomDb.saveData();
    roomDb.loadData(itemDb);
    expect(room.items).to.be.empty;
    expect(room.money).to.equal(0);
  })

});
