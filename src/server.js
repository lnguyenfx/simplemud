'use strict';

const port = 3000;

const net = require('net');

const cm = require('./ConnectionManager');
const telnet = require('./Telnet');
const Game = require('./Game');
const { playerDb, roomDb } = require('./Databases');

net.createServer((socket) => {
  cm.newConnection(socket, telnet);
}).listen(port);

console.log(`Listening on port ${port}`);

Game.setIsRunning(true);

setInterval(() => {
  playerDb.save();
  roomDb.saveData();
}, 5 * 60 * 1000); // auto-save every 5 minutes
