'use strict';

class Connection {

  constructor(socket, protocol) {
    this.socket = socket;
    this.protocol = protocol;
    this.handlers = []; // handler methods: handle, enter, leave
    this._bindEvents();
    this.isClosed = false;
    this.buffer = '';
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
    try {
      this.socket.write(this.protocol.translate(msg));
    } catch(err) {
      this.close();
    }
  }

  clearHandlers() {
    if (this._handler()) this._handler().leave();
    this.handlers = [];
  }

  close() {
    this.isClosed = true;
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
    // Fix for Putty Telnet client
    if (data.includes(Buffer.from('fffb1f', 'hex')))
      return;

    // Fix for Microsoft Telnet client
    const dataStr = data.toString();
    if (!this.buffer.length && dataStr.match(/[\b]/)) {
      this.socket.write(' ');
    }
    this.buffer += (dataStr.match(/[\b]/) ? '' : dataStr);
    if (this.buffer.length && dataStr !== ' \b' && dataStr.match(/[\b]/)) {
      this.buffer = this.buffer.substr(0, this.buffer.length - 1);
      this.socket.write(' \b');
    }

    if (this.buffer.match(/\n/)) {
      this._handler().handle(this.buffer.replace(/[\r\n]*$/,''));
      this.buffer = '';
    }
  }

  _connectionClosed() {
    if (!this.isClosed && this._handler()) this._handler().hungup();
    this.clearHandlers();
    this.isClosed = true;
  }

}

module.exports = Connection;
