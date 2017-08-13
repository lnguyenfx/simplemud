const net = require('net');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const cc = telnet.cc;

describe("Telnet", () => {
  it('should properly translate for single line', () => {
    const text = "This is <bold><cyan>cyan</cyan></bold>.\r\n";
    const parsedText = telnet.translate(text);
    const expectedText = "This is " +
      "\u001b[0m\u001b[1m\u001b[0m\u001b[1m\u001b[36m" +
      "cyan" + "\u001b[0m\u001b[1m\u001b[0m.\r\n\u001b[0m";
    expect(parsedText).to.equal(expectedText);
  });

  it('should properly translate for multiple lines', () => {
    const text = "This is <yellow>yellow</yellow>.\n" +
                 "This is <bold><blue>blue and bold</blue></bold>.\r\n"  +
                 "This is <green>green</green>.\n" +
                 "This is <invalid code> and </should> not <be/> translated.\n";

    const parsedText = telnet.translate(text);
    const expectedText =
      "This is \u001b[0m\u001b[33myellow\u001b[0m.\r\n" +
      "This is \u001b[0m\u001b[1m\u001b[0m\u001b[1m\u001b[34m" +
      "blue and bold\u001b[0m\u001b[1m\u001b[0m.\r\n" +
      "This is \u001b[0m\u001b[32mgreen\u001b[0m.\r\n" +
      "This is <invalid code> and </should> not <be/> " +
      "translated.\r\n\u001b[0m";

    expect(parsedText).to.equal(expectedText);
  });

});
