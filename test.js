

var compiler = require('./src/compiler'),
    fs = require('fs');

var code = fs.readFileSync('./raw.hn').toString();

var compiledCode = compiler.compile(code);

console.log(compiledCode);
