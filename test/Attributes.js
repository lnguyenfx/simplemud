const { expect } = require('chai');
const path = require('path');

const { Attribute } = require(path.join(__dirname, '..', 'src', 'Attributes'));

describe("Attributes",() => {

  it("should properly declare Attribute enum", () => {
    const attr = ['STRENGTH', 'HEALTH', 'AGILITY',
                  'MAXHITPOINTS', 'ACCURACY', 'DODGING',
                  'STRIKEDAMAGE', 'DAMAGEABSORB', 'HPREGEN'];

    expect(Attribute.enums.map(e => e.key)).to.have.same.members(attr);
    expect(Attribute.enums.length).to.equal(attr.length);
    expect(Attribute.get('STRENGTH')).to.equal(Attribute.STRENGTH);
    expect(Attribute.HPREGEN.toString()).to.equal('HPREGEN');
  });

});
