const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const { EnemyTemplate } =
  require(path.join(__dirname, '..', 'src', 'Enemy'));

describe("EnemyTemplate", () => {

  const template = new EnemyTemplate();

  it("should properly intialize", () => {
    expect(template.hitPoints).to.equal(0);
    expect(template.accuracy).to.equal(0);
    expect(template.dodging).to.equal(0);
    expect(template.strikeDamage).to.equal(0);
    expect(template.damageAbsorb).to.equal(0);
    expect(template.experience).to.equal(0);
    expect(template.weapon).to.equal(0);
    expect(template.moneyMin).to.equal(0);
    expect(template.moneyMax).to.equal(0);
    expect(template.loot).to.be.empty;
  });

  it("should properly load from dataObject", () => {
    const dataObject = { "ID": 15, "NAME": "Ruffian",
      "HITPOINTS": 100, "ACCURACY": 140, "DODGING": 40,
      "STRIKEDAMAGE": 2, "DAMAGEABSORB": 3,
      "EXPERIENCE": 80, "WEAPON": 43,
      "MONEYMIN": 0, "MONEYMAX": 10,
      "LOOT": [
        { "itemId": 43, "chance": 1 },
        { "itemId": 35, "chance": 1 }
      ]
    };

    template.load(dataObject);

    expect(template.hitPoints).to.equal(100);
    expect(template.accuracy).to.equal(140);
    expect(template.dodging).to.equal(40);
    expect(template.strikeDamage).to.equal(2);
    expect(template.damageAbsorb).to.equal(3);
    expect(template.experience).to.equal(80);
    expect(template.weapon).to.equal(43);
    expect(template.moneyMin).to.equal(0);
    expect(template.moneyMax).to.equal(10);
    expect(template.loot.length).to.equal(2);
    expect(template.loot[0].itemId).to.equal(43);
    expect(template.loot[0].chance).to.equal(1);
    expect(template.loot[1].itemId).to.equal(35);
    expect(template.loot[1].chance).to.equal(1);
  });

});
