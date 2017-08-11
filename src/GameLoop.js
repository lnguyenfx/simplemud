'use strict';

const jsonfile = require('jsonfile');
const path = require('path');

const { Attribute } = require('./Attributes');

const Util = require('./Util');
const DB = require('./Databases');
const Game = require('./Game');

const timer = Game.getTimer();
const seconds = Util.seconds;
const minutes = Util.minutes;

const DBSAVETIME = minutes( 15 );
const ROUNDTIME  = seconds( 1 );
const REGENTIME  = minutes( 2 );
const HEALTIME   = minutes( 1 );

const file = path.join(__dirname, '..', 'data', 'gamedata.json');

class GameLoop {
  constructor() {
    this.loadDatabases();
  }

  load() {
    const isEmpty = (obj) => {
      return Object.keys(obj).length === 0 && obj.constructor === Object;
    };
    const dataObject = jsonfile.readFileSync(file);
    if (!isEmpty(dataObject)) {
      const gameTime = parseInt(dataObject["GAMETIME"]);
      timer.reset(gameTime);
      this.saveDbTime = parseInt(dataObject["SAVEDATABASES"]);
      this.nextRound = parseInt(dataObject["NEXTROUND"]);
      this.nextRegen = parseInt(dataObject["NEXTREGEN"]);
      this.nextHeal = parseInt(dataObject["NEXTHEAL"]);
    } else {
      timer.reset();
      this.saveDbTime = DBSAVETIME;
      this.nextRound = ROUNDTIME;
      this.nextRegen = REGENTIME;
      this.nextHeal = HEALTIME;
    }
    Game.setIsRunning(true);
  }

  save() {
    const dataObject = {
      "GAMETIME": Game.getTimer().getMS(),
      "SAVEDATABASES": this.saveDbTime,
      "NEXTROUND": this.nextRound,
      "NEXTREGEN": this.nextRegen,
      "NEXTHEAL": this.nextHeal
    }
    jsonfile.writeFileSync(file, dataObject, {spaces: 2});
  }

  loadDatabases() {
    this.load();
    DB.loadDatabases();
  }

  saveDatabases() {
    this.save();
    DB.saveDatabases();
  }

  loop() {
    if (timer.getMS() >= this.nextRound) {
      this.performRound();
      this.nextRound += ROUNDTIME;
    }
    if (timer.getMS() >= this.nextRegen) {
      this.performRegen();
      this.nextRegen += REGENTIME;
    }
    if (timer.getMS() >= this.nextHeal) {
      this.performHeal();
      this.nextHeal += HEALTIME;
    }
    if (timer.getMS() >= this.saveDbTime) {
      this.saveDatabases();
      this.saveDbTime += DBSAVETIME;
    }
  }

  performRound() {
    const now = timer.getMS();
    for(let enemy of DB.enemyDb.map.values()) {
      if (now >= enemy.nextAttackTime &&
          enemy.room.players.length > 0) {
        Game.enemyAttack(enemy);
      }
    }
  }

  performRegen() {
    for (let room of DB.roomDb.map.values()) {
      if (room.spawnWhich !== 0 &&
          room.enemies.length < room.maxEnemies) {
        const template = DB.enemyTpDb.findById(room.spawnWhich);
        const enemy = DB.enemyDb.create(template, room);
        Game.sendRoom("<red><bold>" + enemy.name +
                      " enters the room!</bold></red>", room);
      }
    }
  }

  performHeal() {
    for (let p of DB.playerDb.map.values()) {
      if (p.active) {
        p.addHitPoints(p.GetAttr(Attribute.HPREGEN));
        p.printStatbar();
      }
    }
  }

}

module.exports = GameLoop;
