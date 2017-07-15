'use strict';

const { playerDb } = require('./Databases');
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
      if (data.toLowerCase() === 'new') {
        this.state = NEWUSER;
        const msg = "<yellow>Please enter your desired name: </yellow>"
        this.connection.sendMessage(msg);
      } else { // existing user
        const player = playerDb.findByNameFull(data);
        let msg;
        if (!player) {
          this.numErrors++;
          msg = "<red><bold>Sorry, the user '<white>" +
                data + "</white>' does not exist" +
                "<newline/>Please enter your name, or " +
                "\"new\" if you are new: </bold></red>";
        } else {
          this.state = ENTERPASS;
          this.name = data;
          this.password = player.password;
          msg = "<green><bold>Welcome, " +
                "<white>" + data + "</white><newline/>" +
                "Please enter your password: </bold></green>";
        }
        this.connection.sendMessage(msg);
      }
      return;
    }

    if (this.state === NEWUSER) {
      return;
    }


  }

  _handleMaxErrors() {
    this.connection.sendMessage("Too many incorrect reponses, closing connection...");
    this.connection.closeConnection();
  }

}

module.exports = Logon;
