'use strict';

const ConnectionHandler = require('./ConnectionHandler');

// Acceptable states
const NEWCONNECTION = "NEWCONNECTION";
const NEWUSER = "NEWUSER";
const ENTERNEWPASS = "ENTERNEWPASS";
const ENTERPASS = "ENTERPASS";

const MAX_NUM_ERRORS = 5; // max invalid password entries before disconnect

// Logon Handler class
class Logon extends ConnectionHandler {

  constructor(connection) {
    super();
    this.connection = connection;
    this.state = NEWCONNECTION;
    this.numErrors = 0;// how many times an invalid answer has been entered
    this.name = null;
    this.pass = null;
  }

  enter() {
    const welcomeMsg = "<bold><red>Weclome to SimpleMUD</red></bold>\n" +
                       "Please enter your name, or \"new\" if you are new: ";
    this.connection.sendMessage(welcomeMsg);
  }

  handle(data) {
    if (this.numErrors === MAX_NUM_ERRORS) {
      this._handleMaxErrors();
      return;
    }

    if (this.state === NEWCONNECTION) {
      this.connection.sendMessage(data); // echo back as test
    }
  }


  _handleMaxErrors() {
    this.connection.sendMessage("Too many incorrect reponses, closing connection...");
    this.connection.closeConnection();
  }

}

module.exports = Logon;
