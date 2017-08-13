'use strict';

const ansi = require('sty');
const { wrap } = require('./Util');

const Telnet = {
  translate: (data) => {
    return wrap(ansi.parse(data));
  },
  cc: (code) => cc[code]
};

module.exports = Telnet;

// Telnet control codes
const cc = {
  reset: "\x1B[0m",
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  under: "\x1B[4m",
  reverse: "\x1B[7m",
  hide: "\x1B[8m",

  clearscreen: "\x1B[2J",
  clearline: "\x1B[2K",

  black: "\x1B[30m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m",

  bblack: "\x1B[40m",
  bred: "\x1B[41m",
  bgreen: "\x1B[42m",
  byellow: "\x1B[43m",
  bblue: "\x1B[44m",
  bmagenta: "\x1B[45m",
  bcyan: "\x1B[46m",
  bwhite: "\x1B[47m",

  newline: "\r\n"
};
