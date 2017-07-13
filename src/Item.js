'use strict';

const Entity = require('./Entity');
const { Attribute, ItemType } = require('./Attributes');

class Item extends Entity {

  constructor() {
      super();
      this.type = ItemType.WEAPON;
      this.min = 0;
      this.max = 0;
      this.speed = 0;
      this.price = 0;
      this.attributes = [];
  }

  load(dataObject) {
    this.id = parseInt(dataObject["ID"]);
    this.name = dataObject["NAME"];
    this.type = ItemType.get(dataObject["TYPE"]);
    this.min = parseInt(dataObject["MIN"]);
    this.max = parseInt(dataObject["MAX"]);
    this.speed = parseInt(dataObject["SPEED"]);
    this.price = parseInt(dataObject["PRICE"]);
    this.speed = parseInt(dataObject["SPEED"]);
    Attribute.enums.forEach(attr => {
      this.attributes[attr] = parseInt(dataObject[attr.key]);
    });
  }

}

module.exports = Item;
