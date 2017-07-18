'use strict';

// Base Handler class for all handlers to extend
class ConnectionHandler {

  constructor(connection) {
    this.connection = connection;
  }

  handle(data) {}

  enter() {}

  leave() {}

}

module.exports = ConnectionHandler;
