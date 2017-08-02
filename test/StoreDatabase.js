const { expect } = require('chai');
const path = require('path');

const { storeDb } = require(path.join(__dirname, '..', 'src', 'Databases'));

describe("StoreDatabase", () => {

  it("should properly load all stores from file", () => {
    expect(storeDb.size()).to.equal(5);
  });

  it("should find store based on id", () => {
    const store = storeDb.findById(5);
    expect(store.name).to.equal("Sea Shanty");
  });

  it("should find full-match of store's name", () => {
    const store = storeDb.findByNameFull("Bobs Weapon Shop");
    expect(store.name).to.equal("Bobs Weapon Shop");
  });

  it("should find partial-match of store's name", () => {
    const store = storeDb.findByNamePartial("Armorsmith");
    expect(store.name).to.equal("Samuels Armorsmith");
  });

});
