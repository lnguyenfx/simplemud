const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const jsonfile = require('jsonfile');

const { Attribute, PlayerRank }
  = require(path.join(__dirname, '..', 'src', 'Attributes'));

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const ItemDatabase = require(path.join(__dirname, '..', 'src', 'ItemDatabase'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));

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

  it("should properly find item indexes", () => {
    const itemsList = ["Knife", "Chainmail Armor", "Healing Potion",
                       "Magic Sword of Killing",
                       "Magic Potion of Strength"
                      ];
    const items = itemsList.map(itemName => db.findByNameFull(itemName));
    const player = new Player();
    items.forEach((item) => player.pickUpItem(item));
    const swordIndex = player.getItemIndex("Magic Sword");
    expect(player.inventory[swordIndex].name).to.equal("Magic Sword of Killing");
    const armorIndex = player.getItemIndex("Chainmail Armor");
    expect(player.inventory[armorIndex].name).to.equal("Chainmail Armor");
    const potionIndex = player.getItemIndex("Potion");
    expect(player.inventory[potionIndex].name).to.equal("Healing Potion");
    const magicPotionIndex = player.getItemIndex("Magic Potion");
    expect(player.inventory[magicPotionIndex].name).to.equal("Magic Potion of Strength");
    const invalidIndex = player.getItemIndex("INVALID");
    expect(invalidIndex).to.equal(-1);
  });

  it("should properly sends string to player's connection", () => {
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

  it("should properly prints the status bar", () => {
    const conn = new Connection(new require('net').Socket(), telnet);
    const stub = sinon.stub(conn.socket, 'write').callsFake();
    const cc = telnet.cc;
    const player = new Player();
    player.connection = conn;

    const format =
      cc('white') + cc('bold') +
      "[%s%i" + cc('reset') + cc('bold') +
      cc('white') + "/%i]" + cc('reset') +
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

  it("should properly saves to and loads from JSON file", () => {
    const player = new Player();
    const weapon = db.findByNameFull("Short Sword");
    player.pickUpItem(weapon);
    player.useWeapon(0);
    const armor = db.findByNameFull("Chainmail Armor");
    player.pickUpItem(armor);
    player.useArmor(1);
    const potion = db.findByNameFull("Healing Potion");
    player.pickUpItem(potion);
    player.id = 2;
    player.name = "test";
    player.password = "abc";
    player.rank = PlayerRank.REGULAR;
    player.statPoints = 10;
    player.experience = 50;
    player.level = 2;
    player.room = 3;
    player.money = 250;
    player.hitPoints = 18;
    player.nextAttackTime = 1;
    player.baseAttributes[Attribute.STRENGTH] = 1;
    player.baseAttributes[Attribute.HEALTH] = 2;
    player.baseAttributes[Attribute.AGILITY] = 3;
    player.baseAttributes[Attribute.MAXHITPOINTS] = 4;
    player.baseAttributes[Attribute.ACCURACY] = 5;
    player.baseAttributes[Attribute.DODGING] = 6;
    player.baseAttributes[Attribute.STRIKEDAMAGE] = 7;
    player.baseAttributes[Attribute.DAMAGEABSORB] = 8;
    player.baseAttributes[Attribute.HPREGEN] = 9;

    player.save();

    const file = path.join(__dirname, '..', 'data', 'players', player.name + '.json');
    const dataObject = jsonfile.readFileSync(file);
    const dbPlayer = new Player();
    dbPlayer.load(dataObject, db);

    expect(dbPlayer.id).to.equal(2);
    expect(dbPlayer.name).to.equal("test");
    expect(dbPlayer.password).to.equal("abc");
    expect(dbPlayer.rank).to.equal(PlayerRank.REGULAR);
    expect(dbPlayer.statPoints).to.equal(10);
    expect(dbPlayer.experience).to.equal(50);
    expect(dbPlayer.level).to.equal(2);
    expect(dbPlayer.room).to.equal(3);
    expect(dbPlayer.money).to.equal(250);
    expect(dbPlayer.hitPoints).to.equal(18);
    expect(dbPlayer.nextAttackTime).to.equal(1);
    expect(dbPlayer.baseAttributes[Attribute.STRENGTH]).to.equal(1);
    expect(dbPlayer.baseAttributes[Attribute.HEALTH]).to.equal(2);
    expect(dbPlayer.baseAttributes[Attribute.AGILITY]).to.equal(3);
    expect(dbPlayer.baseAttributes[Attribute.MAXHITPOINTS]).to.equal(4);
    expect(dbPlayer.baseAttributes[Attribute.ACCURACY]).to.equal(5);
    expect(dbPlayer.baseAttributes[Attribute.DODGING]).to.equal(6);
    expect(dbPlayer.baseAttributes[Attribute.STRIKEDAMAGE]).to.equal(7);
    expect(dbPlayer.baseAttributes[Attribute.DAMAGEABSORB]).to.equal(8);
    expect(dbPlayer.baseAttributes[Attribute.HPREGEN]).to.equal(9);
    expect(dbPlayer.items).to.equal(3);
    expect(dbPlayer.inventory[0]).to.equal(weapon);
    expect(dbPlayer.inventory[1]).to.equal(armor);
    expect(dbPlayer.inventory[2]).to.equal(potion);
    expect(dbPlayer.weapon).to.equal(0);
    expect(dbPlayer.armor).to.equal(1);
  });

});
