const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Util = require(path.join(__dirname, '..', 'src', 'Util'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));


describe("Util", () => {

  let name = telnet.cc('bold');
  console.log(String.raw`${name}`);

  it("should properly execute tostring()", () => {
    const tostring = Util.tostring;
    let expectedStr = "test";
    expect(tostring("test")).to.equal(expectedStr);
    expect(tostring("test", 2)).to.equal(expectedStr);
    expectedStr = "test      ";
    expect(tostring("test", 10)).to.equal(expectedStr);
  });

  it("should properly execute wrap()", () => {
    const text = "\u001b[37m\u001b[1mThis is a test\n";
    const expectedText =
      "\u001b[37m\u001b[1mThis\r\nis a\r\ntest\r\n";
    expect(Util.wrap(text, 5)).to.
      equal(expectedText);
  });

  it("should properly execute randomInt()", () => {
    const randomInt = Util.randomInt;
    let min = 15, max = 95;
    for (let i = 0; i < 100; i++) {
      expect(randomInt(min, max)).to.be.within(min, max);
    }
  });

  it("should properly execute parseWord()", () => {
    const parse = Util.parseWord;
    let str = "this is a test";
    expect(parse(str, 0)).to.equal("this");
    expect(parse(str, 2)).to.equal("a");
    str = "     this   is  also              a test   ";
    expect(parse(str)).to.equal("this");
    expect(parse(str, 4)).to.equal("test");
    expect(parse(str, 10)).to.equal("");
    expect(parse("blah ", 1)).to.equal("");
  });

  it("should properly execute removeWord()", () => {
    const remove = Util.removeWord;
    let str = "this is a test";
    expect(remove(str, 2)).to.equal("this is test");
    expect(remove(str)).to.equal("is a test");
    str = "     this   is  also              a test   ";
    expect(remove(str, 1)).to.equal("this also a test");
    expect(remove(str, 3)).to.equal("this is also test");
    expect(remove('', 10)).to.equal('');
  });

  it("should properly execute timeStamp()", () => {
    const timeStamp = Util.timeStamp;
    const date = new Date();
    const h = date.getHours();
    const m = date.getMinutes()
    const s = date.getSeconds();
    const expectedStr =
      (h < 10 ? '0' + h : h) + ':' +
      (m < 10 ? '0' + m : m) + ':' +
      (s < 10 ? '0' + s : s);
    expect(timeStamp()).to.equal(expectedStr);
  });

  it("should properly execute dateStamp()", () => {
    const dateStamp = Util.dateStamp;
    const date = new Date();
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const expectedStr = y + '.' +
      (m < 10 ? '0' + m : m) + '.' +
      (d < 10 ? '0' + d : d);
    expect(dateStamp()).to.equal(expectedStr);
  });

  it("should properly execute upTime()", () => {
    const upTime = Util.upTime;
    const secNum =
      (365 * 86400 + 2 * 86400 + 3 * 3600 + 4 * 60 + 5);
    const expectedStr =
      "1 year, 2 days, 3 hours, 4 minutes";
    expect(upTime(secNum)).to.equal(expectedStr);
    expect(upTime()).to.equal("0 minute");
  });

  it("should properly execute getTimeMS()", () => {
    const ms = new Date().getTime();
    expect(Util.getTimeMS()).to.be.within(ms - 3, ms + 3);
  });

  it("should properly execute seconds()", () => {
    const ms = 5 * 1000;
    expect(Util.seconds(5)).to.equal(ms);
  });

  it("should properly execute minutes()", () => {
    const ms = 15 * 60000;
    expect(Util.minutes(15)).to.equal(ms);
  });

  it("should properly create timer", () => {
    const timer = Util.createTimer().init();
    const now = Util.getTimeMS();
    const seconds = Util.seconds;
    timer.reset();
    expect(timer.getMS()).to.be.within(0, 1);
    timer.reset(seconds(5));
    expect(timer.getMS()).to.be.
      within(seconds(5), seconds(5) + 1);
  })


});
