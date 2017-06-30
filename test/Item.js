const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const { Attribute, ItemType }
  = require(path.join(__dirname, '..', 'src', 'Attributes'));

const Item = require(path.join(__dirname, '..', 'src', 'Item'));

describe("Item",() => {

  const testItem = new Item();

  it("should properly intializes", () => {
    expect(testItem.id).to.equal(0);
    expect(testItem.name).to.equal("UNDEFINED");
    expect(testItem.type).to.equal(ItemType.WEAPON);
    expect(testItem.min).to.equal(0);
    expect(testItem.max).to.equal(0);
    expect(testItem.speed).to.equal(0);
    expect(testItem.price).to.equal(0);
    expect(testItem.attributes.length).to.equal(0);
  });

  it("should properly loads from dataObject", () => {
    const dataObject = {
      "ID":"1","NAME":"Test Item","TYPE":"WEAPON","MIN":"2","MAX":"5",
      "SPEED":"2", "PRICE":"10","STRENGTH":"10","HEALTH":"20","AGILITY":"30",
      "MAXHITPOINTS":"40", "ACCURACY":"50","DODGING":"60","STRIKEDAMAGE":"70",
      "DAMAGEABSORB":"80","HPREGEN":"90"
    };

    testItem.load(dataObject);

    expect(testItem.id).to.equal(1);
    expect(testItem.name).to.equal("Test Item");
    expect(testItem.type).to.equal(ItemType.WEAPON);
    expect(testItem.min).to.equal(2);
    expect(testItem.max).to.equal(5);
    expect(testItem.speed).to.equal(2);
    expect(testItem.price).to.equal(10);

    const attr = ['STRENGTH', 'HEALTH', 'AGILITY',
                  'MAXHITPOINTS', 'ACCURACY', 'DODGING',
                  'STRIKEDAMAGE', 'DAMAGEABSORB', 'HPREGEN'];

    for (let i = 0; i < attr.length; i++) {
      const attrVal = Attribute.get(attr[i]).value;
      expect(testItem.attributes[attrVal]).to.equal((i + 1) * 10);
    }

  });

});
