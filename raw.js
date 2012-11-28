/*
 * Code generated with Heathen 0.0.1.
 * https://github.com/jgnewman/heathen
 */

(function(_HN_global) {

    var HN, ret, bind, fn1, fn2, fn3;

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

    // Define a closure to house the ret function...
    ret = (function() {

        // Create the ret function that will be callable to the user...
        var _output = function ret(val) {
                return function() {
                    return val;
                }
            };

        // Create and store references to each parameter's name and position in the list...
        _output._paramPositions = {
            "val": 0
        };

        // Return the callable function...
        return _output;

    }());

    // Define a closure to house the bind function...
    bind = (function() {

        // Create the bind function that will be callable to the user...
        var _output = function bind(mval, fun) {
                return fun(mval());
            };

        // Create and store references to each parameter's name and position in the list...
        _output._paramPositions = {
            "mval": 0,
            "fun": 1
        };

        // Return the callable function...
        return _output;

    }());

    // Define a closure to house the fn1 function...
    fn1 = (function() {

        // Create the fn1 function that will be callable to the user...
        var _output = function fn1(x) {
                console.log(x);
                return ret((x + 1));
            };

        // Create and store references to each parameter's name and position in the list...
        _output._paramPositions = {
            "x": 0
        };

        // Return the callable function...
        return _output;

    }());

    // Define a closure to house the fn2 function...
    fn2 = (function() {

        // Create the fn2 function that will be callable to the user...
        var _output = function fn2(x) {
                console.log(x);
                return ret((x + 2));
            };

        // Create and store references to each parameter's name and position in the list...
        _output._paramPositions = {
            "x": 0
        };

        // Return the callable function...
        return _output;

    }());

    // Define a closure to house the fn3 function...
    fn3 = (function() {

        // Create the fn3 function that will be callable to the user...
        var _output = function fn3(x) {
                console.log(x);
                return ret((x + 3));
            };

        // Create and store references to each parameter's name and position in the list...
        _output._paramPositions = {
            "x": 0
        };

        // Return the callable function...
        return _output;

    }());

    HN.monadChain(bind).pass(ret(0)).to(fn1, fn2, fn3);


}(this));