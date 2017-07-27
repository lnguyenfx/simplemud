'use strict';

class Util {

  static tostring(str, width = 0) {
    str = str.toString();
    if (str.length >= width) return str;
    return str + Array(width - str.length + 1).join(' ');
  }

  static randomInt(min, max) {
    return Math.floor(
      Math.random() * (max - min + 1)) + min;
  }

  static parseWord(str, index) {
    let wss = str.search(/^\s/g);
    while (index > 0) {
      index--;
      // find the beginning of the next word, by finding whitespace
      // to end the current word, and then non-whitespace at the start
      // of the next word
      wss = str.substr(wss, str.length).search(/^\s/g);
      wss = str.substr(wss, str.length).search(/^\s/g);
    }
  }

}

module.exports = Util;
