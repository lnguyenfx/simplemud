const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');

const { Attribute, PlayerRank }
  = require(path.join(__dirname, '..', 'src', 'Attributes'));

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const ItemDatabase = require(path.join(__dirname, '..', 'src', 'ItemDatabase'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));

describe("Player", () => {

  const itemDb = new ItemDatabase();
  itemDb.load();

  it("should properly intialize", () => {

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
    const weapon = itemDb.findByNameFull("Rusty Knife");
    player.addBonuses(weapon);
    expect(player.baseAttributes[Attribute.ACCURACY]).to.equal(5);
    expect(player.baseAttributes[Attribute.DODGING]).to.equal(0);
    expect(player.baseAttributes[Attribute.DAMAGEABSORB]).to.equal(0);
    const armor = itemDb.findByNameFull("Leather Armor");
    player.addBonuses(armor);
    expect(player.baseAttributes[Attribute.DODGING]).to.equal(15);
    expect(player.baseAttributes[Attribute.DAMAGEABSORB]).to.equal(0);
    expect(spy.callCount).to.equal(2);
  });

  it("should properly add dynamic bonuses", () => {
    const player = new Player();
    expect(player.attributes[Attribute.ACCURACY]).to.equal(3);
    const weapon = itemDb.findByNameFull("Rusty Knife");
    player.addDynamicBonuses(weapon);
    expect(player.attributes[Attribute.ACCURACY]).to.equal(8);
    expect(player.attributes[Attribute.DODGING]).to.equal(3);
    expect(player.attributes[Attribute.DAMAGEABSORB]).to.equal(0);
    const armor = itemDb.findByNameFull("Leather Armor");
    player.addDynamicBonuses(armor);
    expect(player.attributes[Attribute.DODGING]).to.equal(18);
    expect(player.attributes[Attribute.DAMAGEABSORB]).to.equal(0);
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

  it("should properly calculate experiences needed for level", () => {
    const player = new Player();
    expect(player.needForLevel(1)).to.equal(0);
    expect(player.needForLevel(2)).to.equal(40);
    expect(player.needForLevel(5)).to.equal(284);
  });

  it("should properly calculate experiences needed for next level", () => {
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
    const weapon = itemDb.findByNameFull("Rusty Knife");
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
    const weapon = itemDb.findByNameFull("Short Sword");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Healing Potion");
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

  it("should properly find item indexes", () => {
    const itemsList = ["Rusty Knife", "Chainmail Armor", "Small Healing Potion",
                       "Heavy Longsword",
                       "Heavy Club"
                      ];
    const items = itemsList.map(itemName => itemDb.findByNameFull(itemName));
    const player = new Player();
    items.forEach((item) => player.pickUpItem(item));
    const swordIndex = player.getItemIndex("Heavy");
    expect(player.inventory[swordIndex].name).to.equal("Heavy Longsword");
    const armorIndex = player.getItemIndex("Chainmail Armor");
    expect(player.inventory[armorIndex].name).to.equal("Chainmail Armor");
    const potionIndex = player.getItemIndex("Potion");
    expect(player.inventory[potionIndex].name).to.equal("Small Healing Potion");
    const magicPotionIndex = player.getItemIndex("Knife");
    expect(player.inventory[magicPotionIndex].name).to.equal("Rusty Knife");
    const invalidIndex = player.getItemIndex("INVALID");
    expect(invalidIndex).to.equal(-1);
  });

  it("should properly send string to player's connection", () => {
    const conn = new Connection(new require('net').Socket(), telnet);
    const stub = sinon.stub(conn.socket, 'write').callsFake();

    const player = new Player();
    player.connection = conn;
    const spy = sinon.spy(player, 'printStatbar');

    const message = "This is a test message.";
    player.active = false;
    player.sendString(message);
    expect(stub.getCall(0).args[0]).to.equal(message + '\r\n');
    expect(spy.calledOnce).to.be.false;

    player.active = true;
    player.sendString(message);
    expect(spy.calledOnce).to.be.true;

    conn.socket.write.restore();
    player.printStatbar.restore();
  });

  it("should properly print the status bar", () => {
    const conn = new Connection(new require('net').Socket(), telnet);
    const stub = sinon.stub(conn.socket, 'write').callsFake();
    const cc = telnet.cc;
    const player = new Player();
    player.connection = conn;

    const format =
      cc('white') + cc('bold') +
      "[%s%s" + cc('reset') + cc('bold') +
      cc('white') + "/%s]" + cc('reset') +
      cc('white') + cc('reset') + cc('newline');
    const sprintf = require('util').format.bind(player, format);

    // Red Health
    player.setHitPoints(3);
    player.printStatbar();
    let expected = sprintf(cc('red'), player.hitPoints,
                           player.GetAttr(Attribute.MAXHITPOINTS))
    expect(stub.getCall(0).args[0]).to.equal(expected);

    // Yellow Health
    player.setHitPoints(5);
    player.printStatbar();
    expected = sprintf(cc('yellow'), player.hitPoints,
                           player.GetAttr(Attribute.MAXHITPOINTS))
    expect(stub.getCall(1).args[0]).to.equal(expected);

    // Green Health
    player.setHitPoints(8);
    player.printStatbar();
    expected = sprintf(cc('green'), player.hitPoints,
                           player.GetAttr(Attribute.MAXHITPOINTS))
    expect(stub.getCall(2).args[0]).to.equal(expected);

    conn.socket.write.restore();

  });

  it("should properly loads data", () => {

    const dataObject = {
      "ID": 123, "NAME": "TestUser",
      "PASS": "abc", "RANK": "REGULAR",
      "STATPOINTS": 10, "EXPERIENCE": 50,
      "LEVEL": 2, "ROOM": 3, "MONEY": 250,
      "HITPOINTS": 18, "NEXTATTACKTIME": 1,
      "STRENGTH": 1, "HEALTH": 2, "AGILITY": 3,
      "MAXHITPOINTS": 4, "ACCURACY": 5,
      "DODGING": 6, "STRIKEDAMAGE": 7,
      "DAMAGEABSORB": 8, "HPREGEN": 9,
      "INVENTORY": "43 46 36", "WEAPON": 0,
      "ARMOR": 1
    }

    const weapon = itemDb.findByNameFull("Shortsword");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Small Healing Potion");
    const player = new Player();
    player.load(dataObject, itemDb);

    expect(player.id).to.equal(123);
    expect(player.name).to.equal("TestUser");
    expect(player.password).to.equal("abc");
    expect(player.rank).to.equal(PlayerRank.REGULAR);
    expect(player.statPoints).to.equal(10);
    expect(player.experience).to.equal(50);
    expect(player.level).to.equal(2);
    expect(player.room).to.equal(3);
    expect(player.money).to.equal(250);
    expect(player.hitPoints).to.equal(18);
    expect(player.nextAttackTime).to.equal(1);
    expect(player.baseAttributes[Attribute.STRENGTH]).to.equal(1);
    expect(player.baseAttributes[Attribute.HEALTH]).to.equal(2);
    expect(player.baseAttributes[Attribute.AGILITY]).to.equal(3);
    expect(player.baseAttributes[Attribute.MAXHITPOINTS]).to.equal(4);
    expect(player.baseAttributes[Attribute.ACCURACY]).to.equal(5);
    expect(player.baseAttributes[Attribute.DODGING]).to.equal(6);
    expect(player.baseAttributes[Attribute.STRIKEDAMAGE]).to.equal(7);
    expect(player.baseAttributes[Attribute.DAMAGEABSORB]).to.equal(8);
    expect(player.baseAttributes[Attribute.HPREGEN]).to.equal(9);
    expect(player.items).to.equal(3);
    expect(player.inventory[0]).to.equal(weapon);
    expect(player.inventory[1]).to.equal(armor);
    expect(player.inventory[2]).to.equal(potion);
    expect(player.weapon).to.equal(0);
    expect(player.armor).to.equal(1);

    expect(player.serialize()).to.include(dataObject);
  });

});
