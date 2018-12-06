/*global require, process */
var acsg = require('./acsg');
var fs = require('fs');

var inputfile = process.argv.slice(2)[0].trim();
var outputfile = ''
console.log("Reading in " + inputfile + '.');

var compressedData = JSON.parse(fs.readFileSync(inputfile, 'utf8'));
compressedData.config.IS_CLI = true

var decompressor = acsg.Game(compressedData);

console.log("Running game and rebuilding state data...")
decompressor.run(function () {
  outputfile = decompressor.exportFullGameData()
});
console.log("Success! Exported to data/" + outputfile)
