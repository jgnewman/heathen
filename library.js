/*
 * Name: library.js
 * Description: Library code to possibly be included in compiled output.
 */

module.exports = {

  "monadChain" : function (bind) {
    return {
      /*
       * Define the 'pass' function.
       * Where:
       * mval - the value to be passed along the monadic chain
       *      - should already be wrapped by return
       *
       * Returns an object with the method 'to' wherein you
       * can specify the functions that will become
       * members of the invocation chain.  Invoking 'to' will
       * initialize the monadic invocation chain.
       */
      "pass" : function (mval) {
        return {
          /*
           * Where:
           * arguments - functions that will be part of the monad call
           */
          "to" : function () {
            /*
             * Grab the functions and wrap our initial value from
             * .pass in the return function.
             */
            var functions = arguments,
                output = mval,
                len = functions.length,
                i;
            /*
             * Loop over each argument function.  For each one,
             * bind it to output then wrap that with return.
             */
            for (i = 0; i < len; i += 1) {
              output = bind(output, functions[i]);
            }
            /*
             * Finally, return the output.
             */
            return output;
          }
        };
      }
    };
  },

  /*
   * (&&= ($ 'selector') (fadeOut 'fast') (fadeIn 'slow'))
   * Since this is a special form, each argument needs to come in
   * wrapped in a function that returns the call.
   *
   * function () {return $('selector')}
   * function () {return this.fadeOut('fast')}
   * function () {return this.fadeIn('slow')}
   */
  "methodChain" : function () {
    var result = arguments[0](),
        len = arguments.length,
        i;
    /*
     * Make each call in the context of the last.
     */
    for (i = 1; i < len; i += 1) {
      result = arguments[i].call(result);
    }
    return result;
  },

  /*
   * Allows you to specify which arguments you are declaring with
   * bash style option flags.
   */
  "bashCall" : function (funcName, hash) {
    var argArray = [], i;
    for (i in hash) {
      if (Object.prototype.hasOwnProperty.call(hash, i)) {
        argArray[funcName._paramPositions[i]] = hash[i];
      }
    }
    return funcName.apply(null, argArray);
  }

}
