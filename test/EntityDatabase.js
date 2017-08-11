const { expect } = require('chai');
const path = require('path');

const Entity = require(path.join(__dirname, '..', 'src', 'Entity'));
const EntityDatabase = require(path.join(__dirname, '..', 'src', 'EntityDatabase'));

describe("EntityDatabase", () => {
  let db;

  beforeEach(() => {
    db = new EntityDatabase();
  });

  it("should assign correct Open Id", () => {
    expect(db.size()).to.equal(0);
    expect(db.findOpenId()).to.equal(1);
    db.map.set(1, "one");
    db.map.set(3, "three");
    expect(db.findOpenId()).to.equal(2);
    db.map.clear();
    db.map.set(1, "one");
    db.map.set(2, "two");
    expect(db.findOpenId()).to.equal(3);
    expect(db.size()).to.equal(2);
  });

  it("should add and retrieve entity correctly", () => {
    const entity = new Entity();
    entity.name = "T1";
    db.add(entity);
    expect(db.findById(1)).to.equal(entity);
    expect(db.findById(2)).to.be.undefined;
    expect(db.hasId(1)).to.be.true;
    expect(db.hasId(2)).to.be.false;

    // test when insert out of order
    const entity2 = new Entity();
    entity2.name = "T2";
    db.add(entity2);
    db.map.delete(entity.id);
    db.add(entity);
    let i = 0;
    for (let obj of db.map.values()) {
      expect(obj.id).to.equal(++i);
    }
  });

  it("should find full-match of entity's name", () => {
    const entity = new Entity();
    entity.id = 1;
    entity.name = "Test Entity";
    db.add(entity);
    expect(db.findByNameFull("Test")).to.be.false;
    expect(db.findByNameFull("Test Entity")).to.equal(entity);
    expect(db.hasNameFull("Test")).to.be.false;
    expect(db.hasNameFull("Test Entity")).to.be.true;
  });

  it("should find partial-match of entity's name", () => {
    const entity = new Entity();
    entity.id = 1;
    entity.name = "Test Entity";
    db.add(entity);
    expect(db.findByNamePartial("est")).to.be.false;
    expect(db.findByNamePartial("tity")).to.be.false;
    expect(db.findByNamePartial("test")).to.equal(entity);
    expect(db.findByNamePartial("entity")).to.equal(entity);
    expect(db.hasNamePartial("est")).to.be.false;
    expect(db.hasNamePartial("Test Entity")).to.be.true;
  });

});
