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
    const dataArray = jsonfile.readFileSync(fileMapData);
    for (let room of this.map.values()) {
      room.saveData(dataArray);
    }
  }

}

module.exports = RoomDatabase;
