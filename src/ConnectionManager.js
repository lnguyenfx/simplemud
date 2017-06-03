'use strict';

const ConnectionManager = (() => {

  const cm = {};
  const connections = [];

  cm.getConnection = (index) => {
      return connections[index];
  };

  cm.newConnection = (socket, protocols) => {
    socket.on('close', () => cm.removeConnection(socket));
    protocols.map(p => socket.on('data', data => p.translate(data)));
    connections.push(socket);
  };

  cm.closeConnection = (socket) => {
    socket.end();
  };

  cm.removeConnection = (socket) => {
    const index = connections.indexOf(socket)
    if (index !== -1) connections.splice(index, 1);
  };

  cm.totalConnections = () => {
    return connections.length;
  };

  return cm;

})();

module.exports = ConnectionManager;
