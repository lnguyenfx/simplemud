'use strict';

const net = require('net');

const cm = require('./ConnectionManager');
const telnet = require('./Telnet');

net.createServer((socket) => {
  cm.newConnection(socket, telnet);
}).listen(3000);
