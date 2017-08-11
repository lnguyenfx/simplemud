'use strict';

const port = parseInt(process.argv[2]) || 3000;

const net = require('net');

const cm = require('./ConnectionManager');
const telnet = require('./Telnet');
const GameLoop = require('./GameLoop');

net.createServer((socket) => {
  cm.newConnection(socket, telnet);
}).listen(port);

const gameLoop = new GameLoop();
setInterval(gameLoop.loop.bind(gameLoop), 250);

console.log(`Listening on port ${port}`);
