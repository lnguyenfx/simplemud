'use strict';

const path = require('path');
const jsonfile = require('jsonfile');
const EntityDatabase = require('./EntityDatabase');
const Item = require('./Item');

const file = path.join(__dirname, '..', 'data', 'items.json');

class ItemDatabase extends EntityDatabase {

  constructor() {
    super();
  }

  load() {
    const dataArray = jsonfile.readFileSync(file);
    dataArray.forEach(dataObject => {
      const item = new Item();
      item.load(dataObject);
      this.add(item);
    });
  }

}

module.exports = ItemDatabase;
