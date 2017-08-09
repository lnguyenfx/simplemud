'use strict';

const path = require('path');
const jsonfile = require('jsonfile');
const EntityDatabase = require('./EntityDatabase');
const Store = require('./Store');

const file = path.join(__dirname, '..', 'data', 'stores.json');

class StoreDatabase extends EntityDatabase {

  constructor() {
    super();
  }

  load(itemDb) {
    this.map.clear();
    const dataArray = jsonfile.readFileSync(file);
    dataArray.forEach(dataObject => {
      const store = new Store();
      store.load(dataObject, itemDb);
      this.add(store);
    });
  }

}

module.exports = StoreDatabase;
