/*global require, process */
var acsg = require('./acsg');
var fs = require('fs');
var filename = process.argv.slice(2)[0].trim();


console.log("Filename: " + filename);


var compressedData = JSON.parse(fs.readFileSync(filename, 'utf8'));
compressedData.config.IS_CLI = true
console.log("New compressedData: " + compressedData);

var decompressor = acsg.Game(compressedData);

decompressor.run(function () {
  decompressor.exportFullGameData()
});
