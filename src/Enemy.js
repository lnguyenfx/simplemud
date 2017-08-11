'use strict';

// This file contains the definition of
// both EnemyTemplate and Enemy classes

const Entity = require('./Entity');

class EnemyTemplate extends Entity {

  constructor() {
    super();
    this.hitPoints = 0;
    this.accuracy = 0;
    this.dodging = 0;
    this.strikeDamage = 0;
    this.damageAbsorb = 0;
    this.experience = 0;
    this.weapon = 0;
    this.moneyMin = 0;
    this.moneyMax = 0;
    this.loot = [];
  }

  load(dataObject) {
    this.name = dataObject["NAME"];
    this.hitPoints = parseInt(dataObject["HITPOINTS"]);
    this.accuracy = parseInt(dataObject["ACCURACY"]);
    this.dodging = parseInt(dataObject["DODGING"]);
    this.strikeDamage = parseInt(dataObject["STRIKEDAMAGE"]);
    this.damageAbsorb = parseInt(dataObject["DAMAGEABSORB"]);
    this.experience = parseInt(dataObject["EXPERIENCE"]);
    this.weapon = parseInt(dataObject["WEAPON"]);
    this.moneyMin = parseInt(dataObject["MONEYMIN"]);
    this.moneyMax = parseInt(dataObject["MONEYMAX"]);
    this.loot = dataObject["LOOT"] || [];
  }

}

class Enemy extends Entity {

  constructor() {
    super();
    this.tp = 0; // template
    this.hitPoints = 0;
    this.room = 0;
    this.nextAttackTime = 0;
  }

  loadTemplate(template) {
    this.tp = template;
    this.hitPoints = template.hitPoints;
    this.name = template.name;
  }

  loadData(dataObject, enemyTpDb, roomDb) {
    this.tp = enemyTpDb.findById(parseInt(dataObject["TEMPLATEID"]));
    this.name = this.tp.name;
    this.hitPoints = parseInt(dataObject["HITPOINTS"]);
    this.room = roomDb.findById(parseInt(dataObject["ROOM"]));
    this.nextAttackTime = parseInt(dataObject["NEXTATTACKTIME"]);
  }

  serialize() {
    return {
      "ID": this.id,
      "TEMPLATEID": (isNaN(this.tp) ? this.tp.id : this.tp),
      "HITPOINTS": this.hitPoints,
      "ROOM": (isNaN(this.room) ? this.room.id : this.room),
      "NEXTATTACKTIME": this.nextAttackTime
    };
  }

}

module.exports = { EnemyTemplate, Enemy };
