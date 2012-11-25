

var lexer  = require('./lexer'),
    parser = require('./parser'),
    fs = require('fs');

var code = fs.readFileSync('./raw.hn').toString();

var lexedCode = lexer.lex(code);

//console.log(lexedCode.code);

var parsedCode = parser.parse(lexedCode.code, lexedCode.strings, lexedCode.regexes);

console.log(parsedCode);
