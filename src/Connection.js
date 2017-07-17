'use strict';

var buffer = '';

class Connection {

  constructor(socket, protocol) {
    this.socket = socket;
    this.protocol = protocol;
    this.handlers = []; // handler methods: handle, enter, leave
    this._bindEvents();
  }

  addHandler(handler) {
    if (this._handler()) this._handler().leave();
    this.handlers.unshift(handler);
    this._handler().enter();
  }

  removeHandler() {
    if (this._handler()) this._handler().leave();
    this.handlers.shift();
    if (this._handler()) this._handler().enter();
  }

  sendMessage(msg) {
    this.socket.write(this.protocol.translate(msg));
  }

  clearHandlers() {
    if (this._handler()) this._handler().leave();
    this.handlers = [];
  }

  close() {
    this.socket.end();
  }

  _handler() {
    return this.handlers.length ? this.handlers[0] : 0;
  }

  _bindEvents() {
    this.socket.on('data', this._receivedData.bind(this));
    this.socket.on('close', this._connectionClosed.bind(this));
  }

  _receivedData(data) {
    buffer += data.toString();
    if (buffer.match(/\n/)) {
      this._handler().handle(buffer.replace(/[\r\n]*$/,''));
      buffer = '';
    }
  }

  _connectionClosed() {
    this.clearHandlers();
  }

}

module.exports = Connection;
