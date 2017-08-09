const { expect } = require('chai');
const path = require('path');

const { enemyTpDb } = require(path.join(__dirname, '..', 'src', 'Databases'));

describe("EnemyTemplateDatabase", () => {

  it("should properly load all enemy templates from file", () => {
    expect(enemyTpDb.size()).to.equal(20);
  });

  it("should find enemy template based on id", () => {
    const template = enemyTpDb.findById(10);
    expect(template.name).to.equal("Vagrant");
  });

  it("should find full-match of enemy templates's name", () => {
    const template = enemyTpDb.findByNameFull("Thief");
    expect(template.name).to.equal("Thief");
  });

  it("should find partial-match of enemy template's name", () => {
    const template = enemyTpDb.findByNamePartial("Lobster");
    expect(template.name).to.equal("Rock Lobster");
  });

});
