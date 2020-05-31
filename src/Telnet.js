'use strict';

const HtmlParser = require("htmlparser2");
const Tree = require("tree");
const { wrap } = require('./Util');

const Telnet = {
  translate: (data) => {
    const sourceText = sanitize(data);
    initParser();
    parser.parseComplete(sourceText);
    return wrap(unsanitize(parsedText));
  },
  cc: (code) => cc[code]
};

module.exports = Telnet;

let parsedText, root, openNode, depth;

const initParser = () => {
  parsedText = '';
  root = new Tree.Root();
  openNode = null;
  depth = 0;
}

const isValidCode= (code) => {
  return cc.hasOwnProperty(code);
};

const getCodeNum = (code) => {
  if (!isValidCode(code)) return false;
  const match = cc[code].match(/.+\[(\d+)[A-z]/);
  const codeNum = match ? parseInt(match[1]) : false;
  return codeNum;
};

const isForeColor = (code) => {
  const codeNum = getCodeNum(code);
  return codeNum && codeNum >= 30 && codeNum <= 37;
};

const isBackColor = (code) => {
  const codeNum = getCodeNum(code);
  return codeNum && codeNum >= 40 && codeNum <= 47;
};

const isSelfClosing = (code) => {
  return !isForeColor(code) && !isBackColor(code) && code !== 'bold';
}

const TelnetParser = {
  onopentag: function(tag, attribs){
    parsedText += cc[tag];
    if (isSelfClosing(tag)) return;
    const node = new Tree.Node(null, tag);
    if (depth === 0) {
      root.branch.append(node);
    } else {
      openNode.children.append(node);
      node.parent = openNode;
    }
    openNode = node;
    depth++;
  },
  ontext: function(text){
    parsedText += text;
  },
  onclosetag: function(tag){
    if (isSelfClosing(tag)) return;
    depth--;
    parsedText += cc['reset'];
    openNode = openNode.parent;
    if (depth !== 0 && openNode) {
      parsedText += cc[openNode.data];
      const isForeColorMatch = (node1, node2) =>
        isForeColor(node1.data) && isForeColor(node2.data);
      const isBackColorMatch = (node1, node2) =>
        isBackColor(node1.data) && isBackColor(node2.data);
      let node = openNode.parent;
      while(node) {
        if (!(isForeColorMatch(openNode, node) ||
             isBackColorMatch(openNode, node))) {
          parsedText += cc[node.data];
        }
        node = node.parent;
      }
    }
  }
};

const sanitize = (text) => { // sanitize invalid codes
  let result = text.replace(/\r?\n/g, "<newline/>");
  const matches = text.match(/<\/?([\w'\/\s]+)\/?>/g); // looking for <code>, </code>, and <code/>
  if (matches instanceof Array) {
    matches.forEach(code => {
      const strippedCode = code.replace(/[<\/>]/g, '');
      let replacement = code;
      if (!isValidCode(strippedCode)) {
        replacement = code.replace(/</g, '&#60;');
        replacement = replacement.replace(/>/g, '&#62;');
      }
      result = result.replace(code, replacement);
    });
  }
  return result;
}

const unsanitize = (text) => {
  let result = text.replace(/&#60;/g, '<');
  result = result.replace(/&#62;/g, '>');
  return result;
}

const parser = new HtmlParser.Parser(TelnetParser);

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
