'use strict';

class Util {

  static tostring(str, width = 0) {
    // str = str.toString();
    // if (str.length >= width) return str;
    // return str + Array(width - str.length + 1).join(' ');
    return str.toString().padEnd(width);
  }

  static randomInt(min, max) {
    return Math.floor(
      Math.random() * (max - min + 1)) + min;
  }

  static parseWord(str, index = 0) {
    return str.trim().replace(/\s{2,}/g, ' ').split(' ')[index];
  }

  static removeWord(str, index = 0) {
    const strs = str.trim().replace(/\s{2,}/g, ' ').split(' ');
    return strs.filter((str, i) => index !== i).join(' ');
  }

}

module.exports = Util;
