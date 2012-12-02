/*
 * Name: heathen.js
 * Description: JavaScript API for calling Heathen
 */

var fs       = require('fs'),
    rc       = require('./src/repl'),
    compiler = require('./src/compiler'),
    minify   = require('minifyjs');


module.exports = {

  "version" : compiler.version,

  /*
   * Options:
   * .code     - raw code
   * .input    - an input file
   * .output   - an output file
   * .minify   - boolean
   * .modulize - boolean (if false, code will not be wrapped in a module. otherwise, ignore this.)
   */
  "compile" : function (options) {
    var rawCode      = options.code || (options.input ? fs.readFileSync(options.input).toString() : ''),
        compiledCode = compiler.compile(rawCode, options.modulize);

    function finish(err, code) {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      if (!options.output) {
        if (options.callback && typeof options.callback === 'function') {
          return options.callback(code);
        }
        return code;
      } else {
        fs.writeFile(options.output, code, function (err) {
          if (options.callback && typeof options.callback === 'function') {
            return options.callback(err);
          }
        });
      }
    }

    if (options.modulize === false) {
      return compiledCode;
    } else if (options.minify !== true) {
      minify.beautify(compiledCode, {}, finish);
    } else {
      minify.minify(compiledCode, {"engine" : "yui"}, finish);
    }
  },

  /*
   * onquit - function; what to do when the repl quits.
   */
  "repl" : function (onquit) {
    var that = this;
    rc.init({
      "prompt"  : "user=> ",
      "quit"    : /^\s*\(\s*quit\s*\)\s*$/,
      "onbegin" : function () {
        console.log('Heathen ' + that.version);
      },
      "preprocess" : function (userInput) {
        return that.compile({"code" : userInput, "modulize" : false});
      },
      "onquit" : onquit
    });
  }
}
