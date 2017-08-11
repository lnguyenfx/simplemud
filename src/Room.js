'use strict';

const Entity = require('./Entity');
const { RoomType, Direction } = require('./Attributes');

class Room extends Entity {
  constructor() {
    super();
    // -----------------------------------------
    //  template information
    // -----------------------------------------
    this.type = RoomType.PLAINROOM;
    this.data = 0; // auxilliary data defined by room type
    this.description = "UNDEFINED";
    this.rooms = this._initRooms();
    this.spawnWhich = 0;
    this.maxEnemies = 0;

    // -----------------------------------------
    //  volatile data (save to disk)
    // -----------------------------------------
    this.items = [];
    this.money = 0;

    // -----------------------------------------
    //  volatile data (do not save to disk)
    // -----------------------------------------
    this.players = [];
    this.enemies = [];
  }

  _initRooms() {
    const rooms = [];
    Direction.enums.forEach(dir => {
      rooms[dir] = 0;
    });
    return rooms;
  }

  addPlayer(player) {
    if (this.players.indexOf(player) === -1)
      this.players.push(player);
    player.room = this;
  }

  removePlayer(player) {
    this.players = this.players.filter(p => p !== player);
  }

  addItem(item) {
    // remove the first (oldest) item if there's too many in the room.
    if (this.items.length >= 32)
      this.items.shift();

    // add the new item.
    this.items.push(item);
  }

  removeItem(item) {
    this.items = this.items.filter(i => i !== item);
  }

  findItem(itemName) {
    const find = matchFn => {
      for (let item of this.items) {
        if (item[matchFn].bind(item, itemName)()) {
          return item;
        }
      }
      return 0;
    };
    let item = find('matchFull');
    if (!item) item = find('matchPartial');
    return item;
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
    enemy.room = this;
  }

  removeEnemy(enemy) {
    this.enemies = this.enemies.filter(e => e !== enemy);
  }

  findEnemy(enemyName) {
    const find = matchFn => {
      for (let enemy of this.enemies) {
        if (enemy[matchFn].bind(enemy, enemyName)()) {
          return enemy;
        }
      }
      return 0;
    };
    let item = find('matchFull');
    if (!item) item = find('matchPartial');
    return item;
  }

  loadTemplate(templateObject) {
    this.id = parseInt(templateObject["ID"]);
    this.name = templateObject["NAME"];
    this.description = templateObject["DESCRIPTION"];
    this.type = RoomType.get(templateObject["TYPE"]);
    this.data = parseInt(templateObject["DATA"]);
    Direction.enums.forEach(dir => {
      this.rooms[dir] = parseInt(templateObject[dir.key]);
    });
    this.spawnWhich = parseInt(templateObject["ENEMY"]);
    this.maxEnemies = parseInt(templateObject["MAXENEMIES"]);
  }

  loadData(dataObject, itemDb) {
    if (!this.id) this.id = parseInt(dataObject["ROOMID"]);
    this.items = [];
    dataObject["ITEMS"].split(' ').forEach(id => {
      id = parseInt(id);
      if (!id) return;
      this.items.push(itemDb.findById(id));
    });
    this.money = parseInt(dataObject["MONEY"]);
  }

  serialize() {
    return {
      "ROOMID": this.id,
      "ITEMS": this.items.map(item => item.id).join(' '),
      "MONEY": this.money
    };
  }

} // end class Room

module.exports = Room;
