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
    this.players.push(player);
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
      const items = this.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
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

} // end class Room

module.exports = Room;
