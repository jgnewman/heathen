/*
 * Name: compiler.js
 * Description: Initializes the process from raw to compiled.
 */

var lexer  = require('./lexer'),
    parser = require('./parser');

/*
 * Run the lexer, run the parser, run the compile techniques.
 */
module.exports = {
  "compile" : function (rawCode, modulize) {
    var lexed     = lexer.lex(rawCode),
        parseTree = parser.parse(lexed);
    return parseTree.compile(modulize);
  }
};
