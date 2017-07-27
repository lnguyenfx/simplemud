const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Util = require(path.join(__dirname, '..', 'src', 'Util'));

describe("Util", () => {

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

});
