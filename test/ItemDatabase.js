const { expect } = require('chai');
const path = require('path');

const { ItemType } = require(path.join(__dirname, '..', 'src', 'Attributes'));
const ItemDatabase = require(path.join(__dirname, '..', 'src', 'ItemDatabase'));

describe("ItemDatabase",() => {
  const db = new ItemDatabase();
  db.load();

  it("should properly loads all items from file", () => {
    expect(db.size()).to.equal(35);
  });

  it("should find full-match of item's name", () => {
    const item = db.findByNameFull("Rapier");
    expect(item.name).to.equal("Rapier");
    expect(item.type).to.equal(ItemType.WEAPON);
  });

  it("should find partial-match of item's name", () => {
    const item = db.findByNamePartial("Sword");
    expect(item.name).to.equal("Short Sword");
    expect(item.type).to.equal(ItemType.WEAPON);
  });

});
