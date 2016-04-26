#! /usr/bin/env node

var glob = require("glob");
var fondue = require("fondue");
var fs = require("fs");
var chalk = require("chalk");
var readline = require("readline");

// Bail out __extends traces
var extendsRegex = /^(\s*)__tracer\s*\.\s*traceFunCall\s*\(\s*\{\s*func\:\s*__extends\s*,\s*nodeId:\s*"[^"]*"\s*,\s*vars:\s*\{\s*\}\s*\}\s*\)\s*\(\s*([^\s\,]*)\s*,\s*_super\s*\)\s*;?$/mg;

var matchPattern = process.argv.length >= 3 ? process.argv[2] : "log.js";

process.stdout.write("Instrumenting files: " + matchPattern + "\n");

// TODO: Get from config:
var files = glob.sync(matchPattern, { nodir: true });
if (files.length === 0) {
    process.stdout.write("Instrumenting files: " + matchPattern + "\n");
}
files.forEach(function (file, index, files) {
    process.stdout.write(" - " + file + "\n");
    process.stdout.write(chalk.bold("(" + (index + 1) + "/" + files.length + ")"));
    var originalCode = fs.readFileSync(file).toString();
    var instrumentedCode = fondue.instrument(originalCode, {
        path: file,
        include_prefix: false,
        tracer_name: "__tracer",
        nodejs: false,
        maxInvocationsPerTick: Number.MAX_VALUE,
        tnrow_parse_errors: false
    }).toString();
    var instrumentedWithoutExtend = instrumentedCode.replace(extendsRegex, function(match, p1, p2) {
        process.stdout.write("\r                    \r     __extends: " + p2 + "\n" + chalk.bold("(" + (index + 1) + "/" + files.length + ")"));
        return p1 + "__extends(" + p2 + ", _super)";
    });
    fs.writeFileSync(file, instrumentedWithoutExtend);
    process.stdout.write("\r                    \r");
});
