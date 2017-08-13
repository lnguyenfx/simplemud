'use strict';

const port = parseInt(process.argv[2]) || 3000;

const net = require('net');

const cm = require('./ConnectionManager');
const telnet = require('./Telnet');
const GameLoop = require('./GameLoop');

net.createServer((socket) => {
  socket.on('error', err => console.log(err.stack));
  cm.newConnection(socket, telnet);
}).listen(port);

const gameLoop = new GameLoop();
setInterval(gameLoop.loop.bind(gameLoop), 1000);

console.log(`Listening on port ${port}`);
