'use strict';

class EntityDatabase {

  constructor() {
    this.map = new Map();
  }

  add(entity) {
    this.map.set(this.findOpenId(), entity);
  }

  get(id) {
    return this.map.get(id);
  }

  findOpenId() {
    let previousId = 0;
    for (let key of this.map.keys()) {
      if (key !== previousId + 1) break;
      previousId = key;
    }
    return previousId + 1;
  }

  // --------------------------------------------------------------------
  //  finds entity based in ID
  // --------------------------------------------------------------------
  findById(id) {
    return this.map.get(id); // returns undefined if no match
  }

  // --------------------------------------------------------------------
  //  finds entity matching name exactly
  // --------------------------------------------------------------------
  findByNameFull(name) {
    return this._findByName(name, "matchFull");
  }

  // --------------------------------------------------------------------
  //  finds entity matching name partially
  // --------------------------------------------------------------------
  findByNamePartial(name) {
    return this._findByName(name, "matchPartial");
  }

  // --------------------------------------------------------------------
  //  private helper to search db by entity's full name or partial name
  // --------------------------------------------------------------------
  _findByName(name, matchFuncName) {
    let result = false;
    for (let entity of this.map.values()) {
      if (entity[matchFuncName].bind(entity, name)()) {
        result = entity;
        break;
      }
    }
    return result;
  }

  hasId(id) { return this.findById(id) !== undefined; }

  hasNameFull(name) { return this.findByNameFull(name) !== false; }

  hasNamePartial(name) { return this.findByNamePartial(name) !== false; }

  size() { return this.map.size; }

}

module.exports = EntityDatabase;
