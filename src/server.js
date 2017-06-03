'use strict';

const net = require('net');

net.createServer((socket) => {
  socket.on('close', () => console.log('closed'));
}).listen(3000);
