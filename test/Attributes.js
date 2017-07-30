const { expect } = require('chai');
const path = require('path');

const { Attribute, ItemType, PlayerRank, RoomType, Direction }
  = require(path.join(__dirname, '..', 'src', 'Attributes'));

describe("Attributes", () => {

  it("should properly declare Attribute enum", () => {
    const attr = ['STRENGTH', 'HEALTH', 'AGILITY',
                  'MAXHITPOINTS', 'ACCURACY', 'DODGING',
                  'STRIKEDAMAGE', 'DAMAGEABSORB', 'HPREGEN'];

    expect(Attribute.enums.map(e => e.key)).to.have.same.members(attr);
    expect(Attribute.get('STRENGTH')).to.equal(Attribute.STRENGTH);
    expect(Attribute.HPREGEN.toString()).to.equal('HPREGEN');
  });

  it("should properly declare ItemType enum", () => {
    const attr = ['WEAPON', 'ARMOR', 'HEALING'];

    expect(ItemType.enums.map(e => e.key)).to.have.same.members(attr);
    expect(ItemType.ARMOR).to.equal(ItemType.get(1));
    expect(ItemType.HEALING.toString()).to.equal('HEALING');
  });

  it("should properly declare PlayerRank enum", () => {
    const attr = ['REGULAR', 'GOD', 'ADMIN'];

    expect(PlayerRank.enums.map(e => e.key)).to.have.same.members(attr);
    expect(PlayerRank.ADMIN).to.equal(PlayerRank.get("ADMIN"));
    expect(PlayerRank.REGULAR.toString()).to.equal('REGULAR');
  });

  it("should properly declare RoomType enum", () => {
    const attr = ['PLAINROOM', 'TRAININGROOM', 'STORE'];

    expect(RoomType.enums.map(e => e.key)).to.have.same.members(attr);
    expect(RoomType.STORE).to.equal(RoomType.get(2));
    expect(RoomType.TRAININGROOM.toString()).to.equal('TRAININGROOM');
  });

  it("should properly declare Direction enum", () => {
    const attr = ['NORTH', 'EAST', 'SOUTH','WEST'];

    expect(Direction.enums.map(e => e.key)).to.have.same.members(attr);
    expect(Direction.WEST).to.equal(Direction.get("WEST"));
    expect(Direction.NORTH.toString()).to.equal('NORTH');
  });

});
