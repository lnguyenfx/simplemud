'use strict';

const Entity = require('./Entity');

class Store extends Entity {

  constructor() {
      super();
      this.items = [];
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
