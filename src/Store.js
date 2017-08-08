'use strict';

const Entity = require('./Entity');

class Store extends Entity {

  constructor() {
      super();
      this.items = [];
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

  load(dataObject, itemDb) {
    this.id = parseInt(dataObject["ID"]);
    this.name = dataObject["NAME"];
    this.items = [];
    dataObject["ITEMS"].split(' ').forEach(id => {
      id = parseInt(id);
      if (!id) return;
      this.items.push(itemDb.findById(id));
    });
  }

}

module.exports = Store;
