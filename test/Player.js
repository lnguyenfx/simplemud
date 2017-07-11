const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const { Attribute, PlayerRank }
  = require(path.join(__dirname, '..', 'src', 'Attributes'));

const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const ItemDatabase = require(path.join(__dirname, '..', 'src', 'ItemDatabase'));

describe("Player",() => {

  const db = new ItemDatabase();
  db.load();

  it("should properly intializes", () => {

    const player = new Player();

    expect(player.id).to.equal(0);
    expect(player.name).to.equal("UNDEFINED");
    expect(player.password).to.equal("UNDEFINED");
    expect(player.rank).to.equal(PlayerRank.REGULAR);

    expect(player.connection).to.equal(0);
    expect(player.loggedIn).to.be.false;
    expect(player.active).to.be.false;
    expect(player.newbie).to.be.true;

    expect(player.experience).to.equal(0);
    expect(player.level).to.equal(1);
    expect(player.room).to.equal(1);
    expect(player.money).to.equal(0);

    expect(player.nextAttackTime).to.equal(0);
    expect(player.baseAttributes[Attribute.STRENGTH]).to.equal(1);
    expect(player.baseAttributes[Attribute.HEALTH]).to.equal(1);
    expect(player.baseAttributes[Attribute.AGILITY]).to.equal(1);

    expect(player.attributes[Attribute.MAXHITPOINTS]).to.equal(10);
    expect(player.attributes[Attribute.ACCURACY]).to.equal(3);
    expect(player.attributes[Attribute.DODGING]).to.equal(3);
    expect(player.attributes[Attribute.DAMAGEABSORB]).to.equal(0);
    expect(player.attributes[Attribute.STRIKEDAMAGE]).to.equal(0);

    expect(player.inventory.length).to.equal(0);
    expect(player.items).to.equal(0);
    expect(player.weapon).to.equal(-1);
    expect(player.armor).to.equal(-1);

    expect(player.statPoints).to.equal(18);

    expect(player.hitPoints).to.equal(10);
  });

  it("should properly add bonuses", () => {
    const player = new Player();
    const spy = sinon.spy(player, 'recalculateStats');
    expect(player.attributes[Attribute.ACCURACY]).to.equal(3);
    const weapon = db.findByNameFull("Knife");
    player.addBonuses(weapon);
    expect(player.baseAttributes[Attribute.ACCURACY]).to.equal(10);
    expect(player.baseAttributes[Attribute.DODGING]).to.equal(0);
    expect(player.baseAttributes[Attribute.DAMAGEABSORB]).to.equal(0);
    const armor = db.findByNameFull("Leather Armor");
    player.addBonuses(armor);
    expect(player.baseAttributes[Attribute.DODGING]).to.equal(10);
    expect(player.baseAttributes[Attribute.DAMAGEABSORB]).to.equal(2);
    expect(spy.callCount).to.equal(2);
  });

  it("should properly add dynamic bonuses", () => {
    const player = new Player();
    expect(player.attributes[Attribute.ACCURACY]).to.equal(3);
    const weapon = db.findByNameFull("Knife");
    player.addDynamicBonuses(weapon);
    expect(player.attributes[Attribute.ACCURACY]).to.equal(13);
    expect(player.attributes[Attribute.DODGING]).to.equal(3);
    expect(player.attributes[Attribute.DAMAGEABSORB]).to.equal(0);
    const armor = db.findByNameFull("Leather Armor");
    player.addDynamicBonuses(armor);
    expect(player.attributes[Attribute.DODGING]).to.equal(13);
    expect(player.attributes[Attribute.DAMAGEABSORB]).to.equal(2);
  });

  it("should properly set and add to base attributes", () => {
    const player = new Player();
    player.setBaseAttr(Attribute.STRIKEDAMAGE, 15);
    expect(player.baseAttributes[Attribute.STRIKEDAMAGE]).to.equal(15);
    player.addToBaseAttr(Attribute.STRIKEDAMAGE, 5);
    expect(player.baseAttributes[Attribute.STRIKEDAMAGE]).to.equal(20);
  });

  it("should properly set and add to hit points", () => {
    const player = new Player();
    player.setHitPoints(-1);
    expect(player.hitPoints).to.equal(0);
    player.setHitPoints(player.attributes[Attribute.MAXHITPOINTS] + 10);
    expect(player.hitPoints).to.equal(player.attributes[Attribute.MAXHITPOINTS]);
    player.setHitPoints(5);
    expect(player.hitPoints).to.equal(5);
    player.addHitPoints(3);
    expect(player.hitPoints).to.equal(8);
  });

  it("should properly calculates experiences needed for level", () => {
    const player = new Player();
    expect(player.needForLevel(1)).to.equal(0);
    expect(player.needForLevel(2)).to.equal(40);
    expect(player.needForLevel(5)).to.equal(284);
  });

  it("should properly calculates experiences needed for next level", () => {
    const player = new Player();
    expect(player.needForNextLevel()).to.equal(40);
    player.experience = 25;
    expect(player.needForNextLevel()).to.equal(15);
    player.level = 4;
    player.experience = 275;
    expect(player.needForNextLevel()).to.equal(9);
  });

  it("should properly train when reaching new levels", () => {
    const player = new Player();
    expect(player.train()).to.be.false;
    player.experience = 40;
    expect(player.train()).to.be.true;
    expect(player.level).to.equal(2);
    expect(player.statPoints).to.equal(20);
    expect(player.baseAttributes[Attribute.MAXHITPOINTS]).to.equal(1);
    expect(player.attributes[Attribute.MAXHITPOINTS]).to.equal(11);
  });

  it("should properly pick up items", () => {
    const weapon = db.findByNameFull("Rusty Knife");
    const player = new Player();
    expect(player.items).to.equal(0);
    player.pickUpItem(weapon);
    expect(player.items).to.equal(1);
    expect(player.inventory[0]).to.equal(weapon);
    for (let i = 1; i < player.MaxItems(); i++) {
      player.pickUpItem(weapon);
    }
    expect(player.items).to.equal(16);
    expect(player.pickUpItem(weapon)).to.be.false;
  });

  it("should properly drop items", () => {
    const weapon = db.findByNameFull("Short Sword");
    const armor = db.findByNameFull("Leather Armor");
    const potion = db.findByNameFull("Healing Potion");
    const player = new Player();
    player.pickUpItem(weapon);
    player.pickUpItem(armor);
    player.pickUpItem(potion);
    expect(player.items).to.equal(3);
    player.useWeapon(0);
    player.useArmor(1);
    expect(player.Weapon()).to.equal(weapon);
    expect(player.Armor()).to.equal(armor);
    player.dropItem(0);
    player.dropItem(1);
    expect(player.items).to.equal(1);
    expect(player.weapon).to.equal(-1);
    expect(player.armor).to.equal(-1);
  });

});
