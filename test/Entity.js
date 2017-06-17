const { expect } = require('chai');
const path = require('path');

const Entity = require(path.join(__dirname, '..', 'src', 'Entity'));

describe("Entity",() => {

  it("should instantiate default data", () => {
    const entity = new Entity();
    expect(entity.name).to.equal("UNDEFINED");
    expect(entity.id).to.equal(0);
  });

  it("should perform full-match search on name correctly", () => {
    const entity = new Entity();
    entity.name = "Test Entity";
    expect(entity.matchFull("test")).to.be.false;
    expect(entity.matchFull("Test Entity")).to.be.true;
  });

  it("should perform partial-match search on name correctly", () => {
    const entity = new Entity();
    entity.name = "Test Entity";
    expect(entity.matchPartial("non match")).to.be.false;
    expect(entity.matchPartial("test")).to.be.true;
    expect(entity.matchPartial("st")).to.be.false;
    expect(entity.matchPartial("EnTiTy")).to.be.true;
    expect(entity.matchPartial("TITY")).to.be.false;
    expect(entity.matchPartial("Test Entity")).to.be.true;
  });

});
