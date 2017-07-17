const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));

describe("Game", () => {
  const conn = new Connection(new net.Socket(), telnet);
});
