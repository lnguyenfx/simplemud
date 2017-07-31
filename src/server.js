'use strict';

const port = 3000;

const net = require('net');

const cm = require('./ConnectionManager');
const telnet = require('./Telnet');
const Game = require('./Game');

net.createServer((socket) => {
  cm.newConnection(socket, telnet);
}).listen(port);

Game.setIsRunning(true);

console.log(`Listening on port ${port}`);
