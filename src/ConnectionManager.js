'use strict';

const Connection = require('./Connection');

const ConnectionManager = (() => {

  const cm = {};
  const connections = [];

  cm.getConnection = (index) => {
      return connections[index];
  };

  cm.newConnection = (socket, protocol) => {
    socket.on('close', () => cm.removeConnection(socket));
    connections.push(new Connection(socket, protocol));
  };

  cm.closeConnection = (socket) => {
    const conn = cm.findConnection(socket);
    conn.socket.end();
  };

  cm.removeConnection = (socket) => {
    const conn = cm.findConnection(socket);
    const index = connections.indexOf(conn)
    if (index !== -1) connections.splice(index, 1);
  };

  cm.totalConnections = () => {
    return connections.length;
  };

  cm.findConnection = (socket) => {
    const conn = connections.filter(conn => conn.socket === socket);
    return conn.length ? conn[0] : 0;
  }

  return cm;

})();

module.exports = ConnectionManager;
