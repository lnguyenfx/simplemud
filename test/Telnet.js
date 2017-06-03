const net = require('net');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));

describe("Telnet", () => {
  it('should correctly translate for single line', () => {
    const text = "This is <bold><cyan>cyan</cyan></bold>.<newline/>";
    const parsedText = telnet.translate(text);
    expect(parsedText).to.equal("This is \x1B[1m\x1B[36mcyan\x1B[0m\x1B[0m.\r\n\x1B[0m");
  });

  it('should correctly translate for multiple lines', () => {
    const text = "This is <yellow>yellow</yellow>.\n" +
                 "This is <bold><blue>blue and bold</blue></bold>.\n" +
                 "This is <green>green</green>.\n";
    const parsedText = telnet.translate(text);
    const expectedText = "This is \x1B[33myellow\x1B[0m.\r\n\x1B[0m" +
                         "This is \x1B[1m\x1B[34mblue and bold\x1B[0m\x1B[0m.\r\n\x1B[0m" +
                         "This is \x1B[32mgreen\x1B[0m.\r\n\x1B[0m";
    expect(parsedText).to.equal(expectedText);
  });

});
