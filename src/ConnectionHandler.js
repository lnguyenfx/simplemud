'use strict';

// Base Handler class for all handlers to extend
class ConnectionHandler {

  constructor(connection) {
    this.connection = connection;
  }

  handle(data) {}

  enter() {}

  leave() {}

  hungup() {}

}

module.exports = ConnectionHandler;
