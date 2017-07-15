const net = require('net');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const cc = telnet.cc;

describe("Telnet", () => {
  it('should correctly translates for single line', () => {
    const text = "This is <bold><cyan>cyan</cyan></bold>.<newline/>";
    const parsedText = telnet.translate(text);
    const expectedText = "This is " + cc('bold') + cc('cyan') + "cyan" +
                         cc('reset') + cc('bold') + cc('reset') +
                         '.' + cc('newline');
    expect(parsedText).to.equal(expectedText);
  });

  it('should correctly translates for multiple lines', () => {
    const text = "This is <yellow>yellow</yellow>.\n" +
                 "This is <bold><blue>blue and bold</blue></bold>.\r\n"  +
                 "This is <green>green</green>.\n" +
                 "This is <invalid code> and </should> not <be/> translated.\n";

    const parsedText = telnet.translate(text);
    const expectedText = "This is " + cc('yellow') + "yellow" + cc('reset') +
                         "." + cc('newline') +
                         "This is " + cc('bold') + cc('blue') +
                         "blue and bold" + cc('reset') + cc('bold') +
                         cc('reset') + '.' + cc('newline') +
                         "This is " + cc('green') + "green" + cc('reset')
                         + '.' + cc('newline') +
                         "This is <invalid code> and </should> " +
                         "not <be/> translated." + cc('newline');

    expect(parsedText).to.equal(expectedText);
  });

});
