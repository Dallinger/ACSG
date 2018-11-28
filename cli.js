/*global require, process */
var acsg_module = require('./acsg');
var fs = require('fs');
var filename = process.argv.slice(2)[0].trim();


console.log("Filename: " + filename);


var compressedData = JSON.parse(fs.readFileSync(filename, 'utf8'));

console.log("New compressedData: " + compressedData);

var decompressor = acsg_module(compressedData);

decompressor.run();

