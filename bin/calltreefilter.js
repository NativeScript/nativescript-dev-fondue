#! /usr/bin/env node

var PREFIX = " CALLTREE: ";
var readline = require('readline');
var rl = readline.createInterface({ input: process.stdin });
var fs = require("fs");
var file = process.argv.length >= 3 ? process.argv[2] : "log.js";
var stream = fs.createWriteStream(file);

var lastPrintIsTrace = false;
rl.on('line', function(line) {
    var index = line.indexOf(PREFIX);
    if (index >= 0) {
        if (!lastPrintIsTrace) {
            console.log("CALLTREE: (redirected)");
            lastPrintIsTrace = true;
        }
        stream.write(line.substr(index + PREFIX.length) + "\n");
    } else {
        if (lastPrintIsTrace) {
            process.stdout.write("!\n");
        }
        lastPrintIsTrace = false;
        process.stdout.write(line + "\n");
    }
});
