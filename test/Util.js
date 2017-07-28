const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Util = require(path.join(__dirname, '..', 'src', 'Util'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));


describe("Util", () => {

  let name = telnet.cc('bold');
  console.log(String.raw`${name}`);

  it("should properly executes tostring()", () => {
    const tostring = Util.tostring;
    let expectedStr = "test";
    expect(tostring("test")).to.equal(expectedStr);
    expect(tostring("test", 2)).to.equal(expectedStr);
    expectedStr = "test      ";
    expect(tostring("test", 10)).to.equal(expectedStr);
  });

  it("should properly executes randomInt()", () => {
    const randomInt = Util.randomInt;
    let min = 15, max = 95;
    for (let i = 0; i < 100; i++) {
      expect(randomInt(min, max)).to.be.within(min, max);
    }
  });

  it("should properly executes parseWord()", () => {
    const parse = Util.parseWord;
    let str = "this is a test";
    expect(parse(str, 0)).to.equal("this");
    expect(parse(str, 2)).to.equal("a");
    str = "     this   is  also              a test   ";
    expect(parse(str)).to.equal("this");
    expect(parse(str, 4)).to.equal("test");
  });

  it("should properly executes removeWord()", () => {
    const remove = Util.removeWord;
    let str = "this is a test";
    expect(remove(str, 2)).to.equal("this is test");
    expect(remove(str)).to.equal("is a test");
    str = "     this   is  also              a test   ";
    expect(remove(str, 1)).to.equal("this also a test");
    expect(remove(str, 3)).to.equal("this is also test");
  });

});
