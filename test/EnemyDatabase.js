const { expect } = require('chai');
const path = require('path');

const { roomDb, enemyTpDb, enemyDb } =
  require(path.join(__dirname, '..', 'src', 'Databases'));
const { EnemyTemplate, Enemy } =
  require(path.join(__dirname, '..', 'src', 'Enemy'));

describe("EnemyDatabase", () => {

  it("should properly create/delete enemy instances", () => {
    const room = roomDb.findByNameFull("Training Room");
    const template = enemyTpDb.findByNameFull("Thug");
    expect(room.findEnemy("Thug")).to.equal(0);
    const thug = enemyDb.create(template, room);
    expect(room.findEnemy("Thug")).to.equal(thug);
    expect(thug.room).to.equal(room);
    const id = thug.id;
    expect(enemyDb.findById(id)).to.equal(thug);
    enemyDb.delete(thug);
    expect(enemyDb.findById(id)).to.be.undefined;
    expect(room.findEnemy("Thug")).to.equal(0);
  });

  it("should properly save/load enemy data", () => {
    const room = roomDb.findByNameFull("Training Room");
    const template = enemyTpDb.findByNameFull("Bandit");
    const bandit = enemyDb.create(template, room);

    enemyDb.save();
    enemyDb.load(enemyTpDb, roomDb);
    expect(enemyDb.findById(bandit.id).id).to.equal(bandit.id);

    enemyDb.delete(bandit);
    enemyDb.save();
    enemyDb.load(enemyTpDb, roomDb);
    expect(enemyDb.findById(bandit.id)).to.be.undefined;
  });

});
