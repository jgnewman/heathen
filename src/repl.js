/*
 * Name: repl.js
 * Description: How we make the Heathen REPL work.
 */

module.exports = {

  /*
   * Put the whole thing in an immediate closure to keep the
   * global scope clean for the user.
   */
  "init" : (function (global) {

    var readline = require('readline'),
        rlInt    = readline.createInterface({
          "input"  : process.stdin,
          "output" : process.stdout
        }),

        /*
         * Set up some defaults for all of our init options.
         */
        defaults = {
          "prompt"      : "> ",
          "quit"        : /^\s*quit\(\)\s*\;*\s*$/,
          "preprocess"  : function (input)  { return input;  },
          "postprocess" : function (output) { return output; }
        };

    /*
     * The process of reading, evalling, printing, and looping.
     */
    function loop(skipBegin) {

      if (defaults.onbegin && !skipBegin) {
        defaults.onbegin();
      }

      rlInt.question(defaults.prompt, function (input) {

        /*
         * Exit process if we hit the quit pattern.
         */
        if (defaults.quit.test(input)) {
          rlInt.close();
          if (defaults.onquit) {
            defaults.onquit();
          }

        /*
         * Otherwise...
         */
        } else {
          
          /*
           * 1. Call the preprocess on the input.
           * 2. Evaluate the preprocessed input within the scope of a clean global.
           * 3. Call the postprocess on the output.
           * 4. Log the postprocessed output to the console.
           */
          console.log(
            defaults.postprocess(
              eval.call(global,
                defaults.preprocess(input)
              )
            )
          );

          /*
           * Keep going until we hit the quit pattern.
           */
          loop(true);
        }
      });
    }

    /*
     * Options:
     * prompt      -> the text to display as the repl prompt
     * quit        -> a regex that will cause the repl to exit when viewed ( defaults to quit() )
     * preprocess  -> a function to call on the input before evaluating
     * postprocess -> a function to call on the output after evaluating but before displaying
     * onbegin     -> a function to call when the repl starts up
     * onquit      -> a function to call when the repl quits
     *
     * Sets up REPL settings and begins the loop.
     */
    function init(options) {
      options = options || {};
      defaults.prompt      = options.prompt      || defaults.prompt;
      defaults.quit        = options.quit        || defaults.quit;
      defaults.preprocess  = options.preprocess  || defaults.preprocess;
      defaults.postprocess = options.postprocess || defaults.postprocess;
      defaults.onquit      = options.onquit      || null;
      defaults.onbegin     = options.onbegin     || null;
      loop();
    }

    return init;

  }(this))

};

