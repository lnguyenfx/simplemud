'use strict';

class Util {

  static tostring(str, width = 0) {
    str = str.toString();
    if (str.length >= width) return str;
    return str + Array(width - str.length + 1).join(' ');
    //return str.toString().padEnd(width); // node 6.4.0 doens't have padEnd()
  }

  static wrap(str, width = 85) {
    return wrapText(str, width) // wrapText is defined below this class
      .replace(/([^\r])\n/g, '$1\r\n');
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

  // returns current time in milliseconds
  static getTimeMS() {
    return Date.now();
  }

  // convert x seconds into milliseconds
  static seconds(sec) {
    return sec * 1000;
  }

  // convert x minutes into milliseconds
  static minutes(min) {
    return min * 60000;
  }

  static createTimer() {
    return {
      init: function() {
        this.startTime = 0;
        this.initTime = 0;
        return this;
      },
      reset: function(timePassed = 0) {
        this.startTime = timePassed;
        this.initTime = Util.getTimeMS();
      },
      getMS: function() {
        // return the amount of time that has elapsed since the timer
        // was initialized, plus whatever starting time the timer was given.
        return (Util.getTimeMS() - this.initTime) + this.startTime;
      }
    }
  }

}

module.exports = Util;

const stringWidth = require('string-width');

// modified version of
// https://www.npmjs.com/package/wordwrap
const wrapText = (text, width) => {

  var start = 0;
  var stop = width;

  var chunks = text.toString()
    .split(/(\S+\s+)/)
    .reduce(function (acc, x) {
      acc.push(x)
      return acc;
    }, []
  );

  return chunks.reduce((lines, rawChunk) => {
    if (rawChunk === '') return lines;

    var chunk = rawChunk.replace(/\t/g, '    ');
    var i = lines.length - 1;
    if (stringWidth(lines[i]) + stringWidth(chunk) > stop) {
      lines[i] = lines[i].replace(/\s+$/, '');

      chunk.split(/\n/).forEach(function (c) {
        lines.push(
          new Array(start + 1).join(' ')
          + c.replace(/^\s+/, '')
        );
      });
    }
    else if (chunk.match(/\n/)) {
      var xs = chunk.split(/\n/);
      lines[i] += xs.shift();
      xs.forEach(function (c) {
        lines.push(
          new Array(start + 1).join(' ')
          + c.replace(/^\s+/, '')
        );
      });
    }
    else {
      lines[i] += chunk;
    }

    return lines;
  }, [ new Array(start + 1).join(' ') ]).join('\n');
};
