'use strict';

const Connection = require('./Connection');
const Logon = require('./Logon');

const ConnectionManager = (() => {

  const cm = {};
  const connections = [];

  cm.getConnection = (index) => {
      return connections[index];
  };

  cm.newConnection = (socket, protocol, handler) => {
    const conn = new Connection(socket, protocol);
    const defaultHandler = handler || new Logon(conn);
    conn.addHandler(defaultHandler);
    connections.push(conn);
    socket.on('close', () => cm.removeConnection(socket));
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
