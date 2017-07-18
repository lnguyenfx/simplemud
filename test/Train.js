const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Train = require(path.join(__dirname, '..', 'src', 'Train'));

describe("Train", () => {
  const conn = new Connection(new net.Socket(), telnet);
});
