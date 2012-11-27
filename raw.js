/*
 * Code generated with Heathen 0.0.1.
 * https://github.com/jgnewman/heathen
 */

(function(_HN_global) {

    var HN;

    /*
     * Library code...
     */
    HN = _HN_global.HN || {};
    HN.atoms = HN.atoms || {};

    HN.monadChain = HN.monadChain || (function() {
        return function(bind) {
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
                "pass": function(mval) {
                    return {
                        /*
                         * Where:
                         * arguments - functions that will be part of the monad call
                         */
                        "to": function() {
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
        };
    }());


    /*
     * Begin user-defined code...
     */
    HN.monadChain(bind).pass(4).to(fn_1, fn_2, fn_3);


}(this));