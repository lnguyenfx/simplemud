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
    const result = str.trim().replace(/\s{2,}/g, ' ').split(' ')[index];
    return result || '';
  }

  static removeWord(str, index = 0) {
    const strs = str.trim().replace(/\s{2,}/g, ' ').split(' ');
    return strs.filter((str, i) => index !== i).join(' ');
  }

  static timeStamp() {
    const date = new Date();

    let hour = date.getHours();
    hour = (hour < 10 ? '0' : '') + hour;

    let min  = date.getMinutes();
    min = (min < 10 ? '0' : '') + min;

    let sec  = date.getSeconds();
    sec = (sec < 10 ? '0' : '') + sec;

    return hour + ':' + min + ':' + sec;
  }

  static dateStamp() {
    const date = new Date();

    let year = date.getFullYear();

    let month = date.getMonth() + 1;
    month = (month < 10 ? '0' : '') + month;

    let day  = date.getDate();
    day = (day < 10 ? '0' : '') + day;

    return year + '.' + month + '.' + day;
  }

  static upTime(secNum) {
    secNum = secNum || process.uptime();

    const min = Math.floor(secNum / 60) % 60;
    const hour = Math.floor(secNum / 3600) % 24;
    const day = Math.floor(secNum / 86400) % 365;
    const year = Math.floor(secNum / (365 * 86400));

    const strYear = "year" + (year > 1 ? 's' : '');
    const strDay = "day" + (day > 1 ? 's' : '');
    const strHour = "hour" + (hour > 1 ? 's' : '');
    const strMin = "minute" + (min > 1 ? 's' : '');

    return (year > 0 ? year + ` ${strYear}, ` : '') +
      (day > 0 ? day + ` ${strDay}, ` : '') +
      (hour > 0 ? hour + ` ${strHour}, ` : '') +
      min + ` ${strMin}`;
  }

}

module.exports = Util;
