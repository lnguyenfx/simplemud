const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const jsonfile = require('jsonfile');

const { Enemy, EnemyTemplate } =
  require(path.join(__dirname, '..', 'src', 'Enemy'));

describe("Enemy", () => {

  let enemy;
  beforeEach(() => {
    enemy = new Enemy();
  })

  it("should properly intialize", () => {
    expect(enemy.tp).to.equal(0);
    expect(enemy.hitPoints).to.equal(0);
    expect(enemy.room).to.equal(0);
    expect(enemy.nextAttackTime).to.equal(0);
  });

  it("should properly load template", () => {
    const template = new EnemyTemplate();
    template.load({
      "ID": 15, "NAME": "Ruffian",
      "HITPOINTS": 100, "ACCURACY": 140, "DODGING": 40,
      "STRIKEDAMAGE": 2, "DAMAGEABSORB": 3,
      "EXPERIENCE": 80, "WEAPON": 43,
      "MONEYMIN": 0, "MONEYMAX": 10,
      "LOOT": [
        { "itemId": 43, "chance": 1 },
        { "itemId": 35, "chance": 1 }
      ]
    });
    enemy.loadTemplate(template);
    expect(enemy.hitPoints).to.equal(100);
    expect(enemy.tp.hitPoints).to.equal(100);
    expect(enemy.tp.accuracy).to.equal(140);
    expect(enemy.tp.dodging).to.equal(40);
    expect(enemy.tp.strikeDamage).to.equal(2);
    expect(enemy.tp.damageAbsorb).to.equal(3);
    expect(enemy.tp.experience).to.equal(80);
    expect(enemy.tp.weapon).to.equal(43);
    expect(enemy.tp.moneyMin).to.equal(0);
    expect(enemy.tp.moneyMax).to.equal(10);
    expect(enemy.tp.loot.length).to.equal(2);
    expect(enemy.tp.loot[0].itemId).to.equal(43);
    expect(enemy.tp.loot[0].chance).to.equal(1);
    expect(enemy.tp.loot[1].itemId).to.equal(35);
    expect(enemy.tp.loot[1].chance).to.equal(1);
  });

  it("should properly load/save data", () => {
    const dataObject = {
      "ID": 123456,
      "TEMPLATEID": 3,
      "HITPOINTS": 50,
      "ROOM": 12,
      "NEXTATTACKTIME": 10
    };
    enemy.loadData(dataObject);
    expect(enemy.tp).to.equal(3);
    expect(enemy.hitPoints).to.equal(50);
    expect(enemy.room).to.equal(12);
    expect(enemy.nextAttackTime).to.equal(10);
    enemy.id = 123456;

    enemy.saveData();

    const file = path.join(__dirname, '..', 'data', 'enemiesdata.json');
    const dataArray = jsonfile.readFileSync(file);
    const enemy2 = new Enemy();
    enemy2.loadData(dataArray[dataArray.length - 1]);
    expect(enemy2.tp).to.equal(3);
    expect(enemy2.hitPoints).to.equal(50);
    expect(enemy2.room).to.equal(12);
    expect(enemy2.nextAttackTime).to.equal(10);
    dataArray.pop(); // clean up test data
    jsonfile.writeFileSync(file, dataArray, {spaces: 2});

    // Note: more in in-depth coverage of load/save enemy
    // functionality is covered in the ./test/EnemyDatabase.js
  });

});
