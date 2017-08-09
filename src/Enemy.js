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
    this.hitPoints = parseInt(dataObject["HITPOINTS"]);
    this.accuracy = parseInt(dataObject["ACCURACY"]);
    this.dodging = parseInt(dataObject["DODGING"]);
    this.strikeDamage = parseInt(dataObject["STRIKEDAMAGE"]);
    this.damageAbsorb = parseInt(dataObject["DAMAGEABSORB"]);
    this.experience = parseInt(dataObject["EXPERIENCE"]);
    this.weapon = parseInt(dataObject["WEAPON"]);
    this.moneyMin = parseInt(dataObject["MONEYMIN"]);
    this.moneyMax = parseInt(dataObject["MONEYMAX"]);
    this.loot = dataObject["LOOT"];
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
  }

  loadData(dataObject) {
    this.tp = parseInt(dataObject["TEMPLATEID"]);
    this.hitPoints = parseInt(dataObject["HITPOINTS"]);
    this.room = parseInt(dataObject["ROOM"]);
    this.nextAttackTime = parseInt(dataObject["NEXTATTACKTIME"]);
  }

  saveData(dataArray) {
    const obj = {
      "ID": this.id,
      "TEMPLATEID": (isNaN(this.tp) ? this.tp.id : this.tp),
      "HITPOINTS": this.hitPoints,
      "ROOM": this.room,
      "NEXTATTACKTIME": this.nextAttackTime
    };
    const file =
      require('path').join(__dirname, '..', 'data', 'enemiesdata.json');
    const jsonfile = require('jsonfile');
    let exists = false;
    let empty = false;
    dataArray = dataArray || jsonfile.readFileSync(file);
    for (let dataObject of dataArray) {
      if (parseInt(dataObject["ID"]) === obj["ID"]) {
        dataObject["TEMPLATEID"] = obj["TEMPLATEID"];
        dataObject["HITPOINTS"] = obj["HITPOINTS"];
        dataObject["ROOM"] = obj["ROOM"];
        dataObject["NEXTATTACKTIME"] = obj["NEXTATTACKTIME"];
        exists = true;
        break;
      }
    }
    if (exists) {
      dataArray = dataArray.filter(
        dataObject => this.id !== parseInt(dataObject["ID"]));
    }
    dataArray.push(obj);
    dataArray.sort((a, b) => a.id > b.id);
    jsonfile.writeFileSync(file, dataArray, {spaces: 2});
  }

}

module.exports = { EnemyTemplate, Enemy };
