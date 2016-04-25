#! /usr/bin/env node

var glob = require("glob");
var fondue = require("fondue");
var fs = require("fs");
var chalk = require("chalk");
var readline = require("readline");

// Bail out __extends traces
var pattern = /^(\s*)__tracer\s*\.\s*traceFunCall\s*\(\s*\{\s*func\:\s*__extends\s*,\s*nodeId:\s*"[^"]*"\s*,\s*vars:\s*\{\s*\}\s*\}\s*\)\s*\(\s*([^\s\,]*)\s*,\s*_super\s*\)\s*;?$/mg;

// TODO: Get from config:
var files = glob.sync("node_modules/tns-core-modules/**/*.js", { nodir: true });

files.forEach(function (file, index, files) {
    process.stdout.write(" - " + file + "\n");
    process.stdout.write(chalk.bold("(" + (index + 1) + "/" + files.length + ")"));
    var originalCode = fs.readFileSync(file).toString();
    var instrumentedCode = fondue.instrument(originalCode, {
        path: file,
        include_prefix: false,
        tracer_name: "__tracer",
        nodejs: true, // I have no idea what this will alter in fondue...
        maxInvocationsPerTick: 4096,
        tnrow_parse_errors: false
    }).toString();
    var instrumentedWithoutExtend = instrumentedCode.replace(pattern, function(match, p1, p2) {
        process.stdout.write("\r                    \r     __extends: " + p2 + "\n" + chalk.bold("(" + (index + 1) + "/" + files.length + ")"));
        return p1 + "__extends(" + p2 + ", _super)";
    });
    fs.writeFileSync(file, instrumentedWithoutExtend);
    process.stdout.write("\r                    \r");
});
