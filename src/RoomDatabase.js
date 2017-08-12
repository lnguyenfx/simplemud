'use strict';

const path = require('path');
const jsonfile = require('jsonfile');

const EntityDatabase = require('./EntityDatabase');
const Room = require('./Room');

const fileMap = path.join(__dirname, '..', 'data', 'map.json');
const fileMapData = path.join(__dirname, '..', 'data', 'mapdata.json');


class RoomDatabase extends EntityDatabase {

  constructor() {
    super();
  }

  loadTemplates() {
    this.map.clear();
    const dataArray = jsonfile.readFileSync(fileMap);
    dataArray.forEach(dataObject => {
      const room = new Room();
      room.loadTemplate(dataObject);
      this.add(room);
    });
  }

  loadData(itemDb)  {
    const dataArray = jsonfile.readFileSync(fileMapData);
    dataArray.forEach(dataObject => {
      const room = this.findById(parseInt(dataObject["ROOMID"]));
      if (!room) return;
      room.loadData(dataObject, itemDb);
    });
  }

  saveData()  {
    const dataArray = [];
    for (let room of this.map.values()) {
      if (room.items.length || room.money)
        dataArray.push(room.serialize());
    }
    jsonfile.writeFileSync(fileMapData, dataArray, {spaces: 2});
  }

}

module.exports = RoomDatabase;
