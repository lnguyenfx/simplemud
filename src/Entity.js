'use strict';

class Entity {

  constructor() {
    this.name = "UNDEFINED";
    this.id = 0;
  }

  compName() {
    return this.name.toLowerCase();
  }

  matchFull(str) {
    return this.compName() === str.toLowerCase();
  }

  // --------------------------------------------------------------------
  //  Performs a partial match on the name, where it will match the first
  //  n characters from this.name with a n-character-long string str.
  //  Case-insensitive.
  //  IE: "J", "j", "JO" all match "John".  "o", "ohn" will not.
  // --------------------------------------------------------------------
  matchPartial(str) {
    const name = this.compName();
    const search = str.toLowerCase();
    let pos = name.indexOf(search);
    // perform as many search passes as needed
    // for example, if the user types "st" when searching a "rusty stake",
    // only one pass would find the 'st' in "rusty", and determine that
    // there is no match. That's why more than one pass is needed.
    while(pos !== -1) {
        // match found at beginning, or match found at beginning of a word,
        // therefore, return true.
        if( pos === 0 || this.name[pos-1] === ' ' )
            return true;

        // perform another search, starting at where the last one left off
        pos = name.indexOf(search, pos + 1);
    }
    // no matches
    return false;
  }
}

module.exports = Entity;
