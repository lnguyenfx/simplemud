const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const jsonfile = require('jsonfile');

const { Attribute } = require(path.join(__dirname, '..', 'src', 'Attributes'));

const Util = require(path.join(__dirname, '..', 'src', 'Util'));
const DB = require(path.join(__dirname, '..', 'src', 'Databases'));
const RoomDatabase = require(path.join(__dirname, '..', 'src', 'RoomDatabase'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const Room = require(path.join(__dirname, '..', 'src', 'Room'));
const GameLoop = require(path.join(__dirname, '..', 'src', 'GameLoop'));

const timer = Game.getTimer();
const seconds = Util.seconds;
const minutes = Util.minutes;

const file = path.join(__dirname, '..', 'data', 'gamedata.json');

describe("GameLoop", () => {

  let gameLoop;

  it("should properly intialize", () => {
    expect(Game.isRunning()).to.be.false;
    const spyLoadDb = sinon.spy(DB, 'loadDatabases');
    expect(spyLoadDb.calledOnce).to.be.false;
    gameLoop = new GameLoop();
    expect(spyLoadDb.calledOnce).to.be.true;
    DB.loadDatabases.restore();
    expect(Game.isRunning()).to.be.true;
  });

  it("should properly load databases", () => {
    const spyLoadDb = sinon.spy(DB, 'loadDatabases');
    const spyLoad = sinon.spy(gameLoop, 'load');
    expect(spyLoadDb.calledOnce).to.be.false;
    expect(spyLoad.calledOnce).to.be.false;
    gameLoop.loadDatabases();
    expect(spyLoadDb.calledOnce).to.be.true;
    expect(spyLoad.calledOnce).to.be.true;
    gameLoop.load.restore();
    DB.loadDatabases.restore();
  });

  it("should properly save databases", () => {
    const spySaveDb = sinon.spy(DB, 'saveDatabases');
    const spySave = sinon.spy(gameLoop, 'save');
    expect(spySaveDb.calledOnce).to.be.false;
    expect(spySave.calledOnce).to.be.false;
    gameLoop.saveDatabases();
    expect(spySaveDb.calledOnce).to.be.true;
    expect(spySave.calledOnce).to.be.true;
    gameLoop.save.restore();
    DB.saveDatabases.restore();
  });

  it("should properly execute load/save", () => {
    jsonfile.writeFileSync(file, {});

    gameLoop.load();
    expect(gameLoop.saveDbTime).to.equal(minutes(15))
    expect(gameLoop.nextRound).to.equal(seconds(1))
    expect(gameLoop.nextRegen).to.equal(minutes(2))
    expect(gameLoop.nextHeal).to.equal(minutes(1))

    timer.reset(seconds(30));
    gameLoop.saveDbTime *= 2;
    gameLoop.nextRound *= 2;
    gameLoop.nextRegen *= 2;
    gameLoop.nextHeal *= 2;
    gameLoop.save();

    timer.reset();
    gameLoop.saveDbTime = 0;
    gameLoop.nextRound = 0;
    gameLoop.nextRegen = 0;
    gameLoop.nextHeal = 0;

    gameLoop.load();
    expect(timer.getMS()).to.equal(seconds(30));
    expect(gameLoop.saveDbTime).to.equal(2 * minutes(15))
    expect(gameLoop.nextRound).to.equal(2 * seconds(1))
    expect(gameLoop.nextRegen).to.equal(2 * minutes(2))
    expect(gameLoop.nextHeal).to.equal(2 * minutes(1))

    jsonfile.writeFileSync(file, {});
  });

  it("should properly trigger enemy to attack", () => {
    const stubEnemyAttack = sinon.stub(Game, 'enemyAttack').callsFake();

    // no enemy exists
    gameLoop.performRound();
    expect(stubEnemyAttack.calledOnce).to.be.false;

    // enemy exists, but no player
    const room = DB.roomDb.findByNameFull("Town Square");
    const thugTp = DB.enemyTpDb.findByNameFull("Thug");
    const thug = DB.enemyDb.create(thugTp, room);
    gameLoop.performRound();
    expect(stubEnemyAttack.calledOnce).to.be.false;

    // enemy and player exiss, but not valid attackTime
    const p = new Player();
    room.addPlayer(p);
    thug.nextAttackTime = timer.getMS() + seconds(5);
    gameLoop.performRound();
    expect(stubEnemyAttack.calledOnce).to.be.false;

    // enemy exists and valid attack time, but no player
    room.removePlayer(p);
    thug.nextAttackTime = 0;
    gameLoop.performRound();
    expect(stubEnemyAttack.calledOnce).to.be.false;

    // enemy and player exists, and valid attackTime
    room.addPlayer(p);
    gameLoop.performRound();
    expect(stubEnemyAttack.calledOnce).to.be.true;

    DB.enemyDb.delete(thug);
    Game.enemyAttack.restore();
  });

  it("should properly trigger enemy to spawn", () => {
    const stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();

    DB.roomDb = new RoomDatabase();
    const room = new Room();
    room.name = "Test Room";

    DB.roomDb.add(room);

    // room does not spawn any enemies
    room.spawnWhich = 0;
    gameLoop.performRegen();
    expect(stubSendRoom.calledOnce).to.be.false;

    // room spawn thugs, but max enemies reached
    room.spawnWhich = DB.enemyTpDb.findByNameFull("Thug").id;
    room.maxEnemies = 0;
    gameLoop.performRegen();
    expect(stubSendRoom.calledOnce).to.be.false;

    // room spawn thugs and max enemies is not reached
    room.maxEnemies = 1;
    gameLoop.performRegen();
    expect(stubSendRoom.calledOnce).to.be.true;
    expect(stubSendRoom.getCall(0).args[0]).to.
      equal("<red><bold>Thug enters the room!</bold></red>");
    expect(room.enemies[0].name).to.equal("Thug");

    DB.loadDatabases();
    Game.sendRoom.restore();
  });

  it("should properly heals player over time", () => {
    const p = new Player();
    p.name = "TestPlayer";
    const spyAddHitPoints = sinon.spy(p, 'addHitPoints');
    const stubPrintStatbar = sinon.stub(p, 'printStatbar').callsFake();
    DB.playerDb.add(p);

    // player not active
    p.active = false;
    gameLoop.performHeal();
    expect(spyAddHitPoints.calledOnce).to.be.false;

    // player is active
    p.active = true;
    p.setBaseAttr(Attribute.HPREGEN, 2);
    p.setBaseAttr(Attribute.HEALTH, 1);

    gameLoop.performHeal();
    expect(spyAddHitPoints.calledOnce).to.be.true;
    expect(stubPrintStatbar.calledOnce).to.be.true;
    expect(spyAddHitPoints.getCall(0).args[0]).
      to.equal(3);

    DB.loadDatabases();
    p.addHitPoints.restore();
    p.printStatbar.restore();
  });

  it("should properly execute game loop", () => {
    const stubRound = sinon.stub(gameLoop, 'performRound').callsFake();
    const stubRegen = sinon.stub(gameLoop, 'performRegen').callsFake();
    const stubHeal = sinon.stub(gameLoop, 'performHeal').callsFake();
    const stubSaveDb = sinon.stub(gameLoop, 'saveDatabases').callsFake();

    gameLoop.nextRound = timer.getMS() + seconds(5);
    gameLoop.nextRegen = gameLoop.nextRound;
    gameLoop.nextHeal = gameLoop.nextRound;
    gameLoop.saveDbTime = gameLoop.nextRound;

    // ROUND
    gameLoop.loop();
    expect(stubRound.calledOnce).to.be.false;

    const time = timer.getMS() - seconds(5);

    gameLoop.nextRound = time;
    gameLoop.loop();
    expect(stubRound.calledOnce).to.be.true;
    expect(gameLoop.nextRound).to.equal(time + seconds(1))

    gameLoop.loop();
    expect(stubRegen.calledOnce).to.be.false;

    // REGEN
    gameLoop.nextRegen = time;
    gameLoop.loop();
    expect(stubRegen.calledOnce).to.be.true;
    expect(gameLoop.nextRegen).to.equal(time + minutes(2))

    gameLoop.loop();
    expect(stubHeal.calledOnce).to.be.false;

    // HEAL
    gameLoop.nextHeal = time;
    gameLoop.loop();
    expect(stubHeal.calledOnce).to.be.true;
    expect(gameLoop.nextHeal).to.equal(time + minutes(1))

    // SAVEDB
    gameLoop.loop();
    expect(stubSaveDb.calledOnce).to.be.false;

    gameLoop.saveDbTime = time;
    gameLoop.loop();
    expect(stubSaveDb.calledOnce).to.be.true;
    expect(gameLoop.saveDbTime).to.equal(time + minutes(15))

    gameLoop.load(); // reset instance variables
  });

});
