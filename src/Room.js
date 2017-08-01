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

  saveData(dataArray) {
    const obj = {
      "ROOMID": this.id,
      "ITEMS": this.items.map(item => item.id).join(' '),
      "MONEY": this.money
    }
    const file = require('path').join(__dirname, '..', 'data', 'mapdata.json');
    const jsonfile = require('jsonfile');
    let exists = false;
    let empty = false;
    dataArray = dataArray || jsonfile.readFileSync(file);
    for (let dataObject of dataArray) {
      if (parseInt(dataObject["ROOMID"]) === obj["ROOMID"]) {
        dataObject["ITEMS"] = obj["ITEMS"];
        dataObject["MONEY"] = obj["MONEY"];
        exists = true;
        break;
      }
    }
    if (!this.items.length && !this.money) {
      if (exists) {
        dataArray = dataArray.filter(
          dataObject => this.id !== parseInt(dataObject["ROOMID"]));
      }
      empty = true;
    }
    if (!empty && !exists) dataArray.push(obj);
    if (exists || (!empty && !exists))
      jsonfile.writeFileSync(file, dataArray, {spaces: 2});
  }

} // end class Room

module.exports = Room;
