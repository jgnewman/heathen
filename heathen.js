/*
 * Name: heathen.js
 * Description: JavaScript API for calling Heathen
 */

var fs       = require('fs'),
    compiler = require('./src/compiler'),
    minify   = require('minifyjs');


/*
 * Options:
 * .code     - raw code
 * .input    - an input file
 * .output   - an output file
 * .minify   - boolean
 * .modulize - boolean (if false, code will not be wrapped in a module. otherwise, ignore this.)
 */
module.exports = {
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
  }
}
