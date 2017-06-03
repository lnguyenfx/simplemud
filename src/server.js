'use strict';

const net = require('net');

const cm = require('./ConnectionManager');
const telnet = require('./Telnet');

net.createServer((socket) => {
  cm.newConnection(socket, [telnet]);
  socket.write(telnet.translate("<bold><byellow>Yellow!</byellow></bold>\n"));
  socket.write("<EOM>\n");
}).listen(3000);
