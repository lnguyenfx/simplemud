# SimpleMUD

As its name implies, SimpleMUD is a NodeJS implementation of a rudimentary
MUD server. It is intended to be used as a learning experience for those who
has never programmed a MUD server before.

The original codebase for SimpleMUD was written in C++ by Ron Penton, the
author of _MUD Game Programming_ book.

## Demo

  WebTelnet: http://smud.ourmmo.com

  Telnet: smud.ourmmo.com 3000

## Highlights

* Physical data (Items, Players, Rooms, Enemy Templates) are stored in JSON files
* Dynamic game data (Timers, Enemies, Room's Loots) are also stored in JSON files
* Every major functionality is fully unit-tested (189 total test cases)
* Total lines of code for implementation is 2265
* Total lines of code for unit tests is 3032  

## Requirements

* Node.js >= v6.4.0

## To Run Server

    $ git clone https://github.com/lnguyenfx/simplemud.git
    $ cd simplemud
    $ npm install
    $ npm start <port>

## To Run Client

    $ telnet localhost <port>

## To Execute Tests

All tests:

    $ npm test

Individual test:

    $npm test "test/<ClassName>.js"

## Special Thanks

Ron Penton for the original SimpleMUD C++ codebase.

Shawn Biddle for [RanvierMUD](http://ranviermud.com), which is a source of
inspirations.

Raymond Xie for the [WebTelnet](https://github.com/mudchina/webtelnet) that is
used as the Demo.

## License

Copyright (c) 2017, Long Nguyen <lnguyenfx@gmail.com>

Licensed under the [MIT License](../master/LICENSE.txt)
