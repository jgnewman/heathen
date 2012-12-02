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
        },
        builder = '',
        openers = 0,
        closers = 0,
        prompt1,
        prompt2;


    /*
     * Define what to do any time a new line is detected.
     */
    rlInt.on('line', function (line) {
      var clean, openMatches, closeMatches;

      /*
       * Quit if we see the quit pattern.
       */
      if (defaults.quit.test(line)) {
        rlInt.close();
        if (defaults.onquit) {
          defaults.onquit();
        }
      }

      /*
       * Rip out strings, comments, and regex so we can count parentheses.
       */
      clean = line.replace(/\;\*[\.]*\*\;/g, '')
                  .replace(/\;[\.]*$/g, '')
                  .replace(/\/([^\s\/]|\\[\s\/])+\/(gim|gmi|mig|mgi|igm|img|gi|ig|gm|mg|mi|im|g|i|m)?\//g, '')
                  .replace(/\"([^"\n]|\\["\n])*\"|\'([^'\n]|\\['\n])*\'/g, '');
      openMatches  = clean.match(/[\(\[\{]/g);
      closeMatches = clean.match(/[\)\]\}]/g);

      /*
       * Augment input accumulators as necessary.
       */
      if (openMatches) {
        openers += openMatches.length;
      }
      if (closeMatches) {
        closers += closeMatches.length;
      }
      builder += (line + ' ');

      if (openers === closers) {
        /*
         * 1. Call the preprocess on the input.
         * 2. Evaluate the preprocessed input within the scope of a clean global.
         * 3. Call the postprocess on the output.
         * 4. Log the postprocessed output to the console.
         */
        console.log(
          defaults.postprocess(
            eval.call(global,
              defaults.preprocess(builder)
            )
          )
        );

        /*
         * Reset the input accumulators.
         */
        openers = 0;
        closers = 0;
        builder = '';

        /*
         * Wait for more input.
         */
        rlInt.setPrompt(prompt1);
        rlInt.prompt();
      
      } else if (closers > openers) {
        console.error('Woops!  Too many closers and not enough openers.  Try that again.');

        /*
         * Reset the input accumulators.
         */
        openers = 0;
        closers = 0;
        builder = '';

        /*
         * Wait for more input.
         */
        rlInt.setPrompt(prompt1);
        rlInt.prompt();
      
      } else {

        /*
         * Keep accumulating data.
         */
        rlInt.setPrompt(prompt2);
        rlInt.prompt();
      }
    });

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

      prompt1 = defaults.prompt;
      prompt2 = prompt1 + '... ';
      
      /*
       * Run the onbegin method.
       */
      if (defaults.onbegin) {
        defaults.onbegin();
      }

      /*
       * Set the prompt and run the REPL.
       */
      rlInt.setPrompt(prompt1);
      rlInt.prompt();
    }

    return init;

  }(this))

};

